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
import { DishesService } from './dishes.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { GetDishesQueryDto } from './dto/get-dishes-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Dishes & Recipes Management')
@Controller('dishes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách món ăn kèm phân loại và chỉ số dinh dưỡng' })
  async findAll(@Query() query: GetDishesQueryDto) {
    return this.dishesService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh mục phân loại món (Món chính, Canh, Phụ, Tráng miệng...)' })
  async getCategories() {
    return this.dishesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết món ăn kèm công thức và thành phần dinh dưỡng' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dishesService.findOne(id);
  }

  @Post()
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Tạo món ăn mới và lập công thức nguyên liệu' })
  async create(@Body() dto: CreateDishDto) {
    return this.dishesService.create(dto);
  }

  @Put(':id')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Cập nhật món ăn và công thức' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDishDto,
  ) {
    return this.dishesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Xóa món ăn' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.dishesService.remove(id);
  }
}
