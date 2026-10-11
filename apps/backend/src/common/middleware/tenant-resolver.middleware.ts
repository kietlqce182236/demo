import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  use(req: Request & { tenantId?: number }, res: Response, next: NextFunction) {
    const tenantHeader = req.headers['x-tenant-id'];
    if (tenantHeader) {
      req.tenantId = Number(tenantHeader) || 1;
    } else {
      req.tenantId = 1; // Default school ID
    }
    next();
  }
}
