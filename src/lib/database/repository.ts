import { Repository, DeepPartial } from 'typeorm';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Inject } from '@nestjs/common';

export class AbstractRepository<T extends { id: any }> implements IBaseRepository<T> {
  constructor(@Inject('DATABASE_REPOSITORY')
        private readonly repo: IBaseRepository<T>,) {}

  find(options: any): Promise<T[]> {
    return this.repo.find(options);
  }

  findOne(criteria: Partial<T>): Promise<T | null> {
    return this.repo.findOne({ where: criteria });
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create(data as any);
    return await this.repo.save(entity as any);
  }

  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    const entities = (this.repo as any).create(data);
    return await (this.repo as any).save(entities);
  }

  async update(id: string | number, data: DeepPartial<T>): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: string | number): Promise<void> {
    await this.repo.delete(id);
  }

  count(criteria?: Partial<T>): Promise<number> {
    return this.repo.count({ where: criteria });
  }

  save(entity: T): Promise<T> {
    return this.repo.save(entity);
  }
}