export interface IBaseRepository<T> {
  find(options?: any): Promise<T[]>;
  findOne(criteria: any): Promise<T | null>;
  create(data: any): Promise<T>;
  update(id: any, data: any): Promise<void>;
  delete(id: any): Promise<void>;
  count(options?: any): Promise<number>;
  softDelete(id: any): Promise<void>;
  save(entity: T): Promise<T>;
}
