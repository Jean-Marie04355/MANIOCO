import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import type { IHasher } from '../interfaces/hasher.interface';
import { UserRole } from 'src/common/enum/role.enum';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject('HASHER_PROVIDER')
    private readonly hasher: IHasher,
  ) {}

  findAll() {
    return this.userRepository.find();
  }

 async create(createUserDto: CreateUserDto) {
  // Check if trying to create an admin
  if (createUserDto.role === UserRole.ADMIN) {
  const existingAdmin = await this.userRepository.findOneBy({ role: UserRole.ADMIN });
  if (existingAdmin) {
    throw new Error('Only one admin is allowed!');
  }
}

  const hashedPassword = await this.hasher.hash(createUserDto.password);

  const user = this.userRepository.create({
    ...createUserDto,
    password: hashedPassword,
  });

  return this.userRepository.save(user);
}

findOne(id: number) {
  return this.userRepository.findOneBy({ id });
}

remove(id: number) {
  return this.userRepository.delete(id);
}

async update(id: number, updateUserDto: Partial<CreateUserDto>) {
  if (updateUserDto.password) {
    updateUserDto.password = await this.hasher.hash(updateUserDto.password);
  }

  return this.userRepository.update(id, updateUserDto);
}

}