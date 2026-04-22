import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { StoreService } from '../store/store.service';
import { UserRole } from '../../common/enum/role.enum';

describe('ProductsService', () => {
  let service: ProductsService;
  let repoMock: any;
  let storeServiceMock: any;

  const mockAdmin = {
    userId: 'admin-id',
    role: UserRole.ADMIN,
    email: 'admin@test.com',
  };

  beforeEach(async () => {
    repoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    storeServiceMock = {
      findByOwnerId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: 'PRODUCT_REPOSITORY',
          useValue: repoMock,
        },
        {
          provide: StoreService,
          useValue: storeServiceMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      const dto = { name: 'Prod' };
      repoMock.create.mockResolvedValue({ id: '1', ...dto });
      await service.create(dto as any, mockAdmin);
      expect(repoMock.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call repo.update', async () => {
      const dto = { name: 'Updated' };
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'store-1' });
      repoMock.update.mockResolvedValue({ id: '1', ...dto });
      await service.update('1', dto as any, mockAdmin);
      expect(repoMock.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should call repo.softDelete', async () => {
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'store-1' });
      repoMock.softDelete.mockResolvedValue(true);
      await service.remove('1', mockAdmin);
      expect(repoMock.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
