import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileSpreadsheet,
  Printer,
  Copy,
  Send,
  CheckCircle2,
  Lock,
  Trash2,
  RotateCcw,
  Filter,
  Search,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../../core/stores/auth.store';
import {
  weeklyMenusApi,
  WeeklyMenu,
  MenuStatistics,
  DishItem,
  MenuDishItem,
  ExportDataResponse,
} from '../api/weekly-menus.api';
import { NutriKidHeader } from '../components/NutriKidHeader';
import { MenuStatsCards } from '../components/MenuStatsCards';
import { WeeklyGridTable } from '../components/WeeklyGridTable';
import { MenuDrawer } from '../components/MenuDrawer';
import { DishAdjustmentDrawer } from '../components/DishAdjustmentDrawer';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { ApprovalModal } from '../components/ApprovalModal';
import { PrintPreviewModal } from '../components/PrintPreviewModal';

interface WeeklyMenuManagementPageProps {
  hideHeader?: boolean;
}

export const WeeklyMenuManagementPage: React.FC<WeeklyMenuManagementPageProps> = ({ hideHeader = true }) => {
  const { user } = useAuthStore();
  const isPrincipal = user?.roles?.includes('PRINCIPAL') || user?.roles?.includes('SUPER_ADMIN');

  // Danh sách dữ liệu & Trạng thái tải
  const [menus, setMenus] = useState<WeeklyMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenu | null>(null);
  const [menuVersions, setMenuVersions] = useState<WeeklyMenu[]>([]);
  const [availableDishes, setAvailableDishes] = useState<DishItem[]>([]);
  const [stats, setStats] = useState<MenuStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('ALL');
  const [showDeleted, setShowDeleted] = useState<boolean>(false);

  // Quản lý Drawer & Modal
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState<boolean>(false);
  const [menuDrawerMode, setMenuDrawerMode] = useState<'create' | 'edit'>('create');
  const [isDishDrawerOpen, setIsDishDrawerOpen] = useState<boolean>(false);
  const [activeSlot, setActiveSlot] = useState<{
    dayOfWeek: number;
    mealTime: string;
    existingDish?: MenuDishItem | null;
  } | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printData, setPrintData] = useState<ExportDataResponse | null>(null);

  // 1. Tải dữ liệu ban đầu
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [statsRes, dishesRes, menusRes] = await Promise.all([
        weeklyMenusApi.getStatistics(),
        weeklyMenusApi.getAvailableDishes(),
        weeklyMenusApi.getMenus({
          search: searchTerm,
          status: statusFilter,
          targetAgeGroup: ageGroupFilter,
          includeDeleted: showDeleted,
        }),
      ]);

      setStats(statsRes);
      setAvailableDishes(dishesRes);
      setMenus(menusRes);

      if (menusRes.length > 0) {
        // Chọn menu đang ACTIVE trước, nếu không chọn menu đầu tiên
        const activeOne = menusRes.find((m) => m.status === 'ACTIVE') || menusRes[0];
        await handleSelectMenu(activeOne.id);
      } else {
        setSelectedMenu(null);
        setMenuVersions([]);
      }
    } catch (err: any) {
      showNotify('error', 'Không thể tải dữ liệu thực đơn tuần.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [statusFilter, ageGroupFilter, showDeleted]);

  // 2. Chọn thực đơn cụ thể
  const handleSelectMenu = async (menuId: string) => {
    try {
      const [detailRes, versionsRes] = await Promise.all([
        weeklyMenusApi.getMenuById(menuId),
        weeklyMenusApi.getMenuVersions(menuId),
      ]);
      setSelectedMenu(detailRes);
      setMenuVersions(versionsRes);
    } catch (err) {
      showNotify('error', 'Không thể tải chi tiết thực đơn.');
    }
  };

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // 3. Tạo mới hoặc cập nhật thực đơn
  const handleSaveMenu = async (payload: any) => {
    if (menuDrawerMode === 'create') {
      const created = await weeklyMenusApi.createMenu(payload);
      showNotify('success', `Đã tạo thành công thực đơn: ${created.title}`);
      await fetchInitialData();
      await handleSelectMenu(created.id);
    } else if (selectedMenu) {
      const updated = await weeklyMenusApi.updateMenu(selectedMenu.id, payload);
      showNotify('success', 'Đã cập nhật thông tin thực đơn.');
      await fetchInitialData();
      await handleSelectMenu(updated.id);
    }
  };

  // 4. Tạo phiên bản mới (v1.1, v2.0...) từ menu hiện tại
  const handleCreateVersion = async () => {
    if (!selectedMenu) return;
    try {
      setActionLoading(true);
      const newVer = await weeklyMenusApi.createVersion(selectedMenu.id);
      showNotify('success', `Đã nhân bản tạo thành công phiên bản mới: v${newVer.version}.0`);
      await fetchInitialData();
      await handleSelectMenu(newVer.id);
    } catch (err: any) {
      showNotify('error', err?.response?.data?.message || 'Không thể tạo phiên bản mới.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Tinh chỉnh món ăn trong bữa ăn
  const handleAdjustDish = async (payload: any) => {
    if (!selectedMenu) return;
    await weeklyMenusApi.adjustDish(selectedMenu.id, payload);
    showNotify('success', 'Đã cập nhật món ăn vào thực đơn.');
    await handleSelectMenu(selectedMenu.id);
    const updatedStats = await weeklyMenusApi.getStatistics();
    setStats(updatedStats);
  };

  // 6. Xóa món ăn khỏi bữa ăn (Xóa mềm)
  const handleRemoveDish = async (menuDishId: string) => {
    if (!selectedMenu) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa món này khỏi bữa ăn?')) return;
    try {
      await weeklyMenusApi.removeDish(selectedMenu.id, menuDishId);
      showNotify('success', 'Đã xóa món ăn khỏi thực đơn.');
      await handleSelectMenu(selectedMenu.id);
    } catch (err: any) {
      showNotify('error', err?.response?.data?.message || 'Không thể xóa món ăn.');
    }
  };

  // 7. Gửi duyệt (Dinh dưỡng -> BGH)
  const handleSubmitForReview = async () => {
    if (!selectedMenu) return;
    try {
      setActionLoading(true);
      const updated = await weeklyMenusApi.submitForReview(selectedMenu.id);
      showNotify('success', 'Đã gửi thực đơn lên Ban Giám Hiệu để phê duyệt.');
      await fetchInitialData();
      await handleSelectMenu(updated.id);
    } catch (err: any) {
      showNotify('error', err?.response?.data?.message || 'Không thể gửi duyệt.');
    } finally {
      setActionLoading(false);
    }
  };

  // 8. BGH Phê duyệt
  const handleApprove = async (id: string, notes?: string) => {
    try {
      const updated = await weeklyMenusApi.approveMenu(id, notes);
      showNotify('success', 'Ban Giám Hiệu đã phê duyệt thực đơn tuần.');
      await fetchInitialData();
      await handleSelectMenu(updated.id);
    } catch (err: any) {
      showNotify('error', err?.response?.data?.message || 'Không thể phê duyệt.');
    }
  };

  // 9. BGH Từ chối
  const handleReject = async (id: string, reason: string) => {
    try {
      const updated = await weeklyMenusApi.rejectMenu(id, reason);
      showNotify('success', 'Đã từ chối thực đơn kèm lý do yêu cầu chỉnh sửa.');
      await fetchInitialData();
      await handleSelectMenu(updated.id);
    } catch (err: any) {
      showNotify('error', err?.response?.data?.message || 'Không thể từ chối.');
    }
  };

  // 10. Khóa & Công bố thực đơn
  const handlePublish = async () => {
    if (!selectedMenu) return;
    if (!window.confirm('Công bố thực đơn sẽ khóa bản này và hiển thị lên toàn hệ thống. Xác nhận?')) return;
    try {
      setActionLoading(true);
      const updated = await weeklyMenusApi.publishMenu(selectedMenu.id);
      showNotify('success', 'Thực đơn đã được KHÓA và CÔNG BỐ áp dụng toàn trường!');
      await fetchInitialData();
      await handleSelectMenu(updated.id);
    } catch (err: any) {
      showNotify('error', err?.response?.data?.message || 'Không thể công bố thực đơn.');
    } finally {
      setActionLoading(false);
    }
  };

  // 11. Xóa mềm thực đơn
  const handleSoftDelete = async () => {
    if (!selectedMenu) return;
    if (!window.confirm(`Xác nhận chuyển thực đơn "${selectedMenu.title}" vào thùng rác?`)) return;
    try {
      setActionLoading(true);
      await weeklyMenusApi.softDeleteMenu(selectedMenu.id);
      showNotify('success', 'Đã xóa mềm thực đơn vào thùng rác.');
      await fetchInitialData();
    } catch (err: any) {
      showNotify('error', err?.response?.data?.message || 'Không thể xóa thực đơn.');
    } finally {
      setActionLoading(false);
    }
  };

  // 12. Khôi phục thực đơn đã xóa mềm
  const handleRestore = async (id: string) => {
    try {
      setActionLoading(true);
      const restored = await weeklyMenusApi.restoreMenu(id);
      showNotify('success', `Đã khôi phục thực đơn: ${restored.title}`);
      await fetchInitialData();
      await handleSelectMenu(restored.id);
    } catch (err: any) {
      showNotify('error', err?.response?.data?.message || 'Không thể khôi phục thực đơn.');
    } finally {
      setActionLoading(false);
    }
  };

  // 13. Mở xem trước in A4
  const handleOpenPrintPreview = async () => {
    if (!selectedMenu) return;
    try {
      const data = await weeklyMenusApi.getExportData(selectedMenu.id);
      setPrintData(data);
      setIsPrintModalOpen(true);
    } catch (err) {
      showNotify('error', 'Không thể lấy dữ liệu in ấn.');
    }
  };

  // 14. Tải Excel/CSV
  const handleDownloadExcel = async () => {
    if (!selectedMenu) return;
    try {
      await weeklyMenusApi.downloadExcel(selectedMenu.id, `Thuc_don_${selectedMenu.title.replace(/\s+/g, '_')}.csv`);
      showNotify('success', 'Đã tải xuống file Excel thực đơn tuần.');
    } catch (err) {
      showNotify('error', 'Không thể tải file Excel.');
    }
  };

  // 15. Import Excel
  const handleImportExcel = async (payload: any) => {
    const imported = await weeklyMenusApi.importExcel(payload);
    showNotify('success', `Đã import thành công thực đơn: ${imported.title}`);
    await fetchInitialData();
    await handleSelectMenu(imported.id);
  };

  return (
    <div className={`text-slate-800 flex flex-col font-sans pb-16 ${!hideHeader ? 'min-h-screen bg-[#f8fafc]' : ''}`}>
      {/* 1. TOPBAR HEADER (chỉ hiện khi không bọc bởi NutritionistLayout) */}
      {!hideHeader && (
        <NutriKidHeader
          breadcrumbTitle="Quản lý thực đơn tuần"
          searchValue={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            weeklyMenusApi
              .getMenus({ search: val, status: statusFilter, targetAgeGroup: ageGroupFilter })
              .then(setMenus);
          }}
        />
      )}

      {/* Thông báo Alert */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                : 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Nội dung chính */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 flex-1 w-full">
        {/* 2. CÁC Ô THỐNG KÊ Ở ĐẦU GIAO DIỆN (5 KPI CARDS) */}
        <MenuStatsCards stats={stats} loading={loading} />

        {/* 3. THANH CÔNG CỤ & BỘ LỌC PHIÊN BẢN */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {/* Nhóm Bộ Lọc Bên Trái */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Chọn Thực đơn đang xem */}
            <div className="relative min-w-[220px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Chọn Thực đơn tuần
              </label>
              <select
                value={selectedMenu?.id || ''}
                onChange={(e) => handleSelectMenu(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 bg-white hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} (v{m.version}.0) - {m.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc Phiên bản (Version History) */}
            {menuVersions.length > 1 && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Phiên bản
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {menuVersions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleSelectMenu(v.id)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        selectedMenu?.id === v.id
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      v{v.version}.0
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lọc Trạng thái */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DRAFT">Bản dự thảo</option>
                <option value="SUBMITTED_FOR_REVIEW">Chờ BGH duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="ACTIVE">Đang áp dụng (Khóa)</option>
                <option value="REJECTED">Bị từ chối</option>
              </select>
            </div>

            {/* Thùng rác (Xóa mềm) */}
            <div className="pt-4">
              <button
                onClick={() => setShowDeleted(!showDeleted)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  showDeleted
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{showDeleted ? 'Thùng rác (Đang xem)' : 'Thùng rác'}</span>
              </button>
            </div>
          </div>

          {/* Nhóm Nút Hành Động Bên Phải */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Nút Tạo Thực Đơn Mới -> Mở MenuDrawer */}
            <button
              onClick={() => {
                setMenuDrawerMode('create');
                setIsMenuDrawerOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo thực đơn tuần</span>
            </button>

            {/* Nút Import Excel */}
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-white text-slate-700 hover:text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </button>

            {/* Nút Tạo Phiên Bản Mới (Clone Version) */}
            {selectedMenu && (
              <button
                onClick={handleCreateVersion}
                disabled={actionLoading}
                title="Nhân bản thực đơn hiện tại thành phiên bản mới để điều chỉnh mà không mất bản cũ"
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white text-slate-700 hover:text-blue-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50"
              >
                <Copy className="w-4 h-4 text-blue-600" />
                <span>Tạo bản v{selectedMenu.version + 1}.0</span>
              </button>
            )}

            {/* Nút Gửi Duyệt (DÀNH RIÊNG CHO CHUYÊN VIÊN DINH DƯỠNG khi ở DRAFT hoặc REJECTED) */}
            {selectedMenu && (selectedMenu.status === 'DRAFT' || selectedMenu.status === 'REJECTED') && !isPrincipal && (
              <button
                onClick={handleSubmitForReview}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Gửi Hiệu trưởng duyệt</span>
              </button>
            )}

            {/* Badge cho HIỆU TRƯỞNG khi menu đang là DRAFT (CV Dinh dưỡng chưa gửi duyệt) */}
            {selectedMenu && selectedMenu.status === 'DRAFT' && isPrincipal && (
              <div className="px-3.5 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Bản dự thảo (Chờ CV Dinh dưỡng gửi duyệt)</span>
              </div>
            )}

            {/* Badge cho HIỆU TRƯỞNG khi menu đang REJECTED (Chờ CV Dinh dưỡng sửa lại) */}
            {selectedMenu && selectedMenu.status === 'REJECTED' && isPrincipal && (
              <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Đã từ chối (Chờ CV Dinh dưỡng sửa lại)</span>
              </div>
            )}

            {/* Trạng thái CHỜ DUYỆT cho Chuyên gia Dinh dưỡng */}
            {selectedMenu && selectedMenu.status === 'SUBMITTED_FOR_REVIEW' && !isPrincipal && (
              <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>Đang chờ Hiệu trưởng duyệt</span>
              </div>
            )}

            {/* Nút Duyệt / Từ chối (CHỈ DÀNH CHO HIỆU TRƯỞNG / BGH) */}
            {selectedMenu && selectedMenu.status === 'SUBMITTED_FOR_REVIEW' && isPrincipal && (
              <button
                onClick={() => setIsApprovalModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/25 flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hiệu trưởng: Phê duyệt / Từ chối</span>
              </button>
            )}

            {/* Trạng thái ĐÃ DUYỆT cho Chuyên gia Dinh dưỡng */}
            {selectedMenu && selectedMenu.status === 'APPROVED' && !isPrincipal && (
              <div className="px-3.5 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Đã được Hiệu trưởng duyệt (Chờ BGH công bố)</span>
              </div>
            )}

            {/* Nút Khóa & Công Bố (CHỈ DÀNH CHO HIỆU TRƯỞNG / BGH sau khi đã duyệt) */}
            {selectedMenu && selectedMenu.status === 'APPROVED' && isPrincipal && (
              <button
                onClick={handlePublish}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/25 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>Hiệu trưởng: Khóa & Công bố</span>
              </button>
            )}

            {/* Badge ĐÃ KHÓA & CÔNG BỐ TOÀN TRƯỜNG */}
            {selectedMenu && selectedMenu.status === 'ACTIVE' && (
              <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>Đã khóa & Công bố toàn trường</span>
              </div>
            )}

            {/* Nút In / Xuất PDF */}
            {selectedMenu && (
              <button
                onClick={handleOpenPrintPreview}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                title="Xem trước và In thực đơn (PDF A4)"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            {/* Nút Xóa Mềm */}
            {selectedMenu && !showDeleted && selectedMenu.status !== 'ACTIVE' && (
              <button
                onClick={handleSoftDelete}
                className="p-2.5 rounded-2xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                title="Xóa mềm thực đơn vào thùng rác"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Nút Khôi phục nếu đang ở Thùng rác */}
            {selectedMenu && showDeleted && (
              <button
                onClick={() => handleRestore(selectedMenu.id)}
                className="px-3 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Khôi phục bản này</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. MA TRẬN THỰC ĐƠN TUẦN 5 NGÀY x 5 BỮA ĂN */}
        <WeeklyGridTable
          menu={selectedMenu}
          readOnly={
            isPrincipal ||
            selectedMenu?.status === 'ACTIVE' ||
            selectedMenu?.status === 'SUBMITTED_FOR_REVIEW' ||
            selectedMenu?.status === 'APPROVED' ||
            showDeleted
          }
          onOpenDishDrawer={(slot) => {
            if (isPrincipal) return;
            setActiveSlot(slot);
            setIsDishDrawerOpen(true);
          }}
          onRemoveDish={handleRemoveDish}
        />
      </main>

      {/* 5. POPUP RIGHT SLIDE-OVER DRAWER (Làm mờ phần còn lại của màn hình) */}
      {/* Drawer 1: Tạo/Sửa Thực đơn tuần */}
      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        onSubmit={handleSaveMenu}
        initialData={selectedMenu}
        mode={menuDrawerMode}
      />

      {/* Drawer 2: Tinh chỉnh món ăn, định lượng, món thay thế */}
      <DishAdjustmentDrawer
        isOpen={isDishDrawerOpen}
        onClose={() => setIsDishDrawerOpen(false)}
        onSubmit={handleAdjustDish}
        dishes={availableDishes}
        initialSlot={activeSlot}
      />

      {/* Modal 3: Import Excel */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImport={handleImportExcel}
      />

      {/* Modal 4: Phê duyệt / Từ chối (BGH) */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        menu={selectedMenu}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Modal 5: Xem trước in ấn & Xuất PDF/Excel */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        data={printData}
        onDownloadCsv={handleDownloadExcel}
      />
    </div>
  );
};
