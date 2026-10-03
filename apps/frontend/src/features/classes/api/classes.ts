import { apiClient } from '../../../core/api/axios';
import { ClassData, ClassFilters } from '../types';

export const classesApi = {
  getClasses: async (filters: ClassFilters) => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    const { data } = await apiClient.get('/classes', { params: cleanedFilters });
    return data;
  },

  getClass: async (id: string) => {
    const { data } = await apiClient.get(`/classes/${id}`);
    return data;
  },

  createClass: async (payload: Partial<ClassData>) => {
    const { data } = await apiClient.post('/classes', payload);
    return data;
  },

  updateClass: async (id: string, payload: Partial<ClassData>) => {
    const { data } = await apiClient.patch(`/classes/${id}`, payload);
    return data;
  },
};
