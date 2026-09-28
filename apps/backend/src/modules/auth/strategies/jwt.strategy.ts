import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Payload interface — mapping chính xác các claim trong access token.
 * Giữ payload nhỏ gọn: chỉ chứa identity + roles + tenant.
 * KHÔNG lưu fullName hay email trong JWT để giảm kích thước token.
 */
export interface JwtPayload {
  /** User UUID */
  sub: string;
  /** Email đăng nhập */
  email: string;
  /** Tenant UUID (null cho superadmin) */
  tenantId: string | null;
  /** Mảng role codes: ['NUTRITIONIST', 'TEACHER'] */
  roles: string[];
  /** Token issued at (epoch seconds) — tự động bởi JWT */
  iat?: number;
  /** Token expiration (epoch seconds) — tự động bởi JWT */
  exp?: number;
}

/**
 * Passport JWT Strategy — Extract Bearer token từ Authorization header.
 *
 * Performance:
 * - Không query DB trên mỗi request (stateless verification).
 * - Chỉ verify signature + expiration rồi attach payload vào req.user.
 * - DB lookup chỉ xảy ra khi cần fresh data (GET /auth/me).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * Được gọi sau khi JWT signature hợp lệ.
   * Return value sẽ được gắn vào `req.user`.
   * Không cần query DB ở đây — giữ stateless cho performance tối đa.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload & { userId: string }> {
    return {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      roles: payload.roles,
    };
  }
}
