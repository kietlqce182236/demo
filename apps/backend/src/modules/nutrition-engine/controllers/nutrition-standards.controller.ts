import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NutritionRulesService } from '../services/nutrition-rules.service';
import { CreateNutritionRuleDto } from '../dto/create-nutrition-rule.dto';
import { UpdateNutritionRuleDto } from '../dto/update-nutrition-rule.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Nutrition Rules & Standards')
@Controller('nutrition-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NutritionStandardsController {
  constructor(private readonly rulesService: NutritionRulesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các chuẩn dinh dưỡng theo nhóm tuổi' })
  async findAll() {
    return this.rulesService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê quy tắc dinh dưỡng Thông tư 28' })
  async getStats() {
    return this.rulesService.getStats();
  }

  @Post('sync-rda')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGEMENT', 'PRINCIPAL', 'ADMIN')
  @ApiOperation({ summary: 'Đồng bộ quy chuẩn Quốc gia (VN-RDA 2024 & TT 28)' })
  async syncRda() {
    return this.rulesService.syncRdaStandards();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết chuẩn dinh dưỡng' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rulesService.findOne(id);
  }

  @Post()
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Thêm mới quy tắc chuẩn dinh dưỡng' })
  async create(@Body() dto: CreateNutritionRuleDto) {
    return this.rulesService.create(dto);
  }

  @Put(':id')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Cập nhật chỉ tiêu dinh dưỡng' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNutritionRuleDto,
  ) {
    return this.rulesService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Bật/tắt trạng thái áp dụng quy tắc' })
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.rulesService.update(id, { status: isActive ? 'ACTIVE' : 'INACTIVE' });
  }

  @Delete(':id')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Xóa quy tắc dinh dưỡng' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.rulesService.remove(id);
  }
}
