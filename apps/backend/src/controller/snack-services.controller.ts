import { Controller, Get, Post, Body, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SnackServicesService } from '../modules/snack-services/snack-services.service';
import { CreateSnackServicePeriodDto } from '../modules/snack-services/dto/create-snack-service-period.dto';

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

  @Get('list')
  @ApiOperation({ summary: 'UC56: Lấy danh sách gói ăn xế đang hoạt động (cho dropdown tạo đợt)' })
  async getServicesList() {
    return this.snackServicesService.getServicesList();
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
}
