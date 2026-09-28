import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserProfileService } from '../../../src/modules/users/services/user-profile.service';
import { User } from '../../../src/modules/auth/entities/user.entity';
import { Tenant } from '../../../src/modules/auth/entities/tenant.entity';
import { TwoFactorService } from '../../../src/modules/auth/services/two-factor.service';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let userRepo: any;
  let tenantRepo: any;
  let twoFactorService: any;

  const mockUser: Partial<User> = {
    id: 'u2000000-0000-0000-0000-000000000001',
    email: 'hieutruong@saomai.edu.vn',
    fullName: 'Hoàng Thu Trang',
    phone: '0913999888',
    avatarUrl: null,
    status: 'ACTIVE',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    passwordHash: '$2a$12$e8x/K9v9Jq2Wf4Qf6x/Ke.O9Yk9Zz1X1K3C/o0Cg0m7D5n0H6qf6e',
    tenantId: 'a0000000-0000-0000-0000-000000000002',
    roles: [
      { id: 'c0000000-0000-0000-0000-000000000002', code: 'PRINCIPAL', name: 'Hiệu trưởng', description: '', isSystem: true, tenantId: null, createdAt: new Date(), updatedAt: new Date() },
    ],
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockUser }),
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ ...mockUser }),
      }),
    };

    tenantRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'a0000000-0000-0000-0000-000000000002',
        code: 'MN_SAOMAI',
        name: 'Trường Mầm Non Sao Mai',
        phone: '(028) 3829 4999',
        address: '128 Võ Thị Sáu',
        contactEmail: 'saomai@nutribud.vn',
      }),
    };

    twoFactorService = {
      generateSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
      generateOtpAuthUrl: jest.fn().mockReturnValue('otpauth://totp/...'),
      generateQrCodeDataUrl: jest.fn().mockResolvedValue('data:image/png;base64,mockqr'),
      verifyCode: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Tenant), useValue: tenantRepo },
        { provide: TwoFactorService, useValue: twoFactorService },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('trả về thông tin cá nhân và thông tin trường trực thuộc', async () => {
      const res = await service.getProfile('u2000000-0000-0000-0000-000000000001');
      expect(res.email).toBe('hieutruong@saomai.edu.vn');
      expect(res.fullName).toBe('Hoàng Thu Trang');
      expect(res.roles[0].code).toBe('PRINCIPAL');
      expect(res.tenant?.name).toBe('Trường Mầm Non Sao Mai');
    });
  });

  describe('updateProfile', () => {
    it('cập nhật thành công họ tên và số điện thoại', async () => {
      const res = await service.updateProfile('u2000000-0000-0000-0000-000000000001', {
        fullName: 'Nguyễn Thu Thủy',
        phone: '0903888777',
      });
      expect(userRepo.save).toHaveBeenCalled();
      expect(res).toBeDefined();
    });
  });

  describe('setup2FA & enable2FA', () => {
    it('khởi tạo mã QR và secret 2FA cho người dùng', async () => {
      const res = await service.setup2FA('u2000000-0000-0000-0000-000000000001');
      expect(res.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(res.qrCodeDataUrl).toContain('data:image/png;base64');
    });

    it('kích hoạt 2FA thành công khi nhập đúng OTP', async () => {
      userRepo.createQueryBuilder = jest.fn().mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockUser,
          twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        }),
      });

      const res = await service.enable2FA('u2000000-0000-0000-0000-000000000001', '123456');
      expect(res.twoFactorEnabled).toBe(true);
      expect(res.recoveryCodes).toHaveLength(8);
      expect(userRepo.update).toHaveBeenCalled();
    });

    it('tắt 2FA thành công khi tài khoản đã bật và nhập đúng OTP', async () => {
      userRepo.createQueryBuilder = jest.fn().mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockUser,
          twoFactorEnabled: true,
          twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        }),
      });

      const res = await service.disable2FA('u2000000-0000-0000-0000-000000000001', '123456');
      expect(res.twoFactorEnabled).toBe(false);
      expect(userRepo.update).toHaveBeenCalled();
    });

    it('báo lỗi khi tắt 2FA nếu tài khoản chưa bật 2FA', async () => {
      userRepo.createQueryBuilder = jest.fn().mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockUser,
          twoFactorEnabled: false,
        }),
      });

      await expect(
        service.disable2FA('u2000000-0000-0000-0000-000000000001', '123456'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    it('đổi mật khẩu thành công khi đúng mật khẩu hiện tại', async () => {
      const hashed = await bcrypt.hash('OldPassword123@', 12);
      userRepo.createQueryBuilder = jest.fn().mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockUser,
          passwordHash: hashed,
        }),
      });

      const res = await service.changePassword('u2000000-0000-0000-0000-000000000001', {
        currentPassword: 'OldPassword123@',
        newPassword: 'NewPassword456@',
        confirmPassword: 'NewPassword456@',
      });

      expect(res.message).toContain('thành công');
      expect(userRepo.update).toHaveBeenCalled();
    });

    it('báo lỗi nếu mật khẩu xác nhận không khớp', async () => {
      await expect(
        service.changePassword('u2000000-0000-0000-0000-000000000001', {
          currentPassword: 'OldPassword123@',
          newPassword: 'NewPassword456@',
          confirmPassword: 'MismatchPassword',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('báo lỗi nếu mật khẩu mới trùng mật khẩu cũ', async () => {
      await expect(
        service.changePassword('u2000000-0000-0000-0000-000000000001', {
          currentPassword: 'OldPassword123@',
          newPassword: 'OldPassword123@',
          confirmPassword: 'OldPassword123@',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('báo lỗi UnauthorizedException nếu sai mật khẩu hiện tại', async () => {
      const hashed = await bcrypt.hash('RealPassword123@', 12);
      userRepo.createQueryBuilder = jest.fn().mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockUser,
          passwordHash: hashed,
        }),
      });

      await expect(
        service.changePassword('u2000000-0000-0000-0000-000000000001', {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword456@',
          confirmPassword: 'NewPassword456@',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
