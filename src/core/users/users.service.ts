import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { hashPassword } from '../../common/helpers/hash.helper';
import { UserRole } from '../../common/enum/role.enum';
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

    // Check how many users already exist
    const userCount = await this.userRepository.count();
    
    // Logic: First registered user becomes ADMIN
    // Every other user becomes whatever is in the DTO (default to CLIENT)
    let finalRole = createUserDto.role ?? UserRole.CLIENT;

    if (userCount === 0) {
      finalRole = UserRole.ADMIN;
    }

    const hashedPassword = await hashPassword(createUserDto.password);
    const newUser = await this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: finalRole,
    });

    return {
      name: newUser.name,
      email: newUser.email,
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.userRepository.softDelete(id);
  }

  async update(id: string, updateUserDto: Partial<CreateUserDto>) {
    await this.findOne(id);
    if (updateUserDto.password) {
      updateUserDto.password = await hashPassword(updateUserDto.password);
    }
    return this.userRepository.update(id, updateUserDto);
  }
}
