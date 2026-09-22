import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data && user ? user[data] : user;
  },
);
