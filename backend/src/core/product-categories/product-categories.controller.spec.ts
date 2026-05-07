import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enum/role.enum';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ProductCategoriesController', () => {
  let controller: ProductCategoriesController;

  const mockAdmin = {
    id: 'admin-id',
    userId: 'admin-id',
    role: UserRole.ADMIN,
    email: 'admin@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductCategoriesController],
      providers: [
        {
          provide: ProductCategoriesService,
          useValue: mockService,
        },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductCategoriesController>(
      ProductCategoriesController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a category', async () => {
    const dto = { name: 'Test' };
    mockService.create.mockResolvedValue(dto);
    const result = await controller.create(dto as any, mockAdmin);
    expect(result).toEqual(dto);
    expect(mockService.create).toHaveBeenCalledWith(dto, mockAdmin);
  });

  it('should find all categories', async () => {
    mockService.findAll.mockResolvedValue([]);
    const result = await controller.findAll();
    expect(result).toEqual([]);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('should find one category', async () => {
    mockService.findOne.mockResolvedValue({ id: '1' });
    const result = await controller.findOne('1');
    expect(result).toEqual({ id: '1' });
    expect(mockService.findOne).toHaveBeenCalledWith('1');
  });

  it('should update a category', async () => {
    const dto = { name: 'Test2' };
    mockService.update.mockResolvedValue(dto);
    const result = await controller.update('1', dto, mockAdmin);
    expect(result).toEqual(dto);
    expect(mockService.update).toHaveBeenCalledWith('1', dto, mockAdmin);
  });

  it('should remove a category', async () => {
    mockService.remove.mockResolvedValue(undefined);
    await controller.remove('1', mockAdmin);
    expect(mockService.remove).toHaveBeenCalledWith('1', mockAdmin);
  });
});
