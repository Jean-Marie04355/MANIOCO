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

  it('should call findOne', async () => {
    storageProviderMock.findOne.mockResolvedValue({
      id: '1',
      filename: 'test.png',
      path: 'path',
      mimetype: 'image/png',
      size: 100,
    });
    const result = await service.findOne('1');
    expect(result.id).toEqual('1');
    expect(storageProviderMock.findOne).toHaveBeenCalledWith('1');
  });

  it('should call create', async () => {
    const data = {
      filename: 'test.png',
      path: 'path',
      mimetype: 'image/png',
      size: 100,
    };
    storageProviderMock.create.mockResolvedValue({ id: '1', ...data });
    const result = await service.create(data);
    expect(result.id).toBe('1');
    expect(storageProviderMock.create).toHaveBeenCalledWith(data);
  });

  it('should call update', async () => {
    const data = { filename: 'updated.png' };
    storageProviderMock.update.mockResolvedValue({
      id: '1',
      filename: 'updated.png',
      path: 'path',
      mimetype: 'image/png',
      size: 100,
    });
    const result = await service.update('1', data as any);
    expect(result.filename).toBe('updated.png');
    expect(storageProviderMock.update).toHaveBeenCalledWith('1', data);
  });

  it('should call upload', async () => {
    storageProviderMock.upload.mockResolvedValue('url');
    const result = await service.upload({});
    expect(result).toBe('url');
    expect(storageProviderMock.upload).toHaveBeenCalled();
  });

  it('should throw if upload not supported', async () => {
    const serviceNoUpload = new FilesService({} as any);
    await expect(serviceNoUpload.upload({})).rejects.toThrow(
      'Upload not supported',
    );
  });

  it('should call remove', async () => {
    storageProviderMock.delete.mockResolvedValue(true);
    const result = await service.remove('1');
    expect(result).toBe(true);
    expect(storageProviderMock.delete).toHaveBeenCalledWith('1');
  });
});
