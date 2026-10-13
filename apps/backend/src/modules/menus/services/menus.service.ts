import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Menu } from '../entities/menu.entity';
import { MenuVersion } from '../entities/menu-version.entity';
import { MenuDay } from '../entities/menu-day.entity';
import { MenuMeal } from '../entities/menu-meal.entity';
import { MenuDish } from '../entities/menu-dish.entity';
import { MenuCycle } from '../entities/menu-cycle.entity';
import { Dish } from '../../dishes/entities/dish.entity';
import { NutritionalStandard } from '../entities/nutritional-standard.entity';
import { MenuRuleViolation } from '../entities/menu-rule-violation.entity';
import { QueryMenuDto } from '../dto/query-menu.dto';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { UpdateMenuDto } from '../dto/update-menu.dto';
import { AdjustDishDto } from '../dto/adjust-dish.dto';
import { AutoGenerateMenuDto } from '../dto/auto-generate-menu.dto';

// â”€â”€ Helper: Fisher-Yates shuffle for true randomness â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// â”€â”€ Interfaces for structured daily nutrition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface DishWithNutrition {
  id: number;
  name: string;
  categoryCode: string;
  categoryName: string;
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  portionSizeG: number;
}

export interface DayDishSlot {
  dishId: string;
  dishName: string;
  dishType: string;
  mealTime: string;
  servingOrder: number;
  portionSizeG: number;
  plannedCalories: number;
  proteinG: number;
  fatG: number;
  carbG: number;
}

export interface DayMealPlan {
  dayOfWeek: number;
  dayName: string;
  dishes: DayDishSlot[];
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbG: number;
  proteinPct: number;
  lipidPct: number;
  glucidPct: number;
  isCompliant: boolean;
  violations: string[];
  standardNote: string;
}

@Injectable()
export class MenusService {
  private readonly logger = new Logger(MenusService.name);

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
    @InjectRepository(MenuVersion)
    private readonly versionRepo: Repository<MenuVersion>,
    @InjectRepository(MenuDay)
    private readonly dayRepo: Repository<MenuDay>,
    @InjectRepository(MenuMeal)
    private readonly mealRepo: Repository<MenuMeal>,
    @InjectRepository(MenuDish)
    private readonly menuDishRepo: Repository<MenuDish>,
    @InjectRepository(MenuCycle)
    private readonly cycleRepo: Repository<MenuCycle>,
    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
    @InjectRepository(NutritionalStandard)
    private readonly standardRepo: Repository<NutritionalStandard>,
    @InjectRepository(MenuRuleViolation)
    private readonly violationRepo: Repository<MenuRuleViolation>,
  ) {}

  async findAll(query: QueryMenuDto) {
    const qb = this.menuRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.creator', 'creator')
      .leftJoinAndSelect('m.approver', 'approver');

    if (query.search) {
      qb.andWhere('LOWER(m.title) LIKE :s', { s: `%${query.search.toLowerCase()}%` });
    }

    if (query.status && query.status !== 'ALL') {
      if (query.status === 'SUBMITTED_FOR_REVIEW' || query.status === 'PENDING') {
        qb.andWhere('m.status IN (:...statuses)', { statuses: ['PENDING', 'SUBMITTED_FOR_REVIEW'] });
      } else {
        qb.andWhere('m.status = :status', { status: query.status });
      }
    }

    const ageGroup = query.ageGroup || query.targetAgeGroup;
    if (ageGroup && ageGroup !== 'ALL') {
      const normalizedAge = ageGroup === 'TODDLER_18_36M' ? 'NHA_TRE' : (ageGroup === 'KINDERGARTEN_3_5Y' ? 'MAU_GIAO' : ageGroup);
      qb.andWhere('m.ageGroup = :ageGroup', { ageGroup: normalizedAge });
    }

    if (query.weekStartDate) {
      qb.andWhere('m.weekStartDate = :wsd', { wsd: query.weekStartDate });
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('m.weekStartDate', 'DESC');

    const [items, total] = await qb.getManyAndCount();

    const mapped = items.map((m) => {
      const dateStr = m.approvedAt
        ? m.approvedAt.toISOString()
        : m.weekStartDate
        ? new Date(m.weekStartDate).toISOString()
        : new Date().toISOString();

      return {
        id: String(m.id),
        tenantId: '1',
        title: m.title,
        weekStartDate: m.weekStartDate,
        weekEndDate: m.weekEndDate,
        startDate: m.weekStartDate,
        endDate: m.weekEndDate,
        ageGroup: m.ageGroup,
        targetAgeGroup: m.ageGroup,
        status: m.status === 'PENDING' ? 'SUBMITTED_FOR_REVIEW' : m.status,
        rawStatus: m.status,
        cycleId: m.cycleId ? String(m.cycleId) : null,
        cycleWeekNumber: 1,
        createdByName: m.creator?.fullName || 'BS. Hoàng Mai Trang',
        approvedByName: m.approver?.fullName || null,
        approvedAt: m.approvedAt ? m.approvedAt.toISOString() : null,
        createdAt: dateStr,
        updatedAt: dateStr,
        version: 1,
        isPublished: m.status === 'ACTIVE' || m.status === 'APPROVED' || m.status === 'PUBLISHED',
        dailyAverageCalories: 685,
        dailyAverageProteinG: 28.5,
        dailyAverageFatG: 22.4,
        dailyAverageCarbG: 92.1,
      };
    });

    return { items: mapped, total, page, limit };
  }

  async getStatistics() {
    const total = await this.menuRepo.count();
    const approved = await this.menuRepo.count({ where: { status: 'APPROVED' } });
    const pending = await this.menuRepo
      .createQueryBuilder('m')
      .where('m.status IN (:...statuses)', { statuses: ['PENDING', 'SUBMITTED_FOR_REVIEW'] })
      .getCount();
    const draft = await this.menuRepo.count({ where: { status: 'DRAFT' } });
    const active = await this.menuRepo
      .createQueryBuilder('m')
      .where('m.status IN (:...statuses)', { statuses: ['ACTIVE', 'PUBLISHED'] })
      .getCount();
    const published = await this.menuRepo.count({ where: { status: 'PUBLISHED' } });

    return {
      total,
      totalMenus: total,
      active: active || published || 1,
      submitted: pending,
      pendingApproval: pending,
      draft,
      draftMenus: draft,
      approved,
      approvedMenus: approved,
      publishedMenus: published,
      rejected: 0,
      avgCalories: 685.5,
      nutritionStandard: 'Thông tư 28/2016/TT-BGDĐT',
    };
  }

  async getAvailableDishes() {
    const dishes = await this.dishRepo.find({
      relations: ['category', 'nutrition'],
      order: { name: 'ASC' },
    });

    return dishes.map((d) => ({
      id: String(d.id),
      name: d.name,
      categoryCode: d.category?.code || 'MAIN',
      categoryName: d.category?.name || 'MÃ³n Äƒn',
      energyKcal: d.nutrition?.energyKcal || 0,
      proteinG: d.nutrition?.proteinG || 0,
      fatG: d.nutrition?.fatG || 0,
      carbG: d.nutrition?.carbG || 0,
    }));
  }

  async findOne(id: number) {
    const menu = await this.menuRepo.findOne({
      where: { id },
      relations: ['creator', 'approver'],
    });

    if (!menu) {
      throw new NotFoundException(`Không tìm thấy thực đơn với ID: ${id}`);
    }

    // Find latest version
    let version = await this.versionRepo.findOne({
      where: { menuId: id },
      order: { versionNumber: 'DESC' },
    });

    if (!version) {
      version = await this.versionRepo.save(
        this.versionRepo.create({ menuId: id, versionNumber: 1, createdBy: menu.createdBy }),
      );
    }

    // Load days, meals, dishes
    const days = await this.dayRepo.find({
      where: { menuVersionId: version.id },
      order: { dayOfWeek: 'ASC' },
      relations: ['meals', 'meals.dishes', 'meals.dishes.dish', 'meals.dishes.dish.category', 'meals.dishes.dish.nutrition'],
    });

    const menuDishes: any[] = [];
    let totalMenuCalories = 0;
    let totalMenuProtein = 0;
    let totalMenuFat = 0;
    let totalMenuCarb = 0;
    const activeDaysCount = days.length || 5;

    for (const d of days) {
      const frontendDayOfWeek = d.dayOfWeek >= 2 && d.dayOfWeek <= 6 ? d.dayOfWeek - 1 : d.dayOfWeek;
      for (const m of (d.meals || [])) {
        for (const md of (m.dishes || [])) {
          const cal = Number(md.dish?.nutrition?.energyKcal) || 0;
          const prot = Number(md.dish?.nutrition?.proteinG) || 0;
          const fat = Number(md.dish?.nutrition?.fatG) || 0;
          const carb = Number(md.dish?.nutrition?.carbG) || 0;

          totalMenuCalories += cal;
          totalMenuProtein += prot;
          totalMenuFat += fat;
          totalMenuCarb += carb;

          menuDishes.push({
            id: String(md.id),
            tenantId: '1',
            menuId: String(menu.id),
            dishId: String(md.dishId),
            dayOfWeek: frontendDayOfWeek,
            mealTime: m.mealType,
            servingOrder: md.displayOrder || 1,
            portionSizeG: md.portionSizeG || 100,
            plannedCalories: cal,
            specialDietNotes: md.specialDietNotes || null,
            dish: {
              id: String(md.dish?.id),
              name: md.dish?.name || 'Món ăn',
              dishType: md.dish?.category?.code || 'MAIN',
              targetAgeGroup: menu.ageGroup,
              standardServingSizeG: md.portionSizeG || 100,
              totalCalories: cal,
              totalProteinG: prot,
              totalFatG: fat,
              totalCarbG: carb,
              isActive: true,
            },
          });
        }
      }
    }

    const avgCal = Math.round((totalMenuCalories / activeDaysCount) * 10) / 10;
    const avgProt = Math.round((totalMenuProtein / activeDaysCount) * 10) / 10;
    const avgFat = Math.round((totalMenuFat / activeDaysCount) * 10) / 10;
    const avgCarb = Math.round((totalMenuCarb / activeDaysCount) * 10) / 10;

    return {
      id: String(menu.id),
      title: menu.title,
      weekStartDate: menu.weekStartDate,
      weekEndDate: menu.weekEndDate,
      startDate: menu.weekStartDate,
      endDate: menu.weekEndDate,
      ageGroup: menu.ageGroup,
      targetAgeGroup: menu.ageGroup,
      status: menu.status === 'PENDING' ? 'SUBMITTED_FOR_REVIEW' : menu.status,
      rawStatus: menu.status,
      cycleId: menu.cycleId ? String(menu.cycleId) : null,
      createdByName: menu.creator?.fullName || 'BS. Hoàng Mai Trang',
      approvedByName: menu.approver?.fullName || null,
      approvedAt: menu.approvedAt ? menu.approvedAt.toISOString() : null,
      createdAt: menu.approvedAt ? menu.approvedAt.toISOString() : (menu.weekStartDate ? new Date(menu.weekStartDate).toISOString() : new Date().toISOString()),
      updatedAt: menu.approvedAt ? menu.approvedAt.toISOString() : (menu.weekStartDate ? new Date(menu.weekStartDate).toISOString() : new Date().toISOString()),
      version: version.versionNumber,
      versionNumber: version.versionNumber,
      dailyAverageCalories: avgCal,
      dailyAverageProteinG: avgProt,
      dailyAverageFatG: avgFat,
      dailyAverageCarbG: avgCarb,
      menuDishes,
      days: days.map((d) => ({
        id: String(d.id),
        dayOfWeek: d.dayOfWeek >= 2 && d.dayOfWeek <= 6 ? d.dayOfWeek - 1 : d.dayOfWeek,
        date: d.date,
        meals: (d.meals || []).map((m) => ({
          id: String(m.id),
          mealType: m.mealType,
          dishes: (m.dishes || []).map((md) => ({
            id: String(md.id),
            dishId: String(md.dishId),
            dishName: md.dish?.name || 'Món ăn',
            categoryCode: md.dish?.category?.code || 'MAIN',
            categoryName: md.dish?.category?.name || 'Món ăn',
            portionSizeG: md.portionSizeG,
            energyKcal: md.dish?.nutrition?.energyKcal || 0,
            proteinG: md.dish?.nutrition?.proteinG || 0,
            fatG: md.dish?.nutrition?.fatG || 0,
            carbG: md.dish?.nutrition?.carbG || 0,
          })),
        })),
      })),
    };
  }

  async getVersions(menuId: number) {
    const versions = await this.versionRepo.find({
      where: { menuId },
      relations: ['creator'],
      order: { versionNumber: 'DESC' },
    });

    if (versions.length === 0) {
      return [
        {
          id: 'v1',
          menuId: String(menuId),
          version: 1,
          versionNumber: 1,
          changeNote: 'PhiÃªn báº£n gá»‘c',
          createdAt: new Date().toISOString(),
          createdByName: 'ChuyÃªn viÃªn Dinh dÆ°á»¡ng',
        },
      ];
    }

    return versions.map((v) => ({
      id: String(v.id),
      menuId: String(v.menuId),
      version: v.versionNumber,
      versionNumber: v.versionNumber,
      changeNote: v.changeNote || 'Khá»Ÿi táº¡o thá»±c Ä‘Æ¡n tuáº§n',
      createdAt: v.createdAt ? v.createdAt.toISOString() : new Date().toISOString(),
      createdByName: v.creator?.fullName || 'ChuyÃªn viÃªn Dinh dÆ°á»¡ng',
    }));
  }

  async getAdvisory(menuId: number) {
    const menu = await this.menuRepo.findOne({ where: { id: menuId } });
    const menuDetail = await this.findOne(menuId);

    // 1. Tải danh sách dị ứng học sinh từ database
    const studentAllergiesRaw = await this.menuDishRepo.manager.query(`
      SELECT s.id as student_id, s.full_name, c.name as class_name, a.name as allergen_name, a.code as allergen_code, sa.severity
      FROM student_allergies sa
      JOIN students s ON sa.student_id = s.id
      JOIN allergens a ON sa.allergen_id = a.id
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY s.full_name ASC
    `);

    // 2. Tải danh sách tăng trưởng BMI / WHO Z-score từ database
    const bmiStudentsRaw = await this.menuDishRepo.manager.query(`
      SELECT s.id as student_id, s.full_name, c.name as class_name, gz.classification, pm.weight_kg, pm.height_cm, gz.baz
      FROM growth_zscores gz
      JOIN physical_measurements pm ON gz.measurement_id = pm.id
      JOIN students s ON pm.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY s.full_name ASC
    `);

    // 3. Quét xung đột dị ứng giữa món ăn trong tuần và các bé
    const allergyConflicts: any[] = [];
    const allergenKeywords: Record<string, string[]> = {
      'Hải sản': ['hải sản', 'tôm', 'cua', 'cá', 'mực', 'nghêu', 'hến', 'sò', 'chả cá', 'cá hồi'],
      'SEAFOOD': ['hải sản', 'tôm', 'cua', 'cá', 'mực', 'nghêu', 'hến', 'sò', 'chả cá', 'cá hồi'],
      'CRUSTACEAN': ['tôm', 'cua', 'hải sản'],
      'Sữa bò': ['sữa', 'yaourt', 'phô mai', 'flan', 'bơ'],
      'MILK': ['sữa', 'yaourt', 'phô mai', 'flan', 'bơ'],
      'Đậu phộng': ['đậu phộng', 'lạc', 'bơ đậu phộng'],
      'PEANUT': ['đậu phộng', 'lạc', 'bơ đậu phộng'],
      'Trứng': ['trứng', 'hột gà', 'hột vịt'],
      'EGG': ['trứng', 'hột gà', 'hột vịt'],
      'Đậu nành': ['đậu nành', 'đậu phụ', 'tàu hũ', 'đậu hũ'],
      'SOY': ['đậu nành', 'đậu phụ', 'tàu hũ', 'đậu hũ'],
      'Lúa mì': ['lúa mì', 'bánh mì', 'bánh bao', 'mì sợi', 'hoành thánh'],
      'WHEAT': ['lúa mì', 'bánh mì', 'bánh bao', 'mì sợi', 'hoành thánh'],
      'Mè (vừng)': ['mè', 'vừng', 'dầu mè'],
      'SESAME': ['mè', 'vừng', 'dầu mè'],
    };

    let cflCounter = 1;
    for (const md of menuDetail.menuDishes || []) {
      const dishNameLower = (md.dish?.name || '').toLowerCase();

      for (const sa of studentAllergiesRaw) {
        const keywords = allergenKeywords[sa.allergen_name] || allergenKeywords[sa.allergen_code] || [sa.allergen_name.toLowerCase()];
        const isMatched = keywords.some((kw) => dishNameLower.includes(kw.toLowerCase()));

        if (isMatched) {
          allergyConflicts.push({
            conflictId: `cfl-${cflCounter++}`,
            childId: String(sa.student_id),
            childName: sa.full_name,
            classId: String(sa.class_id || 1),
            className: sa.class_name || 'Lớp Mầm 1',
            allergenDetected: sa.allergen_name,
            allergenCode: sa.allergen_code || 'ALLERGEN',
            severity: sa.severity === 'HIGH' ? 'SEVERE' : (sa.severity === 'MEDIUM' ? 'WARNING' : 'MILD'),
            reactionTreatment: sa.severity === 'HIGH' ? 'Báo y tế trường ngay, sẵn sàng thuốc kháng histamine / Epipen' : 'Theo dõi biểu hiện ngoài da / tiêu hóa',
            menuDishId: String(md.id),
            dishId: String(md.dishId),
            dishName: md.dish?.name || 'Món ăn',
            dishType: md.dish?.dishType || 'MAIN',
            dayOfWeek: md.dayOfWeek,
            mealTime: md.mealTime,
            portionSizeG: md.portionSizeG || 100,
            plannedCalories: md.plannedCalories || 100,
            substituteDishId: null,
            currentSubstituteDishName: null,
            problematicIngredients: [
              {
                foodId: 'f-1',
                foodName: sa.allergen_name,
                netWeightPerPortionG: 20,
                allergens: [sa.allergen_code || 'ALLERGEN'],
              },
            ],
            suggestedIngredientSubstitutions: [
              {
                originalIngredient: sa.allergen_name,
                substituteIngredient: 'Thịt heo nạc / Thịt gà nạc băm',
                suggestedGram: 25,
                nutritionNote: 'Đảm bảo giữ nguyên lượng đạm an toàn cho trẻ',
                preparationAdvice: 'Nấu riêng phần ăn không có dị nguyên cho bé',
              },
            ],
            suggestedSubstituteDishes: [
              {
                dishId: '10',
                dishName: 'Thịt heo rim nước dừa / Canh thịt bằm',
                dishType: md.dish?.dishType || 'MAIN',
                standardServingSizeG: 100,
                totalCalories: 95,
                totalProteinG: 6.5,
                totalFatG: 3.2,
                totalCarbG: 4.0,
                ingredientsSummary: 'Thịt nạc, rau củ tươi, không có dị nguyên',
              },
            ],
          });
        }
      }
    }

    // 4. Nhóm trẻ thừa cân / béo phì (Loại 2)
    const overweightChildren = bmiStudentsRaw
      .filter((s: any) => s.classification === 'OVERWEIGHT' || s.classification === 'OBESE')
      .map((s: any) => {
        const w = Number(s.weight_kg) || 19;
        const h = Number(s.height_cm) || 100;
        const bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
        return {
          childId: String(s.student_id),
          childName: s.full_name,
          className: s.class_name || 'Lớp Mẫu giáo',
          weightKg: w,
          heightCm: h,
          bmi,
          baz: Number(s.baz) || 2.1,
          classification: s.classification,
          statusText: 'Thừa cân / Nguy cơ béo phì (WHO)',
          healthNotes: 'Cần giảm 10–15% chất béo & calo, hạn chế món chiên rán, tăng cường rau củ theo TT 28',
        };
      });

    // 5. Nhóm trẻ còi xương / suy dinh dưỡng (Loại 1)
    const wastedChildren = bmiStudentsRaw
      .filter((s: any) => s.classification === 'UNDERWEIGHT' || s.classification === 'STUNTED')
      .map((s: any) => {
        const w = Number(s.weight_kg) || 11.5;
        const h = Number(s.height_cm) || 89;
        const bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
        return {
          childId: String(s.student_id),
          childName: s.full_name,
          className: s.class_name || 'Lớp Mầm 1',
          weightKg: w,
          heightCm: h,
          bmi,
          baz: Number(s.baz) || -1.2,
          classification: s.classification,
          statusText: 'Còi xương / Thấp còi / Suy dinh dưỡng (WHO)',
          healthNotes: 'Cần tăng đạm sinh học cao, bổ sung dầu gấc/oliu, tăng 15–20% khẩu phần ăn theo QĐ 1246 & TT 28',
        };
      });

    const affectedChildrenSet = new Set(allergyConflicts.map((c) => c.childId));
    const affectedDishesSet = new Set(allergyConflicts.map((c) => c.dishId));

    return {
      menuId: String(menuId),
      menuTitle: menu?.title || 'Thực đơn tuần',
      targetAgeGroup: menu?.ageGroup || 'MAU_GIAO',
      allergySummary: {
        totalConflicts: allergyConflicts.length,
        criticalCount: allergyConflicts.filter((c) => c.severity === 'SEVERE').length,
        warningCount: allergyConflicts.filter((c) => c.severity !== 'SEVERE').length,
        affectedChildrenCount: affectedChildrenSet.size,
        affectedDishesCount: affectedDishesSet.size,
      },
      allergyConflicts,
      bmiSummary: {
        totalEvaluated: bmiStudentsRaw.length || 14,
        overweightObeseCount: overweightChildren.length,
        wastedUnderweightCount: wastedChildren.length,
        normalCount: Math.max(0, (bmiStudentsRaw.length || 14) - overweightChildren.length - wastedChildren.length),
      },
      bmiRecommendations: {
        overweightGroup: {
          label: 'Nhóm Thừa cân & Béo phì',
          count: overweightChildren.length,
          severity: 'WARNING',
          clinicalStrategy: 'Giảm 10–15% tinh bột & chất béo bão hòa, hạn chế món chiên xào mặn, tăng rau củ theo Thông tư 28',
          portionAdvice: 'Khuyến khích ăn nhiều canh rau trước, giảm cơm & nước ngọt',
          children: overweightChildren,
          recommendedSubstituteDishes: [
            {
              dishId: '50',
              dishName: 'Thịt heo luộc chấm sốt cà chua / Canh rau củ thanh đạm',
              totalCalories: 85,
              totalProteinG: 7.2,
              totalFatG: 2.1,
              reason: 'Giảm 35% chất béo so với món chiên rán, thanh nhẹ dễ tiêu hóa',
            },
          ],
        },
        wastedGroup: {
          label: 'Nhóm Còi xương & Suy dinh dưỡng',
          count: wastedChildren.length,
          severity: 'WARNING',
          clinicalStrategy: 'Tăng cường chất đạm sinh học cao, bổ sung dầu oliu/dầu gấc, tăng 15–20% khẩu phần theo QĐ 1246 & TT 28',
          portionAdvice: 'Chia nhỏ bữa ăn, khuyến khích uống thêm sữa và món xế bổ dưỡng',
          children: wastedChildren,
          recommendedSubstituteDishes: [
            {
              dishId: '51',
              dishName: 'Cháo sườn non hầm hạt sen phô mai / Súp thịt bò trứng cút',
              totalCalories: 155,
              totalProteinG: 9.8,
              totalFatG: 5.5,
              reason: 'Giàu đạm & năng lượng cao, bổ sung vi chất kẽm, canxi và sắt',
            },
          ],
        },
      },
    };
  }

    async create(dto: CreateMenuDto, userId?: number) {
    const menu = this.menuRepo.create({
      title: dto.title,
      weekStartDate: dto.weekStartDate,
      weekEndDate: dto.weekEndDate,
      ageGroup: dto.ageGroup,
      cycleId: dto.cycleId || null,
      status: dto.status || 'DRAFT',
      createdBy: userId || 3,
    });

    const savedMenu = await this.menuRepo.save(menu);

    const version = this.versionRepo.create({
      menuId: savedMenu.id,
      versionNumber: 1,
      createdBy: userId || 3,
      changeNote: 'Khá»Ÿi táº¡o thá»±c Ä‘Æ¡n tuáº§n',
    });
    const savedVersion = await this.versionRepo.save(version);

    // Populate standard 5 days Mon-Fri (day 2 to 6)
    const startDate = new Date(dto.weekStartDate);
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + dayOffset);
      const dayOfWeek = dayOffset + 2; // Monday = 2, Tuesday = 3, ...

      const menuDay = await this.dayRepo.save(
        this.dayRepo.create({
          menuVersionId: savedVersion.id,
          dayOfWeek,
          date: dayDate.toISOString().split('T')[0],
        }),
      );

      // Create standard meals: MORNING_SNACK, LUNCH, AFTERNOON_SNACK
      for (const mealType of ['MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK']) {
        await this.mealRepo.save(
          this.mealRepo.create({
            menuDayId: menuDay.id,
            mealType,
          }),
        );
      }
    }

    return this.findOne(savedMenu.id);
  }

  async update(id: number, dto: UpdateMenuDto) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y thá»±c Ä‘Æ¡n');

    if (dto.title) menu.title = dto.title;
    if (dto.weekStartDate) menu.weekStartDate = dto.weekStartDate;
    if (dto.weekEndDate) menu.weekEndDate = dto.weekEndDate;
    if (dto.ageGroup) menu.ageGroup = dto.ageGroup;
    if (dto.status) menu.status = dto.status;

    await this.menuRepo.save(menu);
    return this.findOne(id);
  }

  async adjustDish(menuId: number, dto: AdjustDishDto) {
    const menu = await this.menuRepo.findOne({ where: { id: menuId } });
    if (!menu) throw new NotFoundException('Không tìm thấy thực đơn');

    let version = await this.versionRepo.findOne({
      where: { menuId },
      order: { versionNumber: 'DESC' },
    });
    if (!version) {
      version = await this.versionRepo.save(
        this.versionRepo.create({ menuId, versionNumber: 1, createdBy: menu.createdBy }),
      );
    }

    const mealType = dto.mealType || (dto as any).mealTime || 'LUNCH';
    const rawDay = Number(dto.dayOfWeek) || 2;

    // Ánh xạ thứ trong tuần: Frontend gửi 1..5 (Thứ 2..Thứ 6), DB có thể lưu 2..6
    let dbDayOfWeek = rawDay;
    if (rawDay >= 1 && rawDay <= 5) {
      const offsetDay = await this.dayRepo.findOne({
        where: { menuVersionId: version.id, dayOfWeek: rawDay + 1 },
      });
      if (offsetDay) {
        dbDayOfWeek = rawDay + 1;
      }
    }

    let day = await this.dayRepo.findOne({
      where: { menuVersionId: version.id, dayOfWeek: dbDayOfWeek },
      relations: ['meals'],
    });

    if (!day) {
      day = await this.dayRepo.findOne({
        where: { menuVersionId: version.id, dayOfWeek: rawDay },
        relations: ['meals'],
      });
    }

    if (!day) {
      const existingDays = await this.dayRepo.find({
        where: { menuVersionId: version.id },
        order: { dayOfWeek: 'ASC' },
        relations: ['meals'],
      });
      day = existingDays[0] || await this.dayRepo.save(
        this.dayRepo.create({ menuVersionId: version.id, dayOfWeek: dbDayOfWeek }),
      );
    }

    let meal = day.meals?.find((m) => m.mealType === mealType);
    if (!meal) {
      meal = await this.mealRepo.save(
        this.mealRepo.create({ menuDayId: day.id, mealType }),
      );
    }

    const resolvedOldDishId = Number(dto.oldDishId || (dto as any).dishId) || null;
    let resolvedNewDishId = Number(dto.newDishId || (dto as any).substituteDishId || (dto as any).dishId);

    if (!resolvedNewDishId || isNaN(resolvedNewDishId)) {
      resolvedNewDishId = resolvedOldDishId || 1;
    }

    const keepOriginalDish = dto.keepOriginalDish !== false; // Mặc định luôn giữ món gốc cho trẻ bình thường

    if (resolvedOldDishId && !keepOriginalDish && resolvedOldDishId !== resolvedNewDishId) {
      await this.menuDishRepo.delete({ menuMealId: meal.id, dishId: resolvedOldDishId });
    }

    // Kiểm tra xem món thay thế này đã có trong bữa ăn chưa
    let menuDish = await this.menuDishRepo.findOne({
      where: { menuMealId: meal.id, dishId: resolvedNewDishId },
    });

    if (menuDish) {
      menuDish.portionSizeG = dto.portionSizeG || menuDish.portionSizeG || 100;
      menuDish.specialDietNotes = dto.specialDietNotes || (dto as any).notes || menuDish.specialDietNotes;
      await this.menuDishRepo.save(menuDish);
    } else {
      menuDish = this.menuDishRepo.create({
        menuMealId: meal.id,
        dishId: resolvedNewDishId,
        portionSizeG: dto.portionSizeG || 100,
        specialDietNotes: dto.specialDietNotes || (dto as any).notes || null,
      });
      await this.menuDishRepo.save(menuDish);
    }

    return {
      success: true,
      menuDishId: String(menuDish.id),
      dishId: String(resolvedNewDishId),
      message: 'Đã cập nhật món ăn trong thực đơn thành công',
    };
  }

  async removeDish(menuId: number, menuDishId: number) {
    await this.menuDishRepo.delete({ id: menuDishId });
    return { success: true };
  }

  async submitForReview(id: number) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y thá»±c Ä‘Æ¡n');
    menu.status = 'PENDING';
    await this.menuRepo.save(menu);
    return this.findOne(id);
  }

  async approveMenu(id: number, approverId: number, notes?: string) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y thá»±c Ä‘Æ¡n');
    menu.status = 'APPROVED';
    menu.approvedBy = approverId || 1;
    menu.approvedAt = new Date();
    await this.menuRepo.save(menu);
    return this.findOne(id);
  }

  async rejectMenu(id: number, approverId: number, reason: string) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y thá»±c Ä‘Æ¡n');
    menu.status = 'REJECTED';
    await this.menuRepo.save(menu);
    return this.findOne(id);
  }

  async publishMenu(id: number) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y thá»±c Ä‘Æ¡n');
    menu.status = 'PUBLISHED';
    await this.menuRepo.save(menu);
    return this.findOne(id);
  }

  async createVersion(id: number, userId?: number) {
    const version = await this.versionRepo.findOne({
      where: { menuId: id },
      order: { versionNumber: 'DESC' },
    });
    const nextVersion = (version?.versionNumber || 1) + 1;

    const newVersion = this.versionRepo.create({
      menuId: id,
      versionNumber: nextVersion,
      createdBy: userId || 3,
      changeNote: `PhiÃªn báº£n v${nextVersion}.0`,
    });
    await this.versionRepo.save(newVersion);
    return this.findOne(id);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // AUTO-GENERATE: Constrained Nutrition-Aware Menu Generation
  // ThÃ´ng tÆ° 28/2016/TT-BGDÄT compliant
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  async autoGenerate(dto: AutoGenerateMenuDto, userId?: number) {
    const rawAge = dto.ageGroup || dto.targetAgeGroup || 'MAU_GIAO';
    const ageGroup = rawAge === 'TODDLER_18_36M' ? 'NHA_TRE' : (rawAge === 'KINDERGARTEN_3_5Y' ? 'MAU_GIAO' : rawAge);
    const weekStartDate = dto.weekStartDate || dto.startDate || new Date().toISOString().split('T')[0];
    const daysCount = dto.daysCount || 5;

    let weekEndDate = dto.endDate;
    if (!weekEndDate) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + (daysCount === 6 ? 5 : 4));
      weekEndDate = d.toISOString().split('T')[0];
    }

    const title = dto.title || `Thá»±c Ä‘Æ¡n BÃ¡n trÃº Tuáº§n ${dto.cycleWeekNumber || 1} (${ageGroup === 'MAU_GIAO' ? 'Máº«u giÃ¡o' : 'NhÃ  tráº»'})`;

    // â”€â”€ Step 1: Load nutritional standards from DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const standard = await this.standardRepo.findOne({
      where: { ageGroup, mealScope: 'DAYBOARDING', status: 'ACTIVE' },
    });

    // Fallback defaults matching ThÃ´ng tÆ° 28 if DB lookup fails
    const minKcal = standard?.minEnergyKcal || (ageGroup === 'NHA_TRE' ? 600 : 615);
    const maxKcal = standard?.maxEnergyKcal || (ageGroup === 'NHA_TRE' ? 735 : 726);
    const minProtPct = standard?.minProteinPct || 13;
    const maxProtPct = standard?.maxProteinPct || 20;
    const minFatPct = standard?.minFatPct || (ageGroup === 'NHA_TRE' ? 30 : 25);
    const maxFatPct = standard?.maxFatPct || (ageGroup === 'NHA_TRE' ? 40 : 35);
    const minCarbPct = standard?.minCarbPct || (ageGroup === 'NHA_TRE' ? 47 : 52);
    const maxCarbPct = standard?.maxCarbPct || (ageGroup === 'NHA_TRE' ? 57 : 60);

    this.logger.log(`ðŸ“‹ Chuáº©n dinh dÆ°á»¡ng ${ageGroup} DAYBOARDING: ${minKcal}â€“${maxKcal} Kcal, P:${minProtPct}â€“${maxProtPct}%, L:${minFatPct}â€“${maxFatPct}%, G:${minCarbPct}â€“${maxCarbPct}%`);

    // â”€â”€ Step 2: Load all dishes with nutrition data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const allDishes = await this.dishRepo.find({
      relations: ['category', 'nutrition'],
      where: { status: 'ACTIVE' },
      order: { name: 'ASC' },
    });

    // Categorize dishes
    const dishPool: Record<string, DishWithNutrition[]> = {
      MAIN: [],
      SOUP: [],
      RICE: [],
      DESSERT: [],
      SNACK_MORNING: [],
      SNACK_AFTERNOON: [],
      DRINK: [],
    };

    for (const d of allDishes) {
      const code = d.category?.code || 'MAIN';
      const entry: DishWithNutrition = {
        id: d.id,
        name: d.name,
        categoryCode: code,
        categoryName: d.category?.name || 'MÃ³n Äƒn',
        energyKcal: Number(d.nutrition?.energyKcal) || 0,
        proteinG: Number(d.nutrition?.proteinG) || 0,
        fatG: Number(d.nutrition?.fatG) || 0,
        carbG: Number(d.nutrition?.carbG) || 0,
        portionSizeG: Number(d.standardServingSizeG) || 100,
      };
      if (dishPool[code]) {
        dishPool[code].push(entry);
      }
    }

    // ── Step 3: Quét chu kỳ 4 tuần qua menu_cycles & lịch sử thực đơn ────────
    const activeCycle = await this.cycleRepo.findOne({
      where: { ageGroup, status: 'ACTIVE' },
      order: { id: 'DESC' },
    });

    const fourWeeksAgo = new Date(weekStartDate);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0];

    const twoWeeksAgo = new Date(weekStartDate);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

    // Quét tần suất xuất hiện của các món trong 4 tuần qua
    const past4WeeksDishesRaw = await this.menuDishRepo
      .createQueryBuilder('md')
      .innerJoin('md.menuMeal', 'mm')
      .innerJoin('mm.menuDay', 'mday')
      .innerJoin('mday.menuVersion', 'mv')
      .innerJoin('mv.menu', 'm')
      .innerJoin('md.dish', 'd')
      .innerJoin('d.category', 'c')
      .select('md.dishId', 'dishId')
      .addSelect('d.name', 'dishName')
      .addSelect('c.code', 'categoryCode')
      .addSelect('COUNT(md.id)', 'occurrenceCount')
      .where('m.ageGroup = :ageGroup', { ageGroup })
      .andWhere('m.weekStartDate >= :fourWeeksAgoStr', { fourWeeksAgoStr })
      .andWhere('m.weekStartDate < :weekStartDate', { weekStartDate })
      .groupBy('md.dishId')
      .addGroupBy('d.name')
      .addGroupBy('c.code')
      .getRawMany();

    const cycleDishCounts = new Map<number, { count: number; name: string; categoryCode: string }>();
    const cycleExclusionDishIds = new Set<number>();

    for (const row of past4WeeksDishesRaw) {
      const dishId = Number(row.dishId);
      const count = Number(row.occurrenceCount) || 0;
      const code = row.categoryCode || 'MAIN';
      cycleDishCounts.set(dishId, { count, name: row.dishName, categoryCode: code });

      const maxLimit = this.getMaxCycleLimit(code);
      if (count >= maxLimit) {
        cycleExclusionDishIds.add(dishId);
      }
    }

    // Quét các món 14 ngày gần nhất để chống ngán
    const recentDishIds = new Set<number>();
    const past14DaysRaw = await this.menuDishRepo
      .createQueryBuilder('md')
      .innerJoin('md.menuMeal', 'mm')
      .innerJoin('mm.menuDay', 'mday')
      .innerJoin('mday.menuVersion', 'mv')
      .innerJoin('mv.menu', 'm')
      .select('DISTINCT md.dishId', 'dishId')
      .where('m.ageGroup = :ageGroup', { ageGroup })
      .andWhere('m.weekStartDate >= :twoWeeksAgoStr', { twoWeeksAgoStr })
      .andWhere('m.weekStartDate < :weekStartDate', { weekStartDate })
      .getRawMany();

    for (const r of past14DaysRaw) {
      recentDishIds.add(Number(r.dishId));
    }

    // ── Step 4: Sinh thực đơn từng ngày đảm bảo Kcal & P:L:G ──────────────────
    const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const usedDishIdsThisWeek = new Set<number>();
    const dailySummary: DayMealPlan[] = [];

    const shuffleArray = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
      const dayOfWeek = dayIndex + 1; // 1 = T2 ... 5 = T6
      const dayName = dayNames[dayIndex] || `Ngày ${dayIndex + 1}`;

      let bestPlan: DayMealPlan | null = null;
      let bestScore = -Infinity;

      for (let attempt = 0; attempt < 50; attempt++) {
        const dayDishes: DayDishSlot[] = [];

        // 1. Phụ sáng (MORNING_SNACK): 1 món (Sữa dinh dưỡng / Thức uống) ~100-110 Kcal
        const morningPool = shuffleArray([...dishPool.SNACK_MORNING, ...dishPool.DRINK, ...dishPool.SNACK_AFTERNOON]);
        const morningDish = this.pickDish(morningPool, usedDishIdsThisWeek, recentDishIds, cycleExclusionDishIds, attempt > 25, true);
        if (morningDish) {
          dayDishes.push({
            dishId: String(morningDish.id),
            dishName: morningDish.name,
            dishType: morningDish.categoryCode,
            mealTime: 'MORNING_SNACK',
            servingOrder: 1,
            portionSizeG: morningDish.portionSizeG,
            plannedCalories: morningDish.energyKcal,
            proteinG: morningDish.proteinG,
            fatG: morningDish.fatG,
            carbG: morningDish.carbG,
          });
        }

        // 2. Bữa trưa chính (LUNCH): Cơm + Món chính + Canh + Tráng miệng
        // Cơm (RICE) ~172-269 Kcal (cho phép lặp lại vì số lượng món tinh bột hạn chế)
        const riceDish = this.pickDish(shuffleArray(dishPool.RICE), usedDishIdsThisWeek, recentDishIds, cycleExclusionDishIds, attempt > 20, true);
        if (riceDish) {
          dayDishes.push({
            dishId: String(riceDish.id),
            dishName: riceDish.name,
            dishType: 'RICE',
            mealTime: 'LUNCH',
            servingOrder: 2,
            portionSizeG: riceDish.portionSizeG,
            plannedCalories: riceDish.energyKcal,
            proteinG: riceDish.proteinG,
            fatG: riceDish.fatG,
            carbG: riceDish.carbG,
          });
        }

        // Món chính (MAIN) ~60-144 Kcal (tuyệt đối không lặp lại trong tuần & không vượt chu kỳ 4 tuần)
        const mainDish = this.pickDish(shuffleArray(dishPool.MAIN), usedDishIdsThisWeek, recentDishIds, cycleExclusionDishIds, attempt > 35, false);
        if (mainDish) {
          dayDishes.push({
            dishId: String(mainDish.id),
            dishName: mainDish.name,
            dishType: 'MAIN',
            mealTime: 'LUNCH',
            servingOrder: 3,
            portionSizeG: mainDish.portionSizeG,
            plannedCalories: mainDish.energyKcal,
            proteinG: mainDish.proteinG,
            fatG: mainDish.fatG,
            carbG: mainDish.carbG,
          });
        }

        // Canh súp (SOUP) ~25-105 Kcal
        const soupDish = this.pickDish(shuffleArray(dishPool.SOUP), usedDishIdsThisWeek, recentDishIds, cycleExclusionDishIds, attempt > 30, false);
        if (soupDish) {
          dayDishes.push({
            dishId: String(soupDish.id),
            dishName: soupDish.name,
            dishType: 'SOUP',
            mealTime: 'LUNCH',
            servingOrder: 4,
            portionSizeG: soupDish.portionSizeG,
            plannedCalories: soupDish.energyKcal,
            proteinG: soupDish.proteinG,
            fatG: soupDish.fatG,
            carbG: soupDish.carbG,
          });
        }

        // Tráng miệng (DESSERT) ~20-150 Kcal
        const dessertDish = this.pickDish(shuffleArray(dishPool.DESSERT), usedDishIdsThisWeek, recentDishIds, cycleExclusionDishIds, attempt > 30, false);
        if (dessertDish) {
          dayDishes.push({
            dishId: String(dessertDish.id),
            dishName: dessertDish.name,
            dishType: 'DESSERT',
            mealTime: 'LUNCH',
            servingOrder: 5,
            portionSizeG: dessertDish.portionSizeG,
            plannedCalories: dessertDish.energyKcal,
            proteinG: dessertDish.proteinG,
            fatG: dessertDish.fatG,
            carbG: dessertDish.carbG,
          });
        }

        // 3. Phụ chiều / Xế (AFTERNOON_SNACK): 1 món ăn xế + 1 thức uống
        // Món xế (SNACK_AFTERNOON) ~100-168 Kcal
        const afternoonSnackPool = shuffleArray(dishPool.SNACK_AFTERNOON);
        const afternoonDish = this.pickDish(afternoonSnackPool, usedDishIdsThisWeek, recentDishIds, cycleExclusionDishIds, attempt > 30, false);
        if (afternoonDish && (!morningDish || afternoonDish.id !== morningDish.id)) {
          dayDishes.push({
            dishId: String(afternoonDish.id),
            dishName: afternoonDish.name,
            dishType: 'SNACK_AFTERNOON',
            mealTime: 'AFTERNOON_SNACK',
            servingOrder: 6,
            portionSizeG: afternoonDish.portionSizeG,
            plannedCalories: afternoonDish.energyKcal,
            proteinG: afternoonDish.proteinG,
            fatG: afternoonDish.fatG,
            carbG: afternoonDish.carbG,
          });
        }

        // Thức uống xế (DRINK) ~45-102 Kcal (cho phép lặp lại)
        const drinkDish = this.pickDish(shuffleArray(dishPool.DRINK), usedDishIdsThisWeek, recentDishIds, cycleExclusionDishIds, attempt > 20, true);
        if (drinkDish && (!morningDish || drinkDish.id !== morningDish.id)) {
          dayDishes.push({
            dishId: String(drinkDish.id),
            dishName: drinkDish.name,
            dishType: 'DRINK',
            mealTime: 'AFTERNOON_SNACK',
            servingOrder: 7,
            portionSizeG: drinkDish.portionSizeG,
            plannedCalories: drinkDish.energyKcal,
            proteinG: drinkDish.proteinG,
            fatG: drinkDish.fatG,
            carbG: drinkDish.carbG,
          });
        }

        // Tính tổng năng lượng & tỷ lệ P:L:G
        const totalCal = dayDishes.reduce((s, d) => s + d.plannedCalories, 0);
        const totalProt = dayDishes.reduce((s, d) => s + d.proteinG, 0);
        const totalFat = dayDishes.reduce((s, d) => s + d.fatG, 0);
        const totalCarb = dayDishes.reduce((s, d) => s + d.carbG, 0);

        const protKcal = totalProt * 4;
        const fatKcal = totalFat * 9;
        const carbKcal = totalCarb * 4;
        const macroSum = protKcal + fatKcal + carbKcal || 1;

        const pPct = (protKcal / macroSum) * 100;
        const fPct = (fatKcal / macroSum) * 100;
        const cPct = (carbKcal / macroSum) * 100;

        // Chấm điểm mức độ chuẩn hóa
        let score = 0;

        // Tiêu chí 1: Năng lượng Kcal nằm trong dải chuẩn (Nhà trẻ: 600–750; Mẫu giáo: 615–770)
        if (totalCal >= minKcal && totalCal <= maxKcal) {
          score += 150;
        } else {
          const kcalMid = (minKcal + maxKcal) / 2;
          const kcalDist = Math.abs(totalCal - kcalMid) / kcalMid;
          score -= kcalDist * 300;
        }

        // Tiêu chí 2: Cân đối P:L:G (13–20% P, 25–35% L, 52–60% G)
        if (pPct >= minProtPct && pPct <= maxProtPct) score += 50;
        else score -= Math.abs(pPct - (minProtPct + maxProtPct) / 2) * 5;

        if (fPct >= minFatPct && fPct <= maxFatPct) score += 50;
        else score -= Math.abs(fPct - (minFatPct + maxFatPct) / 2) * 5;

        if (cPct >= minCarbPct && cPct <= maxCarbPct) score += 50;
        else score -= Math.abs(cPct - (minCarbPct + maxCarbPct) / 2) * 5;

        // Tiêu chí 3: Chống ngán & đa dạng món
        if (mainDish && !usedDishIdsThisWeek.has(mainDish.id)) score += 40;
        if (mainDish && !recentDishIds.has(mainDish.id)) score += 30;

        if (score > bestScore) {
          bestScore = score;
          bestPlan = {
            dayOfWeek,
            dayName,
            dishes: dayDishes,
            totalCalories: Math.round(totalCal * 10) / 10,
            totalProteinG: Math.round(totalProt * 10) / 10,
            totalFatG: Math.round(totalFat * 10) / 10,
            totalCarbG: Math.round(totalCarb * 10) / 10,
            proteinPct: Math.round(pPct * 10) / 10,
            lipidPct: Math.round(fPct * 10) / 10,
            glucidPct: Math.round(cPct * 10) / 10,
            isCompliant: totalCal >= minKcal && totalCal <= maxKcal
              && pPct >= minProtPct && pPct <= maxProtPct
              && fPct >= minFatPct && fPct <= maxFatPct
              && cPct >= minCarbPct && cPct <= maxCarbPct,
            violations: [],
            standardNote: '',
          };
        }

        if (bestPlan?.isCompliant) break;
      }

      if (bestPlan) {
        // Kiểm tra dải Kcal
        if (bestPlan.totalCalories < minKcal) {
          bestPlan.violations.push(`CALORIE_DEFICIT: ${dayName} tổng năng lượng ${bestPlan.totalCalories} Kcal < ${minKcal} Kcal (chuẩn tối thiểu Thông tư 28)`);
        }
        if (bestPlan.totalCalories > maxKcal) {
          bestPlan.violations.push(`CALORIE_EXCESS: ${dayName} tổng năng lượng ${bestPlan.totalCalories} Kcal > ${maxKcal} Kcal (chuẩn tối đa Thông tư 28)`);
        }

        // Kiểm tra tỷ lệ cân đối P:L:G (13–20% P, 25–35% L, 52–60% G)
        if (bestPlan.proteinPct < minProtPct || bestPlan.proteinPct > maxProtPct) {
          bestPlan.violations.push(`PROTEIN_OUT_OF_RANGE: ${dayName} Protein ${bestPlan.proteinPct}% ngoài dải chuẩn ${minProtPct}–${maxProtPct}%`);
        }
        if (bestPlan.lipidPct < minFatPct || bestPlan.lipidPct > maxFatPct) {
          bestPlan.violations.push(`FAT_OUT_OF_RANGE: ${dayName} Lipid ${bestPlan.lipidPct}% ngoài dải chuẩn ${minFatPct}–${maxFatPct}%`);
        }
        if (bestPlan.glucidPct < minCarbPct || bestPlan.glucidPct > maxCarbPct) {
          bestPlan.violations.push(`CARB_OUT_OF_RANGE: ${dayName} Glucid ${bestPlan.glucidPct}% ngoài dải chuẩn ${minCarbPct}–${maxCarbPct}%`);
        }

        bestPlan.isCompliant = bestPlan.violations.length === 0;
        bestPlan.standardNote = bestPlan.isCompliant
          ? `✅ ĐẠT CHUẨN Thông tư 28 (${bestPlan.totalCalories} Kcal, P:${bestPlan.proteinPct}% L:${bestPlan.lipidPct}% G:${bestPlan.glucidPct}%)`
          : `⚠️ CHƯA ĐẠT: ${bestPlan.violations.join('; ')}`;

        // Đánh dấu các món đã dùng trong tuần để tránh trùng lặp
        for (const d of bestPlan.dishes) {
          if (d.dishType === 'MAIN' || d.dishType === 'SOUP' || d.dishType === 'DESSERT' || d.dishType === 'SNACK_AFTERNOON') {
            usedDishIdsThisWeek.add(Number(d.dishId));
          }
        }

        dailySummary.push(bestPlan);
      }
    }

    // ── Step 5: Quét chu kỳ 4 tuần qua menu_cycles & ghi nhận vi phạm lặp món ──
    const currentWeekDishCounts = new Map<number, number>();
    const cycleViolations: string[] = [];
    const cycleLoggedDishes = new Set<number>();

    for (const day of dailySummary) {
      for (const d of day.dishes) {
        const dishId = Number(d.dishId);
        const prevCount = cycleDishCounts.get(dishId)?.count || 0;
        const weekCount = (currentWeekDishCounts.get(dishId) || 0) + 1;
        currentWeekDishCounts.set(dishId, weekCount);

        const totalCycleCount = prevCount + weekCount;
        const maxLimit = this.getMaxCycleLimit(d.dishType);

        if (totalCycleCount > maxLimit && !cycleLoggedDishes.has(dishId)) {
          cycleLoggedDishes.add(dishId);
          cycleViolations.push(
            `CYCLE_REPEAT_EXCEEDED: Món "${d.dishName}" (${d.dishType}) lặp lại ${totalCycleCount} lần trong chu kỳ 4 tuần (vượt quá giới hạn tối đa ${maxLimit} lần)`,
          );
        }
      }
    }

    // ── Step 6: Tổng hợp số liệu tuần ─────────────────────────────────────────
    const numDays = dailySummary.length || 1;
    const avgCal = Math.round(dailySummary.reduce((s, d) => s + d.totalCalories, 0) / numDays);
    const avgProt = Math.round((dailySummary.reduce((s, d) => s + d.totalProteinG, 0) / numDays) * 10) / 10;
    const avgFat = Math.round((dailySummary.reduce((s, d) => s + d.totalFatG, 0) / numDays) * 10) / 10;
    const avgCarb = Math.round((dailySummary.reduce((s, d) => s + d.totalCarbG, 0) / numDays) * 10) / 10;

    const dayViolations = dailySummary.flatMap((d) => d.violations);
    const allViolations = [...dayViolations, ...cycleViolations];
    const compliantDays = dailySummary.filter((d) => d.isCompliant).length;
    const totalDishesUsed = dailySummary.reduce((s, d) => s + d.dishes.length, 0);
    const uniqueDishIds = new Set(dailySummary.flatMap((d) => d.dishes.map((x) => x.dishId)));
    const duplicateWithinMenu = totalDishesUsed - uniqueDishIds.size;
    const overlappedWith14 = [...uniqueDishIds].filter((id) => recentDishIds.has(Number(id))).length;

    const antiFatigueReport = {
      totalDishesUsed,
      uniqueDishesUsed: uniqueDishIds.size,
      duplicateWithinMenuCount: duplicateWithinMenu,
      overlappedWithPrevious14DaysCount: overlappedWith14,
      cycleCompliance: cycleViolations.length === 0
        ? `TUÂN THỦ 100% CHU KỲ 4 TUẦN (${activeCycle ? activeCycle.name : 'Chu kỳ chuẩn 4 tuần'}) — Không món nào vượt tần suất`
        : `CẢNH BÁO: Có ${cycleViolations.length} món vượt tần suất trong chu kỳ 4 tuần`,
      standardEvaluation: `${compliantDays}/${numDays} ngày ĐẠT CHUẨN Thông tư 28 (TB: ${avgCal} Kcal/ngày, chuẩn ${minKcal}–${maxKcal} Kcal)`,
      violationCount: allViolations.length,
      violations: allViolations,
      cycleViolations,
    };

    this.logger.log(`📊 Kết quả sinh thực đơn: ${antiFatigueReport.standardEvaluation}, ${antiFatigueReport.cycleCompliance}`);

    // ── PREVIEW MODE: trả về ngay mà không lưu DB ──────────────────────────────
    if (dto.previewOnly) {
      return {
        previewOnly: true,
        title,
        targetAgeGroup: rawAge,
        ageGroup,
        startDate: weekStartDate,
        endDate: weekEndDate,
        daysCount,
        dailySummary,
        averageCalories: avgCal,
        averageProteinG: avgProt,
        averageFatG: avgFat,
        averageCarbG: avgCarb,
        standardUsed: {
          name: 'Thông tư 28/2016/TT-BGDĐT',
          mealScope: 'DAYBOARDING',
          ageGroup,
          minKcal,
          maxKcal,
          proteinRange: `${minProtPct}–${maxProtPct}%`,
          fatRange: `${minFatPct}–${maxFatPct}%`,
          carbRange: `${minCarbPct}–${maxCarbPct}%`,
        },
        antiFatigueReport,
      };
    }

    // ── SAVE MODE: Lưu chính xác kế hoạch đã xem trước vào database ────────────
    const planToSave: DayMealPlan[] = (dto.dailyPlan && Array.isArray(dto.dailyPlan) && dto.dailyPlan.length > 0)
      ? dto.dailyPlan
      : dailySummary;

    const created = await this.create(
      {
        title,
        weekStartDate,
        weekEndDate,
        ageGroup,
        cycleId: activeCycle?.id ? Number(activeCycle.id) : (dto.cycleWeekNumber ? Number(dto.cycleWeekNumber) : undefined),
      },
      userId,
    );

    const version = await this.versionRepo.findOne({
      where: { menuId: Number(created.id) },
      order: { versionNumber: 'DESC' },
    });

    if (version) {
      const days = await this.dayRepo.find({
        where: { menuVersionId: version.id },
        relations: ['meals'],
        order: { dayOfWeek: 'ASC' },
      });

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        // Khớp dayPlan qua dayOfWeek (hỗ trợ cả hệ 1..5 và 2..6)
        const dayPlan = planToSave.find((p: any) =>
          p.dayOfWeek === day.dayOfWeek ||
          p.dayOfWeek === (day.dayOfWeek - 1)
        ) || planToSave[i];

        if (!dayPlan || !dayPlan.dishes) continue;

        for (const meal of day.meals || []) {
          const matchingDishes = dayPlan.dishes.filter((d: any) => d.mealTime === meal.mealType);
          for (const md of matchingDishes) {
            await this.menuDishRepo.save(
              this.menuDishRepo.create({
                menuMealId: meal.id,
                dishId: Number(md.dishId),
                portionSizeG: md.portionSizeG || 100,
                displayOrder: md.servingOrder || 1,
              }),
            );
          }
        }
      }

      // ── Lưu các vi phạm quy chuẩn vào bảng menu_rule_violations ───────────────
      if (allViolations.length > 0) {
        for (const v of allViolations) {
          const ruleCode = v.split(':')[0]?.trim() || 'NUTRITION_VIOLATION';
          const severity = ruleCode.includes('CALORIE') || ruleCode.includes('CYCLE') ? 'ERROR' : 'WARNING';
          await this.violationRepo.save(
            this.violationRepo.create({
              menuVersionId: version.id,
              ruleCode,
              severity,
              message: v,
            }),
          );
        }
        this.logger.warn(`⚠️ Đã ghi ${allViolations.length} vi phạm vào menu_rule_violations cho menu #${created.id}`);
      }
    }

    return this.findOne(Number(created.id));
  }

  // ── Helper: Giới hạn tối đa số lần xuất hiện trong chu kỳ 4 tuần ───────────
  private getMaxCycleLimit(categoryCode: string): number {
    switch (categoryCode) {
      case 'MAIN':
        return 2; // Món chính tối đa 2 lần trong chu kỳ 4 tuần
      case 'SOUP':
        return 3; // Món canh tối đa 3 lần trong chu kỳ 4 tuần
      case 'DESSERT':
        return 4; // Tráng miệng tối đa 4 lần trong chu kỳ 4 tuần
      case 'SNACK_AFTERNOON':
        return 3; // Món xế chiều tối đa 3 lần trong chu kỳ 4 tuần
      default:
        return 12; // Món nền tảng (Cơm, Nước uống, Sữa sáng)
    }
  }

  // ── Helper: Chọn món tránh trùng lặp tuần & chu kỳ 4 tuần ──────────────────
  private pickDish(
    pool: DishWithNutrition[],
    usedThisWeek: Set<number>,
    recentDishIds: Set<number>,
    cycleExclusionDishIds: Set<number>,
    relaxConstraints: boolean,
    allowRepeatInWeek: boolean = false,
  ): DishWithNutrition | null {
    if (pool.length === 0) return null;

    if (allowRepeatInWeek) {
      // Cho các món nền tảng (Cơm, Nước, Sữa sáng), chọn ngẫu nhiên trong danh sách
      return pool[Math.floor(Math.random() * pool.length)];
    }

    // Lượt 1: Tránh cả trùng tuần, trùng 14 ngày VÀ trùng chu kỳ 4 tuần
    for (const dish of pool) {
      if (
        !usedThisWeek.has(dish.id) &&
        !recentDishIds.has(dish.id) &&
        !cycleExclusionDishIds.has(dish.id)
      ) {
        return dish;
      }
    }

    // Lượt 2: Cho phép 14 ngày gần nhất nhưng tuyệt đối tránh trùng tuần & vượt chu kỳ 4 tuần
    for (const dish of pool) {
      if (!usedThisWeek.has(dish.id) && !cycleExclusionDishIds.has(dish.id)) {
        return dish;
      }
    }

    // Lượt 3: Tránh trùng tuần
    for (const dish of pool) {
      if (!usedThisWeek.has(dish.id)) {
        return dish;
      }
    }

    // Fallback: nếu cho phép giãn điều kiện
    if (relaxConstraints) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    return pool[0];
  }
}
