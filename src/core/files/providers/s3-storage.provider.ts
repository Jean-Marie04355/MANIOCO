import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { IFileStorage } from '../interfaces/file-storage.interface';
import { FileEntity } from '../entities/file.entity';
import { CreateFileDto, UpdateFileDto, FileResponse } from '../dto/file.dto';

@Injectable()
export class S3StorageProvider implements IFileStorage {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {
    this.endpoint = this.configService.get<string>('S3_ENDPOINT', 'http://127.0.0.1:3900');
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME', 'nextcloud-bucket');

    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.error('S3 credentials are missing in environment variables');
    }

    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION', 'garage'),
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
      forcePathStyle: true, // Necessary for Garage/Minio
    });
  }

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
    const key = `${Date.now()}-${file.originalname}`;
    
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      // Return the public URL for the file
      return `${this.endpoint}/${this.bucketName}/${key}`;
    } catch (error) {
      this.logger.error(`Error uploading to S3: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<FileResponse[]> {
    const list = await this.fileRepository.find();
    return list.map(entity => this.mapToFileResponse(entity) as FileResponse);
  }

  async findOne(id: string): Promise<FileResponse | null> {
    const entity = await this.fileRepository.findOne({ where: { id } });
    return this.mapToFileResponse(entity);
  }

  async create(data: CreateFileDto): Promise<FileResponse> {
    const newFile = this.fileRepository.create(data as Partial<FileEntity>);
    const saved = await this.fileRepository.save(newFile);
    return this.mapToFileResponse(saved) as FileResponse;
  }

  async update(id: string, data: Partial<UpdateFileDto>): Promise<FileResponse | null> {
    await this.fileRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) return false;

    try {
      // Extract key from path (URL)
      const key = file.path.split('/').pop();
      if (key) {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }),
        );
      }

      const result = await this.fileRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      this.logger.error(`Error deleting from S3: ${error.message}`);
      return false;
    }
  }
}
