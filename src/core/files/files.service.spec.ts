import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;
  let storageProviderMock: any;

  beforeEach(async () => {
    storageProviderMock = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: 'FILE_STORAGE_PROVIDER', useValue: storageProviderMock },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should call findAll', async () => {
    storageProviderMock.findAll.mockResolvedValue([]);
    await service.findAll();
    expect(storageProviderMock.findAll).toHaveBeenCalled();
  });

  it('should call upload', async () => {
    storageProviderMock.upload.mockResolvedValue('url');
    const result = await service.upload({});
    expect(result).toBe('url');
    expect(storageProviderMock.upload).toHaveBeenCalled();
  });

  it('should throw if upload not supported', async () => {
    const serviceNoUpload = new FilesService({} as any);
    await expect(serviceNoUpload.upload({})).rejects.toThrow('Upload not supported');
  });
});
