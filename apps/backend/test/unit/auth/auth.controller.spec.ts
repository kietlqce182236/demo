import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { PasswordResetService } from '../../../src/modules/auth/services/password-reset.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn().mockResolvedValue({ accessToken: 'mock-token', user: { email: 'admin@huongduong.edu.vn' } }),
      quickLogin: jest.fn().mockResolvedValue({ accessToken: 'mock-token', user: { email: 'admin@huongduong.edu.vn' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: PasswordResetService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should perform quick login successfully', async () => {
    const res = await controller.quickLogin({ roleCode: 'SCHOOL_MANAGER' });
    expect(res).toHaveProperty('accessToken');
    expect(mockAuthService.quickLogin).toHaveBeenCalledWith({ roleCode: 'SCHOOL_MANAGER' });
  });
});
