import { apiClient } from './axios';

export interface UserRoleInfo {
  id: string;
  code: string;
  name: string;
}

export interface TenantSimpleInfo {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  contactEmail: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  status: string;
  twoFactorEnabled: boolean;
  roles: UserRoleInfo[];
  tenantId: string | null;
  tenant: TenantSimpleInfo | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpAuthUrl: string;
  qrCodeDataUrl: string;
  message: string;
}

export interface TwoFactorEnableResponse {
  message: string;
  twoFactorEnabled: boolean;
  recoveryCodes: string[];
}

export const userProfileApi = {
  /**
   * Lấy hồ sơ cá nhân của người dùng hiện tại (áp dụng cho mọi role)
   */
  getMyProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>('/users/profile');
    return res.data;
  },

  /**
   * Cập nhật thông tin cá nhân (họ tên, số điện thoại, avatar)
   */
  updateMyProfile: async (data: UpdateProfileInput): Promise<UserProfile> => {
    const res = await apiClient.patch<UserProfile>('/users/profile', data);
    return res.data;
  },

  /**
   * Đổi mật khẩu tài khoản
   */
  changePassword: async (data: ChangePasswordInput): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/users/change-password', data);
    return res.data;
  },

  /**
   * Khởi tạo thiết lập 2FA (nhận mã QR & secret)
   */
  setup2FA: async (): Promise<TwoFactorSetupResponse> => {
    const res = await apiClient.post<TwoFactorSetupResponse>('/users/2fa/setup');
    return res.data;
  },

  /**
   * Kích hoạt 2FA bằng mã OTP 6 số
   */
  enable2FA: async (code: string): Promise<TwoFactorEnableResponse> => {
    const res = await apiClient.post<TwoFactorEnableResponse>('/users/2fa/enable', { code });
    return res.data;
  },

  /**
   * Hủy kích hoạt 2FA
   */
  disable2FA: async (code: string): Promise<{ message: string; twoFactorEnabled: boolean }> => {
    const res = await apiClient.post('/users/2fa/disable', { code });
    return res.data;
  },
};
