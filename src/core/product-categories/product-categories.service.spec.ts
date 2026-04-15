import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategoriesService } from './product-categories.service';

describe('ProductCategoriesService', () => {
  let service: ProductCategoriesService;
  let repoMock: any;

  beforeEach(async () => {
    repoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCategoriesService,
        {
          provide: 'PRODUCT_CATEGORY_REPOSITORY',
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<ProductCategoriesService>(ProductCategoriesService);
  });

  describe('findAll', () => {
    it('should call repo.find', async () => {
      repoMock.find.mockResolvedValue([]);
      await service.findAll();
      expect(repoMock.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call repo.findOne', async () => {
      repoMock.findOne.mockResolvedValue({ id: '1' });
      await service.findOne('1');
      expect(repoMock.findOne).toHaveBeenCalledWith({ id: '1' });
    });
  });

  describe('create', () => {
    it('should call repo.create', async () => {
      const dto = { name: 'Cat' };
      repoMock.create.mockResolvedValue({ id: '1', ...dto });
      await service.create(dto as any);
      expect(repoMock.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call repo.update', async () => {
      const dto = { name: 'Updated' };
      repoMock.update.mockResolvedValue({ id: '1', ...dto });
      await service.update('1', dto as any);
      expect(repoMock.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should call repo.softDelete', async () => {
      repoMock.softDelete.mockResolvedValue(true);
      await service.remove('1');
      expect(repoMock.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
