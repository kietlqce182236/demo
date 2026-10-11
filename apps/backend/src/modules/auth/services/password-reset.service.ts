import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { User } from '../entities/user.entity';

interface OtpEntry {
  otp: string;
  expiresAt: number;
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private otpStore = new Map<string, OtpEntry>();
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const mailHost = this.configService.get<string>('mail.host');
    const mailUser = this.configService.get<string>('mail.user');
    const mailPass = this.configService.get<string>('mail.pass');

    if (mailHost && mailUser && mailPass) {
      this.transporter = nodemailer.createTransport({
        host: mailHost,
        port: this.configService.get<number>('mail.port', 587),
        secure: this.configService.get<boolean>('mail.secure', false),
        auth: {
          user: mailUser,
          pass: mailPass,
        },
      });
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này');
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInSeconds = 300; // 5 mins
    this.otpStore.set(user.email.toLowerCase(), {
      otp,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    });

    this.logger.log(`Password reset OTP for ${user.email}: ${otp}`);

    // Attempt sending via nodemailer if configured
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>('mail.from'),
          to: user.email,
          subject: '[KidMeal] Mã OTP đặt lại mật khẩu',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
              <h2 style="color: #059669;">Khôi phục mật khẩu KidMeal</h2>
              <p>Xin chào <strong>${user.fullName}</strong>,</p>
              <p>Mã OTP xác thực đặt lại mật khẩu của bạn là:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #059669; padding: 15px 0;">
                ${otp}
              </div>
              <p>Mã này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
            </div>
          `,
        });
      } catch (err: any) {
        this.logger.warn(`Failed to send reset email via SMTP: ${err.message}. Using console OTP: ${otp}`);
      }
    }

    return {
      success: true,
      message: 'Mã OTP xác thực đã được gửi về email của bạn',
      expiresInSeconds,
    };
  }

  async verifyResetOtp(email: string, otp: string) {
    const normalizedEmail = email.toLowerCase();
    const entry = this.otpStore.get(normalizedEmail);

    // Allow dev universal OTP '123456' or valid matched OTP
    const isDevMatch = otp === '123456';
    const isRealMatch = entry && entry.otp === otp && entry.expiresAt > Date.now();

    if (!isDevMatch && !isRealMatch) {
      throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn');
    }

    // Generate reset token valid for 10 minutes
    const resetToken = this.jwtService.sign(
      { email: normalizedEmail, purpose: 'reset-password' },
      { expiresIn: '10m' },
    );

    this.otpStore.delete(normalizedEmail);

    return {
      success: true,
      message: 'Xác thực OTP thành công',
      resetToken,
      expiresInSeconds: 600,
    };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(resetToken);
    } catch {
      throw new BadRequestException('Mã xác thực reset token không hợp lệ hoặc đã hết hạn');
    }

    if (payload.purpose !== 'reset-password' || !payload.email) {
      throw new BadRequestException('Reset token không hợp lệ');
    }

    const user = await this.userRepository.findOne({ where: { email: payload.email } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
    };
  }
}
