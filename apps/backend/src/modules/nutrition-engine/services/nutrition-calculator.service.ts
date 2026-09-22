import { Injectable } from '@nestjs/common';

export interface IngredientWeight {
  energyKcal100g: number;
  proteinG100g: number;
  lipidG100g: number;
  glucidG100g: number;
  calciumMg100g?: number;
  ironMg100g?: number;
  netWeightG: number;
}

export interface NutritionSummary {
  totalEnergyKcal: number;
  totalProteinG: number;
  totalLipidG: number;
  totalGlucidG: number;
  proteinCalories: number;
  lipidCalories: number;
  glucidCalories: number;
  proteinRatioPercent: number; // Tỷ lệ P (%)
  lipidRatioPercent: number;   // Tỷ lệ L (%)
  glucidRatioPercent: number;  // Tỷ lệ G (%)
}

@Injectable()
export class NutritionCalculatorService {
  /**
   * Tính toán tổng dinh dưỡng và tỷ lệ P:L:G từ danh sách định lượng nguyên liệu
   * Hệ số chuyển đổi năng lượng chuẩn Viện Dinh Dưỡng:
   * 1g Protein = 4 kcal
   * 1g Lipid = 9 kcal
   * 1g Glucid = 4 kcal
   */
  calculateMealNutrition(ingredients: IngredientWeight[]): NutritionSummary {
    let totalEnergyKcal = 0;
    let totalProteinG = 0;
    let totalLipidG = 0;
    let totalGlucidG = 0;

    for (const item of ingredients) {
      const factor = item.netWeightG / 100.0;
      totalEnergyKcal += (item.energyKcal100g || 0) * factor;
      totalProteinG += (item.proteinG100g || 0) * factor;
      totalLipidG += (item.lipidG100g || 0) * factor;
      totalGlucidG += (item.glucidG100g || 0) * factor;
    }

    const proteinCalories = totalProteinG * 4;
    const lipidCalories = totalLipidG * 9;
    const glucidCalories = totalGlucidG * 4;
    const totalMacroCalories = proteinCalories + lipidCalories + glucidCalories;

    const proteinRatioPercent = totalMacroCalories > 0
      ? Number(((proteinCalories / totalMacroCalories) * 100).toFixed(1))
      : 0;

    const lipidRatioPercent = totalMacroCalories > 0
      ? Number(((lipidCalories / totalMacroCalories) * 100).toFixed(1))
      : 0;

    const glucidRatioPercent = totalMacroCalories > 0
      ? Number(((glucidCalories / totalMacroCalories) * 100).toFixed(1))
      : 0;

    return {
      totalEnergyKcal: Number(totalEnergyKcal.toFixed(1)),
      totalProteinG: Number(totalProteinG.toFixed(1)),
      totalLipidG: Number(totalLipidG.toFixed(1)),
      totalGlucidG: Number(totalGlucidG.toFixed(1)),
      proteinCalories: Number(proteinCalories.toFixed(1)),
      lipidCalories: Number(lipidCalories.toFixed(1)),
      glucidCalories: Number(glucidCalories.toFixed(1)),
      proteinRatioPercent,
      lipidRatioPercent,
      glucidRatioPercent,
    };
  }
}
