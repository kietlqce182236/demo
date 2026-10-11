import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles) {
      throw new ForbiddenException('Bạn không có quyền truy cập chức năng này (Missing roles)');
    }

    const normalizeRole = (r: string): string => {
      const up = (r || '').trim().toUpperCase();
      if (up === 'SCHOOL_MANAGEMENT' || up === 'PRINCIPAL' || up === 'SUPER_ADMIN') {
        return 'SCHOOL_MANAGER';
      }
      if (up === 'KITCHEN_MANAGER') {
        return 'KITCHEN_STAFF';
      }
      return up;
    };

    const userRoles: string[] = user.roles.map((r: string) => r.toUpperCase());
    const normalizedUserRoles = userRoles.map(normalizeRole);
    const normalizedRequired = requiredRoles.map(normalizeRole);

    const hasRole = normalizedRequired.some((role) => normalizedUserRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Quyền yêu cầu: [${requiredRoles.join(', ')}]. Quyền hiện tại của bạn: [${userRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
