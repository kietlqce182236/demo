import { Injectable } from '@nestjs/common';

export interface NutrientsSummary {
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  fiberG: number;
  calciumMg: number;
  ironMg: number;
  zincMg: number;
  proteinPct: number;
  fatPct: number;
  carbPct: number;
}

@Injectable()
export class NutritionCalculatorService {
  calculateMacros(dishesNutrition: Array<{
    energyKcal: number;
    proteinG: number;
    fatG: number;
    carbG: number;
    fiberG?: number;
    calciumMg?: number;
    ironMg?: number;
    zincMg?: number;
  }>): NutrientsSummary {
    let energyKcal = 0;
    let proteinG = 0;
    let fatG = 0;
    let carbG = 0;
    let fiberG = 0;
    let calciumMg = 0;
    let ironMg = 0;
    let zincMg = 0;

    for (const d of dishesNutrition) {
      energyKcal += d.energyKcal || 0;
      proteinG += d.proteinG || 0;
      fatG += d.fatG || 0;
      carbG += d.carbG || 0;
      fiberG += d.fiberG || 0;
      calciumMg += d.calciumMg || 0;
      ironMg += d.ironMg || 0;
      zincMg += d.zincMg || 0;
    }

    const proteinKcal = proteinG * 4;
    const fatKcal = fatG * 9;
    const carbKcal = carbG * 4;
    const totalMacroKcal = proteinKcal + fatKcal + carbKcal;

    let proteinPct = 0;
    let fatPct = 0;
    let carbPct = 0;

    if (totalMacroKcal > 0) {
      proteinPct = Math.round((proteinKcal / totalMacroKcal) * 1000) / 10;
      fatPct = Math.round((fatKcal / totalMacroKcal) * 1000) / 10;
      carbPct = Math.round((carbKcal / totalMacroKcal) * 1000) / 10;
    }

    const round1 = (v: number) => Math.round(v * 10) / 10;

    return {
      energyKcal: round1(energyKcal),
      proteinG: round1(proteinG),
      fatG: round1(fatG),
      carbG: round1(carbG),
      fiberG: round1(fiberG),
      calciumMg: round1(calciumMg),
      ironMg: round1(ironMg),
      zincMg: round1(zincMg),
      proteinPct,
      fatPct,
      carbPct,
    };
  }
}
