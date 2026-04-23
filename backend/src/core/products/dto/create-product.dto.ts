import { IsString, IsNumber, IsOptional, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Smartphone', description: 'Le nom du produit' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 499.99, description: 'Le prix du produit' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({ example: 'FCFA', default: 'FCFA' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 10, description: 'Le stock disponible' })
  @IsNumber()
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: 'Kg', description: 'Unité de mesure du stock' })
  @IsIn(['Pièce', 'Kg', 'Demi'])
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({
    example: 'Dernier modèle avec 5G',
    description: 'Description détaillée',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: "URL de l'image du produit",
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    example: 'UUID-or-ObjectId',
    description: 'ID de la boutique associée',
  })
  @IsString()
  @IsOptional()
  storeId?: string;

  @ApiProperty({
    example: 'UUID-or-ObjectId',
    description: 'ID de la catégorie associée',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
