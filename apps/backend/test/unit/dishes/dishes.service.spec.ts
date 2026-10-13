import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DishesService } from '../../../src/modules/dishes/dishes.service';
import { Dish } from '../../../src/modules/dishes/entities/dish.entity';
import { DishCategory } from '../../../src/modules/dishes/entities/dish-category.entity';
import { RecipeItem } from '../../../src/modules/dishes/entities/recipe-item.entity';
import { DishNutrition } from '../../../src/modules/dishes/entities/dish-nutrition.entity';
import { Food } from '../../../src/modules/foods/entities/food.entity';

describe('DishesService (Unit Tests)', () => {
  let service: DishesService;
  let mockDishRepo: any;
  let mockCatRepo: any;
  let mockRecipeRepo: any;
  let mockNutritionRepo: any;
  let mockFoodRepo: any;

  beforeEach(async () => {
    mockDishRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 1 })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 1 })),
      remove: jest.fn().mockResolvedValue(true),
    };

    mockCatRepo = {
      find: jest.fn(),
    };

    mockRecipeRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 10 })),
      save: jest.fn().mockImplementation((entities) => Promise.resolve(entities)),
      find: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockNutritionRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    mockFoodRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DishesService,
        { provide: getRepositoryToken(Dish), useValue: mockDishRepo },
        { provide: getRepositoryToken(DishCategory), useValue: mockCatRepo },
        { provide: getRepositoryToken(RecipeItem), useValue: mockRecipeRepo },
        { provide: getRepositoryToken(DishNutrition), useValue: mockNutritionRepo },
        { provide: getRepositoryToken(Food), useValue: mockFoodRepo },
      ],
    }).compile();

    service = module.get<DishesService>(DishesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll()', () => {
    it('should query dishes, map them and return summary stats', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 1,
              name: 'Thịt bò xào rau củ',
              categoryId: 1,
              category: { name: 'Món chính', code: 'MAIN' },
              nutrition: { energyKcal: 180, proteinG: 18, fatG: 7, carbG: 5 },
              recipes: [{ id: 1 }, { id: 2 }],
              dishAllergens: [],
              status: 'ACTIVE',
            },
          ],
          1,
        ]),
      };

      const mockQbAllergens = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
      };

      mockDishRepo.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockQbAllergens);

      mockDishRepo.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      const result = await service.findAll({ search: 'thịt' });

      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Thịt bò xào rau củ');
      expect(result.items[0].categoryCode).toBe('MAIN');
      expect(result.items[0].recipeCount).toBe(2);
      expect(result.stats.totalDishes).toBe(1);
    });
  });

  describe('findOne()', () => {
    it('should throw NotFoundException when dish does not exist', async () => {
      mockDishRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return dish with recipes, allergens, and nutrition', async () => {
      mockDishRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'Canh bí đỏ thịt bằm',
        category: { name: 'Canh', code: 'SOUP' },
        nutrition: { energyKcal: 95, proteinG: 6, fatG: 3, carbG: 10 },
        recipes: [
          {
            id: 1,
            ingredientId: 5,
            ingredient: { name: 'Bí đỏ', unit: 'g' },
            grossWeightG: 50,
            netWeightG: 45,
          },
        ],
        dishAllergens: [],
      });

      const dish = await service.findOne(1);
      expect(dish.name).toBe('Canh bí đỏ thịt bằm');
      expect(dish.categoryName).toBe('Canh');
      expect(dish.recipes).toHaveLength(1);
      expect(dish.recipes[0].ingredientName).toBe('Bí đỏ');
    });
  });

  describe('recalculateDishNutrition()', () => {
    it('should accurately calculate total calories and macronutrients from ingredients', async () => {
      mockRecipeRepo.find.mockResolvedValue([
        {
          netWeightG: 100, // 100g thịt nạc
          ingredient: {
            energyKcal100g: 143,
            proteinG: 21,
            fatG: 7,
            carbG: 0,
            fiberG: 0,
            calciumMg: 10,
            ironMg: 2,
            zincMg: 3,
          },
        },
        {
          netWeightG: 50, // 50g cà rốt (factor 0.5)
          ingredient: {
            energyKcal100g: 40,
            proteinG: 1,
            fatG: 0.2,
            carbG: 8,
            fiberG: 2.8,
            calciumMg: 30,
            ironMg: 0.5,
            zincMg: 0.2,
          },
        },
      ]);

      mockNutritionRepo.findOne.mockResolvedValue(null);

      await service.recalculateDishNutrition(1);

      expect(mockNutritionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          dishId: 1,
          energyKcal: 163, // 143 + 20
          proteinG: 21.5, // 21 + 0.5
          fatG: 7.1, // 7 + 0.1
          carbG: 4, // 0 + 4
        }),
      );
    });
  });

  describe('create() and update()', () => {
    it('should create dish, save recipes, and trigger nutrition recalculation', async () => {
      const dto = {
        name: 'Trứng cuộn rau củ',
        categoryId: 1,
        recipes: [{ ingredientId: 2, netWeightG: 60, grossWeightG: 65 }],
      };

      jest.spyOn(service, 'recalculateDishNutrition').mockResolvedValue(undefined as any);
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1', name: 'Trứng cuộn rau củ' } as any);

      const res = await service.create(dto);

      expect(mockDishRepo.create).toHaveBeenCalled();
      expect(mockDishRepo.save).toHaveBeenCalled();
      expect(mockRecipeRepo.save).toHaveBeenCalled();
      expect(service.recalculateDishNutrition).toHaveBeenCalledWith(1);
      expect(res.name).toBe('Trứng cuộn rau củ');
    });

    it('should throw NotFoundException on update if dish is not found', async () => {
      mockDishRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('should remove existing dish successfully', async () => {
      mockDishRepo.findOne.mockResolvedValue({ id: 1, name: 'Món xóa' });

      const res = await service.remove(1);

      expect(mockDishRepo.remove).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });
  });
});
