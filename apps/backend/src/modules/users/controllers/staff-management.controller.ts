import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { StaffManagementService } from '../services/staff-management.service';
import { CreateStaffDto } from '../dto/staff/create-staff.dto';
import { UpdateStaffDto } from '../dto/staff/update-staff.dto';
import { QueryStaffDto } from '../dto/staff/query-staff.dto';

@Controller('users/staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PRINCIPAL', 'SUPER_ADMIN')
export class StaffManagementController {
  constructor(private readonly staffService: StaffManagementService) {}

  /**
   * GET /api/v1/users/staff
   * Lấy danh sách nhân sự của trường (kèm phân trang, tìm kiếm, lọc theo vai trò, trạng thái).
   */
  @Get()
  async getStaffList(
    @CurrentUser('tenantId') tenantId: string,
    @Query() query: QueryStaffDto,
  ) {
    return this.staffService.getStaffList(tenantId, query);
  }

  /**
   * GET /api/v1/users/staff/stats
   * Lấy thống kê số lượng nhân sự các danh mục (KPI cards).
   */
  @Get('stats')
  async getStaffStats(@CurrentUser('tenantId') tenantId: string) {
    return this.staffService.getStaffStats(tenantId);
  }

  /**
   * GET /api/v1/users/staff/roles
   * Lấy danh sách vai trò chuyên môn khả dụng trong trường.
   */
  @Get('roles')
  async getAvailableStaffRoles() {
    return this.staffService.getAvailableStaffRoles();
  }

  /**
   * GET /api/v1/users/staff/:id
   * Xem thông tin chi tiết 1 nhân sự.
   */
  @Get(':id')
  async getStaffById(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.staffService.getStaffById(tenantId, id);
  }

  /**
   * POST /api/v1/users/staff
   * Tạo mới tài khoản nhân sự và gán vai trò.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStaff(
    @CurrentUser('tenantId') tenantId: string,
    @Body() createDto: CreateStaffDto,
  ) {
    return this.staffService.createStaff(tenantId, createDto);
  }

  /**
   * PUT /api/v1/users/staff/:id
   * Cập nhật thông tin và vai trò nhân sự.
   */
  @Put(':id')
  async updateStaff(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateStaffDto,
  ) {
    return this.staffService.updateStaff(tenantId, id, updateDto);
  }

  /**
   * DELETE /api/v1/users/staff/:id
   * Xóa mềm (Soft Delete) tài khoản nhân sự.
   */
  @Delete(':id')
  async softDeleteStaff(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') currentUserId: string,
    @Param('id') id: string,
  ) {
    return this.staffService.softDeleteStaff(tenantId, currentUserId, id);
  }

  /**
   * PATCH /api/v1/users/staff/:id/restore
   * Khôi phục tài khoản nhân sự đã xóa mềm.
   */
  @Patch(':id/restore')
  async restoreStaff(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.staffService.restoreStaff(tenantId, id);
  }

  /**
   * PATCH /api/v1/users/staff/:id/status
   * Chuyển đổi trạng thái tài khoản (ACTIVE <-> INACTIVE).
   */
  @Patch(':id/status')
  async toggleStaffStatus(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') currentUserId: string,
    @Param('id') id: string,
  ) {
    return this.staffService.toggleStaffStatus(tenantId, currentUserId, id);
  }
}
