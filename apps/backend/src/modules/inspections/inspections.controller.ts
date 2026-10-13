import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
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

  @Get()
  @ApiOperation({ summary: 'Lấy toàn bộ danh sách biên bản kiểm thực 3 bước (QĐ 1246/QĐ-BYT)' })
  async getInspections(@Query() query: any) {
    return this.inspectionsService.getInspections(query);
  }

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
  async disposeSamplePatch(@Param('id', ParseIntPipe) id: number) {
    return this.inspectionsService.disposeSample(id);
  }

  @Post('samples/:id/dispose')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Hủy mẫu lưu an toàn sau 24 giờ (POST fallback)' })
  async disposeSamplePost(@Param('id', ParseIntPipe) id: number) {
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

  @Post()
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST')
  @ApiOperation({ summary: 'Lập mới biên bản kiểm thực 3 bước' })
  async createInspection(
    @Body() body: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.inspectionsService.createStep1(body, userId);
  }

  @Patch(':id/step2')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST')
  @ApiOperation({ summary: 'Bước 2: Kiểm tra thực phẩm trong quá trình chế biến' })
  async updateStep2(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.inspectionsService.updateStep2(id, body, userId);
  }

  @Patch(':id/step3')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST')
  @ApiOperation({ summary: 'Bước 3: Kiểm tra thức ăn trước khi ăn & lưu mẫu' })
  async updateStep3(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.inspectionsService.updateStep3(id, body, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết biên bản kiểm thực 3 bước' })
  async getInspectionDetail(@Param('id') id: string) {
    return this.inspectionsService.getInspectionDetail(id);
  }

  @Post('create-session')
  @Roles('NUTRITIONIST', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Chuyên gia dinh dưỡng lập biên bản kiểm thực mới (chờ bếp chụp ảnh)' })
  async createSessionByNutritionist(
    @Body() body: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.inspectionsService.createSessionByNutritionist(body, userId);
  }

  @Post(':id/kitchen-submit')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Bếp tải ảnh minh chứng 3 bước và gửi lên để duyệt' })
  async kitchenSubmitPhotos(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.inspectionsService.kitchenSubmitPhotos(id, body, userId);
  }

  @Post(':id/approve')
  @Roles('NUTRITIONIST', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Chuyên gia dinh dưỡng phê duyệt biên bản kiểm thực đạt chuẩn' })
  async approveInspection(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.inspectionsService.approveInspection(id, body, userId);
  }

  @Post(':id/reject')
  @Roles('NUTRITIONIST', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Chuyên gia dinh dưỡng yêu cầu bếp chụp lại ảnh minh chứng' })
  async rejectInspection(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('sub') userId: number,
  ) {
    return this.inspectionsService.rejectInspection(id, body, userId);
  }
}
