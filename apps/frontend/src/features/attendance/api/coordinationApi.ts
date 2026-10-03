import { apiClient } from '../../../core/api/axios';
import {
  MealCoordinationData,
  CoordinationQueryParams,
  CreateCoordinationNotePayload,
  UpdateCoordinationNotePayload,
} from '../types';

export const coordinationApi = {
  getCoordinationNotes: async (params?: CoordinationQueryParams): Promise<MealCoordinationData> => {
    const res = await apiClient.get('/attendance/coordination-notes', { params });
    return res.data;
  },

  createCoordinationNote: async (data: CreateCoordinationNotePayload) => {
    const res = await apiClient.post('/attendance/coordination-notes', data);
    return res.data;
  },

  updateCoordinationNote: async (id: string, data: UpdateCoordinationNotePayload) => {
    const res = await apiClient.put(`/attendance/coordination-notes/${id}`, data);
    return res.data;
  },

  acknowledgeCoordinationNote: async (
    id: string,
    data: { acknowledgedBy?: string; kitchenResponse?: string },
  ) => {
    const res = await apiClient.post(`/attendance/coordination-notes/${id}/acknowledge`, data);
    return res.data;
  },

  resolveCoordinationNote: async (id: string, data: { resolutionNote?: string }) => {
    const res = await apiClient.post(`/attendance/coordination-notes/${id}/resolve`, data);
    return res.data;
  },

  deleteCoordinationNote: async (id: string) => {
    const res = await apiClient.delete(`/attendance/coordination-notes/${id}`);
    return res.data;
  },
};
