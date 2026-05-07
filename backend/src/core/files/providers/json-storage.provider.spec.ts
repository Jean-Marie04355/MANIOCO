import { Test, TestingModule } from '@nestjs/testing';
import { JsonStorageProvider } from './json-storage.provider';
import { S3StorageService } from '../../../libs/storage/s3-storage.service';
import * as fs from 'node:fs';

jest.mock('node:fs');

describe('JsonStorageProvider', () => {
  let provider: JsonStorageProvider;
  let s3ServiceMock: any;

  const mockData = [
    {
      id: '1',
      filename: 'test.png',
      path: 'p',
      mimetype: 'image/png',
      size: 100,
    },
  ];

  beforeEach(async () => {
    s3ServiceMock = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JsonStorageProvider,
        { provide: S3StorageService, useValue: s3ServiceMock },
      ],
    }).compile();

    provider = module.get<JsonStorageProvider>(JsonStorageProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should call upload', async () => {
    process.env.STORAGE_TYPE = 's3';
    s3ServiceMock.uploadFile.mockResolvedValue('url');
    const result = await provider.upload({ buffer: Buffer.from('test') } as any);
    expect(result).toBe('url');
  });

  it('should findAll', async () => {
    const result = await provider.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should findOne - found', async () => {
    const result = await provider.findOne('1');
    expect(result!.id).toBe('1');
  });

  it('should findOne - not found', async () => {
    const result = await provider.findOne('999');
    expect(result).toBeNull();
  });

  it('should create a new item', async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));
    const dto = {
      filename: 'new.png',
      path: 'p',
      mimetype: 'image/png',
      size: 200,
    };
    const result = await provider.create(dto);
    expect(result.id).toBeDefined();
    expect(result.filename).toBe('new.png');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('should update an item', async () => {
    const result = await provider.update('1', { filename: 'updated.png' });
    expect(result!.filename).toBe('updated.png');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('should return null if item not found on update', async () => {
    const result = await provider.update('999', { filename: 'x.png' });
    expect(result).toBeNull();
  });

  it('should delete an item', async () => {
    const result = await provider.delete('1');
    expect(result).toBe(true);
    expect(s3ServiceMock.deleteFile).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('should return false if item not found on delete', async () => {
    const result = await provider.delete('999');
    expect(result).toBe(false);
    expect(s3ServiceMock.deleteFile).not.toHaveBeenCalled();
  });

  it('should create data directory if it does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    // Re-instantiate to trigger constructor
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JsonStorageProvider,
        { provide: S3StorageService, useValue: s3ServiceMock },
      ],
    }).compile();
    const p = module.get<JsonStorageProvider>(JsonStorageProvider);
    expect(p).toBeDefined();
    expect(fs.mkdirSync).toHaveBeenCalled();
  });
});
