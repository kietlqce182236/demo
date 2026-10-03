import { apiClient } from '../../../core/api/axios';

export interface DishItem {
  id: string;
  name: string;
  dishType: string;
  targetAgeGroup: string;
  standardServingSizeG: number;
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbG: number;
  photoUrl?: string | null;
  isActive: boolean;
  recipeItems?: Array<{
    id: string;
    foodId: string;
    netWeightPerPortionG: number;
    grossWeightPerPortionG?: number;
    shrinkageRatio?: number;
    prepNotes?: string;
    food?: {
      id: string;
      code: string;
      name: string;
      category: string;
      energyKcal: number;
      proteinG: number;
      fatG: number;
      carbG: number;
      calciumMg?: number;
      ironMg?: number;
      zincMg?: number;
      allergens?: string[];
      defaultUnit?: string;
    };
  }>;
}

export interface MenuDishItem {
  id: string;
  tenantId: string;
  menuId: string;
  dishId: string;
  dayOfWeek: number; // 1 = T2, 2 = T3, 3 = T4, 4 = T5, 5 = T6
  mealTime: string; // BREAKFAST, MORNING_SNACK, LUNCH, AFTERNOON_SNACK, LATE_SNACK
  servingOrder: number;
  portionSizeG: number;
  plannedCalories: number;
  substituteDishId?: string | null;
  specialDietNotes?: string | null;
  deletedAt?: string | null;
  dish?: DishItem;
  substituteDish?: DishItem | null;
}

export interface WeeklyMenu {
  id: string;
  tenantId: string;
  title: string;
  menuCycleType: string;
  targetAgeGroup: string;
  startDate: string;
  endDate: string;
  cycleWeekNumber: number;
  status: 'DRAFT' | 'SUBMITTED_FOR_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'ARCHIVED';
  createdBy: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvalNotes?: string | null;
  rejectionReason?: string | null;
  editRequestStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  editRequestReason?: string | null;
  editRequestAt?: string | null;
  editRequestBy?: string | null;
  editRequestResponseNotes?: string | null;
  editRequestRespondedAt?: string | null;
  version: number;
  parentMenuId?: string | null;
  dailyAverageCalories: number;
  dailyAverageProteinG: number;
  dailyAverageFatG: number;
  dailyAverageCarbG: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  menuDishes?: MenuDishItem[];
  parentMenu?: WeeklyMenu | null;
}

export interface MenuStatistics {
  total: number;
  active: number;
  submitted: number;
  draft: number;
  rejected: number;
  approved: number;
  avgCalories: number;
  nutritionStandard: string;
}

export interface CreateMenuPayload {
  title: string;
  menuCycleType?: string;
  targetAgeGroup?: string;
  startDate: string;
  endDate: string;
  cycleWeekNumber?: number;
  parentMenuId?: string;
  dishes?: Array<{
    dayOfWeek: number;
    mealTime: string;
    dishId: string;
    portionSizeG?: number;
    substituteDishId?: string;
  }>;
}

export interface AdjustDishPayload {
  dayOfWeek: number;
  mealTime: string;
  dishId: string;
  portionSizeG?: number;
  substituteDishId?: string;
  specialDietNotes?: string;
}

export interface ImportExcelPayload {
  title: string;
  startDate: string;
  endDate: string;
  targetAgeGroup?: string;
  cycleWeekNumber?: number;
  items: Array<{
    dayOfWeek: number;
    mealTime: string;
    dishName: string;
    dishType?: string;
    portionSizeG?: number;
    calories?: number;
  }>;
}

export interface AutoGeneratePayload {
  title?: string;
  targetAgeGroup?: string;
  startDate: string;
  endDate: string;
  daysCount?: number;
  cycleWeekNumber?: number;
  excludePreviousDays?: number;
  referenceMenuId?: string;
  includeBreakfast?: boolean;
  previewOnly?: boolean;
}

export interface AutoGeneratePreviewResponse {
  previewOnly: boolean;
  title: string;
  targetAgeGroup: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  dailySummary: Array<{
    dayOfWeek: number;
    dayName: string;
    totalCalories: number;
    totalProteinG: number;
    totalFatG: number;
    totalCarbG: number;
    proteinPct: number;
    lipidPct: number;
    glucidPct: number;
    isCompliant: boolean;
    standardNote: string;
    dishes: Array<{
      dishId: string;
      dishName: string;
      dishType: string;
      mealTime: string;
      servingOrder: number;
      portionSizeG: number;
      plannedCalories: number;
      proteinG: number;
      fatG: number;
      carbG: number;
    }>;
  }>;
  averageCalories: number;
  averageProteinG: number;
  averageFatG: number;
  averageCarbG: number;
  antiFatigueReport: {
    totalDishesUsed: number;
    uniqueDishesUsed: number;
    duplicateWithinMenuCount: number;
    overlappedWithPrevious14DaysCount: number;
    cycleCompliance: string;
    standardEvaluation: string;
  };
}

export interface ExportDataResponse {
  schoolName: string;
  title: string;
  version: string;
  targetAgeGroupVi: string;
  dateRange: string;
  cycleWeekNumber: number;
  statusVi: string;
  dailyAverageCalories: number;
  dailyAverageProteinG: number;
  dailyAverageFatG: number;
  dailyAverageCarbG: number;
  plgRatio: string;
  standardCompliance: string;
  rows: Array<{
    mealTimeVi: string;
    mealTimeCode: string;
    mondayDishes: string;
    tuesdayDishes: string;
    wednesdayDishes: string;
    thursdayDishes: string;
    fridayDishes: string;
  }>;
  preparedBy: string;
  approvedBy: string;
  approvedDate: string;
}

export const weeklyMenusApi = {
  // 1. Lấy danh sách thực đơn
  async getMenus(params?: {
    search?: string;
    status?: string;
    targetAgeGroup?: string;
    version?: number;
    includeDeleted?: boolean;
  }): Promise<WeeklyMenu[]> {
    const res = await apiClient.get('/menus', { params });
    return res.data;
  },

  // 2. Thống kê KPI
  async getStatistics(): Promise<MenuStatistics> {
    const res = await apiClient.get('/menus/statistics');
    return res.data;
  },

  // 3. Món ăn trong kho
  async getAvailableDishes(): Promise<DishItem[]> {
    const res = await apiClient.get('/menus/available-dishes');
    return res.data;
  },

  // 4. Chi tiết thực đơn tuần
  async getMenuById(id: string): Promise<WeeklyMenu> {
    const res = await apiClient.get(`/menus/${id}`);
    return res.data;
  },

  // 5. Danh sách phiên bản
  async getMenuVersions(id: string): Promise<WeeklyMenu[]> {
    const res = await apiClient.get(`/menus/${id}/versions`);
    return res.data;
  },

  // 6. Tạo thực đơn thủ công
  async createMenu(payload: CreateMenuPayload): Promise<WeeklyMenu> {
    const res = await apiClient.post('/menus', payload);
    return res.data;
  },

  // 7. Import thực đơn từ Excel
  async importExcel(payload: ImportExcelPayload): Promise<WeeklyMenu> {
    const res = await apiClient.post('/menus/import-excel', payload);
    return res.data;
  },

  // 8. Tạo phiên bản mới (v1.1, v2.0...)
  async createVersion(id: string): Promise<WeeklyMenu> {
    const res = await apiClient.post(`/menus/${id}/create-version`);
    return res.data;
  },

  // 9. Cập nhật thông tin thực đơn
  async updateMenu(id: string, payload: Partial<CreateMenuPayload>): Promise<WeeklyMenu> {
    const res = await apiClient.put(`/menus/${id}`, payload);
    return res.data;
  },

  // 10. Tinh chỉnh món ăn
  async adjustDish(menuId: string, payload: AdjustDishPayload): Promise<MenuDishItem> {
    const res = await apiClient.post(`/menus/${menuId}/adjust-dish`, payload);
    return res.data;
  },

  // 11. Xóa món ăn khỏi bữa ăn (Xóa mềm)
  async removeDish(menuId: string, menuDishId: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/menus/${menuId}/dishes/${menuDishId}`);
    return res.data;
  },

  // 12. Gửi duyệt
  async submitForReview(id: string): Promise<WeeklyMenu> {
    const res = await apiClient.post(`/menus/${id}/submit`);
    return res.data;
  },

  // 13. Phê duyệt (BGH)
  async approveMenu(id: string, approvalNotes?: string): Promise<WeeklyMenu> {
    const res = await apiClient.post(`/menus/${id}/approve`, { approvalNotes });
    return res.data;
  },

  // 14. Từ chối (BGH)
  async rejectMenu(id: string, rejectionReason: string): Promise<WeeklyMenu> {
    const res = await apiClient.post(`/menus/${id}/reject`, { rejectionReason });
    return res.data;
  },

  // 15. Khóa & Công bố
  async publishMenu(id: string): Promise<WeeklyMenu> {
    const res = await apiClient.post(`/menus/${id}/publish`);
    return res.data;
  },

  // 16. Xóa mềm
  async softDeleteMenu(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/menus/${id}`);
    return res.data;
  },

  // 17. Khôi phục
  async restoreMenu(id: string): Promise<WeeklyMenu> {
    const res = await apiClient.post(`/menus/${id}/restore`);
    return res.data;
  },

  // 18. Lấy dữ liệu in ấn A4
  async getExportData(id: string): Promise<ExportDataResponse> {
    const res = await apiClient.get(`/menus/${id}/export/data`);
    return res.data;
  },

  // 19. Tải file Excel/CSV
  async downloadExcel(id: string, fileName?: string): Promise<void> {
    const res = await apiClient.get(`/menus/${id}/export/excel`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `Thuc_don_tuan_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // 20. Tự động sinh thực đơn (Lưu vào DB)
  async autoGenerateMenu(payload: AutoGeneratePayload): Promise<WeeklyMenu> {
    const res = await apiClient.post<WeeklyMenu>('/menus/auto-generate', {
      ...payload,
      previewOnly: false,
    });
    return res.data;
  },

  // 21. Xem trước ma trận thực đơn tự động sinh
  async previewAutoGenerateMenu(payload: AutoGeneratePayload): Promise<AutoGeneratePreviewResponse> {
    const res = await apiClient.post<AutoGeneratePreviewResponse>('/menus/auto-generate', {
      ...payload,
      previewOnly: true,
    });
    return res.data;
  },

  // 22. Lấy tư vấn cảnh báo Dị ứng học sinh & Cá nhân hóa Dinh dưỡng theo BMI
  async getAdvisory(menuId: string): Promise<MenuAdvisoryResponse> {
    const res = await apiClient.get<MenuAdvisoryResponse>(`/menus/${menuId}/advisory`);
    return res.data;
  },

  // 23. Gán hoặc hủy món ăn thay thế an toàn cho ô món ăn trong thực đơn
  async applySubstitute(
    menuId: string,
    menuDishId: string,
    substituteDishId: string | null,
    notes?: string,
  ): Promise<MenuDishItem> {
    const res = await apiClient.post<MenuDishItem>(
      `/menus/${menuId}/dishes/${menuDishId}/apply-substitute`,
      { substituteDishId, notes },
    );
    return res.data;
  },

  // 24. Chuyên viên Dinh dưỡng xin phép Hiệu trưởng chỉnh sửa thực đơn đã duyệt
  async requestEditMenu(id: string, reason: string): Promise<WeeklyMenu> {
    const res = await apiClient.post<WeeklyMenu>(`/menus/${id}/request-edit`, { reason });
    return res.data;
  },

  // 25. Hiệu trưởng chấp thuận yêu cầu chỉnh sửa (mở khóa về DRAFT)
  async approveEditRequest(id: string, notes?: string): Promise<WeeklyMenu> {
    const res = await apiClient.post<WeeklyMenu>(`/menus/${id}/approve-edit-request`, { notes });
    return res.data;
  },

  // 26. Hiệu trưởng từ chối yêu cầu chỉnh sửa
  async rejectEditRequest(id: string, reason: string): Promise<WeeklyMenu> {
    const res = await apiClient.post<WeeklyMenu>(`/menus/${id}/reject-edit-request`, { reason });
    return res.data;
  },

  // 27. Hủy yêu cầu xin phép chỉnh sửa
  async cancelEditRequest(id: string): Promise<WeeklyMenu> {
    const res = await apiClient.post<WeeklyMenu>(`/menus/${id}/cancel-edit-request`);
    return res.data;
  },
};

export interface ProblematicIngredient {
  foodId: string;
  foodName: string;
  netWeightPerPortionG: number;
  allergens?: string[];
}

export interface SuggestedIngredientSubstitution {
  originalIngredient: string;
  substituteIngredient: string;
  suggestedGram: number;
  nutritionNote: string;
  preparationAdvice: string;
}

export interface SuggestedSubstituteDish {
  dishId: string;
  dishName: string;
  dishType: string;
  standardServingSizeG: number;
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbG: number;
  ingredientsSummary: string;
}

export interface AllergyConflictItem {
  conflictId: string;
  childId: string;
  childName: string;
  avatarUrl?: string | null;
  classId: string;
  className: string;
  allergenDetected: string;
  allergenCode?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLACTIC';
  reactionTreatment?: string | null;
  menuDishId: string;
  dishId: string;
  dishName: string;
  dishType: string;
  dayOfWeek: number;
  mealTime: string;
  portionSizeG: number;
  plannedCalories: number;
  substituteDishId?: string | null;
  currentSubstituteDishName?: string | null;
  problematicIngredients: ProblematicIngredient[];
  suggestedIngredientSubstitutions: SuggestedIngredientSubstitution[];
  suggestedSubstituteDishes: SuggestedSubstituteDish[];
}

export interface BmiChildItem {
  childId: string;
  childName: string;
  className: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  baz: number;
  classification: string;
  statusText: string;
  healthNotes?: string | null;
}

export interface BmiSubstituteDishRecommendation {
  dishId: string;
  dishName: string;
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  reason: string;
}

export interface BmiRecommendationGroup {
  label: string;
  count: number;
  severity: 'WARNING' | 'CRITICAL';
  clinicalStrategy: string;
  portionAdvice: string;
  children: BmiChildItem[];
  recommendedSubstituteDishes: BmiSubstituteDishRecommendation[];
}

export interface MenuAdvisoryResponse {
  menuId: string;
  menuTitle: string;
  targetAgeGroup: string;
  allergySummary: {
    totalConflicts: number;
    criticalCount: number;
    warningCount: number;
    affectedChildrenCount: number;
    affectedDishesCount: number;
  };
  allergyConflicts: AllergyConflictItem[];
  bmiSummary: {
    totalEvaluated: number;
    overweightObeseCount: number;
    wastedUnderweightCount: number;
    normalCount: number;
  };
  bmiRecommendations: {
    overweightGroup: BmiRecommendationGroup;
    wastedGroup: BmiRecommendationGroup;
  };
}
