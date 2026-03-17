import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enum/role.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Nom  de l’utilisateur' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email de l’utilisateur' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mot de passe (minimum 6 caractères)' })
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, description: 'Rôle de l’utilisateur' })
  @IsEnum(UserRole)
  role: UserRole;
}