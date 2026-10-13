import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FoodsService } from '../../../src/modules/foods/services/foods.service';
import { Food } from '../../../src/modules/foods/entities/food.entity';
import { FoodCategory } from '../../../src/modules/foods/entities/food-category.entity';

describe('FoodsService (Unit Tests)', () => {
  let service: FoodsService;
  let mockFoodRepo: any;
  let mockCatRepo: any;

  beforeEach(async () => {
    mockFoodRepo = {
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 1 })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 1 })),
      remove: jest.fn().mockResolvedValue(true),
    };

    mockCatRepo = {
      count: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodsService,
        { provide: getRepositoryToken(Food), useValue: mockFoodRepo },
        { provide: getRepositoryToken(FoodCategory), useValue: mockCatRepo },
      ],
    }).compile();

    service = module.get<FoodsService>(FoodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll()', () => {
    it('should query food ingredients and map categoryName', async () => {
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
              name: 'Gạo tẻ',
              categoryId: 1,
              category: { id: 1, name: 'Ngũ cốc' },
              energyKcal100g: 344,
              proteinG: 7.9,
              status: 'ACTIVE',
            },
          ],
          1,
        ]),
      };

      mockFoodRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ search: 'gạo' });

      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe('1');
      expect(result.items[0].name).toBe('Gạo tẻ');
      expect(result.items[0].categoryName).toBe('Ngũ cốc');
    });
  });

  describe('getStats()', () => {
    it('should return aggregated food ingredients counts', async () => {
      mockFoodRepo.count.mockResolvedValueOnce(120).mockResolvedValueOnce(115);
      mockCatRepo.count.mockResolvedValue(6);

      const stats = await service.getStats();

      expect(stats.totalFoods).toBe(120);
      expect(stats.activeFoods).toBe(115);
      expect(stats.categoryCount).toBe(6);
      expect(stats.allergenCount).toBe(8);
    });
  });

  describe('findOne()', () => {
    it('should throw NotFoundException if food does not exist', async () => {
      mockFoodRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return food details when found', async () => {
      mockFoodRepo.findOne.mockResolvedValue({
        id: 5,
        name: 'Thịt bò phi lê',
        energyKcal100g: 143,
        proteinG: 21,
        fatG: 7,
        category: { id: 2, name: 'Thịt' },
      });

      const food = await service.findOne(5);
      expect(food.id).toBe('5');
      expect(food.name).toBe('Thịt bò phi lê');
      expect(food.categoryName).toBe('Thịt');
    });
  });

  describe('create() and update()', () => {
    it('should create new food ingredient and return findOne', async () => {
      const dto = {
        name: 'Bí ngô đỏ',
        categoryId: 3,
        energyKcal100g: 27,
        proteinG: 1.1,
        carbG: 6.5,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: '1',
        name: 'Bí ngô đỏ',
        energyKcal100g: 27,
      } as any);

      const res = await service.create(dto as any);
      expect(mockFoodRepo.create).toHaveBeenCalled();
      expect(mockFoodRepo.save).toHaveBeenCalled();
      expect(res.name).toBe('Bí ngô đỏ');
    });

    it('should update food ingredient properties', async () => {
      mockFoodRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'Cà chua',
        energyKcal100g: 20,
      });

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: '1',
        name: 'Cà chua bi',
        energyKcal100g: 22,
      } as any);

      const res = await service.update(1, { name: 'Cà chua bi', energyKcal100g: 22 });
      expect(mockFoodRepo.save).toHaveBeenCalled();
      expect(res.name).toBe('Cà chua bi');
    });
  });
});
