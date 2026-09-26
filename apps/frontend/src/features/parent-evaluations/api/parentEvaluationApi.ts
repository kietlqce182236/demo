import axios from 'axios';
import {
  ParentEvaluationQueryParams,
  ParentEvaluationResponse,
  ParentEvaluationItem,
  RespondEvaluationPayload,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': 'a0000000-0000-0000-0000-000000000001',
  },
});

export const parentEvaluationApi = {
  getEvaluations: async (params: ParentEvaluationQueryParams): Promise<ParentEvaluationResponse> => {
    const res = await api.get('/parent-evaluations', { params });
    return res.data;
  },

  respondToEvaluation: async (
    id: string,
    payload: RespondEvaluationPayload,
  ): Promise<ParentEvaluationItem> => {
    const res = await api.post(`/parent-evaluations/${id}/respond`, payload);
    return res.data;
  },

  updateResponse: async (
    id: string,
    payload: RespondEvaluationPayload,
  ): Promise<ParentEvaluationItem> => {
    const res = await api.put(`/parent-evaluations/${id}/respond`, payload);
    return res.data;
  },

  toggleDraft: async (id: string, isDrafting: boolean): Promise<ParentEvaluationItem> => {
    const res = await api.put(`/parent-evaluations/${id}/draft`, { isDrafting });
    return res.data;
  },

  getPortalData: async (childId?: string) => {
    const res = await api.get('/parent-evaluations/portal-data', {
      params: childId ? { childId } : undefined,
    });
    return res.data;
  },

  submitEvaluation: async (payload: any) => {
    const res = await api.post('/parent-evaluations/submit', payload);
    return res.data;
  },
};
