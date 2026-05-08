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
  jest.setTimeout(30000); // hash functions can be slow on CI
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

  it('should be defined', () => {
    expect(service).toBeDefined();
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

  describe('findAllWithDeleted', () => {
    it('should call repository with withDeleted option', async () => {
      await service.findAllWithDeleted();
      expect(repositoryMock.find).toHaveBeenCalledWith({ withDeleted: true });
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found (via cache check)', async () => {
      const user = { id: '1', email: 'test@test.com' };
      cacheServiceMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(user);
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
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
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
  });

  describe('update', () => {
    it('should hash password if provided in update', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1', email: 't@t.com' });
      const updateDto = { password: 'newpassword' };
      await service.update('1', updateDto);
      expect(repositoryMock.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ password: expect.any(String) }),
      );
    });

    it('should handle Base64 profile photo upload to S3', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1', email: 't@t.com' });
      s3StorageServiceMock.uploadFile.mockResolvedValue(
        'http://s3.url/photo.jpg',
      );

      const updateDto = { profilePhoto: 'data:image/png;base64,xxxx' };
      await service.update('1', updateDto);

      expect(s3StorageServiceMock.uploadFile).toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ profilePhoto: 'http://s3.url/photo.jpg' }),
      );
    });
  });

  describe('restore', () => {
    it('should restore user and clear suspension fields', async () => {
      repositoryMock.findOne.mockResolvedValue({
        id: '1',
        email: 't@t.com',
        suspensionUntil: new Date(),
      });
      await service.restore('1');
      expect(repositoryMock.restore).toHaveBeenCalledWith('1');
      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ suspensionUntil: null }),
      );
    });
  });

  describe('hardDelete', () => {
    it('should delete store if user is a vendor before deleting user', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1', email: 'v@v.com' });
      storeRepoMock.findOne.mockResolvedValue({ id: 'store-1' });
      await service.hardDelete('1');
      expect(storeRepoMock.delete).toHaveBeenCalledWith('store-1');
      expect(repositoryMock.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('KYC Process', () => {
    const user = {
      id: '1',
      name: 'Vendor',
      email: 'v@v.com',
      role: UserRole.VENDEUR,
    };

    it('should submit KYC and handle Base64 document uploads', async () => {
      repositoryMock.findOne.mockResolvedValue(user);
      s3StorageServiceMock.uploadFile.mockResolvedValue(
        'http://s3.url/doc.jpg',
      );
      repositoryMock.find.mockResolvedValue([
        { id: 'admin-1', role: UserRole.ADMIN },
      ]);

      await service.submitKyc('1', {
        idCardFront: 'data:image/jpeg;base64,xxxx',
      });

      expect(repositoryMock.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          kycStatus: 'PENDING',
          idCardFront: 'http://s3.url/doc.jpg',
        }),
      );
    });

    it('should approve KYC and verify user', async () => {
      repositoryMock.findOne.mockResolvedValue(user);
      await service.reviewKyc('1', { status: 'APPROVED' });
      expect(repositoryMock.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ kycStatus: 'APPROVED', isVerified: true }),
      );
    });
  });
});
