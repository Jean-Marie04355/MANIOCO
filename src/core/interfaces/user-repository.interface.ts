import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/user.entity';

export interface IUserRepository {
  /**
   * Create a new user
   */
  create(data: CreateUserDto): Promise<User>;

  /**
   * Fetch all users
   */
  findAll(): Promise<User[]>;

  /**
   * Find a user by ID
   */
  findById(id: number): Promise<User | null>;

  /**
   * Find a user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Update a user
   */
  update(id: number, data: Partial<CreateUserDto>): Promise<void>;

  /**
   * Delete a user
   */
  delete(id: number): Promise<void>;
}
