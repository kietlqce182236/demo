import axios from 'axios';
import {
  MealCoordinationData,
  CoordinationQueryParams,
  CreateCoordinationNotePayload,
  UpdateCoordinationNotePayload,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': 'a0000000-0000-0000-0000-000000000001',
  },
});

export const coordinationApi = {
  getCoordinationNotes: async (params?: CoordinationQueryParams): Promise<MealCoordinationData> => {
    const res = await api.get('/attendance/coordination-notes', { params });
    return res.data;
  },

  createCoordinationNote: async (data: CreateCoordinationNotePayload) => {
    const res = await api.post('/attendance/coordination-notes', data);
    return res.data;
  },

  updateCoordinationNote: async (id: string, data: UpdateCoordinationNotePayload) => {
    const res = await api.put(`/attendance/coordination-notes/${id}`, data);
    return res.data;
  },

  acknowledgeCoordinationNote: async (
    id: string,
    data: { acknowledgedBy?: string; kitchenResponse?: string },
  ) => {
    const res = await api.post(`/attendance/coordination-notes/${id}/acknowledge`, data);
    return res.data;
  },

  resolveCoordinationNote: async (id: string, data: { resolutionNote?: string }) => {
    const res = await api.post(`/attendance/coordination-notes/${id}/resolve`, data);
    return res.data;
  },

  deleteCoordinationNote: async (id: string) => {
    const res = await api.delete(`/attendance/coordination-notes/${id}`);
    return res.data;
  },
};
