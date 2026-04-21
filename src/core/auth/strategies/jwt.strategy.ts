import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRole } from '../../../common/enum/role.enum';

type JwtPayload = {
  sub: string; // email
  email: string;
  role: UserRole;
  userId?: string;
  iat?: number;
  exp?: number;
};

export type AuthenticatedUser = {
  email: string;
  role: UserRole;
  userId?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.email || !payload?.role) {
      throw new UnauthorizedException('Token invalide.');
    }

    return {
      email: payload.email,
      role: payload.role,
      userId: payload.userId,
    };
  }
}
