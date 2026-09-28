import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PasswordResetService } from '../../../src/modules/auth/services/password-reset.service';
import { User } from '../../../src/modules/auth/entities/user.entity';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let userRepo: any;
  let configService: any;

  const mockUser: Partial<User> = {
    id: 'u2000000-0000-0000-0000-000000000001',
    email: 'hieutruong@saomai.edu.vn',
    fullName: 'Hoàng Thu Trang',
    status: 'ACTIVE',
    passwordHash: '$2b$10$oldHashValue...',
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockUser }),
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
    };

    configService = {
      get: jest.fn().mockReturnValue('development'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('forgotPassword', () => {
    it('gửi OTP thành công cho email hợp lệ', async () => {
      jest.spyOn(service as any, 'sendOtpEmail').mockResolvedValue(undefined);
      const result = await service.forgotPassword({ email: 'hieutruong@saomai.edu.vn' });
      expect(result.message).toContain('Mã xác thực OTP đã được gửi');
      expect(result.expiresInSeconds).toBe(300);
      expect((result as any).debugOtp).toBeUndefined();
    });

    it('từ chối yêu cầu nếu tài khoản bị khóa (BLOCKED)', async () => {
      userRepo.findOne.mockResolvedValueOnce({ ...mockUser, status: 'BLOCKED' });
      await expect(
        service.forgotPassword({ email: 'blocked@saomai.edu.vn' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyResetOtp & resetPassword flow', () => {
    it('hoàn thành trọn vẹn luồng xác thực OTP và đổi mật khẩu mới', async () => {
      let capturedOtp = '';
      jest.spyOn(service as any, 'sendOtpEmail').mockImplementation(async (_email: any, _name: any, otp: any) => {
        capturedOtp = String(otp);
      });

      // 1. Yêu cầu OTP
      await service.forgotPassword({ email: 'hieutruong@saomai.edu.vn' });
      const otp = capturedOtp;
      expect(otp).toHaveLength(6);

      // 2. Xác thực sai OTP -> Báo lỗi
      await expect(
        service.verifyResetOtp({ email: 'hieutruong@saomai.edu.vn', otp: '000000' }),
      ).rejects.toThrow(BadRequestException);

      // 3. Xác thực đúng OTP -> Nhận resetToken
      const verifyRes = await service.verifyResetOtp({
        email: 'hieutruong@saomai.edu.vn',
        otp,
      });
      expect(verifyRes.resetToken).toBeDefined();

      // 4. Mật khẩu xác nhận không khớp -> Báo lỗi
      await expect(
        service.resetPassword({
          resetToken: verifyRes.resetToken,
          newPassword: 'NewPassword@123',
          confirmPassword: 'MismatchPassword@123',
        }),
      ).rejects.toThrow(BadRequestException);

      // 5. Đặt lại mật khẩu thành công
      const resetRes = await service.resetPassword({
        resetToken: verifyRes.resetToken,
        newPassword: 'NewPassword@123',
        confirmPassword: 'NewPassword@123',
      });

      expect(resetRes.message).toContain('thành công');
      expect(userRepo.save).toHaveBeenCalled();

      // 6. Token đã dùng rồi không thể dùng lại lần 2
      await expect(
        service.resetPassword({
          resetToken: verifyRes.resetToken,
          newPassword: 'AnotherPassword@123',
          confirmPassword: 'AnotherPassword@123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
