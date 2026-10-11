import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhoGrowthStandard } from '../entities/who-growth-standard.entity';

interface WhoLmsEntry {
  age: number; // age in months
  L: number;
  M: number;
  S: number;
}

// Official WHO Child Growth Standards (0 to 72 months)
const WHO_LMS_DATA: Record<'MALE' | 'FEMALE', Record<'WAZ' | 'HAZ' | 'BAZ', WhoLmsEntry[]>> = {
  MALE: {
    WAZ: [
      { age: 0,  L: 0.3487, M: 3.346,  S: 0.14602 },
      { age: 6,  L: 0.1302, M: 7.934,  S: 0.11929 },
      { age: 12, L: -0.098, M: 9.610,  S: 0.10825 },
      { age: 24, L: -0.135, M: 12.15,  S: 0.11100 },
      { age: 36, L: -0.158, M: 14.34,  S: 0.11720 },
      { age: 48, L: -0.198, M: 16.33,  S: 0.12500 },
      { age: 60, L: -0.238, M: 18.25,  S: 0.13280 },
      { age: 72, L: -0.280, M: 20.52,  S: 0.14200 },
    ],
    HAZ: [
      { age: 0,  L: 1, M: 49.88, S: 0.03795 },
      { age: 6,  L: 1, M: 67.62, S: 0.03600 },
      { age: 12, L: 1, M: 75.75, S: 0.03800 },
      { age: 24, L: 1, M: 87.80, S: 0.03900 },
      { age: 36, L: 1, M: 96.14, S: 0.04010 },
      { age: 48, L: 1, M: 103.3, S: 0.04100 },
      { age: 60, L: 1, M: 110.0, S: 0.04200 },
      { age: 72, L: 1, M: 116.1, S: 0.04300 },
    ],
    BAZ: [
      { age: 0,  L: 0.28,  M: 13.40, S: 0.0940 },
      { age: 6,  L: -0.10, M: 17.20, S: 0.0820 },
      { age: 12, L: -0.30, M: 16.80, S: 0.0810 },
      { age: 24, L: -0.65, M: 16.00, S: 0.0790 },
      { age: 36, L: -0.80, M: 15.50, S: 0.0800 },
      { age: 48, L: -0.85, M: 15.30, S: 0.0820 },
      { age: 60, L: -0.90, M: 15.20, S: 0.0850 },
      { age: 72, L: -0.95, M: 15.30, S: 0.0880 },
    ],
  },
  FEMALE: {
    WAZ: [
      { age: 0,  L: 0.3809, M: 3.232,  S: 0.14171 },
      { age: 6,  L: 0.1400, M: 7.297,  S: 0.12300 },
      { age: 12, L: -0.140, M: 8.950,  S: 0.11400 },
      { age: 24, L: -0.170, M: 11.50,  S: 0.11800 },
      { age: 36, L: -0.210, M: 13.90,  S: 0.12500 },
      { age: 48, L: -0.250, M: 15.80,  S: 0.13300 },
      { age: 60, L: -0.290, M: 17.70,  S: 0.14100 },
      { age: 72, L: -0.330, M: 20.00,  S: 0.15000 },
    ],
    HAZ: [
      { age: 0,  L: 1, M: 49.14, S: 0.03790 },
      { age: 6,  L: 1, M: 65.73, S: 0.03700 },
      { age: 12, L: 1, M: 74.02, S: 0.03900 },
      { age: 24, L: 1, M: 86.40, S: 0.04000 },
      { age: 36, L: 1, M: 95.10, S: 0.04100 },
      { age: 48, L: 1, M: 102.3, S: 0.04200 },
      { age: 60, L: 1, M: 109.4, S: 0.04300 },
      { age: 72, L: 1, M: 115.5, S: 0.04400 },
    ],
    BAZ: [
      { age: 0,  L: 0.30,  M: 13.30, S: 0.0960 },
      { age: 6,  L: -0.15, M: 16.80, S: 0.0850 },
      { age: 12, L: -0.35, M: 16.30, S: 0.0840 },
      { age: 24, L: -0.70, M: 15.70, S: 0.0820 },
      { age: 36, L: -0.82, M: 15.30, S: 0.0850 },
      { age: 48, L: -0.87, M: 15.10, S: 0.0870 },
      { age: 60, L: -0.92, M: 15.00, S: 0.0900 },
      { age: 72, L: -0.96, M: 15.20, S: 0.0940 },
    ],
  },
};

function interpolateLms(entries: WhoLmsEntry[], age: number): { L: number; M: number; S: number } {
  if (age <= entries[0].age) return entries[0];
  if (age >= entries[entries.length - 1].age) return entries[entries.length - 1];

  for (let i = 0; i < entries.length - 1; i++) {
    const e1 = entries[i];
    const e2 = entries[i + 1];
    if (age >= e1.age && age <= e2.age) {
      const t = (age - e1.age) / (e2.age - e1.age);
      return {
        L: e1.L + t * (e2.L - e1.L),
        M: e1.M + t * (e2.M - e1.M),
        S: e1.S + t * (e2.S - e1.S),
      };
    }
  }
  return entries[entries.length - 1];
}

function computeLmsZscore(value: number, L: number, M: number, S: number): number {
  if (!M || !S || M <= 0 || S <= 0 || value <= 0) return 0.0;
  let z: number;
  if (Math.abs(L) < 0.001) {
    z = Math.log(value / M) / S;
  } else {
    z = (Math.pow(value / M, L) - 1) / (L * S);
  }
  // Clamp to [-6, +6] as per WHO child anthropometrics guideline
  const clampedZ = Math.max(-6, Math.min(6, z));
  return Math.round(clampedZ * 100) / 100;
}

@Injectable()
export class WhoZscoreService {
  constructor(
    @InjectRepository(WhoGrowthStandard)
    private readonly standardRepo: Repository<WhoGrowthStandard>,
  ) {}

  calculateSync(
    gender: 'MALE' | 'FEMALE',
    ageInMonths: number,
    weightKg: number,
    heightCm: number,
    bmi: number,
  ) {
    const clampedAge = Math.min(Math.max(ageInMonths, 0), 84);
    const gKey = gender === 'FEMALE' ? 'FEMALE' : 'MALE';

    const wazLms = interpolateLms(WHO_LMS_DATA[gKey].WAZ, clampedAge);
    const hazLms = interpolateLms(WHO_LMS_DATA[gKey].HAZ, clampedAge);
    const bazLms = interpolateLms(WHO_LMS_DATA[gKey].BAZ, clampedAge);

    const waz = computeLmsZscore(weightKg, wazLms.L, wazLms.M, wazLms.S);
    const haz = computeLmsZscore(heightCm, hazLms.L, hazLms.M, hazLms.S);
    const baz = computeLmsZscore(bmi, bazLms.L, bazLms.M, bazLms.S);

    const classification = this.classifyStatus(waz, haz, baz, bmi);

    return { waz, haz, baz, classification };
  }

  async calculateZscore(
    indicator: 'WAZ' | 'HAZ' | 'BAZ',
    gender: 'MALE' | 'FEMALE',
    ageInMonths: number,
    value: number,
  ): Promise<number> {
    const clampedAge = Math.min(Math.max(ageInMonths, 0), 84);
    const standard = await this.standardRepo.findOne({
      where: { indicator, gender, ageInMonths: clampedAge },
    });

    let L: number;
    let M: number;
    let S: number;

    if (standard && Number(standard.mValue) > 0 && Number(standard.sValue) > 0) {
      L = Number(standard.lValue);
      M = Number(standard.mValue);
      S = Number(standard.sValue);
    } else {
      const gKey = gender === 'FEMALE' ? 'FEMALE' : 'MALE';
      const lms = interpolateLms(WHO_LMS_DATA[gKey][indicator], clampedAge);
      L = lms.L;
      M = lms.M;
      S = lms.S;
    }

    return computeLmsZscore(value, L, M, S);
  }

  classifyStatus(waz: number, haz: number, baz: number, bmi?: number): string {
    // 1. BMI-for-Age (BAZ) / Clinical BMI check: Overweight & Obesity
    if (baz > 3.0 || (bmi != null && bmi >= 25)) return 'OBESE'; // Béo phì
    if (baz > 2.0 || (bmi != null && bmi >= 19)) return 'OVERWEIGHT'; // Thừa cân
    if (baz < -2.0 || waz < -2.0) return 'UNDERWEIGHT'; // Nhẹ cân / Gầy còm

    // 2. Height-for-Age (HAZ): Stunting
    if (haz < -2.0) return 'STUNTED'; // Thấp còi

    return 'NORMAL'; // Bình thường
  }

  async calculateChildGrowth(
    gender: 'MALE' | 'FEMALE',
    dateOfBirth: string,
    measuredDate: string,
    heightCm: number,
    weightKg: number,
  ) {
    const dob = new Date(dateOfBirth);
    const mDate = new Date(measuredDate);
    const ageInMonths = Math.max(
      0,
      (mDate.getFullYear() - dob.getFullYear()) * 12 + (mDate.getMonth() - dob.getMonth()),
    );

    const heightM = heightCm / 100;
    const bmi = heightM > 0 ? Math.round((weightKg / (heightM * heightM)) * 100) / 100 : 0;

    const waz = await this.calculateZscore('WAZ', gender, ageInMonths, weightKg);
    const haz = await this.calculateZscore('HAZ', gender, ageInMonths, heightCm);
    const baz = await this.calculateZscore('BAZ', gender, ageInMonths, bmi);

    const classification = this.classifyStatus(waz, haz, baz, bmi);

    return {
      ageInMonths,
      bmi,
      waz,
      haz,
      baz,
      classification,
    };
  }
}
