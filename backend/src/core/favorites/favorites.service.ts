import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { Product } from '../products/product.entity';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,

    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepo: IBaseRepository<Product>,
  ) {}

  /**
   * Toggle un favori : ajoute si absent, supprime si présent.
   * Retourne le nouvel état.
   */
  async toggleFavorite(
    userId: string,
    productId: string,
  ): Promise<{ isFavorited: boolean; productId: string }> {
    // Vérifier que le produit existe
    const product = await this.productRepo.findOne({ id: productId } as object);
    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    const existing = await this.favoriteRepo.findOne({
      where: { userId, productId },
    });

    if (existing) {
      await this.favoriteRepo.remove(existing);
      return { isFavorited: false, productId };
    } else {
      const favorite = this.favoriteRepo.create({ userId, productId });
      await this.favoriteRepo.save(favorite);
      return { isFavorited: true, productId };
    }
  }

  /**
   * Retourne tous les produits favoris d'un utilisateur avec leurs détails complets.
   */
  async getUserFavorites(userId: string) {
    const favorites = await this.favoriteRepo.find({
      where: { userId },
      relations: ['product', 'product.store'],
      order: { createdAt: 'DESC' },
    });

    return favorites.map((fav) => fav.product).filter(Boolean);
  }

  /**
   * Retourne tous les IDs des produits favoris d'un utilisateur (pour init du context).
   */
  async getUserFavoriteIds(userId: string): Promise<string[]> {
    const favorites = await this.favoriteRepo.find({
      where: { userId },
      select: ['productId'],
    });
    return favorites.map((f) => f.productId);
  }

  /**
   * Vérifie si un produit spécifique est dans les favoris d'un utilisateur.
   */
  async isFavorited(
    userId: string,
    productId: string,
  ): Promise<{ isFavorited: boolean }> {
    const existing = await this.favoriteRepo.findOne({
      where: { userId, productId },
    });
    return { isFavorited: !!existing };
  }
}
