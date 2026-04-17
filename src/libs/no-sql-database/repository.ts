/* eslint-disable @typescript-eslint/require-await */
import { Model, Document } from 'mongoose';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

export class NoSqlRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly repo: Model<T & Document>) {}

  async find(filter?: any): Promise<T[]> {
    const safeFilter = filter && typeof filter === 'object' ? { ...filter } : {};
    const query = { ...safeFilter, deletedAt: null };
    if ('id' in query && query.id) {
      query._id = query.id;
      delete query.id;
    }
    return this.repo.find(query).exec();
  }

  async findOne(filter: any): Promise<T | null> {
    const safeFilter = filter && typeof filter === 'object' ? { ...filter } : {};
    const query = { ...safeFilter, deletedAt: null };
    if ('id' in query && query.id) {
      query._id = query.id;
      delete query.id;
    }
    return this.repo.findOne(query).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const preparedData = { ...data } as any;
    
    // Auto-map SQL-style relation IDs to Mongoose relation fields
    if (preparedData.categoryId && !preparedData.category) {
      preparedData.category = preparedData.categoryId;
    }
    
    const doc = new this.repo(preparedData);
    return doc.save();
  }

  async save(entity: T & Document): Promise<T> {
    return entity.save();
  }

  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    const preparedData = { ...data } as any;

    // Auto-map SQL-style relation IDs to Mongoose relation fields
    if (preparedData.categoryId && !preparedData.category) {
      preparedData.category = preparedData.categoryId;
    }

    return this.repo
      .findByIdAndUpdate(id, preparedData as object, { new: true })
      .exec();
  }

  async delete(id: string | number): Promise<void> {
    await this.repo.deleteOne({ _id: id } as object).exec();
  }

  async count(filter?: any): Promise<number> {
    const safeFilter = filter && typeof filter === 'object' ? { ...filter } : {};
    const query = { ...safeFilter, deletedAt: null };
    if ('id' in query && query.id) {
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
