import { Controller, Get, Patch, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from '../services/tenant.service';
import { UpdateTenantProfileDto } from '../dto/update-tenant-profile.dto';
import { UploadLogoDto } from '../dto/upload-logo.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Tenant & School Management')
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin cấu hình trường mầm non & pháp lý ATTP' })
  async getProfile() {
    return this.tenantService.getProfile();
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin trường mầm non (Dành cho BGH)' })
  async updateProfile(@Body() dto: UpdateTenantProfileDto) {
    return this.tenantService.updateProfile(dto);
  }

  @Post('upload-logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tải lên logo trường mầm non' })
  async uploadLogo(@Body() dto: UploadLogoDto) {
    return this.tenantService.uploadLogo(dto);
  }

  @Post('sync-education-db')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCHOOL_MANAGER', 'PRINCIPAL', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đồng bộ cơ sở dữ liệu ngành GD&ĐT' })
  async syncEducationDb() {
    return this.tenantService.syncEducationDb();
  }

  @Public()
  @Get('languages')
  @ApiOperation({ summary: 'Lấy danh sách các ngôn ngữ được hỗ trợ (i18n)' })
  async getLanguages() {
    return this.tenantService.getLanguages();
  }

  @Public()
  @Get('translations/:langCode')
  @ApiOperation({ summary: 'Lấy từ điển bản dịch UI theo ngôn ngữ (i18n)' })
  async getTranslations(
    @Param('langCode') langCode: string,
    @Query('namespace') namespace?: string,
  ) {
    return this.tenantService.getTranslations(langCode, namespace);
  }
}
