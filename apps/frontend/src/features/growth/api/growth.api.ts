import { apiClient } from '../../../core/api/axios';

export interface GrowthRecordItem {
  id: string;
  tenantId: string;
  childId: string;
  child: {
    id: string;
    fullName: string;
    studentCode: string;
    gender: 'MALE' | 'FEMALE';
    dateOfBirth: string;
    class?: {
      id: string;
      name: string;
    };
  };
  measurementDate: string;
  ageInMonths: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  waz: number;
  haz: number;
  baz: number;
  weightClassification: string;
  heightClassification: string;
  bmiClassification: string;
  overallNutritionalStatus: string;
  healthNotes?: string;
  createdAt: string;
}

export interface CreateGrowthDto {
  childId: string;
  measurementDate: string;
  weightKg: number;
  heightCm: number;
  healthNotes?: string;
}

export interface ClassGrowthOverview {
  totalStudents: number;
  evaluatedCount: number;
  normalCount: number;
  stuntedCount: number;
  underweightCount: number;
  overweightCount: number;
  normalPercent: number;
  stuntedPercent: number;
  underweightPercent: number;
  overweightPercent: number;
}

export const growthApi = {
  getRecords: async (params?: {
    childId?: string;
    classId?: string;
    nutritionalStatus?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<{ items: GrowthRecordItem[]; total: number }>('/growth', {
      params,
    });
    return res.data;
  },

  getChildHistory: async (childId: string) => {
    const res = await apiClient.get<{
      child: any;
      latest: GrowthRecordItem | null;
      history: GrowthRecordItem[];
    }>(`/growth/child/${childId}`);
    return res.data;
  },

  getClassOverview: async (classId: string): Promise<ClassGrowthOverview> => {
    const res = await apiClient.get<ClassGrowthOverview>(`/growth/class/${classId}/overview`);
    return res.data;
  },

  createRecord: async (dto: CreateGrowthDto): Promise<GrowthRecordItem> => {
    const res = await apiClient.post<GrowthRecordItem>('/growth', dto);
    return res.data;
  },

  updateRecord: async (id: string, dto: Partial<CreateGrowthDto>): Promise<{ success: boolean; message: string; data: GrowthRecordItem }> => {
    const res = await apiClient.put(`/growth/${id}`, dto);
    return res.data;
  },

  deleteRecord: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/growth/${id}`);
    return res.data;
  },

  importRecords: async (items: any[]): Promise<{ success: boolean; importedCount: number; errors: string[] }> => {
    const res = await apiClient.post('/growth/import', { items });
    return res.data;
  },

  exportReport: async (classId?: string): Promise<{ totalRecords: number; items: any[] }> => {
    const res = await apiClient.get('/growth/export', { params: { classId } });
    return res.data;
  },
};
