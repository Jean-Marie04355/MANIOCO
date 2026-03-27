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

  @ApiProperty({ description: 'Area or neighborhood' })
  @IsNotEmpty()
  @IsString()
  localisation: string;

   @ApiProperty({ description: 'Description of the store' })
   @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Phone number of the store owner' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, { message: 'Phone number must contain only digits' })
  phone: string;
}