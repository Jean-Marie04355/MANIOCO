import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(reporterId: string, createReportDto: CreateReportDto): Promise<Report> {
    const report = this.reportRepository.create({
      ...createReportDto,
      reporterId,
    });
    return this.reportRepository.save(report);
  }

  async findAll(): Promise<any[]> {
    const reports = await this.reportRepository.find({
      relations: ['reporter', 'seller', 'store', 'order'],
      order: { createdAt: 'DESC' },
    });

    // On ajoute le compte de signalements par vendeur pour l'admin
    const enhancedReports = await Promise.all(
      reports.map(async (report) => {
        const sellerReportCount = await this.reportRepository.count({
          where: { sellerId: report.sellerId },
        });
        return {
          ...report,
          sellerReportCount,
        };
      }),
    );

    return enhancedReports;
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'seller', 'store', 'order'],
    });

    if (!report) {
      throw new NotFoundException(`Signalement avec l'ID ${id} non trouvé`);
    }

    return report;
  }

  async update(id: string, updateReportDto: UpdateReportDto): Promise<Report> {
    const report = await this.findOne(id);
    
    if (updateReportDto.status) {
      report.status = updateReportDto.status;
    }
    
    if (updateReportDto.internalNote !== undefined) {
      report.internalNote = updateReportDto.internalNote;
    }

    return this.reportRepository.save(report);
  }

  async getStats() {
    const total = await this.reportRepository.count();
    const pending = await this.reportRepository.count({ where: { status: ReportStatus.NEW } });
    const investigating = await this.reportRepository.count({ where: { status: ReportStatus.INVESTIGATING } });
    const resolved = await this.reportRepository.count({ where: { status: ReportStatus.RESOLVED } });
    
    return {
      total,
      pending,
      investigating,
      resolved,
    };
  }
}
