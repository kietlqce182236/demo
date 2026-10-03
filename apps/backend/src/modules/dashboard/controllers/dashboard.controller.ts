import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  private resolveTenantId(req: Request, userTenantId?: string): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      userTenantId ||
      'a0000000-0000-0000-0000-000000000001'
    );
  }

  @Get('summary')
  @Roles('SCHOOL_MANAGEMENT', 'PRINCIPAL', 'SUPER_ADMIN', 'NUTRITIONIST', 'TEACHER', 'KITCHEN_STAFF')
  async getExecutiveSummary(
    @Req() req: Request,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.dashboardService.getExecutiveSummary(this.resolveTenantId(req, tenantId));
  }
}
