import { Test, TestingModule } from '@nestjs/testing';
import { S3StorageService } from './s3-storage.service';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');

describe('S3StorageService', () => {
  let service: S3StorageService;
  let configServiceMock: any;
  let s3ClientMock: any;

  beforeEach(async () => {
    configServiceMock = {
      get: jest
        .fn()
        .mockImplementation(
          (key, defaultValue) => defaultValue || 'test-value',
        ),
      getOrThrow: jest.fn().mockImplementation((key) => 'test-value'),
    };

    s3ClientMock = {
      send: jest.fn(),
    };
    (S3Client as jest.Mock).mockReturnValue(s3ClientMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3StorageService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<S3StorageService>(S3StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file and return URL', async () => {
      s3ClientMock.send.mockImplementation((command) => {
        if (command.constructor.name === 'HeadObjectCommand') {
          throw { name: 'NotFound', $metadata: { httpStatusCode: 404 } };
        }
        return Promise.resolve({});
      });

      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
      };
      const url = await service.uploadFile(file);
      expect(url).toContain('test.txt');
      expect(s3ClientMock.send).toHaveBeenCalled();
    });

    it('should return URL if file already exists', async () => {
      s3ClientMock.send.mockImplementation((command) => {
        if (command.constructor.name === 'HeadObjectCommand') {
          return Promise.resolve({});
        }
        return Promise.resolve({});
      });

      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
      };
      const url = await service.uploadFile(file);
      expect(url).toContain('test.txt');
    });

    it('should throw error if HeadObject fails with non-404 error', async () => {
      s3ClientMock.send.mockImplementation((command) => {
        if (command.constructor.name === 'HeadObjectCommand') {
          throw new Error('S3 Error');
        }
        return Promise.resolve({});
      });

      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
      };
      await expect(service.uploadFile(file)).rejects.toThrow(
        'Error uploading file',
      );
    });

    it('should throw error if PutObject fails', async () => {
      s3ClientMock.send.mockImplementation((command) => {
        if (command.constructor.name === 'HeadObjectCommand') {
          throw { name: 'NotFound', $metadata: { httpStatusCode: 404 } };
        }
        if (command.constructor.name === 'PutObjectCommand') {
          throw new Error('Upload Error');
        }
        return Promise.resolve({});
      });

      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
      };
      await expect(service.uploadFile(file)).rejects.toThrow(
        'Error uploading file',
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      s3ClientMock.send.mockResolvedValue({});
      await service.deleteFile('some-url/test.txt');
      expect(s3ClientMock.send).toHaveBeenCalled();
    });

    it('should throw error if delete fails', async () => {
      s3ClientMock.send.mockRejectedValue(new Error('Delete Error'));
      await expect(service.deleteFile('test.txt')).rejects.toThrow(
        'Error deleting file',
      );
    });
  });

  describe('deleteMultipleFiles', () => {
    it('should delete multiple files', async () => {
      s3ClientMock.send.mockResolvedValue({});
      await service.deleteMultipleFiles(['f1.txt', 'f2.txt']);
      expect(s3ClientMock.send).toHaveBeenCalled();
    });

    it('should throw error if multiple delete fails', async () => {
      s3ClientMock.send.mockRejectedValue(new Error('Delete Error'));
      await expect(service.deleteMultipleFiles(['f1.txt'])).rejects.toThrow(
        'Error deleting files',
      );
    });
  });

  describe('updateFile', () => {
    it('should update a file', async () => {
      s3ClientMock.send.mockResolvedValue({});
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
      };
      await service.updateFile(file, 'old.txt');
      expect(s3ClientMock.send).toHaveBeenCalled();
    });
  });

  describe('listAllObjects', () => {
    it('should return list of keys', async () => {
      s3ClientMock.send.mockResolvedValue({
        Contents: [{ Key: 'k1' }, { Key: 'k2' }],
      });
      const list = await service.listAllObjects();
      expect(list).toEqual(['k1', 'k2']);
    });

    it('should return empty list if no contents', async () => {
      s3ClientMock.send.mockResolvedValue({});
      const list = await service.listAllObjects();
      expect(list).toEqual([]);
    });

    it('should throw error if listing fails', async () => {
      s3ClientMock.send.mockRejectedValue(new Error('List Error'));
      await expect(service.listAllObjects()).rejects.toThrow(
        'Error listing objects',
      );
    });
  });

  it('should generate a URL', async () => {
    const url = await service.presignedGetObject('test.txt');
    expect(url).toContain('test.txt');
    expect(url).toContain('afrigari-bucket'); // default bucket name
  });
});
