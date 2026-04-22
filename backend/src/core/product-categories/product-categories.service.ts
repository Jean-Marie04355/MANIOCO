import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';
import { ProductCategory } from './product-category.entity';
import { StoreService } from '../store/store.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../../common/enum/role.enum';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @Inject('PRODUCT_CATEGORY_REPOSITORY')
    private readonly repo: IBaseRepository<ProductCategory>,
    private readonly storeService: StoreService,
  ) {}

  async create(createDto: CreateProductCategoryDto, user: AuthenticatedUser) {
    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      createDto.storeId = store.id;
    }
    return this.repo.create(createDto);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    return this.repo.findOne({ id } as object);
  }

  async update(id: string, updateDto: UpdateProductCategoryDto, user: AuthenticatedUser) {
    const category = await this.findOne(id);
    if (!category) throw new NotFoundException('Catégorie non trouvée');

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (category.storeId !== store.id) {
        throw new ForbiddenException('Vous ne pouvez modifier que vos propres catégories');
      }
    }
    return this.repo.update(id, updateDto);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const category = await this.findOne(id);
    if (!category) throw new NotFoundException('Catégorie non trouvée');

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (category.storeId !== store.id) {
        throw new ForbiddenException('Vous ne pouvez supprimer que vos propres catégories');
      }
    }
    return this.repo.softDelete(id);
  }
}
