import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/enum/role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let repositoryMock: any;

  beforeEach(async () => {
    repositoryMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'USER_REPOSITORY',
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: '1', email: 'test@test.com' }];
      repositoryMock.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(repositoryMock.find).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const user = { id: '1', email: 'test@test.com' };
      repositoryMock.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(user);
    });

    it('should return null if not found', async () => {
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
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('should create a SUPER_ADMIN if it is the first user', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.count.mockResolvedValue(0);
      repositoryMock.create.mockResolvedValue({ ...createUserDto, id: '1', role: UserRole.SUPER_ADMIN });

      const result = await service.create(createUserDto);
      expect(result.id).toBe('1');
      expect(repositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
        role: UserRole.SUPER_ADMIN,
      }));
    });

    it('should create a regular user if not the first', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.count.mockResolvedValue(10);
      repositoryMock.create.mockResolvedValue({ ...createUserDto, id: '1', role: UserRole.CLIENT });

      const result = await service.create(createUserDto);
      expect(result.id).toBe('1');
      expect(repositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
        role: UserRole.CLIENT,
      }));
    });

    it('should prevent creating a SUPER_ADMIN if one already exists', async () => {
      const superAdminDto = { ...createUserDto, role: UserRole.SUPER_ADMIN };
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.count.mockResolvedValue(1);
      repositoryMock.create.mockResolvedValue({ ...superAdminDto, id: '1', role: UserRole.CLIENT });

      const result = await service.create(superAdminDto);
      expect(repositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
        role: UserRole.CLIENT,
      }));
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const user = { id: '1', email: 'test@test.com' };
      repositoryMock.findOne.mockResolvedValue(user);

      const result = await service.findOne('1');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should call softDelete', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1' });
      repositoryMock.softDelete.mockResolvedValue(true);

      const result = await service.remove('1');
      expect(result).toBe(true);
      expect(repositoryMock.softDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1' });
      await service.update('1', { name: 'Updated' });
      expect(repositoryMock.update).toHaveBeenCalledWith('1', { name: 'Updated' });
    });

    it('should hash password if provided in update', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: '1' });
      const updateDto = { password: 'newpassword' };
      await service.update('1', updateDto);
      expect(repositoryMock.update).toHaveBeenCalledWith('1', expect.objectContaining({
        password: expect.any(String),
      }));
      expect(repositoryMock.update.mock.calls[0][1].password).not.toBe('newpassword');
    });
  });
});
