import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User } from '../entities/user.entity';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyResetOtpDto } from '../dto/verify-reset-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

interface OtpRecord {
  otp: string;
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

interface ResetTokenRecord {
  userId: string;
  email: string;
  expiresAt: number;
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  // Bộ nhớ đệm lưu trữ OTP & ResetToken (TTL tự động dọn dẹp)
  private readonly otpStore = new Map<string, OtpRecord>();
  private readonly resetTokenStore = new Map<string, ResetTokenRecord>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Tạo Mail Transporter từ cấu hình SMTP thật
   */
  private getMailTransporter(): nodemailer.Transporter {
    const host = this.configService.get<string>('mail.host') || 'smtp.gmail.com';
    const port = Number(this.configService.get<number>('mail.port')) || 587;
    const secure = this.configService.get<boolean>('mail.secure') || false;
    const user = this.configService.get<string>('mail.user') || 'lamquockiet240321@gmail.com';
    const pass = this.configService.get<string>('mail.pass') || 'luvzjmhyvuohzjb';

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Bước 1: Tiếp nhận yêu cầu quên mật khẩu, sinh OTP 6 số và gửi Email thật
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    // 1. Tìm user theo email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Để tránh User Enumeration Attack, vẫn trả về thông báo chung
      this.logger.warn(`Yêu cầu quên mật khẩu cho email không tồn tại: ${email}`);
      return {
        message: 'Nếu email tồn tại trong hệ thống, mã xác thực OTP đã được gửi đến hộp thư của bạn.',
        email,
        expiresInSeconds: 300,
      };
    }

    if (user.status === 'BLOCKED') {
      throw new ForbiddenException('Tài khoản này đã bị khóa. Vui lòng liên hệ Ban Giám Hiệu.');
    }

    // 2. Sinh mã OTP 6 chữ số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const ttlMs = 5 * 60 * 1000; // 5 phút

    // 3. Lưu vào store
    this.otpStore.set(email, {
      otp,
      userId: user.id,
      email,
      createdAt: now,
      expiresAt: now + ttlMs,
      attempts: 0,
    });

    // 4. Gửi email OTP thật qua Gmail SMTP
    await this.sendOtpEmail(email, user.fullName, otp);

    return {
      message: `Mã xác thực OTP đã được gửi đến địa chỉ email ${email}. Mã có hiệu lực trong 5 phút.`,
      email,
      expiresInSeconds: 300,
    };
  }

  /**
   * Bước 2: Xác thực mã OTP người dùng nhập vào
   */
  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const record = this.otpStore.get(email);

    if (!record) {
      throw new BadRequestException('Mã xác thực OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.');
    }

    // Kiểm tra hết hạn
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(email);
      throw new BadRequestException('Mã xác thực OTP đã hết hạn (quá 5 phút). Vui lòng yêu cầu mã mới.');
    }

    // Kiểm tra số lần nhập sai
    if (record.attempts >= 3) {
      this.otpStore.delete(email);
      throw new BadRequestException('Bạn đã nhập sai mã OTP quá 3 lần. Vui lòng yêu cầu mã OTP mới.');
    }

    // So khớp mã OTP
    if (record.otp !== dto.otp.trim()) {
      record.attempts += 1;
      const remaining = 3 - record.attempts;
      throw new BadRequestException(
        remaining > 0
          ? `Mã xác thực OTP không chính xác. Bạn còn ${remaining} lần thử.`
          : 'Bạn đã nhập sai mã OTP quá 3 lần. Vui lòng yêu cầu mã mới.'
      );
    }

    // Mã đúng -> Xóa OTP, tạo Reset Token có hạn 15 phút
    this.otpStore.delete(email);
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetTokenStore.set(resetToken, {
      userId: record.userId,
      email,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 phút
    });

    this.logger.log(`Xác thực OTP thành công cho ${email}. Đã cấp resetToken.`);

    return {
      message: 'Xác thực mã OTP thành công! Vui lòng thiết lập mật khẩu mới.',
      email,
      resetToken,
      expiresInSeconds: 900,
    };
  }

  /**
   * Bước 3: Đặt lại mật khẩu mới
   */
  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu mới và mật khẩu xác nhận không trùng khớp.');
    }

    const tokenRecord = this.resetTokenStore.get(dto.resetToken);
    if (!tokenRecord) {
      throw new BadRequestException('Mã token đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.');
    }

    if (Date.now() > tokenRecord.expiresAt) {
      this.resetTokenStore.delete(dto.resetToken);
      throw new BadRequestException('Phiên đặt lại mật khẩu đã hết hạn (quá 15 phút). Vui lòng thực hiện lại.');
    }

    // Lấy user từ DB
    const user = await this.userRepository.findOne({
      where: { id: tokenRecord.userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    }

    // Hash mật khẩu mới bằng Bcrypt
    const saltRounds = 12;
    user.passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);
    await this.userRepository.save(user);

    // Hủy bỏ resetToken sau khi dùng xong (One-Time Token)
    this.resetTokenStore.delete(dto.resetToken);

    this.logger.log(`Người dùng ${user.email} đã đặt lại mật khẩu thành công.`);

    return {
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.',
      email: user.email,
    };
  }

  /**
   * Gửi Email thật chứa mã xác thực OTP qua giao thức SMTP (Gmail)
   */
  private async sendOtpEmail(toEmail: string, recipientName: string, otp: string): Promise<void> {
    const fromAddress =
      this.configService.get<string>('mail.from') ||
      '"KidMeal - Hệ thống Quản trị Bán trú Mầm non" <lamquockiet240321@gmail.com>';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mã OTP đặt lại mật khẩu KidMeal</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #10b981 0%, #0d9488 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 30px 28px; }
        .greeting { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 24px; }
        .otp-card { background: #f0fdf4; border: 2px dashed #86efac; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
        .otp-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 1px; margin-bottom: 8px; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #047857; margin: 0; font-family: 'Courier New', monospace; }
        .expiry { font-size: 12px; color: #15803d; margin-top: 8px; font-weight: 600; }
        .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; color: #92400e; line-height: 1.5; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏫 KidMeal</h1>
          <p>Hệ sinh thái Bán trú Dinh dưỡng Học đường Mầm non</p>
        </div>
        <div class="content">
          <div class="greeting">Kính gửi Quý Thầy/Cô / Phụ huynh <strong>${recipientName}</strong>,</div>
          <p class="desc">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${toEmail}</strong> trên Hệ thống Quản trị Bán trú KidMeal. 
            Dưới đây là mã xác thực OTP của bạn:
          </p>
          <div class="otp-card">
            <div class="otp-label">MÃ XÁC THỰC OTP (06 CHỮ SỐ)</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry">⏰ Có hiệu lực trong vòng 05 phút kể từ thời điểm gửi</div>
          </div>
          <div class="warning-box">
            <strong>⚠️ Cảnh báo an toàn:</strong> Tuyệt đối không cung cấp mã OTP này cho bất kỳ ai khác nhằm bảo vệ dữ liệu trường mầm non và thông tin học sinh. Nếu không phải bạn gửi yêu cầu, vui lòng đổi mật khẩu tài khoản hoặc liên hệ Ban Giám Hiệu.
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0 0 4px 0;">© 2024 - 2026 KidMeal (NutriBud). Bản quyền thuộc Hệ thống Mầm non Bán trú.</p>
          <p style="margin: 0;">Hotline hỗ trợ: 1900 6826 • Email: hotro@kidmeal.edu.vn</p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      const transporter = this.getMailTransporter();
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: '[KidMeal] Mã xác thực OTP đặt lại mật khẩu của bạn',
        text: `Kính gửi ${recipientName},\n\nMã xác thực OTP đặt lại mật khẩu KidMeal của bạn là: ${otp}.\nMã có hiệu lực trong 5 phút.\n\nTrân trọng,\nBan Quản trị Hệ thống KidMeal.`,
        html: htmlContent,
      });
      this.logger.log(`[SMTP Gmail] Đã gửi email OTP thành công tới ${toEmail}. MessageId: ${info.messageId}`);
    } catch (err: any) {
      this.logger.error(`[SMTP Gmail] Gửi email OTP tới ${toEmail} thất bại: ${err?.message || err}`);
    }
  }
}
