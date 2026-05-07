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

describe('UsersService', () => {
  jest.setTimeout(15000); // hash functions can be slow on CI
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
    it('should return users with stats', async () => {
      const users = [{ id: '1', email: 'test@test.com', createdAt: new Date() }];
      repositoryMock.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result[0].stats).toBeDefined();
      expect(repositoryMock.find).toHaveBeenCalled();
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

    it('should return null if not found', async () => {
      cacheServiceMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('notfound@test.com');
      expect(result).toBeNull();
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
      expect(result.id).toBe('1');
      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.SUPER_ADMIN,
        }),
      );
    });

    it('should create a regular user if not the first', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.count.mockResolvedValue(10);
      repositoryMock.create.mockResolvedValue({
        ...createUserDto,
        id: '1',
        role: UserRole.CLIENT,
      });

      const result = await service.create(createUserDto);
      expect(result.id).toBe('1');
      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CLIENT,
        }),
      );
    });

    it('should prevent creating a SUPER_ADMIN if one already exists', async () => {
      const superAdminDto = { ...createUserDto, role: UserRole.SUPER_ADMIN };
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.count.mockResolvedValue(1);
      repositoryMock.create.mockResolvedValue({
        ...superAdminDto,
        id: '1',
        role: UserRole.CLIENT,
      });

      const result = await service.create(superAdminDto);
      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CLIENT,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user if found (with cache)', async () => {
      const user = { id: '1', email: 'test@test.com' };
      cacheServiceMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(user);

      const result = await service.findOne('1');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if not found', async () => {
      cacheServiceMock.get.mockResolvedValue(null);
      repositoryMock.findOne.mockResolvedValue(null);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should call softDelete and clear cache', async () => {
      const user = { id: '1', email: 't@t.com' };
      cacheServiceMock.get.mockResolvedValue(user);
      repositoryMock.findOne.mockResolvedValue(user);
      repositoryMock.softDelete.mockResolvedValue(true);

      const result = await service.remove('1');
      expect(result).toBe(true);
      expect(cacheServiceMock.del).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1' });
      await service.update('1', { name: 'Updated' });
      expect(repositoryMock.update).toHaveBeenCalledWith('1', {
        name: 'Updated',
      });
    });

    it('should hash password if provided in update', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1' });
      const updateDto = { password: 'newpassword' };
      await service.update('1', updateDto);
      expect(repositoryMock.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          password: expect.any(String),
        }),
      );
      expect(repositoryMock.update.mock.calls[0][1].password).not.toBe(
        'newpassword',
      );
    });
  });
});
