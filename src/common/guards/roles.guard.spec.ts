import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../enum/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflectorMock: any;

  beforeEach(async () => {
    reflectorMock = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: reflectorMock },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  const createMockContext = (userRole?: UserRole) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { role: userRole },
      }),
    }),
  } as unknown as ExecutionContext);

  it('should return true if no roles are required', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(createMockContext())).toBe(true);
  });

  it('should return true if user has required role', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(createMockContext(UserRole.ADMIN))).toBe(true);
  });

  it('should return false if user does not have required role', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(createMockContext(UserRole.CLIENT))).toBe(false);
  });

  it('should return false if no user in request', () => {
    reflectorMock.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: null }),
      }),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(mockContext)).toBe(false);
  });
});
