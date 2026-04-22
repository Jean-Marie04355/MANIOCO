import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../enum/permission.enum';
import { RolesService } from '../../core/roles/roles.service';
import { UserRole } from '../enum/role.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      return false;
    }

    // 1. Fetch user role permissions from database
    const role = await this.rolesService.findByName(user.role);
    if (!role) {
      return false;
    }

    // 2. Super Admin bypass (Check role name or '*' permission)
    if (
      user.role === UserRole.SUPER_ADMIN ||
      role.permissions.includes(Permission.ALL)
    ) {
      return true;
    }

    // 3. Check if all required permissions are met
    const hasPermission = requiredPermissions.every((permission) =>
      role.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
