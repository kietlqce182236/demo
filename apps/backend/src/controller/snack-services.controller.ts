import { Controller, Get, Post, Put, Delete, Body, Query, Headers, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SnackServicesService } from '../modules/snack-services/snack-services.service';
import { CreateSnackServicePeriodDto } from '../modules/snack-services/dto/create-snack-service-period.dto';
import { UpdateSnackServiceDto } from '../modules/snack-services/dto/update-snack-service.dto';
import { CreateSnackServiceDto } from '../modules/snack-services/dto/create-snack-service.dto';
import { UpdateStudentEnrollmentDto } from '../modules/snack-services/dto/update-student-enrollment.dto';

@ApiTags('Snack Services')
@Controller('snack-services')
export class SnackServicesController {
  constructor(private readonly snackServicesService: SnackServicesService) {}

  @Get()
  @ApiOperation({ summary: 'UC54: Lấy danh sách gói ăn xế chiều và dịch vụ bán trú từ Database PostgreSQL' })
  @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm theo tên gói hoặc mã đợt' })
  @ApiQuery({ name: 'status', required: false, description: 'Lọc theo trạng thái (ALL, OPEN, UPCOMING, CLOSED)' })
  @ApiQuery({ name: 'grade', required: false, description: 'Lọc theo khối lớp áp dụng' })
  async getSnackServices(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('grade') grade?: string,
  ) {
    return this.snackServicesService.findAll(search, status, grade);
  }

  @Get('dayboarding')
  @ApiOperation({ summary: 'Lấy dữ liệu trung tâm quản lý Dịch vụ Bán Trú (KPIs, Danh mục dịch vụ, Bán trú theo lớp, Sổ học sinh)' })
  async getDayboardingHub(@Headers('x-tenant-id') tenantId?: string) {
    const resolvedTenantId = tenantId || 'a0000000-0000-0000-0000-000000000001';
    return this.snackServicesService.getDayboardingHub(resolvedTenantId);
  }

  @Get('list')
  @ApiOperation({ summary: 'UC56: Lấy danh sách gói ăn xế đang hoạt động (cho dropdown tạo đợt)' })
  async getServicesList() {
    return this.snackServicesService.getServicesList();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới gói dịch vụ bán trú / ăn xế' })
  async createService(
    @Body() dto: CreateSnackServiceDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    const resolvedTenantId = tenantId || 'a0000000-0000-0000-0000-000000000001';
    return this.snackServicesService.createService(dto, resolvedTenantId);
  }

  @Post('periods')
  @ApiOperation({ summary: 'UC56: Tạo đợt đăng ký ăn xế chiều mới' })
  async createPeriod(
    @Body() dto: CreateSnackServicePeriodDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    // Fallback to default tenant if no header provided
    const resolvedTenantId = tenantId || 'a0000000-0000-0000-0000-000000000001';
    return this.snackServicesService.createPeriod(dto, resolvedTenantId);
  }

  @Post('enrollment')
  @ApiOperation({ summary: 'Cập nhật dịch vụ bán trú cho từng học sinh' })
  async updateStudentEnrollment(
    @Body() dto: UpdateStudentEnrollmentDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    const resolvedTenantId = tenantId || 'a0000000-0000-0000-0000-000000000001';
    return this.snackServicesService.updateStudentEnrollment(dto, resolvedTenantId);
  }

  @Put('periods/:id/close')
  @ApiOperation({ summary: 'UC58: Đóng đợt đăng ký ăn xế chiều' })
  @ApiParam({ name: 'id', description: 'ID đợt đăng ký' })
  async closePeriod(@Param('id') id: string) {
    return this.snackServicesService.closePeriod(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'UC57: Lấy chi tiết gói ăn xế theo ID' })
  @ApiParam({ name: 'id', description: 'ID gói dịch vụ ăn xế' })
  async getServiceById(@Param('id') id: string) {
    return this.snackServicesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'UC57: Cập nhật cấu hình gói dịch vụ ăn xế' })
  @ApiParam({ name: 'id', description: 'ID gói dịch vụ ăn xế' })
  async updateService(
    @Param('id') id: string,
    @Body() dto: UpdateSnackServiceDto,
  ) {
    return this.snackServicesService.updateService(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa gói dịch vụ' })
  @ApiParam({ name: 'id', description: 'ID gói dịch vụ' })
  async deleteService(@Param('id') id: string) {
    return this.snackServicesService.deleteService(id);
  }
}

