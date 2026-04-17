import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from '../../common/enum/role.enum';
import { RolesService } from '../roles/roles.service';

describe('UsersController', () => {
  let controller: UsersController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
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
      serviceMock.findAll.mockResolvedValue(users);

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

      await controller.createAdmin(dto as any);
      expect(serviceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.ADMIN,
        }),
      );
    });
  });

  const mockUser = {
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
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      serviceMock.remove.mockResolvedValue(true);
      const result = await controller.remove('1', mockUser as any);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updated = { id: '1', name: 'Updated' };
      serviceMock.update.mockResolvedValue(updated);
      const result = await controller.update(
        '1',
        { name: 'Updated' },
        mockUser as any,
      );
      expect(result).toEqual(updated);
    });
  });
});
