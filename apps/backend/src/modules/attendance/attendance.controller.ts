import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
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
import { MealEvaluationQueryDto } from './dto/meal-evaluation-query.dto';
import {
  UpdateChildEvaluationDto,
  BatchUpdatePortionDto,
  UpdateSensoryEvaluationDto,
  LockAndSendEvaluationDto,
} from './dto/update-meal-evaluation.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  private resolveTenantId(req: Request): string {
    return (
      (req.headers['x-tenant-id'] as string) ||
      (req as any).tenantId ||
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

  // =========================================================================
  // UC62: ĐÁNH GIÁ MỨC ĐỘ ĂN CỦA TRẺ SAU BỮA (HẾT SUẤT, 1/2, BỎ BỮA)
  // =========================================================================

  @Get('evaluation')
  async getEvaluationList(
    @Req() req: Request,
    @Query() query: MealEvaluationQueryDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.getEvaluationList(tenantId, query);
  }

  @Put('evaluation/child/:childId')
  async updateChildEvaluation(
    @Req() req: Request,
    @Param('childId') childId: string,
    @Body() dto: UpdateChildEvaluationDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.updateChildEvaluation(tenantId, childId, dto);
  }

  @Post('evaluation/batch')
  async batchUpdatePortion(
    @Req() req: Request,
    @Body() dto: BatchUpdatePortionDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.batchUpdatePortion(tenantId, dto);
  }

  @Put('evaluation/sensory')
  async updateSensoryEvaluation(
    @Req() req: Request,
    @Body() dto: UpdateSensoryEvaluationDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.updateSensoryEvaluation(tenantId, dto);
  }

  @Post('evaluation/lock')
  async lockAndSendEvaluation(
    @Req() req: Request,
    @Body() dto: LockAndSendEvaluationDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.lockAndSendEvaluation(tenantId, dto);
  }
}
