import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SnackServicesService } from '../../../src/modules/snack-services/snack-services.service';
import { SnackServicePeriod } from '../../../src/modules/snack-services/entities/snack-service-period.entity';
import { SnackRegistration } from '../../../src/modules/snack-services/entities/snack-registration.entity';
import { Child } from '../../../src/modules/children/entities/child.entity';

describe('SnackServicesService (Unit Tests)', () => {
  let service: SnackServicesService;
  let mockPeriodRepo: any;
  let mockRegRepo: any;
  let mockChildRepo: any;

  beforeEach(async () => {
    mockPeriodRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 1 })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 1 })),
    };

    mockRegRepo = {
      find: jest.fn(),
    };

    mockChildRepo = {
      count: jest.fn().mockResolvedValue(50),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnackServicesService,
        { provide: getRepositoryToken(SnackServicePeriod), useValue: mockPeriodRepo },
        { provide: getRepositoryToken(SnackRegistration), useValue: mockRegRepo },
        { provide: getRepositoryToken(Child), useValue: mockChildRepo },
      ],
    }).compile();

    service = module.get<SnackServicesService>(SnackServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll()', () => {
    it('should calculate participation rates, revenue, and return periods summary', async () => {
      mockPeriodRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'Đợt ăn xế Tháng 10/2026',
          feeAmount: 550000,
          startDate: '2026-10-01',
          endDate: '2026-10-31',
          status: 'OPEN',
          registrations: [
            { id: 1, status: 'PAID' },
            { id: 2, status: 'PAID' },
            { id: 3, status: 'PENDING' },
          ],
        },
      ]);

      const result = await service.findAll();

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].registeredCount).toBe(3);
      expect(result.items[0].paidCount).toBe(2);
      expect(result.items[0].totalRevenue).toBe(1100000); // 2 * 550,000
      expect(result.summary.activeBatches.open).toBe(1);
      expect(result.summary.studentParticipation.registered).toBe(3);
    });
  });

  describe('findOne()', () => {
    it('should throw NotFoundException if snack period does not exist', async () => {
      mockPeriodRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return period with student registrations when found', async () => {
      mockPeriodRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'Đợt ăn xế Tháng 10',
        feeAmount: 550000,
        status: 'OPEN',
        registrations: [
          {
            id: 10,
            studentId: 100,
            status: 'PAID',
            registeredAt: new Date('2026-10-02'),
            student: { fullName: 'Bé Linh Chi', studentCode: 'HS-002', class: { name: 'Lớp Chồi 1' } },
          },
        ],
      });

      const res = await service.findOne(1);
      expect(res.name).toBe('Đợt ăn xế Tháng 10');
      expect(res.registrations).toHaveLength(1);
      expect(res.registrations[0].studentName).toBe('Bé Linh Chi');
      expect(res.registrations[0].className).toBe('Lớp Chồi 1');
    });
  });

  describe('createPeriod() and updatePeriod() and closePeriod()', () => {
    it('should create new snack period with OPEN status', async () => {
      const dto = {
        name: 'Đợt ăn xế Tháng 11/2026',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        feeAmount: 550000,
      };

      const res = await service.createPeriod(dto);
      expect(mockPeriodRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'OPEN' }));
      expect(mockPeriodRepo.save).toHaveBeenCalled();
      expect(res.name).toBe('Đợt ăn xế Tháng 11/2026');
    });

    it('should close period by updating status to CLOSED', async () => {
      mockPeriodRepo.findOne.mockResolvedValue({ id: 1, status: 'OPEN' });

      const res = await service.closePeriod(1);
      expect(mockPeriodRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'CLOSED' }));
      expect(res.status).toBe('CLOSED');
    });
  });

  describe('getDayboardingSummary()', () => {
    it('should return preschool boarding service packages', async () => {
      const res = await service.getDayboardingSummary();
      expect(res.success).toBe(true);
      expect(res.services).toHaveLength(4);
      expect(res.services.some((s) => s.type === 'AFTER_SCHOOL_SNACK')).toBe(true);
      expect(res.summary.totalServices).toBe(4);
    });
  });
});
