import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.tenantId || (request.user && request.user.tenantId);
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is missing');
    }
    return tenantId;
  },
);
