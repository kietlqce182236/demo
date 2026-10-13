import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './services/attendance.service';
import { MealCoordinationService } from './services/meal-coordination.service';
import { SnackRosterService } from './services/snack-roster.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { UpdateMealAttendanceDto } from './dto/update-meal-attendance.dto';
import { MealEvaluationQueryDto } from './dto/meal-evaluation-query.dto';
import { UpdateMealEvaluationDto } from './dto/update-meal-evaluation.dto';
import { AttendanceHistoryQueryDto } from './dto/attendance-history-query.dto';
import { MealCoordinationDto } from './dto/meal-coordination.dto';
import { SnackRosterQueryDto } from './dto/snack-roster-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { InspectionsService } from '../inspections/inspections.service';

@ApiTags('Meal Attendance & Evaluations')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly noteService: MealCoordinationService,
    private readonly snackRosterService: SnackRosterService,
    private readonly inspectionsService: InspectionsService,
  ) {}

  @Get('attendance/classes')
  @ApiOperation({ summary: 'Lấy danh sách các lớp để giáo viên chọn điểm danh' })
  async getClasses() {
    return this.attendanceService.getClasses();
  }

  @Get('attendance/school-summary')
  @ApiOperation({ summary: 'Tổng hợp sĩ số toàn trường trong ngày' })
  async getSchoolSummary(@Query('date') date?: string) {
    return this.attendanceService.getSchoolHeadcountSummary(date);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Lấy danh sách điểm danh bữa ăn của lớp' })
  async getAttendanceList(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.getAttendanceList(query);
  }

  @Put('attendance/child/:childId')
  @ApiOperation({ summary: 'Cập nhật điểm danh ăn bán trú cho 1 học sinh' })
  async updateChildAttendance(
    @Param('childId', ParseIntPipe) childId: number,
    @Body() dto: UpdateMealAttendanceDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.attendanceService.updateChildAttendance(childId, dto, userId);
  }

  @Post('attendance/mark-all')
  @ApiOperation({ summary: 'Điểm danh nhanh có mặt ăn toàn bộ cả lớp' })
  async markAllPresent(
    @Body() body: { classId: string; date: string },
    @CurrentUser('sub') userId: number,
  ) {
    return this.attendanceService.markAllPresent(body, userId);
  }

  @Post('attendance/sync-morning')
  @ApiOperation({ summary: 'Đồng bộ sĩ số từ điểm danh đón trẻ buổi sáng' })
  async syncMorning(
    @Body() body: { classId: string; date: string },
    @CurrentUser('sub') userId: number,
  ) {
    return this.attendanceService.syncFromMorning(body, userId);
  }

  @Post('attendance/lock-kitchen')
  @ApiOperation({ summary: 'Khóa sĩ số chốt số suất ăn gửi xuống bếp' })
  async lockKitchen(@Body() body: { classId: string; date: string; notes?: string }) {
    return this.attendanceService.lockAndSendToKitchen(body);
  }

  @Get('attendance/evaluation')
  @ApiOperation({ summary: 'Lấy danh sách đánh giá mức độ ăn sau bữa' })
  async getEvaluationList(@Query() query: MealEvaluationQueryDto) {
    return this.attendanceService.getEvaluationList(query);
  }

  @Put('attendance/evaluation/child/:childId')
  @ApiOperation({ summary: 'Đánh giá mức độ ăn của 1 trẻ (FULL, PARTIAL, NONE)' })
  async updateChildEvaluation(
    @Param('childId', ParseIntPipe) childId: number,
    @Body() dto: UpdateMealEvaluationDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.attendanceService.updateChildEvaluation(childId, dto, userId);
  }

  @Post('attendance/evaluation/batch')
  @ApiOperation({ summary: 'Cập nhật hàng loạt mức độ ăn cho lớp' })
  async batchUpdateEvaluation(
    @Body() body: { classId: string; date: string; portionConsumed: string },
    @CurrentUser('sub') userId: number,
  ) {
    return this.attendanceService.batchUpdatePortion(body, userId);
  }

  @Put('attendance/evaluation/sensory')
  @ApiOperation({ summary: 'Lưu đánh giá cảm quan chất lượng món ăn của giáo viên' })
  async updateSensory(@Body() body: any) {
    return this.attendanceService.updateSensoryEvaluation(body);
  }

  @Post('attendance/evaluation/lock')
  @ApiOperation({ summary: 'Khóa và hoàn tất đánh giá bữa ăn' })
  async lockEvaluation(@Body() body: any) {
    return this.attendanceService.lockAndSendEvaluation(body);
  }

  @Get('attendance/history')
  @ApiOperation({ summary: 'Xem lịch sử điểm danh và sức ăn' })
  async getHistory(@Query() query: AttendanceHistoryQueryDto) {
    return this.attendanceService.getHistoryList(query);
  }

  @Get('attendance/kitchen-kds')
  @ApiOperation({ summary: 'Lấy dữ liệu khẩu phần thời gian thực cho màn hình bếp (KDS)' })
  async getKitchenKds(@Query('date') date?: string) {
    return this.attendanceService.getKitchenKdsData(date);
  }

  @Get('attendance/coordination-notes')
  @ApiOperation({ summary: 'Lấy danh sách ghi chú phối hợp giữa GV và Bếp' })
  async getNotes(@Query() query: any) {
    return this.noteService.findAll(query);
  }

  @Post('attendance/coordination-notes')
  @ApiOperation({ summary: 'Tạo ghi chú phối hợp giữa GV và Bếp' })
  async createNote(
    @Body() dto: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.noteService.create(dto, userId);
  }

  @Put('attendance/coordination-notes/:id')
  @ApiOperation({ summary: 'Cập nhật ghi chú điều phối suất ăn' })
  async updateNote(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.noteService.update(id, dto);
  }

  @Post('attendance/coordination-notes/:id/acknowledge')
  @ApiOperation({ summary: 'Bếp xác nhận đã tiếp nhận ghi chú điều phối' })
  async acknowledgeNote(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.noteService.acknowledge(id, data, userId);
  }

  @Post('attendance/coordination-notes/:id/resolve')
  @ApiOperation({ summary: 'Hoàn tất xử lý điều phối suất ăn' })
  async resolveNote(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.noteService.resolve(id, data);
  }

  @Delete('attendance/coordination-notes/:id')
  @ApiOperation({ summary: 'Xóa ghi chú điều phối' })
  async deleteNote(@Param('id') id: string) {
    return this.noteService.delete(id);
  }

  @Get('snack-roster')
  @ApiOperation({ summary: 'Lấy danh sách suất ăn xế chiều của trẻ' })
  async getSnackRoster(@Query() query: SnackRosterQueryDto) {
    return this.snackRosterService.findAll(query);
  }

  // =========================================================================
  // KDS FOOD SAFETY INSPECTION & 24H SAMPLE RETENTION ALIASES
  // =========================================================================

  @Get('attendance/food-safety-logs')
  @ApiOperation({ summary: 'Lấy danh sách nhật ký kiểm thực 3 bước cho KDS Bếp' })
  async getFoodSafetyLogs() {
    return this.inspectionsService.getFoodSafetyLogs();
  }

  @Post('attendance/food-safety-logs')
  @ApiOperation({ summary: 'Tạo hoặc cập nhật bước kiểm thực an toàn thực phẩm từ KDS Bếp' })
  async createFoodSafetyLog(@Body() body: any) {
    return this.inspectionsService.createFoodSafetyLog(body);
  }

  @Get('attendance/sample-retention-records')
  @ApiOperation({ summary: 'Lấy danh sách mẫu lưu thức ăn 24h cho KDS Bếp' })
  async getSampleRetentionRecords() {
    return this.inspectionsService.getSampleRetentionRecords();
  }

  @Post('attendance/sample-retention-records')
  @ApiOperation({ summary: 'Lưu mẫu thức ăn 24h mới từ KDS Bếp' })
  async createSampleRetentionRecord(@Body() body: any) {
    return this.inspectionsService.createSampleRetentionRecord(body);
  }

  @Post('attendance/sample-retention-records/:id/dispose')
  @ApiOperation({ summary: 'Hủy mẫu lưu an toàn sau 24h từ KDS Bếp' })
  async disposeSampleRetentionRecord(@Param('id') id: string) {
    return this.inspectionsService.disposeSampleRetentionRecord(id);
  }
}
