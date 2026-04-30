import { Inject } from '@nestjs/common';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

export class AbstractRepository<
  T extends { id: string | number },
> implements IBaseRepository<T> {
  constructor(
    @Inject('DATABASE_REPOSITORY')
    private readonly repo: IBaseRepository<T>,
  ) {}

  find(options?: object): Promise<T[]> {
    return this.repo.find(options);
  }

  findOne(criteria: object): Promise<T | null> {
    return this.repo.findOne(criteria);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = await this.repo.create(data);
    return await this.repo.save(entity);
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const entities: T[] = [];
    for (const item of data) {
      const entity = await this.repo.create(item);
      const savedEntity = await this.repo.save(entity);
      entities.push(savedEntity);
    }
    return entities;
  }

  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    return this.repo.update(id, data);
  }

  async delete(id: string | number): Promise<void> {
    await this.repo.delete(id);
  }

  count(criteria?: object): Promise<number> {
    return this.repo.count(criteria);
  }

  async softDelete(id: string | number): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string | number): Promise<void> {
    await this.repo.restore(id);
  }

  save(entity: T): Promise<T> {
    return this.repo.save(entity);
  }
}
