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
  storeModel: any;
  constructor(
    @Inject('STORE_REPOSITORY')
    private readonly storeRepository: IBaseRepository<Store>,

    @Inject('USER_REPOSITORY')
    private readonly userRepository: IBaseRepository<any>,
    private readonly configService: ConfigService,
  ) { }

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
    } catch (error) {
      throw new NotFoundException(`User with ID ${ownerId} not found or invalid format.`);
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
  async findAll() {
    return this.storeRepository.find();
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

