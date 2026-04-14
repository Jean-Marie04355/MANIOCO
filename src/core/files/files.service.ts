import { Injectable, Inject } from '@nestjs/common';
import type { IFileStorage } from './interfaces/file-storage.interface';
import { CreateFileDto, UpdateFileDto, FileResponse } from './dto/file.dto';

@Injectable()
export class FilesService {
  constructor(
    @Inject('FILE_STORAGE_PROVIDER')
    private readonly storageProvider: IFileStorage,
  ) {}

  async findAll(): Promise<FileResponse[]> {
    return this.storageProvider.findAll();
  }

  async findOne(id: string): Promise<FileResponse | null> {
    return this.storageProvider.findOne(id);
  }

  async create(data: CreateFileDto): Promise<FileResponse> {
    return this.storageProvider.create(data);
  }

  async update(
    id: string,
    data: Partial<UpdateFileDto>,
  ): Promise<FileResponse | null> {
    return this.storageProvider.update(id, data);
  }

  async upload(file: any): Promise<string> {
    if (this.storageProvider.upload) {
      return this.storageProvider.upload(file);
    }
    throw new Error('Upload not supported by the current storage provider');
  }

  async remove(id: string): Promise<boolean> {
    return this.storageProvider.delete(id);
  }
}
