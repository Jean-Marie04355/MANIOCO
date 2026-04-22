import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategoriesService } from './product-categories.service';

const mockRepo = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('ProductCategoriesService', () => {
  let service: ProductCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCategoriesService,
        {
          provide: 'PRODUCT_CATEGORY_REPOSITORY',
          useValue: mockRepo,
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

  it('should create a category', async () => {
    const dto = { name: 'Test' };
    mockRepo.create.mockResolvedValue(dto);
    const result = await service.create(dto as any);
    expect(result).toEqual(dto);
    expect(mockRepo.create).toHaveBeenCalledWith(dto);
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

  it('should update a category', async () => {
    const dto = { name: 'Test2' };
    mockRepo.update.mockResolvedValue(dto);
    const result = await service.update('1', dto);
    expect(result).toEqual(dto);
    expect(mockRepo.update).toHaveBeenCalledWith('1', dto);
  });

  it('should remove a category', async () => {
    mockRepo.softDelete.mockResolvedValue(undefined);
    await service.remove('1');
    expect(mockRepo.softDelete).toHaveBeenCalledWith('1');
  });
});
