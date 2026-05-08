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
  });
});
