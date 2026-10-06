import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * ProtectedRoute — Wrapper component kiểm tra auth và RBAC roles trước khi render.
 * - Chưa login → redirect /login.
 * - Sai role → redirect về đúng portal theo role của user.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có quy định allowedRoles và user không có role nào phù hợp
  if (allowedRoles && allowedRoles.length > 0 && user?.roles) {
    const hasRole = allowedRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      // Điều hướng về đúng cổng của role hiện tại
      if (user.roles.includes('NUTRITIONIST')) {
        return <Navigate to="/nutritionist/menus" replace />;
      }
      if (user.roles.includes('TEACHER')) {
        return <Navigate to="/tablet" replace />;
      }
      if (user.roles.includes('KITCHEN_STAFF') || user.roles.includes('KITCHEN_MANAGER')) {
        return <Navigate to="/kitchen" replace />;
      }
      if (user.roles.includes('PRINCIPAL') || user.roles.includes('SUPER_ADMIN')) {
        return <Navigate to="/dashboard" replace />;
      }
      if (user.roles.includes('PARENT')) {
        return <Navigate to="/child-menu-consumption" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
