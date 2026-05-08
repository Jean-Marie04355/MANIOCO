import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsNotEmpty()
  @IsUUID()
  sellerId: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;
}
