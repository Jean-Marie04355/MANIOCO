import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import { IFileStorage } from '../interfaces/file-storage.interface';
import { CreateFileDto, UpdateFileDto, FileResponse } from '../dto/file.dto';
import { S3StorageService } from '../../../libs/storage/s3-storage.service';

@Injectable()
export class JsonStorageProvider implements IFileStorage {
  private readonly logger = new Logger(JsonStorageProvider.name);

  constructor(private readonly s3Service: S3StorageService) {
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync('data')) {
      fs.mkdirSync('data', { recursive: true });
    }
    if (!fs.existsSync('data/files.json')) {
      fs.writeFileSync('data/files.json', JSON.stringify([], null, 2));
    }
  }

  private readData(): FileResponse[] {
    const rawData = fs.readFileSync('data/files.json', 'utf8');
    return JSON.parse(rawData);
  }

  private writeData(data: FileResponse[]) {
    fs.writeFileSync('data/files.json', JSON.stringify(data, null, 2));
  }

  async upload(file: Express.Multer.File): Promise<string> {
    return this.s3Service.uploadFile(file);
  }

  async findAll(): Promise<FileResponse[]> {
    return this.readData();
  }

  async findOne(id: string): Promise<FileResponse | null> {
    const data = this.readData();
    const result = data.find((item) => item.id === id);
    return result ? result : null;
  }

  async create(item: CreateFileDto): Promise<FileResponse> {
    const data = this.readData();
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    data.push(newItem as any);
    this.writeData(data);
    return newItem as any;
  }

  async update(
    id: string,
    item: Partial<UpdateFileDto>,
  ): Promise<FileResponse | null> {
    const data = this.readData();
    const index = data.findIndex((i) => i.id === id);
    if (index === -1) return null;

    data[index] = { ...data[index], ...item, updatedAt: new Date() };
    this.writeData(data);
    return data[index];
  }

  async delete(id: string): Promise<boolean> {
    const data = this.readData();
    const file = data.find((item) => item.id === id);
    if (file) {
      await this.s3Service.deleteFile(file.path);
    }
    const filteredData = data.filter((item) => item.id !== id);
    if (data.length === filteredData.length) return false;

    this.writeData(filteredData);
    return true;
  }
}
