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

// ─── Quên & Đặt lại mật khẩu (OTP Email) ────────────────────────────────────────

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  expiresInSeconds?: number;
}

export interface VerifyResetOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyResetOtpResponse {
  success: boolean;
  message: string;
  resetToken: string;
  expiresInSeconds?: number;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Gửi yêu cầu OTP đặt lại mật khẩu về email.
 */
export async function forgotPasswordApi(
  request: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    '/auth/forgot-password',
    request,
  );
  return data;
}

/**
 * Xác thực mã OTP 6 số để nhận resetToken.
 */
export async function verifyResetOtpApi(
  request: VerifyResetOtpRequest,
): Promise<VerifyResetOtpResponse> {
  const { data } = await apiClient.post<VerifyResetOtpResponse>(
    '/auth/verify-reset-otp',
    request,
  );
  return data;
}

/**
 * Thiết lập mật khẩu mới bằng resetToken.
 */
export async function resetPasswordApi(
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>(
    '/auth/reset-password',
    request,
  );
  return data;
}

