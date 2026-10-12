import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
  Logger,
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
import { ProductStatus } from '../../common/enum/product-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { IsNull } from 'typeorm';

const PRODUCTS_CACHE_KEY = 'all_products';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  private getParentIdCondition() {
    return process.env.DB_TYPE?.toLowerCase() === 'mongodb' ? null : IsNull();
  }

  constructor(
    @Inject('PRODUCT_REPOSITORY')
    private readonly repo: IBaseRepository<Product>,
    @Inject('PRODUCT_REVIEW_REPOSITORY')
    private readonly reviewRepo: IBaseRepository<any>,
    @Inject('USER_REPOSITORY')
    private readonly userRepo: IBaseRepository<any>,
    private readonly storeService: StoreService,
    private readonly storageService: S3StorageService,
    private readonly cache: CacheService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createProductDto: CreateProductDto, user: AuthenticatedUser) {
    if (user.role === UserRole.VENDEUR) {
      try {
        const store = await this.storeService.findByOwnerId(user.userId);
        createProductDto.storeId = store.id;
      } catch (error: any) {
        throw new ForbiddenException(
          `Vous devez créer une boutique avant d'ajouter des produits: ${error.message}`,
        );
      }
    }

    // Handle Base64 image upload to S3
    if (createProductDto.image?.startsWith('data:image')) {
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
      } catch (error: any) {
        this.logger.error(
          `Erreur lors de l'upload de l'image du produit vers S3: ${error.message}`,
        );
      }
    }

    const status = user.role === UserRole.VENDEUR ? ProductStatus.PENDING : ProductStatus.APPROVED;
    const product = await this.repo.create({
      ...createProductDto,
      status,
    });
    await this.cache.del(PRODUCTS_CACHE_KEY);
    this.broadcastUpdate();

    if (status === ProductStatus.PENDING) {
      let vendorName = 'Un vendeur';
      try {
        const store = await this.storeService.findByOwnerId(user.userId);
        if (store) vendorName = store.name || user.name || 'Un vendeur';
      } catch {}
      this.notifyAdminsOfPendingProduct(product, vendorName);
    }

    // On recharge le produit avec ses relations (eager loading) pour le frontend
    return this.findOne(product.id);
  }

  async findAll(storeId?: string, user?: AuthenticatedUser) {
    const parentIdCondition = this.getParentIdCondition();

    if (storeId) {
      let isOwner = false;
      if (user) {
        if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
          isOwner = true;
        } else if (user.role === UserRole.VENDEUR) {
          try {
            const store = await this.storeService.findByOwnerId(user.userId);
            if (String(store.id) === String(storeId)) {
              isOwner = true;
            }
          } catch {
            isOwner = false;
          }
        }
      }

      if (isOwner) {
        const products = await this.repo.find({
          where: { storeId, parentId: parentIdCondition },
          relations: ['store'],
        } as any);

        for (const prod of products) {
          const revision = await this.repo.findOne({
            where: [
              { parentId: prod.id, status: ProductStatus.PENDING },
              { parentId: prod.id, status: ProductStatus.REJECTED }
            ]
          } as any);
          if (revision) {
            (prod as any).revision = revision;
          }
        }

        return products;
      } else {
        return this.repo.find({
          where: { storeId, status: ProductStatus.APPROVED, parentId: parentIdCondition },
          relations: ['store'],
        } as any);
      }
    }

    // Check Cache
    const cached = await this.cache.get<Product[]>(PRODUCTS_CACHE_KEY);
    if (cached) return cached;

    const products = await this.repo.find({
      where: { status: ProductStatus.APPROVED, parentId: parentIdCondition },
      relations: ['store'],
    } as any);
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
          throw new ForbiddenException(
            'Vous ne pouvez modifier que vos propres produits',
          );
        }
      } catch (error: any) {
        if (error instanceof ForbiddenException) throw error;
        throw new ForbiddenException(
          `Boutique non trouvée ou accès refusé: ${error.message}`,
        );
      }
    }

    if (user.role === UserRole.VENDEUR && product.status === ProductStatus.APPROVED) {
      // Check if there is already a pending revision
      let revision = await this.repo.findOne({
        where: { parentId: product.id, status: ProductStatus.PENDING },
      } as any);

      // Handle Base64 image upload to S3 for revision
      let imageUrl = updateProductDto.image;
      if (imageUrl?.startsWith('data:image')) {
        try {
          const base64Data = imageUrl.split(',')[1];
          const mimeType = imageUrl.split(';')[0].split(':')[1];
          const extension = mimeType.split('/')[1];
          const buffer = Buffer.from(base64Data, 'base64');

          const fileUrl = await this.storageService.uploadFile({
            buffer,
            originalname: `product-revision-${Date.now()}.${extension}`,
            mimetype: mimeType,
          });

          imageUrl = fileUrl;
        } catch (error: any) {
          this.logger.error(
            `Erreur lors de l'upload de l'image de révision du produit vers S3: ${error.message}`,
          );
        }
      }

      const revisionData = {
        name: updateProductDto.name !== undefined ? updateProductDto.name : product.name,
        price: updateProductDto.price !== undefined ? Number(updateProductDto.price) : product.price,
        currency: updateProductDto.currency !== undefined ? updateProductDto.currency : product.currency,
        stock: updateProductDto.stock !== undefined ? Number(updateProductDto.stock) : product.stock,
        unit: updateProductDto.unit !== undefined ? updateProductDto.unit : product.unit,
        description: updateProductDto.description !== undefined ? updateProductDto.description : product.description,
        image: imageUrl !== undefined ? imageUrl : product.image,
        categoryId: updateProductDto.categoryId !== undefined ? updateProductDto.categoryId : product.categoryId,
        storeId: product.storeId,
        status: ProductStatus.PENDING,
        parentId: product.id,
        rejectionReason: null,
      };

      if (revision) {
        Object.assign(revision, revisionData);
        if (updateProductDto.categoryId) {
          (revision as any).category = { id: updateProductDto.categoryId };
        }
        await this.repo.save(revision);
      } else {
        revision = await this.repo.create(revisionData);
      }

      await this.cache.del(PRODUCTS_CACHE_KEY);
      this.broadcastUpdate();

      // Notify admins
      let vendorName = 'Un vendeur';
      try {
        const store = await this.storeService.findByOwnerId(user.userId);
        if (store) vendorName = store.name || user.name || 'Un vendeur';
      } catch {}
      this.notifyAdminsOfPendingProduct(revision, vendorName);

      const parentResult = await this.findOne(id);
      if (parentResult) {
        (parentResult as any).revision = revision;
      }
      return parentResult;
    }

    // Force la mise à jour de la relation pour TypeORM
    if (updateProductDto.categoryId) {
      (product as any).category = { id: updateProductDto.categoryId };
    }

    // Handle Base64 image upload to S3 for update
    if (updateProductDto.image?.startsWith('data:image')) {
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
      } catch (error: any) {
        this.logger.error(
          `Erreur lors de l'upload de l'image du produit vers S3 lors de la mise à jour: ${error.message}`,
        );
      }
    }

    // On fusionne les autres champs
    Object.assign(product, updateProductDto);

    // Reset status to PENDING if updated by a seller (to prevent bypassing moderation)
    let shouldNotifyAdmins = false;
    if (user.role === UserRole.VENDEUR) {
      product.status = ProductStatus.PENDING;
      (product as any).rejectionReason = null;
      shouldNotifyAdmins = true;
    }

    await this.repo.save(product);
    await this.cache.del(PRODUCTS_CACHE_KEY);
    this.broadcastUpdate();

    if (shouldNotifyAdmins) {
      let vendorName = 'Un vendeur';
      try {
        const store = await this.storeService.findByOwnerId(user.userId);
        if (store) vendorName = store.name || user.name || 'Un vendeur';
      } catch {}
      this.notifyAdminsOfPendingProduct(product, vendorName);
    }

    const result = await this.findOne(id);
    const revision = await this.repo.findOne({
      where: [
        { parentId: id, status: ProductStatus.PENDING },
        { parentId: id, status: ProductStatus.REJECTED }
      ]
    } as any);
    if (result && revision) {
      (result as any).revision = revision;
    }
    return result;
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
      } catch (error: any) {
        if (error instanceof ForbiddenException) throw error;
        throw new ForbiddenException(
          `Boutique non trouvée ou accès refusé: ${error.message}`,
        );
      }
    }
    await this.cache.del(PRODUCTS_CACHE_KEY);
    this.broadcastUpdate();
    return this.repo.softDelete(id);
  }

  private async notifyAdminsOfPendingProduct(product: Product, vendorName: string) {
    try {
      const admins = await this.userRepo.find({
        where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
      } as any);

      if (Array.isArray(admins)) {
        for (const admin of admins) {
          await this.notificationsService.create({
            userId: admin.id,
            type: NotificationType.INFO,
            title: 'Nouveau produit en attente',
            message: `Le vendeur "${vendorName}" a soumis le produit "${product.name}" pour validation.`,
            metadata: JSON.stringify({ productId: product.id }),
          });
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to notify admins of pending product ${product.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  private broadcastUpdate() {
    if (this.realtimeGateway.server) {
      this.realtimeGateway.server.emit('catalog_updated', { type: 'product' });
    }
  }

  async addReview(
    productId: string,
    rating: number,
    comment: string,
    user: AuthenticatedUser,
  ) {
    const product = await this.findOne(productId);
    if (!product) throw new NotFoundException('Produit non trouvé');

    // Create review
    const review = await this.reviewRepo.create({
      productId,
      userId: user.userId,
      userName: user.name || 'Client',
      rating: Number(rating),
      comment: comment || '',
    });

    // Recalculate average rating
    const reviews = await this.reviewRepo.find({ where: { productId } } as any);
    const totalRating = reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0);
    const ratingsCount = reviews.length;
    const avgRating = ratingsCount > 0 ? Number((totalRating / ratingsCount).toFixed(2)) : 0.0;

    // Update product rating and ratingsCount
    await this.repo.update(productId, {
      rating: avgRating,
      ratingsCount,
    } as any);

    // Clear cache & emit WS
    await this.cache.del(PRODUCTS_CACHE_KEY);
    this.broadcastUpdate();

    return review;
  }

  async findPending() {
    return this.repo.find({
      where: { status: ProductStatus.PENDING },
      relations: ['store', 'store.owner', 'parent'],
    } as any);
  }

  async updateStatus(id: string, status: ProductStatus, reason?: string) {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Produit non trouvé');

    const updateFields: any = { status };
    if (status === ProductStatus.REJECTED) {
      updateFields.rejectionReason = reason || 'Motif non spécifié';
    } else {
      updateFields.rejectionReason = null;
    }

    if (product.parentId && status === ProductStatus.APPROVED) {
      const parentProduct = await this.findOne(product.parentId);
      if (parentProduct) {
        const parentUpdateFields: any = {
          name: product.name,
          price: product.price,
          currency: product.currency,
          stock: product.stock,
          unit: product.unit,
          description: product.description,
          image: product.image,
          categoryId: product.categoryId,
        };
        if (product.categoryId) {
          (parentProduct as any).category = { id: product.categoryId };
        }
        Object.assign(parentProduct, parentUpdateFields);
        await this.repo.save(parentProduct);
      }
      // Delete the revision (child) product
      await this.repo.delete(product.id);
    } else {
      await this.repo.update(id, updateFields);
    }

    await this.cache.del(PRODUCTS_CACHE_KEY);
    this.broadcastUpdate();

    // Notify the vendor
    if (product.storeId) {
      try {
        const store = await this.storeService.findOne(product.storeId);
        if (store && store.ownerId) {
          const title = status === ProductStatus.APPROVED
            ? (product.parentId ? 'Modification approuvée' : 'Produit approuvé')
            : (product.parentId ? 'Modification refusée' : 'Produit refusé');

          const productName = product.parentId
            ? (await this.findOne(product.parentId))?.name || product.name
            : product.name;

          const message = status === ProductStatus.APPROVED
            ? (product.parentId
                ? `Votre modification du produit "${productName}" a été approuvée.`
                : `Votre produit "${productName}" a été approuvé et est désormais en ligne.`)
            : (product.parentId
                ? `Votre modification du produit "${productName}" a été refusée. Motif : ${reason || 'Non spécifié'}.`
                : `Votre produit "${productName}" a été refusé. Motif : ${reason || 'Non spécifié'}.`);

          await this.notificationsService.create({
            userId: store.ownerId,
            type: 'INFO' as any,
            title,
            message,
            metadata: JSON.stringify({ productId: product.parentId || product.id, status }),
          });
        }
      } catch (err: any) {
        this.logger.error(`Failed to send product status notification: ${err.message}`);
      }
    }

    return product.parentId ? this.findOne(product.parentId) : this.findOne(id);
  }

  async findAllReviews() {
    const reviews = await this.reviewRepo.find({ relations: ['product'] } as any);

    return reviews.map((review: any) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      userName: review.userName,
      productName: review.product?.name,
      createdAt: review.createdAt,
    }));
  }
}
