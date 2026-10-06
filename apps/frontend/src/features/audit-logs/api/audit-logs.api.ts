import { apiClient } from '../../../core/api/axios';

export interface AuditLogItem {
  id: string;
  tenantId: string | null;
  userId: string;
  userEmail: string | null;
  action: string;
  targetEntity: string | null;
  targetId: string | null;
  ipAddress: string | null;
  details: any;
  createdAt: string;
}

export interface AuditLogsResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogsFilterOptions {
  actions: string[];
  targetEntities: string[];
}

export interface AuditLogsStats {
  totalLogs: number;
  todayLogs: number;
}

export interface QueryAuditLogsParams {
  search?: string;
  action?: string;
  targetEntity?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const auditLogsApi = {
  async getAuditLogs(params?: QueryAuditLogsParams): Promise<AuditLogsResponse> {
    const res = await apiClient.get<AuditLogsResponse>('/audit-logs', { params });
    return res.data;
  },

  async getFilterOptions(): Promise<AuditLogsFilterOptions> {
    const res = await apiClient.get<AuditLogsFilterOptions>('/audit-logs/filters');
    return res.data;
  },

  async getStats(): Promise<AuditLogsStats> {
    const res = await apiClient.get<AuditLogsStats>('/audit-logs/stats');
    return res.data;
  },
};
