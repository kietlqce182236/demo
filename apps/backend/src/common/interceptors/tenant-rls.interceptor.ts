import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantRlsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    // Attach tenant context to request if needed
    if (!req.tenantId) {
      req.tenantId = Number(req.headers['x-tenant-id']) || 1;
    }
    return next.handle();
  }
}
