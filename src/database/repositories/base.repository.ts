import { IBaseRepository } from '../interfaces/base-repository.interface';

/**
 * Universal Mother Repository.
 * This single class handles both TypeORM (SQL) and Mongoose (NoSQL) logic
 * based on the engine passed to its constructor.
 */
export class BaseRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly engine: any) {}

  async findAll(): Promise<T[]> {
    // Both Mongoose and TypeORM have find()
    const result = this.engine.find();
    return result.exec ? result.exec() : result;
  }

  async findById(id: any): Promise<T | null> {
    // Mongoose has findById, TypeORM has findOneBy({id})
    if (this.engine.findById) {
      return this.engine.findById(id).exec();
    }
    return this.engine.findOneBy({ id } as any);
  }

  async findOneBy(criteria: any): Promise<T | null> {
    // Both have findOne (Mongoose) or findOneBy (TypeORM)
    if (this.engine.findOneBy) {
      return this.engine.findOneBy(criteria);
    }
    return this.engine.findOne(criteria).exec();
  }

  async create(data: any): Promise<T> {
    // Mongoose: new model(data).save(), TypeORM: repository.create(data) + repository.save()
    if (this.engine.create && typeof this.engine.create === 'function' && !this.engine.save) {
        // This is Mongoose where .create() is a shortcut or use new engine()
        return this.engine.create(data);
    }
    // TypeORM approach
    const entity = this.engine.create ? this.engine.create(data) : data;
    return this.engine.save ? this.engine.save(entity) : new this.engine(data).save();
  }

  async update(id: any, data: any): Promise<void> {
    if (this.engine.update) {
      await this.engine.update(id, data);
    } else {
      await this.engine.findByIdAndUpdate(id, data).exec();
    }
  }

  async delete(id: any): Promise<void> {
    if (this.engine.delete) {
      await this.engine.delete(id);
    } else {
      await this.engine.findByIdAndDelete(id).exec();
    }
  }
}
