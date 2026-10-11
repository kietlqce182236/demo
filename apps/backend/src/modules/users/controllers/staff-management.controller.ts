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
import { StaffManagementService } from '../services/staff-management.service';
import { QueryStaffDto } from '../dto/staff/query-staff.dto';
import { CreateStaffDto } from '../dto/staff/create-staff.dto';
import { UpdateStaffDto } from '../dto/staff/update-staff.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Staff Management')
@Controller('users/staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StaffManagementController {
  constructor(private readonly staffService: StaffManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cán bộ, giáo viên, nhân viên trường học' })
  async findAll(@Query() query: QueryStaffDto) {
    return this.staffService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng số lượng nhân sự theo vị trí' })
  async getStats() {
    return this.staffService.getStats();
  }

  @Get('roles')
  @ApiOperation({ summary: 'Lấy danh mục vai trò nhân sự' })
  async getRoles() {
    return this.staffService.getRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết một nhân viên' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @Post()
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Thêm mới nhân viên / giáo viên (BGH)' })
  async create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Patch(':id')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cập nhật nhân viên / phân quyền (BGH)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, dto);
  }

  @Put(':id')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cập nhật toàn bộ thông tin nhân sự (BGH)' })
  async updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, dto);
  }

  @Patch(':id/restore')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Khôi phục tài khoản nhân sự' })
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.restore(id);
  }

  @Patch(':id/status')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Đổi trạng thái tài khoản nhân sự' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.toggleStatus(id);
  }

  @Delete(':id')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Xóa nhân viên (BGH)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.remove(id);
  }
}
