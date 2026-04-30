import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(data: {
    adminName: string;
    adminEmail: string;
    action: AuditAction;
    details: string;
    targetId?: string;
    ipAddress?: string;
  }) {
    const log = this.auditRepository.create(data);
    return this.auditRepository.save(log);
  }

  async findAll() {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getStats() {
    // Récupérer les actions des 7 derniers jours
    const rawData = await this.auditRepository
      .createQueryBuilder('log')
      .select('DATE(log.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt > :date', {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return rawData.map((d) => ({
      date: d.date,
      count: parseInt(d.count, 10),
    }));
  }
}
