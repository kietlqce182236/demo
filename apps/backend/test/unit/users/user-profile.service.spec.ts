import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileService } from '../../../src/modules/users/services/user-profile.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../src/modules/auth/entities/user.entity';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let mockUserRepo: any;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        email: 'hieutruong@huongduong.edu.vn',
        fullName: 'Bà Nguyễn Thị Lan',
        status: 'ACTIVE',
        roles: [{ code: 'SCHOOL_MANAGER' }],
      }),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user profile', async () => {
    const profile = await service.getProfile(1);
    expect(profile).toHaveProperty('email', 'hieutruong@huongduong.edu.vn');
    expect(profile.roles).toContain('SCHOOL_MANAGER');
  });
});
