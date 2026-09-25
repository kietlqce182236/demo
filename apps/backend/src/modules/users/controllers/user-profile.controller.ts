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
import { UserProfileService } from '../services/user-profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { Verify2faDto } from '../dto/verify-2fa.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  /**
   * Xem hồ sơ cá nhân của chính mình (Tất cả các role)
   */
  @Get('profile')
  async getMyProfile(@CurrentUser('userId') userId: string) {
    return this.userProfileService.getProfile(userId);
  }

  /**
   * Cập nhật thông tin cá nhân: Họ tên, số điện thoại, avatar (Tất cả các role)
   */
  @Patch('profile')
  async updateMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userProfileService.updateProfile(userId, dto);
  }

  /**
   * Đổi mật khẩu tài khoản (Tất cả các role)
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userProfileService.changePassword(userId, dto);
  }

  /**
   * Khởi tạo thiết lập bảo mật 2 lớp (2FA QR Code)
   */
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  async setup2FA(@CurrentUser('userId') userId: string) {
    return this.userProfileService.setup2FA(userId);
  }

  /**
   * Kích hoạt xác thực 2 lớp (2FA) bằng mã OTP 6 số
   */
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enable2FA(
    @CurrentUser('userId') userId: string,
    @Body() dto: Verify2faDto,
  ) {
    return this.userProfileService.enable2FA(userId, dto.code);
  }

  /**
   * Hủy kích hoạt xác thực 2 lớp (2FA)
   */
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disable2FA(
    @CurrentUser('userId') userId: string,
    @Body() dto: Verify2faDto,
  ) {
    return this.userProfileService.disable2FA(userId, dto.code);
  }
}
