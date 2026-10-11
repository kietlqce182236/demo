import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('Dashboard & Executive Overview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Tổng quan chỉ số điều hành trường mầm non (Executive Summary)' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER', 'KITCHEN_STAFF')
  async getExecutiveSummary(@CurrentTenant() schoolId?: number) {
    return this.dashboardService.getExecutiveSummary(schoolId);
  }
}
