import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Strategy 1: Header 'x-tenant-id'
    const headerTenantId = req.headers['x-tenant-id'] as string;

    // Strategy 2: Subdomain resolution (e.g., hoa-mai.kidsnutri.vn)
    let subdomainTenantId: string | null = null;
    const host = req.hostname || req.headers.host || '';
    const parts = host.split('.');
    if (parts.length > 2 && parts[0] !== 'api' && parts[0] !== 'localhost') {
      subdomainTenantId = parts[0];
    }

    const tenantId = headerTenantId || subdomainTenantId || process.env.DEFAULT_TENANT_ID;

    if (tenantId) {
      req.tenantId = tenantId;
    }

    next();
  }
}
