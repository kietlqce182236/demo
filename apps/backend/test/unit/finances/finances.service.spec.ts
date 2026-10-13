import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FinancesService } from '../../../src/modules/finances/services/finances.service';
import { Payment } from '../../../src/modules/payments/entities/payment.entity';
import { ClassEntity } from '../../../src/modules/classes/entities/class.entity';
import { Child } from '../../../src/modules/children/entities/child.entity';
import { SchoolTenant } from '../../../src/modules/auth/entities/tenant.entity';

describe('FinancesService (Unit Tests)', () => {
  let service: FinancesService;
  let mockPaymentRepo: any;
  let mockClassRepo: any;
  let mockChildRepo: any;
  let mockSchoolRepo: any;

  beforeEach(async () => {
    mockPaymentRepo = {
      find: jest.fn(),
    };

    mockClassRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockChildRepo = {
      count: jest.fn(),
    };

    mockSchoolRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancesService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(ClassEntity), useValue: mockClassRepo },
        { provide: getRepositoryToken(Child), useValue: mockChildRepo },
        { provide: getRepositoryToken(SchoolTenant), useValue: mockSchoolRepo },
      ],
    }).compile();

    service = module.get<FinancesService>(FinancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview()', () => {
    it('should compute total revenue, expense, surplus, and class ledgers', async () => {
      mockSchoolRepo.findOne.mockResolvedValue({ id: 1, name: 'Trường MN Hướng Dương' });
      mockClassRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'Lớp Mầm 1',
          ageGroup: 'MAM',
          students: [{}, {}, {}],
          homeroomTeacher: { fullName: 'Cô Lan', phone: '0901234567' },
        },
      ]);
      mockChildRepo.count.mockResolvedValue(30);
      mockPaymentRepo.find.mockResolvedValue([
        {
          id: 1,
          amount: 550000,
          status: 'SUCCESS',
          paidAt: new Date('2026-10-05'),
          registration: {
            student: { fullName: 'Bé Hoàng Quân', class: { name: 'Lớp Mầm 1' } },
          },
        },
      ]);

      const overview = await service.getOverview('2026-10', 1);

      expect(overview.period.month).toBe('2026-10');
      expect(overview.kpis.totalStudents).toBe(30);
      expect(overview.kpis.collectionRate).toBeGreaterThan(0);
      expect(overview.classLedger).toHaveLength(1);
      expect(overview.classLedger[0].name).toBe('Lớp Mầm 1');
      expect(overview.transactions).toHaveLength(1);
      expect(overview.transactions[0].childName).toBe('Bé Hoàng Quân');
      expect(overview.foodCostNorms.lunch.ingredientCost).toBe(23500);
    });
  });

  describe('createExpense() and deleteExpense()', () => {
    it('should record new expense entry', async () => {
      const dto = {
        category: 'FOOD_FRESH',
        title: 'Mua cá hồi tươi cho tuần 3',
        amount: 8500000,
        expenseDate: '2026-10-15',
        supplierName: 'Công ty Hải Sản Việt',
      };

      const res = await service.createExpense(dto);

      expect(res.success).toBe(true);
      expect(res.data.title).toBe('Mua cá hồi tươi cho tuần 3');
      expect(res.data.amount).toBe(8500000);
    });

    it('should throw NotFoundException when deleting non-existent expense', async () => {
      await expect(service.deleteExpense('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remindClass()', () => {
    it('should trigger reminder for homeroom teacher and parents', async () => {
      mockClassRepo.findOne.mockResolvedValue({ id: 1, name: 'Lớp Chồi 1' });

      const res = await service.remindClass('1');
      expect(res.success).toBe(true);
      expect(res.message).toContain('Lớp Chồi 1');
    });
  });
});
