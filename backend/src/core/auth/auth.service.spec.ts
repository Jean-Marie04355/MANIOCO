import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/enum/role.enum';
import * as hashHelper from '../../common/helpers/hash.helper';

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: any;
  let jwtServiceMock: any;
  let configServiceMock: any;
  let notificationsServiceMock: any;

  beforeEach(async () => {
    usersServiceMock = {
      findByEmail: jest.fn(),
      findByResetToken: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    jwtServiceMock = {
      signAsync: jest.fn(),
      sign: jest.fn(),
    };
    configServiceMock = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    };
    notificationsServiceMock = {
      create: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
        {
          provide: 'QUEUE_SERVICE',
          useValue: {
            addJob: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);
      await expect(service.login('test@test.com', 'pwd')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        email: 'test@test.com',
        password: 'hashed',
      });
      jest.spyOn(hashHelper, 'comparePassword').mockResolvedValue(false);
      await expect(service.login('test@test.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return LoginResponse if credentials OK', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        password: 'hashed',
        name: 'Test',
        role: UserRole.CLIENT,
      };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      jest.spyOn(hashHelper, 'comparePassword').mockResolvedValue(true);
      jwtServiceMock.signAsync.mockResolvedValue('token');

      const result = await service.login('test@test.com', 'pwd');
      expect(result.accessToken).toBe('token');
      expect(result.user.email).toBe(user.email);
    });

    it('should throw UnauthorizedException if account is suspended', async () => {
      const suspensionUntil = new Date(Date.now() + 100000);
      usersServiceMock.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: 'hashed',
        suspensionUntil,
      });
      jest.spyOn(hashHelper, 'comparePassword').mockResolvedValue(true);
      
      await expect(service.login('test@test.com', 'pwd')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if admin tries to login via regular portal', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: '1',
        email: 'admin@test.com',
        password: 'hashed',
        role: UserRole.ADMIN,
      });
      jest.spyOn(hashHelper, 'comparePassword').mockResolvedValue(true);
      
      await expect(service.login('admin@test.com', 'pwd')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('adminLogin', () => {
    it('should generate OTP if admin credentials OK', async () => {
      const user = {
        id: '1',
        email: 'admin@test.com',
        password: 'hashed',
        role: UserRole.ADMIN,
      };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      jest.spyOn(hashHelper, 'comparePassword').mockResolvedValue(true);

      const result = await service.adminLogin('admin@test.com', 'pwd');
      expect(result.message).toContain('OTP');
      expect(usersServiceMock.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if not admin', async () => {
      const user = {
        id: '1',
        email: 'client@test.com',
        password: 'hashed',
        role: UserRole.CLIENT,
      };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      await expect(
        service.adminLogin('client@test.com', 'pwd'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyAdminOtp', () => {
    it('should return LoginResponse if OTP is valid', async () => {
      const expiry = new Date(Date.now() + 10000);
      const user = {
        id: '1',
        email: 'admin@test.com',
        otpCode: '123456',
        otpExpiresAt: expiry,
        role: UserRole.ADMIN,
      };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      jwtServiceMock.signAsync.mockResolvedValue('token');

      const result = await service.verifyAdminOtp('admin@test.com', '123456');
      expect(result.accessToken).toBe('token');
      expect(usersServiceMock.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ otpCode: null }),
      );
    });

    it('should throw if OTP is incorrect', async () => {
      const expiry = new Date(Date.now() + 10000);
      const user = {
        id: '1',
        email: 'admin@test.com',
        otpCode: '123456',
        otpExpiresAt: expiry,
      };
      usersServiceMock.findByEmail.mockResolvedValue(user);

      await expect(
        service.verifyAdminOtp('admin@test.com', '666666'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if no active OTP session', async () => {
      const user = {
        id: '1',
        email: 'admin@test.com',
        otpCode: null,
        otpExpiresAt: null,
      };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      await expect(
        service.verifyAdminOtp('admin@test.com', '123456'),
      ).rejects.toThrow('No active OTP session.');
    });

    it('should throw if OTP is expired', async () => {
      const expiry = new Date(Date.now() - 10000); // Expired
      const user = {
        id: '1',
        email: 'admin@test.com',
        otpCode: '123456',
        otpExpiresAt: expiry,
      };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      await expect(
        service.verifyAdminOtp('admin@test.com', '123456'),
      ).rejects.toThrow('OTP code expired.');
    });
  });

  describe('adminLogin - edge cases', () => {
    it('should throw if user not found', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);
      await expect(
        service.adminLogin('unknown@test.com', 'pwd'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if wrong password', async () => {
      const user = {
        id: '1',
        email: 'admin@test.com',
        password: 'hashed',
        role: UserRole.ADMIN,
      };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      jest.spyOn(hashHelper, 'comparePassword').mockResolvedValue(false);
      await expect(
        service.adminLogin('admin@test.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('should return the user object', async () => {
      const fullUser = {
        id: '1',
        name: 'Test',
        email: 'test@test.com',
        role: UserRole.CLIENT,
        isVerified: true,
        kycStatus: null,
        kycRejectionReasons: null,
        profilePhoto: null,
      };
      usersServiceMock.findOne = jest.fn().mockResolvedValue(fullUser);
      const user = {
        email: 'test@test.com',
        role: UserRole.CLIENT,
        userId: '1',
      };
      const result = await service.me(user as any);
      expect(result.email).toBe('test@test.com');
      expect(result.role).toBe(UserRole.CLIENT);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersServiceMock.findOne.mockResolvedValue(null);
      const user = { userId: 'unknown' };
      await expect(service.me(user as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('forgotPassword', () => {
    it('should throw BadRequestException if user not found', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);
      await expect(service.forgotPassword('unknown@test.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update user and add job to queue if user found', async () => {
      const user = { id: '1', email: 'test@test.com' };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      
      const result = await service.forgotPassword('test@test.com');
      expect(result.message).toContain('If this email is registered');
      expect(usersServiceMock.update).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if token is invalid or expired', async () => {
      usersServiceMock.findByResetToken.mockResolvedValue(null);
      await expect(service.resetPassword('invalid', 'newPwd')).rejects.toThrow(BadRequestException);
      
      const expiredUser = { id: '1', resetPasswordExpires: new Date(Date.now() - 1000) };
      usersServiceMock.findByResetToken.mockResolvedValue(expiredUser);
      await expect(service.resetPassword('expired', 'newPwd')).rejects.toThrow(BadRequestException);
    });

    it('should update password and notify user on success', async () => {
      const user = { id: '1', resetPasswordExpires: new Date(Date.now() + 10000) };
      usersServiceMock.findByResetToken.mockResolvedValue(user);
      
      const result = await service.resetPassword('valid', 'newPwd');
      expect(result.message).toContain('successfully reset');
      expect(usersServiceMock.update).toHaveBeenCalledWith('1', expect.objectContaining({ password: 'newPwd' }));
    });
  });
});
