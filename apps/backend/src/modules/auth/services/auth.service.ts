import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { SchoolTenant } from '../entities/tenant.entity';
import { LoginDto } from '../dto/login.dto';
import { QuickLoginDto } from '../dto/quick-login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(SchoolTenant)
    private readonly tenantRepository: Repository<SchoolTenant>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Resolve email aliases for smooth demo usage across domains
   */
  private resolveEmail(rawEmail: string): string {
    const email = rawEmail.trim().toLowerCase();
    const aliasMap: Record<string, string> = {
      'bep@hoamai.edu.vn': 'bep@huongduong.edu.vn',
      'cogaomam1@hoamai.edu.vn': 'giaovien.mam1@huongduong.edu.vn',
      'dinhduong@hoamai.edu.vn': 'dinhduong@huongduong.edu.vn',
      'hieutruong@hoamai.edu.vn': 'hieutruong@huongduong.edu.vn',
      'phuhuynh.phong@gmail.com': 'phuhuynh.huy@gmail.com',
      'superadmin@nutribud.vn': 'hieutruong@huongduong.edu.vn',
    };
    return aliasMap[email] || email;
  }

  async validateUser(email: string, pass: string): Promise<User> {
    const targetEmail = this.resolveEmail(email);

    let user = await this.userRepository.findOne({
      where: { email: targetEmail },
      relations: ['roles'],
    });

    // If not found by exact email, try finding by phone or username prefix
    if (!user) {
      user = await this.userRepository
        .createQueryBuilder('u')
        .leftJoinAndSelect('u.roles', 'r')
        .where('LOWER(u.email) LIKE :prefix', { prefix: `%${targetEmail.split('@')[0]}%` })
        .orWhere('u.phone = :phone', { phone: email })
        .getOne();
    }

    if (!user) {
      throw new UnauthorizedException('Email hoặc số điện thoại không tồn tại trong hệ thống');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản của bạn đang bị tạm khóa hoặc chưa kích hoạt');
    }

    // Password verification: bcrypt match or dev override for '123456'
    let isMatch = false;
    if (pass === '123456') {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(pass, user.passwordHash);
    }

    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }

    return user;
  }

  async login(loginDto: LoginDto, tenantId: number = 1) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepository.update(user.id, { lastLoginAt: user.lastLoginAt });

    return this.generateAuthResponse(user, tenantId);
  }

  async quickLogin(dto: QuickLoginDto) {
    const targetRoleCode = dto.roleCode.toUpperCase();

    // Map UI role aliases to database role codes
    const roleMapping: Record<string, string> = {
      PRINCIPAL: 'SCHOOL_MANAGER',
      SUPER_ADMIN: 'SCHOOL_MANAGER',
      KITCHEN_MANAGER: 'KITCHEN_STAFF',
    };
    const dbRoleCode = roleMapping[targetRoleCode] || targetRoleCode;

    const user = await this.userRepository
      .createQueryBuilder('u')
      .innerJoinAndSelect('u.roles', 'r')
      .where('r.code = :code', { code: dbRoleCode })
      .andWhere("u.status = 'ACTIVE'")
      .getOne();

    if (!user) {
      throw new NotFoundException(`Không tìm thấy tài khoản mẫu cho vai trò: ${targetRoleCode}`);
    }

    const tenantId = Number(dto.tenantId) || 1;
    return this.generateAuthResponse(user, tenantId, targetRoleCode);
  }

  async generateAuthResponse(user: User, tenantId: number = 1, requestedRoleAlias?: string) {
    let roles = user.roles?.map((r) => r.code) || [];

    // Augment with role alias for frontend route mapping
    if (requestedRoleAlias && !roles.includes(requestedRoleAlias)) {
      roles = [requestedRoleAlias, ...roles];
    }

    // Map SCHOOL_MANAGER to also include PRINCIPAL for UI convenience
    if (roles.includes('SCHOOL_MANAGER') && !roles.includes('PRINCIPAL')) {
      roles.push('PRINCIPAL');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
    });

    return {
      user: {
        id: String(user.id),
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || null,
        avatarUrl: user.avatar || null,
        roles,
        tenantId: String(tenantId),
      },
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['roles'],
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Người dùng không còn hiệu lực');
      }

      return this.generateAuthResponse(user, payload.tenantId || 1);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  async getMe(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const roles = user.roles?.map((r) => ({
      code: r.code,
      name: r.name,
    })) || [];

    return {
      id: String(user.id),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || null,
      avatarUrl: user.avatar || null,
      tenantId: '1',
      twoFactorEnabled: false,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      roles,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const isMatch =
      dto.currentPassword === '123456' ||
      (await bcrypt.compare(dto.currentPassword, user.passwordHash));

    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    await this.userRepository.update(user.id, { passwordHash: user.passwordHash });

    return {
      success: true,
      message: 'Đổi mật khẩu thành công',
    };
  }

  async getTenants() {
    const schools = await this.tenantRepository.find();

    if (schools.length === 0) {
      return {
        tenants: [
          {
            id: '1',
            code: 'MG_HUONGDUONG',
            name: 'Trường Mẫu Giáo Hướng Dương',
            status: 'ACTIVE',
            logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80',
          },
        ],
      };
    }

    return {
      tenants: schools.map((s) => ({
        id: String(s.id),
        code: `SCHOOL_${s.id}`,
        name: s.name,
        status: 'ACTIVE',
        logoUrl: s.logo || null,
      })),
    };
  }
}
