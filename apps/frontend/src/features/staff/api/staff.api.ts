import { apiClient } from '../../../core/api/axios';

export interface StaffRole {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface StaffUser {
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
  roles: StaffRole[];
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  teachers: number;
  kitchenAndNutrition: number;
  medicalStaff: number;
  inactiveOrDeleted: number;
}

export interface StaffListResponse {
  data: StaffUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateStaffPayload {
  email: string;
  fullName: string;
  phone?: string;
  roleCode?: string;
  roleCodes?: string[];
  staffType?: string;
  password?: string;
  status?: string;
}

export interface UpdateStaffPayload {
  fullName?: string;
  phone?: string;
  roleCode?: string;
  roleCodes?: string[];
  staffType?: string;
  status?: string;
  newPassword?: string;
}

export interface QueryStaffParams {
  search?: string;
  roleCode?: string;
  staffType?: string;
  status?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const staffApi = {
  /**
   * Lấy danh sách nhân sự kèm tìm kiếm, lọc và phân trang
   */
  async getStaffList(params?: QueryStaffParams): Promise<any> {
    const res = await apiClient.get('/users/staff', {
      params: {
        ...params,
        staffType: params?.staffType || params?.roleCode,
      },
    });
    return res.data;
  },

  /**
   * Lấy thống kê số lượng nhân sự các danh mục (KPI cards)
   */
  async getStaffStats(): Promise<StaffStats> {
    const res = await apiClient.get<StaffStats>('/users/staff/stats');
    return res.data;
  },

  /**
   * Lấy danh sách các vai trò nhân sự trong trường
   */
  async getStaffRoles(): Promise<StaffRole[]> {
    const res = await apiClient.get<StaffRole[]>('/users/staff/roles');
    return res.data;
  },

  /**
   * Xem thông tin chi tiết 1 nhân sự
   */
  async getStaffById(id: string): Promise<StaffUser> {
    const res = await apiClient.get<StaffUser>(`/users/staff/${id}`);
    return res.data;
  },

  /**
   * Tạo mới nhân sự và gán vai trò
   */
  async createStaff(payload: CreateStaffPayload): Promise<StaffUser & { initialPassword?: string }> {
    const res = await apiClient.post<StaffUser & { initialPassword?: string }>('/users/staff', payload);
    return res.data;
  },

  /**
   * Cập nhật thông tin và vai trò nhân sự
   */
  async updateStaff(id: string, payload: UpdateStaffPayload): Promise<StaffUser> {
    const res = await apiClient.put<StaffUser>(`/users/staff/${id}`, payload);
    return res.data;
  },

  /**
   * Xóa mềm (Soft Delete) nhân sự
   */
  async softDeleteStaff(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/users/staff/${id}`);
    return res.data;
  },

  /**
   * Khôi phục nhân sự đã xóa mềm
   */
  async restoreStaff(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.patch<{ success: boolean; message: string }>(`/users/staff/${id}/restore`);
    return res.data;
  },

  /**
   * Đổi trạng thái tài khoản (ACTIVE <-> INACTIVE)
   */
  async toggleStaffStatus(id: string): Promise<{ success: boolean; status: string; message: string }> {
    const res = await apiClient.patch<{ success: boolean; status: string; message: string }>(
      `/users/staff/${id}/status`,
    );
    return res.data;
  },
};
