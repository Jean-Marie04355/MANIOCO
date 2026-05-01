import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
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

  @ApiProperty({ example: 10, description: 'Le stock disponible' })
  @IsNumber()
  @IsNotEmpty()
  stock: number;

  @ApiProperty({
    example: 'Kg',
    description: 'Unité de mesure du stock',
  })
  @IsIn(['Sac', 'Demi-sac', 'Kg', 'Demi-kg'])
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({
    example: 'Dernier modèle avec 5G',
    description: 'Description détaillée',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: "URL de l'image du produit",
  })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    example: 'UUID-or-ObjectId',
    description: 'ID de la boutique associée',
  })
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({
    example: 'UUID-or-ObjectId',
    description: 'ID de la catégorie associée',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
