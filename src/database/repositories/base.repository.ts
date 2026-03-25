import { Repository } from 'typeorm';
import { Model, Document } from 'mongoose';

export class BaseRepository<T extends object> {
  private typeOrmRepo?: Repository<T>;
  private mongoModel?: Model<T & Document>;

  constructor(options: { typeOrmRepo?: Repository<T>; mongoModel?: Model<T & Document> }) {
    this.typeOrmRepo = options.typeOrmRepo;
    this.mongoModel = options.mongoModel;
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    if (this.typeOrmRepo) {
      return this.typeOrmRepo.findOneBy(filter as any); 
    }
    if (this.mongoModel) {
      return this.mongoModel.findOne(filter as any).exec();
    }
    return null;
  }

  async findAll(): Promise<T[]> {
    if (this.typeOrmRepo) return this.typeOrmRepo.find();
    if (this.mongoModel) return this.mongoModel.find().exec();
    return [];
  }

  async save(entity: T): Promise<T> {
    if (this.typeOrmRepo) return this.typeOrmRepo.save(entity);
    if (this.mongoModel) {
      const doc = new this.mongoModel(entity);
      return doc.save();
    }
    throw new Error('No database configured');
  }
}