/* eslint-disable @typescript-eslint/require-await */
import { Model, Document } from 'mongoose';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

export class NoSqlRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly repo: Model<T & Document>) {}

  async find(filter?: object): Promise<T[]> {
    return this.repo.find(filter || {}).exec();
  }

  async findOne(filter: object): Promise<T | null> {
    return this.repo.findOne(filter).exec();
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

  async count(filter?: object): Promise<number> {
    return this.repo.countDocuments(filter || {}).exec();
  }

  async softDelete(id: string | number): Promise<void> {
    await this.repo
      .findByIdAndUpdate(id, { deletedAt: new Date() } as object)
      .exec();
  }
}
