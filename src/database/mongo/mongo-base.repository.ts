import { IBaseRepository } from '../interfaces/base-repository.interface';
import { Model, Document } from 'mongoose';

export class MongoBaseRepository<T extends Document> implements IBaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  findAll(): Promise<T[]> {
    return this.model.find().exec();
  }

  findById(id: any): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  findOneBy(criteria: any): Promise<T | null> {
    return this.model.findOne(criteria).exec();
  }

  async create(data: any): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async update(id: any, data: any): Promise<void> {
    await this.model.findByIdAndUpdate(id, data).exec();
  }

  async delete(id: any): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }
}