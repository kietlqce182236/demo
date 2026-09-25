import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { UpdateTenantProfileDto } from '../dto/update-tenant-profile.dto';
import { UploadLogoDto } from '../dto/upload-logo.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';

@Controller('tenant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Xem thông tin cấu hình trường học
   * Cho phép Hiệu trưởng, Quản trị viên, Chuyên viên Dinh dưỡng xem
   */
  @Get('profile')
  @Roles('PRINCIPAL', 'SUPER_ADMIN', 'NUTRITIONIST')
  async getProfile(@CurrentTenant() tenantId: string) {
    return this.tenantService.getTenantProfile(tenantId);
  }

  /**
   * Cập nhật thông tin trường học & pháp lý ATTP
   * Chỉ Hiệu trưởng / Ban Giám Hiệu và SuperAdmin được phép chỉnh sửa
   */
  @Patch('profile')
  @Roles('PRINCIPAL', 'SUPER_ADMIN')
  async updateProfile(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantProfileDto,
  ) {
    return this.tenantService.updateTenantProfile(tenantId, dto);
  }

  /**
   * Tải lên Logo trường học với kiểm duyệt định dạng và dung lượng
   * Chỉ Hiệu trưởng / Ban Giám Hiệu được quyền cập nhật nhận diện
   */
  @Post('upload-logo')
  @Roles('PRINCIPAL', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async uploadLogo(
    @CurrentTenant() tenantId: string,
    @Body() dto: UploadLogoDto,
  ) {
    return this.tenantService.uploadLogo(tenantId, dto);
  }

  /**
   * Đồng bộ dữ liệu với Cơ sở dữ liệu ngành của Bộ GD&ĐT
   */
  @Post('sync-education-db')
  @Roles('PRINCIPAL', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async syncEducationDb(@CurrentTenant() tenantId: string) {
    return this.tenantService.syncEducationDb(tenantId);
  }
}
