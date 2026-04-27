import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 'Problème de paiement FedaPay' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({ example: 'Paiement' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Je n\'ai pas reçu mon paiement de 54000 FCFA.' })
  @IsString()
  @IsNotEmpty()
  message: string; // The initial message content
}
