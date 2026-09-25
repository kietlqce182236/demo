import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { QuickLoginDto } from '../dto/quick-login.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../strategies/jwt.strategy';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /api/v1/auth/tenants
   * Public — Lấy danh sách trường mầm non đang hoạt động cho dropdown login.
   * Không cần JWT. Kết quả ít thay đổi → frontend nên cache 5 phút.
   */
  @Get('tenants')
  @ApiOperation({ summary: 'Lấy danh sách trường mầm non (public)' })
  async getTenants() {
    const tenants = await this.authService.getActiveTenants();
    return { tenants };
  }

  /**
   * POST /api/v1/auth/login
   * Public — Đăng nhập bằng email + password.
   * Tenant ID gửi qua header x-tenant-id (do TenantResolverMiddleware xử lý).
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'UUID của trường mầm non' })
  async login(
    @Body() loginDto: LoginDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.authService.login(loginDto, tenantId);
  }

  /**
   * POST /api/v1/auth/refresh
   * Public — Làm mới access token bằng refresh token.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  /**
   * POST /api/v1/auth/quick-login
   * Đăng nhập nhanh theo role (development/testing).
   * Bị block ở production bởi AuthService.
   */
  @Post('quick-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập nhanh theo role (dev only)' })
  async quickLogin(@Body() dto: QuickLoginDto) {
    return this.authService.quickLogin(dto.roleCode, dto.tenantId);
  }

  /**
   * GET /api/v1/auth/me
   * Authenticated — Lấy thông tin user hiện tại.
   * Chỉ trả về các trường hiển thị (không có password_hash, 2fa secret).
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
  async getMe(@Req() req: { user: JwtPayload }) {
    return this.authService.getMe(req.user.sub);
  }
}
