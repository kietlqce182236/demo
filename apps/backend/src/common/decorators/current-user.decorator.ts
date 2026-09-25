import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserPayload {
  userId: string;
  sub?: string;
  tenantId: string;
  email: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    if (data === 'userId' || data === 'id') {
      return user.userId || user.sub || user.id;
    }
    return data ? user[data] : user;
  },
);
