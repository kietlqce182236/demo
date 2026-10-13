import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MealPortionsService } from '../../../src/modules/meal-portions/services/meal-portions.service';
import { DailyMealPortion } from '../../../src/modules/meal-portions/entities/daily-meal-portion.entity';
import { ClassEntity } from '../../../src/modules/classes/entities/class.entity';

describe('MealPortionsService (Unit Tests)', () => {
  let service: MealPortionsService;
  let mockPortionRepo: any;
  let mockClassRepo: any;

  beforeEach(async () => {
    mockPortionRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 1 })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 1 })),
    };

    mockClassRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPortionsService,
        { provide: getRepositoryToken(DailyMealPortion), useValue: mockPortionRepo },
        { provide: getRepositoryToken(ClassEntity), useValue: mockClassRepo },
      ],
    }).compile();

    service = module.get<MealPortionsService>(MealPortionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll()', () => {
    it('should map lunch and afternoon snack portions across all classes for given date', async () => {
      mockClassRepo.find.mockResolvedValue([
        { id: 1, name: 'Lớp Mầm 1', ageGroup: 'MAM' },
        { id: 2, name: 'Lớp Chồi 1', ageGroup: 'CHOI' },
      ]);

      mockPortionRepo.find.mockResolvedValue([
        { classId: 1, mealType: 'LUNCH', plannedQuantity: 25, actualQuantity: 24 },
        { classId: 1, mealType: 'AFTERNOON_SNACK', plannedQuantity: 20, actualQuantity: 20 },
      ]);

      const result = await service.findAll({ date: '2026-10-12' });

      expect(result.date).toBe('2026-10-12');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].className).toBe('Lớp Mầm 1');
      expect(result.items[0].lunch.actual).toBe(24);
      expect(result.items[0].afternoonSnack.actual).toBe(20);
      expect(result.totalLunch).toBe(150);
    });
  });

  describe('updateActual()', () => {
    it('should update actual quantity if portion record already exists', async () => {
      mockPortionRepo.findOne.mockResolvedValue({
        id: 1,
        classId: 1,
        date: '2026-10-12',
        mealType: 'LUNCH',
        plannedQuantity: 25,
        actualQuantity: 24,
      });

      const updated = await service.updateActual(1, '2026-10-12', 'LUNCH', 23);

      expect(mockPortionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ actualQuantity: 23 }),
      );
      expect(updated.actualQuantity).toBe(23);
    });

    it('should create new portion record if none exists yet', async () => {
      mockPortionRepo.findOne.mockResolvedValue(null);

      const created = await service.updateActual(2, '2026-10-12', 'LUNCH', 28);

      expect(mockPortionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          classId: 2,
          date: '2026-10-12',
          mealType: 'LUNCH',
          plannedQuantity: 28,
          actualQuantity: 28,
        }),
      );
      expect(mockPortionRepo.save).toHaveBeenCalled();
      expect(created.actualQuantity).toBe(28);
    });
  });
});
