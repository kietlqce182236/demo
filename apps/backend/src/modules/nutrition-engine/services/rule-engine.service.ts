import { Injectable } from '@nestjs/common';
import { NutritionSummary } from './nutrition-calculator.service';

export interface AgeNutritionStandard {
  gradeLevel: string; // 'NURSERY' hoặc 'KINDERGARTEN'
  minEnergyKcal: number;
  maxEnergyKcal: number;
  minProteinRatio: number;
  maxProteinRatio: number;
  minLipidRatio: number;
  maxLipidRatio: number;
  minGlucidRatio: number;
  maxGlucidRatio: number;
}

export interface RuleEvaluationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

@Injectable()
export class RuleEngineService {
  /**
   * Đánh giá thực đơn theo chuẩn Thông tư 28/2016/TT-BGDĐT:
   * Nhà trẻ (24-36 tháng): 600-735 kcal/ngày tại trường, P: 13-20%, L: 30-40%, G: 47-50%
   * Mẫu giáo (3-6 tuổi): 615-726 kcal/ngày tại trường, P: 13-20%, L: 25-35%, G: 52-60%
   */
  evaluateNutritionCompliance(
    summary: NutritionSummary,
    standard: AgeNutritionStandard,
  ): RuleEvaluationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 1. Kiểm tra tổng năng lượng
    if (summary.totalEnergyKcal < standard.minEnergyKcal) {
      errors.push(
        `Năng lượng chưa đạt chuẩn: ${summary.totalEnergyKcal} kcal (Tối thiểu ${standard.minEnergyKcal} kcal)`,
      );
    } else if (summary.totalEnergyKcal > standard.maxEnergyKcal) {
      warnings.push(
        `Năng lượng vượt ngưỡng khuyến nghị: ${summary.totalEnergyKcal} kcal (Tối đa ${standard.maxEnergyKcal} kcal)`,
      );
    }

    // 2. Kiểm tra tỷ lệ Protein
    if (summary.proteinRatioPercent < standard.minProteinRatio) {
      warnings.push(
        `Tỷ lệ đạm (P) thấp: ${summary.proteinRatioPercent}% (Chuẩn ${standard.minProteinRatio}-${standard.maxProteinRatio}%)`,
      );
    } else if (summary.proteinRatioPercent > standard.maxProteinRatio) {
      warnings.push(
        `Tỷ lệ đạm (P) cao: ${summary.proteinRatioPercent}% (Chuẩn ${standard.minProteinRatio}-${standard.maxProteinRatio}%)`,
      );
    }

    // 3. Kiểm tra tỷ lệ Lipid (Chất béo)
    if (summary.lipidRatioPercent < standard.minLipidRatio) {
      warnings.push(
        `Tỷ lệ béo (L) thấp: ${summary.lipidRatioPercent}% (Chuẩn ${standard.minLipidRatio}-${standard.maxLipidRatio}%)`,
      );
    } else if (summary.lipidRatioPercent > standard.maxLipidRatio) {
      warnings.push(
        `Tỷ lệ béo (L) cao: ${summary.lipidRatioPercent}% (Chuẩn ${standard.minLipidRatio}-${standard.maxLipidRatio}%)`,
      );
    }

    // 4. Kiểm tra tỷ lệ Glucid (Bột đường)
    if (summary.glucidRatioPercent < standard.minGlucidRatio) {
      warnings.push(
        `Tỷ lệ bột đường (G) thấp: ${summary.glucidRatioPercent}% (Chuẩn ${standard.minGlucidRatio}-${standard.maxGlucidRatio}%)`,
      );
    } else if (summary.glucidRatioPercent > standard.maxGlucidRatio) {
      warnings.push(
        `Tỷ lệ bột đường (G) cao: ${summary.glucidRatioPercent}% (Chuẩn ${standard.minGlucidRatio}-${standard.maxGlucidRatio}%)`,
      );
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }
}
