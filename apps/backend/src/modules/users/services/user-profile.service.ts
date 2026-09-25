import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../../auth/entities/user.entity';
import { Tenant } from '../../auth/entities/tenant.entity';
import { TwoFactorService } from '../../auth/services/two-factor.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * Xem hồ sơ cá nhân của người dùng hiện tại (Dành cho TẤT CẢ các role)
   */
  async getProfile(userId: string) {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .where('u.id = :userId', { userId })
      .andWhere('u.deletedAt IS NULL')
      .getOne();

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    let tenantInfo = null;
    if (user.tenantId) {
      const tenant = await this.tenantRepository.findOne({
        where: { id: user.tenantId },
        select: ['id', 'code', 'name', 'phone', 'address', 'contactEmail'],
      });
      if (tenant) {
        tenantInfo = tenant;
      }
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      roles: (user.roles || []).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
      })),
      tenantId: user.tenantId,
      tenant: tenantInfo,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  /**
   * Cập nhật thông tin cá nhân (Họ tên, Số điện thoại, Avatar)
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim();
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    await this.userRepository.save(user);

    this.logger.log(`Người dùng ${user.email} (ID: ${userId}) đã cập nhật hồ sơ cá nhân`);
    return this.getProfile(userId);
  }

  /**
   * Đổi mật khẩu tài khoản
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu mới và mật khẩu xác nhận không trùng khớp');
    }

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    const user = await this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :userId', { userId })
      .andWhere('u.deletedAt IS NULL')
      .getOne();

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác');
    }

    const saltRounds = 12;
    user.passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);
    await this.userRepository.save(user);

    this.logger.log(`Người dùng ${user.email} đã đổi mật khẩu thành công`);

    return {
      message: 'Đổi mật khẩu thành công. Vui lòng ghi nhớ mật khẩu mới của bạn.',
    };
  }

  /**
   * Bước 1: Khởi tạo cấu hình 2FA — Tạo secret và mã QR
   */
  async setup2FA(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const secret = this.twoFactorService.generateSecret();
    const otpAuthUrl = this.twoFactorService.generateOtpAuthUrl(user.email, secret);
    const qrCodeDataUrl = await this.twoFactorService.generateQrCodeDataUrl(otpAuthUrl);

    // Tạm thời lưu secret để bước sau người dùng xác thực mã
    user.twoFactorSecret = secret;
    await this.userRepository.save(user);

    return {
      secret,
      otpAuthUrl,
      qrCodeDataUrl,
      message: 'Quét mã QR bằng ứng dụng Google Authenticator hoặc Authy, sau đó nhập mã OTP 6 số để kích hoạt.',
    };
  }

  /**
   * Bước 2: Kích hoạt 2FA sau khi nhập mã OTP xác nhận
   */
  async enable2FA(userId: string, code: string) {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.twoFactorSecret')
      .where('u.id = :userId', { userId })
      .getOne();

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Vui lòng khởi tạo cấu hình 2FA trước khi kích hoạt');
    }

    const isValid = this.twoFactorService.verifyCode(code, user.twoFactorSecret);
    if (!isValid) {
      throw new BadRequestException('Mã xác thực OTP không chính xác hoặc đã hết hạn');
    }

    // Sinh 8 mã phục hồi ngẫu nhiên (Recovery Codes)
    const recoveryCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      recoveryCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    user.twoFactorEnabled = true;
    user.twoFactorRecoveryCodes = recoveryCodes;
    await this.userRepository.save(user);

    this.logger.log(`Người dùng ${user.email} đã kích hoạt bảo mật 2 lớp 2FA`);

    return {
      message: 'Kích hoạt xác thực 2 bước (2FA) thành công!',
      twoFactorEnabled: true,
      recoveryCodes,
    };
  }

  /**
   * Hủy kích hoạt bảo mật 2FA
   */
  async disable2FA(userId: string, code: string) {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.twoFactorSecret')
      .where('u.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Tài khoản chưa bật xác thực 2 bước');
    }

    const isValid = this.twoFactorService.verifyCode(code, user.twoFactorSecret || '');
    if (!isValid) {
      throw new BadRequestException('Mã xác thực OTP không chính xác để hủy 2FA');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorRecoveryCodes = null;
    await this.userRepository.save(user);

    this.logger.log(`Người dùng ${user.email} đã tắt bảo mật 2 lớp 2FA`);

    return {
      message: 'Đã tắt bảo mật xác thực 2 bước thành công',
      twoFactorEnabled: false,
    };
  }
}
