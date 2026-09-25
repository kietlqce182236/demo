export interface DishItem {
  id: string;
  name: string;
  description?: string;
  badgeText?: string;
  hasAllergyWarning: boolean;
  allergySubstituteText?: string;
  itemOrder: number;
}

export interface MealSessionData {
  sessionName: string;
  timeText: string;
  calories: number;
  dishes: DishItem[];
}

export interface DayNutritionData {
  totalCalories: number;
  ratioPLG: string;
}

export interface WeeklyDayData {
  dayOfWeek: number;
  dayName: string;
  dayCode: string;
  formattedDate: string;
  lunch: MealSessionData;
  afternoonSnack: MealSessionData;
  nutrition: DayNutritionData;
}

export interface PortionIngredient {
  id: string;
  sortOrder: number;
  ingredientName: string;
  quotaDescription: string;
  quotaPerChild: number;
  lossRatePercent: number;
  targetChildrenCount: number;
  targetBadge?: string;
  calculatedQuantity: number;
  unit: string;
  warehouseStockText: string;
  category: string;
  status: string;
}

export interface FoodSafetyStep {
  stepNumber: number;
  name: string;
  status: string;
  badgeText: string;
  badgeColor: string;
  description: string;
}

export interface MacroRatioItem {
  percent: number;
  gramText: string;
  label: string;
  color: string;
}

export interface MacroRatio {
  protein: MacroRatioItem;
  lipid: MacroRatioItem;
  glucid: MacroRatioItem;
  ratioText: string;
  standardNote: string;
}

export interface PortionPlanKPIs {
  totalBoardingStudents: number;
  totalEnrolledStudents: number;
  attendanceRate: number;
  attendanceBadgeText: string;
  allergicChildrenCount: number;
  allergicBadgeText: string;
  avgCalories: number;
  energyCoverageRate: number;
  energyBadgeText: string;
  legalApprovalStatus: string;
  legalNoticeText: string;
}

export interface PortionPlanDetails {
  studentCount: number;
  allergicSubstituteCount: number;
  normalCount: number;
  unit: string;
  statusBadge: string;
  ingredients: PortionIngredient[];
}

export interface MealPortionPlanResponse {
  id: string;
  tenantId: string;
  weekNumber: number;
  schoolYear: string;
  startDate: string;
  endDate: string;
  formattedDateRange: string;
  status: string;
  approvalStatus: string;
  approvedByName: string;
  approvedAtText: string;
  standardQuote: string;
  bannerQuote: string;
  isLocked: boolean;
  isPublishedToParents: boolean;
  isWarehouseExported: boolean;
  exportedAt?: string;
  kpis: PortionPlanKPIs;
  weeklyMenu: WeeklyDayData[];
  portionPlan: PortionPlanDetails;
  foodSafetySteps: FoodSafetyStep[];
  macroRatio: MacroRatio;
}
