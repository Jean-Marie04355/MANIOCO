import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from './ws-jwt.guard';
import { WsException } from '@nestjs/websockets';
import { ExecutionContext } from '@nestjs/common';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsJwtGuard,
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    guard = module.get<WsJwtGuard>(WsJwtGuard);
  });

  const createMockContext = (auth?: any, headers?: any) => {
    return {
      switchToWs: () => ({
        getClient: () => ({
          handshake: {
            auth,
            headers,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw WsException if token is missing', async () => {
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(WsException);
    await expect(guard.canActivate(context)).rejects.toThrow('Missing auth token');
  });

  it('should extract token from handshake.auth.token', async () => {
    const context = createMockContext({ token: 'test-token' });
    jwtService.verifyAsync.mockResolvedValue({ userId: '123' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('test-token');
  });

  it('should extract token from Authorization header (Bearer)', async () => {
    const context = createMockContext(null, { authorization: 'Bearer test-token' });
    jwtService.verifyAsync.mockResolvedValue({ userId: '123' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('test-token');
  });

  it('should throw WsException if token is invalid', async () => {
    const context = createMockContext({ token: 'invalid-token' });
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid'));

    await expect(guard.canActivate(context)).rejects.toThrow(WsException);
    await expect(guard.canActivate(context)).rejects.toThrow('Invalid auth token');
  });
});
