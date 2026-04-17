// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IBaseRepository<T> {
  find(options?: object): Promise<T[]>;
  findOne(criteria: object): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string | number, data: Partial<T>): Promise<T | null>;
  delete(id: string | number): Promise<void>;
  count(options?: object): Promise<number>;
  softDelete(id: string | number): Promise<void>;
  save(entity: T): Promise<T>;
}
