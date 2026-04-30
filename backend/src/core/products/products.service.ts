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

@Injectable()
export class ProductsService {
  constructor(
    @Inject('PRODUCT_REPOSITORY')
    private readonly repo: IBaseRepository<Product>,
    private readonly storeService: StoreService,
    private readonly storageService: S3StorageService,
  ) {}

  async create(createProductDto: CreateProductDto, user: AuthenticatedUser) {
    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      createProductDto.storeId = store.id;
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
    // On recharge le produit avec ses relations (eager loading) pour le frontend
    return this.findOne(product.id);
  }

  async findAll(storeId?: string) {
    if (storeId) {
      return this.repo.find({ where: { storeId } } as object);
    }
    return this.repo.find();
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
      const store = await this.storeService.findByOwnerId(user.userId);
      if (product.storeId !== store.id) {
        throw new ForbiddenException(
          'Vous ne pouvez modifier que vos propres produits',
        );
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
    return this.findOne(id);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Produit non trouvé');

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (product.storeId !== store.id) {
        throw new ForbiddenException(
          'Vous ne pouvez supprimer que vos propres produits',
        );
      }
    }
    return this.repo.softDelete(id);
  }
}
