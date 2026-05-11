import { Test, TestingModule } from '@nestjs/testing';
import { StoreService } from './store.service';
import { ConfigService } from '@nestjs/config';
import { LocationService } from '../../core/location/location.service';
import { CacheService } from '../../libs/cache/cache.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('StoreService', () => {
  let service: StoreService;
  let storeRepoMock: any;
  let userRepoMock: any;
  let configServiceMock: any;
  let locationServiceMock: any;
  let cacheServiceMock: any;

  beforeEach(async () => {
    storeRepoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    userRepoMock = {
      findOne: jest.fn(),
    };
    configServiceMock = {
      get: jest.fn(),
    };
    locationServiceMock = {
      getDistance: jest.fn(),
      calculateDeliveryFee: jest.fn(),
    };
    cacheServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        { provide: 'STORE_REPOSITORY', useValue: storeRepoMock },
        { provide: 'USER_REPOSITORY', useValue: userRepoMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: LocationService, useValue: locationServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    service = module.get<StoreService>(StoreService);
  });

  describe('create', () => {
    it('should throw NotFoundException if owner not found', async () => {
      userRepoMock.findOne.mockResolvedValue(null);
      await expect(
        service.create({ ownerId: '1', name: 'Store' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if owner is not seller/admin', async () => {
      userRepoMock.findOne.mockResolvedValue({ id: '1', role: 'client' });
      await expect(
        service.create({ ownerId: '1', name: 'Store' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should create store if owner is seller', async () => {
      userRepoMock.findOne.mockResolvedValue({ id: '1', role: 'vendeur' });
      storeRepoMock.create.mockResolvedValue({ id: 's1' });
      const result = await service.create({
        ownerId: '1',
        name: 'Store',
      } as any);
      expect(result.id).toBe('s1');
    });

    it('should handle MongoDB object ID conversion if DB_TYPE is mongodb', async () => {
      configServiceMock.get.mockReturnValue('mongodb');
      userRepoMock.findOne.mockResolvedValue({ id: '1', role: 'vendeur' });
      await service.create({ ownerId: '60d5ec49eb39c223c896585d', name: 'Store' } as any);
      expect(userRepoMock.findOne).toHaveBeenCalled();
    });

    it('should log error and throw if user repo fails', async () => {
      userRepoMock.findOne.mockRejectedValue(new Error('DB Error'));
      await expect(service.create({ ownerId: '1', name: 'S' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return public mappings of all stores', async () => {
      const stores = [{ id: 's1', name: 'S1', city: 'C1' }];
      storeRepoMock.find.mockResolvedValue(stores);
      const result = await service.findAll();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('S1');
      expect(storeRepoMock.find).toHaveBeenCalledWith();
    });

    it('should filter stores by city in-memory', async () => {
      const stores = [
        { id: 's1', city: 'Cotonou', name: 'S1' },
        { id: 's2', city: 'Porto-Novo', name: 'S2' },
      ];
      cacheServiceMock.get.mockResolvedValue(null);
      storeRepoMock.find.mockResolvedValue(stores);
      const result = await service.findAll('Cotonou');
      expect(result.length).toBe(1);
      expect(result[0].city).toBe('Cotonou');
      expect(storeRepoMock.find).toHaveBeenCalledWith();
    });

    it('should return cached stores if present', async () => {
      const stores = [{ id: 's1', name: 'Cached' }];
      cacheServiceMock.get.mockResolvedValue(stores);
      const result = await service.findAll();
      expect(result[0].name).toBe('Cached');
      expect(storeRepoMock.find).not.toHaveBeenCalled();
    });
  });

  describe('findUniqueCities', () => {
    it('should return unique cities and cache them', async () => {
      const stores = [{ city: 'C1' }, { city: 'C2' }, { city: 'C1' }, { city: null }];
      cacheServiceMock.get.mockResolvedValue(null);
      storeRepoMock.find.mockResolvedValue(stores);
      
      const result = await service.findUniqueCities();
      expect(result).toEqual(['C1', 'C2']);
      expect(cacheServiceMock.set).toHaveBeenCalled();
    });

    it('should return cached cities if present', async () => {
      cacheServiceMock.get.mockResolvedValue(['C1']);
      const result = await service.findUniqueCities();
      expect(result).toEqual(['C1']);
      expect(storeRepoMock.find).not.toHaveBeenCalled();
    });
  });

  describe('findNearby', () => {
    it('should filter and sort stores by distance', async () => {
      const stores = [
        { id: 's1', latitude: 10, longitude: 10, name: 'S1' },
        { id: 's2', latitude: 20, longitude: 20, name: 'S2' },
      ];
      storeRepoMock.find.mockResolvedValue(stores);
      locationServiceMock.getDistance.mockImplementation(
        (la1, lo1, la2, lo2) => (la2 === 10 ? 5 : 50),
      );

      const result = await service.findNearby(0, 0, 10);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('s1');
    });

    it('should skip stores with missing GPS coordinates', async () => {
      const stores = [{ id: 's1', name: 'S1', latitude: null }];
      storeRepoMock.find.mockResolvedValue(stores);
      const result = await service.findNearby(0, 0, 10);
      expect(result.length).toBe(0);
    });
  });

  describe('getDeliveryFee', () => {
    it('should calculate fee based on distance', async () => {
      storeRepoMock.findOne.mockResolvedValue({
        id: 's1',
        latitude: 10,
        longitude: 10,
      });
      locationServiceMock.getDistance.mockReturnValue(5);
      locationServiceMock.calculateDeliveryFee.mockReturnValue(500);

      const result = await service.getDeliveryFee('s1', 0, 0);
      expect(result.fee).toBe(500);
      expect(result.distance).toBe(5);
    });

    it('should return flat rate if store GPS is missing', async () => {
      storeRepoMock.findOne.mockResolvedValue({ id: 's1', latitude: null });
      const result = await service.getDeliveryFee('s1', 0, 0);
      expect(result.fee).toBe(1000);
      expect(result.distance).toBeNull();
    });
  });

  describe('findOne/update/remove', () => {
    it('should throw NotFoundException if findOne fails', async () => {
      storeRepoMock.findOne.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });

    it('should update store', async () => {
      storeRepoMock.findOne.mockResolvedValue({ id: 's1' });
      await service.update('s1', { name: 'New' });
      expect(storeRepoMock.update).toHaveBeenCalled();
    });

    it('should remove store', async () => {
      storeRepoMock.findOne.mockResolvedValue({ id: 's1', ownerId: 'u1' });
      await service.remove('s1');
      expect(storeRepoMock.delete).toHaveBeenCalled();
      expect(cacheServiceMock.del).toHaveBeenCalled();
    });

    it('should return cached store in findOne', async () => {
      cacheServiceMock.get.mockResolvedValue({ id: 'cached' });
      const result = await service.findOne('1');
      expect(result.id).toBe('cached');
    });
  });

  describe('findByOwnerId', () => {
    it('should return store if found', async () => {
      const store = { id: 's1', ownerId: 'u1' };
      storeRepoMock.findOne.mockResolvedValue(store);
      const result = await service.findByOwnerId('u1');
      expect(result).toEqual(store);
    });

    it('should throw NotFoundException if not found', async () => {
      storeRepoMock.findOne.mockResolvedValue(null);
      await expect(service.findByOwnerId('u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
