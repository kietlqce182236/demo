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

import { PasswordResetService } from '../services/password-reset.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyResetOtpDto } from '../dto/verify-reset-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

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
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'UUID của trường mầm non' })
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
   * POST /api/v1/auth/forgot-password
   * Public — Yêu cầu gửi mã xác thực OTP qua Email
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yêu cầu gửi mã OTP đặt lại mật khẩu qua Email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetService.forgotPassword(dto);
  }

  /**
   * POST /api/v1/auth/verify-reset-otp
   * Public — Xác thực mã OTP 6 số để nhận resetToken
   */
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực mã OTP 6 số để nhận reset token' })
  async verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.passwordResetService.verifyResetOtp(dto);
  }

  /**
   * POST /api/v1/auth/reset-password
   * Public — Đặt mật khẩu mới với resetToken
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thiết lập mật khẩu mới sau khi xác thực OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto);
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

  /**
   * POST /api/v1/auth/change-password
   * Authenticated — Đổi mật khẩu (lần đầu hoặc định kỳ)
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu người dùng' })
  async changePassword(
    @Req() req: { user: JwtPayload },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.sub, dto);
  }

  /**
   * POST /api/v1/auth/2fa/setup
   * Authenticated — Khởi tạo mã secret và QR Code cho 2FA
   */
  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Khởi tạo cấu hình 2FA' })
  async setup2Fa(@Req() req: { user: JwtPayload }) {
    return this.authService.setup2Fa(req.user.sub);
  }

  /**
   * POST /api/v1/auth/2fa/enable
   * Authenticated — Xác nhận mã OTP để bật 2FA
   */
  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kích hoạt 2FA' })
  async enable2Fa(
    @Req() req: { user: JwtPayload },
    @Body('code') code: string,
  ) {
    return this.authService.enable2Fa(req.user.sub, code);
  }

  /**
   * POST /api/v1/auth/2fa/disable
   * Authenticated — Tắt 2FA
   */
  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hủy kích hoạt 2FA' })
  async disable2Fa(
    @Req() req: { user: JwtPayload },
    @Body('code') code: string,
  ) {
    return this.authService.disable2Fa(req.user.sub, code);
  }
}

