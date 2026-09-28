import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Food } from '../entities/food.entity';
import { GetFoodsQueryDto } from '../dto/get-foods-query.dto';
import { CreateFoodDto } from '../dto/create-food.dto';
import { UpdateFoodDto } from '../dto/update-food.dto';
import { NotFoundException } from '@nestjs/common';
@Injectable()
export class FoodsService {
  constructor(
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
  ) {}

  async findAll(tenantId: string, query: GetFoodsQueryDto) {
    const { search, category, allergen, page = 1, limit = 8 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.foodRepository.createQueryBuilder('food');

    // Mặc định lấy food của tenant đó hoặc các food dùng chung (isSystem = true) hoặc tenantId bị null (trong môi trường dev)
    queryBuilder.where(
      new Brackets((qb) => {
        qb.where('food.tenantId = :tenantId', { tenantId })
          .orWhere('food.isSystem = :isSystem', { isSystem: true })
          .orWhere('food.tenantId IS NULL');
      }),
    );

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('unaccent(food.name) ILIKE unaccent(:search)', { search: `%${search}%` });
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

    // Default sorting
    queryBuilder.orderBy('food.createdAt', 'DESC');

    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(tenantId: string) {
    // 1. Tổng số nguyên liệu
    const totalIngredients = await this.foodRepository.count({
      where: [
        { tenantId },
        { isSystem: true },
        { tenantId: null }
      ]
    });

    // 2. Số nguyên liệu có cảnh báo dị ứng (có dữ liệu ở trường allergens)
    // Trường hợp mảng allergens có phần tử
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

    // 3. Số nhóm thực phẩm (phân loại category unique)
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

    // 4. Số nguyên liệu mới cập nhật tuần này
    // Tính toán đầu tuần (giả sử là 7 ngày trước)
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
        { id, tenantId: null }
      ],
    });

    if (!food) {
      throw new NotFoundException(`Food ingredient with ID ${id} not found`);
    }
    return food;
  }

  async create(tenantId: string, createFoodDto: CreateFoodDto) {
    // If tenantId is mock 0000..., we might insert as null or as the mock ID.
    // For now, let's just use the provided tenantId unless it's null.
    const newFood = this.foodRepository.create({
      ...createFoodDto,
      tenantId: tenantId === '00000000-0000-0000-0000-000000000000' ? null : tenantId,
      isSystem: false,
    });
    
    return this.foodRepository.save(newFood);
  }

  async update(id: string, tenantId: string, updateFoodDto: UpdateFoodDto) {
    const food = await this.findOne(id, tenantId);
    
    // Merge updates
    const updatedFood = this.foodRepository.merge(food, updateFoodDto);
    return this.foodRepository.save(updatedFood);
  }
}
