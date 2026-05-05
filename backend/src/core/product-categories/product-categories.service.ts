import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';
import { ProductCategory } from './product-category.entity';
import { StoreService } from '../store/store.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../../common/enum/role.enum';
import { CacheService } from '../../libs/cache/cache.service';
import { RealtimeGateway } from '../../libs/realtime/realtime.gateway';

const CATEGORIES_CACHE_KEY = 'all_categories';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @Inject('PRODUCT_CATEGORY_REPOSITORY')
    private readonly repo: IBaseRepository<ProductCategory>,
    private readonly storeService: StoreService,
    private readonly cache: CacheService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(createDto: CreateProductCategoryDto, user: AuthenticatedUser) {
    if (user.role === UserRole.VENDEUR) {
      try {
        const store = await this.storeService.findByOwnerId(user.userId);
        createDto.storeId = store.id;
      } catch (error) {
        throw new ForbiddenException('Vous devez créer une boutique avant de créer une catégorie');
      }
    }
    const category = await this.repo.create(createDto);
    await this.cache.del(CATEGORIES_CACHE_KEY);
    this.broadcastUpdate();
    return category;
  }

  async findAll(storeId?: string) {
    if (storeId) {
      // Retourne les catégories de la boutique PLUS les catégories globales (storeId null)
      return this.repo.find({ 
        where: [
          { storeId },
          { storeId: null }
        ]
      } as any);
    }
    
    // Check Cache
    const cached = await this.cache.get<ProductCategory[]>(CATEGORIES_CACHE_KEY);
    if (cached) return cached;

    const categories = await this.repo.find();
    await this.cache.set(CATEGORIES_CACHE_KEY, categories, { ttlSeconds: 3600 });
    return categories;
  }

  async findOne(id: string) {
    return this.repo.findOne({ id } as object);
  }

  async update(
    id: string,
    updateDto: UpdateProductCategoryDto,
    user: AuthenticatedUser,
  ) {
    const category = await this.findOne(id);
    if (!category) throw new NotFoundException('Catégorie non trouvée');

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (category.storeId !== store.id) {
        throw new ForbiddenException(
          'Vous ne pouvez modifier que vos propres catégories',
        );
      }
    }
    const result = await this.repo.update(id, updateDto);
    await this.cache.del(CATEGORIES_CACHE_KEY);
    this.broadcastUpdate();
    return result;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const category = await this.findOne(id);
    if (!category) throw new NotFoundException('Catégorie non trouvée');

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (category.storeId !== store.id) {
        throw new ForbiddenException(
          'Vous ne pouvez supprimer que vos propres catégories',
        );
      }
    }
    await this.cache.del(CATEGORIES_CACHE_KEY);
    this.broadcastUpdate();
    return this.repo.softDelete(id);
  }

  private broadcastUpdate() {
    if (this.realtimeGateway.server) {
      this.realtimeGateway.server.emit('catalog_updated', { type: 'category' });
    }
  }
}
