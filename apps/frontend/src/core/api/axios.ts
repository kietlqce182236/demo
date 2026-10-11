import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return '/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm Tenant ID và Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Tenant ID từ LocalStorage hoặc Env (Mặc định 1: Trường Mầm non Hướng Dương)
    const tenantId = localStorage.getItem('tenant_id') || import.meta.env.VITE_DEFAULT_TENANT_ID || '1';
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }

    // 2. JWT Access Token (bảo đảm không gửi chuỗi 'undefined' hoặc 'null')
    const token = localStorage.getItem('access_token');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Tự động quay vòng (Refresh Token) khi gặp lỗi 401 Unauthorized
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Tự động bóc tách Response Envelope { success: true, data: T, meta: ... } của NestJS TransformInterceptor
    if (
      response?.data &&
      typeof response.data === 'object' &&
      response.data.success === true &&
      response.data.data !== undefined
    ) {
      const payload = response.data.data;
      if (response.data.meta && payload && typeof payload === 'object' && !Array.isArray(payload)) {
        payload.meta = response.data.meta;
      }
      response.data = payload;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const payload = res.data?.data || res.data;
        const newAccessToken = payload?.accessToken;
        const newRefreshToken = payload?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('access_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh token returned invalid payload');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
