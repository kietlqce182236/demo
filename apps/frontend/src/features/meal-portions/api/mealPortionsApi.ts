import axios from 'axios';
import { MealPortionPlanResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': 'a0000000-0000-0000-0000-000000000001',
  },
});

export const mealPortionsApi = {
  getWeeklyPlan: async (params?: {
    weekNumber?: number;
    schoolYear?: string;
  }): Promise<MealPortionPlanResponse> => {
    const res = await api.get('/meal-portions', { params });
    return res.data;
  },

  approveWarehouseExport: async (planId: string): Promise<{
    success: boolean;
    message: string;
    isWarehouseExported: boolean;
    exportedAt: string;
  }> => {
    const res = await api.post(`/meal-portions/${planId}/approve-warehouse-export`);
    return res.data;
  },

  getExportExcelUrl: (planId: string): string => {
    return `${API_BASE_URL}/meal-portions/${planId}/export-excel`;
  },
};
