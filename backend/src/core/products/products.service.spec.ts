import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { StoreService } from '../store/store.service';
import { UserRole } from '../../common/enum/role.enum';
import { S3StorageService } from '../../libs/storage/s3-storage.service';
import { CacheService } from '../../libs/cache/cache.service';
import { RealtimeGateway } from '../../libs/realtime/realtime.gateway';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let repoMock: any;
  let storeServiceMock: any;
  let storageServiceMock: any;
  let cacheServiceMock: any;
  let realtimeGatewayMock: any;

  const mockAdmin = {
    id: 'admin-uuid',
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
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    storeServiceMock = {
      findByOwnerId: jest.fn(),
    };

    storageServiceMock = {
      uploadFile: jest.fn(),
    };

    cacheServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    realtimeGatewayMock = {
      server: {
        emit: jest.fn(),
      },
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
          useValue: storageServiceMock,
        },
        {
          provide: CacheService,
          useValue: cacheServiceMock,
        },
        {
          provide: RealtimeGateway,
          useValue: realtimeGatewayMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call repo.find if no storeId and no cache', async () => {
      cacheServiceMock.get.mockResolvedValue(null);
      repoMock.find.mockResolvedValue([]);
      await service.findAll();
      expect(repoMock.find).toHaveBeenCalled();
      expect(cacheServiceMock.set).toHaveBeenCalled();
    });

    it('should return cached value if present', async () => {
      const cached = [{ id: '1' }];
      cacheServiceMock.get.mockResolvedValue(cached);
      const result = await service.findAll();
      expect(result).toEqual(cached);
      expect(repoMock.find).not.toHaveBeenCalled();
    });

    it('should find by storeId', async () => {
      repoMock.find.mockResolvedValue([]);
      await service.findAll('store-1');
      expect(repoMock.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { storeId: 'store-1' }
      }));
    });
  });

  describe('findOne', () => {
    it('should call repo.findOne', async () => {
      repoMock.findOne.mockResolvedValue({ id: '1' });
      await service.findOne('1');
      expect(repoMock.findOne).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should call repo.create for admin', async () => {
      const dto = { name: 'Prod' };
      repoMock.create.mockResolvedValue({ id: '1', ...dto });
      repoMock.findOne.mockResolvedValue({ id: '1', ...dto });
      await service.create(dto as any, mockAdmin as any);
      expect(repoMock.create).toHaveBeenCalled();
      expect(cacheServiceMock.del).toHaveBeenCalled();
    });

    it('should handle base64 image upload', async () => {
      const dto = { name: 'Prod', image: 'data:image/png;base64,content' };
      storageServiceMock.uploadFile.mockResolvedValue('s3-url');
      repoMock.create.mockResolvedValue({ id: '1', ...dto });
      repoMock.findOne.mockResolvedValue({ id: '1', ...dto });

      await service.create(dto as any, mockAdmin as any);

      expect(storageServiceMock.uploadFile).toHaveBeenCalled();
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          image: 's3-url',
        }),
      );
    });

    it('should handle image upload failure gracefully', async () => {
      const dto = { name: 'Prod', image: 'data:image/png;base64,content' };
      storageServiceMock.uploadFile.mockRejectedValue(new Error('S3 Down'));
      repoMock.create.mockResolvedValue({ id: '1', ...dto });
      repoMock.findOne.mockResolvedValue({ id: '1', ...dto });

      await service.create(dto as any, mockAdmin as any);

      expect(repoMock.create).toHaveBeenCalled(); // Should still create product without image
    });

    it('should set storeId for vendor user', async () => {
      const vendorUser = { userId: 'v1', role: UserRole.VENDEUR };
      const dto = { name: 'Prod' };
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-1' });
      repoMock.create.mockResolvedValue({ id: '1', ...dto });
      repoMock.findOne.mockResolvedValue({ id: '1', ...dto });

      await service.create(dto as any, vendorUser as any);

      expect(storeServiceMock.findByOwnerId).toHaveBeenCalledWith('v1');
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'store-1' }),
      );
    });

    it('should throw Forbidden if vendor has no store', async () => {
      const vendorUser = { userId: 'v1', role: UserRole.VENDEUR };
      storeServiceMock.findByOwnerId.mockRejectedValue(new Error('No store'));
      await expect(service.create({ name: 'P' } as any, vendorUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should log error but continue if image upload fails', async () => {
      const dto = { name: 'Prod', image: 'data:image/png;base64,content' };
      storageServiceMock.uploadFile.mockRejectedValue(new Error('S3 Error'));
      repoMock.create.mockResolvedValue({ id: '1', ...dto });
      repoMock.findOne.mockResolvedValue({ id: '1', ...dto });

      await service.create(dto as any, mockAdmin as any);
      expect(repoMock.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should call repo.save for admin', async () => {
      const dto = { name: 'Updated' };
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'store-1' });
      await service.update('1', dto as any, mockAdmin as any);
      expect(repoMock.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product missing', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.update('1', {}, mockAdmin as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if vendor updates other product', async () => {
      const vendorUser = { userId: 'v1', role: UserRole.VENDEUR };
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'other-store' });
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-v1' });

      await expect(service.update('1', {}, vendorUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle image update and its failure', async () => {
      const dto = { image: 'data:image/png;base64,new' };
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 's1' });
      storageServiceMock.uploadFile.mockRejectedValue(new Error('S3 fail'));
      
      await service.update('1', dto as any, mockAdmin as any);
      expect(repoMock.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should call repo.softDelete for admin', async () => {
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'store-1' });
      repoMock.softDelete.mockResolvedValue(true);
      await service.remove('1', mockAdmin as any);
      expect(repoMock.softDelete).toHaveBeenCalledWith('1');
    });

    it('should throw ForbiddenException if vendor deletes other product', async () => {
      const vendorUser = { id: 'v1', userId: 'v-1', role: UserRole.VENDEUR };
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 'other-store' });
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-v1' });

      await expect(service.remove('1', vendorUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle broadcast edge case when server is null', async () => {
      realtimeGatewayMock.server = null;
      repoMock.findOne.mockResolvedValue({ id: '1', storeId: 's1' });
      await service.remove('1', mockAdmin as any);
      // Should not throw
    });
  });
});
