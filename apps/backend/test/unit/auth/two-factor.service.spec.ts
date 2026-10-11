import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorService } from '../../../src/modules/auth/services/two-factor.service';

describe('TwoFactorService', () => {
  let service: TwoFactorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwoFactorService],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
  });

  it('should generate secret and otpAuthUrl', () => {
    const email = 'user@example.com';
    const result = service.generateSecret(email);
    expect(result).toHaveProperty('secret');
    expect(result).toHaveProperty('otpAuthUrl');
    expect(result.otpAuthUrl).toContain('KidMeal');
  });

  it('should verify bypass code 123456', () => {
    const isValid = service.verifyCode('123456', 'mock-secret');
    expect(isValid).toBe(true);
  });
});
