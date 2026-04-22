import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IFileStorage } from '../interfaces/file-storage.interface';
import { File, FileDocument } from '../schemas/file.schema';
import { CreateFileDto, UpdateFileDto, FileResponse } from '../dto/file.dto';
import { S3StorageService } from '../../../libs/storage/s3-storage.service';

@Injectable()
export class MongoStorageProvider implements IFileStorage {
  constructor(
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    private readonly s3Service: S3StorageService,
  ) {}

  private mapToFileResponse(doc: FileDocument | null): FileResponse | null {
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      filename: String(doc.filename),
      path: String(doc.path),
      mimetype: String(doc.mimetype),
      size: Number(doc.size),
    };
  }

  async upload(file: Express.Multer.File): Promise<string> {
    return this.s3Service.uploadFile(file);
  }

  async findAll(): Promise<FileResponse[]> {
    const docs = await this.fileModel.find().exec();
    return docs.map((doc) => this.mapToFileResponse(doc));
  }

  async findOne(id: string): Promise<FileResponse | null> {
    const doc = await this.fileModel.findById(id).exec();
    return this.mapToFileResponse(doc);
  }

  async create(data: CreateFileDto): Promise<FileResponse> {
    const createdFile = new this.fileModel(data);
    const doc = await createdFile.save();
    return this.mapToFileResponse(doc);
  }

  async update(
    id: string,
    data: Partial<UpdateFileDto>,
  ): Promise<FileResponse | null> {
    const doc = await this.fileModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    return this.mapToFileResponse(doc);
  }

  async delete(id: string): Promise<boolean> {
    const file = await this.fileModel.findById(id).exec();
    if (file) {
      await this.s3Service.deleteFile(file.path);
    }
    const result = await this.fileModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
