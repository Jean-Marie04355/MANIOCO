import { Model, Document, Types } from 'mongoose';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';

export class NoSqlRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly repo: Model<T & Document>) {}

  // 🔹 Récupérer un document par filtre
  async find(filter?: any): Promise<T[]> {
    return this.repo.find(filter || {}).exec();
  }

  async findOne(filter: any): Promise<T | null> {
    return this.repo.findOne(filter).exec();
  }

  // 🔹 Créer un document
  async create(data: Partial<T>): Promise<T> {
    const doc = new this.repo(data);
    return doc.save();
  }

  // 🔹 Sauvegarder un document existant
  async save(entity: T & Document): Promise<T> {
    return (entity as any).save();
  }

  // 🔹 Mettre à jour un document par id
  async update(id: any, data: any): Promise<void> {
    await this.repo.findByIdAndUpdate(id, data).exec();
  }

  async delete(id: any): Promise<void> {
    await this.repo.deleteOne({ _id: id }).exec();
  }

  async count(filter?: any): Promise<number> {
    return this.repo.countDocuments(filter || {}).exec();
  }

  async softDelete(id: any): Promise<void> {
    await this.repo.findByIdAndUpdate(id, { deletedAt: new Date() }).exec();
  }
}