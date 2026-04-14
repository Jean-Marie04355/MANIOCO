import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Électronique', description: 'Le nom de la catégorie' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Appareils électroniques et accessoires', description: 'Description facultative' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-du-store', description: 'ID du store associé' })
  @IsString()
  @IsNotEmpty()
  storeId: string;
}

