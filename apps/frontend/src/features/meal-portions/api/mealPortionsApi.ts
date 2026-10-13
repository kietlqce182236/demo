import { apiClient, API_BASE_URL } from '../../../core/api/axios';
import { MealPortionPlanResponse } from '../types';

export const mealPortionsApi = {
  getWeeklyPlan: async (params?: {
    weekNumber?: number;
    schoolYear?: string;
  }): Promise<MealPortionPlanResponse> => {
    const res = await apiClient.get('/meal-portions', { params });
    return res.data;
  },

  approveWarehouseExport: async (planId: string): Promise<{
    message: string;
    isWarehouseExported: boolean;
    exportedAt: string;
  }> => {
    const res = await apiClient.post(`/meal-portions/${planId}/approve-warehouse-export`);
    return res.data;
  },

  getExportExcelUrl: (planId: string): string => {
    return `${API_BASE_URL}/meal-portions/${planId}/export-excel`;
  },
};
