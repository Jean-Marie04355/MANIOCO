import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from '../../common/enum/role.enum';
import { RolesService } from '../roles/roles.service';
import { AuditService } from '../audit/audit.service';

describe('UsersController', () => {
  let controller: UsersController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
      findAllWithDeleted: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: serviceMock,
        },
        {
          provide: RolesService,
          useValue: { findByName: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: '1', email: 'test@test.com' }];
      serviceMock.findAllWithDeleted.mockResolvedValue(users);

      const result = await controller.findAll();
      expect(result).toEqual(users);
    });
  });

  describe('create', () => {
    it('should create a user and downgrade role to CLIENT if ADMIN requested', async () => {
      const dto = {
        email: 'test@test.com',
        password: '123',
        name: 'Test',
        role: UserRole.ADMIN,
      };
      serviceMock.create.mockResolvedValue({
        id: '1',
        ...dto,
        role: UserRole.CLIENT,
      });

      await controller.create(dto);
      expect(serviceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CLIENT,
        }),
      );
    });
  });

  describe('createAdmin', () => {
    it('should create an ADMIN user', async () => {
      const dto = { email: 'admin@test.com', password: '123', name: 'Admin' };
      serviceMock.create.mockResolvedValue({
        id: '1',
        ...dto,
        role: UserRole.ADMIN,
      });

      await controller.createAdmin(dto as any, mockUser as any);
      expect(serviceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.ADMIN,
        }),
      );
    });
  });

  const mockUser = {
    id: '1',
    userId: '1',
    role: UserRole.SUPER_ADMIN,
    email: 'admin@test.com',
  };

  describe('findOne', () => {
    it('should return one user', async () => {
      const user = { id: '1', email: 'test@test.com' };
      serviceMock.findOne.mockResolvedValue(user);

      const result = await controller.findOne('1', mockUser as any);
      expect(result).toEqual(user);
    });

    it('should throw ForbiddenException if client tries to access another user profile', async () => {
      const clientUser = {
        userId: '2',
        role: UserRole.CLIENT,
        email: 'client@test.com',
      };
      await expect(async () =>
        controller.findOne('1', clientUser as any),
      ).rejects.toThrow('You can only access your own profile.');
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      serviceMock.findOne.mockResolvedValue({ id: '1', email: 'test@test.com' });
      serviceMock.remove.mockResolvedValue(true);
      const result = await controller.remove('1', mockUser as any);
      expect(result).toEqual({ message: 'User suspended successfully' });
    });

    it('should throw ForbiddenException if non-owner, non-admin tries to delete', async () => {
      const clientUser = {
        userId: '99',
        role: UserRole.CLIENT,
        email: 'other@test.com',
      };
      await expect(controller.remove('1', clientUser as any)).rejects.toThrow(
        'Only administrators or the account owner can perform this action.',
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updated = { id: '1', name: 'Updated', email: 'test@test.com' };
      serviceMock.findOne.mockResolvedValue(updated);
      serviceMock.update.mockResolvedValue(updated);
      const result = await controller.update(
        '1',
        { name: 'Updated' },
        mockUser as any,
      );
      expect(result).toEqual(updated);
    });

    it('should throw ForbiddenException if non-admin client tries to update another user', async () => {
      const clientUser = {
        userId: '99',
        role: UserRole.CLIENT,
        email: 'other@test.com',
      };
      await expect(async () =>
        controller.update('1', {}, clientUser as any),
      ).rejects.toThrow('You can only update your own profile.');
    });

    it('should allow update when user is updating their own profile', async () => {
      const clientUser = { userId: '1', role: UserRole.CLIENT };
      serviceMock.findOne.mockResolvedValue({ id: '1', email: 'test@test.com' });
      serviceMock.update.mockResolvedValue({ id: '1' });
      const result = await controller.update('1', {}, clientUser as any);
      expect(result).toBeDefined();
    });
  });

  describe('create - role downgrade', () => {
    it('should downgrade SUPER_ADMIN role to CLIENT', async () => {
      const dto = {
        email: 'x@x.com',
        password: '123',
        role: UserRole.SUPER_ADMIN,
      };
      serviceMock.create.mockResolvedValue({ ...dto, role: UserRole.CLIENT });
      await controller.create(dto as any);
      expect(serviceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.CLIENT }),
      );
    });
  });
});
