---
name: ai-menu-advisor
description: >
  AI Menu Advisor skill for KidMeal — LLM-driven menu planning prompts,
  Vietnamese preschool nutrition constraints, allergen-safe substitution suggestions,
  weekly menu generation with P:L:G compliance, and response schemas for AI integration.
---

# 🤖 AI Menu Advisor — KidMeal

## 1. Overview
The AI Menu Advisor uses LLM capabilities to:
1. **Auto-generate weekly menus** compliant with Circular 28/2016/TT-BGDĐT.
2. **Suggest allergen-safe substitutions** when conflicts are detected.
3. **Optimize nutritional balance** (P:L:G ratios, micronutrients).
4. **Provide meal variety analysis** to avoid repetition.

---

## 2. System Prompt Template

```markdown
## Role
Bạn là Chuyên gia Dinh dưỡng Mầm non (Preschool Nutrition Expert) cho hệ thống KidMeal.
Bạn lập thực đơn tuần cho trẻ mầm non Việt Nam (3–5 tuổi) theo đúng quy chuẩn
Thông tư 28/2016/TT-BGDĐT của Bộ Giáo dục và Đào tạo.

## Constraints (Ràng buộc bắt buộc)
1. **Năng lượng tại trường**: 615–792 kcal/ngày (50–60% nhu cầu 1230–1320 kcal)
2. **Tỷ lệ P:L:G**: Protein 12–15%, Lipid 20–30%, Glucid 55–68%
3. **Đạm động vật**: ≥ 50% tổng protein
4. **Vi chất tối thiểu/ngày**: Ca ≥ 250mg, Fe ≥ 5mg, Zn ≥ 2.5mg, Vitamin A ≥ 200µg, Vitamin C ≥ 25mg
5. **Muối**: ≤ 2.4g/bữa tại trường
6. **Đường**: ≤ 10% tổng năng lượng
7. **Đa dạng thực phẩm**: Tối thiểu 10 loại thực phẩm khác nhau/tuần
8. **Không lặp món**: Không lặp cùng một món chính trong 3 ngày liên tiếp
9. **Dị ứng**: TUYỆT ĐỐI KHÔNG dùng thực phẩm trong danh sách dị ứng

## Meal Structure (3 bữa/ngày tại trường)
- **Bữa sáng (Breakfast)**: Cháo/phở/bún/bánh mì + sữa
- **Bữa trưa (Lunch)**: Cơm + 1 món mặn + 1 canh + 1 rau + tráng miệng
- **Bữa xế (Afternoon Snack)**: Bánh/chè/sữa/trái cây

## Output Format
Trả về JSON theo schema dưới đây. KHÔNG thêm text ngoài JSON.
```

---

## 3. Request/Response Schemas

### 3.1 Menu Generation Request
```typescript
interface MenuGenerationRequest {
  tenantId: string;
  weekStartDate: string;           // ISO date, Monday
  ageGroup: '3-4' | '4-5';
  totalChildren: number;
  excludedAllergens: string[];     // e.g., ['MILK', 'PEANUT', 'EGG']
  excludedFoods: string[];         // Specific food IDs to avoid
  availableFoods: FoodSummary[];   // Tenant's food inventory
  preferences?: {
    preferLocalDishes: boolean;    // Ưu tiên món Việt Nam truyền thống
    maxBudgetPerChildPerDay?: number;  // VND
  };
}

interface FoodSummary {
  id: string;
  name: string;
  category: string;          // 'MEAT', 'FISH', 'VEGETABLE', 'GRAIN', etc.
  kcalPer100g: number;
  proteinPer100g: number;
  lipidPer100g: number;
  glucidPer100g: number;
  allergenCategories: string[];
  isAnimalProtein: boolean;
}
```

### 3.2 Menu Generation Response
```typescript
interface MenuGenerationResponse {
  weekMenu: DayMenu[];
  nutritionSummary: WeekNutritionSummary;
  warnings: string[];
}

interface DayMenu {
  dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
  date: string;
  meals: {
    breakfast: MealPlan;
    lunch: MealPlan;
    afternoonSnack: MealPlan;
  };
  dailyTotals: NutrientTotals;
  plgRatio: { protein: number; lipid: number; glucid: number };
  compliance: {
    energyInRange: boolean;
    plgInRange: boolean;
    micronutrientsOk: boolean;
    noAllergenConflict: boolean;
  };
}

interface MealPlan {
  dishes: PlannedDish[];
  totalKcal: number;
}

interface PlannedDish {
  name: string;
  foodIds: string[];        // References to tenant's food inventory
  portionGrams: number;     // Per child
  nutrients: {
    kcal: number;
    proteinG: number;
    lipidG: number;
    glucidG: number;
  };
}
```

---

## 4. Allergen Substitution Prompts

### 4.1 Substitution Request
```typescript
interface SubstitutionRequest {
  originalDish: {
    name: string;
    ingredients: { foodId: string; name: string; allergens: string[] }[];
  };
  conflictingAllergens: string[];  // e.g., ['MILK']
  availableAlternatives: FoodSummary[];
}
```

### 4.2 Substitution Prompt Template
```markdown
## Task
Món "{originalDish.name}" chứa dị ứng nguyên {conflictingAllergens}.
Hãy đề xuất 2-3 phương án thay thế TƯƠNG ĐƯƠNG về giá trị dinh dưỡng,
sử dụng nguyên liệu có sẵn trong kho.

## Rules
1. Giữ nguyên tổng kcal ± 10%
2. Đạm động vật phải ≥ 50% nếu món gốc là món mặn
3. Phù hợp khẩu vị trẻ mầm non Việt Nam
4. TUYỆT ĐỐI KHÔNG chứa: {conflictingAllergens}

## Available Alternatives
{JSON list of availableAlternatives}
```

---

## 5. Integration Pattern

### 5.1 Backend Service
Location: `apps/backend/src/modules/menus/services/ai-menu-advisor.service.ts`

```typescript
@Injectable()
export class AiMenuAdvisorService {
  constructor(
    private readonly configService: ConfigService,
    private readonly foodsService: FoodsService,
    private readonly allergenService: AllergenCheckerService,
  ) {}

  async generateWeeklyMenu(request: MenuGenerationRequest): Promise<MenuGenerationResponse> {
    // 1. Build system prompt with constraints
    const systemPrompt = this.buildSystemPrompt();

    // 2. Build user prompt with tenant's food inventory & allergen exclusions
    const userPrompt = this.buildUserPrompt(request);

    // 3. Call LLM API (OpenAI / Gemini / local)
    const response = await this.callLLM(systemPrompt, userPrompt);

    // 4. Parse and validate response against nutrition rules
    const menu = this.parseMenuResponse(response);

    // 5. Run server-side validation (don't trust LLM output blindly)
    const validated = await this.validateMenu(menu, request);

    return validated;
  }

  async suggestSubstitution(request: SubstitutionRequest): Promise<SubstitutionResponse> {
    // Similar flow: prompt → LLM → parse → validate
  }
}
```

### 5.2 Frontend Integration
Location: `apps/frontend/src/features/menus/`

```tsx
// AI Menu Generation Button
<button
  onClick={() => generateMenuMutation.mutate({
    weekStartDate: selectedWeek,
    ageGroup: selectedAgeGroup,
    excludedAllergens: tenantAllergens,
  })}
  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl"
>
  <Sparkles className="w-4 h-4" />
  Tạo thực đơn AI
</button>
```

---

## 6. Variety Analysis

### 6.1 Repetition Check
```typescript
function checkMenuVariety(weekMenu: DayMenu[]): string[] {
  const warnings: string[] = [];
  const mainDishHistory: string[] = [];

  for (const day of weekMenu) {
    const mainDish = day.meals.lunch.dishes[0]?.name;
    if (mainDish) {
      // Check last 2 days
      const recentDishes = mainDishHistory.slice(-2);
      if (recentDishes.includes(mainDish)) {
        warnings.push(`Món "${mainDish}" lặp lại trong 3 ngày liên tiếp`);
      }
      mainDishHistory.push(mainDish);
    }
  }

  // Check total unique ingredients
  const allFoodIds = new Set<string>();
  for (const day of weekMenu) {
    for (const meal of Object.values(day.meals)) {
      for (const dish of meal.dishes) {
        dish.foodIds.forEach(id => allFoodIds.add(id));
      }
    }
  }

  if (allFoodIds.size < 10) {
    warnings.push(`Chỉ sử dụng ${allFoodIds.size}/10 loại thực phẩm (yêu cầu ≥ 10)`);
  }

  return warnings;
}
```

---

## 7. API Endpoints
```
POST /api/v1/menus/ai/generate           → Generate AI weekly menu
POST /api/v1/menus/ai/substitute          → Suggest allergen-safe substitution
GET  /api/v1/menus/ai/variety-check/:weekId → Check menu variety
```

---

## 8. Key Conventions
- **Never trust LLM output blindly** — always validate against nutrition-rule-engine server-side.
- LLM responses must be valid JSON matching the schema.
- Allergen exclusion is ABSOLUTE — no exceptions.
- AI-generated menus always have `source: 'AI'` flag for auditing.
- Nutritionist must review & approve AI menus before publication.
- Rate limit AI generation: max 10 requests/tenant/hour.
