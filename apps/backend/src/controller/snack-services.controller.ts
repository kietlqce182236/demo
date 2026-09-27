import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SnackServicesService } from '../modules/snack-services/snack-services.service';

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
}
