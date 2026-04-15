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
      get: jest.fn().mockImplementation((key, defaultValue) => defaultValue || 'test-value'),
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
          throw { name: 'NotFound' };
        }
        return Promise.resolve({});
      });

      const file = { buffer: Buffer.from('test'), originalname: 'test.txt', mimetype: 'text/plain' };
      const url = await service.uploadFile(file);
      expect(url).toContain('test.txt');
      expect(s3ClientMock.send).toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      s3ClientMock.send.mockResolvedValue({});
      await service.deleteFile('some-url/test.txt');
      expect(s3ClientMock.send).toHaveBeenCalled();
    });
  });

  describe('listAllObjects', () => {
    it('should return list of keys', async () => {
      s3ClientMock.send.mockResolvedValue({
        Contents: [{ Key: 'k1' }, { Key: 'k2' }]
      });
      const list = await service.listAllObjects();
      expect(list).toEqual(['k1', 'k2']);
    });
  });
});
