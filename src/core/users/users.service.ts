import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from 'src/common/enum/role.enum';
import { User } from './user.entity';
import { IBaseRepository } from '../../database';
import { hashPassword } from '../../common/helpers/hash.helper';

@Injectable()
export class UsersService {

  /**
   * Find a user by email
   */
  async findByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  constructor(
    @Inject('USER_REPOSITORY') private userRepository: IBaseRepository<User>,
  ) {}

  /**
   * Fetch all users
   */
  findAll() {
    return this.userRepository.findAll();
  }

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto) {
    // 1. Check for unique email
    const existing = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (existing) {
      throw new ConflictException('This email is already in use.');
    }

    // 2. Hash password using helper
    const hashedPassword = await hashPassword(createUserDto.password);

    // 3. Create via abstract Repository
    return this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  /**
   * Find a user by ID
   */
  async findOne(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  /**
   * Delete a user
   */
  async remove(id: number) {
    await this.findOne(id); // Check existence
    return this.userRepository.delete(id);
  }

  /**
   * Update a user
   */
  async update(id: number, updateUserDto: Partial<CreateUserDto>) {
    await this.findOne(id); // Check existence

    if (updateUserDto.password) {
      updateUserDto.password = await hashPassword(updateUserDto.password);
    }

    return this.userRepository.update(id, updateUserDto);
  }
}