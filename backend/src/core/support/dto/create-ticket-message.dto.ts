import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketMessageDto {
  @ApiProperty({ example: 'Voici plus de détails concernant mon problème...' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
