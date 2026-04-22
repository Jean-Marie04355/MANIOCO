import { Test, TestingModule } from '@nestjs/testing';
import { MongoStorageProvider } from './mongo-storage.provider';
import { getModelToken } from '@nestjs/mongoose';
import { File } from '../schemas/file.schema';
import { S3StorageService } from '../../../libs/storage/s3-storage.service';

describe('MongoStorageProvider', () => {
  let provider: MongoStorageProvider;
  let fileModelMock: any;
  let s3ServiceMock: any;

  beforeEach(async () => {
    fileModelMock = jest.fn().mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue({ _id: '1', ...data }),
    }));
    (fileModelMock as any).find = jest.fn().mockReturnValue({ exec: jest.fn() });
    (fileModelMock as any).findById = jest.fn().mockReturnValue({ exec: jest.fn() });
    (fileModelMock as any).findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn() });
    (fileModelMock as any).findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn() });

    s3ServiceMock = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoStorageProvider,
        { provide: getModelToken(File.name), useValue: fileModelMock },
        { provide: S3StorageService, useValue: s3ServiceMock },
      ],
    }).compile();

    provider = module.get<MongoStorageProvider>(MongoStorageProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should upload', async () => {
    s3ServiceMock.uploadFile.mockResolvedValue('url');
    const result = await provider.upload({} as any);
    expect(result).toBe('url');
  });

  it('should findAll', async () => {
    const list = [{ _id: '1', filename: 't.png', path: 'p', mimetype: 'm', size: 10 }];
    (fileModelMock.find().exec as jest.Mock).mockResolvedValue(list);
    const result = await provider.findAll();
    expect(result[0].id).toBe('1');
  });

  it('should findOne', async () => {
    const doc = { _id: '1', filename: 't.png', path: 'p', mimetype: 'm', size: 10 };
    (fileModelMock.findById().exec as jest.Mock).mockResolvedValue(doc);
    const result = await provider.findOne('1');
    expect(result!.id).toBe('1');
  });

  it('should create', async () => {
    const dto = { filename: 't.png', path: 'p', mimetype: 'm', size: 10 };
    const result = await provider.create(dto);
    expect(result.id).toBe('1');
  });

  it('should update', async () => {
    const doc = { _id: '1', filename: 'u.png', path: 'p', mimetype: 'm', size: 10 };
    (fileModelMock.findByIdAndUpdate().exec as jest.Mock).mockResolvedValue(doc);
    const result = await provider.update('1', { filename: 'u.png' });
    expect(result!.filename).toBe('u.png');
  });

  it('should delete', async () => {
    const doc = { _id: '1', path: 'p' };
    (fileModelMock.findById().exec as jest.Mock).mockResolvedValue(doc);
    (fileModelMock.findByIdAndDelete().exec as jest.Mock).mockResolvedValue(doc);
    const result = await provider.delete('1');
    expect(result).toBe(true);
    expect(s3ServiceMock.deleteFile).toHaveBeenCalledWith('p');
  });

  it('should return false if delete not found', async () => {
    (fileModelMock.findById().exec as jest.Mock).mockResolvedValue(null);
    (fileModelMock.findByIdAndDelete().exec as jest.Mock).mockResolvedValue(null);
    const result = await provider.delete('123');
    expect(result).toBe(false);
  });
});
