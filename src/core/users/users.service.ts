import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { hashPassword } from '../../common/helpers/hash.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { IBaseRepository } from '../../database';

@Injectable()
export class UsersService {
  private isMongo: boolean;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(User)
    private readonly sqlRepository: Repository<User>,

    @Inject('USER_REPOSITORY')
    private readonly mongoRepository: IBaseRepository<any>,
  ) {
    this.isMongo = this.configService.get<string>('DB_TYPE') === 'mongodb';
  }

  private get repo() {
    return this.isMongo ? this.mongoRepository : this.sqlRepository;
  }

  async findByEmail(email: string) {
    if (this.isMongo) {
      return this.mongoRepository.findOneBy({ email });
    }
    return this.sqlRepository.findOneBy({ email });
  }

  async findAll() {
    if (this.isMongo) {
      return this.mongoRepository.findAll();
    }
    return this.sqlRepository.find();
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.findByEmail(createUserDto.email);

    if (existing) {
      throw new ConflictException('This email is already in use.');
    }

    const hashedPassword = await hashPassword(createUserDto.password);

    if (this.isMongo) {
      return this.mongoRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });
    }

    return this.sqlRepository.save({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async findOne(id: number) {
    let user;

    if (this.isMongo) {
      user = await this.mongoRepository.findById(id);
    } else {
      user = await this.sqlRepository.findOneBy({ id });
    }

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    return user;
  }

  async remove(id: number) {
    await this.findOne(id);

    if (this.isMongo) {
      return this.mongoRepository.delete(id);
    }

    return this.sqlRepository.delete(id);
  }

  async update(id: number, updateUserDto: Partial<CreateUserDto>) {
    await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await hashPassword(
        updateUserDto.password,
      );
    }

    if (this.isMongo) {
      return this.mongoRepository.update(id, updateUserDto);
    }

    return this.sqlRepository.update(id, updateUserDto);
  }
}