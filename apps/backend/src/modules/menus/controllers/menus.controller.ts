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
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { MenusService } from '../services/menus.service';
import { MenuExportService } from '../services/menu-export.service';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { UpdateMenuDto } from '../dto/update-menu.dto';
import { AdjustDishDto } from '../dto/adjust-dish.dto';
import { ApproveMenuDto } from '../dto/approve-menu.dto';
import { RejectMenuDto } from '../dto/reject-menu.dto';
import { ImportExcelMenuDto } from '../dto/import-excel.dto';
import { QueryMenuDto } from '../dto/query-menu.dto';
import { RotateCycleMenuDto } from '../dto/rotate-cycle-menu.dto';
import { EmergencyRotateDishDto } from '../dto/emergency-rotate-dish.dto';
import { AutoGenerateMenuDto } from '../dto/auto-generate-menu.dto';
import { ApplySubstituteDishDto } from '../dto/apply-substitute-dish.dto';
import { RequestEditMenuDto } from '../dto/request-edit-menu.dto';
import { RespondEditRequestDto } from '../dto/respond-edit-request.dto';

@Controller('menus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenusController {
  constructor(
    private readonly menusService: MenusService,
    private readonly exportService: MenuExportService,
  ) {}

  /**
   * 1. GET /api/v1/menus: Lấy danh sách thực đơn tuần
   */
  @Get()
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER', 'KITCHEN_STAFF')
  async findAll(@CurrentUser('tenantId') tenantId: string, @Query() query: QueryMenuDto) {
    return this.menusService.findAll(tenantId, query);
  }

  /**
   * 2. GET /api/v1/menus/statistics: Thống kê KPI ở đầu giao diện
   */
  @Get('statistics')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async getStatistics(@CurrentUser('tenantId') tenantId: string) {
    return this.menusService.getStatistics(tenantId);
  }

  /**
   * 3. GET /api/v1/menus/available-dishes: Lấy danh sách món ăn có sẵn
   */
  @Get('available-dishes')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async getAvailableDishes(@CurrentUser('tenantId') tenantId: string) {
    return this.menusService.getAvailableDishes(tenantId);
  }

  /**
   * 4. GET /api/v1/menus/:id: Chi tiết thực đơn tuần kèm ma trận món ăn
   */
  @Get(':id')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER', 'KITCHEN_STAFF')
  async findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.menusService.findOne(tenantId, id);
  }

  /**
   * 5. GET /api/v1/menus/:id/versions: Danh sách các phiên bản thực đơn
   */
  @Get(':id/versions')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async getVersions(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.menusService.getVersions(tenantId, id);
  }

  /**
   * 6. POST /api/v1/menus: Tạo thực đơn tuần thủ công
   */
  @Post()
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMenuDto,
  ) {
    return this.menusService.create(tenantId, userId, dto);
  }

  /**
   * 7. POST /api/v1/menus/import-excel: Import thực đơn từ dữ liệu Excel
   */
  @Post('import-excel')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async importExcel(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ImportExcelMenuDto,
  ) {
    return this.menusService.importExcel(tenantId, userId, dto);
  }

  /**
   * 7.1 POST /api/v1/menus/auto-generate: Tự động tạo thực đơn tuần (Chống trùng lặp 2 tuần & Chuẩn TT 28)
   */
  @Post('auto-generate')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async autoGenerate(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AutoGenerateMenuDto,
  ) {
    return this.menusService.autoGenerateWeeklyMenu(tenantId, userId, dto);
  }

  /**
   * 8. POST /api/v1/menus/:id/create-version: Nhân bản tạo phiên bản mới (v1.1, v2.0...)
   */
  @Post(':id/create-version')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async createVersion(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.menusService.createVersion(tenantId, userId, id);
  }

  /**
   * 9. PUT /api/v1/menus/:id: Cập nhật thông tin thực đơn dự thảo
   */
  @Put(':id')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMenuDto,
  ) {
    return this.menusService.update(tenantId, id, dto);
  }

  /**
   * 10. POST /api/v1/menus/:id/adjust-dish: Tinh chỉnh món ăn (thêm, đổi định lượng, món thay thế)
   */
  @Post(':id/adjust-dish')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async adjustDish(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') menuId: string,
    @Body() dto: AdjustDishDto,
  ) {
    return this.menusService.adjustDish(tenantId, menuId, dto);
  }

  /**
   * 11. DELETE /api/v1/menus/:id/dishes/:menuDishId: Xóa món ăn khỏi bữa ăn (Xóa mềm)
   */
  @Delete(':id/dishes/:menuDishId')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async removeDish(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') menuId: string,
    @Param('menuDishId') menuDishId: string,
  ) {
    return { success: await this.menusService.removeDish(tenantId, menuId, menuDishId) };
  }

  /**
   * 12. POST /api/v1/menus/:id/submit: Gửi thực đơn lên Ban Giám Hiệu phê duyệt
   */
  @Post(':id/submit')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async submitForReview(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.menusService.submitForReview(tenantId, id);
  }

  /**
   * 13. POST /api/v1/menus/:id/approve: Ban Giám Hiệu phê duyệt thực đơn
   */
  @Post(':id/approve')
  @Roles('PRINCIPAL', 'SUPER_ADMIN')
  async approve(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ApproveMenuDto,
  ) {
    return this.menusService.approve(tenantId, userId, id, dto);
  }

  /**
   * 14. POST /api/v1/menus/:id/reject: Ban Giám Hiệu từ chối thực đơn (kèm lý do)
   */
  @Post(':id/reject')
  @Roles('PRINCIPAL', 'SUPER_ADMIN')
  async reject(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RejectMenuDto,
  ) {
    return this.menusService.reject(tenantId, userId, id, dto);
  }

  /**
   * 15. POST /api/v1/menus/:id/publish: Khóa & Công bố thực đơn toàn trường
   */
  @Post(':id/publish')
  @Roles('PRINCIPAL', 'SUPER_ADMIN')
  async publish(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.menusService.publish(tenantId, userId, id);
  }

  /**
   * 15.1. POST /api/v1/menus/:id/request-edit: Chuyên viên Dinh dưỡng xin phép Hiệu trưởng chỉnh sửa thực đơn đã duyệt
   */
  @Post(':id/request-edit')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async requestEdit(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RequestEditMenuDto,
  ) {
    return this.menusService.requestEdit(tenantId, userId, id, dto.reason);
  }

  /**
   * 15.2. POST /api/v1/menus/:id/approve-edit-request: Hiệu trưởng chấp thuận yêu cầu chỉnh sửa (mở khóa về DRAFT)
   */
  @Post(':id/approve-edit-request')
  @Roles('PRINCIPAL', 'SUPER_ADMIN')
  async approveEditRequest(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RespondEditRequestDto,
  ) {
    return this.menusService.approveEditRequest(tenantId, userId, id, dto.notes);
  }

  /**
   * 15.3. POST /api/v1/menus/:id/reject-edit-request: Hiệu trưởng từ chối yêu cầu chỉnh sửa
   */
  @Post(':id/reject-edit-request')
  @Roles('PRINCIPAL', 'SUPER_ADMIN')
  async rejectEditRequest(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RequestEditMenuDto,
  ) {
    return this.menusService.rejectEditRequest(tenantId, userId, id, dto.reason);
  }

  /**
   * 15.4. POST /api/v1/menus/:id/cancel-edit-request: Hủy yêu cầu xin chỉnh sửa
   */
  @Post(':id/cancel-edit-request')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async cancelEditRequest(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.menusService.cancelEditRequest(tenantId, userId, id);
  }

  /**
   * 16. DELETE /api/v1/menus/:id: Xóa mềm thực đơn tuần (Soft Delete)
   */
  @Delete(':id')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async softDelete(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return { success: await this.menusService.softDelete(tenantId, id) };
  }

  /**
   * 17. POST /api/v1/menus/:id/restore: Khôi phục thực đơn đã xóa mềm
   */
  @Post(':id/restore')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async restore(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.menusService.restore(tenantId, id);
  }

  /**
   * 18. GET /api/v1/menus/:id/export/data: Lấy dữ liệu cấu trúc xuất in PDF
   */
  @Get(':id/export/data')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER', 'KITCHEN_STAFF')
  async getExportData(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.exportService.generateExportData(tenantId, id);
  }

  /**
   * 19. GET /api/v1/menus/:id/export/excel: Tải file Excel/CSV chuẩn UTF-8
   */
  @Get(':id/export/excel')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER', 'KITCHEN_STAFF')
  async exportExcel(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportCsvBuffer(tenantId, id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Thuc_don_tuan_${id}.csv"`);
    res.send(buffer);
  }

  /**
   * 20. POST /api/v1/menus/:id/rotate-cycle: Xoay vòng chu kỳ thực đơn (2-4 tuần)
   */
  @Post(':id/rotate-cycle')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async rotateCycle(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RotateCycleMenuDto,
  ) {
    return this.menusService.rotateCycleMenu(tenantId, userId, id, dto);
  }

  /**
   * 21. POST /api/v1/menus/:id/dishes/:menuDishId/emergency-rotate: Đổi món khẩn cấp trong ca bếp / dị ứng
   */
  @Post(':id/dishes/:menuDishId/emergency-rotate')
  @Roles('KITCHEN_STAFF', 'NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN')
  async emergencyRotate(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') menuId: string,
    @Param('menuDishId') menuDishId: string,
    @Body() dto: EmergencyRotateDishDto,
  ) {
    return this.menusService.emergencyRotateDish(tenantId, menuId, menuDishId, dto);
  }

  /**
   * 22. GET /api/v1/menus/:id/advisory: Cảnh báo Dị ứng & Đề xuất cá nhân hóa theo chỉ số BMI (Béo/Gầy)
   */
  @Get(':id/advisory')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN', 'TEACHER', 'KITCHEN_STAFF')
  async getAdvisory(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.menusService.getAllergyAndBmiAdvisory(tenantId, id);
  }

  /**
   * 23. POST /api/v1/menus/:id/dishes/:menuDishId/apply-substitute: Gán món ăn thay thế an toàn cho ô thực đơn
   */
  @Post(':id/dishes/:menuDishId/apply-substitute')
  @Roles('NUTRITIONIST', 'PRINCIPAL', 'SUPER_ADMIN', 'KITCHEN_STAFF')
  async applySubstitute(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') menuId: string,
    @Param('menuDishId') menuDishId: string,
    @Body() dto: ApplySubstituteDishDto,
  ) {
    return this.menusService.applySubstituteDish(
      tenantId,
      menuId,
      menuDishId,
      dto.substituteDishId,
      dto.notes,
    );
  }
}

