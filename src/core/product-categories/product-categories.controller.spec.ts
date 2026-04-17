import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';

describe('ProductCategoriesController', () => {
  let controller: ProductCategoriesController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductCategoriesController],
      providers: [
        {
          provide: ProductCategoriesService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<ProductCategoriesController>(ProductCategoriesController);
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      serviceMock.findAll.mockResolvedValue([]);
      await controller.findAll();
      expect(serviceMock.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      serviceMock.findOne.mockResolvedValue({ id: '1' });
      await controller.findOne('1');
      expect(serviceMock.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { name: 'Cat' };
      serviceMock.create.mockResolvedValue({ id: '1', ...dto });
      await controller.create(dto as any);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { name: 'Updated' };
      serviceMock.update.mockResolvedValue({ id: '1', ...dto });
      await controller.update('1', dto as any);
      expect(serviceMock.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      serviceMock.remove.mockResolvedValue(true);
      await controller.remove('1');
      expect(serviceMock.remove).toHaveBeenCalledWith('1');
    });
  });
});
