import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendanceService } from '../modules/attendance/services/attendance.service';
import { AttendanceQueryDto } from '../modules/attendance/dto/attendance-query.dto';
import {
  UpdateMealAttendanceDto,
  BatchMarkAllPresentDto,
  SyncFromMorningCheckinDto,
  LockAndSendToKitchenDto,
} from '../modules/attendance/dto/update-meal-attendance.dto';
import { MealEvaluationQueryDto } from '../modules/attendance/dto/meal-evaluation-query.dto';
import {
  UpdateChildEvaluationDto,
  BatchUpdatePortionDto,
  UpdateSensoryEvaluationDto,
  LockAndSendEvaluationDto,
} from '../modules/attendance/dto/update-meal-evaluation.dto';
import { AttendanceHistoryQueryDto } from '../modules/attendance/dto/attendance-history-query.dto';

import { SnackRosterService } from '../modules/attendance/services/snack-roster.service';
import { SnackRosterQueryDto } from '../modules/attendance/dto/snack-roster-query.dto';
import { MealCoordinationService } from '../modules/attendance/services/meal-coordination.service';
import {
  MealCoordinationQueryDto,
  CreateMealCoordinationNoteDto,
  UpdateMealCoordinationNoteDto,
  AcknowledgeCoordinationDto,
  ResolveCoordinationDto,
} from '../modules/attendance/dto/meal-coordination.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly snackRosterService: SnackRosterService,
    private readonly mealCoordinationService: MealCoordinationService,
  ) {}

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

  // =========================================================================
  // UC63: XEM LỊCH SỬ ĐIỂM DANH VÀ SỨC ĂN
  // =========================================================================

  @Get('history')
  async getHistoryList(
    @Req() req: Request,
    @Query() query: AttendanceHistoryQueryDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.getHistoryList(tenantId, query);
  }

  // =========================================================================
  // VIEW & FILTER SNACK SERVICE ROSTER
  // =========================================================================

  @Get('snack-roster')
  async getSnackRoster(
    @Req() req: Request,
    @Query() query: SnackRosterQueryDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.snackRosterService.getRosterData(tenantId, query);
  }

  // =========================================================================
  // MANAGE MEAL COORDINATION NOTES (TEACHER & KITCHEN CONSOLE)
  // =========================================================================

  @Get('coordination-notes')
  async getCoordinationNotes(
    @Req() req: Request,
    @Query() query: MealCoordinationQueryDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.mealCoordinationService.getCoordinationData(tenantId, query);
  }

  @Post('coordination-notes')
  async createCoordinationNote(
    @Req() req: Request,
    @Body() dto: CreateMealCoordinationNoteDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.mealCoordinationService.createNote(tenantId, dto);
  }

  @Put('coordination-notes/:id')
  async updateCoordinationNote(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateMealCoordinationNoteDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.mealCoordinationService.updateNote(tenantId, id, dto);
  }

  @Post('coordination-notes/:id/acknowledge')
  async acknowledgeCoordinationNote(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AcknowledgeCoordinationDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.mealCoordinationService.acknowledgeNote(tenantId, id, dto);
  }

  @Post('coordination-notes/:id/resolve')
  async resolveCoordinationNote(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ResolveCoordinationDto,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.mealCoordinationService.resolveNote(tenantId, id, dto);
  }

  @Delete('coordination-notes/:id')
  async deleteCoordinationNote(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.mealCoordinationService.deleteNote(tenantId, id);
  }

  // =========================================================================
  // SYNC REAL-TIME MEAL PORTIONS (WEBSOCKET) - KITCHEN DISPLAY SYSTEM (KDS)
  // =========================================================================

  @Get('kitchen-kds')
  async getKitchenKdsData(
    @Req() req: Request,
    @Query('date') date?: string,
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.getKitchenKdsData(tenantId, date);
  }

  @Post('kitchen/status')
  async updateKitchenStatus(
    @Req() req: Request,
    @Body() body: { classId: string; status: 'WAITING' | 'PREPARING' | 'PORTIONING' | 'READY_DELIVERY' | 'DELIVERED'; actorName?: string; date?: string },
  ) {
    const tenantId = this.resolveTenantId(req);
    return this.attendanceService.updateKitchenPreparationStatus(
      tenantId,
      body.classId,
      body.status,
      body.actorName,
      body.date,
    );
  }
}
