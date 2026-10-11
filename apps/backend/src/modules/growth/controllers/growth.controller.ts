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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { GrowthService } from '../services/growth.service';
import { CreateGrowthRecordDto } from '../dto/create-growth-record.dto';
import { QueryGrowthRecordsDto } from '../dto/query-growth-records.dto';

@ApiTags('Growth & Health Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách hồ sơ tăng trưởng & Z-score' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER', 'PARENT')
  async getRecords(
    @Query() query: QueryGrowthRecordsDto,
    @CurrentTenant() schoolId?: number,
  ) {
    return this.growthService.findAll(query, schoolId);
  }

  @Get('child/:childId')
  @ApiOperation({ summary: 'Lịch sử phát triển thể chất của học sinh' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER', 'PARENT')
  async getChildHistory(@Param('childId', ParseIntPipe) childId: number) {
    return this.growthService.getChildHistory(childId);
  }

  @Get('class/:classId/overview')
  @ApiOperation({ summary: 'Tổng quan tình trạng dinh dưỡng của lớp học' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER')
  async getClassOverview(@Param('classId', ParseIntPipe) classId: number) {
    return this.growthService.getClassOverview(classId);
  }

  @Post()
  @ApiOperation({ summary: 'Ghi nhận chỉ số thể chất mới (chiều cao, cân nặng)' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER')
  async createRecord(
    @Body() dto: CreateGrowthRecordDto,
    @CurrentUser('id') userId?: number,
  ) {
    return this.growthService.createRecord(dto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật chỉ số thể chất' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER')
  async updateRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateGrowthRecordDto>,
  ) {
    return this.growthService.updateRecord(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa chỉ số thể chất' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST')
  async deleteRecord(@Param('id', ParseIntPipe) id: number) {
    return this.growthService.deleteRecord(id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Nhập dữ liệu đo thể chất hàng loạt từ Excel/CSV' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST')
  async importRecords(
    @Body('items') items: any[],
    @CurrentUser('id') userId?: number,
  ) {
    return this.growthService.importRecords(items || [], userId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Xuất báo cáo tăng trưởng' })
  @Roles('SCHOOL_MANAGEMENT', 'NUTRITIONIST', 'TEACHER')
  async exportReport(@Query('classId') classId?: string) {
    return this.growthService.exportReport(classId);
  }
}
