import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { StoreService } from '../store/store.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../../common/enum/role.enum';
import { S3StorageService } from '../../libs/storage/s3-storage.service';
import { CacheService } from '../../libs/cache/cache.service';
import { RealtimeGateway } from '../../libs/realtime/realtime.gateway';

const PRODUCTS_CACHE_KEY = 'all_products';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('PRODUCT_REPOSITORY')
    private readonly repo: IBaseRepository<Product>,
    private readonly storeService: StoreService,
    private readonly storageService: S3StorageService,
    private readonly cache: CacheService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(createProductDto: CreateProductDto, user: AuthenticatedUser) {
    if (user.role === UserRole.VENDEUR) {
      try {
        const store = await this.storeService.findByOwnerId(user.userId);
        createProductDto.storeId = store.id;
      } catch (error) {
        throw new ForbiddenException('Vous devez créer une boutique avant d\'ajouter des produits');
      }
    }

    // Handle Base64 image upload to S3
    if (
      createProductDto.image &&
      createProductDto.image.startsWith('data:image')
    ) {
      try {
        const base64Data = createProductDto.image.split(',')[1];
        const mimeType = createProductDto.image.split(';')[0].split(':')[1];
        const extension = mimeType.split('/')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const fileUrl = await this.storageService.uploadFile({
          buffer,
          originalname: `product-${Date.now()}.${extension}`,
          mimetype: mimeType,
        });

        createProductDto.image = fileUrl;
      } catch (error) {
        console.error(
          "Erreur lors de l'upload de l'image du produit vers S3",
          error,
        );
      }
    }

    const product = await this.repo.create(createProductDto);
    await this.cache.del(PRODUCTS_CACHE_KEY);
    this.broadcastUpdate();
    // On recharge le produit avec ses relations (eager loading) pour le frontend
    return this.findOne(product.id);
  }

  async findAll(storeId?: string) {
    if (storeId) {
      return this.repo.find({ where: { storeId }, relations: ['store'] } as any);
    }
    
    // Check Cache
    const cached = await this.cache.get<Product[]>(PRODUCTS_CACHE_KEY);
    if (cached) return cached;

    const products = await this.repo.find({ relations: ['store'] } as any);
    await this.cache.set(PRODUCTS_CACHE_KEY, products, { ttlSeconds: 3600 }); // 1 hour cache
    return products;
  }

  async findOne(id: string) {
    return this.repo.findOne({ id } as object);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: AuthenticatedUser,
  ) {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Produit non trouvé');

    if (user.role === UserRole.VENDEUR) {
      try {
        const store = await this.storeService.findByOwnerId(user.userId);
        if (String(product.storeId) !== String(store.id)) {
          throw new ForbiddenException('Vous ne pouvez modifier que vos propres produits');
        }
      } catch (error) {
        if (error instanceof ForbiddenException) throw error;
        throw new ForbiddenException('Boutique non trouvée ou accès refusé');
      }
    }

    // Force la mise à jour de la relation pour TypeORM
    if (updateProductDto.categoryId) {
      (product as any).category = { id: updateProductDto.categoryId };
    }

    // Handle Base64 image upload to S3 for update
    if (
      updateProductDto.image &&
      updateProductDto.image.startsWith('data:image')
    ) {
      try {
        const base64Data = updateProductDto.image.split(',')[1];
        const mimeType = updateProductDto.image.split(';')[0].split(':')[1];
        const extension = mimeType.split('/')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const fileUrl = await this.storageService.uploadFile({
          buffer,
          originalname: `product-update-${Date.now()}.${extension}`,
          mimetype: mimeType,
        });

        updateProductDto.image = fileUrl;
      } catch (error) {
        console.error(
          "Erreur lors de l'upload de l'image du produit vers S3",
          error,
        );
      }
    }

    // On fusionne les autres champs
    Object.assign(product, updateProductDto);

    await this.repo.save(product);
    await this.cache.del(PRODUCTS_CACHE_KEY);
    this.broadcastUpdate();
    return this.findOne(id);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Produit non trouvé');

    if (user.role === UserRole.VENDEUR) {
      try {
        const store = await this.storeService.findByOwnerId(user.userId);
        if (product.storeId !== store.id) {
          throw new ForbiddenException(
            'Vous ne pouvez supprimer que vos propres produits',
          );
        }
      } catch (error) {
        if (error instanceof ForbiddenException) throw error;
        throw new ForbiddenException('Boutique non trouvée ou accès refusé');
      }
    }
    await this.cache.del(PRODUCTS_CACHE_KEY);
    this.broadcastUpdate();
    return this.repo.softDelete(id);
  }

  private broadcastUpdate() {
    if (this.realtimeGateway.server) {
      this.realtimeGateway.server.emit('catalog_updated', { type: 'product' });
    }
  }
}
