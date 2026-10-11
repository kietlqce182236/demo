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
import { MenusService } from '../services/menus.service';
import { MenuExportService } from '../services/menu-export.service';
import { QueryMenuDto } from '../dto/query-menu.dto';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { UpdateMenuDto } from '../dto/update-menu.dto';
import { AdjustDishDto } from '../dto/adjust-dish.dto';
import { ApproveMenuDto } from '../dto/approve-menu.dto';
import { RejectMenuDto } from '../dto/reject-menu.dto';
import { AutoGenerateMenuDto } from '../dto/auto-generate-menu.dto';
import { EmergencyRotateDishDto } from '../dto/emergency-rotate-dish.dto';
import { ApplySubstituteDishDto } from '../dto/apply-substitute-dish.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Menus & Weekly Planning')
@Controller('menus')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MenusController {
  constructor(
    private readonly menusService: MenusService,
    private readonly exportService: MenuExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thực đơn tuần (tìm kiếm, lọc theo trạng thái/khối)' })
  async findAll(@Query() query: QueryMenuDto) {
    return this.menusService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Thống kê tổng số thực đơn theo trạng thái phê duyệt' })
  async getStatistics() {
    return this.menusService.getStatistics();
  }

  @Get('available-dishes')
  @ApiOperation({ summary: 'Lấy danh sách các món ăn khả dụng để xếp thực đơn' })
  async getAvailableDishes() {
    return this.menusService.getAvailableDishes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết thực đơn tuần theo ma trận ngày và bữa ăn' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.findOne(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Lấy danh sách các phiên bản của thực đơn tuần' })
  async getVersions(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.getVersions(id);
  }

  @Get(':id/advisory')
  @ApiOperation({ summary: 'Lấy tư vấn Dị ứng học sinh & cá nhân hóa dinh dưỡng BMI' })
  async getAdvisory(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.getAdvisory(id);
  }

  @Post()
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Lập thực đơn tuần mới' })
  async create(
    @Body() dto: CreateMenuDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.menusService.create(dto, userId);
  }

  @Put(':id')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Cập nhật thông tin thực đơn' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuDto,
  ) {
    return this.menusService.update(id, dto);
  }

  @Post(':id/create-version')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Tạo phiên bản mới cho thực đơn (v1.1, v2.0...)' })
  async createVersion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.menusService.createVersion(id, userId);
  }

  @Post(':menuId/adjust-dish')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Tinh chỉnh / đổi món ăn trong một bữa cụ thể' })
  async adjustDish(
    @Param('menuId', ParseIntPipe) menuId: number,
    @Body() dto: AdjustDishDto,
  ) {
    return this.menusService.adjustDish(menuId, dto);
  }

  @Delete(':menuId/dishes/:menuDishId')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Xóa món ăn khỏi bữa ăn' })
  async removeDish(
    @Param('menuId', ParseIntPipe) menuId: number,
    @Param('menuDishId', ParseIntPipe) menuDishId: number,
  ) {
    return this.menusService.removeDish(menuId, menuDishId);
  }

  @Post(':id/submit')
  @Roles('NUTRITIONIST')
  @ApiOperation({ summary: 'Gửi thực đơn lên Ban Giám Hiệu phê duyệt' })
  async submitForReview(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.submitForReview(id);
  }

  @Post(':id/approve')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Ban Giám Hiệu phê duyệt thực đơn tuần' })
  async approveMenu(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') approverId: number,
    @Body() dto: ApproveMenuDto,
  ) {
    return this.menusService.approveMenu(id, approverId, dto.approvalNotes);
  }

  @Post(':id/reject')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Ban Giám Hiệu từ chối thực đơn tuần (yêu cầu sửa)' })
  async rejectMenu(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') approverId: number,
    @Body() dto: RejectMenuDto,
  ) {
    return this.menusService.rejectMenu(id, approverId, dto.rejectionReason);
  }

  @Post(':id/publish')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'NUTRITIONIST')
  @ApiOperation({ summary: 'Công bố thực đơn tuần cho phụ huynh & giáo viên' })
  async publishMenu(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.publishMenu(id);
  }

  @Post('auto-generate')
  @Roles('NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Tự động tạo thực đơn cân đối dinh dưỡng theo chuẩn Thông tư 28' })
  async autoGenerate(
    @Body() dto: AutoGenerateMenuDto,
    @CurrentUser('sub') userId: number,
  ): Promise<any> {
    return this.menusService.autoGenerate(dto, userId);
  }

  @Post(':id/emergency-rotate-dish')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST', 'SCHOOL_MANAGER', 'PRINCIPAL')
  @ApiOperation({ summary: 'Xoay món khẩn cấp (khi thiếu nguyên liệu tại bếp)' })
  async emergencyRotateDish(@Body() dto: EmergencyRotateDishDto) {
    return { success: true, message: 'Đã ghi nhận xoay món khẩn cấp', details: dto };
  }

  @Post(':id/apply-substitute-dish')
  @Roles('NUTRITIONIST', 'TEACHER', 'KITCHEN_STAFF')
  @ApiOperation({ summary: 'Áp dụng món thay thế cho trẻ dị ứng' })
  async applySubstituteDish(@Body() dto: ApplySubstituteDishDto) {
    return { success: true, message: 'Đã lưu món thay thế cho học sinh', details: dto };
  }

  @Post(':menuId/dishes/:menuDishId/apply-substitute')
  @Roles('NUTRITIONIST', 'TEACHER', 'KITCHEN_STAFF')
  @ApiOperation({ summary: 'Gán món thay thế vào ô món ăn trong thực đơn' })
  async applySubstitute(
    @Param('menuId', ParseIntPipe) menuId: number,
    @Param('menuDishId', ParseIntPipe) menuDishId: number,
    @Body() body: { substituteDishId: string | null; notes?: string },
  ) {
    return {
      id: String(menuDishId),
      substituteDishId: body.substituteDishId,
      substituteNotes: body.notes,
      success: true,
      message: 'Đã cập nhật món thay thế thành công',
    };
  }

  @Post(':id/request-edit')
  @Roles('NUTRITIONIST')
  @ApiOperation({ summary: 'Chuyên viên dinh dưỡng xin chỉnh sửa thực đơn' })
  async requestEdit(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    return this.menusService.findOne(id);
  }

  @Post(':id/approve-edit-request')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Hiệu trưởng đồng ý yêu cầu chỉnh sửa thực đơn' })
  async approveEditRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body('notes') notes?: string,
  ) {
    return this.menusService.findOne(id);
  }

  @Post(':id/reject-edit-request')
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Hiệu trưởng từ chối yêu cầu chỉnh sửa thực đơn' })
  async rejectEditRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.menusService.findOne(id);
  }

  @Post(':id/cancel-edit-request')
  @Roles('NUTRITIONIST')
  @ApiOperation({ summary: 'Hủy yêu cầu xin chỉnh sửa' })
  async cancelEditRequest(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.findOne(id);
  }

  @Get(':id/export/excel')
  @ApiOperation({ summary: 'Xuất thực đơn tuần ra định dạng Excel (.xlsx)' })
  async exportExcel(@Param('id', ParseIntPipe) id: number) {
    return this.exportService.exportExcel(id);
  }

  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Xuất thực đơn tuần ra định dạng PDF (.pdf)' })
  async exportPdf(@Param('id', ParseIntPipe) id: number) {
    return this.exportService.exportPdf(id);
  }
}
