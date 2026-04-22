import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { StoreService } from '../store/store.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../../common/enum/role.enum';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('PRODUCT_REPOSITORY')
    private readonly repo: IBaseRepository<Product>,
    private readonly storeService: StoreService,
  ) {}

  async create(createProductDto: CreateProductDto, user: AuthenticatedUser) {
    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      createProductDto.storeId = store.id;
    }
    return this.repo.create(createProductDto);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    return this.repo.findOne({ id } as object);
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: AuthenticatedUser) {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Produit non trouvé');

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (product.storeId !== store.id) {
        throw new ForbiddenException('Vous ne pouvez modifier que vos propres produits');
      }
    }
    return this.repo.update(id, updateProductDto);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Produit non trouvé');

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (product.storeId !== store.id) {
        throw new ForbiddenException('Vous ne pouvez supprimer que vos propres produits');
      }
    }
    return this.repo.softDelete(id);
  }
}
