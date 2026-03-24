import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import type { IHasher } from '../interfaces/hasher.interface';
import { UserRole } from 'src/common/enum/role.enum';
import type { IUserRepository } from '../interfaces/user-repository.interface';

@Injectable()
export class UsersService {

  /**
   * Find a user by email
   */
  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: IUserRepository,
    @Inject('HASHER_PROVIDER')
    private readonly hasher: IHasher,
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
    const existing = await this.userRepository.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('This email is already in use.');
    }

    // 2. Hash password using abstract Hasher
    const hashedPassword = await this.hasher.hash(createUserDto.password);

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
      updateUserDto.password = await this.hasher.hash(updateUserDto.password);
    }

    return this.userRepository.update(id, updateUserDto);
  }
}