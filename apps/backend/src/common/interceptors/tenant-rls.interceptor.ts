import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantRlsInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || (request.user && request.user.tenantId);

    if (tenantId) {
      try {
        // Set PostgreSQL local session variable for RLS
        await this.dataSource.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
      } catch (err) {
        // Log or handle error if query runner is not in transaction
      }
    }

    return next.handle();
  }
}
