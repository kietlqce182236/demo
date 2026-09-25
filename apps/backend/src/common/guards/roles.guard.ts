import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../../modules/auth/strategies/jwt.strategy';

/**
 * Roles Guard — Kiểm tra user có ít nhất 1 role phù hợp.
 *
 * Performance:
 * - Không query DB — đọc trực tiếp roles[] từ JWT payload (đã decode ở JwtStrategy).
 * - O(n*m) với n = số roles yêu cầu, m = số roles của user. Thực tế n,m < 5.
 * - Nếu không có @Roles() decorator → cho phép tất cả (chỉ cần authenticated).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Không khai báo @Roles() → cho phép mọi authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user || !user.roles) {
      return false;
    }

    // SUPER_ADMIN luôn bypass mọi role check
    if (user.roles.includes('SUPER_ADMIN')) {
      return true;
    }

    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
