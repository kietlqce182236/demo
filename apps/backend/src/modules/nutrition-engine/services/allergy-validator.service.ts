import { Injectable } from '@nestjs/common';

@Injectable()
export class AllergyValidatorService {
  checkAllergenConflicts(childAllergens: string[], dishIngredients: string[]) {
    const conflicts = childAllergens.filter((a) =>
      dishIngredients.some((i) => i.toLowerCase().includes(a.toLowerCase())),
    );
    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }
}
