import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Dish } from './entities/dish.entity';
import { RecipeItem } from './entities/recipe-item.entity';
import { Food } from '../foods/entities/food.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { GetDishesQueryDto } from './dto/get-dishes-query.dto';

@Injectable()
export class DishesService {
  constructor(
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(RecipeItem)
    private readonly recipeItemRepository: Repository<RecipeItem>,
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
  ) {}

  async findAll(tenantId: string, query: GetDishesQueryDto) {
    const { search, dishType, targetAgeGroup, isActive, page = '1', limit = '8' } = query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const queryBuilder = this.dishRepository.createQueryBuilder('dish')
      .leftJoinAndSelect('dish.recipeItems', 'recipeItems')
      .leftJoinAndSelect('recipeItems.food', 'food')
      .where('dish.tenantId = :tenantId', { tenantId });

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('unaccent(dish.name) ILIKE unaccent(:search)', { search: `%${search}%` });
        }),
      );
    }

    if (dishType) {
      queryBuilder.andWhere('dish.dishType = :dishType', { dishType });
    }

    if (targetAgeGroup) {
      queryBuilder.andWhere('dish.targetAgeGroup = :targetAgeGroup', { targetAgeGroup });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('dish.isActive = :isActive', { isActive: String(isActive) === 'true' });
    }

    queryBuilder.orderBy('dish.createdAt', 'DESC');
    queryBuilder.skip(skip).take(limitNum);

    const [items, total] = await queryBuilder.getManyAndCount();

    // Lấy thông tin thống kê cho UI (Optional but helpful)
    const stats = await this.getStats(tenantId);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      stats
    };
  }

  async getStats(tenantId: string) {
    const totalDishes = await this.dishRepository.count({ where: { tenantId } });
    const mainDishes = await this.dishRepository.count({ where: { tenantId, dishType: In(['MAIN_COURSE', 'SOUP', 'SIDE_VEGETABLE', 'RICE_STAPLE']) } });
    const sideDishes = await this.dishRepository.count({ where: { tenantId, dishType: In(['SNACK_AFTERNOON', 'DRINK', 'PORRIDGE_NOODLE']) } });
    
    // Đếm món có chứa dị nguyên (allergens > 0 in their foods)
    const allergenDishesCount = await this.dishRepository.createQueryBuilder('dish')
      .innerJoin('dish.recipeItems', 'ri')
      .innerJoin('ri.food', 'food')
      .where('dish.tenantId = :tenantId', { tenantId })
      .andWhere('array_length(food.allergens, 1) > 0')
      .getCount();

    return {
      totalDishes,
      mainDishes,
      sideDishes,
      allergenDishesCount
    };
  }

  async findOne(id: string, tenantId: string) {
    const dish = await this.dishRepository.findOne({
      where: { id, tenantId },
      relations: ['recipeItems', 'recipeItems.food'],
    });

    if (!dish) {
      throw new NotFoundException(`Dish with ID ${id} not found`);
    }
    return dish;
  }

  private async calculateNutrition(recipeItemsDto: any[], tenantId: string) {
    let totalCalories = 0;
    let totalProteinG = 0;
    let totalFatG = 0;
    let totalCarbG = 0;
    let totalCalciumMg = 0;
    let totalIronMg = 0;
    let totalZincMg = 0;

    const foodIds = recipeItemsDto.map(item => item.foodId);
    const foods = await this.foodRepository.find({
      where: [
        { id: In(foodIds), tenantId },
        { id: In(foodIds), isSystem: true },
        { id: In(foodIds), tenantId: null }
      ]
    });

    const foodMap = new Map(foods.map(f => [f.id, f]));

    for (const item of recipeItemsDto) {
      const food = foodMap.get(item.foodId);
      if (food) {
        const ratio = item.netWeightPerPortionG / 100;
        totalCalories += (food.energyKcal || 0) * ratio;
        totalProteinG += (food.proteinG || 0) * ratio;
        totalFatG += (food.fatG || 0) * ratio;
        totalCarbG += (food.carbG || 0) * ratio;
        totalCalciumMg += (food.calciumMg || 0) * ratio;
        totalIronMg += (food.ironMg || 0) * ratio;
        totalZincMg += (food.zincMg || 0) * ratio;
      }
    }

    return {
      totalCalories,
      totalProteinG,
      totalFatG,
      totalCarbG,
      totalCalciumMg,
      totalIronMg,
      totalZincMg
    };
  }

  async create(tenantId: string, createDishDto: CreateDishDto) {
    const { recipeItems, ...dishData } = createDishDto;

    // Tính toán dinh dưỡng
    const nutrition = await this.calculateNutrition(recipeItems, tenantId);

    const newDish = this.dishRepository.create({
      ...dishData,
      ...nutrition,
      tenantId: tenantId === '00000000-0000-0000-0000-000000000000' ? null : tenantId,
    });

    const savedDish = await this.dishRepository.save(newDish);

    // Lưu recipe items
    if (recipeItems && recipeItems.length > 0) {
      const itemsToSave = recipeItems.map(item => this.recipeItemRepository.create({
        ...item,
        dishId: savedDish.id,
        tenantId: savedDish.tenantId
      }));
      await this.recipeItemRepository.save(itemsToSave);
    }

    return this.findOne(savedDish.id, tenantId);
  }

  async update(id: string, tenantId: string, updateDishDto: UpdateDishDto) {
    const dish = await this.findOne(id, tenantId);
    
    const { recipeItems, ...dishData } = updateDishDto;

    if (recipeItems) {
      // Xóa các recipe items cũ
      await this.recipeItemRepository.delete({ dishId: id });

      // Tính lại dinh dưỡng
      const nutrition = await this.calculateNutrition(recipeItems, tenantId);
      Object.assign(dishData, nutrition);

      // Lưu recipe items mới
      const itemsToSave = recipeItems.map(item => this.recipeItemRepository.create({
        ...item,
        dishId: id,
        tenantId: dish.tenantId
      }));
      await this.recipeItemRepository.save(itemsToSave);
    }

    // Merge updates
    const updatedDish = this.dishRepository.merge(dish, dishData);
    await this.dishRepository.save(updatedDish);

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const dish = await this.findOne(id, tenantId);
    dish.isActive = false;
    return this.dishRepository.save(dish);
  }
}
