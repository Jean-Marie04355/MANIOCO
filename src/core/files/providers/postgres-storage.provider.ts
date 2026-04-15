import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IFileStorage } from '../interfaces/file-storage.interface';
import { FileEntity } from '../entities/file.entity';
import { CreateFileDto, UpdateFileDto, FileResponse } from '../dto/file.dto';
import { S3StorageService } from '../../../libs/storage/s3-storage.service';

@Injectable()
export class PostgresStorageProvider implements IFileStorage {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly s3Service: S3StorageService,
  ) {}

  private mapToFileResponse(entity: FileEntity | null): FileResponse | null {
    if (!entity) return null;
    return {
      id: entity.id,
      filename: entity.filename,
      path: entity.path,
      mimetype: entity.mimetype,
      size: entity.size,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async upload(file: Express.Multer.File): Promise<string> {
    return this.s3Service.uploadFile(file);
  }

  async findAll(): Promise<FileResponse[]> {
    const list = await this.fileRepository.find();
    return list.map((entity) => this.mapToFileResponse(entity));
  }

  async findOne(id: string): Promise<FileResponse | null> {
    const entity = await this.fileRepository.findOne({ where: { id } });
    return this.mapToFileResponse(entity);
  }

  async create(data: CreateFileDto): Promise<FileResponse> {
    const newFile = this.fileRepository.create(data as Partial<FileEntity>);
    const saved = await this.fileRepository.save(newFile);
    return this.mapToFileResponse(saved);
  }

  async update(
    id: string,
    data: Partial<UpdateFileDto>,
  ): Promise<FileResponse | null> {
    await this.fileRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (file) {
      await this.s3Service.deleteFile(file.path);
    }
    const result = await this.fileRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
