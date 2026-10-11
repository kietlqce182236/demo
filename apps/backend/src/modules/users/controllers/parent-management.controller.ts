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
import { ParentManagementService } from '../services/parent-management.service';
import { QueryParentDto } from '../dto/parent/query-parent.dto';
import { CreateParentDto } from '../dto/parent/create-parent.dto';
import { UpdateParentDto } from '../dto/parent/update-parent.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Parent Management')
@Controller('users/parents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ParentManagementController {
  constructor(private readonly parentService: ParentManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tài khoản phụ huynh học sinh' })
  async findAll(@Query() query: QueryParentDto) {
    return this.parentService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tình hình tài khoản phụ huynh' })
  async getStats() {
    return this.parentService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết phụ huynh' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.parentService.findOne(id);
  }

  @Post()
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Tạo tài khoản phụ huynh mới' })
  async create(@Body() dto: CreateParentDto) {
    return this.parentService.create(dto);
  }

  @Patch(':id')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cập nhật thông tin phụ huynh' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParentDto,
  ) {
    return this.parentService.update(id, dto);
  }

  @Put(':id')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cập nhật toàn bộ thông tin phụ huynh' })
  async updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParentDto,
  ) {
    return this.parentService.update(id, dto);
  }

  @Post(':id/restore')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Khôi phục tài khoản phụ huynh' })
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.parentService.restore(id);
  }

  @Delete(':id')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Xóa tài khoản phụ huynh' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.parentService.remove(id);
  }
}
