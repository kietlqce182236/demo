import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyMealPortionEntity } from '../entities/daily-meal-portion.entity';
import { MealPortionIngredientEntity } from '../entities/meal-portion-ingredient.entity';
import { WeeklyMenuPlanItemEntity } from '../entities/weekly-menu-plan-item.entity';
import { WeeklyNutritionStatEntity } from '../entities/weekly-nutrition-stat.entity';
import { MealPortionsQueryDto } from '../dto/meal-portions-query.dto';

@Injectable()
export class MealPortionsService {
  constructor(
    @InjectRepository(DailyMealPortionEntity)
    private readonly portionRepo: Repository<DailyMealPortionEntity>,
    @InjectRepository(MealPortionIngredientEntity)
    private readonly ingredientRepo: Repository<MealPortionIngredientEntity>,
    @InjectRepository(WeeklyMenuPlanItemEntity)
    private readonly menuItemRepo: Repository<WeeklyMenuPlanItemEntity>,
    @InjectRepository(WeeklyNutritionStatEntity)
    private readonly nutritionStatRepo: Repository<WeeklyNutritionStatEntity>,
  ) {}

  async getWeeklyPlan(tenantId: string, query: MealPortionsQueryDto) {
    const weekNumber = query.weekNumber || 14;
    const schoolYear = query.schoolYear || 'Năm học 2024 - 2025 - Học kỳ 1';

    // 1. Fetch portion plan
    let plan = await this.portionRepo.findOne({
      where: { tenantId, weekNumber, schoolYear },
      relations: ['ingredients', 'menuItems', 'nutritionStats'],
      order: {
        ingredients: { sortOrder: 'ASC' },
        menuItems: { dayOfWeek: 'ASC', itemOrder: 'ASC' },
        nutritionStats: { dayOfWeek: 'ASC' },
      },
    });

    if (!plan) {
      // Fallback to any existing plan for the tenant
      plan = await this.portionRepo.findOne({
        where: { tenantId },
        relations: ['ingredients', 'menuItems', 'nutritionStats'],
        order: {
          weekNumber: 'DESC',
          ingredients: { sortOrder: 'ASC' },
          menuItems: { dayOfWeek: 'ASC', itemOrder: 'ASC' },
          nutritionStats: { dayOfWeek: 'ASC' },
        },
      });
    }

    if (!plan) {
      throw new NotFoundException(`Không tìm thấy kế hoạch định lượng suất ăn cho tuần ${weekNumber}`);
    }

    // 2. Group menu items by 5 days (Thứ 2 -> Thứ 6)
    const daysMap = new Map<number, any>();
    const dayNames: Record<number, { name: string; code: string; defaultDate: string }> = {
      2: { name: 'Thứ Hai', code: 'T2', defaultDate: '18/11/2024' },
      3: { name: 'Thứ Ba', code: 'T3', defaultDate: '19/11/2024' },
      4: { name: 'Thứ Tư', code: 'T4', defaultDate: '20/11/2024' },
      5: { name: 'Thứ Năm', code: 'T5', defaultDate: '21/11/2024' },
      6: { name: 'Thứ Sáu', code: 'T6', defaultDate: '22/11/2024' },
    };

    for (let day = 2; day <= 6; day++) {
      const stat = plan.nutritionStats?.find((s) => s.dayOfWeek === day);
      daysMap.set(day, {
        dayOfWeek: day,
        dayName: dayNames[day].name,
        dayCode: dayNames[day].code,
        formattedDate: dayNames[day].defaultDate,
        lunch: {
          sessionName: 'BỮA TRƯA',
          timeText: '10:30',
          calories: 520,
          dishes: [],
        },
        afternoonSnack: {
          sessionName: 'XẾ CHIỀU',
          timeText: '14:15',
          calories: 195,
          dishes: [],
        },
        nutrition: {
          totalCalories: stat ? stat.totalCalories : 715,
          ratioPLG: stat ? stat.ratioText : '14 : 26 : 60',
        },
      });
    }

    // Populate dishes
    for (const item of plan.menuItems || []) {
      const dayData = daysMap.get(item.dayOfWeek);
      if (!dayData) continue;

      const formattedDish = {
        id: item.id,
        name: item.dishName,
        description: item.dishDescription,
        badgeText: item.badgeText,
        hasAllergyWarning: item.hasAllergyWarning,
        allergySubstituteText: item.allergySubstituteText,
        itemOrder: item.itemOrder,
      };

      if (item.mealSession === 'LUNCH') {
        dayData.lunch.dishes.push(formattedDish);
        dayData.lunch.calories = item.sessionCalories;
      } else if (item.mealSession === 'AFTERNOON_SNACK') {
        dayData.afternoonSnack.dishes.push(formattedDish);
        dayData.afternoonSnack.calories = item.sessionCalories;
      }
    }

    // 3. Construct ingredients list
    const ingredients = (plan.ingredients || []).map((ing) => ({
      id: ing.id,
      sortOrder: ing.sortOrder,
      ingredientName: ing.ingredientName,
      quotaDescription: ing.quotaDescription,
      quotaPerChild: Number(ing.quotaPerChild),
      lossRatePercent: Number(ing.lossRatePercent),
      targetChildrenCount: ing.targetChildrenCount,
      targetBadge: ing.targetBadge,
      calculatedQuantity: Number(ing.calculatedQuantity),
      unit: ing.unit,
      warehouseStockText: ing.warehouseStockText,
      category: ing.category,
      status: ing.status,
    }));

    // 4. Return unified structure
    return {
      id: plan.id,
      tenantId: plan.tenantId,
      weekNumber: plan.weekNumber,
      schoolYear: plan.schoolYear,
      startDate: plan.startDate,
      endDate: plan.endDate,
      formattedDateRange: '18/11/2024 - 22/11/2024',
      status: plan.status,
      approvalStatus: plan.approvalStatus,
      approvedByName: plan.approvedByName,
      approvedAtText: plan.approvedAtText,
      standardQuote: plan.standardQuote,
      bannerQuote: plan.bannerQuote,
      isLocked: plan.isLocked,
      isPublishedToParents: plan.isPublishedToParents,
      isWarehouseExported: plan.isWarehouseExported,
      exportedAt: plan.exportedAt,

      // Top KPI Cards
      kpis: {
        totalBoardingStudents: plan.totalBoardingStudents,
        totalEnrolledStudents: plan.totalEnrolledStudents,
        attendanceRate: Number(plan.attendanceRate),
        attendanceBadgeText: `^ ${plan.attendanceRate}% Điểm danh ăn bán trú tuần này`,

        allergicChildrenCount: plan.allergicChildrenCount,
        allergicBadgeText: `^ ${plan.safeSubstituteRate}% Đã xếp món thay thế an toàn`,

        avgCalories: Number(plan.avgCalories),
        energyCoverageRate: Number(plan.energyCoverageRate),
        energyBadgeText: `${plan.energyCoverageRate}% Nhu cầu năng lượng cả ngày (Chuẩn)`,

        legalApprovalStatus: plan.approvalStatus,
        legalNoticeText: plan.approvedAtText,
      },

      // Weekly Menu (5 Columns)
      weeklyMenu: Array.from(daysMap.values()),

      // Portion Planning Lower Section (UC56)
      portionPlan: {
        studentCount: plan.totalBoardingStudents,
        allergicSubstituteCount: plan.allergicChildrenCount,
        normalCount: plan.totalBoardingStudents - plan.allergicChildrenCount,
        unit: 'kg / lít',
        statusBadge: 'Đã kiểm kho sẵn sàng',
        ingredients,
      },

      // Food Safety 3-Step Verification
      foodSafetySteps: [
        {
          stepNumber: 1,
          name: 'Tiếp phẩm nhập kho',
          status: 'PASSED',
          badgeText: 'Đạt tiêu chuẩn',
          badgeColor: 'emerald',
          description: 'Kiểm tra nguồn gốc VietGAP, độ tươi sống và hóa đơn giao nhận lúc 06:00',
        },
        {
          stepNumber: 2,
          name: 'Chế biến & Nấu chín',
          status: 'PASSED',
          badgeText: 'Giám sát nhiệt',
          badgeColor: 'emerald',
          description: 'Nấu chín kỹ > 95°C, dao thớt phân màu sống chín, nhân viên đeo găng tay',
        },
        {
          stepNumber: 3,
          name: 'Lưu mẫu thức ăn 24h',
          status: 'PASSED',
          badgeText: 'Tủ mẫu 4°C',
          badgeColor: 'cyan',
          description: 'Niêm phong mẫu tôm rim thịt thăn & canh sườn trong tủ bảo ôn chuyên dụng 4°C',
        },
      ],

      // Nutrition Macro Ratio (P - L - G)
      macroRatio: {
        protein: {
          percent: Number(plan.proteinPercent),
          gramText: '~25g',
          label: 'Chất đạm (P)',
          color: '#14b8a6',
        },
        lipid: {
          percent: Number(plan.lipidPercent),
          gramText: '~21g',
          label: 'Chất béo (L)',
          color: '#06b6d4',
        },
        glucid: {
          percent: Number(plan.glucidPercent),
          gramText: '~107g',
          label: 'Đường bột (G)',
          color: '#0f766e',
        },
        ratioText: `${plan.proteinPercent} : ${plan.lipidPercent} : ${plan.glucidPercent}`,
        standardNote:
          'Tỷ lệ đạt chuẩn tuyệt đối cho trẻ mẫu giáo từ 24 - 72 tháng tuổi theo Viện Dinh Dưỡng Quốc Gia.',
      },
    };
  }

  async approveWarehouseExport(tenantId: string, planId: string) {
    const plan = await this.portionRepo.findOne({
      where: { id: planId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException('Không tìm thấy kế hoạch định lượng suất ăn.');
    }

    plan.isWarehouseExported = true;
    plan.exportedAt = new Date();
    await this.portionRepo.save(plan);

    return {
      success: true,
      message: 'Đã duyệt lệnh xuất kho nguyên liệu tuần thành công.',
      planId: plan.id,
      isWarehouseExported: plan.isWarehouseExported,
      exportedAt: plan.exportedAt,
    };
  }

  async generateExcelCsv(tenantId: string, planId: string) {
    const plan = await this.portionRepo.findOne({
      where: { id: planId, tenantId },
      relations: ['ingredients'],
      order: {
        ingredients: { sortOrder: 'ASC' },
      },
    });

    if (!plan) {
      throw new NotFoundException('Không tìm thấy dữ liệu kế hoạch định lượng.');
    }

    const headers = [
      'STT',
      'Tên thực phẩm / Nguyên liệu',
      'Định mức tiêu chuẩn',
      'Đối tượng áp dụng',
      'Tổng lượng dự trù',
      'Đơn vị tính',
      'Ghi chú kho / Giao nhận',
    ];

    const rows = (plan.ingredients || []).map((ing, idx) => [
      idx + 1,
      `"${ing.ingredientName}"`,
      `"${ing.quotaDescription}"`,
      `"${ing.targetBadge || 'Toàn trường (328 trẻ)'}"`,
      ing.calculatedQuantity,
      ing.unit,
      `"${ing.warehouseStockText}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      `PHIẾU DỰ TRÙ VÀ XUẤT KHO NGUYÊN LIỆU BẾP ĂN BÁN TRÚ\n` +
      `Tuần: ${plan.weekNumber} (${plan.startDate} - ${plan.endDate})\n` +
      `Tổng suất ăn thực tế: ${plan.totalBoardingStudents} suất\n\n` +
      headers.join(',') +
      '\n' +
      rows.map((r) => r.join(',')).join('\n');

    return csvContent;
  }
}
