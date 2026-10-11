import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InspectionsService } from './inspections.service';
import { SealSampleDto } from './dto/seal-sample.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Food Safety & 3-Step Inspections')
@Controller('inspections')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get('samples')
  @ApiOperation({ summary: 'Lấy danh sách các mẫu thức ăn lưu 24h (QĐ 1246/QĐ-BYT)' })
  async getSamples() {
    return this.inspectionsService.getSamples();
  }

  @Get('samples/:id')
  @ApiOperation({ summary: 'Xem chi tiết mẫu thức ăn lưu 24h và tình trạng niêm phong' })
  async getSampleDetail(@Param('id', ParseIntPipe) id: number) {
    return this.inspectionsService.getSampleDetail(id);
  }

  @Patch('samples/:id/dispose')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Hủy mẫu lưu an toàn sau 24 giờ' })
  async disposeSample(@Param('id', ParseIntPipe) id: number) {
    return this.inspectionsService.disposeSample(id);
  }

  @Post('samples')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Niêm phong mẫu thức ăn lưu 24 giờ' })
  async sealSample(@Body() dto: SealSampleDto) {
    return this.inspectionsService.sealSample(dto);
  }

  @Post('step1')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST')
  @ApiOperation({ summary: 'Bước 1: Kiểm tra thực phẩm trước khi chế biến' })
  async createStep1(
    @Body() body: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.inspectionsService.createStep1(body, userId);
  }

  @Patch(':id/step2')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST')
  @ApiOperation({ summary: 'Bước 2: Kiểm tra thực phẩm trong quá trình chế biến' })
  async updateStep2(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.inspectionsService.updateStep2(id, body, userId);
  }

  @Patch(':id/step3')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST')
  @ApiOperation({ summary: 'Bước 3: Kiểm tra thức ăn trước khi ăn & lưu mẫu' })
  async updateStep3(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.inspectionsService.updateStep3(id, body, userId);
  }
}
