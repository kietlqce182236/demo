import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AdminDashboardLayout } from './layouts/AdminDashboardLayout';
import { NutritionistLayout } from './layouts/NutritionistLayout';
import { TeacherTabletLayout } from './layouts/TeacherTabletLayout';
import { KitchenDisplayLayout } from './layouts/KitchenDisplayLayout';

import { LoginPage } from './features/auth/pages/LoginPage';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage';
import { WeeklyMenuManagementPage } from './features/menus/pages/WeeklyMenuManagementPage';
import { NutritionistDashboardPage } from './features/menus/pages/NutritionistDashboardPage';
import { NutritionRulesPage } from './features/menus/pages/NutritionRulesPage';
import { SchoolSettingsPage } from './features/tenant/pages/SchoolSettingsPage';
import { StaffManagementPage } from './features/staff/pages/StaffManagementPage';
import { PrincipalMenuApprovalPage } from './features/menus/pages/PrincipalMenuApprovalPage';
import { TeacherTabletPage } from './features/attendance/pages/TeacherTabletPage';

import { ProtectedRoute } from './core/components/ProtectedRoute';
import { useAuthStore } from './core/stores/auth.store';
import { ChefHat, Tablet, LayoutDashboard, Sparkles, LogOut, Users, Scale, UtensilsCrossed } from 'lucide-react';

/**
 * Component điều hướng thông minh theo Role người dùng khi vào trang chủ "/"
 */
const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuthStore();
  const roles = user?.roles || [];

  if (roles.includes('NUTRITIONIST')) {
    return <Navigate to="/nutritionist/menus" replace />;
  }
  if (roles.includes('TEACHER')) {
    return <Navigate to="/tablet" replace />;
  }
  if (roles.includes('KITCHEN_STAFF')) {
    return <Navigate to="/kds" replace />;
  }
  if (roles.includes('PRINCIPAL') || roles.includes('SUPER_ADMIN')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};


export const App: React.FC = () => {
  const { hydrate, isAuthenticated, logout, user } = useAuthStore();

  // Hydrate auth state từ localStorage 1 lần khi app mount
  useEffect(() => {
    hydrate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const roles = user?.roles || [];
  const isNutritionist = roles.includes('NUTRITIONIST');
  const isPrincipal = roles.includes('PRINCIPAL') || roles.includes('SUPER_ADMIN');

  return (
    <BrowserRouter>
      {/* Quick Navigation Floating Bar — chỉ hiện khi đã login */}
      {isAuthenticated && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700 text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {user?.fullName} ({isNutritionist ? 'Dinh dưỡng' : isPrincipal ? 'Hiệu trưởng' : 'Nhân sự'})
          </span>

          <span className="text-slate-600">|</span>

          {/* Nút dành riêng cho Chuyên gia Dinh dưỡng */}
          {isNutritionist && (
            <>
              <Link to="/nutritionist/menus" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition font-bold">
                <UtensilsCrossed className="w-3.5 h-3.5" /> Cổng Dinh Dưỡng
              </Link>
              <span className="text-slate-600">|</span>
              <Link to="/nutritionist/rules" className="flex items-center gap-1 hover:text-teal-300 transition">
                <Scale className="w-3.5 h-3.5" /> Quy chuẩn & Dị ứng
              </Link>
              <span className="text-slate-600">|</span>
            </>
          )}

          {/* Nút dành riêng cho Ban Giám Hiệu */}
          {isPrincipal && (
            <>
              <Link to="/dashboard" className="flex items-center gap-1 text-teal-400 hover:text-teal-300 transition font-bold">
                <LayoutDashboard className="w-3.5 h-3.5" /> Cổng BGH
              </Link>
              <span className="text-slate-600">|</span>
              <Link to="/staff" className="flex items-center gap-1 hover:text-teal-300 transition">
                <Users className="w-3.5 h-3.5" /> Nhân sự & Bếp
              </Link>
              <span className="text-slate-600">|</span>
              <Link to="/nutritionist/menus" className="flex items-center gap-1 hover:text-emerald-300 transition">
                <UtensilsCrossed className="w-3.5 h-3.5" /> Duyệt thực đơn DD
              </Link>
              <span className="text-slate-600">|</span>
            </>
          )}

          {/* Các cổng khác */}
          <Link to="/tablet" className="flex items-center gap-1 hover:text-emerald-300 transition">
            <Tablet className="w-3.5 h-3.5" /> Tablet GV
          </Link>
          <span className="text-slate-600">|</span>
          <Link to="/kds" className="flex items-center gap-1 hover:text-amber-300 transition">
            <ChefHat className="w-3.5 h-3.5" /> KDS Bếp
          </Link>

          <span className="text-slate-600">|</span>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition font-bold"
          >
            <LogOut className="w-3.5 h-3.5" /> Thoát
          </button>
        </div>
      )}

      <Routes>
        {/* Public: Login Page & Forgot Password */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Root Redirect: Tự động phân luồng về Cổng phù hợp với Role */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          }
        />

        {/* ─── 1. PHÂN HỆ CỔNG CHUYÊN GIA DINH DƯỠNG (NUTRITIONIST PORTAL) ─── */}
        {/* Layout Topbar NutriKid chuẩn 100% hình ảnh, CHỈ CHO ROLE NUTRITIONIST & SUPER_ADMIN */}
        <Route
          path="/nutritionist"
          element={
            <ProtectedRoute allowedRoles={['NUTRITIONIST', 'SUPER_ADMIN', 'PRINCIPAL']}>
              <NutritionistLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/nutritionist/menus" replace />} />
          <Route path="dashboard" element={<NutritionistDashboardPage />} />
          <Route path="menus" element={<WeeklyMenuManagementPage />} />
          <Route path="rules" element={<NutritionRulesPage />} />
          <Route path="allergens" element={<NutritionRulesPage />} />
          <Route path="foods" element={<NutritionRulesPage />} />
          <Route path="dishes" element={<NutritionRulesPage />} />
          <Route path="children" element={<NutritionistDashboardPage />} />
          <Route path="food-safety" element={<NutritionistDashboardPage />} />
          <Route path="growth" element={<NutritionistDashboardPage />} />
          <Route path="reports" element={<NutritionistDashboardPage />} />
        </Route>

        {/* Tương thích ngược đường dẫn cũ /menus -> chuyển sang Cổng Dinh Dưỡng */}
        <Route
          path="/menus"
          element={
            <ProtectedRoute>
              <Navigate to="/nutritionist/menus" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nutrition-rules"
          element={
            <ProtectedRoute>
              <Navigate to="/nutritionist/rules" replace />
            </ProtectedRoute>
          }
        />

        {/* ─── 2. PHÂN HỆ CỔNG BAN GIÁM HIỆU / ADMIN (CHỈ CHO ROLE PRINCIPAL / SUPER_ADMIN) ─── */}
        {/* Chuyên gia dinh dưỡng KHÔNG vào được giao diện này (Sẽ bị ProtectedRoute chặn và đẩy về /nutritionist/menus) */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT']}>
              <AdminDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<SchoolSettingsPage />} />
          <Route path="/settings" element={<SchoolSettingsPage />} />
          <Route path="/classes" element={<SchoolSettingsPage />} />
          <Route path="/staff" element={<StaffManagementPage />} />
          <Route path="/inventory" element={<NutritionRulesPage />} />
          <Route path="/menu-approval" element={<PrincipalMenuApprovalPage />} />
          <Route path="/services" element={<WeeklyMenuManagementPage />} />
          <Route path="/food-safety" element={<WeeklyMenuManagementPage />} />
          <Route path="/finances" element={<WeeklyMenuManagementPage />} />
          <Route path="/children" element={<WeeklyMenuManagementPage />} />
          <Route path="/growth" element={<WeeklyMenuManagementPage />} />
          <Route path="/payments" element={<WeeklyMenuManagementPage />} />


        {/* ─── 3. PHÂN HỆ TABLET GIÁO VIÊN ─── */}
        <Route
          path="/tablet"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'PRINCIPAL']}>
              <TeacherTabletLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherTabletPage />} />
          <Route path="record" element={<TeacherTabletPage />} />
        </Route>

        {/* ─── 4. PHÂN HỆ MÀN HÌNH BẾP (KDS) ─── */}
        <Route
          path="/kds"
          element={
            <ProtectedRoute allowedRoles={['KITCHEN_STAFF', 'SUPER_ADMIN', 'PRINCIPAL']}>
              <KitchenDisplayLayout />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
