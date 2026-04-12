import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStoreDto {
  @ApiProperty({ description: 'New name of the store', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'New description of the store', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'New location of the store', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'New phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'ID de sous-compte FedaPay pour les reversements', required: false })
  @IsOptional()
  @IsString()
  payoutAccountId?: string;
}