import { Injectable } from '@nestjs/common';

export interface ChildAllergyProfile {
  childId: string;
  childName: string;
  allergenCodes: string[]; // e.g. ['PEANUT', 'COW_MILK', 'CRUSTACEAN']
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLAXIS';
}

export interface DishAllergenInfo {
  dishId: string;
  dishName: string;
  containedAllergens: string[];
}

export interface AllergyConflictViolation {
  childId: string;
  childName: string;
  dishId: string;
  dishName: string;
  conflictAllergens: string[];
  severity: 'WARNING' | 'BLOCKING';
  message: string;
}

@Injectable()
export class AllergyValidatorService {
  /**
   * Quét và phát hiện xung đột giữa thực đơn dự kiến và danh sách học sinh bị dị ứng
   */
  detectConflicts(
    children: ChildAllergyProfile[],
    dishes: DishAllergenInfo[],
  ): AllergyConflictViolation[] {
    const violations: AllergyConflictViolation[] = [];

    for (const child of children) {
      if (!child.allergenCodes || child.allergenCodes.length === 0) continue;

      for (const dish of dishes) {
        if (!dish.containedAllergens || dish.containedAllergens.length === 0) continue;

        // Tìm điểm giao nhau giữa chất dị ứng của trẻ và thành phần món ăn
        const matched = dish.containedAllergens.filter((allergen) =>
          child.allergenCodes.includes(allergen.toUpperCase()),
        );

        if (matched.length > 0) {
          const isSevere = child.severity === 'SEVERE' || child.severity === 'ANAPHYLAXIS';
          violations.push({
            childId: child.childId,
            childName: child.childName,
            dishId: dish.dishId,
            dishName: dish.dishName,
            conflictAllergens: matched,
            severity: isSevere ? 'BLOCKING' : 'WARNING',
            message: `Học sinh ${child.childName} có tiền sử dị ứng [${matched.join(', ')}] - Xung đột với món ăn "${dish.dishName}"`,
          });
        }
      }
    }

    return violations;
  }
}
