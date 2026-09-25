import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { TwoFactorService } from './two-factor.service';
import { LoginDto } from '../dto/login.dto';
import { User } from '../entities/user.entity';
import { Tenant } from '../entities/tenant.entity';
import { JwtPayload } from '../strategies/jwt.strategy';

/**
 * AuthService — Xử lý toàn bộ logic xác thực.
 *
 * Tối ưu Performance:
 * 1. Login query: 1 câu SELECT duy nhất JOIN user_roles + roles (tránh N+1).
 * 2. password_hash chỉ load khi cần (addSelect) nhờ select:false trên entity.
 * 3. Không load description/settings/address không cần thiết.
 * 4. Update last_login_at chạy async fire-and-forget (không block response).
 * 5. Tenant list: SELECT chỉ 4 cột (id, code, name, status), cache-friendly.
 * 6. Quick login: query bằng index (tenant_id, role_code).
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * Đăng nhập bằng email + password.
   *
   * Flow:
   * 1. Query user + roles trong 1 câu SQL duy nhất (JOIN user_roles → roles).
   * 2. addSelect('password_hash') và 'two_factor_secret' chỉ khi cần.
   * 3. bcrypt.compare() kiểm tra mật khẩu.
   * 4. Nếu 2FA bật → yêu cầu twoFactorCode.
   * 5. Sinh JWT access + refresh token.
   * 6. Cập nhật last_login_at async (fire-and-forget).
   */
  async login(loginDto: LoginDto, tenantId?: string) {
    // 1 câu SQL duy nhất: user + roles + password_hash + 2fa_secret
    let userQuery = this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')       // select:false → chỉ load khi cần
      .addSelect('u.twoFactorSecret')    // select:false → chỉ load khi cần
      .leftJoinAndSelect('u.roles', 'r') // JOIN user_roles → roles
      .where('u.email = :email', { email: loginDto.email })
      .andWhere('u.deletedAt IS NULL');

    let user: User | null = null;
    if (tenantId) {
      user = await userQuery.clone().andWhere('u.tenantId = :tenantId', { tenantId }).getOne();
    }

    // Nếu không tìm thấy trong tenant chỉ định hoặc không truyền tenantId, tìm trực tiếp theo email
    if (!user) {
      user = await userQuery.getOne();
    }

    if (!user) {
      // Thông báo chung — không tiết lộ email có tồn tại hay không (bảo mật)
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Kiểm tra tài khoản bị khóa
    if (user.status === 'BLOCKED') {
      throw new ForbiddenException('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }

    if (user.status === 'INACTIVE') {
      throw new ForbiddenException('Tài khoản chưa được kích hoạt.');
    }

    // 2. So sánh password bằng bcrypt
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 3. Kiểm tra 2FA nếu đã bật
    if (user.twoFactorEnabled) {
      if (!loginDto.twoFactorCode) {
        return {
          require2Fa: true,
          message: 'Vui lòng nhập mã xác thực 2FA',
        };
      }

      const isValid2Fa = this.twoFactorService.verifyCode(
        loginDto.twoFactorCode,
        user.twoFactorSecret,
      );

      if (!isValid2Fa) {
        throw new UnauthorizedException('Mã xác thực 2FA không chính xác');
      }
    }

    // 4. Tạo JWT tokens
    const roleCodes = user.roles.map((r) => r.code);
    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: roleCodes,
    });

    // 5. Cập nhật last_login_at — fire-and-forget (không await, không block response)
    this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ lastLoginAt: () => 'CURRENT_TIMESTAMP' })
      .where('id = :id', { id: user.id })
      .execute()
      .catch(() => {
        /* silent: logging lỗi update last_login không nên block login */
      });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        roles: roleCodes,
        tenantId: user.tenantId,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900, // 15 phút
    };
  }

  /**
   * Làm mới access token bằng refresh token.
   *
   * Performance: Không query DB — chỉ verify + re-sign JWT (stateless).
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
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

      return { accessToken: newAccessToken, expiresIn: 900 };
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  /**
   * Lấy danh sách tenant (trường mầm non) cho dropdown login.
   *
   * Performance:
   * - SELECT chỉ 4 cột cần thiết (id, code, name, status).
   * - WHERE status = 'ACTIVE' AND deleted_at IS NULL sử dụng partial index.
   * - Kết quả ít thay đổi → frontend nên cache.
   */
  async getActiveTenants() {
    return this.tenantRepo
      .createQueryBuilder('t')
      .select(['t.id', 't.code', 't.name', 't.status'])
      .where('t.status = :status', { status: 'ACTIVE' })
      .andWhere('t.deletedAt IS NULL')
      .orderBy('t.name', 'ASC')
      .getMany();
  }

  /**
   * Đăng nhập nhanh theo role (môi trường development/testing).
   *
   * Performance: Query bằng index (tenant_id) + JOIN role code filter.
   * Chỉ lấy user đầu tiên phù hợp, không scan toàn bảng.
   */
  async quickLogin(roleCode: string, tenantId: string) {
    if (this.configService.get<string>('nodeEnv') === 'production') {
      throw new ForbiddenException('Quick login chỉ khả dụng trong môi trường development');
    }

    const user = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('r.code = :roleCode', { roleCode })
      .andWhere('u.status = :status', { status: 'ACTIVE' })
      .andWhere('u.deletedAt IS NULL')
      .getOne();

    if (!user) {
      throw new UnauthorizedException(`Không tìm thấy user với role ${roleCode} tại trường này`);
    }

    const roleCodes = user.roles.map((r) => r.code);
    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: roleCodes,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        roles: roleCodes,
        tenantId: user.tenantId,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
    };
  }

  /**
   * Lấy thông tin user hiện tại từ JWT payload.
   */
  async getMe(userId: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .select(['u.id', 'u.email', 'u.fullName', 'u.phone', 'u.avatarUrl', 'u.tenantId', 'u.twoFactorEnabled', 'u.lastLoginAt'])
      .addSelect(['r.id', 'r.code', 'r.name'])
      .where('u.id = :userId', { userId })
      .andWhere('u.deletedAt IS NULL')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      tenantId: user.tenantId,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
      roles: user.roles.map((r) => ({
        code: r.code,
        name: r.name,
      })),
    };
  }

  /**
   * Helper: Sinh cặp access + refresh token.
   */
  private generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }
}
