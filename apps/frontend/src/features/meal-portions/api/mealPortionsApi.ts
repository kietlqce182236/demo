import { apiClient } from '../../../core/api/axios';
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
    success: boolean;
    message: string;
    isWarehouseExported: boolean;
    exportedAt: string;
  }> => {
    const res = await apiClient.post(`/meal-portions/${planId}/approve-warehouse-export`);
    return res.data;
  },

  getExportExcelUrl: (planId: string): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    return `${baseUrl}/meal-portions/${planId}/export-excel`;
  },
};
