import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../common/enum/role.enum';
import * as hashHelper from '../../common/helpers/hash.helper';

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: any;
  let jwtServiceMock: any;
  let configServiceMock: any;

  beforeEach(async () => {
    usersServiceMock = {
      findByEmail: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
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
      await expect(service.login('test@test.com', 'pwd')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({ email: 'test@test.com', password: 'hashed' });
      jest.spyOn(hashHelper, 'comparePassword').mockResolvedValue(false);
      await expect(service.login('test@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('should return LoginResponse if credentials OK', async () => {
      const user = { id: '1', email: 'test@test.com', password: 'hashed', name: 'Test', role: UserRole.CLIENT };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      jest.spyOn(hashHelper, 'comparePassword').mockResolvedValue(true);
      jwtServiceMock.signAsync.mockResolvedValue('token');

      const result = await service.login('test@test.com', 'pwd');
      expect(result.accessToken).toBe('token');
      expect(result.user.email).toBe(user.email);
    });
  });

  describe('adminLogin', () => {
    it('should generate OTP if admin credentials OK', async () => {
      const user = { id: '1', email: 'admin@test.com', password: 'hashed', role: UserRole.ADMIN };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      jest.spyOn(hashHelper, 'comparePassword').mockResolvedValue(true);

      const result = await service.adminLogin('admin@test.com', 'pwd');
      expect(result.message).toContain('OTP');
      expect(usersServiceMock.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if not admin', async () => {
      const user = { id: '1', email: 'client@test.com', password: 'hashed', role: UserRole.CLIENT };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      await expect(service.adminLogin('client@test.com', 'pwd')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyAdminOtp', () => {
    it('should return LoginResponse if OTP is valid', async () => {
      const expiry = new Date(Date.now() + 10000);
      const user = { id: '1', email: 'admin@test.com', otpCode: '123456', otpExpiresAt: expiry, role: UserRole.ADMIN };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      jwtServiceMock.signAsync.mockResolvedValue('token');

      const result = await service.verifyAdminOtp('admin@test.com', '123456');
      expect(result.accessToken).toBe('token');
      expect(usersServiceMock.update).toHaveBeenCalledWith('1', expect.objectContaining({ otpCode: null }));
    });

    it('should throw if OTP is incorrect', async () => {
      const expiry = new Date(Date.now() + 10000);
      const user = { id: '1', email: 'admin@test.com', otpCode: '123456', otpExpiresAt: expiry };
      usersServiceMock.findByEmail.mockResolvedValue(user);

      await expect(service.verifyAdminOtp('admin@test.com', '666666')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if no active OTP session', async () => {
      const user = { id: '1', email: 'admin@test.com', otpCode: null, otpExpiresAt: null };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      await expect(service.verifyAdminOtp('admin@test.com', '123456')).rejects.toThrow('No active OTP session.');
    });

    it('should throw if OTP is expired', async () => {
      const expiry = new Date(Date.now() - 10000); // Expired
      const user = { id: '1', email: 'admin@test.com', otpCode: '123456', otpExpiresAt: expiry };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      await expect(service.verifyAdminOtp('admin@test.com', '123456')).rejects.toThrow('OTP code expired.');
    });
  });

  describe('adminLogin - edge cases', () => {
    it('should throw if user not found', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);
      await expect(service.adminLogin('unknown@test.com', 'pwd')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if wrong password', async () => {
      const user = { id: '1', email: 'admin@test.com', password: 'hashed', role: UserRole.ADMIN };
      usersServiceMock.findByEmail.mockResolvedValue(user);
      jest.spyOn(hashHelper, 'comparePassword').mockResolvedValue(false);
      await expect(service.adminLogin('admin@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });
  });
});
