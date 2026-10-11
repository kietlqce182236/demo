import { Controller, Get, Put, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MealPortionsService } from './services/meal-portions.service';
import { MealPortionsQueryDto } from './dto/meal-portions-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Meal Portions (Kitchen Display)')
@Controller('meal-portions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MealPortionsController {
  constructor(private readonly portionService: MealPortionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách số suất ăn theo từng lớp cho nhà bếp' })
  async getPortions(@Query() query: MealPortionsQueryDto) {
    return this.portionService.findAll(query);
  }

  @Put()
  @ApiOperation({ summary: 'Cập nhật số suất thực tế đã nấu/chia của lớp' })
  async updateActual(
    @Body() body: { classId: number; date: string; mealType: string; actualQuantity: number },
  ) {
    return this.portionService.updateActual(body.classId, body.date, body.mealType, body.actualQuantity);
  }
}
