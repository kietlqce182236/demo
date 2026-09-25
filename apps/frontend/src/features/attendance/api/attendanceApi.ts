import axios from 'axios';
import { AttendanceResponse, ClassItem, MealOption } from '../types';

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
};
