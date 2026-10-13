import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ParentEvaluationService } from '../../../src/modules/parent-evaluations/services/parent-evaluation.service';
import { ParentEvaluation, EvaluationReply } from '../../../src/modules/parent-evaluations/entities/parent-evaluation.entity';
import { Child } from '../../../src/modules/children/entities/child.entity';
import { DailyMealAttendance } from '../../../src/modules/attendance/entities/daily-meal-attendance.entity';

describe('ParentEvaluationService (Unit Tests)', () => {
  let service: ParentEvaluationService;
  let mockEvalRepo: any;
  let mockReplyRepo: any;
  let mockChildRepo: any;
  let mockAttendanceRepo: any;

  beforeEach(async () => {
    mockEvalRepo = {
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 1 })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 1 })),
    };

    mockReplyRepo = {
      createQueryBuilder: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({
        ...dto,
        id: 1,
        repliedAt: new Date(),
        user: { fullName: 'Cô Hiệu Phó' },
      })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: 1 })),
    };

    mockChildRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    mockAttendanceRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentEvaluationService,
        { provide: getRepositoryToken(ParentEvaluation), useValue: mockEvalRepo },
        { provide: getRepositoryToken(EvaluationReply), useValue: mockReplyRepo },
        { provide: getRepositoryToken(Child), useValue: mockChildRepo },
        { provide: getRepositoryToken(DailyMealAttendance), useValue: mockAttendanceRepo },
      ],
    }).compile();

    service = module.get<ParentEvaluationService>(ParentEvaluationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEvaluations()', () => {
    it('should query evaluations, calculate average rating and response metrics', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 1,
              studentId: 10,
              rating: 5,
              comment: 'Bé ăn ngon miệng, rất thích món canh bí đỏ.',
              createdAt: new Date('2026-10-12T11:30:00Z'),
              student: { fullName: 'Nguyễn Minh Quân', class: { name: 'Lớp Mầm 1', ageGroup: 'MAM' } },
              replies: [],
            },
          ],
          1,
        ]),
      };

      const mockQbRatings = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '4.8', total: '1' }),
      };

      const mockQbPositive = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };

      const mockQbReplies = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
      };

      mockEvalRepo.createQueryBuilder
        .mockReturnValueOnce(mockQb)
        .mockReturnValueOnce(mockQbRatings)
        .mockReturnValueOnce(mockQbPositive);

      mockEvalRepo.count.mockResolvedValue(1);
      mockReplyRepo.createQueryBuilder.mockReturnValue(mockQbReplies);

      const result = await service.getEvaluations({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('PENDING');
      expect(result.items[0].rating).toBe(5);
      expect(result.items[0].childNameCustom).toBe('Nguyễn Minh Quân');
      expect(result.summaryStats.avgRating).toBe(4.8);
      expect(result.summaryStats.pendingCount).toBe(1);
    });
  });

  describe('respondToEvaluation()', () => {
    it('should throw NotFoundException if evaluation not found', async () => {
      mockEvalRepo.findOne.mockResolvedValue(null);

      await expect(
        service.respondToEvaluation(999, { responseContent: 'Cảm ơn phụ huynh' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should persist staff reply and return updated evaluation status', async () => {
      const mockEval = {
        id: 1,
        studentId: 5,
        rating: 4,
        comment: 'Cần chú ý bé ăn chậm',
        createdAt: new Date(),
        student: { fullName: 'Bé Tuấn Khang', class: { name: 'Lớp Chồi 2' } },
        replies: [],
      };

      mockEvalRepo.findOne.mockResolvedValue(mockEval);

      const res = await service.respondToEvaluation(
        1,
        { responseContent: 'Nhà trường và cô giáo đã ghi nhận và hỗ trợ bé ăn chậm.' },
        2,
      );

      expect(mockReplyRepo.create).toHaveBeenCalled();
      expect(mockReplyRepo.save).toHaveBeenCalled();
      expect(res.status).toBe('RESPONDED');
      expect(res.responseContent).toBe('Nhà trường và cô giáo đã ghi nhận và hỗ trợ bé ăn chậm.');
    });
  });

  describe('submitEvaluation()', () => {
    it('should create and save parent feedback', async () => {
      const payload = {
        childId: '12',
        rating: 5,
        comment: 'Bé về khen đồ ăn trường ngon lắm!',
      };

      const res = await service.submitEvaluation(payload as any);

      expect(mockEvalRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 12,
          rating: 5,
          comment: 'Bé về khen đồ ăn trường ngon lắm!',
        }),
      );
      expect(mockEvalRepo.save).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });
  });

  describe('getPortalData()', () => {
    it('should assemble parent portal feed with child profile, meal data and evaluation stats', async () => {
      mockChildRepo.findOne.mockResolvedValue({
        id: 1,
        fullName: 'Nguyễn Bảo Nam',
        class: { name: 'Lớp Mầm 1', ageGroup: 'MAM' },
        allergies: [],
      });
      mockEvalRepo.find.mockResolvedValue([]);

      const portal = await service.getPortalData('1', 1);

      expect(portal.childProfile.name).toBe('Nguyễn Bảo Nam');
      expect(portal.todayMeal.session).toBe('Bữa trưa');
      expect(portal.todayMeal.dishes).toHaveLength(4);
      expect(portal.stats.maxRating).toBe(5.0);
    });
  });
});
