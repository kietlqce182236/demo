import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AdminDashboardLayout } from './layouts/AdminDashboardLayout';
import { TeacherTabletLayout } from './layouts/TeacherTabletLayout';
import { KitchenDisplayLayout } from './layouts/KitchenDisplayLayout';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage';
import { MenuPlanningPage } from './features/menus/pages/MenuPlanningPage';
import { TeacherTabletPage } from './features/attendance/pages/TeacherTabletPage';
import { ProtectedRoute } from './core/components/ProtectedRoute';
import { useAuthStore } from './core/stores/auth.store';
import { ChefHat, Tablet, LayoutDashboard, Sparkles, LogOut, Users, Scale } from 'lucide-react';

import { SchoolSettingsPage } from './features/tenant/pages/SchoolSettingsPage';
import { StaffManagementPage } from './features/staff/pages/StaffManagementPage';
import { NutritionRulesPage } from './features/menus/pages/NutritionRulesPage';



export const App: React.FC = () => {
  const { hydrate, isAuthenticated, logout, user } = useAuthStore();

  // Hydrate auth state từ localStorage 1 lần khi app mount
  useEffect(() => {
    hydrate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter>
      {/* Quick Navigation Floating Bar — chỉ hiện khi đã login */}
      {isAuthenticated && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700 text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {user?.fullName}
          </span>
          <Link to="/nutrition-rules" className="flex items-center gap-1.5 hover:text-teal-400 transition">
            <Scale className="w-4 h-4" /> Quy chuẩn & Dị ứng
          </Link>
          <span className="text-slate-600">|</span>
          <Link to="/staff" className="flex items-center gap-1.5 hover:text-teal-400 transition">
            <Users className="w-4 h-4" /> Nhân sự & Bếp
          </Link>
          <span className="text-slate-600">|</span>
          <Link to="/settings" className="flex items-center gap-1.5 hover:text-teal-400 transition">
            <LayoutDashboard className="w-4 h-4" /> BGH: Cài đặt trường
          </Link>
          <span className="text-slate-600">|</span>
          <Link to="/menus" className="flex items-center gap-1.5 hover:text-teal-400 transition">
            <LayoutDashboard className="w-4 h-4" /> Thực đơn DD
          </Link>
          <span className="text-slate-600">|</span>
          <Link to="/tablet" className="flex items-center gap-1.5 hover:text-emerald-400 transition">
            <Tablet className="w-4 h-4" /> Tablet Giáo Viên
          </Link>
          <span className="text-slate-600">|</span>
          <Link to="/kds" className="flex items-center gap-1.5 hover:text-amber-400 transition">
            <ChefHat className="w-4 h-4" /> KDS Màn hình Bếp
          </Link>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Thoát
          </button>
        </div>
      )}

      <Routes>
        {/* Public: Login Page & Forgot Password */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected: Cổng Ban Giám Hiệu & Web Admin */}
        <Route path="/" element={<ProtectedRoute><AdminDashboardLayout /></ProtectedRoute>}>
          <Route index element={<SchoolSettingsPage />} />
          <Route path="settings" element={<SchoolSettingsPage />} />
          <Route path="dashboard" element={<SchoolSettingsPage />} />
          <Route path="menus" element={<MenuPlanningPage />} />
          <Route path="classes" element={<SchoolSettingsPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="nutrition-rules" element={<NutritionRulesPage />} />
          <Route path="inventory" element={<NutritionRulesPage />} />
          <Route path="services" element={<MenuPlanningPage />} />
          <Route path="food-safety" element={<MenuPlanningPage />} />
          <Route path="finances" element={<MenuPlanningPage />} />
          <Route path="children" element={<MenuPlanningPage />} />
          <Route path="growth" element={<MenuPlanningPage />} />
          <Route path="payments" element={<MenuPlanningPage />} />
        </Route>

        {/* Protected: Tablet Giáo viên trên lớp */}
        <Route path="/tablet" element={<ProtectedRoute><TeacherTabletLayout /></ProtectedRoute>}>
          <Route index element={<TeacherTabletPage />} />
          <Route path="record" element={<TeacherTabletPage />} />
        </Route>

        {/* Protected: KDS Màn hình Bếp Bán trú */}
        <Route path="/kds" element={<ProtectedRoute><KitchenDisplayLayout /></ProtectedRoute>} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
