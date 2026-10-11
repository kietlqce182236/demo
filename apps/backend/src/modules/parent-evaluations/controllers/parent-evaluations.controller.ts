import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { ParentEvaluationService } from '../services/parent-evaluation.service';
import { ParentEvaluationQueryParams } from '../dto/parent-evaluation-query.dto';
import { RespondEvaluationPayload } from '../dto/respond-parent-evaluation.dto';
import { SubmitEvaluationDto } from '../dto/submit-evaluation.dto';

@ApiTags('Parent Evaluations & Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parent-evaluations')
export class ParentEvaluationsController {
  constructor(private readonly evalService: ParentEvaluationService) {}

  @Get('portal-data')
  @ApiOperation({ summary: 'Dữ liệu tổng hợp trang đánh giá của phụ huynh' })
  @Roles('PARENT', 'SCHOOL_MANAGEMENT', 'TEACHER', 'NUTRITIONIST')
  async getPortalData(
    @Query('childId') childId?: string,
    @CurrentUser('id') userId?: number,
  ) {
    return this.evalService.getPortalData(childId, userId);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Phụ huynh gửi đánh giá hoặc kiến nghị bữa ăn' })
  @Roles('PARENT', 'SCHOOL_MANAGEMENT')
  async submitEvaluation(
    @Body() payload: SubmitEvaluationDto,
    @CurrentUser('id') userId?: number,
  ) {
    return this.evalService.submitEvaluation(payload, userId);
  }

  @Get('child-menu-consumption')
  @ApiOperation({ summary: 'Theo dõi tình hình ăn uống thực tế của con' })
  @Roles('PARENT', 'TEACHER', 'SCHOOL_MANAGEMENT')
  async getChildMenuConsumption(
    @Query('childId') childId?: string,
    @Query('date') date?: string,
  ) {
    return this.evalService.getChildMenuConsumption(childId, date);
  }

  @Post('child-consumption/heart')
  @ApiOperation({ summary: 'Thả tim / cảm ơn bữa ăn của bé' })
  @Roles('PARENT')
  async toggleHeartReaction(
    @Body('attendanceId') attendanceId: string,
    @CurrentUser('id') userId?: number,
  ) {
    return this.evalService.toggleHeartReaction(attendanceId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách đánh giá của phụ huynh (kèm bộ lọc & thống kê)' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER', 'PARENT')
  async getEvaluations(
    @Query() query: ParentEvaluationQueryParams,
    @CurrentTenant() schoolId?: number,
  ) {
    return this.evalService.getEvaluations(query, schoolId);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Nhà trường phản hồi ý kiến đánh giá của phụ huynh' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER')
  async respondToEvaluation(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: RespondEvaluationPayload,
    @CurrentUser('id') userId: number,
  ) {
    return this.evalService.respondToEvaluation(id, payload, userId);
  }

  @Put(':id/respond')
  @ApiOperation({ summary: 'Cập nhật nội dung phản hồi của nhà trường' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER')
  async updateResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: RespondEvaluationPayload,
    @CurrentUser('id') userId: number,
  ) {
    return this.evalService.updateResponse(id, payload, userId);
  }

  @Put(':id/draft')
  @ApiOperation({ summary: 'Chuyển trạng thái nháp phản hồi' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER')
  async toggleDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body('isDrafting') isDrafting: boolean,
  ) {
    return this.evalService.toggleDraft(id, isDrafting);
  }
}
