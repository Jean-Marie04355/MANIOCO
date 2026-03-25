import { Model, Document, Types } from 'mongoose';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';

export class NoSqlRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly repo: Model<T & Document>) {}

  // 🔹 Récupérer un document par filtre
  async findOne(filter: Partial<T>): Promise<T | null> {
    return this.repo.findOne(filter as any).exec();
  }

  // 🔹 Récupérer plusieurs documents
  async find(filter?: Partial<T>): Promise<T[]> {
    return this.repo.find(filter || {}).exec();
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
  async update(id: string, data: any): Promise<void> {
    await this.repo.findByIdAndUpdate(id, data).exec();
  }

  // 🔹 Supprimer un document par id
  async delete(id: string): Promise<void> {
    await this.repo.deleteOne({ _id: new Types.ObjectId(id) }).exec();
  }

  // 🔹 Compter les documents
  async count(filter?: Partial<T>): Promise<number> {
    return this.repo.countDocuments(filter || {}).exec();
  }
}