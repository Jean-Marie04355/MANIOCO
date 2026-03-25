import { Repository, DeepPartial } from 'typeorm';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

export class SqlRepository<T extends { id: any }> implements IBaseRepository {
  constructor(protected readonly repo: Repository<T>) {}

  findAll(): Promise<T[]> {
    return this.repo.find();
  }

  findById(id: any): Promise<T | null> {
    return this.repo.findOneBy({ id } as any);
  }

  findOneBy(criteria: any): Promise<T | null> {
    return this.repo.findOneBy(criteria);
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
}