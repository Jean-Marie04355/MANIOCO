import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsIn,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../../common/enum/role.enum';

export class CreateUserDto {
  @ApiProperty({ description: "Nom de l'utilisateur" })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Email de l'utilisateur" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Mot de passe (minimum 6 caracteres)" })
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: UserRole,
    description:
      "Role de l'utilisateur (admin interdit a la creation publique)",
    required: false,
  })
  @IsOptional()
  @IsIn([UserRole.CLIENT, UserRole.VENDEUR, UserRole.LIVREUR, UserRole.ADMIN])
  role?: UserRole;

  @IsOptional()
  permissions?: string[];
}
