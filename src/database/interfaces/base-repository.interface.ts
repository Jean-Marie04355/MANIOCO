export interface IBaseRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: any): Promise<T | null>;
  findOneBy(criteria: any): Promise<T | null>;
  create(data: any): Promise<T>;
  update(id: any, data: any): Promise<void>;
  delete(id: any): Promise<void>;
}