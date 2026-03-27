import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { hashPassword } from '../../common/helpers/hash.helper';
import { IBaseRepository } from '../../database/index';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: IBaseRepository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.userRepository.findOne({ email });
  }

  async findAll() {
    return this.userRepository.find();
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('This email is already in use.');
    }

    const hashedPassword = await hashPassword(createUserDto.password);
    return this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.userRepository.delete(id);
  }

  async update(id: number, updateUserDto: Partial<CreateUserDto>) {
    await this.findOne(id);
    if (updateUserDto.password) {
      updateUserDto.password = await hashPassword(updateUserDto.password);
    }
    return this.userRepository.update(id, updateUserDto);
  }
}
