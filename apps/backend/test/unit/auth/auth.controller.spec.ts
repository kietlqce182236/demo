import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../../src/modules/auth/services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  const mockTenantId = 'a0000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    authService = {
      getActiveTenants: jest.fn().mockResolvedValue([
        { id: mockTenantId, code: 'MN_HOAMI', name: 'Trường Mầm Non Họa Mi', status: 'ACTIVE' },
      ]),
      login: jest.fn().mockResolvedValue({
        user: { id: 'u1', email: 'test@kidmeal.vn', fullName: 'Test User' },
        accessToken: 'access.jwt.token',
        refreshToken: 'refresh.jwt.token',
        expiresIn: 900,
      }),
      refreshToken: jest.fn().mockResolvedValue({
        accessToken: 'new.access.token',
        expiresIn: 900,
      }),
      quickLogin: jest.fn().mockResolvedValue({
        user: { id: 'u1', email: 'teacher@kidmeal.vn', roles: ['TEACHER'] },
        accessToken: 'teacher.jwt.token',
        refreshToken: 'teacher.refresh.token',
        expiresIn: 900,
      }),
      getMe: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'test@kidmeal.vn',
        fullName: 'Test User',
        roles: [{ code: 'NUTRITIONIST', name: 'Chuyên viên Dinh dưỡng' }],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTenants', () => {
    it('phải gọi authService.getActiveTenants() và trả về danh sách tenants', async () => {
      const result = await controller.getTenants();
      expect(authService.getActiveTenants).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('tenants');
      expect(result.tenants).toHaveLength(1);
      expect(result.tenants[0].code).toBe('MN_HOAMI');
    });
  });

  describe('login', () => {
    it('phải gọi authService.login() với đúng tham số', async () => {
      const loginDto = { email: 'test@kidmeal.vn', password: 'Password123@' };
      const result = await controller.login(loginDto, mockTenantId);

      expect(authService.login).toHaveBeenCalledWith(loginDto, mockTenantId);
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('refresh', () => {
    it('phải gọi authService.refreshToken() với token hợp lệ', async () => {
      const result = await controller.refresh('mock.refresh.token');

      expect(authService.refreshToken).toHaveBeenCalledWith('mock.refresh.token');
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('quickLogin', () => {
    it('phải gọi authService.quickLogin() với role và tenantId từ dto', async () => {
      const result = await controller.quickLogin({ roleCode: 'TEACHER', tenantId: mockTenantId });

      expect(authService.quickLogin).toHaveBeenCalledWith('TEACHER', mockTenantId);
      expect(result.user.roles).toContain('TEACHER');
    });
  });

  describe('getMe', () => {
    it('phải trả về hồ sơ người dùng đang đăng nhập', async () => {
      const mockReq = { user: { sub: 'u1', email: 'test@kidmeal.vn', tenantId: mockTenantId, roles: ['NUTRITIONIST'] } };
      const result = await controller.getMe(mockReq as any);

      expect(authService.getMe).toHaveBeenCalledWith('u1');
      expect(result.id).toBe('u1');
    });
  });
});
