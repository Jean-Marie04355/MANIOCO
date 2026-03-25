// src/core/users/repositories/typeorm-user.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';

@Injectable()
export class TypeOrmUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>, // Nest injecte la vraie connexion ici
  ) {}

  findAll() {
    return this.repo.find();
  }

  findById(id: number) {
    return this.repo.findOneBy({ id });
  }

  findOneBy(criteria: any) {
    return this.repo.findOneBy(criteria);
  }

  async create(data: any) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: any) {
    await this.repo.update(id, data);
  }

  async delete(id: number) {
    await this.repo.delete(id);
  }
}