import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['role'] as const)) {
  @IsOptional()
  suspensionUntil?: Date;

  @IsOptional()
  suspensionReason?: string;

  @IsOptional()
  isVerified?: boolean;
}
