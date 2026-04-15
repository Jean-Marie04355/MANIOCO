/* eslint-disable @typescript-eslint/require-await */
import { Model, Document } from 'mongoose';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

export class NoSqlRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly repo: Model<T & Document>) {}

  async find(filter?: any): Promise<T[]> {
    const query = { ...(filter || {}) };
    if (query.id) {
      query._id = query.id;
      delete query.id;
    }
    return this.repo.find(query).exec();
  }

  async findOne(filter: any): Promise<T | null> {
    const query = { ...filter };
    if (query.id) {
      query._id = query.id;
      delete query.id;
    }
    return this.repo.findOne(query).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.repo(data);
    return doc.save();
  }

  async save(entity: T & Document): Promise<T> {
    return entity.save();
  }

  async update(id: string | number, data: Partial<T>): Promise<void> {
    await this.repo.findByIdAndUpdate(id, data as object).exec();
  }

  async delete(id: string | number): Promise<void> {
    await this.repo.deleteOne({ _id: id } as object).exec();
  }

  async count(filter?: any): Promise<number> {
    const query = { ...(filter || {}) };
    if (query.id) {
      query._id = query.id;
      delete query.id;
    }
    return this.repo.countDocuments(query).exec();
  }

  async softDelete(id: string | number): Promise<void> {
    await this.repo
      .findByIdAndUpdate(id, { deletedAt: new Date() } as object)
      .exec();
  }
}
