---
name: nutrition-rule-engine
description: >
  Nutrition Rule Engine skill for KidMeal — Vietnamese preschool nutrition standards
  (Circular 28/2016/TT-BGDĐT), P:L:G calorie balance formulas, micronutrient validation,
  allergen conflict detection, and rule-based menu compliance checking.
---

# 🧮 Nutrition Rule Engine — KidMeal

## 1. Vietnamese Preschool Nutrition Standards (Thông tư 28/2016/TT-BGDĐT)

### 1.1 Daily Energy at School (Bán trú)
Children eat **breakfast + lunch + afternoon snack** at preschool, covering **50–60%** of daily energy needs.

| Age Group          | Daily Total (kcal) | At School (kcal)      |
|--------------------|--------------------|-----------------------|
| 3–12 months        | 600–700            | 300–420               |
| 12–18 months       | 930–1000           | 465–600               |
| 18–24 months       | 1000–1100          | 500–660               |
| 24–36 months       | 1200–1300          | 600–780               |
| 3–5 years (mẫu giáo) | 1230–1320       | 615–792               |

### 1.2 P:L:G (Protein : Lipid : Glucid) Ratios
The engine must validate every menu day against:

```
Protein:   12–15% of total kcal  → (kcal_P / total_kcal) × 100
Lipid:     20–30% of total kcal  → (kcal_L / total_kcal) × 100
Glucid:    55–68% of total kcal  → 100 - %P - %L (remainder)
```

**Animal protein** must account for ≥50% of total protein (Đạm động vật ≥ 50%).

### 1.3 Micronutrient Minimums (per school day)
| Nutrient       | 3–5 years    |
|----------------|-------------|
| Calcium (Ca)   | ≥ 250 mg    |
| Iron (Fe)      | ≥ 5 mg      |
| Zinc (Zn)      | ≥ 2.5 mg    |
| Vitamin A      | ≥ 200 µg RE |
| Vitamin C      | ≥ 25 mg     |

### 1.4 Salt & Sugar Limits
- **Salt**: ≤ 4g/day (school portion ≤ 2.4g)
- **Added Sugar**: ≤ 10% total kcal

---

## 2. Rule Engine Architecture

### 2.1 Backend Module
Location: `apps/backend/src/modules/nutrition-engine/`

```
nutrition-engine/
├── controllers/
│   └── nutrition-rules.controller.ts   # CRUD + validate endpoint
├── dto/
│   ├── create-rule.dto.ts
│   ├── validate-menu.dto.ts
│   └── validation-result.dto.ts
├── entities/
│   ├── nutrition-rule.entity.ts        # TypeORM entity per tenant
│   └── allergen-rule.entity.ts
├── services/
│   ├── nutrition-rules.service.ts      # Rule CRUD + tenant isolation
│   ├── menu-validator.service.ts       # Core validation engine
│   └── allergen-checker.service.ts     # Allergy conflict detection
└── nutrition-engine.module.ts
```

### 2.2 Core Validation Pipeline

```typescript
// menu-validator.service.ts — validation flow
async validateMenuDay(tenantId: string, menuDayId: string): Promise<ValidationResult> {
  // 1. Load all dishes for the menu day with ingredients
  const menuDay = await this.loadMenuDayWithNutrients(tenantId, menuDayId);

  // 2. Sum macronutrients across all meals (breakfast + lunch + snack)
  const totals = this.sumNutrients(menuDay.meals);

  // 3. Check P:L:G ratios
  const plgResult = this.checkPLGRatio(totals);

  // 4. Check energy range for age group
  const energyResult = this.checkEnergyRange(totals.kcal, menuDay.ageGroup);

  // 5. Check micronutrient minimums
  const microResult = this.checkMicronutrients(totals, menuDay.ageGroup);

  // 6. Check salt/sugar limits
  const limitResult = this.checkSaltSugarLimits(totals);

  // 7. Run allergen conflict check for enrolled children
  const allergenResult = await this.allergenChecker.checkConflicts(
    tenantId, menuDay.classIds, menuDay.meals
  );

  return this.combineResults([plgResult, energyResult, microResult, limitResult, allergenResult]);
}
```

### 2.3 P:L:G Formula Implementation

```typescript
interface NutrientTotals {
  kcal: number;         // Total kilocalories
  proteinG: number;     // Total protein grams
  lipidG: number;       // Total lipid grams
  glucidG: number;      // Total carbohydrate grams
  animalProteinG: number; // Animal-source protein grams
  calciumMg: number;
  ironMg: number;
  zincMg: number;
  vitaminAMcg: number;
  vitaminCMg: number;
  saltG: number;
  sugarG: number;
}

function checkPLGRatio(totals: NutrientTotals): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const pPct = (totals.proteinG * 4 / totals.kcal) * 100;
  const lPct = (totals.lipidG * 9 / totals.kcal) * 100;
  const gPct = (totals.glucidG * 4 / totals.kcal) * 100;

  if (pPct < 12 || pPct > 15) {
    violations.push({
      ruleCode: 'PLG_PROTEIN',
      severity: pPct < 10 || pPct > 18 ? 'ERROR' : 'WARNING',
      message: `Protein ${pPct.toFixed(1)}% ngoài chuẩn 12–15%`,
      actual: pPct,
      expected: { min: 12, max: 15 },
    });
  }

  if (lPct < 20 || lPct > 30) {
    violations.push({
      ruleCode: 'PLG_LIPID',
      severity: 'WARNING',
      message: `Lipid ${lPct.toFixed(1)}% ngoài chuẩn 20–30%`,
      actual: lPct,
      expected: { min: 20, max: 30 },
    });
  }

  // Animal protein ratio check
  const animalPct = (totals.animalProteinG / totals.proteinG) * 100;
  if (animalPct < 50) {
    violations.push({
      ruleCode: 'ANIMAL_PROTEIN',
      severity: 'WARNING',
      message: `Đạm động vật ${animalPct.toFixed(1)}% < 50%`,
      actual: animalPct,
      expected: { min: 50 },
    });
  }

  return violations;
}
```

---

## 3. Allergen Conflict Detection

### 3.1 Database Schema
```sql
-- allergens per child (declared by PARENT)
CREATE TABLE child_allergens (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES children(id),
  allergen_category VARCHAR(50),  -- 'MILK', 'EGG', 'PEANUT', 'SHELLFISH', etc.
  severity VARCHAR(20),           -- 'MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC'
  notes TEXT,
  tenant_id UUID REFERENCES tenants(id)
);

-- allergens per food ingredient
CREATE TABLE food_allergens (
  food_id UUID REFERENCES foods(id),
  allergen_category VARCHAR(50),
  tenant_id UUID REFERENCES tenants(id)
);
```

### 3.2 Detection Algorithm
```typescript
async checkConflicts(
  tenantId: string,
  classIds: string[],
  meals: MealWithIngredients[]
): Promise<AllergenConflict[]> {
  // 1. Get all children enrolled in target classes
  const children = await this.childRepo.find({
    where: { classId: In(classIds), tenantId },
    relations: ['allergens'],
  });

  // 2. Get all allergen categories present in menu
  const menuAllergens = new Set<string>();
  for (const meal of meals) {
    for (const dish of meal.dishes) {
      for (const ing of dish.ingredients) {
        for (const fa of ing.food.allergens) {
          menuAllergens.add(fa.allergenCategory);
        }
      }
    }
  }

  // 3. Cross-match: children allergies ∩ menu allergens
  const conflicts: AllergenConflict[] = [];
  for (const child of children) {
    for (const allergy of child.allergens) {
      if (menuAllergens.has(allergy.allergenCategory)) {
        conflicts.push({
          childId: child.id,
          childName: child.fullName,
          className: child.class.name,
          allergen: allergy.allergenCategory,
          severity: allergy.severity,
          affectedMeals: meals
            .filter(m => m.dishes.some(d =>
              d.ingredients.some(i =>
                i.food.allergens.some(fa => fa.allergenCategory === allergy.allergenCategory)
              )
            ))
            .map(m => m.mealType),
        });
      }
    }
  }

  return conflicts;
}
```

---

## 4. Frontend Integration

### 4.1 Nutrition Rules Page
Location: `apps/frontend/src/features/menus/pages/NutritionRulesPage.tsx`

This page displays:
- Current P:L:G rule thresholds (editable by NUTRITIONIST)
- Allergen rule list per tenant
- Quick validation panel: select a menu week → run server-side validation → display violations

### 4.2 Validation Result UI Pattern
```tsx
// Display violations with severity-based colors
const severityColors = {
  ERROR: 'bg-red-100 text-red-800 border-red-300',
  WARNING: 'bg-amber-100 text-amber-800 border-amber-300',
  INFO: 'bg-blue-100 text-blue-800 border-blue-300',
};
```

### 4.3 API Endpoints
```
POST /api/v1/nutrition-rules/validate-menu   → Validate a menu day/week
GET  /api/v1/nutrition-rules                  → List all rules for tenant
PUT  /api/v1/nutrition-rules/:id              → Update rule threshold
GET  /api/v1/nutrition-rules/allergen-check   → Quick allergen scan
```

---

## 5. Key Conventions
- All rule checks return `RuleViolation[]` — never throw; collect all violations.
- `severity` levels: `ERROR` (blocking), `WARNING` (advisory), `INFO` (informational).
- Rules are tenant-scoped: each preschool can customize thresholds within legal bounds.
- Menu validation is triggered both **on save** (auto) and **on demand** (manual button).
- Allergen conflicts always generate `severity: 'ERROR'` for SEVERE/ANAPHYLACTIC allergies.
