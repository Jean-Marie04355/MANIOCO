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
    id?: string;
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

  async adminLogin(email: string, password: string): Promise<{ message: string; email: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    // Vérifier si c'est bien un admin ou super_admin
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    // Génération d'un OTP à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expire dans 15 mins (plus confortable pour les tests)

    // Sauvegarde en BDD
    await this.usersService.update(user.id, {
      otpCode,
      otpExpiresAt,
    } as any);

    return {
      message: 'Un code OTP a été généré et envoyé par email.',
      email: user.email,
    };
  }

  async verifyAdminOtp(email: string, otpCode: string): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedException('Aucune session OTP en cours. Veuillez générer un nouveau code.');
    }

    // Vérifier l'expiration
    if (new Date() > user.otpExpiresAt) {
      throw new UnauthorizedException('Code OTP expiré.');
    }

    // Vérifier le code
    if (user.otpCode !== otpCode) {
      throw new UnauthorizedException('Code OTP invalide.');
    }

    // Nettoyer l'OTP après usage
    await this.usersService.update(user.id, {
      otpCode: null,
      otpExpiresAt: null,
    } as any);

    // Générer le token final directement ici
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

