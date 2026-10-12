import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { StoreService } from '../store/store.service';
import { UserRole } from '../../common/enum/role.enum';
import { S3StorageService } from '../../libs/storage/s3-storage.service';
import { CacheService } from '../../libs/cache/cache.service';
import { RealtimeGateway } from '../../libs/realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProductStatus } from '../../common/enum/product-status.enum';

describe('ProductsService', () => {
  let service: ProductsService;
  let repoMock: any;
  let storeServiceMock: any;
  let storageServiceMock: any;
  let cacheServiceMock: any;
  let realtimeGatewayMock: any;
  let userRepoMock: any;
  let notificationsServiceMock: any;

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
      delete: jest.fn(),
    };

    storeServiceMock = {
      findByOwnerId: jest.fn(),
      findOne: jest.fn(),
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

    userRepoMock = {
      find: jest.fn(),
    };

    notificationsServiceMock = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: 'PRODUCT_REPOSITORY',
          useValue: repoMock,
        },
        {
          provide: 'PRODUCT_REVIEW_REPOSITORY',
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'USER_REPOSITORY',
          useValue: userRepoMock,
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
        {
          provide: NotificationsService,
          useValue: notificationsServiceMock,
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
        where: expect.objectContaining({ storeId: 'store-1', status: 'APPROVED' })
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

    it('should set status to PENDING and notify admins when created by a vendor', async () => {
      const vendorUser = { userId: 'v1', role: UserRole.VENDEUR, name: 'Vendor 1' };
      const dto = { name: 'Prod' };
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-1', name: 'Store 1' });
      repoMock.create.mockResolvedValue({ id: '1', name: 'Prod', status: 'PENDING' });
      repoMock.findOne.mockResolvedValue({ id: '1', name: 'Prod', status: 'PENDING' });
      
      const mockAdmins = [{ id: 'admin-1', role: UserRole.ADMIN }, { id: 'admin-2', role: UserRole.SUPER_ADMIN }];
      userRepoMock.find.mockResolvedValue(mockAdmins);

      await service.create(dto as any, vendorUser as any);

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: ProductStatus.PENDING }),
      );
      expect(userRepoMock.find).toHaveBeenCalled();
      expect(notificationsServiceMock.create).toHaveBeenCalledTimes(2);
      expect(notificationsServiceMock.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
        userId: 'admin-1',
        title: 'Nouveau produit en attente',
      }));
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

    it('should set status to PENDING and notify admins when updated by a vendor (for non-approved product)', async () => {
      const vendorUser = { userId: 'v1', role: UserRole.VENDEUR, name: 'Vendor 1' };
      const dto = { name: 'Updated Prod' };
      const existingProduct = { id: '1', name: 'Prod', storeId: 'store-1', status: ProductStatus.PENDING };
      repoMock.findOne.mockImplementation((criteria: any) => {
        if (criteria?.where?.parentId === '1') return null;
        return existingProduct;
      });
      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-1', name: 'Store 1' });
      
      const mockAdmins = [{ id: 'admin-1', role: UserRole.ADMIN }];
      userRepoMock.find.mockResolvedValue(mockAdmins);

      await service.update('1', dto as any, vendorUser as any);

      expect(existingProduct.status).toBe(ProductStatus.PENDING);
      expect(repoMock.save).toHaveBeenCalledWith(expect.objectContaining({ status: ProductStatus.PENDING }));
      expect(userRepoMock.find).toHaveBeenCalled();
      expect(notificationsServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'admin-1',
        title: 'Nouveau produit en attente',
      }));
    });

    it('should create a revision when an approved product is updated by a vendor', async () => {
      const vendorUser = { userId: 'v1', role: UserRole.VENDEUR, name: 'Vendor 1' };
      const dto = { name: 'Updated Approved Prod', price: 200 };
      const existingProduct = { id: '1', name: 'Prod', storeId: 'store-1', status: ProductStatus.APPROVED, price: 100 };
      
      repoMock.findOne.mockImplementation((criteria: any) => {
        if (criteria?.where?.parentId === '1') {
          return null; // no existing pending revision
        }
        return existingProduct;
      });

      storeServiceMock.findByOwnerId.mockResolvedValue({ id: 'store-1', name: 'Store 1' });
      repoMock.create.mockResolvedValue({ id: 'revision-1', name: 'Updated Approved Prod', status: ProductStatus.PENDING, parentId: '1' });
      
      const mockAdmins = [{ id: 'admin-1', role: UserRole.ADMIN }];
      userRepoMock.find.mockResolvedValue(mockAdmins);

      await service.update('1', dto as any, vendorUser as any);

      expect(existingProduct.status).toBe(ProductStatus.APPROVED);
      expect(repoMock.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated Approved Prod',
        parentId: '1',
        status: ProductStatus.PENDING,
      }));
      expect(userRepoMock.find).toHaveBeenCalled();
      expect(notificationsServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'admin-1',
        title: 'Nouveau produit en attente',
      }));
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

  describe('updateStatus', () => {
    it('should approve product and notify vendor', async () => {
      const product = { id: '1', name: 'Prod', storeId: 'store-1', status: ProductStatus.PENDING };
      repoMock.findOne.mockResolvedValue(product);
      storeServiceMock.findOne.mockResolvedValue({ id: 'store-1', ownerId: 'vendor-1' });

      await service.updateStatus('1', ProductStatus.APPROVED);

      expect(repoMock.update).toHaveBeenCalledWith('1', expect.objectContaining({ status: ProductStatus.APPROVED }));
      expect(notificationsServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'vendor-1',
        title: 'Produit approuvé',
        message: expect.stringContaining('approuvé'),
      }));
    });

    it('should reject product with reason and notify vendor', async () => {
      const product = { id: '1', name: 'Prod', storeId: 'store-1', status: ProductStatus.PENDING };
      repoMock.findOne.mockResolvedValue(product);
      storeServiceMock.findOne.mockResolvedValue({ id: 'store-1', ownerId: 'vendor-1' });

      await service.updateStatus('1', ProductStatus.REJECTED, 'Image floue');

      expect(repoMock.update).toHaveBeenCalledWith('1', expect.objectContaining({
        status: ProductStatus.REJECTED,
        rejectionReason: 'Image floue',
      }));
      expect(notificationsServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'vendor-1',
        title: 'Produit refusé',
        message: expect.stringContaining('refusé. Motif : Image floue'),
      }));
    });

    it('should approve revision, merge fields into parent product, and delete revision', async () => {
      const parentProduct = { id: 'parent-1', name: 'Original Name', price: 100, status: ProductStatus.APPROVED };
      const revisionProduct = { id: 'revision-1', name: 'New Name', price: 120, parentId: 'parent-1', status: ProductStatus.PENDING, storeId: 'store-1' };
      
      repoMock.findOne.mockImplementation((criteria: any) => {
        const id = criteria.id;
        if (id === 'revision-1') return revisionProduct;
        if (id === 'parent-1') return parentProduct;
        return null;
      });
      storeServiceMock.findOne.mockResolvedValue({ id: 'store-1', ownerId: 'vendor-1' });

      await service.updateStatus('revision-1', ProductStatus.APPROVED);

      expect(repoMock.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'parent-1',
        name: 'New Name',
        price: 120,
      }));
      expect(repoMock.delete).toHaveBeenCalledWith('revision-1');
      expect(notificationsServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'vendor-1',
        title: 'Modification approuvée',
        message: expect.stringContaining('modification du produit "New Name" a été approuvée'),
      }));
    });

    it('should reject revision and notify vendor, leaving parent product intact', async () => {
      const revisionProduct = { id: 'revision-1', name: 'New Name', price: 120, parentId: 'parent-1', status: ProductStatus.PENDING, storeId: 'store-1' };
      
      repoMock.findOne.mockImplementation((criteria: any) => {
        const id = criteria.id;
        if (id === 'revision-1') return revisionProduct;
        if (id === 'parent-1') return { id: 'parent-1', name: 'Original Name' };
        return null;
      });
      storeServiceMock.findOne.mockResolvedValue({ id: 'store-1', ownerId: 'vendor-1' });

      await service.updateStatus('revision-1', ProductStatus.REJECTED, 'Price too high');

      expect(repoMock.update).toHaveBeenCalledWith('revision-1', expect.objectContaining({
        status: ProductStatus.REJECTED,
        rejectionReason: 'Price too high',
      }));
      expect(repoMock.save).not.toHaveBeenCalled(); // parent product not saved
      expect(notificationsServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'vendor-1',
        title: 'Modification refusée',
        message: expect.stringContaining('modification du produit "Original Name" a été refusée. Motif : Price too high'),
      }));
    });
  });
});
