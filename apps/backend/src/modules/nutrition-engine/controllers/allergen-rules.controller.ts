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
import { AllergenRulesService } from '../services/allergen-rules.service';
import { CreateAllergenDto } from '../dto/create-allergen.dto';
import { UpdateAllergenDto } from '../dto/update-allergen.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Allergen Standards & Rules')
@Controller('allergens')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AllergenRulesController {
  constructor(private readonly allergenService: AllergenRulesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh mục các loại dị ứng chuẩn' })
  async findAll() {
    return this.allergenService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết danh mục dị ứng' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.allergenService.findOne(id);
  }

  @Post()
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Thêm mới loại dị ứng' })
  async create(@Body() dto: CreateAllergenDto) {
    return this.allergenService.create(dto);
  }

  @Put(':id')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Cập nhật loại dị ứng' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAllergenDto,
  ) {
    return this.allergenService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Bật/tắt trạng thái loại dị ứng' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return { success: true, message: 'Đã cập nhật trạng thái dị ứng' };
  }

  @Delete(':id')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Xóa loại dị ứng' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.allergenService.remove(id);
  }
}
