import { apiClient } from '../../../core/api/axios';

export interface NutritionRule {
  id: string;
  tenantId: string | null;
  name: string;
  targetAgeGroup: string;
  mealScope: string;
  minCaloriesKcal: number;
  maxCaloriesKcal: number;
  minProteinPercent: number;
  maxProteinPercent: number;
  minFatPercent: number;
  maxFatPercent: number;
  minCarbPercent: number;
  maxCarbPercent: number;
  minCalciumMg: number;
  minIronMg: number;
  minZincMg: number;
  maxSodiumMg: number | null;
  caPRatioMin: number;
  caPRatioMax: number;
  isStrict: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isSystemRule?: boolean;
  isDeleted?: boolean;
}

export interface AllergenCatalog {
  id: string;
  tenantId: string | null;
  code: string;
  nameVi: string;
  nameEn: string | null;
  commonFoods: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isSystemStandard?: boolean;
  isDeleted?: boolean;
}

export interface NutritionEngineStats {
  activeRulesCount: number;
  complianceRatePercent: number;
  nutritionWarningsCount: number;
  allergicChildrenCount: number;
  configuredAllergensCount: number;
}

export interface ScanViolationDetail {
  code: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: 'MACRO_NUTRIENT' | 'MICRO_NUTRIENT' | 'ALLERGEN' | 'REPETITION';
  title: string;
  message: string;
  recommendation: string;
  childInfo?: { id: string; name: string; className?: string; allergen: string };
  dishInfo?: { id: string; name: string; mealTime?: string };
}

export interface MenuScanResult {
  menuId: string;
  menuTitle: string;
  targetAgeGroup: string;
  appliedRuleName: string;
  complianceScore: number;
  overallStatus: 'PASS' | 'WARNING' | 'VIOLATION';
  summaryNutrition: {
    totalEnergyKcal: number;
    totalProteinG: number;
    totalLipidG: number;
    totalGlucidG: number;
    proteinCalories: number;
    lipidCalories: number;
    glucidCalories: number;
    proteinRatioPercent: number;
    lipidRatioPercent: number;
    glucidRatioPercent: number;
    calciumMg: number;
    ironMg: number;
    zincMg: number;
    caPRatio: number;
  };
  standardReference: {
    minEnergyKcal: number;
    maxEnergyKcal: number;
    minProteinPercent: number;
    maxProteinPercent: number;
    minFatPercent: number;
    maxFatPercent: number;
    minCarbPercent: number;
    maxCarbPercent: number;
  };
  violations: ScanViolationDetail[];
  actionableRecommendations: string[];
}

export interface CreateNutritionRulePayload {
  name: string;
  targetAgeGroup: string;
  mealScope?: string;
  minCaloriesKcal: number;
  maxCaloriesKcal: number;
  minProteinPercent: number;
  maxProteinPercent: number;
  minFatPercent: number;
  maxFatPercent: number;
  minCarbPercent: number;
  maxCarbPercent: number;
  minCalciumMg?: number;
  minIronMg?: number;
  minZincMg?: number;
  maxSodiumMg?: number;
  caPRatioMin?: number;
  caPRatioMax?: number;
  isStrict?: boolean;
  isActive?: boolean;
}

export interface UpdateNutritionRulePayload extends Partial<CreateNutritionRulePayload> {}

export interface CreateAllergenPayload {
  code: string;
  nameVi: string;
  nameEn?: string;
  commonFoods?: string;
  description?: string;
}

export interface UpdateAllergenPayload extends Partial<CreateAllergenPayload> {
  isActive?: boolean;
}

export interface EvaluateMenuPayload {
  menuId?: string;
  targetAgeGroup?: string;
  ruleId?: string;
  targetDate?: string;
}

export const nutritionEngineApi = {
  // --- QUY CHUẨN DINH DƯỠNG ---
  async getNutritionRules(params?: {
    targetAgeGroup?: string;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<NutritionRule[]> {
    const res = await apiClient.get<NutritionRule[]>('/nutrition-rules', { params });
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray((raw as any)?.items)) return (raw as any).items;
    if (Array.isArray((raw as any)?.data)) return (raw as any).data;
    return [];
  },

  async getNutritionStats(): Promise<NutritionEngineStats> {
    const res = await apiClient.get<NutritionEngineStats>('/nutrition-rules/stats');
    return res.data;
  },

  async syncRdaStandards(): Promise<{
    success: boolean;
    message: string;
    syncedCount: number;
    source: string;
    version: string;
    syncedAt: string;
  }> {
    const res = await apiClient.post('/nutrition-rules/sync-rda');
    return res.data?.data || res.data;
  },

  async getRuleById(id: string): Promise<NutritionRule> {
    const res = await apiClient.get<NutritionRule>(`/nutrition-rules/${id}`);
    return res.data;
  },

  async createNutritionRule(payload: CreateNutritionRulePayload): Promise<NutritionRule> {
    const res = await apiClient.post<NutritionRule>('/nutrition-rules', payload);
    return res.data;
  },

  async updateNutritionRule(id: string, payload: UpdateNutritionRulePayload): Promise<NutritionRule> {
    const res = await apiClient.put<NutritionRule>(`/nutrition-rules/${id}`, payload);
    return res.data;
  },

  async softDeleteNutritionRule(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/nutrition-rules/${id}`);
    return res.data;
  },

  async restoreNutritionRule(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.patch<{ success: boolean; message: string }>(
      `/nutrition-rules/${id}/restore`,
    );
    return res.data;
  },

  // --- QUY TẮC & DANH MỤC DỊ ỨNG ---
  async getAllergens(params?: { search?: string; includeDeleted?: boolean }): Promise<AllergenCatalog[]> {
    const res = await apiClient.get<AllergenCatalog[]>('/allergens', { params });
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray((raw as any)?.items)) return (raw as any).items;
    if (Array.isArray((raw as any)?.data)) return (raw as any).data;
    return [];
  },

  async createAllergen(payload: CreateAllergenPayload): Promise<AllergenCatalog> {
    const res = await apiClient.post<AllergenCatalog>('/allergens', payload);
    return res.data;
  },

  async updateAllergen(id: string, payload: UpdateAllergenPayload): Promise<AllergenCatalog> {
    const res = await apiClient.put<AllergenCatalog>(`/allergens/${id}`, payload);
    return res.data;
  },

  async softDeleteAllergen(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/allergens/${id}`);
    return res.data;
  },

  async restoreAllergen(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.patch<{ success: boolean; message: string }>(
      `/allergens/${id}/restore`,
    );
    return res.data;
  },

  // --- QUÉT & ĐÁNH GIÁ THỰC ĐƠN BẰNG RULE ENGINE ---
  async evaluateMenu(payload: EvaluateMenuPayload): Promise<MenuScanResult> {
    const res = await apiClient.post<MenuScanResult>('/rule-engine/evaluate-menu', payload);
    return res.data;
  },
};
