import { Repository, DeepPartial } from 'typeorm';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

export class SqlRepository<
  T extends { id: any },
> implements IBaseRepository<T> {
  constructor(protected readonly repo: Repository<T>) {}

  find(options?: any): Promise<T[]> {
    return this.repo.find(options);
  }

  findOne(criteria: any): Promise<T | null> {
    return this.repo.findOne({ where: criteria });
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async update(id: any, data: any): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: any): Promise<void> {
    await this.repo.delete(id);
  }

  async count(options?: any): Promise<number> {
    return this.repo.count(options);
  }

  async softDelete(id: any): Promise<void> {
    await this.repo.softDelete(id);
  }

  save(entity: T): Promise<T> {
    return this.repo.save(entity);
  }
}
