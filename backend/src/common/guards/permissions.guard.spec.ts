import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { RolesService } from '../../core/roles/roles.service';
import { Permission } from '../enum/permission.enum';
import { UserRole } from '../enum/role.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let rolesService: RolesService;

  beforeEach(() => {
    reflector = new Reflector();
    rolesService = {
      findByName: jest.fn(),
    } as any;
    guard = new PermissionsGuard(reflector, rolesService);
  });

  const createMockContext = (
    user: any,
    permissions: Permission[],
  ): ExecutionContext => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permissions);
    return context;
  };

  it('should allow access if no permissions are required', async () => {
    const context = createMockContext({ role: UserRole.CLIENT }, []);
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user is super_admin', async () => {
    const context = createMockContext({ role: UserRole.SUPER_ADMIN }, [
      Permission.ROLES_MANAGE,
    ]);
    (rolesService.findByName as jest.Mock).mockResolvedValue({
      permissions: [Permission.ALL],
    });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow access if role has required permission', async () => {
    const context = createMockContext({ role: UserRole.ADMIN }, [
      Permission.USERS_MANAGE,
    ]);
    (rolesService.findByName as jest.Mock).mockResolvedValue({
      permissions: [Permission.USERS_MANAGE, Permission.PRODUCTS_MANAGE],
    });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should deny access if role is missing required permission', async () => {
    const context = createMockContext({ role: UserRole.VENDEUR }, [
      Permission.ROLES_MANAGE,
    ]);
    (rolesService.findByName as jest.Mock).mockResolvedValue({
      permissions: [Permission.PRODUCTS_MANAGE],
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return false if user role is not found in database', async () => {
    const context = createMockContext({ role: 'unknown' }, [
      Permission.USERS_MANAGE,
    ]);
    (rolesService.findByName as jest.Mock).mockResolvedValue(null);

    expect(await guard.canActivate(context)).toBe(false);
  });
});
