import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRole } from '../../../common/enum/role.enum';
import { UsersService } from '../../users/users.service';

type JwtPayload = {
  sub: string; // email
  email: string;
  role: UserRole;
  userId?: string;
  name?: string;
  iat?: number;
  exp?: number;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  userId?: string;
  name?: string;
  permissions?: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.email || !payload?.userId) {
      throw new UnauthorizedException('Token invalide.');
    }

    // On récupère l'utilisateur complet pour avoir ses permissions directes
    const user = await this.usersService.findOne(payload.userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      userId: user.id,
      name: user.name,
      permissions: user.permissions || [],
    };
  }
}
