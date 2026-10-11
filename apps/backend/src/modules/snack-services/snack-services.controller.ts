import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SnackServicesService } from './snack-services.service';
import { CreateSnackServicePeriodDto } from './dto/create-snack-service-period.dto';
import { UpdateSnackServiceDto } from './dto/update-snack-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Snack Services Management')
@Controller('snack-services')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SnackServicesController {
  constructor(private readonly snackService: SnackServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các kỳ dịch vụ ăn xế 17h' })
  async findAll() {
    return this.snackService.findAll();
  }

  @Get('list')
  @ApiOperation({ summary: 'Lấy danh sách rút gọn các kỳ dịch vụ ăn xế' })
  async getList() {
    return this.snackService.findAll();
  }

  @Get('dayboarding')
  @ApiOperation({ summary: 'Lấy dữ liệu tổng hợp dịch vụ bán trú và đăng ký' })
  async getDayboarding() {
    return this.snackService.getDayboardingSummary();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết kỳ dịch vụ ăn xế và danh sách trẻ đăng ký' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.snackService.findOne(id);
  }

  @Post('periods')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Tạo mới kỳ đăng ký dịch vụ ăn xế' })
  async createPeriod(@Body() dto: CreateSnackServicePeriodDto) {
    return this.snackService.createPeriod(dto);
  }

  @Post('enrollment')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER', 'PARENT')
  @ApiOperation({ summary: 'Đăng ký tham gia dịch vụ ăn xế / bán trú' })
  async registerEnrollment(@Body() body: any) {
    return this.snackService.registerEnrollment(body);
  }

  @Post()
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Tạo mới dịch vụ bán trú' })
  async createService(@Body() dto: any) {
    return this.snackService.createService(dto);
  }

  @Put(':id')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cập nhật thông tin kỳ dịch vụ ăn xế' })
  async updatePeriod(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSnackServiceDto,
  ) {
    return this.snackService.updatePeriod(id, dto);
  }

  @Put('periods/:id/close')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Đóng kỳ đăng ký ăn xế' })
  async closePeriod(@Param('id', ParseIntPipe) id: number) {
    return this.snackService.closePeriod(id);
  }

  @Delete(':id')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Xóa dịch vụ bán trú' })
  async deleteService(@Param('id', ParseIntPipe) id: number) {
    return this.snackService.deleteService(id);
  }
}
