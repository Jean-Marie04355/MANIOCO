import { Injectable, Inject } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject('CATEGORY_REPOSITORY')
    private readonly repo: IBaseRepository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.repo.create(createCategoryDto as any);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    return this.repo.findOne({ id } as any);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.repo.update(id, updateCategoryDto as any);
  }

  async remove(id: string) {
    return this.repo.softDelete(id);
  }
}
