import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from '../../../src/modules/dashboard/services/dashboard.service';
import { Child } from '../../../src/modules/children/entities/child.entity';
import { DailyMealAttendance } from '../../../src/modules/attendance/entities/daily-meal-attendance.entity';
import { Menu } from '../../../src/modules/menus/entities/menu.entity';
import { GrowthRecord, GrowthZscore } from '../../../src/modules/growth/entities/growth-record.entity';
import { ChildAllergy } from '../../../src/modules/children/entities/child-allergy.entity';
import { SnackRegistration } from '../../../src/modules/snack-services/entities/snack-registration.entity';
import { Payment } from '../../../src/modules/payments/entities/payment.entity';
import { InspectionRecord } from '../../../src/modules/inspections/entities/inspection-record.entity';
import { InspectionSampleItem } from '../../../src/modules/inspections/entities/inspection-sample-item.entity';

describe('DashboardService (Unit Tests)', () => {
  let service: DashboardService;
  let mockChildRepo: any;
  let mockAttendanceRepo: any;
  let mockMenuRepo: any;
  let mockGrowthRepo: any;
  let mockZscoreRepo: any;
  let mockAllergyRepo: any;
  let mockSnackRegRepo: any;
  let mockPaymentRepo: any;
  let mockInspectionRepo: any;
  let mockSampleRepo: any;

  beforeEach(async () => {
    mockChildRepo = { count: jest.fn().mockResolvedValue(150) };
    mockAttendanceRepo = { find: jest.fn().mockResolvedValue([]) };
    mockMenuRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 1, title: 'Thực đơn Dinh dưỡng Tuần 42', ageGroup: 'MAU_GIAO', status: 'PUBLISHED' },
      ]),
    };
    mockGrowthRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ cnt: '150' }),
      }),
    };
    mockZscoreRepo = { count: jest.fn().mockResolvedValue(140) };
    mockAllergyRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ cnt: '5' }),
      }),
    };
    mockSnackRegRepo = { count: jest.fn().mockResolvedValue(20) };
    mockPaymentRepo = { find: jest.fn().mockResolvedValue([]) };
    mockInspectionRepo = { find: jest.fn().mockResolvedValue([]) };
    mockSampleRepo = { count: jest.fn().mockResolvedValue(4) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Child), useValue: mockChildRepo },
        { provide: getRepositoryToken(DailyMealAttendance), useValue: mockAttendanceRepo },
        { provide: getRepositoryToken(Menu), useValue: mockMenuRepo },
        { provide: getRepositoryToken(GrowthRecord), useValue: mockGrowthRepo },
        { provide: getRepositoryToken(GrowthZscore), useValue: mockZscoreRepo },
        { provide: getRepositoryToken(ChildAllergy), useValue: mockAllergyRepo },
        { provide: getRepositoryToken(SnackRegistration), useValue: mockSnackRegRepo },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(InspectionRecord), useValue: mockInspectionRepo },
        { provide: getRepositoryToken(InspectionSampleItem), useValue: mockSampleRepo },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExecutiveSummary()', () => {
    it('should aggregate meal portions, nutrition compliance, growth distribution and food safety status', async () => {
      const summary = await service.getExecutiveSummary(1);

      expect(summary).toBeDefined();
      expect(summary.todayAttendance.totalStudents).toBe(150);
      expect(summary.todayAttendance.specialDietCount).toBe(5);
      expect(summary.currentMenu.complianceStatus).toBe('Đạt chuẩn Thông tư 28');
      expect(summary.growthStatistics.totalEvaluated).toBe(150);
      expect(summary.foodSafetyStatus.step1Done).toBe(true);
      expect(summary.snackServiceRevenue.totalRegistrations).toBe(20);
    });
  });
});
