import * as crypto from 'node:crypto';
import {
  Injectable,
  UnauthorizedException,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { IQueueService } from '../../common/interfaces/queue.interface';
import { comparePassword } from '../../common/helpers/hash.helper';
import { UserRole } from '../../common/enum/role.enum';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

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
    @Inject('QUEUE_SERVICE')
    private readonly queueService: IQueueService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Adresse email incorrecte');
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    // Vérification de suspension temporelle
    if (user.suspensionUntil && new Date() < user.suspensionUntil) {
      // Log a security alert for attempted login on suspended account
      this.notificationsService
        .create({
          userId: user.id, // User gets notified too
          type: NotificationType.SECURITY,
          title: 'Accès suspendu',
          message: `Tentative de connexion sur votre compte suspendu jusqu'au ${user.suspensionUntil.toLocaleDateString()}.`,
        })
        .catch(() => {});

      throw new UnauthorizedException({
        statusCode: 403,
        message: 'ACCOUNT_SUSPENDED',
        suspensionUntil: user.suspensionUntil,
        reason:
          user.suspensionReason || "Violation des conditions d'utilisation",
      });
    }

    // On laisse passer la connexion même si non vérifié pour permettre l'accès à la page KYC
    // Le frontend se chargera de la redirection vers la page de validation

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Administrators must log in via the secure administration portal (MFA).',
      );
    }

    const payload = {
      sub: user.email,
      email: user.email,
      role: user.role,
      userId: user.id,
      name: user.name,
    };

    const expiresIn = this.configService.get('JWT_EXPIRES_IN') || '1d';
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus,
        kycRejectionReasons: user.kycRejectionReasons,
      } as any,
    };
  }

  async adminLogin(
    email: string,
    password: string,
  ): Promise<{ message: string; email: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Adresse email incorrecte');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.update(user.id, {
      otpCode,
      otpExpiresAt,
    } as Partial<User>);

    // Put OTP job into the queue
    const queueName = this.configService.get('QUEUE_NAME') || 'default';
    await this.queueService.addJob(queueName, 'send-otp-email', {
      email: user.email,
      otpCode,
    });

    return {
      message: 'An OTP code has been generated and sent by email.',
      email: user.email,
    };
  }

  async verifyAdminOtp(email: string, otpCode: string): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email);

    if (user?.otpCode == null || user?.otpExpiresAt == null) {
      throw new UnauthorizedException('No active OTP session.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new UnauthorizedException('OTP code expired.');
    }

    if (user.otpCode !== otpCode) {
      throw new UnauthorizedException('Invalid OTP code.');
    }

    await this.usersService.update(user.id, {
      otpCode: null,
      otpExpiresAt: null,
    } as Partial<User>);

    const payload = {
      sub: user.email,
      email: user.email,
      role: user.role,
      userId: user.id,
      name: user.name,
    };

    const expiresIn = this.configService.get('JWT_EXPIRES_IN') || '1d';
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    // Global security alert for admin login
    this.notificationsService
      .create({
        userId: user.id,
        type: NotificationType.SECURITY,
        title: 'Accès Administration',
        message: `Votre compte s'est connecté au portail sécurisé Afrigari.`,
      })
      .catch(() => {});

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Adresse email incorrecte ou invalide.');
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.update(user.id, {
      resetPasswordToken,
      resetPasswordExpires,
    } as Partial<User>);

    // Put reset email job into the queue
    const queueName = this.configService.get('QUEUE_NAME') || 'default';
    const rawFrontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const frontendUrl = rawFrontendUrl.split(',')[0].trim();
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetPasswordToken}`;

    await this.queueService.addJob(queueName, 'send-reset-password-email', {
      email: user.email,
      resetLink,
    });

    return {
      message:
        'If this email is registered, you will receive a reset link shortly.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByResetToken(token);

    if (
      user?.resetPasswordExpires == null ||
      new Date() > user.resetPasswordExpires
    ) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    await this.usersService.update(user.id, {
      password: newPassword, // UsersService.update va s'occuper de le hasher
      resetPasswordToken: null,
      resetPasswordExpires: null,
    } as Partial<User>);

    // Notify user of password change
    this.notificationsService
      .create({
        userId: user.id,
        type: NotificationType.SECURITY,
        title: 'Mot de passe modifié',
        message: `Le mot de passe de votre compte Afrigari a été réinitialisé avec succès.`,
      })
      .catch(() => {});

    return { message: 'Your password has been successfully reset.' };
  }

  async me(user: AuthenticatedUser) {
    // On charge l'utilisateur complet depuis la BDD pour inclure le champ 'name'
    const fullUser = await this.usersService.findOne(user.userId);
    if (!fullUser) throw new NotFoundException('User not found');
    return {
      id: fullUser.id,
      name: fullUser.name,
      email: fullUser.email,
      role: fullUser.role,
      userId: fullUser.id,
      isVerified: fullUser.isVerified,
      kycStatus: fullUser.kycStatus,
      kycRejectionReasons: fullUser.kycRejectionReasons,
      profilePhoto: fullUser.profilePhoto,
    };
  }
}
