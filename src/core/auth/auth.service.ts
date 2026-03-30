import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { comparePassword } from '../../common/helpers/hash.helper';
import { UserRole } from '../../common/enum/role.enum';

import type { AuthenticatedUser } from './strategies/jwt.strategy';

type LoginResponse = {
  accessToken: string;
  user: {
    id?: number;
    name: string;
    email: string;
    role: UserRole;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const payload = {
      sub: user.email,
      email: user.email,
      role: user.role as UserRole,
      userId: user.id,
    };

    const expiresIn = (this.configService.get('JWT_EXPIRES_IN') as any) || '1d';
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
      },
    };
  }

  me(user: AuthenticatedUser) {
    return {
      email: user.email,
      role: user.role,
      userId: user.userId,
    };
  }
}

