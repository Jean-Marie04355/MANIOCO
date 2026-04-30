import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enum/role.enum';
import { RolesService } from '../../core/roles/roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: UserRole } | undefined;

    if (!user?.role) {
      return false;
    }

    // Direct check against enum (System Roles)
    if (requiredRoles.includes(user.role)) {
      return true;
    }

    // Dynamic check against Database roles
    const dbRole = await this.rolesService.findByName(user.role);
    if (!dbRole) return false;

    // Check if the role is a Super Admin (full access)
    if (
      dbRole.name === UserRole.SUPER_ADMIN ||
      dbRole.permissions.includes('*')
    ) {
      return true;
    }

    // Future extension: Check specific permissions here if needed

    return false;
  }
}
