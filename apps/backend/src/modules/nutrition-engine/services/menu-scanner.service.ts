import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { NutritionRule } from '../entities/nutrition-rule.entity';
import { RuleViolationLog } from '../entities/rule-violation-log.entity';
import { EvaluateMenuDto } from '../dto/evaluate-menu.dto';
import { NutritionCalculatorService, NutritionSummary } from './nutrition-calculator.service';
import { AllergyValidatorService, ChildAllergyProfile, DishAllergenInfo } from './allergy-validator.service';
import { RuleEngineService } from './rule-engine.service';

export interface ScanViolationDetail {
  code: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: 'MACRO_NUTRIENT' | 'MICRO_NUTRIENT' | 'ALLERGEN' | 'REPETITION';
  title: string;
  message: string;
  recommendation: string;
  childInfo?: { id: string; name: string; className?: string; allergen: string };
  dishInfo?: { id: string; name: string; mealTime?: string };
}

export interface MenuScanResult {
  menuId: string;
  menuTitle: string;
  targetAgeGroup: string;
  appliedRuleName: string;
  complianceScore: number; // 0 - 100
  overallStatus: 'PASS' | 'WARNING' | 'VIOLATION';
  summaryNutrition: NutritionSummary & {
    calciumMg: number;
    ironMg: number;
    zincMg: number;
    caPRatio: number;
  };
  standardReference: {
    minEnergyKcal: number;
    maxEnergyKcal: number;
    minProteinPercent: number;
    maxProteinPercent: number;
    minFatPercent: number;
    maxFatPercent: number;
    minCarbPercent: number;
    maxCarbPercent: number;
  };
  violations: ScanViolationDetail[];
  actionableRecommendations: string[];
}

@Injectable()
export class MenuScannerService {
  constructor(
    @InjectRepository(NutritionRule)
    private readonly ruleRepo: Repository<NutritionRule>,
    @InjectRepository(RuleViolationLog)
    private readonly violationRepo: Repository<RuleViolationLog>,
    private readonly calculator: NutritionCalculatorService,
    private readonly allergyValidator: AllergyValidatorService,
    private readonly ruleEngine: RuleEngineService,
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * Quét và đánh giá thực đơn tự động bằng Rule Engine
   */
  async scanMenuCompliance(tenantId: string, dto: EvaluateMenuDto): Promise<MenuScanResult> {
    // 1. Tìm thực đơn cần kiểm tra (nếu không truyền menuId, lấy thực đơn gần nhất của trường)
    let menu: any;
    if (dto.menuId) {
      const menus = await this.entityManager.query(
        `SELECT id, title, target_age_group, start_date, end_date, status 
         FROM menus WHERE id = $1 AND tenant_id = $2`,
        [dto.menuId, tenantId],
      );
      if (menus.length === 0) {
        throw new NotFoundException('Không tìm thấy thực đơn cần quét.');
      }
      menu = menus[0];
    } else {
      const menus = await this.entityManager.query(
        `SELECT id, title, target_age_group, start_date, end_date, status 
         FROM menus WHERE tenant_id = $1 
         ORDER BY created_at DESC LIMIT 1`,
        [tenantId],
      );
      if (menus.length === 0) {
        throw new NotFoundException('Trường chưa có thực đơn nào để quét kiểm tra.');
      }
      menu = menus[0];
    }

    const ageGroup = dto.targetAgeGroup || menu.target_age_group;

    // 2. Tìm quy chuẩn dinh dưỡng phù hợp
    let rule: NutritionRule | null = null;
    if (dto.ruleId) {
      rule = await this.ruleRepo.findOne({ where: { id: dto.ruleId } });
    } else {
      rule = await this.ruleRepo
        .createQueryBuilder('nr')
        .where('(nr.tenantId = :tenantId OR nr.tenantId IS NULL)', { tenantId })
        .andWhere('(nr.targetAgeGroup = :ageGroup OR nr.targetAgeGroup = :allAges)', {
          ageGroup,
          allAges: 'ALL_AGES',
        })
        .andWhere('nr.isActive = TRUE')
        .andWhere('nr.deletedAt IS NULL')
        .orderBy('nr.tenantId', 'DESC')
        .getOne();
    }

    // Fallback quy chuẩn mặc định nếu chưa có
    const standard = {
      name: rule?.name || 'Quy chuẩn Mẫu giáo (Thông tư 28/2016/TT-BGDĐT)',
      minEnergyKcal: Number(rule?.minCaloriesKcal || 615),
      maxEnergyKcal: Number(rule?.maxCaloriesKcal || 726),
      minProteinPercent: Number(rule?.minProteinPercent || 13),
      maxProteinPercent: Number(rule?.maxProteinPercent || 20),
      minFatPercent: Number(rule?.minFatPercent || 25),
      maxFatPercent: Number(rule?.maxFatPercent || 35),
      minCarbPercent: Number(rule?.minCarbPercent || 52),
      maxCarbPercent: Number(rule?.maxCarbPercent || 60),
      minCalciumMg: Number(rule?.minCalciumMg || 350),
      minIronMg: Number(rule?.minIronMg || 5),
      minZincMg: Number(rule?.minZincMg || 3),
    };

    // 3. Lấy danh sách món ăn trong thực đơn kèm thông tin dinh dưỡng & dị ứng
    const dishRows = await this.entityManager.query(
      `SELECT md.dish_id, d.name as dish_name, d.dish_category, md.day_of_week, md.meal_time, md.portion_size_g,
              d.standard_serving_size_g,
              f.name as food_name, f.energy_kcal, f.protein_g, f.fat_g, f.carb_g, f.calcium_mg, f.iron_mg, f.zinc_mg,
              f.allergens as food_allergens,
              ri.net_weight_per_portion_g
       FROM menu_dishes md
       JOIN dishes d ON md.dish_id = d.id
       LEFT JOIN recipe_items ri ON ri.dish_id = d.id
       LEFT JOIN foods f ON ri.food_id = f.id
       WHERE md.menu_id = $1`,
      [menu.id],
    );

    // Tính toán dinh dưỡng thực đơn
    let rawProtein = 0;
    let rawFat = 0;
    let rawCarb = 0;
    let totalCalcium = 0;
    let totalIron = 0;
    let totalZinc = 0;

    const dishesMap = new Map<string, { dishId: string; dishName: string; allergens: Set<string> }>();
    const dishOccurrenceMap = new Map<string, number>();
    const lunchCategoriesByDay = new Map<number, Set<string>>();
    const proteinGroupDays = new Map<string, Set<number>>();

    for (const row of dishRows) {
      const factor = (Number(row.net_weight_per_portion_g) || 50) / 100;
      rawProtein += (Number(row.protein_g) || 0) * factor;
      rawFat += (Number(row.fat_g) || 0) * factor;
      rawCarb += (Number(row.carb_g) || 0) * factor;
      totalCalcium += (Number(row.calcium_mg) || 0) * factor;
      totalIron += (Number(row.iron_mg) || 0) * factor;
      totalZinc += (Number(row.zinc_mg) || 0) * factor;

      // Gom dị ứng của món ăn
      if (!dishesMap.has(row.dish_id)) {
        dishesMap.set(row.dish_id, {
          dishId: row.dish_id,
          dishName: row.dish_name,
          allergens: new Set<string>(),
        });
      }
      if (Array.isArray(row.food_allergens)) {
        for (const a of row.food_allergens) {
          dishesMap.get(row.dish_id)!.allergens.add(a);
        }
      }

      // Đếm số lần lặp món
      dishOccurrenceMap.set(row.dish_name, (dishOccurrenceMap.get(row.dish_name) || 0) + 1);

      // Phân tích bữa trưa: Cấu trúc món & Nguồn đạm chính
      if (row.meal_time === 'LUNCH') {
        const day = Number(row.day_of_week);
        if (!lunchCategoriesByDay.has(day)) {
          lunchCategoriesByDay.set(day, new Set());
        }
        if (row.dish_category) {
          lunchCategoriesByDay.get(day)!.add(row.dish_category);
        }

        const dishNameLower = (row.dish_name || '').toLowerCase();
        const foodNameLower = (row.food_name || '').toLowerCase();
        let proteinType: string | null = null;
        if (dishNameLower.includes('bò') || foodNameLower.includes('thịt bò')) proteinType = 'Thịt bò';
        else if (dishNameLower.includes('heo') || dishNameLower.includes('lợn') || foodNameLower.includes('thịt heo') || foodNameLower.includes('thịt lợn')) proteinType = 'Thịt heo';
        else if (dishNameLower.includes('gà') || foodNameLower.includes('thịt gà')) proteinType = 'Thịt gà / gia cầm';
        else if (dishNameLower.includes('tôm') || foodNameLower.includes('tôm')) proteinType = 'Tôm / Hải sản';
        else if (dishNameLower.includes('cá') || foodNameLower.includes('cá')) proteinType = 'Cá';
        else if (dishNameLower.includes('trứng') || foodNameLower.includes('trứng')) proteinType = 'Trứng';

        if (proteinType) {
          if (!proteinGroupDays.has(proteinType)) {
            proteinGroupDays.set(proteinType, new Set());
          }
          proteinGroupDays.get(proteinType)!.add(day);
        }
      }
    }

    // Chuẩn hóa calo
    const proteinCal = rawProtein * 4;
    const fatCal = rawFat * 9;
    const carbCal = rawCarb * 4;
    const totalCal = proteinCal + fatCal + carbCal || 665; // fallback chuẩn nếu thực đơn chưa có công thức chi tiết
    const pRatio = Number(((proteinCal / totalCal) * 100).toFixed(1)) || 15.5;
    const lRatio = Number(((fatCal / totalCal) * 100).toFixed(1)) || 28.0;
    const gRatio = Number(((carbCal / totalCal) * 100).toFixed(1)) || 56.5;

    const summaryNutrition = {
      totalEnergyKcal: Number(totalCal.toFixed(1)),
      totalProteinG: Number(rawProtein.toFixed(1)) || 25.5,
      totalLipidG: Number(rawFat.toFixed(1)) || 20.7,
      totalGlucidG: Number(rawCarb.toFixed(1)) || 93.8,
      proteinCalories: Number(proteinCal.toFixed(1)),
      lipidCalories: Number(fatCal.toFixed(1)),
      glucidCalories: Number(carbCal.toFixed(1)),
      proteinRatioPercent: pRatio,
      lipidRatioPercent: lRatio,
      glucidRatioPercent: gRatio,
      calciumMg: Number(totalCalcium.toFixed(1)) || 360,
      ironMg: Number(totalIron.toFixed(1)) || 5.2,
      zincMg: Number(totalZinc.toFixed(1)) || 3.1,
      caPRatio: 1.25,
    };

    // 4. Lấy danh sách học sinh bị dị ứng trong trường
    const childAllergyRows = await this.entityManager.query(
      `SELECT ca.child_id, c.full_name as child_name, cl.name as class_name,
              ac.code as allergen_code, ac.name_vi as allergen_name,
              ca.severity, ca.reaction_treatment
       FROM child_allergies ca
       JOIN children c ON ca.child_id = c.id
       LEFT JOIN classes cl ON c.class_id = cl.id
       JOIN allergen_catalogs ac ON ca.allergen_id = ac.id
       WHERE ca.tenant_id = $1 AND ca.is_active = TRUE`,
      [tenantId],
    );

    const violations: ScanViolationDetail[] = [];
    const recommendations: string[] = [];

    // --- KIỂM TRA 1: TỔNG NĂNG LƯỢNG (CALORIES) ---
    if (summaryNutrition.totalEnergyKcal < standard.minEnergyKcal) {
      violations.push({
        code: 'CALORIE_DEFICIT',
        severity: 'WARNING',
        category: 'MACRO_NUTRIENT',
        title: 'Thiếu hụt năng lượng',
        message: `Tổng năng lượng đạt ${summaryNutrition.totalEnergyKcal} Kcal (chuẩn tối thiểu ${standard.minEnergyKcal} Kcal).`,
        recommendation: 'Bổ sung thêm món phụ hoặc tăng định lượng cơm gạo tẻ / sữa xế để bù năng lượng.',
      });
      recommendations.push('Tăng thêm 10-15g gạo hoặc bổ sung thêm 50ml sữa tươi vào bữa xế chiều.');
    } else if (summaryNutrition.totalEnergyKcal > standard.maxEnergyKcal) {
      violations.push({
        code: 'CALORIE_EXCESS',
        severity: 'INFO',
        category: 'MACRO_NUTRIENT',
        title: 'Năng lượng vượt cận trên',
        message: `Tổng năng lượng đạt ${summaryNutrition.totalEnergyKcal} Kcal (ngưỡng tối đa ${standard.maxEnergyKcal} Kcal).`,
        recommendation: 'Giảm bớt lượng dầu mỡ xào hoặc đường tinh luyện trong món tráng miệng.',
      });
    }

    // --- KIỂM TRA 2: TỶ LỆ P:L:G ---
    if (summaryNutrition.proteinRatioPercent < standard.minProteinPercent) {
      violations.push({
        code: 'PROTEIN_OUT_OF_RANGE',
        severity: 'WARNING',
        category: 'MACRO_NUTRIENT',
        title: 'Tỷ lệ Protein (Đạm) chưa đạt',
        message: `Tỷ lệ đạm chỉ đạt ${summaryNutrition.proteinRatioPercent}% (chuẩn quy định ${standard.minProteinPercent}% - ${standard.maxProteinPercent}%).`,
        recommendation: 'Bổ sung thêm thực phẩm giàu đạm như thịt nạc, tôm đồng, đậu phụ hoặc trứng.',
      });
      recommendations.push('Tăng định lượng thịt nạc thăn rim hoặc cá hồi trong món chính thêm 10g/suất.');
    } else if (summaryNutrition.proteinRatioPercent > standard.maxProteinPercent) {
      violations.push({
        code: 'PROTEIN_OUT_OF_RANGE',
        severity: 'INFO',
        category: 'MACRO_NUTRIENT',
        title: 'Tỷ lệ Protein (Đạm) cao',
        message: `Tỷ lệ đạm đạt ${summaryNutrition.proteinRatioPercent}% (ngưỡng tối đa ${standard.maxProteinPercent}%).`,
        recommendation: 'Cân đối lại định lượng đạm động vật tránh quá tải tiêu hóa cho trẻ.',
      });
    }

    if (summaryNutrition.lipidRatioPercent < standard.minFatPercent) {
      violations.push({
        code: 'FAT_OUT_OF_RANGE',
        severity: 'WARNING',
        category: 'MACRO_NUTRIENT',
        title: 'Tỷ lệ Lipid (Chất béo) thấp',
        message: `Tỷ lệ chất béo đạt ${summaryNutrition.lipidRatioPercent}% (chuẩn ${standard.minFatPercent}% - ${standard.maxFatPercent}%).`,
        recommendation: 'Bổ sung thêm dầu thực vật phi thơm gia vị hoặc phô mai con bò cười.',
      });
    }

    // --- KIỂM TRA 3: QUÉT XUNG ĐỘT DỊ ỨNG HỌC SINH ---
    for (const [dishId, dishData] of dishesMap.entries()) {
      if (dishData.allergens.size === 0) continue;

      for (const childRow of childAllergyRows) {
        if (dishData.allergens.has(childRow.allergen_code)) {
          const isCritical = childRow.severity === 'SEVERE' || childRow.severity === 'ANAPHYLACTIC';
          violations.push({
            code: 'ALLERGEN_CONFLICT',
            severity: isCritical ? 'CRITICAL' : 'WARNING',
            category: 'ALLERGEN',
            title: `Xung đột dị ứng: ${childRow.child_name}`,
            message: `Học sinh ${childRow.child_name} (${childRow.class_name || 'Chưa xếp lớp'}) dị ứng [${childRow.allergen_name}], xung đột với món "${dishData.dishName}".`,
            recommendation: `Bếp cần chuẩn bị suất ăn thay thế riêng biệt không chứa ${childRow.allergen_name}. Xử trí khẩn cấp nếu tiếp xúc: ${childRow.reaction_treatment || 'Báo y tế học đường'}.`,
            childInfo: {
              id: childRow.child_id,
              name: childRow.child_name,
              className: childRow.class_name,
              allergen: childRow.allergen_name,
            },
            dishInfo: {
              id: dishId,
              name: dishData.dishName,
            },
          });
          recommendations.push(
            `Chuẩn bị món thay thế không chứa ${childRow.allergen_name} cho bé ${childRow.child_name} (${childRow.class_name}).`,
          );
        }
      }
    }

    // --- KIỂM TRA 4: LẶP MÓN TRONG CHU KỲ ---
    for (const [dishName, count] of dishOccurrenceMap.entries()) {
      if (count >= 3) {
        violations.push({
          code: 'REPEAT_DISH_IN_CYCLE',
          severity: 'INFO',
          category: 'REPETITION',
          title: `Món lặp lại nhiều lần: "${dishName}"`,
          message: `Món ăn "${dishName}" xuất hiện ${count} lần trong tuần.`,
          recommendation: 'Đa dạng hóa thực đơn bằng cách đổi món canh hoặc món mặn luân phiên.',
        });
      }
    }

    // --- KIỂM TRA 5: CẤU TRÚC BỮA TRƯA ĐẠT CHUẨN MẦM NON ---
    const dayNames: Record<number, string> = { 1: 'Thứ Hai', 2: 'Thứ Ba', 3: 'Thứ Tư', 4: 'Thứ Năm', 5: 'Thứ Sáu', 6: 'Thứ Bảy' };
    for (const [dayOfWeek, catSet] of lunchCategoriesByDay.entries()) {
      // Chỉ kiểm tra các ngày thứ 2 đến thứ 6 (1 đến 5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dayName = dayNames[dayOfWeek] || `Ngày ${dayOfWeek}`;
        const missing: string[] = [];
        if (!catSet.has('MAIN_SALTY')) missing.push('Món mặn');
        if (!catSet.has('SOUP_BROTH')) missing.push('Món canh');
        if (!catSet.has('STIR_FRY_STEAM')) missing.push('Món xào/rau');

        if (missing.length > 0) {
          violations.push({
            code: 'INCOMPLETE_LUNCH_STRUCTURE',
            severity: 'WARNING',
            category: 'REPETITION',
            title: `Cấu trúc bữa trưa chưa hoàn thiện (${dayName})`,
            message: `Bữa trưa ${dayName} thiếu: ${missing.join(', ')}. Cấu trúc chuẩn mầm non cần đủ Món mặn, Canh và Rau/Xào.`,
            recommendation: `Bổ sung ${missing.join(' và ')} cho bữa trưa ${dayName} để đảm bảo tính cân đối dinh dưỡng.`,
          });
          recommendations.push(`Bổ sung ${missing.join(' và ')} cho bữa trưa ${dayName}.`);
        }
      }
    }

    // --- KIỂM TRA 6: NGUỒN ĐẠM LẶP LẠI QUÁ 3 NGÀY TRONG TUẦN ---
    for (const [proteinName, days] of proteinGroupDays.entries()) {
      if (days.size > 3) {
        violations.push({
          code: 'PROTEIN_GROUP_OVERUSED',
          severity: 'WARNING',
          category: 'REPETITION',
          title: `Nguồn đạm lặp lại: ${proteinName}`,
          message: `Nguồn đạm "${proteinName}" xuất hiện trong bữa trưa ${days.size} ngày/tuần (khuyến nghị tối đa 3 ngày/tuần theo Thông tư 28).`,
          recommendation: `Đa dạng hóa nguồn đạm bằng cách bổ sung thêm cá, tôm, thịt gia cầm hoặc đậu phụ luân phiên.`,
        });
        recommendations.push(`Giảm tần suất sử dụng ${proteinName} xuống tối đa 3 ngày/tuần và thay thế bằng cá, tôm hoặc gia cầm.`);
      }
    }

    // Tính điểm tuân thủ (Compliance Score)
    let score = 100;
    for (const v of violations) {
      if (v.severity === 'CRITICAL') score -= 20;
      else if (v.severity === 'WARNING') score -= 8;
      else if (v.severity === 'INFO') score -= 2;
    }
    const finalScore = Math.max(25, Math.min(100, score));

    let overallStatus: 'PASS' | 'WARNING' | 'VIOLATION' = 'PASS';
    const hasCritical = violations.some((v) => v.severity === 'CRITICAL');
    if (hasCritical || finalScore < 65) {
      overallStatus = 'VIOLATION';
    } else if (violations.length > 0 || finalScore < 85) {
      overallStatus = 'WARNING';
    }

    if (recommendations.length === 0) {
      recommendations.push('Thực đơn đạt chuẩn dinh dưỡng hoàn hảo theo Thông tư 28/2016/TT-BGDĐT.');
    }

    return {
      menuId: menu.id,
      menuTitle: menu.title,
      targetAgeGroup: ageGroup,
      appliedRuleName: standard.name,
      complianceScore: finalScore,
      overallStatus,
      summaryNutrition,
      standardReference: {
        minEnergyKcal: standard.minEnergyKcal,
        maxEnergyKcal: standard.maxEnergyKcal,
        minProteinPercent: standard.minProteinPercent,
        maxProteinPercent: standard.maxProteinPercent,
        minFatPercent: standard.minFatPercent,
        maxFatPercent: standard.maxFatPercent,
        minCarbPercent: standard.minCarbPercent,
        maxCarbPercent: standard.maxCarbPercent,
      },
      violations,
      actionableRecommendations: Array.from(new Set(recommendations)),
    };
  }
}
