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

  findOne(options: any): Promise<T | null> {
    if (!options) return this.repo.findOne({ where: {} as any });

    // Si l'objet contient déjà des clés d'options TypeORM, on le passe tel quel
    if (options.where || options.relations || options.select || options.order || options.take || options.skip) {
      return this.repo.findOne(options as FindManyOptions<T>);
    }

    // Sinon, on traite comme un critère simple (comportement d'origine)
    const { withDeleted, ...where } = options;
    return this.repo.findOne({ 
      where: where as FindOptionsWhere<T>,
      withDeleted: !!withDeleted,
    });
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
