import { apiClient } from './axios';
import type { AuthUser, TenantInfo } from '../stores/auth.store';

// ─── Request/Response Types ────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TwoFaRequiredResponse {
  require2Fa: true;
  message: string;
}

export interface QuickLoginRequest {
  roleCode: string;
  tenantId: string;
}

export interface TenantsResponse {
  tenants: TenantInfo[];
}

export interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  tenantId: string;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  roles: Array<{ code: string; name: string }>;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

/**
 * Lấy danh sách trường mầm non đang hoạt động.
 * Endpoint public — không cần JWT.
 */
export async function fetchTenants(): Promise<TenantInfo[]> {
  const { data } = await apiClient.get<TenantsResponse>('/auth/tenants');
  return data.tenants;
}

/**
 * Đăng nhập bằng email + password.
 * Header x-tenant-id được tự động gắn bởi axios interceptor từ localStorage.
 */
export async function loginApi(
  request: LoginRequest,
): Promise<LoginResponse | TwoFaRequiredResponse> {
  const { data } = await apiClient.post<LoginResponse | TwoFaRequiredResponse>(
    '/auth/login',
    request,
  );
  return data;
}

/**
 * Đăng nhập nhanh theo role (dev-only).
 */
export async function quickLoginApi(
  request: QuickLoginRequest,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/quick-login', request);
  return data;
}

/**
 * Lấy thông tin user hiện tại (authenticated).
 */
export async function fetchCurrentUser(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/auth/me');
  return data;
}
