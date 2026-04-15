import { Test, TestingModule } from '@nestjs/testing';
import { S3StorageProvider } from './s3-storage.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileEntity } from '../entities/file.entity';
import { S3StorageService } from '../../../libs/storage/s3-storage.service';

describe('S3StorageProvider', () => {
  let provider: S3StorageProvider;
  let fileRepositoryMock: any;
  let s3ServiceMock: any;

  beforeEach(async () => {
    fileRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    s3ServiceMock = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3StorageProvider,
        { provide: getRepositoryToken(FileEntity), useValue: fileRepositoryMock },
        { provide: S3StorageService, useValue: s3ServiceMock },
      ],
    }).compile();

    provider = module.get<S3StorageProvider>(S3StorageProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should call upload on s3Service', async () => {
    s3ServiceMock.uploadFile.mockResolvedValue('url');
    const result = await provider.upload({} as any);
    expect(result).toBe('url');
    expect(s3ServiceMock.uploadFile).toHaveBeenCalled();
  });

  it('should findAll', async () => {
    const list = [{ id: '1', filename: 'test.png' }];
    fileRepositoryMock.find.mockResolvedValue(list);
    const result = await provider.findAll();
    expect(result[0].id).toBe('1');
  });

  it('should findOne', async () => {
    const file = { id: '1', filename: 'test.png' };
    fileRepositoryMock.findOne.mockResolvedValue(file);
    const result = await provider.findOne('1');
    expect(result!.id).toBe('1');
  });

  it('should return null if findOne not found', async () => {
    fileRepositoryMock.findOne.mockResolvedValue(null);
    const result = await provider.findOne('1');
    expect(result).toBeNull();
  });

  it('should create a file', async () => {
    const dto = { filename: 'test.png', path: 'path', mimetype: 'image/png', size: 100 };
    fileRepositoryMock.create.mockReturnValue(dto);
    fileRepositoryMock.save.mockResolvedValue({ id: '1', ...dto });
    const result = await provider.create(dto);
    expect(result.id).toBe('1');
  });

  it('should update a file', async () => {
    const dto = { filename: 'updated.png' };
    fileRepositoryMock.findOne.mockResolvedValue({ id: '1', ...dto });
    const result = await provider.update('1', dto);
    expect(result!.filename).toBe('updated.png');
    expect(fileRepositoryMock.update).toHaveBeenCalledWith('1', dto);
  });

  it('should delete a file and call s3Service', async () => {
    const file = { id: '1', path: 'path/to/s3' };
    fileRepositoryMock.findOne.mockResolvedValue(file);
    fileRepositoryMock.delete.mockResolvedValue({ affected: 1 });
    const result = await provider.delete('1');
    expect(result).toBe(true);
    expect(s3ServiceMock.deleteFile).toHaveBeenCalledWith('path/to/s3');
  });

  it('should return false if delete fails', async () => {
    fileRepositoryMock.findOne.mockResolvedValue(null);
    fileRepositoryMock.delete.mockResolvedValue({ affected: 0 });
    const result = await provider.delete('1');
    expect(result).toBe(false);
    expect(s3ServiceMock.deleteFile).not.toHaveBeenCalled();
  });
});
