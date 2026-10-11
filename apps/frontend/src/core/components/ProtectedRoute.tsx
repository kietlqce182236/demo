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
    const userRoleList = Array.isArray(user.roles)
      ? user.roles.map((r: any) => (typeof r === 'string' ? r : r?.code || '').toUpperCase())
      : [];
    const hasRole = allowedRoles.some((role) => {
      const upperRole = role.toUpperCase();
      if (userRoleList.includes(upperRole)) return true;
      if (userRoleList.includes('SUPER_ADMIN')) return true;
      // Đồng nhất các alias của Ban Giám Hiệu
      if (
        (upperRole === 'PRINCIPAL' || upperRole === 'SCHOOL_MANAGER' || upperRole === 'SCHOOL_MANAGEMENT') &&
        (userRoleList.includes('PRINCIPAL') || userRoleList.includes('SCHOOL_MANAGER') || userRoleList.includes('SCHOOL_MANAGEMENT'))
      ) {
        return true;
      }
      return false;
    });

    if (!hasRole) {
      // Điều hướng về đúng cổng của role hiện tại
      if (userRoleList.includes('NUTRITIONIST')) {
        return <Navigate to="/nutritionist/menus" replace />;
      }
      if (userRoleList.includes('TEACHER')) {
        return <Navigate to="/tablet" replace />;
      }
      if (userRoleList.includes('KITCHEN_STAFF') || userRoleList.includes('KITCHEN_MANAGER')) {
        return <Navigate to="/kitchen" replace />;
      }
      if (
        userRoleList.includes('PRINCIPAL') ||
        userRoleList.includes('SUPER_ADMIN') ||
        userRoleList.includes('SCHOOL_MANAGER') ||
        userRoleList.includes('SCHOOL_MANAGEMENT')
      ) {
        return <Navigate to="/dashboard" replace />;
      }
      if (userRoleList.includes('PARENT')) {
        return <Navigate to="/child-menu-consumption" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
