import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/enum/role.enum';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Store } from '../store/store.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { AuditService } from '../audit/audit.service';
import { S3StorageService } from '../../libs/storage/s3-storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CacheService } from '../../libs/cache/cache.service';
import { NotificationType } from '../notifications/notification.entity';

describe('UsersService', () => {
  jest.setTimeout(30000);
  let service: UsersService;
  let repositoryMock: any;
  let auditServiceMock: any;
  let s3StorageServiceMock: any;
  let notificationsServiceMock: any;
  let cacheServiceMock: any;
  let storeRepoMock: any;
  let productRepoMock: any;
  let orderRepoMock: any;

  beforeEach(async () => {
    repositoryMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };

    auditServiceMock = {
      log: jest.fn(),
    };

    s3StorageServiceMock = {
      uploadFile: jest.fn(),
    };

    notificationsServiceMock = {
      create: jest.fn(),
    };

    cacheServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    storeRepoMock = {
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    productRepoMock = {
      count: jest.fn(),
    };

    orderRepoMock = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'USER_REPOSITORY',
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: storeRepoMock,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepoMock,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepoMock,
        },
        {
          provide: AuditService,
          useValue: auditServiceMock,
        },
        {
          provide: S3StorageService,
          useValue: s3StorageServiceMock,
        },
        {
          provide: NotificationsService,
          useValue: notificationsServiceMock,
        },
        {
          provide: CacheService,
          useValue: cacheServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return users with basic stats for regular clients', async () => {
      const users = [
        {
          id: '1',
          email: 'test@test.com',
          createdAt: new Date(),
          role: UserRole.CLIENT,
        },
      ];
      repositoryMock.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result[0].stats.seniority).toBeDefined();
      expect(result[0].stats.productCount).toBe(0);
    });

    it('should calculate detailed stats for vendors', async () => {
      const vendor = {
        id: 'v1',
        email: 'v@v.com',
        createdAt: new Date(),
        role: UserRole.VENDEUR,
      };
      repositoryMock.find.mockResolvedValue([vendor]);
      storeRepoMock.findOne.mockResolvedValue({ id: 'store-1' });
      productRepoMock.count.mockResolvedValue(5);
      orderRepoMock.find.mockResolvedValue([
        { totalAmount: 100 },
        { totalAmount: 50 },
      ]);

      const result = await service.findAll();
      const stats = result[0].stats;
      expect(stats.productCount).toBe(5);
      expect(stats.totalRevenue).toBe(150);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const user = { id: '1', email: 'test@test.com' };
      cacheServiceMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(user);
    });

    it('should return cached user if present', async () => {
      const user = { id: '1', email: 'test@test.com' };
      cacheServiceMock.get.mockResolvedValue(user);
      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(user);
      expect(repositoryMock.findOne).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createUserDto = {
      email: 'new@test.com',
      password: 'password123',
      name: 'New User',
      role: UserRole.CLIENT,
    };

    it('should throw ConflictException if user already exists', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1' });
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('should create a SUPER_ADMIN if it is the first user', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.count.mockResolvedValue(0);
      repositoryMock.create.mockResolvedValue({
        ...createUserDto,
        id: '1',
        role: UserRole.SUPER_ADMIN,
      });

      const result = await service.create(createUserDto);
      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.SUPER_ADMIN }),
      );
    });

    it('should prevent creating a 2nd SUPER_ADMIN', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.count.mockResolvedValue(10);
      repositoryMock.create.mockResolvedValue({ id: '1' });
      
      await service.create({ ...createUserDto, role: UserRole.SUPER_ADMIN });
      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.CLIENT }),
      );
    });

    it('should create a regular client if not the first user', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.count.mockResolvedValue(1);
      repositoryMock.create.mockResolvedValue({ ...createUserDto, id: '1', role: UserRole.CLIENT });
      
      const result = await service.create(createUserDto);
      expect(result.id).toBe('1');
      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.CLIENT }),
      );
    });

    it('should log error if admin notification fails', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.count.mockResolvedValue(1);
      repositoryMock.create.mockResolvedValue({ id: '1', name: 'N', email: 'e' });
      repositoryMock.find.mockRejectedValue(new Error('Admin fetch fail'));
      
      const result = await service.create(createUserDto);
      expect(result.id).toBe('1');
    });
  });

  describe('update', () => {
    it('should hash password if provided', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1', email: 't@t.com' });
      const updateDto = { password: 'newpassword' };
      await service.update('1', updateDto);
      expect(repositoryMock.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ password: expect.any(String) }),
      );
    });

    it('should handle photo upload and its failure', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1', email: 't@t.com' });
      s3StorageServiceMock.uploadFile.mockRejectedValue(new Error('S3 fail'));
      await service.update('1', { profilePhoto: 'data:image/png;base64,xxxx' });
      expect(repositoryMock.update).toHaveBeenCalled();
    });

    it('should return cached result in findOne', async () => {
      cacheServiceMock.get.mockResolvedValue({ id: 'cached' });
      const result = await service.findOne('1');
      expect(result.id).toBe('cached');
    });
  });

  describe('KYC Process', () => {
    const user = { id: '1', name: 'V', email: 'v@v.com', role: UserRole.VENDEUR };

    it('should handle KYC rejection', async () => {
      repositoryMock.findOne.mockResolvedValue(user);
      await service.reviewKyc('1', { status: 'REJECTED', reasons: { doc: 'blurry' } });
      expect(repositoryMock.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ kycStatus: 'REJECTED', kycRejectionReasons: JSON.stringify({ doc: 'blurry' }) }),
      );
    });

    it('should handle notification error during KYC submission', async () => {
      repositoryMock.findOne.mockResolvedValue(user);
      repositoryMock.find.mockRejectedValue(new Error('Admin fail'));
      await service.submitKyc('1', { doc: 'data:image/png;base64,x' });
      expect(repositoryMock.update).toHaveBeenCalled();
    });
  });

  describe('hardDelete/restore', () => {
    it('should restore user', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1', email: 't@t.com' });
      await service.restore('1');
      expect(repositoryMock.restore).toHaveBeenCalledWith('1');
    });

    it('should delete store during hardDelete', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1', email: 'v@v.com' });
      storeRepoMock.findOne.mockResolvedValue({ id: 'store-1' });
      await service.hardDelete('1');
      expect(storeRepoMock.delete).toHaveBeenCalledWith('store-1');
    });
  });
});
