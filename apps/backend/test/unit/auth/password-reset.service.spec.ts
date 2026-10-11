import { Test, TestingModule } from '@nestjs/testing';
import { PasswordResetService } from '../../../src/modules/auth/services/password-reset.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../src/modules/auth/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let mockUserRepo: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-reset-token'),
      verify: jest.fn().mockReturnValue({ email: 'user@example.com', purpose: 'reset-password' }),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate OTP when forgotPassword is requested', async () => {
    mockUserRepo.findOne.mockResolvedValue({ id: 1, email: 'user@example.com', fullName: 'Nguyen Van A' });
    const result = await service.forgotPassword('user@example.com');
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('expiresInSeconds');
  });
});
