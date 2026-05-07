import { Test, TestingModule } from '@nestjs/testing';
import { PostgresStorageProvider } from './postgres-storage.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileEntity } from '../entities/file.entity';
import { S3StorageService } from '../../../libs/storage/s3-storage.service';

describe('PostgresStorageProvider', () => {
  let provider: PostgresStorageProvider;
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
        PostgresStorageProvider,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: fileRepositoryMock,
        },
        { provide: S3StorageService, useValue: s3ServiceMock },
      ],
    }).compile();

    provider = module.get<PostgresStorageProvider>(PostgresStorageProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should upload', async () => {
    process.env.STORAGE_TYPE = 's3';
    s3ServiceMock.uploadFile.mockResolvedValue('url');
    const result = await provider.upload({ buffer: Buffer.from('test') } as any);
    expect(result).toBe('url');
  });

  it('should findAll', async () => {
    fileRepositoryMock.find.mockResolvedValue([
      { id: '1', filename: 'f.png', path: 'p', mimetype: 'm', size: 1 },
    ]);
    const result = await provider.findAll();
    expect(result[0].id).toBe('1');
  });

  it('should findOne', async () => {
    fileRepositoryMock.findOne.mockResolvedValue({
      id: '1',
      filename: 'f.png',
      path: 'p',
      mimetype: 'm',
      size: 1,
    });
    const result = await provider.findOne('1');
    expect(result!.id).toBe('1');
  });

  it('should return null on findOne if not found', async () => {
    fileRepositoryMock.findOne.mockResolvedValue(null);
    const result = await provider.findOne('999');
    expect(result).toBeNull();
  });

  it('should create', async () => {
    const dto = { filename: 'f.png', path: 'p', mimetype: 'm', size: 1 };
    fileRepositoryMock.create.mockReturnValue(dto);
    fileRepositoryMock.save.mockResolvedValue({ id: '1', ...dto });
    const result = await provider.create(dto);
    expect(result.id).toBe('1');
  });

  it('should update', async () => {
    fileRepositoryMock.findOne.mockResolvedValue({
      id: '1',
      filename: 'u.png',
      path: 'p',
      mimetype: 'm',
      size: 1,
    });
    const result = await provider.update('1', { filename: 'u.png' });
    expect(result!.filename).toBe('u.png');
    expect(fileRepositoryMock.update).toHaveBeenCalledWith('1', {
      filename: 'u.png',
    });
  });

  it('should delete and call s3', async () => {
    fileRepositoryMock.findOne.mockResolvedValue({
      id: '1',
      path: 'some/path',
    });
    fileRepositoryMock.delete.mockResolvedValue({ affected: 1 });
    const result = await provider.delete('1');
    expect(result).toBe(true);
    expect(s3ServiceMock.deleteFile).toHaveBeenCalledWith('some/path');
  });

  it('should return false if delete affected 0', async () => {
    fileRepositoryMock.findOne.mockResolvedValue(null);
    fileRepositoryMock.delete.mockResolvedValue({ affected: 0 });
    const result = await provider.delete('999');
    expect(result).toBe(false);
    expect(s3ServiceMock.deleteFile).not.toHaveBeenCalled();
  });
});
