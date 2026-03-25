import { Repository } from 'typeorm';
import { Model, Document } from 'mongoose';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';

export class NoSqlRepository<T extends object> implements IBaseRepository {

 
    constructor(protected readonly repo: Model<T & Document>) {}


  async findOne(filter: Partial<T>): Promise<T | null> { 
      return this.repo.findOne(filter as any).exec();
    
    }

  async findAll(): Promise<T[]> {
    return this.repo.find().exec();
  }

  async save(entity: T): Promise<T> {
     
      const doc = new this.repo(entity);
      return doc.save();
    
  }
}