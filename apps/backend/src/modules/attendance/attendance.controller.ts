import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendanceService } from './services/attendance.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import {
  UpdateMealAttendanceDto,
  BatchMarkAllPresentDto,
  SyncFromMorningCheckinDto,
  LockAndSendToKitchenDto,
} from './dto/update-meal-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  private resolveTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      req.tenantId ||
      'a0000000-0000-0000-0000-000000000001'
    );
  }

  @Get('classes')
  async getClasses(@Req() req: Request) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.getAllClasses(tenantId);
  }

  @Get()
  async getAttendanceList(
    @Req() req: Request,
    @Query() query: AttendanceQueryDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.getAttendanceList(tenantId, query);
  }

  @Put('child/:childId')
  async updateChildMealAttendance(
    @Req() req: Request,
    @Param('childId') childId: string,
    @Body() dto: UpdateMealAttendanceDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.updateChildMealAttendance(tenantId, childId, dto);
  }

  @Post('mark-all')
  async markAllPresent(
    @Req() req: Request,
    @Body() dto: BatchMarkAllPresentDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.markAllPresent(tenantId, dto);
  }

  @Post('sync-morning')
  async syncFromMorningCheckin(
    @Req() req: Request,
    @Body() dto: SyncFromMorningCheckinDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.syncFromMorningCheckin(tenantId, dto);
  }

  @Post('lock-kitchen')
  async lockAndSendKitchen(
    @Req() req: Request,
    @Body() dto: LockAndSendToKitchenDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.lockAndSendKitchen(tenantId, dto);
  }
}
