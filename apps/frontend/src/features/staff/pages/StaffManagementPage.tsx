import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  GraduationCap,
  ChefHat,
  Search,
  Filter,
  RefreshCw,
  Archive,
  RotateCcw,
  Edit3,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  HeartPulse,
  Apple,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  staffApi,
  StaffUser,
  StaffStats,
  StaffRole,
  CreateStaffPayload,
  UpdateStaffPayload,
} from '../api/staff.api';
import { StaffDrawer } from '../components/StaffDrawer';
import { SoftDeleteConfirmModal } from '../components/SoftDeleteConfirmModal';
import { useAuthStore } from '../../../core/stores/auth.store';

export const StaffManagementPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();

  // State danh sách & dữ liệu
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [availableRoles, setAvailableRoles] = useState<StaffRole[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bộ lọc & Phân trang
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Loading states
  const [isListLoading, setIsListLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isDrawerSubmitting, setIsDrawerSubmitting] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Drawer & Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffUser | null>(null);

  // Toast thông báo
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset về trang 1 khi search
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 1. Tải danh sách roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const roles = await staffApi.getStaffRoles();
        setAvailableRoles(Array.isArray(roles) ? roles : []);
      } catch (err) {
        console.error('Lỗi khi tải vai trò nhân sự:', err);
      }
    };
    fetchRoles();
  }, []);

  // 2. Tải thống kê KPI
  const loadStats = async () => {
    setIsStatsLoading(true);
    try {
      const data = await staffApi.getStaffStats();
      setStats(data);
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // 3. Tải danh sách nhân sự
  const loadStaffList = async () => {
    setIsListLoading(true);
    try {
      const res = await staffApi.getStaffList({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        roleCode: selectedRole || undefined,
        status: selectedStatus || undefined,
        includeDeleted,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      const rawStaff = Array.isArray(res) ? res : (res?.data || []);
      const staffArray = Array.isArray(rawStaff) ? rawStaff : [];
      setStaffList(staffArray);
      setTotalCount((res as any)?.meta?.total ?? staffArray.length);
      setTotalPages((res as any)?.meta?.totalPages ?? 1);
    } catch (err) {
      console.error('Lỗi khi tải danh sách nhân sự:', err);
      showToast('error', 'Không thể kết nối đến máy chủ để tải danh sách nhân sự.');
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    loadStaffList();
  }, [currentPage, debouncedSearch, selectedRole, selectedStatus, includeDeleted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mở Drawer Tạo Mới
  const handleOpenCreateDrawer = () => {
    setEditingStaff(null);
    setIsDrawerOpen(true);
  };

  // Mở Drawer Chỉnh Sửa
  const handleOpenEditDrawer = (staff: StaffUser) => {
    setEditingStaff(staff);
    setIsDrawerOpen(true);
  };

  // Xử lý Submit Tạo Mới hoặc Chỉnh Sửa
  const handleDrawerSubmit = async (payload: CreateStaffPayload | UpdateStaffPayload, staffId?: string) => {
    setIsDrawerSubmitting(true);
    try {
      if (staffId) {
        // Update
        const updated = await staffApi.updateStaff(staffId, payload as UpdateStaffPayload);
        showToast('success', `Đã cập nhật thông tin nhân sự "${updated.fullName}" thành công.`);
      } else {
        // Create
        const created = await staffApi.createStaff(payload as CreateStaffPayload);
        showToast(
          'success',
          `Đã tạo tài khoản "${created.fullName}". Mật khẩu khởi tạo: ${created.initialPassword || 'Password123@'}`,
        );
      }
      setIsDrawerOpen(false);
      loadStaffList();
      loadStats();
    } catch (err: any) {
      throw err; // Ném lỗi để Drawer hiển thị cảnh báo
    } finally {
      setIsDrawerSubmitting(false);
    }
  };

  // Xử lý Khóa / Mở Khóa nhanh
  const handleToggleStatus = async (staff: StaffUser) => {
    if (staff.id === currentUser?.id) {
      showToast('error', 'Bạn không thể tự khóa tài khoản của chính mình.');
      return;
    }
    setIsActionSubmitting(true);
    try {
      const res = await staffApi.toggleStaffStatus(staff.id);
      showToast('success', res.message);
      loadStaffList();
      loadStats();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể đổi trạng thái tài khoản.';
      showToast('error', msg);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Xử lý Xóa Mềm (Soft Delete)
  const handleConfirmSoftDelete = async () => {
    if (!deletingStaff) return;
    setIsActionSubmitting(true);
    try {
      const res = await staffApi.softDeleteStaff(deletingStaff.id);
      showToast('success', res.message);
      setDeletingStaff(null);
      loadStaffList();
      loadStats();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xóa mềm tài khoản này.';
      showToast('error', msg);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Xử lý Khôi Phục (Restore)
  const handleRestoreStaff = async (staff: StaffUser) => {
    setIsActionSubmitting(true);
    try {
      const res = await staffApi.restoreStaff(staff.id);
      showToast('success', res.message);
      loadStaffList();
      loadStats();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể khôi phục tài khoản này.';
      showToast('error', msg);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Render Role Badge
  const renderRoleBadge = (roleCode: string, roleName: string) => {
    switch (roleCode) {
      case 'PRINCIPAL':
        return (
          <span
            key={roleCode}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
          >
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            {roleName}
          </span>
        );
      case 'NUTRITIONIST':
        return (
          <span
            key={roleCode}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200"
          >
            <Apple className="w-3 h-3 text-teal-600" />
            {roleName}
          </span>
        );
      case 'KITCHEN_MANAGER':
        return (
          <span
            key={roleCode}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200"
          >
            <ChefHat className="w-3 h-3 text-orange-600" />
            {roleName}
          </span>
        );
      case 'TEACHER':
        return (
          <span
            key={roleCode}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200"
          >
            <GraduationCap className="w-3 h-3 text-blue-600" />
            {roleName}
          </span>
        );
      case 'MEDICAL_STAFF':
        return (
          <span
            key={roleCode}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200"
          >
            <HeartPulse className="w-3 h-3 text-rose-600" />
            {roleName}
          </span>
        );
      default:
        return (
          <span
            key={roleCode}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700"
          >
            {roleName}
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 max-w-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              CỔNG BAN GIÁM HIỆU
            </span>
            <span className="text-xs text-slate-400">• Cơ sở MN Sao Mai</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Quản Lý Nhân Sự & Đội Ngũ Bếp
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị tài khoản, phân công vai trò, tra cứu và bảo vệ dữ liệu với quy chuẩn xóa mềm.
          </p>
        </div>

        {/* Nút Hành Động Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadStaffList();
              loadStats();
            }}
            disabled={isListLoading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-xs transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isListLoading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-teal-600/25 transition active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Nhân Sự Mới</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CÁC Ô THỐNG KÊ Ở PHẦN ĐẦU GIAO DIỆN (TOP KPI STATISTICS CARDS)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Tổng nhân sự */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tổng Nhân Sự</span>
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats?.totalStaff ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">người</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-700 font-semibold flex items-center gap-1">
            <span>Toàn bộ cán bộ & nhân viên</span>
          </div>
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Đang Hoạt Động</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {stats?.activeStaff ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">tài khoản</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sẵn sàng vận hành</span>
          </div>
        </div>

        {/* Card 3: Giáo viên đứng lớp */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Giáo Viên Chủ Nhiệm</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-600 tracking-tight">
              {stats?.teachers ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">cô</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-700 font-semibold">
            <span>Điểm danh & đánh giá bữa ăn</span>
          </div>
        </div>

        {/* Card 4: Nhà bếp & Dinh dưỡng */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Bếp & Dinh Dưỡng</span>
            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-orange-600 tracking-tight">
              {stats?.kitchenAndNutrition ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">nhân sự</span>
          </div>
          <div className="mt-2 text-[11px] text-orange-700 font-semibold">
            <span>Kiểm thực 3 bước & Lưu mẫu 24h</span>
          </div>
        </div>

        {/* Card 5: Tạm khóa / Lưu trữ (Đã xóa mềm) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tạm Khóa / Lưu Trữ</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-700 tracking-tight">
              {stats?.inactiveOrDeleted ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">hồ sơ</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <span>Bảo toàn lịch sử dữ liệu</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC (SEARCH & FILTER TOOLBAR)               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row md:items-center gap-3 justify-between">
        {/* Ô Tìm kiếm thời gian thực */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, email công việc, số điện thoại..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Các Dropdown Bộ Lọc */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lọc theo Vai trò */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tất cả vai trò</option>
            {availableRoles.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Lọc theo Trạng thái */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm khóa</option>
            <option value="DELETED">Đã xóa mềm (Lưu trữ)</option>
          </select>

          {/* Bật / Tắt xem bản ghi xóa mềm */}
          <label className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700 transition">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-3.5 h-3.5 text-teal-600 rounded-sm focus:ring-teal-500"
            />
            <span>Xem cả tài khoản xóa mềm</span>
          </label>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BẢNG DỮ LIỆU NHÂN SỰ (STAFF DATA TABLE)                                 */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Nhân Sự & Email</th>
                <th className="py-3.5 px-4">Số Điện Thoại</th>
                <th className="py-3.5 px-4">Vai Trò Chuyên Môn</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Tham Gia</th>
                <th className="py-3.5 px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isListLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="font-semibold">Đang tải danh sách nhân sự...</p>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <UserX className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">Không tìm thấy tài khoản nhân sự phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.
                    </p>
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => {
                  const isCurrent = staff.id === currentUser?.id;
                  const isSoftDeleted = staff.isDeleted;

                  return (
                    <tr
                      key={staff.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSoftDeleted ? 'bg-slate-50/50 opacity-75' : ''
                      }`}
                    >
                      {/* Cột 1: Thông tin nhân sự */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                              isSoftDeleted
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-teal-600 text-white'
                            }`}
                          >
                            {staff.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">
                                {staff.fullName}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 truncate block">
                              {staff.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Số điện thoại */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {staff.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{staff.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">Chưa cập nhật</span>
                        )}
                      </td>

                      {/* Cột 3: Vai trò chuyên môn */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {staff.roles && staff.roles.length > 0 ? (
                            staff.roles.map((r) => renderRoleBadge(r.code, r.name))
                          ) : (
                            <span className="text-slate-400 italic">Chưa phân vai trò</span>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Trạng thái */}
                      <td className="py-3.5 px-4">
                        {isSoftDeleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Archive className="w-3 h-3 text-slate-500" />
                            Đã xóa mềm (Lưu trữ)
                          </span>
                        ) : staff.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Tạm khóa
                          </span>
                        )}
                      </td>

                      {/* Cột 5: Ngày tham gia */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(staff.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </td>

                      {/* Cột 6: Nút thao tác */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isSoftDeleted ? (
                            /* Nút Khôi phục cho nhân sự đã xóa mềm */
                            <button
                              onClick={() => handleRestoreStaff(staff)}
                              disabled={isActionSubmitting}
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center gap-1 transition"
                              title="Khôi phục tài khoản nhân sự"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Khôi phục</span>
                            </button>
                          ) : (
                            <>
                              {/* Nút Chỉnh sửa -> MỞ RIGHT DRAWER */}
                              <button
                                onClick={() => handleOpenEditDrawer(staff)}
                                className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
                                title="Chỉnh sửa nhân sự (Mở Popup bên phải)"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Nút Khóa / Mở khóa nhanh */}
                              {!isCurrent && (
                                <button
                                  onClick={() => handleToggleStatus(staff)}
                                  disabled={isActionSubmitting}
                                  className={`p-2 rounded-xl transition ${
                                    staff.status === 'ACTIVE'
                                      ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                      : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={staff.status === 'ACTIVE' ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                                >
                                  {staff.status === 'ACTIVE' ? (
                                    <Lock className="w-4 h-4" />
                                  ) : (
                                    <Unlock className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                              {/* Nút Xóa Mềm */}
                              {!isCurrent && (
                                <button
                                  onClick={() => setDeletingStaff(staff)}
                                  disabled={isActionSubmitting}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                  title="Chuyển vào lưu trữ (Xóa mềm)"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân Trang (Pagination Footer) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị{' '}
            <span className="font-bold text-slate-800">
              {staffList.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            -{' '}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{' '}
            trên tổng số <span className="font-bold text-slate-800">{totalCount}</span> nhân sự
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1 || isListLoading}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages || isListLoading}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. POPUP BÊN PHẢI LÀM MỜ NỀN (RIGHT SLIDE-OVER DRAWER FOR CREATE & EDIT)   */}
      {/* ========================================================================= */}
      <StaffDrawer
        isOpen={isDrawerOpen}
        staff={editingStaff}
        availableRoles={availableRoles}
        isLoading={isDrawerSubmitting}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleDrawerSubmit}
      />

      {/* ========================================================================= */}
      {/* 5. MODAL XÁC NHẬN XÓA MỀM (SOFT DELETE CONFIRMATION DIALOG)                */}
      {/* ========================================================================= */}
      <SoftDeleteConfirmModal
        isOpen={Boolean(deletingStaff)}
        staff={deletingStaff}
        isLoading={isActionSubmitting}
        onClose={() => setDeletingStaff(null)}
        onConfirm={handleConfirmSoftDelete}
      />
    </div>
  );
};
