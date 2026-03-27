import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateStoreDto } from './dto/create-store.dto';
import { Store } from './store.entity';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';
import { Types } from 'mongoose';

@Injectable()
export class StoreService {
  constructor(
    @Inject('STORE_REPOSITORY')
    private readonly storeRepository: IBaseRepository<Store>,

    @Inject('USER_REPOSITORY')
    private readonly userRepository: IBaseRepository<any>,
    private readonly configService: ConfigService,
  ) {}

  async create(createStoreDto: CreateStoreDto) {
    const { ownerId, name, localisation, phone, description } = createStoreDto;

    let owner;
    if (this.configService.get('DB_TYPE') === 'mongodb') {
      owner = await this.userRepository.findOne({
        _id: new Types.ObjectId(ownerId),
      });
    } else {
      owner = await this.userRepository.findOne({ id: parseInt(ownerId, 10) });
    }

    if (!owner)
      throw new NotFoundException(`User with ID ${ownerId} not found.`);
    if (owner.role !== 'vendeur')
      throw new ConflictException(
        'Only users with role "vendeur" can create a store.',
      );

    return this.storeRepository.create({
      name,
      ownerId,
      localisation,
      phone,
      description,
    });
  }
  async findAll() {
    return this.storeRepository.find();
  }

  async findOne(id: number) {
    const store = await this.storeRepository.findOne({ id });
    if (!store) throw new NotFoundException(`Store with ID ${id} not found`);
    return store;
  }

  async update(id: number, updateStoreDto: Partial<CreateStoreDto>) {
    await this.findOne(id);
    return this.storeRepository.update(id, updateStoreDto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.storeRepository.delete(id);
  }
}
