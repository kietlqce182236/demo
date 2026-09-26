import axios from 'axios';
import { AttendanceResponse, ClassItem, MealOption, MealEvaluationResponse, PortionType } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': 'a0000000-0000-0000-0000-000000000001',
  },
});

export const attendanceApi = {
  getClasses: async (): Promise<ClassItem[]> => {
    const res = await api.get('/attendance/classes');
    return res.data;
  },

  getAttendanceList: async (params: {
    classId?: string;
    date?: string;
    mealFilter?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AttendanceResponse> => {
    const res = await api.get('/attendance', { params });
    return res.data;
  },

  updateChildAttendance: async (
    childId: string,
    data: {
      date: string;
      mealOption: MealOption;
      notes?: string;
    },
  ) => {
    const res = await api.put(`/attendance/child/${childId}`, data);
    return res.data;
  },

  markAllPresent: async (data: {
    classId: string;
    date: string;
    mealOption?: MealOption;
  }) => {
    const res = await api.post('/attendance/mark-all', data);
    return res.data;
  },

  syncFromMorning: async (data: {
    classId: string;
    date: string;
  }) => {
    const res = await api.post('/attendance/sync-morning', data);
    return res.data;
  },

  lockAndSendToKitchen: async (data: {
    classId: string;
    date: string;
    notes?: string;
  }) => {
    const res = await api.post('/attendance/lock-kitchen', data);
    return res.data;
  },

  // =========================================================================
  // UC62: ĐÁNH GIÁ MỨC ĐỘ ĂN CỦA TRẺ SAU BỮA API
  // =========================================================================

  getEvaluationList: async (params: {
    classId?: string;
    date?: string;
    mealType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<MealEvaluationResponse> => {
    const res = await api.get('/attendance/evaluation', { params });
    return res.data;
  },

  updateChildEvaluation: async (
    childId: string,
    data: {
      date: string;
      mealType?: string;
      portionConsumed: PortionType;
      waterIntake?: string;
      notes?: string;
      syncStatus?: string;
    },
  ) => {
    const res = await api.put(`/attendance/evaluation/child/${childId}`, data);
    return res.data;
  },

  batchUpdatePortion: async (data: {
    classId: string;
    date: string;
    mealType?: string;
    childIds?: string[];
    portionConsumed: PortionType;
  }) => {
    const res = await api.post('/attendance/evaluation/batch', data);
    return res.data;
  },

  updateSensoryEvaluation: async (data: {
    classId: string;
    date: string;
    mealType?: string;
    softnessScore?: number;
    temperatureScore?: number;
    excitementScore?: number;
    foodSafetyChecked?: boolean;
    chefFeedback?: string;
    isLocked?: boolean;
  }) => {
    const res = await api.put('/attendance/evaluation/sensory', data);
    return res.data;
  },

  lockAndSendEvaluation: async (data: {
    classId: string;
    date: string;
    mealType?: string;
    chefFeedback?: string;
  }) => {
    const res = await api.post('/attendance/evaluation/lock', data);
    return res.data;
  },

  // =========================================================================
  // UC63: XEM LỊCH SỬ ĐIỂM DANH VÀ SỨC ĂN
  // =========================================================================

  getHistoryList: async (params: {
    classId?: string;
    startDate?: string;
    endDate?: string;
    period?: 'week' | 'month' | 'semester' | 'custom';
    status?: string;
    search?: string;
    viewMode?: 'table' | 'by_child';
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get('/attendance/history', { params });
    return res.data;
  },

  // =========================================================================
  // VIEW & FILTER SNACK SERVICE ROSTER
  // =========================================================================

  getSnackRoster: async (params: {
    search?: string;
    gradeLevel?: string;
    classId?: string;
    date?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get('/snack-roster', { params });
    return res.data;
  },

  // =========================================================================
  // SYNC REAL-TIME MEAL PORTIONS (WEBSOCKET) - KDS APIS
  // =========================================================================

  getKitchenKdsData: async (date?: string) => {
    const res = await api.get('/attendance/kitchen-kds', { params: { date } });
    return res.data;
  },

  updateKitchenStatus: async (data: {
    classId: string;
    status: 'SYNCED' | 'PREPARING' | 'COMPLETED';
    actorName?: string;
  }) => {
    const res = await api.post('/attendance/kitchen/status', data);
    return res.data;
  },
};


