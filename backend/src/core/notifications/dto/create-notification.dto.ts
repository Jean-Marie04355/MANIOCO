import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ example: 'UUID', description: 'ID du destinataire' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.INFO })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ example: 'Nouvelle commande' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Vous avez reçu une nouvelle commande' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: '{"orderId": "123"}', required: false })
  @IsString()
  @IsOptional()
  metadata?: string;
}
