import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: 'ROLE_REPOSITORY',
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      mockRepo.find.mockResolvedValue([]);
      expect(await service.findAll()).toEqual([]);
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });

  describe('findByName', () => {
    it('should return a role by name', async () => {
      const role = { name: 'admin' };
      mockRepo.findOne.mockResolvedValue(role);
      expect(await service.findByName('admin')).toEqual(role);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ name: 'admin' });
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const newRole = { name: 'newRole' };
      mockRepo.create.mockResolvedValue(newRole);
      expect(await service.create(newRole)).toEqual(newRole);
    });

    it('should throw ConflictException if role exists', async () => {
      mockRepo.findOne.mockResolvedValue({ name: 'existingRole' });
      await expect(service.create({ name: 'existingRole' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      mockRepo.findOne.mockResolvedValue({ id: '1', isSystem: false });
      const updatedRole = { id: '1', name: 'updated' };
      mockRepo.update.mockResolvedValue(updatedRole);
      expect(await service.update('1', { name: 'updated' })).toEqual(
        updatedRole,
      );
    });

    it('should throw NotFoundException if role not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if trying to rename a system role', async () => {
      mockRepo.findOne.mockResolvedValue({ id: '1', name: 'admin', isSystem: true });
      await expect(service.update('1', { name: 'new-name' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a role', async () => {
      mockRepo.findOne.mockResolvedValue({ id: '1', isSystem: false });
      mockRepo.softDelete.mockResolvedValue(undefined);
      await service.remove('1');
      expect(mockRepo.softDelete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if role is system role', async () => {
      mockRepo.findOne.mockResolvedValue({ id: '1', isSystem: true });
      await expect(service.remove('1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('initializeSystemRoles', () => {
    it('should initialize system roles if they do not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({});
      await service.initializeSystemRoles();
      expect(mockRepo.create).toHaveBeenCalledTimes(5); // 5 system roles
    });

    it('should not initialize system roles if they already exist', async () => {
      mockRepo.findOne.mockResolvedValue({ name: 'existing' });
      await service.initializeSystemRoles();
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });
});
