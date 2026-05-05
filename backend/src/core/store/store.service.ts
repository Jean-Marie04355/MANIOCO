import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateStoreDto } from './dto/create-store.dto';
import { Store } from './store.entity';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Types } from 'mongoose';
import { LocationService } from '../../core/location/location.service';
import { CacheService } from '../../libs/cache/cache.service';

const STORES_CACHE_KEY = 'all_stores';
const STORE_DETAIL_CACHE_KEY = 'store_detail_';
const STORE_OWNER_CACHE_KEY = 'store_owner_';
const STORES_CITIES_CACHE_KEY = 'store_cities';

import { User } from '../users/user.entity';

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    @Inject('STORE_REPOSITORY')
    private readonly storeRepository: IBaseRepository<Store>,

    @Inject('USER_REPOSITORY')
    private readonly userRepository: IBaseRepository<User>,
    private readonly configService: ConfigService,
    private readonly locationService: LocationService,
    private readonly cache: CacheService,
  ) {}

  async create(createStoreDto: CreateStoreDto) {
    const { ownerId } = createStoreDto;

    let owner;
    try {
      if (this.configService.get('DB_TYPE') === 'mongodb') {
        owner = await this.userRepository.findOne({
          _id: new Types.ObjectId(ownerId),
        });
      } else {
        owner = await this.userRepository.findOne({ id: ownerId } as object);
      }
    } catch (_error) {
      if (_error instanceof Error) {
        this.logger.error(`Error looking for user: ${_error.message}`);
      }
      throw new NotFoundException(
        `User with ID ${ownerId} not found or invalid format.`,
      );
    }

    if (!owner)
      throw new NotFoundException(`User with ID ${ownerId} not found.`);

    if (owner.role !== 'vendeur' && owner.role !== 'admin') {
      throw new ConflictException(
        'Only users with role "vendeur" or "admin" can create a store.',
      );
    }
    const store = await this.storeRepository.create({
      ...createStoreDto,
      ownerId: owner.id, 
    });
    await this.cache.del(STORES_CACHE_KEY);
    await this.cache.del(STORES_CITIES_CACHE_KEY);
    return store;
  }

  private mapToPublic(store: Store) {
    return {
      id: store.id,
      name: store.name,
      profilePhoto: store.profilePhoto,
      description: store.description,
      latitude: store.latitude,
      longitude: store.longitude,
      address: store.address,
      city: store.city,
      phone: store.phone,
      ownerId: store.ownerId,
      payoutAccountId: store.payoutAccountId,
    };
  }

  async findAll(city?: string) {
    let stores: Store[];
    
    // Check Cache for ALL stores
    const cached = await this.cache.get<Store[]>(STORES_CACHE_KEY);
    if (cached) {
      stores = cached;
    } else {
      stores = await this.storeRepository.find();
      await this.cache.set(STORES_CACHE_KEY, stores, { ttlSeconds: 3600 });
    }

    if (city) {
      stores = stores.filter(s => s.city === city);
    }
    
    return stores.map((s) => this.mapToPublic(s));
  }

  async findUniqueCities(): Promise<string[]> {
    const cached = await this.cache.get<string[]>(STORES_CITIES_CACHE_KEY);
    if (cached) return cached;

    const stores = await this.storeRepository.find();
    const cities = Array.from(new Set(stores.map(s => s.city).filter(Boolean))) as string[];
    
    await this.cache.set(STORES_CITIES_CACHE_KEY, cities, { ttlSeconds: 3600 * 24 }); // Cache for 24h
    return cities;
  }

  async findNearby(lat: number, lng: number, radiusKm: number = 10) {
    const allStores = await this.storeRepository.find();

    return allStores
      .map((store) => {
        if (!store.latitude || !store.longitude) return null;

        const distance = this.locationService.getDistance(
          lat,
          lng,
          store.latitude,
          store.longitude,
        );

        return {
          ...this.mapToPublic(store),
          distance: Math.round(distance * 100) / 100,
        };
      })
      .filter((store) => store !== null && store.distance <= radiusKm)
      .sort((a, b) => (a?.distance || 0) - (b?.distance || 0));
  }

  async getDeliveryFee(id: string, clientLat: number, clientLng: number) {
    const store = await this.findOne(id);

    if (!store.latitude || !store.longitude) {
      return {
        distance: null,
        fee: 1000, // Tarif forfaitaire si le magasin n'a pas de GPS
        message: 'Store GPS missing, using flat rate',
      };
    }

    const distance = this.locationService.getDistance(
      clientLat,
      clientLng,
      store.latitude,
      store.longitude,
    );
    const totalFee = this.locationService.calculateDeliveryFee(distance);

    return {
      distance: Math.round(distance * 100) / 100, // Arrondi à 2 décimales
      fee: totalFee,
      currency: 'FCFA',
    };
  }

  async findOne(id: string) {
    const cacheKey = `${STORE_DETAIL_CACHE_KEY}${id}`;
    const cached = await this.cache.get<Store>(cacheKey);
    if (cached) return cached;

    const store = await this.storeRepository.findOne({ id } as object);
    if (!store) throw new NotFoundException(`Store with ID ${id} not found`);
    
    await this.cache.set(cacheKey, store, { ttlSeconds: 3600 });
    return store;
  }

  async update(id: string, updateStoreDto: Partial<CreateStoreDto>) {
    await this.findOne(id);
    const result = await this.storeRepository.update(id, updateStoreDto);
    await this.cache.del(STORES_CACHE_KEY);
    await this.cache.del(STORES_CITIES_CACHE_KEY);
    await this.cache.del(`${STORE_DETAIL_CACHE_KEY}${id}`);
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    const store = await this.findOne(id);
    const result = await this.storeRepository.delete(id);
    await this.cache.del(STORES_CACHE_KEY);
    await this.cache.del(STORES_CITIES_CACHE_KEY);
    await this.cache.del(`${STORE_DETAIL_CACHE_KEY}${id}`);
    await this.cache.del(`${STORE_OWNER_CACHE_KEY}${store.ownerId}`);
    return result;
  }

  async findByOwnerId(ownerId: string) {
    const cacheKey = `${STORE_OWNER_CACHE_KEY}${ownerId}`;
    const cached = await this.cache.get<Store>(cacheKey);
    if (cached) return cached;

    const store = await this.storeRepository.findOne({ ownerId } as object);
    if (!store)
      throw new NotFoundException(
        `Store for user with ID ${ownerId} not found.`,
      );
    
    await this.cache.set(cacheKey, store, { ttlSeconds: 3600 });
    return store;
  }
}
