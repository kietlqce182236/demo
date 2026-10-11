import { create } from 'zustand';

/**
 * Auth User — dữ liệu user nhận từ API login response.
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: string[];
  tenantId: string;
}

/**
 * Tenant — dữ liệu trường mầm non cho dropdown.
 */
export interface TenantInfo {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface AuthState {
  /** User hiện tại (null nếu chưa login) */
  user: AuthUser | null;
  /** JWT access token */
  accessToken: string | null;
  /** JWT refresh token */
  refreshToken: string | null;
  /** Tenant UUID đang chọn */
  selectedTenantId: string | null;
  /** Computed: user !== null */
  isAuthenticated: boolean;

  /** Lưu kết quả login vào state + localStorage */
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  /** Chọn tenant cho login */
  setTenantId: (tenantId: string) => void;
  /** Xóa toàn bộ auth state + localStorage */
  logout: () => void;
  /** Hydrate từ localStorage khi app khởi động */
  hydrate: () => void;
}

/**
 * Zustand Auth Store — Quản lý trạng thái xác thực.
 *
 * Performance:
 * - Chỉ lưu token + user info tối thiểu trong memory.
 * - localStorage chỉ write khi login/logout (không mỗi render).
 * - hydrate() gọi 1 lần duy nhất khi app mount.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  selectedTenantId: null,
  isAuthenticated: false,

  setAuth: (user, accessToken, refreshToken) => {
    // Persist vào localStorage
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('tenant_id', user.tenantId);
    localStorage.setItem('auth_user', JSON.stringify(user));

    set({
      user,
      accessToken,
      refreshToken,
      selectedTenantId: user.tenantId,
      isAuthenticated: true,
    });
  },

  setTenantId: (tenantId) => {
    localStorage.setItem('tenant_id', tenantId);
    set({ selectedTenantId: tenantId });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('auth_user');

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      selectedTenantId: null,
      isAuthenticated: false,
    });
  },

  hydrate: () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const tenantId = localStorage.getItem('tenant_id');
    const userJson = localStorage.getItem('auth_user');

    if (
      accessToken &&
      accessToken !== 'undefined' &&
      accessToken !== 'null' &&
      userJson
    ) {
      try {
        const user = JSON.parse(userJson) as AuthUser;
        set({
          user,
          accessToken,
          refreshToken,
          selectedTenantId: tenantId || '1',
          isAuthenticated: true,
        });
      } catch {
        // JSON parse lỗi → reset
        localStorage.removeItem('auth_user');
      }
    } else if (accessToken === 'undefined' || accessToken === 'null') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
    }
  },
}));
