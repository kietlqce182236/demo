import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';

import { AuthController } from '../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../src/modules/auth/services/auth.service';
import { TwoFactorService } from '../src/modules/auth/services/two-factor.service';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { User } from '../src/modules/auth/entities/user.entity';
import { Tenant } from '../src/modules/auth/entities/tenant.entity';
import { Role } from '../src/modules/auth/entities/role.entity';

describe('Auth API (E2E / Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepo: any;
  let tenantRepo: any;
  let configService: any;

  const mockTenantId = 'a0000000-0000-4000-8000-000000000001';
  const mockUserId = 'u0000000-0000-0000-0000-000000000001';
  const rawPassword = 'Password123@';
  const hashedPassword = bcrypt.hashSync(rawPassword, 10);
  const twoFaSecret = 'JBSWY3DPEHPK3PXP';

  const mockUserNormal: Partial<User> = {
    id: mockUserId,
    email: 'nutritionist@kidmeal.edu.vn',
    passwordHash: hashedPassword,
    fullName: 'Hoàng Thị Mai',
    phone: '0901234567',
    avatarUrl: 'https://avatar.iran.liara.run/public/65',
    status: 'ACTIVE',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    tenantId: mockTenantId,
    roles: [{ id: 'r1', code: 'NUTRITIONIST', name: 'Chuyên viên Dinh dưỡng' } as Role],
  };

  const mockUser2Fa: Partial<User> = {
    ...mockUserNormal,
    id: 'u0000000-0000-0000-0000-000000000002',
    email: 'principal@kidmeal.edu.vn',
    twoFactorEnabled: true,
    twoFactorSecret: twoFaSecret,
    roles: [{ id: 'r2', code: 'PRINCIPAL', name: 'Hiệu trưởng' } as Role],
  };

  const mockUserBlocked: Partial<User> = {
    ...mockUserNormal,
    id: 'u0000000-0000-0000-0000-000000000003',
    email: 'blocked@kidmeal.edu.vn',
    status: 'BLOCKED',
  };

  const mockTenantsList = [
    { id: mockTenantId, code: 'MN_HOAMI', name: 'Trường Mầm Non Họa Mi', status: 'ACTIVE' },
    { id: 'a0000000-0000-0000-0000-000000000002', code: 'MN_SAOMAI', name: 'Trường Mầm Non Sao Mai', status: 'ACTIVE' },
  ];

  const createMockQueryBuilder = (singleResult: any = null, manyResult: any = []) => {
    return {
      addSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
      getOne: jest.fn().mockResolvedValue(singleResult),
      getMany: jest.fn().mockResolvedValue(manyResult),
    };
  };

  beforeAll(async () => {
    userRepo = {
      createQueryBuilder: jest.fn().mockImplementation(() => createMockQueryBuilder(mockUserNormal)),
    };

    tenantRepo = {
      createQueryBuilder: jest.fn().mockImplementation(() => createMockQueryBuilder(null, mockTenantsList)),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              nodeEnv: 'development',
              jwt: {
                secret: 'test-super-secret-jwt-key-minimum-32-chars-2026',
                expiresIn: '15m',
                refreshSecret: 'test-super-secret-refresh-key-minimum-32-chars-2026',
                refreshExpiresIn: '7d',
              },
            }),
          ],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-super-secret-jwt-key-minimum-32-chars-2026',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        TwoFactorService,
        JwtStrategy,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Tenant), useValue: tenantRepo },
        { provide: getRepositoryToken(Role), useValue: {} },
      ],
    }).compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GET /api/v1/auth/tenants
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/auth/tenants', () => {
    it('200 OK — Lấy danh sách các trường mầm non công khai', async () => {
      tenantRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(null, mockTenantsList),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/tenants')
        .expect(200);

      expect(res.body).toHaveProperty('tenants');
      expect(Array.isArray(res.body.tenants)).toBe(true);
      expect(res.body.tenants).toHaveLength(2);
      expect(res.body.tenants[0].code).toBe('MN_HOAMI');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. POST /api/v1/auth/login
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    it('200 OK — Đăng nhập thành công với tài khoản thường (không bật 2FA)', async () => {
      userRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(mockUserNormal),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-tenant-id', mockTenantId)
        .send({
          email: 'nutritionist@kidmeal.edu.vn',
          password: rawPassword,
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('expiresIn', 900);
      expect(res.body.user).toMatchObject({
        email: 'nutritionist@kidmeal.edu.vn',
        fullName: 'Hoàng Thị Mai',
        tenantId: mockTenantId,
      });
      expect(res.body.user.roles).toContain('NUTRITIONIST');
    });

    it('400 Bad Request — Thiếu email hoặc sai định dạng email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-tenant-id', mockTenantId)
        .send({
          email: 'not-an-email',
          password: rawPassword,
        })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('400 Bad Request — Thiếu password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-tenant-id', mockTenantId)
        .send({
          email: 'nutritionist@kidmeal.edu.vn',
        })
        .expect(400);
    });

    it('401 Unauthorized — Thiếu header x-tenant-id', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nutritionist@kidmeal.edu.vn',
          password: rawPassword,
        })
        .expect(401);

      expect(res.body.message).toContain('Vui lòng chọn cơ sở trường mầm non');
    });

    it('401 Unauthorized — Email không tồn tại trong hệ thống', async () => {
      userRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(null),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-tenant-id', mockTenantId)
        .send({
          email: 'unknown@kidmeal.edu.vn',
          password: rawPassword,
        })
        .expect(401);

      expect(res.body.message).toBe('Email hoặc mật khẩu không chính xác');
    });

    it('401 Unauthorized — Sai mật khẩu', async () => {
      userRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(mockUserNormal),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-tenant-id', mockTenantId)
        .send({
          email: 'nutritionist@kidmeal.edu.vn',
          password: 'WrongPassword999!',
        })
        .expect(401);

      expect(res.body.message).toBe('Email hoặc mật khẩu không chính xác');
    });

    it('403 Forbidden — Tài khoản bị khóa (BLOCKED)', async () => {
      userRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(mockUserBlocked),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-tenant-id', mockTenantId)
        .send({
          email: 'blocked@kidmeal.edu.vn',
          password: rawPassword,
        })
        .expect(403);

      expect(res.body.message).toContain('đã bị khóa');
    });

    it('200 OK — Tài khoản bật 2FA: Trả về require2Fa khi chưa gửi OTP code', async () => {
      userRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(mockUser2Fa),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-tenant-id', mockTenantId)
        .send({
          email: 'principal@kidmeal.edu.vn',
          password: rawPassword,
        })
        .expect(200);

      expect(res.body).toHaveProperty('require2Fa', true);
      expect(res.body.message).toContain('mã xác thực 2FA');
    });

    it('401 Unauthorized — Tài khoản bật 2FA: Nhập mã OTP không chính xác', async () => {
      userRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(mockUser2Fa),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-tenant-id', mockTenantId)
        .send({
          email: 'principal@kidmeal.edu.vn',
          password: rawPassword,
          twoFactorCode: '000000',
        })
        .expect(401);

      expect(res.body.message).toContain('Mã xác thực 2FA không chính xác');
    });

    it('200 OK — Tài khoản bật 2FA: Nhập mã OTP chính xác -> Cấp token thành công', async () => {
      userRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(mockUser2Fa),
      );

      const validTotp = authenticator.generate(twoFaSecret);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('x-tenant-id', mockTenantId)
        .send({
          email: 'principal@kidmeal.edu.vn',
          password: rawPassword,
          twoFactorCode: validTotp,
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('principal@kidmeal.edu.vn');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. POST /api/v1/auth/refresh
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/refresh', () => {
    it('200 OK — Cấp access token mới khi refresh token hợp lệ', async () => {
      const validRefreshToken = jwtService.sign(
        {
          sub: mockUserId,
          email: mockUserNormal.email,
          tenantId: mockTenantId,
          roles: ['NUTRITIONIST'],
        },
        {
          secret: 'test-super-secret-refresh-key-minimum-32-chars-2026',
          expiresIn: '7d',
        },
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('expiresIn', 900);
    });

    it('401 Unauthorized — Bị từ chối khi refresh token giả mạo hoặc hết hạn', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.fake.jwt.token' })
        .expect(401);

      expect(res.body.message).toContain('Refresh token không hợp lệ hoặc đã hết hạn');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. POST /api/v1/auth/quick-login
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/quick-login', () => {
    it('200 OK — Đăng nhập nhanh theo role trong môi trường development', async () => {
      userRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(mockUserNormal),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/quick-login')
        .send({
          roleCode: 'NUTRITIONIST',
          tenantId: mockTenantId,
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.roles).toContain('NUTRITIONIST');
    });

    it('400 Bad Request — Thiếu tenantId hoặc roleCode', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/quick-login')
        .send({
          roleCode: 'TEACHER',
        })
        .expect(400);
    });

    it('401 Unauthorized — Không tìm thấy người dùng với role được yêu cầu', async () => {
      userRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(null),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/quick-login')
        .send({
          roleCode: 'NON_EXISTENT_ROLE',
          tenantId: mockTenantId,
        })
        .expect(401);

      expect(res.body.message).toContain('Không tìm thấy user với role NON_EXISTENT_ROLE');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. GET /api/v1/auth/me
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/auth/me', () => {
    it('200 OK — Lấy hồ sơ user hiện tại khi có Bearer Token hợp lệ', async () => {
      const accessToken = jwtService.sign({
        sub: mockUserId,
        email: mockUserNormal.email,
        tenantId: mockTenantId,
        roles: ['NUTRITIONIST'],
      });

      userRepo.createQueryBuilder.mockReturnValueOnce(
        createMockQueryBuilder(mockUserNormal),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', mockUserId);
      expect(res.body).toHaveProperty('email', mockUserNormal.email);
      expect(res.body).toHaveProperty('fullName', mockUserNormal.fullName);
      expect(res.body).toHaveProperty('roles');
      expect(res.body.roles[0].code).toBe('NUTRITIONIST');
    });

    it('401 Unauthorized — Bị từ chối khi không truyền Bearer Token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('401 Unauthorized — Bị từ chối khi Bearer Token sai chữ ký', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-signature')
        .expect(401);
    });
  });
});
