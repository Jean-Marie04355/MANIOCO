import { Repository, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

export class SqlRepository<T extends { id: string | number }>
  implements IBaseRepository<T>
{
  constructor(protected readonly repo: Repository<T>) {}

  find(options?: object): Promise<T[]> {
    return this.repo.find(options as FindManyOptions<T>);
  }

  findOne(criteria: object): Promise<T | null> {
    return this.repo.findOne({ where: criteria as FindOptionsWhere<T> });
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repo.create(data as object as T);
    return await this.repo.save(entity);
  }

  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    const existing = await this.findOne({ id } as object);
    if (!existing) return null;
    const updated = Object.assign(existing, data);
    return await this.repo.save(updated);
  }

  async delete(id: string | number): Promise<void> {
    await this.repo.delete(id);
  }

  async count(options?: object): Promise<number> {
    return this.repo.count(options as FindManyOptions<T>);
  }

  async softDelete(id: string | number): Promise<void> {
    await this.repo.softDelete(id);
  }

  save(entity: T): Promise<T> {
    return this.repo.save(entity);
  }
}
