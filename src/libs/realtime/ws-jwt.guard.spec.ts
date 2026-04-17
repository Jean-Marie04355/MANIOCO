import { Test, TestingModule } from '@nestjs/testing';
import { WsJwtGuard } from './ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsJwtGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<WsJwtGuard>(WsJwtGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let context: any;

    beforeEach(() => {
      context = {
        switchToWs: jest.fn().mockReturnValue({
          getClient: jest.fn().mockReturnValue({
            handshake: {
              auth: {},
              headers: {},
            },
          }),
        }),
      };
    });

    it('should return true if token in auth is valid', async () => {
      const client = context.switchToWs().getClient();
      client.handshake.auth.token = 'valid-token';
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ userId: '1' });

      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    });

    it('should return true if token in headers is valid (Bearer)', async () => {
      const client = context.switchToWs().getClient();
      client.handshake.headers.authorization = 'Bearer valid-header-token';
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ userId: '1' });

      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-header-token');
    });

    it('should return false if no token is found', async () => {
      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(WsException);
    });

    it('should return false if token verification fails', async () => {
      const client = context.switchToWs().getClient();
      client.handshake.auth.token = 'invalid-token';
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(WsException);
    });
  });
});
