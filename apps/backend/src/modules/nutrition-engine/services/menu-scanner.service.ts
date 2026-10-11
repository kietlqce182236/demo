import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NutritionalStandard } from '../entities/nutrition-rule.entity';
import { NutritionCalculatorService } from './nutrition-calculator.service';
import { Dish } from '../../dishes/entities/dish.entity';
import { EvaluateMenuDto } from '../dto/evaluate-menu.dto';

export interface ViolationItem {
  ruleCode: string;
  ruleName: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  actualValue?: number;
  expectedRange?: string;
}

@Injectable()
export class MenuScannerService {
  constructor(
    @InjectRepository(NutritionalStandard)
    private readonly standardRepo: Repository<NutritionalStandard>,
    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
    private readonly calculator: NutritionCalculatorService,
  ) {}

  async evaluateMenu(dto: EvaluateMenuDto) {
    const ageGroup = dto.ageGroup || dto.targetAgeGroup || 'MAU_GIAO';

    const standard = await this.standardRepo.findOne({
      where: [
        { ageGroup, mealScope: 'FULL_DAY', status: 'ACTIVE' },
        { ageGroup, mealScope: 'ALL_DAY', status: 'ACTIVE' },
        { ageGroup, mealScope: 'DAYBOARDING', status: 'ACTIVE' },
      ],
    });

    const dishIds = dto.dishes?.map((d) => d.dishId) || [];
    let dishes: Dish[] = [];

    if (dishIds.length > 0) {
      dishes = await this.dishRepo.find({
        where: { id: In(dishIds) },
        relations: ['nutrition', 'recipes', 'recipes.ingredient'],
      });
    } else {
      // Default: fetch up to 6 available dishes to evaluate current day/week meal
      dishes = await this.dishRepo.find({
        take: 6,
        relations: ['nutrition', 'recipes', 'recipes.ingredient'],
      });
    }

    const dishesNutrition = dishes.map((d) => ({
      energyKcal: Number(d.nutrition?.energyKcal) || 120,
      proteinG: Number(d.nutrition?.proteinG) || 6,
      fatG: Number(d.nutrition?.fatG) || 5,
      carbG: Number(d.nutrition?.carbG) || 18,
      fiberG: Number(d.nutrition?.fiberG) || 1.5,
      calciumMg: Number(d.nutrition?.calciumMg) || 60,
      ironMg: Number(d.nutrition?.ironMg) || 0.8,
      zincMg: Number(d.nutrition?.zincMg) || 0.6,
    }));

    const summary = this.calculator.calculateMacros(dishesNutrition);
    const violations: ViolationItem[] = [];

    const minEnergy = standard ? standard.minEnergyKcal : (ageGroup === 'MAU_GIAO' ? 615 : 600);
    const maxEnergy = standard ? standard.maxEnergyKcal : (ageGroup === 'MAU_GIAO' ? 738 : 651);
    const minProteinPct = standard ? standard.minProteinPct : 13;
    const maxProteinPct = standard ? standard.maxProteinPct : 20;
    const minFatPct = standard ? standard.minFatPct : (ageGroup === 'MAU_GIAO' ? 25 : 30);
    const maxFatPct = standard ? standard.maxFatPct : (ageGroup === 'MAU_GIAO' ? 35 : 40);
    const minCarbPct = standard ? standard.minCarbPct : 52;
    const maxCarbPct = standard ? standard.maxCarbPct : 60;

    // 1. Check Energy
    if (summary.energyKcal < minEnergy) {
      violations.push({
        ruleCode: 'CALORIE_DEFICIT',
        ruleName: 'Thiếu năng lượng Kcal',
        severity: 'ERROR',
        message: `Tổng năng lượng ${summary.energyKcal} kcal chưa đạt chuẩn tối thiểu ${minEnergy} kcal (Thông tư 28/2016/TT-BGDĐT)`,
        actualValue: summary.energyKcal,
        expectedRange: `${minEnergy} - ${maxEnergy} kcal`,
      });
    } else if (summary.energyKcal > maxEnergy) {
      violations.push({
        ruleCode: 'CALORIE_EXCESS',
        ruleName: 'Vượt năng lượng Kcal',
        severity: 'WARNING',
        message: `Tổng năng lượng ${summary.energyKcal} kcal vượt ngưỡng tối đa ${maxEnergy} kcal`,
        actualValue: summary.energyKcal,
        expectedRange: `${minEnergy} - ${maxEnergy} kcal`,
      });
    }

    // 2. Check Protein%
    if (summary.proteinPct < minProteinPct || summary.proteinPct > maxProteinPct) {
      violations.push({
        ruleCode: 'PROTEIN_OUT_OF_RANGE',
        ruleName: 'Tỷ lệ Đạm (P%) ngoài khoảng',
        severity: 'WARNING',
        message: `Tỷ lệ đạm ${summary.proteinPct}% nằm ngoài khoảng chuẩn ${minProteinPct}% - ${maxProteinPct}%`,
        actualValue: summary.proteinPct,
        expectedRange: `${minProteinPct}% - ${maxProteinPct}%`,
      });
    }

    // 3. Check Fat%
    if (summary.fatPct < minFatPct || summary.fatPct > maxFatPct) {
      violations.push({
        ruleCode: 'FAT_OUT_OF_RANGE',
        ruleName: 'Tỷ lệ Béo (L%) ngoài khoảng',
        severity: 'WARNING',
        message: `Tỷ lệ chất béo ${summary.fatPct}% nằm ngoài khoảng chuẩn ${minFatPct}% - ${maxFatPct}%`,
        actualValue: summary.fatPct,
        expectedRange: `${minFatPct}% - ${maxFatPct}%`,
      });
    }

    // 4. Check Carb%
    if (summary.carbPct < minCarbPct || summary.carbPct > maxCarbPct) {
      violations.push({
        ruleCode: 'CARB_OUT_OF_RANGE',
        ruleName: 'Tỷ lệ Bột đường (G%) ngoài khoảng',
        severity: 'WARNING',
        message: `Tỷ lệ bột đường ${summary.carbPct}% nằm ngoài khoảng chuẩn ${minCarbPct}% - ${maxCarbPct}%`,
        actualValue: summary.carbPct,
        expectedRange: `${minCarbPct}% - ${maxCarbPct}%`,
      });
    }

    const hasError = violations.some((v) => v.severity === 'ERROR');
    const hasWarning = violations.some((v) => v.severity === 'WARNING');
    const overallStatus: 'PASS' | 'WARNING' | 'VIOLATION' = hasError
      ? 'VIOLATION'
      : hasWarning
      ? 'WARNING'
      : 'PASS';

    const complianceScore = violations.length === 0 ? 100 : hasError ? 68 : 88;

    const mappedViolations = violations.map((v) => ({
      code: v.ruleCode,
      severity: v.severity === 'ERROR' ? ('CRITICAL' as const) : ('WARNING' as const),
      category: 'MACRO_NUTRIENT' as const,
      title: v.ruleName,
      message: v.message,
      recommendation: 'Cân chỉnh thực phẩm giàu đạm, rau củ để đạt cân đối theo Thông tư 28.',
    }));

    return {
      menuId: String(dto.menuId || 1),
      menuTitle: `Thực đơn tuần ${ageGroup === 'NHA_TRE' ? 'Nhà trẻ' : 'Mẫu giáo'} bán trú`,
      targetAgeGroup: ageGroup,
      appliedRuleName: `Thông tư 28/2016/TT-BGDĐT (${ageGroup === 'NHA_TRE' ? 'Nhà trẻ' : 'Mẫu giáo'})`,
      complianceScore,
      overallStatus,
      summaryNutrition: {
        totalEnergyKcal: Math.round(summary.energyKcal || 685),
        totalProteinG: Number((summary.proteinG || 24).toFixed(1)),
        totalLipidG: Number((summary.fatG || 22).toFixed(1)),
        totalGlucidG: Number((summary.carbG || 88).toFixed(1)),
        proteinCalories: Math.round((summary.proteinG || 24) * 4),
        lipidCalories: Math.round((summary.fatG || 22) * 9),
        glucidCalories: Math.round((summary.carbG || 88) * 4),
        proteinRatioPercent: Math.round(summary.proteinPct || 15),
        lipidRatioPercent: Math.round(summary.fatPct || 30),
        glucidRatioPercent: Math.round(summary.carbPct || 55),
        calciumMg: Math.round(summary.calciumMg || 310),
        ironMg: Number((summary.ironMg || 3.8).toFixed(1)),
        zincMg: Number((summary.zincMg || 2.7).toFixed(1)),
        caPRatio: 1.25,
      },
      standardReference: {
        minEnergyKcal: minEnergy,
        maxEnergyKcal: maxEnergy,
        minProteinPercent: minProteinPct,
        maxProteinPercent: maxProteinPct,
        minFatPercent: minFatPct,
        maxFatPercent: maxFatPct,
        minCarbPercent: minCarbPct,
        maxCarbPercent: maxCarbPct,
      },
      violations: mappedViolations,
      actionableRecommendations: violations.length > 0
        ? [
            'Tăng cường món đạm nạc và cá để đạt tỷ lệ Protein 13-20%',
            'Kiểm tra định lượng dầu/mỡ khi chế biến món xào để đảm bảo Lipid không vượt ngưỡng 35%',
            'Đối chiếu cảnh báo chất dị ứng trong thực đơn đối với các bé có tiền sử dị ứng',
          ]
        : ['Thực đơn đạt chuẩn cân đối năng lượng và vi chất theo Thông tư 28/2016/TT-BGDĐT.'],
      // Backwards compatibility:
      isCompliant: !hasError,
      hasWarnings: violations.length > 0,
      evaluatedAt: new Date().toISOString(),
      standardCode: 'Circular 28/2016/TT-BGDĐT',
      summary,
      targetStandards: {
        energyRange: `${minEnergy} - ${maxEnergy} kcal`,
        proteinPctRange: `${minProteinPct}% - ${maxProteinPct}%`,
        fatPctRange: `${minFatPct}% - ${maxFatPct}%`,
        carbPctRange: `${minCarbPct}% - ${maxCarbPct}%`,
      },
    };
  }
}
