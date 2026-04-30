import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategoriesService } from './product-categories.service';
import { StoreService } from '../store/store.service';
import { UserRole } from '../../common/enum/role.enum';

const mockRepo = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockStoreService = {
  findByOwnerId: jest.fn(),
};

describe('ProductCategoriesService', () => {
  let service: ProductCategoriesService;

  const mockAdmin = {
    userId: 'admin-id',
    role: UserRole.ADMIN,
    email: 'admin@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCategoriesService,
        {
          provide: 'PRODUCT_CATEGORY_REPOSITORY',
          useValue: mockRepo,
        },
        {
          provide: StoreService,
          useValue: mockStoreService,
        },
      ],
    }).compile();

    service = module.get<ProductCategoriesService>(ProductCategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a category as admin', async () => {
    const dto = { name: 'Test' };
    mockRepo.create.mockResolvedValue(dto);
    const result = await service.create(dto as any, mockAdmin);
    expect(result).toEqual(dto);
    expect(mockRepo.create).toHaveBeenCalledWith(dto);
  });

  it('should inject storeId for vendor creation', async () => {
    const dto = { name: 'Test' };
    const vendorUser = { userId: 'v-1', role: UserRole.VENDEUR };
    mockStoreService.findByOwnerId.mockResolvedValue({ id: 'store-v1' });
    await service.create(dto as any, vendorUser as any);
    expect(dto['storeId']).toBe('store-v1');
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('should find all categories', async () => {
    mockRepo.find.mockResolvedValue([]);
    const result = await service.findAll();
    expect(result).toEqual([]);
    expect(mockRepo.find).toHaveBeenCalled();
  });

  it('should find one category', async () => {
    mockRepo.findOne.mockResolvedValue({ id: '1' });
    const result = await service.findOne('1');
    expect(result).toEqual({ id: '1' });
    expect(mockRepo.findOne).toHaveBeenCalledWith({ id: '1' });
  });

  it('should update a category as admin', async () => {
    const dto = { name: 'Test2' };
    mockRepo.findOne.mockResolvedValue({ id: '1', storeId: 'store-1' });
    mockRepo.update.mockResolvedValue(dto);
    const result = await service.update('1', dto, mockAdmin);
    expect(result).toEqual(dto);
    expect(mockRepo.update).toHaveBeenCalledWith('1', dto);
  });

  it('should throw NotFoundException on update if missing', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.update('1', {}, mockAdmin)).rejects.toThrow(
      'Catégorie non trouvée',
    );
  });

  it('should allow vendor to update their own category', async () => {
    const vendorUser = { userId: 'v-1', role: UserRole.VENDEUR };
    mockRepo.findOne.mockResolvedValue({ id: '1', storeId: 'store-v1' });
    mockStoreService.findByOwnerId.mockResolvedValue({ id: 'store-v1' });
    await service.update('1', { name: 'New' }, vendorUser as any);
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('should forbid vendor from updating other category', async () => {
    const vendorUser = { userId: 'v-1', role: UserRole.VENDEUR };
    mockRepo.findOne.mockResolvedValue({ id: '1', storeId: 'other' });
    mockStoreService.findByOwnerId.mockResolvedValue({ id: 'store-v1' });
    await expect(
      service.update('1', { name: 'New' }, vendorUser as any),
    ).rejects.toThrow('Vous ne pouvez modifier que vos propres catégories');
  });

  it('should remove a category as admin', async () => {
    mockRepo.findOne.mockResolvedValue({ id: '1', storeId: 'store-1' });
    mockRepo.softDelete.mockResolvedValue(undefined);
    await service.remove('1', mockAdmin);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('1');
  });

  it('should throw NotFoundException on remove if missing', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.remove('1', mockAdmin)).rejects.toThrow(
      'Catégorie non trouvée',
    );
  });

  it('should allow vendor to remove their own category', async () => {
    const vendorUser = { userId: 'v-1', role: UserRole.VENDEUR };
    mockRepo.findOne.mockResolvedValue({ id: '1', storeId: 'store-v1' });
    mockStoreService.findByOwnerId.mockResolvedValue({ id: 'store-v1' });
    await service.remove('1', vendorUser as any);
    expect(mockRepo.softDelete).toHaveBeenCalled();
  });

  it('should forbid vendor from removing other category', async () => {
    const vendorUser = { userId: 'v-1', role: UserRole.VENDEUR };
    mockRepo.findOne.mockResolvedValue({ id: '1', storeId: 'other' });
    mockStoreService.findByOwnerId.mockResolvedValue({ id: 'store-v1' });
    await expect(service.remove('1', vendorUser as any)).rejects.toThrow(
      'Vous ne pouvez supprimer que vos propres catégories',
    );
  });
});
