import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../src/modules/auth/entities/user.entity';
import { Role } from '../../../src/modules/auth/entities/role.entity';
import { SchoolTenant } from '../../../src/modules/auth/entities/tenant.entity';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: any;
  let mockJwtService: any;

  const mockUser = {
    id: 1,
    email: 'hieutruong@huongduong.edu.vn',
    fullName: 'Bà Nguyễn Thị Lan',
    passwordHash: '$2b$12$mock',
    roles: [{ code: 'SCHOOL_MANAGER', name: 'Ban Giám hiệu' }],
  };

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockUser),
      }),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(null) } },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: getRepositoryToken(SchoolTenant), useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate tokens for valid user login', async () => {
    const result = await service.quickLogin({ roleCode: 'SCHOOL_MANAGER' });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('user');
    expect(result.user.roles).toContain('SCHOOL_MANAGER');
  });
});
