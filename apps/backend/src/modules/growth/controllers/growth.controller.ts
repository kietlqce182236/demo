import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { GrowthService } from '../services/growth.service';
import { CreateGrowthRecordDto } from '../dto/create-growth-record.dto';
import { QueryGrowthRecordsDto } from '../dto/query-growth-records.dto';

@Controller('growth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  private resolveTenantId(req: Request, userTenantId?: string): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      userTenantId ||
      'a0000000-0000-0000-0000-000000000001'
    );
  }

  @Post()
  @Roles('NUTRITIONIST', 'MEDICAL_STAFF', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER')
  @HttpCode(HttpStatus.CREATED)
  async recordGrowth(
    @Req() req: Request,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGrowthRecordDto,
  ) {
    return this.growthService.recordGrowth(this.resolveTenantId(req, tenantId), userId, dto);
  }

  @Get()
  @Roles('NUTRITIONIST', 'MEDICAL_STAFF', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER', 'PARENT')
  async getRecords(
    @Req() req: Request,
    @CurrentUser('tenantId') tenantId: string,
    @Query() query: QueryGrowthRecordsDto,
  ) {
    return this.growthService.getRecords(this.resolveTenantId(req, tenantId), query);
  }

  @Get('child/:childId')
  @Roles('NUTRITIONIST', 'MEDICAL_STAFF', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER', 'PARENT')
  async getChildHistory(
    @Req() req: Request,
    @CurrentUser('tenantId') tenantId: string,
    @Param('childId') childId: string,
  ) {
    return this.growthService.getChildHistory(this.resolveTenantId(req, tenantId), childId);
  }

  @Get('class/:classId/overview')
  @Roles('NUTRITIONIST', 'MEDICAL_STAFF', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER')
  async getClassOverview(
    @Req() req: Request,
    @CurrentUser('tenantId') tenantId: string,
    @Param('classId') classId: string,
  ) {
    return this.growthService.getClassOverview(this.resolveTenantId(req, tenantId), classId);
  }

  @Get('export')
  @Roles('NUTRITIONIST', 'MEDICAL_STAFF', 'PRINCIPAL', 'SUPER_ADMIN')
  async exportReport(
    @Req() req: Request,
    @CurrentUser('tenantId') tenantId: string,
    @Query('classId') classId?: string,
  ) {
    return this.growthService.exportReport(this.resolveTenantId(req, tenantId), classId);
  }

  @Post('import')
  @Roles('NUTRITIONIST', 'MEDICAL_STAFF', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER')
  async importRecords(
    @Req() req: Request,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body('items') items: any[],
  ) {
    return this.growthService.importRecords(this.resolveTenantId(req, tenantId), userId, items || []);
  }

  @Put(':id')
  @Roles('NUTRITIONIST', 'MEDICAL_STAFF', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER')
  async updateRecord(
    @Req() req: Request,
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateGrowthRecordDto>,
  ) {
    return this.growthService.updateRecord(this.resolveTenantId(req, tenantId), id, dto);
  }

  @Delete(':id')
  @Roles('NUTRITIONIST', 'SUPER_ADMIN')
  async deleteRecord(
    @Req() req: Request,
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.growthService.deleteRecord(this.resolveTenantId(req, tenantId), id);
  }
}
