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
import { FoodsService } from '../services/foods.service';
import { CreateFoodDto } from '../dto/create-food.dto';
import { UpdateFoodDto } from '../dto/update-food.dto';
import { GetFoodsQueryDto } from '../dto/get-foods-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Foods & FCT Ingredients')
@Controller('foods')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách nguyên liệu FCT (tìm kiếm, lọc nhóm, phân trang)' })
  async findAll(@Query() query: GetFoodsQueryDto) {
    return this.foodsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng số nguyên liệu và nhóm thực phẩm' })
  async getStats() {
    return this.foodsService.getStats();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh mục 14 nhóm thực phẩm theo Viện Dinh Dưỡng' })
  async getCategories() {
    return this.foodsService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết thành phần dinh dưỡng của 1 nguyên liệu' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodsService.findOne(id);
  }

  @Post()
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Tạo mới nguyên liệu vào kho dữ liệu' })
  async create(@Body() dto: CreateFoodDto) {
    return this.foodsService.create(dto);
  }

  @Put(':id')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Cập nhật chỉ số dinh dưỡng nguyên liệu' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFoodDto,
  ) {
    return this.foodsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Xóa nguyên liệu' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.foodsService.remove(id);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Tải lên hình ảnh nguyên liệu' })
  async upload() {
    return {
      success: true,
      url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80',
    };
  }
}
