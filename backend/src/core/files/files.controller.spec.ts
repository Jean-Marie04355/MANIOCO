import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      upload: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: FilesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  describe('uploadFile', () => {
    it('should upload and create metadata', async () => {
      const file = { originalname: 'test.jpg', mimetype: 'image/jpeg', size: 100 } as any;
      serviceMock.upload.mockResolvedValue('http://s3/test.jpg');
      serviceMock.create.mockResolvedValue({ id: '1' });

      const result = await controller.uploadFile(file);
      expect(result).toEqual({ id: '1' });
      expect(serviceMock.upload).toHaveBeenCalledWith(file);
      expect(serviceMock.create).toHaveBeenCalledWith(expect.objectContaining({ filename: 'test.jpg' }));
    });
  });

  describe('findAll/findOne/remove', () => {
    it('should call findAll', async () => {
      serviceMock.findAll.mockResolvedValue([]);
      await controller.findAll();
      expect(serviceMock.findAll).toHaveBeenCalled();
    });

    it('should call findOne', async () => {
      serviceMock.findOne.mockResolvedValue({ id: '1' });
      await controller.findOne('1');
      expect(serviceMock.findOne).toHaveBeenCalledWith('1');
    });

    it('should call remove', async () => {
      serviceMock.remove.mockResolvedValue(true);
      await controller.remove('1');
      expect(serviceMock.remove).toHaveBeenCalledWith('1');
    });
  });
});
