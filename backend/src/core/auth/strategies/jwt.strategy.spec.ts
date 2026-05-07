import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../../common/enum/role.enum';

// Mock PassportStrategy to avoid needing actual passport config
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: (Strategy: any) => {
    class MockStrategy {
      constructor(options: any) {}
    }
    return MockStrategy;
  },
}));

jest.mock('passport-jwt', () => ({
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(jest.fn()),
  },
  Strategy: jest.fn(),
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configServiceMock: any;
  let usersServiceMock: any;

  beforeEach(() => {
    configServiceMock = {
      get: jest.fn().mockReturnValue('secret'),
      getOrThrow: jest.fn().mockReturnValue('secret'),
    };
    usersServiceMock = {
      findOne: jest.fn(),
    };
    strategy = new JwtStrategy(configServiceMock, usersServiceMock);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate a valid payload', async () => {
    const payload = {
      sub: 'user@test.com',
      email: 'user@test.com',
      role: UserRole.CLIENT,
      userId: 'u1',
    };
    usersServiceMock.findOne.mockResolvedValue({
      id: 'u1',
      email: 'user@test.com',
      role: UserRole.CLIENT,
      name: 'Test',
    });
    const result = await strategy.validate(payload);
    expect(result.id).toBe('u1');
    expect(result.email).toBe('user@test.com');
    expect(result.role).toBe(UserRole.CLIENT);
  });

  it('should throw UnauthorizedException if email is missing', async () => {
    const payload = { sub: '', email: '', role: UserRole.CLIENT };
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if role is missing', async () => {
    const payload = { sub: 'u', email: 'u@test.com', role: undefined as any };
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
