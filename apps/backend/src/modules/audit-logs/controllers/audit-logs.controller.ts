import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuditLogsService } from '../services/audit-logs.service';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  private resolveTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
      'a0000000-0000-0000-0000-000000000001'
    );
  }

  @Get()
  @Roles('PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT')
  async getAuditLogs(@Req() req: Request, @Query() query: QueryAuditLogsDto) {
    const tenantId = this.resolveTenantId(req);
    return this.auditLogsService.findAll(tenantId, query);
  }

  @Get('filters')
  @Roles('PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT')
  async getFilterOptions(@Req() req: Request) {
    const tenantId = this.resolveTenantId(req);
    return this.auditLogsService.getFilterOptions(tenantId);
  }

  @Get('stats')
  @Roles('PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT')
  async getStats(@Req() req: Request) {
    const tenantId = this.resolveTenantId(req);
    return this.auditLogsService.getStats(tenantId);
  }
}
