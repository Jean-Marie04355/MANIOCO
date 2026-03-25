export interface IBaseRepository {
  findAll(): Promise< any[]>;
  findById(id: any): Promise<any | null>;
  findOneBy(criteria: any): Promise<any | null>;
  create(data: any): Promise<any>;
  update(id: any, data: any): Promise<void>;
  delete(id: any): Promise<void>;
}