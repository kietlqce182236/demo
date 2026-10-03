import { Injectable } from '@nestjs/common';

export interface LmsParams {
  l: number;
  m: number;
  s: number;
}

export interface GrowthEvaluationResult {
  bmi: number;
  waz: number;
  haz: number;
  baz: number;
  weightClassification: string;
  heightClassification: string;
  bmiClassification: string;
  overallNutritionalStatus: string;
  advice: string;
}

@Injectable()
export class WhoZScoreService {
  /**
   * Tính Z-Score theo công thức LMS chuẩn Tổ chức Y tế Thế giới (WHO):
   * Z = [ (y / M)^L - 1 ] / (L * S) nếu L != 0
   * Z = ln(y / M) / S nếu L == 0
   */
  calculateLmsZScore(y: number, l: number, m: number, s: number): number {
    if (m <= 0 || s <= 0 || y <= 0) return 0;
    let z: number;
    if (Math.abs(l) < 0.0001) {
      z = Math.log(y / m) / s;
    } else {
      z = (Math.pow(y / m, l) - 1) / (l * s);
    }
    return Number(z.toFixed(2));
  }

  classifyWaz(z: number): string {
    if (z < -3) return 'SEVERELY_UNDERWEIGHT';
    if (z < -2) return 'UNDERWEIGHT';
    if (z <= 2) return 'NORMAL_WEIGHT';
    if (z <= 3) return 'OVERWEIGHT';
    return 'OBESE';
  }

  classifyHaz(z: number): string {
    if (z < -3) return 'SEVERELY_STUNTED';
    if (z < -2) return 'STUNTED';
    if (z <= 2) return 'NORMAL_HEIGHT';
    return 'TALL';
  }

  classifyBaz(z: number): string {
    if (z < -3) return 'SEVERELY_WASTED';
    if (z < -2) return 'WASTED';
    if (z <= 1) return 'NORMAL';
    if (z <= 2) return 'POSSIBLE_RISK_OVERWEIGHT';
    if (z <= 3) return 'OVERWEIGHT';
    return 'OBESE';
  }

  getOverallStatus(wazClass: string, hazClass: string, bazClass: string): string {
    const issues: string[] = [];
    if (hazClass === 'SEVERELY_STUNTED') issues.push('Thấp còi nặng');
    else if (hazClass === 'STUNTED') issues.push('Thấp còi');

    if (wazClass === 'SEVERELY_UNDERWEIGHT') issues.push('Suy dinh dưỡng nặng');
    else if (wazClass === 'UNDERWEIGHT') issues.push('Nhẹ cân');

    if (bazClass === 'SEVERELY_WASTED') issues.push('Gầy còm nặng');
    else if (bazClass === 'WASTED') issues.push('Gầy còm');
    else if (bazClass === 'OVERWEIGHT') issues.push('Thừa cân');
    else if (bazClass === 'OBESE') issues.push('Béo phì');

    if (issues.length === 0) return 'Phát triển thể lực bình thường';
    return issues.join(', ');
  }

  getAdvice(wazClass: string, hazClass: string, bazClass: string): string {
    if (hazClass.includes('STUNTED') || wazClass.includes('UNDERWEIGHT') || bazClass.includes('WASTED')) {
      return 'Trẻ có dấu hiệu thiếu hụt dinh dưỡng. Khuyến nghị tăng khẩu phần đạm động vật, vi chất (Canxi, Kẽm, Sắt), kiểm tra khả năng hấp thu và bổ sung bữa phụ giàu dinh dưỡng.';
    }
    if (bazClass === 'OVERWEIGHT' || bazClass === 'OBESE') {
      return 'Trẻ có nguy cơ/thừa cân béo phì. Cần điều chỉnh giảm chất béo bão hòa, hạn chế đường ngọt, tăng cường rau củ giàu chất xơ và khuyến khích vận động thể chất ngoài trời tối thiểu 60 phút/ngày.';
    }
    return 'Thể lực đạt chuẩn WHO. Tiếp tục duy trì chế độ dinh dưỡng cân đối và theo dõi định kỳ.';
  }

  /**
   * Tính toán đánh giá thể lực toàn diện
   */
  evaluate(
    weightKg: number,
    heightCm: number,
    wazLms: LmsParams,
    hazLms: LmsParams,
    bazLms: LmsParams,
  ): GrowthEvaluationResult {
    const heightM = heightCm / 100;
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(2));

    const waz = this.calculateLmsZScore(weightKg, wazLms.l, wazLms.m, wazLms.s);
    const haz = this.calculateLmsZScore(heightCm, hazLms.l, hazLms.m, hazLms.s);
    const baz = this.calculateLmsZScore(bmi, bazLms.l, bazLms.m, bazLms.s);

    const weightClassification = this.classifyWaz(waz);
    const heightClassification = this.classifyHaz(haz);
    const bmiClassification = this.classifyBaz(baz);
    const overallNutritionalStatus = this.getOverallStatus(
      weightClassification,
      heightClassification,
      bmiClassification,
    );
    const advice = this.getAdvice(weightClassification, heightClassification, bmiClassification);

    return {
      bmi,
      waz,
      haz,
      baz,
      weightClassification,
      heightClassification,
      bmiClassification,
      overallNutritionalStatus,
      advice,
    };
  }
}
