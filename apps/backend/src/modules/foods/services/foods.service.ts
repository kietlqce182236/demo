import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Food } from '../entities/food.entity';
import { TenantFood } from '../entities/tenant-food.entity';
import { GetFoodsQueryDto } from '../dto/get-foods-query.dto';
import { CreateFoodDto } from '../dto/create-food.dto';
import { UpdateFoodDto } from '../dto/update-food.dto';

@Injectable()
export class FoodsService {
  constructor(
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
    @InjectRepository(TenantFood)
    private readonly tenantFoodRepository: Repository<TenantFood>,
  ) {}

  async findAll(tenantId: string, query: GetFoodsQueryDto) {
    const { search, category, allergen, tier = 'ALL', page = 1, limit = 8 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.foodRepository.createQueryBuilder('food');

    // 2-Tier Filter Handling
    if (tier === 'PANTRY') {
      // School Active Pantry: custom tenant foods OR foods activated in tenant_foods
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('food.tenantId = :tenantId', { tenantId }).orWhere(
            `food.id IN (SELECT tf.food_id FROM tenant_foods tf WHERE tf.tenant_id = :tenantId)`,
            { tenantId },
          );
        }),
      );
    } else if (tier === 'NATIONAL') {
      // National FCT Library only
      queryBuilder.where('food.isSystem = :isSystem', { isSystem: true });
    } else {
      // ALL: Accessible system foods + tenant custom foods
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('food.tenantId = :tenantId', { tenantId })
            .orWhere('food.isSystem = :isSystem', { isSystem: true })
            .orWhere('food.tenantId IS NULL');
        }),
      );
    }

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('unaccent(food.name) ILIKE unaccent(:search)', { search: `%${search}%` })
            .orWhere('food.code ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (category) {
      queryBuilder.andWhere('food.category = :category', { category });
    }

    if (allergen === 'WARNING') {
      queryBuilder.andWhere('array_length(food.allergens, 1) > 0');
    } else if (allergen === 'SAFE') {
      queryBuilder.andWhere('(array_length(food.allergens, 1) IS NULL OR array_length(food.allergens, 1) = 0)');
    }

    queryBuilder.orderBy('food.name', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    // Determine pantry activation status for the current tenant
    const foodIds = items.map((f) => f.id);
    let activeFoodIdSet = new Set<string>();

    if (foodIds.length > 0) {
      const activeRows = await this.tenantFoodRepository.find({
        where: {
          tenantId,
          foodId: In(foodIds),
        },
        select: ['foodId'],
      });
      activeFoodIdSet = new Set(activeRows.map((r) => r.foodId));
    }

    const itemsWithPantryStatus = items.map((food) => ({
      ...food,
      isInPantry: food.tenantId === tenantId || activeFoodIdSet.has(food.id),
    }));

    return {
      items: itemsWithPantryStatus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async togglePantry(tenantId: string, foodId: string, userId?: string) {
    const food = await this.foodRepository.findOne({ where: { id: foodId } });
    if (!food) {
      throw new NotFoundException(`Food with ID ${foodId} not found`);
    }

    const existing = await this.tenantFoodRepository.findOne({
      where: { tenantId, foodId },
    });

    if (existing) {
      await this.tenantFoodRepository.delete({ tenantId, foodId });
      return { foodId, isInPantry: false, message: 'Đã hủy kích hoạt nguyên liệu khỏi kho trường' };
    } else {
      const entry = this.tenantFoodRepository.create({
        tenantId,
        foodId,
        activatedBy: userId || null,
      });
      await this.tenantFoodRepository.save(entry);
      return { foodId, isInPantry: true, message: 'Đã kích hoạt nguyên liệu vào kho trường' };
    }
  }

  async batchActivatePantry(tenantId: string, foodIds: string[], userId?: string) {
    if (!foodIds || foodIds.length === 0) return { activatedCount: 0 };

    const existing = await this.tenantFoodRepository.find({
      where: { tenantId, foodId: In(foodIds) },
      select: ['foodId'],
    });
    const existingSet = new Set(existing.map((e) => e.foodId));

    const toInsert = foodIds
      .filter((id) => !existingSet.has(id))
      .map((fid) =>
        this.tenantFoodRepository.create({
          tenantId,
          foodId: fid,
          activatedBy: userId || null,
        }),
      );

    if (toInsert.length > 0) {
      await this.tenantFoodRepository.save(toInsert);
    }

    return { activatedCount: toInsert.length };
  }

  async getStats(tenantId: string) {
    const totalIngredients = await this.foodRepository.count({
      where: [{ tenantId }, { isSystem: true }, { tenantId: null }],
    });

    const pantryCount = await this.tenantFoodRepository.count({
      where: { tenantId },
    });

    const allergenCount = await this.foodRepository
      .createQueryBuilder('food')
      .where(
        new Brackets((qb) => {
          qb.where('food.tenantId = :tenantId', { tenantId })
            .orWhere('food.isSystem = :isSystem', { isSystem: true })
            .orWhere('food.tenantId IS NULL');
        }),
      )
      .andWhere('array_length(food.allergens, 1) > 0')
      .getCount();

    const categoryCountResult = await this.foodRepository
      .createQueryBuilder('food')
      .select('COUNT(DISTINCT food.category)', 'count')
      .where(
        new Brackets((qb) => {
          qb.where('food.tenantId = :tenantId', { tenantId })
            .orWhere('food.isSystem = :isSystem', { isSystem: true })
            .orWhere('food.tenantId IS NULL');
        }),
      )
      .getRawOne();

    const categoryCount = parseInt(categoryCountResult?.count || '0', 10);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const updatedThisWeekCount = await this.foodRepository
      .createQueryBuilder('food')
      .where(
        new Brackets((qb) => {
          qb.where('food.tenantId = :tenantId', { tenantId })
            .orWhere('food.isSystem = :isSystem', { isSystem: true })
            .orWhere('food.tenantId IS NULL');
        }),
      )
      .andWhere('food.updatedAt >= :oneWeekAgo', { oneWeekAgo })
      .getCount();

    return {
      totalIngredients,
      pantryCount,
      allergenCount,
      categoryCount,
      updatedThisWeekCount,
    };
  }

  async findOne(id: string, tenantId: string) {
    const food = await this.foodRepository.findOne({
      where: [
        { id, tenantId },
        { id, isSystem: true },
        { id, tenantId: null },
      ],
    });

    if (!food) {
      throw new NotFoundException(`Food ingredient with ID ${id} not found`);
    }

    const isInPantry =
      food.tenantId === tenantId ||
      !!(await this.tenantFoodRepository.findOne({ where: { tenantId, foodId: id } }));

    return { ...food, isInPantry };
  }

  async create(tenantId: string, createFoodDto: CreateFoodDto, userId?: string) {
    const newFood = this.foodRepository.create({
      ...createFoodDto,
      tenantId: tenantId === '00000000-0000-0000-0000-000000000000' ? null : tenantId,
      isSystem: false,
    });

    const saved = await this.foodRepository.save(newFood);

    // Auto-activate in tenant's pantry
    if (saved.tenantId) {
      await this.tenantFoodRepository.save({
        tenantId: saved.tenantId,
        foodId: saved.id,
        activatedBy: userId || null,
      });
    }

    return saved;
  }

  async update(id: string, tenantId: string, updateFoodDto: UpdateFoodDto) {
    const food = await this.findOne(id, tenantId);
    const updatedFood = this.foodRepository.merge(food, updateFoodDto);
    return this.foodRepository.save(updatedFood);
  }

  async remove(id: string, tenantId: string) {
    const food = await this.findOne(id, tenantId);
    await this.tenantFoodRepository.delete({ tenantId, foodId: id });
    return this.foodRepository.remove(food);
  }
}
