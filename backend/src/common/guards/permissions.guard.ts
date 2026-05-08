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

    if (!user?.role) {
      return false;
    }

    // 1. Bypass immédiat pour le Super Admin
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // 2. Recherche des permissions du rôle en base de données
    const role = await this.rolesService.findByName(user.role);
    if (!role) {
      return false;
    }

    // 3. Combinaison des permissions du rôle et des permissions spécifiques
    const userSpecificPermissions = (user.permissions as string[]) || [];
    const allUserPermissions = new Set([
      ...(role.permissions || []),
      ...userSpecificPermissions,
    ]);

    // 4. Bypass global (Check '*' permission)
    if (allUserPermissions.has(Permission.ALL as any)) {
      return true;
    }

    // 4. Check if all required permissions are met
    const hasPermission = requiredPermissions.every((permission) =>
      allUserPermissions.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
