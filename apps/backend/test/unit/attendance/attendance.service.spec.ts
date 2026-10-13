import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttendanceService } from '../../../src/modules/attendance/services/attendance.service';
import { DailyMealAttendance } from '../../../src/modules/attendance/entities/daily-meal-attendance.entity';
import { ClassEntity } from '../../../src/modules/classes/entities/class.entity';
import { Child } from '../../../src/modules/children/entities/child.entity';

describe('AttendanceService (Unit Tests)', () => {
  let service: AttendanceService;
  let mockAttendanceRepo: any;
  let mockClassRepo: any;
  let mockChildRepo: any;

  beforeEach(async () => {
    mockAttendanceRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      createQueryBuilder: jest.fn(),
    };

    mockClassRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockChildRepo = {
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(DailyMealAttendance),
          useValue: mockAttendanceRepo,
        },
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: mockClassRepo,
        },
        {
          provide: getRepositoryToken(Child),
          useValue: mockChildRepo,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClasses()', () => {
    it('should return list of classes enriched with student count', async () => {
      mockClassRepo.find.mockResolvedValue([
        { id: 1, name: 'Lớp Mầm 1', ageGroup: 'MAM' },
        { id: 2, name: 'Lớp Chồi 1', ageGroup: 'CHOI' },
      ]);
      mockChildRepo.count.mockResolvedValueOnce(25).mockResolvedValueOnce(30);

      const classes = await service.getClasses();
      expect(classes).toHaveLength(2);
      expect(classes[0].name).toBe('Lớp Mầm 1');
      expect(classes[0].studentCount).toBe(25);
      expect(classes[1].studentCount).toBe(30);
    });
  });

  describe('getSchoolHeadcountSummary()', () => {
    it('should compute school attendance rate and headcount', async () => {
      mockChildRepo.count.mockResolvedValueOnce(150); // total enrolled
      mockAttendanceRepo.count.mockResolvedValueOnce(142); // attended lunch
      mockChildRepo.count.mockResolvedValueOnce(75); // boys count
      mockClassRepo.find.mockResolvedValue([]);

      const summary = await service.getSchoolHeadcountSummary('2026-10-12');
      expect(summary.totalEnrolled).toBe(150);
      expect(summary.totalPresent).toBe(142);
      expect(summary.totalAbsent).toBe(8);
    });
  });

  describe('getKitchenKdsData()', () => {
    it('should tally lunch and snack portions with allergy counts for KDS', async () => {
      mockChildRepo.count.mockResolvedValue(120);
      mockAttendanceRepo.count.mockResolvedValue(115);
      mockClassRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'Lớp Mầm 1',
          ageGroup: 'MAM',
          students: [
            { id: 1, fullName: 'Nguyễn Gia Bảo', allergies: [{ id: 1, allergenName: 'Hải sản' }] },
            { id: 2, fullName: 'Trần Thảo Ly', allergies: [] },
          ],
        },
      ]);
      mockAttendanceRepo.find.mockResolvedValue([]);

      const kds = await service.getKitchenKdsData('2026-10-12');
      expect(kds).toHaveProperty('date', '2026-10-12');
      expect(kds).toHaveProperty('classes');
      expect(kds).toHaveProperty('totalPlanned', 150);
      expect(kds).toHaveProperty('totalActual', 146);
      expect(kds.classes).toHaveLength(1);
      expect(kds.classes[0].className).toBe('Lớp Mầm 1');
    });
  });
});
