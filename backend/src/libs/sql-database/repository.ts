import { Repository, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

export class SqlRepository<
  T extends { id: string | number },
> implements IBaseRepository<T> {
  constructor(protected readonly repo: Repository<T>) {}

  find(options?: object): Promise<T[]> {
    if (!options) return this.repo.find();

    // Si l'objet contient déjà des clés d'options TypeORM (autre que withDeleted)
    const { withDeleted, ...rest } = options as any;
    const isFullOptions = Object.keys(rest).some(key => 
      ['where', 'relations', 'select', 'order', 'take', 'skip'].includes(key)
    );

    if (isFullOptions) {
      return this.repo.find(options as FindManyOptions<T>);
    }

    // Sinon, on traite comme un critère simple (where)
    return this.repo.find({ 
      where: rest as FindOptionsWhere<T>,
      withDeleted: !!withDeleted
    });
  }

  findOne(criteria: any): Promise<T | null> {
    if (!criteria) return this.repo.findOne({ where: {} as any });

    const options: any = {};
    
    // Si criteria contient déjà des options TypeORM connues
    if (criteria.where || criteria.relations || criteria.order || criteria.select || criteria.take || criteria.skip) {
      options.where = criteria.where;
      options.relations = criteria.relations;
      options.order = criteria.order;
      options.select = criteria.select;
      options.take = criteria.take;
      options.skip = criteria.skip;
      options.withDeleted = !!criteria.withDeleted;

      // Si criteria contient aussi d'autres champs à la racine (comme 'id'), 
      // et que 'where' n'est pas défini, on les utilise comme 'where'
      if (!options.where) {
        const { relations, withDeleted, order, select, take, skip, ...where } = criteria;
        if (Object.keys(where).length > 0) {
          options.where = where as FindOptionsWhere<T>;
        }
      }
    } else {
      // Sinon on traite criteria comme l'objet 'where'
      const { relations, withDeleted, order, select, take, skip, ...where } = criteria;
      options.where = where as FindOptionsWhere<T>;
      options.relations = relations;
      options.order = order;
      options.select = select;
      options.take = take;
      options.skip = skip;
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
