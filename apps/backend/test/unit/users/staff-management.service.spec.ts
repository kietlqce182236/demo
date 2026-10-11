import { Test, TestingModule } from '@nestjs/testing';
import { StaffManagementService } from '../../../src/modules/users/services/staff-management.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../src/modules/auth/entities/user.entity';
import { Role } from '../../../src/modules/auth/entities/role.entity';
import { StaffProfile } from '../../../src/modules/users/entities/staff-profile.entity';

describe('StaffManagementService', () => {
  let service: StaffManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffManagementService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: getRepositoryToken(StaffProfile), useValue: {} },
      ],
    }).compile();

    service = module.get<StaffManagementService>(StaffManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
