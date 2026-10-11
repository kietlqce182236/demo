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
import { NutritionistAllergyManagementPage } from './features/menus/pages/NutritionistAllergyManagementPage';
import { SchoolSettingsPage } from './features/tenant/pages/SchoolSettingsPage';
import { StaffManagementPage } from './features/staff/pages/StaffManagementPage';
import { PrincipalMenuApprovalPage } from './features/menus/pages/PrincipalMenuApprovalPage';
import { MenuPlanningPage } from './features/menus/pages/MenuPlanningPage';
import { SnackServicesPage } from './features/snack-services/pages/SnackServicesPage';
import { DayboardingServicesPage } from './features/services/pages/DayboardingServicesPage';
import { FinancialReportsPage } from './features/finances/pages/FinancialReportsPage';
import { ClassesPage } from './features/classes/pages/ClassesPage';
import { SchoolClassAllergyHubPage } from './features/classes/pages/SchoolClassAllergyHubPage';
import { CreateClassPage } from './features/classes/pages/CreateClassPage';
import { EditClassPage } from './features/classes/pages/EditClassPage';
import { ClassDetailsPage } from './features/classes/pages/ClassDetailsPage';
import { TeacherTabletPage } from './features/attendance/pages/TeacherTabletPage';
import { AttendancePage } from './features/attendance/AttendancePage';
import { MealCoordinationNotesPage } from './features/attendance/MealCoordinationNotesPage';
import { MealEvaluationPage } from './features/attendance/MealEvaluationPage';
import { AttendanceHistoryPage } from './features/attendance/AttendanceHistoryPage';
import { SnackRosterPage } from './features/attendance/SnackRosterPage';

import { ProtectedRoute } from './core/components/ProtectedRoute';
import { useAuthStore } from './core/stores/auth.store';
import { ChefHat, Tablet, LayoutDashboard, Sparkles, LogOut, Users, Scale, UtensilsCrossed, Utensils, MessageSquare, ShieldAlert, Home, ClipboardCheck } from 'lucide-react';

import { HomePage } from './features/home/HomePage';
import { FoodIngredientsPage } from './features/foods/components/FoodIngredientsPage';
import { CreateFoodPage } from './features/foods/components/CreateFoodPage';
import { DishesPage } from './features/dishes/components/DishesPage';
import { InspectionsPage } from './features/inspections/components/InspectionsPage';
import { InspectionDetailPage } from './features/inspections/components/InspectionDetailPage';
import { ExecutiveDashboardPage } from './features/dashboard/pages/ExecutiveDashboardPage';
import { ChildrenManagementPage } from './features/children/pages/ChildrenManagementPage';
import { ChildGrowthMonitoringPage } from './features/growth/pages/ChildGrowthMonitoringPage';
import { SnackBillingPaymentPage } from './features/payments/pages/SnackBillingPaymentPage';
import { MonitorChildMenuConsumptionPage } from './features/parent-evaluations/MonitorChildMenuConsumptionPage';
import { SubmitMealEvaluationPage } from './features/parent-evaluations/SubmitMealEvaluationPage';
import { ParentEvaluationsPage } from './features/parent-evaluations/ParentEvaluationsPage';
import { ParentAllergyDeclarationPage } from './features/children/pages/ParentAllergyDeclarationPage';
import { AuditLogsPage } from './features/audit-logs/pages/AuditLogsPage';
import { ParentManagementPage } from './features/parents/pages/ParentManagementPage';

/**
 * Component điều hướng thông minh theo Role người dùng khi vào trang chủ "/"
 */
const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuthStore();
  const roles = user?.roles || [];

  if (roles.includes('KITCHEN_STAFF') || roles.includes('KITCHEN_MANAGER')) {
    return <Navigate to="/kitchen" replace />;
  }
  if (roles.includes('NUTRITIONIST')) {
    return <Navigate to="/nutritionist/menus" replace />;
  }
  if (roles.includes('TEACHER')) {
    return <Navigate to="/tablet" replace />;
  }
  if (
    roles.includes('PRINCIPAL') ||
    roles.includes('SUPER_ADMIN') ||
    roles.includes('SCHOOL_MANAGER') ||
    roles.includes('SCHOOL_MANAGEMENT')
  ) {
    return <Navigate to="/dashboard" replace />;
  }
  if (roles.includes('PARENT')) {
    return <Navigate to="/child-menu-consumption" replace />;
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
  const isKitchen = roles.includes('KITCHEN_STAFF') || roles.includes('KITCHEN_MANAGER');
  const isNutritionist = roles.includes('NUTRITIONIST');
  const isPrincipal =
    roles.includes('PRINCIPAL') ||
    roles.includes('SUPER_ADMIN') ||
    roles.includes('SCHOOL_MANAGER') ||
    roles.includes('SCHOOL_MANAGEMENT');
  const isParent = roles.includes('PARENT');
  const isTeacher = roles.includes('TEACHER');
  const isSuperAdmin = roles.includes('SUPER_ADMIN');

  const roleTitle = isKitchen
    ? 'Nhân viên Bếp'
    : isNutritionist
    ? 'Dinh dưỡng'
    : isPrincipal
    ? 'Hiệu trưởng'
    : isTeacher
    ? 'Giáo viên'
    : isParent
    ? 'Phụ huynh'
    : 'Nhân sự';

  return (
    <BrowserRouter>
      {/* Quick Navigation Floating Bar — chỉ hiện khi đã login */}
      {isAuthenticated && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700 text-xs font-semibold">
          <Link to="/" className="flex items-center gap-1 text-slate-300 hover:text-white transition font-bold">
            <Home className="w-3.5 h-3.5 text-emerald-400" /> Trang Chủ
          </Link>

          <span className="text-slate-600">|</span>

          <span className="text-slate-300 flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {user?.fullName} ({roleTitle})
          </span>

          <span className="text-slate-600">|</span>

          {/* Nút dành riêng cho Bếp (Chỉ tài khoản Bếp hoặc SuperAdmin mới thấy) */}
          {(isKitchen || isSuperAdmin) && (
            <>
              <Link to="/kitchen" className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 hover:text-white border border-amber-500/40 transition font-bold shadow-sm">
                <ChefHat className="w-3.5 h-3.5 text-amber-400" /> KDS Bếp
              </Link>
              <span className="text-slate-600">|</span>
            </>
          )}

          {/* Nút dành riêng cho Chuyên gia Dinh dưỡng */}
          {isNutritionist && (
            <>
              <Link to="/nutritionist/menus" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition font-bold">
                <UtensilsCrossed className="w-3.5 h-3.5" /> Cổng Dinh Dưỡng
              </Link>
              <span className="text-slate-600">|</span>
              <Link to="/nutritionist/allergens" className="flex items-center gap-1 text-rose-300 hover:text-rose-200 transition font-bold">
                <ShieldAlert className="w-3.5 h-3.5" /> Quản Lý Dị Ứng
              </Link>
              <span className="text-slate-600">|</span>
              <Link to="/nutritionist/rules" className="flex items-center gap-1 hover:text-teal-300 transition">
                <Scale className="w-3.5 h-3.5" /> Quy chuẩn TT 28
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

          {/* Nút dành riêng cho Phụ huynh */}
          {isParent && (
            <>
              <Link to="/child-menu-consumption" className="flex items-center gap-1 text-teal-400 hover:text-teal-300 transition font-bold">
                <Utensils className="w-3.5 h-3.5" /> Thực đơn & Sức ăn
              </Link>
              <span className="text-slate-600">|</span>
              <Link to="/submit-evaluation" className="flex items-center gap-1 hover:text-teal-300 transition">
                <MessageSquare className="w-3.5 h-3.5" /> Góp ý suất ăn
              </Link>
              <span className="text-slate-600">|</span>
              <Link to="/declare-allergy" className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition font-bold">
                <ShieldAlert className="w-3.5 h-3.5" /> Khai báo dị ứng
              </Link>
              <span className="text-slate-600">|</span>
            </>
          )}

          {/* Cổng Giáo viên (Chỉ hiện cho Giáo viên hoặc SuperAdmin) */}
          {(isTeacher || isSuperAdmin) && (
            <>
              <Link to="/attendance" className="flex items-center gap-1 text-teal-300 hover:text-white transition font-bold">
                <ClipboardCheck className="w-3.5 h-3.5" /> Điểm danh Bán trú
              </Link>
              <span className="text-slate-600">|</span>
              <Link to="/tablet" className="flex items-center gap-1 hover:text-emerald-300 transition">
                <Tablet className="w-3.5 h-3.5" /> Tablet GV
              </Link>
              <span className="text-slate-600">|</span>
            </>
          )}

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
        {/* Public: Trang Chủ (Landing / Home Page), Đăng Nhập & Quên Mật Khẩu */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Cổng điều hướng thông minh theo Role */}
        <Route
          path="/portal"
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
          <Route path="allergens" element={<NutritionistAllergyManagementPage />} />
          <Route path="foods" element={<FoodIngredientsPage />} />
          <Route path="foods/create" element={<CreateFoodPage />} />
          <Route path="dishes" element={<DishesPage />} />
          <Route path="food-safety" element={<InspectionsPage />} />
          <Route path="food-safety/:id" element={<InspectionDetailPage />} />
          <Route path="children" element={<ChildrenManagementPage />} />
          <Route path="growth" element={<ChildGrowthMonitoringPage />} />
          <Route path="reports" element={<NutritionistDashboardPage />} />
        </Route>

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
            <ProtectedRoute allowedRoles={['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_MANAGEMENT', 'SCHOOL_MANAGER']}>
              <AdminDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ExecutiveDashboardPage />} />
          <Route path="/dashboard" element={<ExecutiveDashboardPage />} />
          <Route path="/settings" element={<SchoolSettingsPage />} />
          <Route path="/classes" element={<SchoolClassAllergyHubPage />} />
          <Route path="/classes/hub" element={<SchoolClassAllergyHubPage />} />
          <Route path="/classes/table" element={<ClassesPage />} />
          <Route path="/classes/create" element={<CreateClassPage />} />
          <Route path="/classes/:id/edit" element={<EditClassPage />} />
          <Route path="/classes/:id" element={<ClassDetailsPage />} />
          <Route path="/staff" element={<StaffManagementPage />} />
          <Route path="/menus" element={<PrincipalMenuApprovalPage />} />
          <Route path="/menu-approval" element={<PrincipalMenuApprovalPage />} />
          <Route path="/menu-planning" element={<MenuPlanningPage />} />
          <Route path="/services" element={<DayboardingServicesPage />} />
          <Route path="/snack-services" element={<SnackServicesPage />} />
          <Route path="/inventory" element={<FoodIngredientsPage />} />
          <Route path="/dishes" element={<DishesPage />} />
          <Route path="/food-safety" element={<InspectionsPage />} />
          <Route path="/food-safety/:id" element={<InspectionDetailPage />} />
          <Route path="/finances" element={<FinancialReportsPage />} />
          <Route path="/children" element={<ChildrenManagementPage />} />
          <Route path="/growth" element={<ChildGrowthMonitoringPage />} />
          <Route path="/payments" element={<SnackBillingPaymentPage />} />
          <Route path="/evaluations" element={<ParentEvaluationsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/parents" element={<ParentManagementPage />} />
        </Route>


        {/* ─── 3. PHÂN HỆ ĐIỂM DANH & QUẢN LÝ BÁN TRÚ GIÁO VIÊN (TEACHER SUITE) ─── */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_MANAGEMENT']}>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordination-notes"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_MANAGEMENT']}>
              <MealCoordinationNotesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluation"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_MANAGEMENT']}>
              <MealEvaluationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_MANAGEMENT']}>
              <AttendanceHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/snack-roster"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_MANAGEMENT']}>
              <SnackRosterPage />
            </ProtectedRoute>
          }
        />

        {/* Cổng Tablet Giáo viên */}
        <Route
          path="/tablet"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'PRINCIPAL']}>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tablet/record"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'PRINCIPAL']}>
              <TeacherTabletLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherTabletPage />} />
        </Route>

        {/* ─── 4. PHÂN HỆ MÀN HÌNH BẾP (KDS) ─── */}
        {/* CHỈ CHO PHÉP TÀI KHOẢN BẾP (KITCHEN_STAFF / KITCHEN_MANAGER) HOẶC SUPER_ADMIN VÀO GIAO DIỆN BẾP */}
        <Route
          path="/kds"
          element={
            <ProtectedRoute allowedRoles={['KITCHEN_STAFF', 'KITCHEN_MANAGER', 'SUPER_ADMIN']}>
              <KitchenDisplayLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['KITCHEN_STAFF', 'KITCHEN_MANAGER', 'SUPER_ADMIN']}>
              <KitchenDisplayLayout />
            </ProtectedRoute>
          }
        />


        {/* ─── 5. PHÂN HỆ CỔNG PHỤ HUYNH (PARENT PORTAL) ─── */}
        <Route
          path="/child-menu-consumption"
          element={
            <ProtectedRoute allowedRoles={['PARENT', 'SUPER_ADMIN', 'PRINCIPAL']}>
              <MonitorChildMenuConsumptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submit-evaluation"
          element={
            <ProtectedRoute allowedRoles={['PARENT', 'SUPER_ADMIN', 'PRINCIPAL']}>
              <SubmitMealEvaluationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/declare-allergy"
          element={
            <ProtectedRoute allowedRoles={['PARENT', 'SUPER_ADMIN', 'PRINCIPAL']}>
              <ParentAllergyDeclarationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent-evaluations"
          element={
            <ProtectedRoute allowedRoles={['PRINCIPAL', 'SUPER_ADMIN', 'NUTRITIONIST', 'SCHOOL_MANAGEMENT']}>
              <ParentEvaluationsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
