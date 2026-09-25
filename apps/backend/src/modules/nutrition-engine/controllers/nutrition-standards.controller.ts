import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { NutritionRulesService } from '../services/nutrition-rules.service';
import { CreateNutritionRuleDto } from '../dto/create-nutrition-rule.dto';
import { UpdateNutritionRuleDto } from '../dto/update-nutrition-rule.dto';

@Controller('nutrition-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
export class NutritionStandardsController {
  constructor(private readonly rulesService: NutritionRulesService) {}

  /**
   * GET /api/v1/nutrition-rules
   * Lấy danh sách quy chuẩn dinh dưỡng áp dụng cho trường
   */
  @Get()
  async getNutritionRules(
    @CurrentUser('tenantId') tenantId: string,
    @Query('targetAgeGroup') targetAgeGroup?: string,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const isIncludeDeleted =
      includeDeleted === 'true' || includeDeleted === '1' || includeDeleted === 'yes';
    return this.rulesService.getNutritionRules(tenantId, {
      targetAgeGroup,
      search,
      includeDeleted: isIncludeDeleted,
    });
  }

  /**
   * GET /api/v1/nutrition-rules/stats
   * Lấy thống kê số lượng quy chuẩn, tỷ lệ tuân thủ, dị ứng (Top KPI cards)
   */
  @Get('stats')
  async getNutritionStats(@CurrentUser('tenantId') tenantId: string) {
    return this.rulesService.getNutritionStats(tenantId);
  }

  /**
   * GET /api/v1/nutrition-rules/:id
   * Xem chi tiết 1 quy chuẩn
   */
  @Get(':id')
  async getRuleById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.rulesService.getRuleById(id, tenantId);
  }

  /**
   * POST /api/v1/nutrition-rules
   * Tạo mới quy chuẩn dinh dưỡng
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNutritionRule(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateNutritionRuleDto,
  ) {
    return this.rulesService.createNutritionRule(tenantId, dto);
  }

  /**
   * PUT /api/v1/nutrition-rules/:id
   * Cập nhật quy chuẩn dinh dưỡng
   */
  @Put(':id')
  async updateNutritionRule(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNutritionRuleDto,
  ) {
    return this.rulesService.updateNutritionRule(id, tenantId, dto);
  }

  /**
   * DELETE /api/v1/nutrition-rules/:id
   * Xóa mềm (Soft Delete) quy chuẩn dinh dưỡng
   */
  @Delete(':id')
  async softDeleteNutritionRule(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.rulesService.softDeleteNutritionRule(id, tenantId);
  }

  /**
   * PATCH /api/v1/nutrition-rules/:id/restore
   * Khôi phục quy chuẩn dinh dưỡng đã xóa mềm
   */
  @Patch(':id/restore')
  async restoreNutritionRule(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.rulesService.restoreNutritionRule(id, tenantId);
  }
}
