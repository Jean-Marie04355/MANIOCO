import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /**
   * Toggle un produit dans les favoris (ajoute ou retire).
   */
  @Post(':productId')
  @ApiOperation({ summary: 'Toggle un produit dans les favoris' })
  toggleFavorite(
    @Param('productId') productId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritesService.toggleFavorite(user.userId, productId);
  }

  /**
   * Récupère la liste complète des produits favoris de l'utilisateur.
   */
  @Get()
  @ApiOperation({ summary: 'Récupérer mes produits favoris' })
  getUserFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.getUserFavorites(user.userId);
  }

  /**
   * Récupère uniquement les IDs des favoris (pour initialiser le context frontend).
   */
  @Get('ids')
  @ApiOperation({ summary: 'Récupérer les IDs de mes produits favoris' })
  getUserFavoriteIds(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.getUserFavoriteIds(user.userId);
  }

  /**
   * Vérifie si un produit spécifique est dans les favoris.
   */
  @Get(':productId/status')
  @ApiOperation({ summary: 'Vérifier si un produit est en favori' })
  isFavorited(
    @Param('productId') productId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritesService.isFavorited(user.userId, productId);
  }
}
