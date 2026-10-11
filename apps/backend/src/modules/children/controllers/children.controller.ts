import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChildrenService } from '../services/children.service';
import { CreateChildDto } from '../dto/create-child.dto';
import { UpdateChildDto } from '../dto/update-child.dto';
import { GetChildrenQueryDto } from '../dto/get-children-query.dto';
import { DeclareAllergyDto } from '../dto/declare-allergy.dto';
import { UpdateAllergyDto } from '../dto/update-allergy.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Children & Allergies Management')
@Controller('children')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách hồ sơ trẻ (Phân trang, tìm kiếm, lọc theo lớp/dị ứng)' })
  async findAll(@Query() query: GetChildrenQueryDto) {
    return this.childrenService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng số trẻ, giới tính, tỷ lệ có dị ứng' })
  async getStats() {
    return this.childrenService.getStats();
  }

  @Get('allergen-catalogs')
  @ApiOperation({ summary: 'Danh mục 8 dị ứng phổ biến chuẩn' })
  async getAllergenCatalogs() {
    return this.childrenService.getAllergenCatalogs();
  }

  @Post('rescan-allergies')
  @ApiOperation({ summary: 'Quét lại toàn bộ rủi ro dị ứng học sinh' })
  async rescanAllergies() {
    return this.childrenService.rescanAllergies();
  }

  @Post('import')
  @ApiOperation({ summary: 'Nhập khẩu danh sách học sinh hàng loạt' })
  async importChildren(@Body('items') items: any[]) {
    return this.childrenService.importChildren(items || []);
  }

  @Get(':id/allergy-history')
  @ApiOperation({ summary: 'Xem lịch sử khai báo và cảnh báo dị ứng của trẻ' })
  async getAllergyHistory(@Param('id', ParseIntPipe) id: number) {
    return this.childrenService.getAllergyHistory(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết hồ sơ một trẻ' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.childrenService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới hồ sơ trẻ' })
  async create(@Body() dto: CreateChildDto) {
    return this.childrenService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật hồ sơ trẻ' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChildDto,
  ) {
    return this.childrenService.update(id, dto);
  }

  @Post(':childId/allergies')
  @ApiOperation({ summary: 'Khai báo thông tin dị ứng cho trẻ (Phụ huynh / Y tế / GV)' })
  async declareAllergy(
    @Param('childId', ParseIntPipe) childId: number,
    @Body() dto: DeclareAllergyDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.childrenService.declareAllergy(childId, dto, userId);
  }

  @Put('allergies/:allergyId')
  @ApiOperation({ summary: 'Cập nhật bản ghi dị ứng của trẻ' })
  async updateAllergy(
    @Param('allergyId', ParseIntPipe) allergyId: number,
    @Body() dto: UpdateAllergyDto,
  ) {
    return this.childrenService.updateAllergy(allergyId, dto);
  }

  @Delete('allergies/:allergyId')
  @ApiOperation({ summary: 'Xóa bản ghi dị ứng' })
  async deleteAllergy(@Param('allergyId', ParseIntPipe) allergyId: number) {
    return this.childrenService.deleteAllergy(allergyId);
  }
}
