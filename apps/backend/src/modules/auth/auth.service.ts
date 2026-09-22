import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { TwoFactorService } from './two-factor.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async login(loginDto: LoginDto, tenantId: string) {
    // 1. Mock/DB User check (In production, inject UserRepository)
    const mockUser = {
      id: 'u0000000-0000-0000-0000-000000000001',
      tenantId: tenantId || 'a0000000-0000-0000-0000-000000000001',
      email: loginDto.email,
      fullName: 'Nguyễn Thị Dinh Dưỡng',
      roles: ['NUTRITIONIST', 'TEACHER'],
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    };

    // 2. Kiểm tra 2FA nếu được kích hoạt
    if (mockUser.isTwoFactorEnabled) {
      if (!loginDto.twoFactorCode) {
        return {
          require2Fa: true,
          message: 'Vui lòng nhập mã xác thực 2FA',
        };
      }

      const isValid2Fa = this.twoFactorService.verifyCode(
        loginDto.twoFactorCode,
        mockUser.twoFactorSecret,
      );

      if (!isValid2Fa) {
        throw new UnauthorizedException('Mã xác thực 2FA không chính xác');
      }
    }

    // 3. Tạo cặp Access Token và Refresh Token
    const payload = {
      sub: mockUser.id,
      email: mockUser.email,
      tenantId: mockUser.tenantId,
      roles: mockUser.roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return {
      user: {
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        roles: mockUser.roles,
        tenantId: mockUser.tenantId,
      },
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const newAccessToken = this.jwtService.sign(
        {
          sub: payload.sub,
          email: payload.email,
          tenantId: payload.tenantId,
          roles: payload.roles,
        },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: this.configService.get<string>('jwt.expiresIn'),
        },
      );

      return { accessToken: newAccessToken };
    } catch (err) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }
}
