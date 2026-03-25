export interface IBaseRepository<T> {
  find(options: any): Promise<any | null>;
  findOne(criteria: any): Promise<any | null>;
  create(data: any): Promise<any>;
  update(id: any, data: any): Promise<void>;
  delete(id: any): Promise<void>;
  count(options: any): Promise<number>;
  save(entity: any): Promise<any>;
}