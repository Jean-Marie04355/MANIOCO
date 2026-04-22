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
        owner = await this.userRepository.findOne({ id: ownerId });
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
    return this.storeRepository.create(createStoreDto);
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
    };
  }

  async findAll(city?: string) {
    let stores;
    if (city) {
      stores = await this.storeRepository.find({ city });
    } else {
      stores = await this.storeRepository.find();
    }
    return stores.map((s) => this.mapToPublic(s));
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
    const store = await this.storeRepository.findOne({ id });
    if (!store) throw new NotFoundException(`Store with ID ${id} not found`);
    return store;
  }

  async update(id: string, updateStoreDto: Partial<CreateStoreDto>) {
    await this.findOne(id);
    return this.storeRepository.update(id, updateStoreDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.storeRepository.delete(id);
  }
}
