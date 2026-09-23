import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute — Wrapper component kiểm tra auth trước khi render.
 * Nếu chưa login → redirect /login.
 * Performance: Đọc từ Zustand store (sync, không API call).
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
