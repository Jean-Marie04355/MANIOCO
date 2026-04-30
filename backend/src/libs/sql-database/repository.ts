import { Repository, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

export class SqlRepository<T extends { id: string | number }>
  implements IBaseRepository<T>
{
  constructor(protected readonly repo: Repository<T>) {}

  find(options?: object): Promise<T[]> {
    return this.repo.find(options as FindManyOptions<T>);
  }

  findOne(criteria: any): Promise<T | null> {
    const options: any = {};
    
    // Si criteria contient des options TypeORM connues
    if (criteria.where || criteria.relations || criteria.order || criteria.select) {
      options.where = criteria.where;
      options.relations = criteria.relations;
      options.order = criteria.order;
      options.select = criteria.select;
      options.withDeleted = !!criteria.withDeleted;

      // Si criteria contient aussi d'autres champs à la racine (comme 'id'), 
      // et que 'where' n'est pas défini, on les utilise comme 'where'
      if (!options.where) {
        const { relations, withDeleted, order, select, ...where } = criteria;
        options.where = where as FindOptionsWhere<T>;
      }
    } else {
      // Sinon on traite criteria comme l'objet 'where'
      const { relations, withDeleted, order, select, ...where } = criteria;
      options.where = where as FindOptionsWhere<T>;
      options.relations = relations;
      options.order = order;
      options.select = select;
      options.withDeleted = !!withDeleted;
    }

    return this.repo.findOne(options);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repo.create(data as object as T);
    return await this.repo.save(entity);
  }

  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    const existing = await this.findOne({ id } as object);
    if (!existing) return null;
    const updated = Object.assign(existing, data);
    return await this.repo.save(updated);
  }

  async delete(id: string | number): Promise<void> {
    await this.repo.delete(id);
  }

  async count(options?: object): Promise<number> {
    return this.repo.count(options as FindManyOptions<T>);
  }

  async softDelete(id: string | number): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string | number): Promise<void> {
    await this.repo.restore(id);
  }

  save(entity: T): Promise<T> {
    return this.repo.save(entity);
  }
}
