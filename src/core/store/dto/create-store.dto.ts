import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ description: 'Name of the store' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Owner ID (User)' })
  @IsNotEmpty()
  @IsString()
  ownerId: string;

  @ApiProperty({ description: 'Profile photo URL', required: false })
  @IsString()
  @IsNotEmpty()
  profilePhoto?: string;

  @ApiProperty({ description: 'GPS Latitude', required: false })
  latitude?: number;

  @ApiProperty({ description: 'GPS Longitude', required: false })
  longitude?: number;

  @ApiProperty({ description: 'Full physical address' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'City name (for filtering)' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: 'Description of the store' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Phone number of the store owner' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'Phone number must contain only digits' })
  phone: string;

  @ApiProperty({ description: 'ID de sous-compte FedaPay pour les reversements', required: false })
  @IsString()
  @IsNotEmpty()
  payoutAccountId?: string;
}