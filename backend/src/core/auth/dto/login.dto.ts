import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: "Email de l'utilisateur" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mot de passe' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
