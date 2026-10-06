import { apiClient } from '../../../core/api/axios';

export interface LinkedChild {
  id: string;
  studentCode: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  className: string;
}

export interface ParentUser {
  id: string;
  tenantId: string | null;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDeleted: boolean;
  children: LinkedChild[];
}

export interface ParentStats {
  totalParents: number;
  activeParents: number;
  parentsWithChildren: number;
  inactiveOrDeleted: number;
}

export interface ParentListResponse {
  data: ParentUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateParentPayload {
  email: string;
  fullName: string;
  phone?: string;
  password?: string;
  status?: string;
  childIds?: string[];
}

export interface UpdateParentPayload {
  fullName?: string;
  phone?: string;
  status?: string;
  newPassword?: string;
  childIds?: string[];
}

export interface QueryParentParams {
  search?: string;
  status?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const parentsApi = {
  async getParents(params?: QueryParentParams): Promise<ParentListResponse> {
    const res = await apiClient.get<ParentListResponse>('/users/parents', { params });
    return res.data;
  },

  async getStats(): Promise<ParentStats> {
    const res = await apiClient.get<ParentStats>('/users/parents/stats');
    return res.data;
  },

  async createParent(payload: CreateParentPayload) {
    const res = await apiClient.post('/users/parents', payload);
    return res.data;
  },

  async updateParent(id: string, payload: UpdateParentPayload) {
    const res = await apiClient.put(`/users/parents/${id}`, payload);
    return res.data;
  },

  async deleteParent(id: string) {
    const res = await apiClient.delete(`/users/parents/${id}`);
    return res.data;
  },

  async restoreParent(id: string) {
    const res = await apiClient.post(`/users/parents/${id}/restore`);
    return res.data;
  },
};
