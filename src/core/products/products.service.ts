import { Injectable, Inject } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('PRODUCT_REPOSITORY')
    private readonly repo: IBaseRepository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    return this.repo.create(createProductDto as any);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    return this.repo.findOne({ id } as any);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return this.repo.update(id, updateProductDto as any);
  }

  async remove(id: string) {
    return this.repo.softDelete(id);
  }
}
