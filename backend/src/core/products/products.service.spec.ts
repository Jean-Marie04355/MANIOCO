import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { StoreService } from '../store/store.service';
import { UserRole } from '../../common/enum/role.enum';
import { S3StorageService } from '../../libs/storage/s3-storage.service';
import { CacheService } from '../../libs/cache/cache.service';
import { RealtimeGateway } from '../../libs/realtime/realtime.gateway';

describe('ProductsService', () => {
  let service: ProductsService;
  let repoMock: any;
  let storeServiceMock: any;

  const mockAdmin = {
    id: 'admin-id',
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
      save: jest.fn(),
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
        {
          provide: S3StorageService,
          useValue: { uploadFile: jest.fn() },
        },
        {
          provide: CacheService,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
        {
          provide: RealtimeGateway,
          useValue: { emitToUser: jest.fn(), emitToAll: jest.fn() },
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
    it('should call repo.create for admin', async () => {
      const dto = { name: 'Prod' };
      const created = { id: '1', ...dto };
      repoMock.create.mockResolvedValue(created);
      repoMock.findOne.mockResolvedValue(created);
      await service.create(dto as any, mockAdmin);
      expect(repoMock.create).toHaveBeenCalledWith(dto);
    });

    it('should inject storeId for vendor', async () => {
      const dto = { name: 'Prod' };
      const created = { id: '1', ...dto, storeId: 'store-v1' };
      const vendorUser = { userId: 'v-1', role: UserRole.VENDEUR };
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-v1' });
      repoMock.create.mockResolvedValue(created);
      repoMock.findOne.mockResolvedValue(created);
      await service.create(dto as any, vendorUser as any);
      expect(dto['storeId']).toBe('store-v1');
      expect(repoMock.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should call repo.save for admin', async () => {
      const dto = { name: 'Updated' };
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'store-1' });
      repoMock.save.mockResolvedValue({ id: '1', ...dto });
      await service.update('1', dto as any, mockAdmin);
      expect(repoMock.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product missing', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.update('1', {}, mockAdmin)).rejects.toThrow(
        'Produit non trouvé',
      );
    });

    it('should allow vendor to update their own product', async () => {
      const vendorUser = { userId: 'v-1', role: UserRole.VENDEUR };
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'store-v1' });
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-v1' });
      await service.update('1', { name: 'New' }, vendorUser as any);
      expect(repoMock.save).toHaveBeenCalled();
    });

    it('should forbid vendor from updating other products', async () => {
      const vendorUser = { userId: 'v-1', role: UserRole.VENDEUR };
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'other-store' });
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-v1' });
      await expect(
        service.update('1', { name: 'New' }, vendorUser as any),
      ).rejects.toThrow('Vous ne pouvez modifier que vos propres produits');
    });
  });

  describe('remove', () => {
    it('should call repo.softDelete for admin', async () => {
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'store-1' });
      repoMock.softDelete.mockResolvedValue(true);
      await service.remove('1', mockAdmin);
      expect(repoMock.softDelete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if product missing', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.remove('1', mockAdmin)).rejects.toThrow(
        'Produit non trouvé',
      );
    });

    it('should allow vendor to remove their own product', async () => {
      const vendorUser = { userId: 'v-1', role: UserRole.VENDEUR };
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'store-v1' });
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-v1' });
      await service.remove('1', vendorUser as any);
      expect(repoMock.softDelete).toHaveBeenCalledWith('1');
    });

    it('should forbid vendor from removing other products', async () => {
      const vendorUser = { userId: 'v-1', role: UserRole.VENDEUR };
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'other-store' });
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-v1' });
      await expect(service.remove('1', vendorUser as any)).rejects.toThrow(
        'Vous ne pouvez supprimer que vos propres produits',
      );
    });
  });
});
