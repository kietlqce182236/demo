import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator — Khai báo các role code được phép truy cập route.
 *
 * Usage:
 *   @Roles('PRINCIPAL', 'NUTRITIONIST')
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Get('dashboard')
 *   async getDashboard() { ... }
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
