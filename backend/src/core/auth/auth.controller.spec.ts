import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      login: jest.fn(),
      adminLogin: jest.fn(),
      verifyAdminOtp: jest.fn(),
      me: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto = { email: 'test@test.com', password: 'pwd' };
      serviceMock.login.mockResolvedValue({ accessToken: 'token' });

      const result = await controller.login(dto);
      expect(result).toEqual({ accessToken: 'token' });
      expect(serviceMock.login).toHaveBeenCalledWith(dto.email, dto.password);
    });
  });

  describe('adminLogin', () => {
    it('should call authService.adminLogin', async () => {
      const dto = { email: 'admin@test.com', password: 'pwd' };
      serviceMock.adminLogin.mockResolvedValue({ message: 'OTP sent' });

      const result = await controller.adminLogin(dto);
      expect(result).toEqual({ message: 'OTP sent' });
      expect(serviceMock.adminLogin).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should call authService.verifyAdminOtp', async () => {
      const dto = { email: 'admin@test.com', otpCode: '123456' };
      serviceMock.verifyAdminOtp.mockResolvedValue({ accessToken: 'token' });

      const result = await controller.verifyOtp(dto);
      expect(result).toEqual({ accessToken: 'token' });
      expect(serviceMock.verifyAdminOtp).toHaveBeenCalledWith(
        dto.email,
        dto.otpCode,
      );
    });
  });

  describe('me', () => {
    it('should call authService.me', () => {
      const user = { sub: 'email', userId: '1' };
      serviceMock.me.mockReturnValue(user);

      const result = controller.me({ user } as any);
      expect(result).toEqual(user);
      expect(serviceMock.me).toHaveBeenCalledWith(user);
    });
  });
});
