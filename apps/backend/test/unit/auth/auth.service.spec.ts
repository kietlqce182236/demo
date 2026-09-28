import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { TwoFactorService } from '../../../src/modules/auth/services/two-factor.service';
import { User } from '../../../src/modules/auth/entities/user.entity';
import { Tenant } from '../../../src/modules/auth/entities/tenant.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let tenantRepo: any;
  let jwtService: any;
  let configService: any;
  let twoFactorService: any;

  const mockTenantId = 'a0000000-0000-0000-0000-000000000001';
  const mockUserId = 'u0000000-0000-0000-0000-000000000001';

  const mockUser: Partial<User> = {
    id: mockUserId,
    email: 'nutritionist@kidmeal.edu.vn',
    passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdJf6.OEz4hQCHfm', // 'Password123@'
    fullName: 'Hoàng Thị Mai',
    phone: '0901234567',
    avatarUrl: 'https://avatar.iran.liara.run/public/65',
    status: 'ACTIVE',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    tenantId: mockTenantId,
    roles: [{ id: 'r1', code: 'NUTRITIONIST', name: 'Chuyên viên Dinh dưỡng' } as any],
  };

  const createMockQueryBuilder = (result: any = null) => {
    const qb: any = {
      addSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
      getOne: jest.fn().mockResolvedValue(result),
      getMany: jest.fn().mockResolvedValue(result || []),
    };
    qb.clone = jest.fn().mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    userRepo = {
      createQueryBuilder: jest.fn(),
    };

    tenantRepo = {
      createQueryBuilder: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      verify: jest.fn().mockReturnValue({
        sub: mockUserId,
        email: mockUser.email,
        tenantId: mockTenantId,
        roles: ['NUTRITIONIST'],
      }),
    };

    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          nodeEnv: 'development',
          'jwt.secret': 'test-jwt-secret',
          'jwt.expiresIn': '15m',
          'jwt.refreshSecret': 'test-refresh-secret',
          'jwt.refreshExpiresIn': '7d',
        };
        return config[key];
      }),
    };

    twoFactorService = {
      verifyCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Tenant), useValue: tenantRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: TwoFactorService, useValue: twoFactorService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('phải ném lỗi UnauthorizedException nếu không tìm thấy user theo email khi tenantId rỗng', async () => {
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(null));
      await expect(
        service.login({ email: 'test@kidmeal.vn', password: '123' }, ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('phải ném lỗi UnauthorizedException nếu user không tồn tại', async () => {
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(null));

      await expect(
        service.login({ email: 'unknown@kidmeal.vn', password: '123' }, mockTenantId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('phải ném lỗi ForbiddenException nếu tài khoản bị khóa (BLOCKED)', async () => {
      const blockedUser = { ...mockUser, status: 'BLOCKED' };
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(blockedUser));

      await expect(
        service.login({ email: blockedUser.email, password: 'Password123@' }, mockTenantId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('phải ném lỗi ForbiddenException nếu tài khoản chưa kích hoạt (INACTIVE)', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' };
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(inactiveUser));

      await expect(
        service.login({ email: inactiveUser.email, password: 'Password123@' }, mockTenantId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('phải ném lỗi UnauthorizedException nếu sai mật khẩu', async () => {
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(mockUser));
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false as never));

      await expect(
        service.login({ email: mockUser.email!, password: 'WrongPassword' }, mockTenantId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('phải yêu cầu mã 2FA nếu tài khoản đã bật 2FA mà chưa cung cấp mã', async () => {
      const user2Fa = { ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'SECRET123' };
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(user2Fa));
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));

      const result = await service.login(
        { email: user2Fa.email!, password: 'Password123@' },
        mockTenantId,
      );

      expect(result).toHaveProperty('require2Fa', true);
      expect(result).toHaveProperty('message');
    });

    it('phải ném lỗi UnauthorizedException nếu mã 2FA không chính xác', async () => {
      const user2Fa = { ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'SECRET123' };
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(user2Fa));
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));
      twoFactorService.verifyCode.mockReturnValue(false);

      await expect(
        service.login(
          { email: user2Fa.email!, password: 'Password123@', twoFactorCode: '000000' },
          mockTenantId,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('đăng nhập thành công: trả về accessToken, refreshToken và thông tin user', async () => {
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(mockUser));
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));

      const result = await service.login(
        { email: mockUser.email!, password: 'Password123@' },
        mockTenantId,
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn', 900);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        phone: mockUser.phone,
        avatarUrl: mockUser.avatarUrl,
        roles: ['NUTRITIONIST'],
        tenantId: mockTenantId,
      });
    });
  });

  describe('refreshToken', () => {
    it('phải ném lỗi UnauthorizedException nếu refresh token không hợp lệ', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('phải cấp lại accessToken mới khi refresh token hợp lệ', async () => {
      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result).toHaveProperty('expiresIn', 900);
    });
  });

  describe('getActiveTenants', () => {
    it('phải lấy danh sách các trường mầm non ACTIVE', async () => {
      const tenantsList = [
        { id: mockTenantId, code: 'MN_HOAMI', name: 'Trường Mầm Non Họa Mi', status: 'ACTIVE' },
      ];
      tenantRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(tenantsList));

      const result = await service.getActiveTenants();
      expect(result).toEqual(tenantsList);
    });
  });

  describe('quickLogin', () => {
    it('phải ném lỗi ForbiddenException nếu gọi ở môi trường production', async () => {
      configService.get.mockReturnValue('production');

      await expect(service.quickLogin('TEACHER', mockTenantId)).rejects.toThrow(ForbiddenException);
    });

    it('phải ném lỗi UnauthorizedException nếu role không có user nào trong tenant', async () => {
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(null));

      await expect(service.quickLogin('UNKNOWN_ROLE', mockTenantId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('đăng nhập nhanh thành công ở môi trường development', async () => {
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(mockUser));

      const result = await service.quickLogin('NUTRITIONIST', mockTenantId);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.roles).toContain('NUTRITIONIST');
    });
  });

  describe('getMe', () => {
    it('phải ném lỗi UnauthorizedException nếu không tìm thấy user', async () => {
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(null));

      await expect(service.getMe('non-existent-id')).rejects.toThrow(UnauthorizedException);
    });

    it('phải trả về thông tin user hồ sơ hiện tại', async () => {
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder(mockUser));

      const result = await service.getMe(mockUserId);
      expect(result.id).toBe(mockUserId);
      expect(result.email).toBe(mockUser.email);
      expect(result.roles).toEqual([{ code: 'NUTRITIONIST', name: 'Chuyên viên Dinh dưỡng' }]);
    });
  });
});
