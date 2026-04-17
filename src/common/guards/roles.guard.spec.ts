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

  it('should return false when DB role not found', async () => {
    const rolesServiceMock2 = { findByName: jest.fn().mockResolvedValue(null) };
    const module2 = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: reflectorMock },
        { provide: RolesService, useValue: rolesServiceMock2 },
      ],
    }).compile();
    const guard2 = module2.get<RolesGuard>(RolesGuard);
    reflectorMock.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(await guard2.canActivate(createMockContext(UserRole.CLIENT))).toBe(false);
  });

  it('should return true when DB role is SUPER_ADMIN', async () => {
    const rolesServiceMock3 = {
      findByName: jest.fn().mockResolvedValue({ name: UserRole.SUPER_ADMIN, permissions: [] }),
    };
    const module3 = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: reflectorMock },
        { provide: RolesService, useValue: rolesServiceMock3 },
      ],
    }).compile();
    const guard3 = module3.get<RolesGuard>(RolesGuard);
    reflectorMock.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(await guard3.canActivate(createMockContext(UserRole.CLIENT))).toBe(true);
  });

  it('should return true when DB role has wildcard permission', async () => {
    const rolesServiceMock4 = {
      findByName: jest.fn().mockResolvedValue({ name: 'custom', permissions: ['*'] }),
    };
    const module4 = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: reflectorMock },
        { provide: RolesService, useValue: rolesServiceMock4 },
      ],
    }).compile();
    const guard4 = module4.get<RolesGuard>(RolesGuard);
    reflectorMock.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(await guard4.canActivate(createMockContext(UserRole.CLIENT))).toBe(true);
  });
});
