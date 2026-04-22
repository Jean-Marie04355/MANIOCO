import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeGateway } from './realtime.gateway';
import { WsJwtGuard } from './ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        WsJwtGuard,
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should handle ping event and return pong', () => {
    const mockClient = { user: { id: 'test', email: 'test@test.com' } } as any;
    const mockBody = { msg: 'hello' };
    
    const result = gateway.ping(mockClient, mockBody);

    expect(result.event).toBe('pong');
    expect(result.data.ok).toBe(true);
    expect(result.data.received).toEqual(mockBody);
    expect(result.data.user).toEqual(mockClient.user);
    expect(result.data.ts).toBeDefined();
  });

  it('should handle ping event without user or body', () => {
    const mockClient = {} as any;
    
    const result = gateway.ping(mockClient, undefined);

    expect(result.event).toBe('pong');
    expect(result.data.ok).toBe(true);
    expect(result.data.received).toBeNull();
    expect(result.data.user).toBeNull();
    expect(result.data.ts).toBeDefined();
  });
});
