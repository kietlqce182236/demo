import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Dish } from './entities/dish.entity';
import { RecipeItem } from './entities/recipe-item.entity';
import { Food } from '../foods/entities/food.entity';
import { DishCategory } from './entities/dish-category.entity';
import { DishApprovalRequest } from './entities/dish-approval-request.entity';
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
    @InjectRepository(DishCategory)
    private readonly dishCategoryRepository: Repository<DishCategory>,
    @InjectRepository(DishApprovalRequest)
    private readonly dishApprovalRequestRepository: Repository<DishApprovalRequest>,
  ) {}

  async findAll(tenantId: string, query: GetDishesQueryDto) {
    const {
      search,
      dishType,
      dishCategory,
      approvalStatus,
      targetAgeGroup,
      isActive,
      page = '1',
      limit = '8',
    } = query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const queryBuilder = this.dishRepository
      .createQueryBuilder('dish')
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

    if (dishCategory) {
      queryBuilder.andWhere('dish.dishCategory = :dishCategory', { dishCategory });
    }

    if (approvalStatus) {
      queryBuilder.andWhere('dish.approvalStatus = :approvalStatus', { approvalStatus });
    }

    if (targetAgeGroup) {
      queryBuilder.andWhere('dish.targetAgeGroup = :targetAgeGroup', { targetAgeGroup });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('dish.isActive = :isActive', { isActive: String(isActive) === 'true' });
    }

    queryBuilder.orderBy('dish.createdAt', 'DESC');
    queryBuilder.skip(skip).take(limitNum);

    try {
      const [items, total] = await queryBuilder.getManyAndCount();
      const stats = await this.getStats(tenantId);

      return {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        stats,
      };
    } catch (err) {
      console.error('ERROR in dishesService.findAll:', err);
      throw new BadRequestException(`Lỗi truy vấn món ăn: ${err.message}`);
    }
  }

  async getCategories() {
    return this.dishCategoryRepository.find({
      order: { displayOrder: 'ASC' },
    });
  }

  async getStats(tenantId: string) {
    const totalDishes = await this.dishRepository.count({ where: { tenantId } });
    const mainDishes = await this.dishRepository.count({
      where: {
        tenantId,
        dishType: In(['MAIN_COURSE', 'SOUP', 'SIDE_VEGETABLE', 'RICE_STAPLE']),
      },
    });
    const sideDishes = await this.dishRepository.count({
      where: {
        tenantId,
        dishType: In(['SNACK_AFTERNOON', 'DRINK', 'PORRIDGE_NOODLE']),
      },
    });

    const pendingApprovalCount = await this.dishRepository.count({
      where: { tenantId, approvalStatus: 'PENDING_APPROVAL' },
    });

    const allergenDishesCount = await this.dishRepository
      .createQueryBuilder('dish')
      .innerJoin('dish.recipeItems', 'ri')
      .innerJoin('ri.food', 'food')
      .where('dish.tenantId = :tenantId', { tenantId })
      .andWhere('array_length(food.allergens, 1) > 0')
      .getCount();

    return {
      totalDishes,
      mainDishes,
      sideDishes,
      pendingApprovalCount,
      allergenDishesCount,
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

    const foodIds = recipeItemsDto.map((item) => item.foodId);
    const foods = await this.foodRepository.find({
      where: [
        { id: In(foodIds), tenantId },
        { id: In(foodIds), isSystem: true },
        { id: In(foodIds), tenantId: null },
      ],
    });

    const foodMap = new Map(foods.map((f) => [f.id, f]));

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
      totalCalories: Math.round(totalCalories * 100) / 100,
      totalProteinG: Math.round(totalProteinG * 100) / 100,
      totalFatG: Math.round(totalFatG * 100) / 100,
      totalCarbG: Math.round(totalCarbG * 100) / 100,
      totalCalciumMg: Math.round(totalCalciumMg * 100) / 100,
      totalIronMg: Math.round(totalIronMg * 100) / 100,
      totalZincMg: Math.round(totalZincMg * 100) / 100,
    };
  }

  async create(tenantId: string, createDishDto: CreateDishDto) {
    const { recipeItems, ...dishData } = createDishDto;

    const nutrition = await this.calculateNutrition(recipeItems || [], tenantId);

    const newDish = this.dishRepository.create({
      ...dishData,
      ...nutrition,
      tenantId: tenantId === '00000000-0000-0000-0000-000000000000' ? null : tenantId,
      approvalStatus: dishData.approvalStatus || 'APPROVED',
      dishCategory: dishData.dishCategory || null,
    });

    const savedDish = await this.dishRepository.save(newDish);

    if (recipeItems && recipeItems.length > 0) {
      const itemsToSave = recipeItems.map((item) =>
        this.recipeItemRepository.create({
          ...item,
          dishId: savedDish.id,
          tenantId: savedDish.tenantId,
        }),
      );
      await this.recipeItemRepository.save(itemsToSave);
    }

    return this.findOne(savedDish.id, tenantId);
  }

  async update(id: string, tenantId: string, updateDishDto: UpdateDishDto) {
    const dish = await this.findOne(id, tenantId);

    const { recipeItems, ...dishData } = updateDishDto;

    if (recipeItems) {
      await this.recipeItemRepository.delete({ dishId: id });
      const nutrition = await this.calculateNutrition(recipeItems, tenantId);
      Object.assign(dishData, nutrition);

      const itemsToSave = recipeItems.map((item) =>
        this.recipeItemRepository.create({
          ...item,
          dishId: id,
          tenantId: dish.tenantId,
        }),
      );
      await this.recipeItemRepository.save(itemsToSave);
    }

    const updatedDish = this.dishRepository.merge(dish, dishData);
    await this.dishRepository.save(updatedDish);

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const dish = await this.findOne(id, tenantId);
    dish.isActive = false;
    return this.dishRepository.save(dish);
  }

  // --- Approval Flow ---
  async requestApproval(tenantId: string, dishId: string, requestedBy: string, reason?: string) {
    const dish = await this.findOne(dishId, tenantId);
    dish.approvalStatus = 'PENDING_APPROVAL';
    await this.dishRepository.save(dish);

    const request = this.dishApprovalRequestRepository.create({
      tenantId,
      dishId,
      requestedBy,
      requestReason: reason || 'Đề xuất phê duyệt món ăn mới',
      status: 'PENDING',
    });

    return this.dishApprovalRequestRepository.save(request);
  }

  async reviewApproval(
    tenantId: string,
    requestId: string,
    reviewedBy: string,
    approve: boolean,
    notes?: string,
  ) {
    const request = await this.dishApprovalRequestRepository.findOne({
      where: { id: requestId, tenantId },
    });

    if (!request) {
      throw new NotFoundException(`Approval request ${requestId} not found`);
    }

    request.status = approve ? 'APPROVED' : 'REJECTED';
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.reviewNotes = notes || (approve ? 'Đã phê duyệt' : 'Từ chối');

    await this.dishApprovalRequestRepository.save(request);

    // Update dish
    await this.dishRepository.update(
      { id: request.dishId, tenantId },
      { approvalStatus: approve ? 'APPROVED' : 'REJECTED' },
    );

    return request;
  }

  async getApprovalRequests(tenantId: string, status?: string) {
    const qb = this.dishApprovalRequestRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.dish', 'dish')
      .where('req.tenantId = :tenantId', { tenantId });

    if (status) {
      qb.andWhere('req.status = :status', { status });
    }

    qb.orderBy('req.createdAt', 'DESC');
    return qb.getMany();
  }
}
