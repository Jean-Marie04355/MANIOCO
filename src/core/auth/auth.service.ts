import * as crypto from 'node:crypto';
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { BullMQService } from '../../libs/queues/bullmq.service';
import { comparePassword } from '../../common/helpers/hash.helper';
import { UserRole } from '../../common/enum/role.enum';
import { User } from '../users/user.entity';

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
    private readonly bullMQService: BullMQService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException();
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      throw new UnauthorizedException();
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException(
        "Administrators must log in via the secure administration portal (MFA).",
      );
    }


    const payload = {
      sub: user.email,
      email: user.email,
      role: user.role,
      userId: user.id,
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
      },
    };
  }

  async adminLogin(email: string, password: string): Promise<{ message: string; email: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Access reserved for administrators.');
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.update(user.id, {
      otpCode,
      otpExpiresAt,
    } as Partial<User>);

    // Put OTP job into the queue
    const queue = this.bullMQService.getQueue(process.env.BULLMQ_QUEUE || 'default');
    await queue.add('send-otp-email', { email: user.email, otpCode });

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
      },
    };
  }

  me(user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
