import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enum/role.enum';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findAll() {
    return this.userRepository.find();
  }

 async create(createUserDto: CreateUserDto) {
  // Vérifie si on essaie de créer un admin
  if (createUserDto.role === UserRole.ADMIN) {
  const existingAdmin = await this.userRepository.findOneBy({ role: UserRole.ADMIN });
  if (existingAdmin) {
    throw new Error(' Un seul admin est autorisé !');
  }
}

  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

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
    updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
  }

  return this.userRepository.update(id, updateUserDto);
}

}