import { Injectable } from '@nestjs/common';

export type WhoNutritionalStatus =
  | 'NORMAL'
  | 'UNDERWEIGHT'
  | 'SEVERE_UNDERWEIGHT'
  | 'STUNTING'
  | 'SEVERE_STUNTING'
  | 'OVERWEIGHT'
  | 'OBESE';

export interface GrowthEvaluation {
  bmi: number;
  zScoreWfa: number; // Cân nặng theo tuổi (Weight-for-age)
  zScoreHfa: number; // Chiều cao theo tuổi (Height-for-age)
  zScoreBmi: number; // BMI theo tuổi (BMI-for-age)
  statusWfa: WhoNutritionalStatus;
  statusHfa: WhoNutritionalStatus;
  statusBmi: WhoNutritionalStatus;
  advice: string;
}

@Injectable()
export class WhoZScoreService {
  /**
   * Tính toán Z-score dựa trên độ lệch chuẩn (SD) chuẩn WHO Child Growth Standards:
   * Z = (Giá trị đo - Trung vị Median) / SD
   */
  calculateZScore(measuredValue: number, median: number, sdValue: number): number {
    if (sdValue === 0) return 0;
    const z = (measuredValue - median) / sdValue;
    return Number(z.toFixed(2));
  }

  evaluateStatus(zScore: number, type: 'WFA' | 'HFA' | 'BMI'): WhoNutritionalStatus {
    if (zScore < -3) {
      return type === 'HFA' ? 'SEVERE_STUNTING' : 'SEVERE_UNDERWEIGHT';
    }
    if (zScore < -2) {
      return type === 'HFA' ? 'STUNTING' : 'UNDERWEIGHT';
    }
    if (zScore > 3) {
      return 'OBESE';
    }
    if (zScore > 2) {
      return 'OVERWEIGHT';
    }
    return 'NORMAL';
  }

  evaluateChildGrowth(
    gender: 'MALE' | 'FEMALE',
    ageInMonths: number,
    heightCm: number,
    weightKg: number,
  ): GrowthEvaluation {
    const heightInMeters = heightCm / 100.0;
    const bmi = Number((weightKg / (heightInMeters * heightInMeters)).toFixed(2));

    // Demo lookup median/sd (Trong production lấy từ bảng who_growth_standards trong DB)
    const mockMedianWeight = gender === 'MALE' ? 14.3 : 13.9;
    const mockSdWeight = 1.6;

    const mockMedianHeight = gender === 'MALE' ? 96.1 : 95.1;
    const mockSdHeight = 3.8;

    const mockMedianBmi = 15.3;
    const mockSdBmi = 1.2;

    const zScoreWfa = this.calculateZScore(weightKg, mockMedianWeight, mockSdWeight);
    const zScoreHfa = this.calculateZScore(heightCm, mockMedianHeight, mockSdHeight);
    const zScoreBmi = this.calculateZScore(bmi, mockMedianBmi, mockSdBmi);

    const statusWfa = this.evaluateStatus(zScoreWfa, 'WFA');
    const statusHfa = this.evaluateStatus(zScoreHfa, 'HFA');
    const statusBmi = this.evaluateStatus(zScoreBmi, 'BMI');

    let advice = 'Trẻ phát triển thể lực bình thường theo chuẩn WHO.';
    if (statusWfa === 'UNDERWEIGHT' || statusHfa === 'STUNTING') {
      advice = 'Cần tăng cường năng lượng, bổ sung vi chất (Kẽm, Canxi, Sắt) trong khẩu phần ăn.';
    } else if (statusBmi === 'OVERWEIGHT' || statusBmi === 'OBESE') {
      advice = 'Cần kiểm soát lượng chất béo, đường ngọt; tăng cường rau xanh và hoạt động thể chất.';
    }

    return {
      bmi,
      zScoreWfa,
      zScoreHfa,
      zScoreBmi,
      statusWfa,
      statusHfa,
      statusBmi,
      advice,
    };
  }
}
