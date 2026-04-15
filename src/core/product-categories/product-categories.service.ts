import { Injectable, Inject } from '@nestjs/common';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';
import { ProductCategory } from './product-category.entity';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @Inject('PRODUCT_CATEGORY_REPOSITORY')
    private readonly repo: IBaseRepository<ProductCategory>,
  ) {}

  async create(createDto: CreateProductCategoryDto) {
    return this.repo.create(createDto);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    return this.repo.findOne({ id } as object);
  }

  async update(id: string, updateDto: UpdateProductCategoryDto) {
    return this.repo.update(id, updateDto);
  }

  async remove(id: string) {
    return this.repo.softDelete(id);
  }
}
