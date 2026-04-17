import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../enum/role.enum';
import { RolesService } from '../../core/roles/roles.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflectorMock: any;

  beforeEach(async () => {
    reflectorMock = {
      getAllAndOverride: jest.fn(),
    };

    const rolesServiceMock = {
      findByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: reflectorMock },
        { provide: RolesService, useValue: rolesServiceMock },
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

  it('should return true if no roles are required', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([]);
    expect(await guard.canActivate(createMockContext())).toBe(true);
  });

  it('should return true if user has required role', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(await guard.canActivate(createMockContext(UserRole.ADMIN))).toBe(true);
  });

  it('should return false if user does not have required role', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(await guard.canActivate(createMockContext(UserRole.CLIENT))).toBe(false);
  });

  it('should return false if no user in request', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: null }),
      }),
    } as unknown as ExecutionContext;
    expect(await guard.canActivate(mockContext)).toBe(false);
  });
});
