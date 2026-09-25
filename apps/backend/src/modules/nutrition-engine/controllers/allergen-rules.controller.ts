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
import { AllergenRulesService } from '../services/allergen-rules.service';
import { CreateAllergenDto } from '../dto/create-allergen.dto';
import { UpdateAllergenDto } from '../dto/update-allergen.dto';

@Controller('allergens')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AllergenRulesController {
  constructor(private readonly allergenService: AllergenRulesService) {}

  /**
   * GET /api/v1/allergens
   * Lấy danh mục các chất dị ứng
   */
  @Get()
  async getAllergens(
    @CurrentUser('tenantId') tenantId: string,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const isIncludeDeleted =
      includeDeleted === 'true' || includeDeleted === '1' || includeDeleted === 'yes';
    return this.allergenService.getAllergens(tenantId, {
      search,
      includeDeleted: isIncludeDeleted,
    });
  }

  /**
   * GET /api/v1/allergens/:id
   * Xem chi tiết 1 chất dị ứng
   */
  @Get(':id')
  async getAllergenById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.allergenService.getAllergenById(id, tenantId);
  }

  /**
   * POST /api/v1/allergens
   * Thêm chất dị ứng mới vào danh mục
   */
  @Post()
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createAllergen(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateAllergenDto,
  ) {
    return this.allergenService.createAllergen(tenantId, dto);
  }

  /**
   * PUT /api/v1/allergens/:id
   * Cập nhật chất dị ứng
   */
  @Put(':id')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async updateAllergen(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAllergenDto,
  ) {
    return this.allergenService.updateAllergen(id, tenantId, dto);
  }

  /**
   * DELETE /api/v1/allergens/:id
   * Xóa mềm (Soft Delete) chất dị ứng
   */
  @Delete(':id')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async softDeleteAllergen(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.allergenService.softDeleteAllergen(id, tenantId);
  }

  /**
   * PATCH /api/v1/allergens/:id/restore
   * Khôi phục chất dị ứng đã xóa mềm
   */
  @Patch(':id/restore')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async restoreAllergen(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.allergenService.restoreAllergen(id, tenantId);
  }
}
