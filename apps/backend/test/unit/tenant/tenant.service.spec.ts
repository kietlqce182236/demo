import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from '../../../src/modules/tenant/services/tenant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SchoolTenant } from '../../../src/modules/auth/entities/tenant.entity';
import { Language } from '../../../src/modules/tenant/entities/language.entity';
import { UiTranslation } from '../../../src/modules/tenant/entities/ui-translation.entity';
import { SystemConfig } from '../../../src/modules/tenant/entities/system-config.entity';

describe('TenantService', () => {
  let service: TenantService;
  let mockSchoolRepo: any;

  beforeEach(async () => {
    mockSchoolRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Trường Mầm Non Hướng Dương',
        address: '182 Nguyễn Đình Chiểu',
      }),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: getRepositoryToken(SchoolTenant), useValue: mockSchoolRepo },
        { provide: getRepositoryToken(Language), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(UiTranslation), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(SystemConfig), useValue: { find: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return tenant profile', async () => {
    const profile = await service.getProfile();
    expect(profile).toHaveProperty('name', 'Trường Mầm Non Hướng Dương');
  });
});
