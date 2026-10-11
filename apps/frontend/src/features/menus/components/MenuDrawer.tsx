import React, { useState, useEffect } from 'react';
import { X, Calendar, Sparkles, Layers, ShieldCheck, AlertCircle } from 'lucide-react';
import { WeeklyMenu, CreateMenuPayload } from '../api/weekly-menus.api';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateMenuPayload) => Promise<void>;
  initialData?: WeeklyMenu | null;
  mode?: 'create' | 'edit';
  existingMenus?: WeeklyMenu[];
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
  existingMenus = [],
}) => {
  const [title, setTitle] = useState('');
  const [targetAgeGroup, setTargetAgeGroup] = useState('ALL_AGES');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cycleWeekNumber, setCycleWeekNumber] = useState(38);
  const [menuCycleType, setMenuCycleType] = useState('WEEKLY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kiểm tra trùng lặp khoảng thời gian với thực đơn đã có
  const findOverlappingMenu = (start: string, end: string, ageGroup: string): WeeklyMenu | null => {
    if (!start || !end || !existingMenus || existingMenus.length === 0) return null;
    const s = start.split('T')[0];
    const e = end.split('T')[0];
    return (
      existingMenus.find((m) => {
        // Bỏ qua chính menu đang sửa
        if (mode === 'edit' && initialData && m.id === initialData.id) return false;
        if (m.status === 'REJECTED' || m.status === 'ARCHIVED') return false;
        const mS = m.startDate?.split('T')[0];
        const mE = m.endDate?.split('T')[0];
        if (!mS || !mE) return false;
        const isOverlapDates = s <= mE && e >= mS;
        if (!isOverlapDates) return false;

        if (ageGroup === 'ALL_AGES' || m.targetAgeGroup === 'ALL_AGES') return true;
        const isToddler1 = ageGroup === 'TODDLER_18_36M';
        const isToddler2 = m.targetAgeGroup === 'TODDLER_18_36M';
        return isToddler1 === isToddler2;
      }) || null
    );
  };

  const conflictingMenu = findOverlappingMenu(startDate, endDate, targetAgeGroup);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setTitle(initialData.title);
      setTargetAgeGroup(initialData.targetAgeGroup);
      setStartDate(initialData.startDate?.split('T')[0] || '');
      setEndDate(initialData.endDate?.split('T')[0] || '');
      setCycleWeekNumber(initialData.cycleWeekNumber || 1);
      setMenuCycleType(initialData.menuCycleType || 'WEEKLY');
    } else {
      // Default: Tuần hiện tại
      const now = new Date();
      const monday = new Date(now);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1); // Monday
      monday.setDate(diff);

      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);

      setTitle(`Thực đơn Bán trú Tuần ${getWeekNumber(now)} Tháng ${now.getMonth() + 1}`);
      setStartDate(monday.toISOString().split('T')[0]);
      setEndDate(friday.toISOString().split('T')[0]);
      setCycleWeekNumber(getWeekNumber(now));
      setTargetAgeGroup('ALL_AGES');
      setMenuCycleType('WEEKLY');
    }
    setError(null);
  }, [initialData, mode, isOpen]);

  function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return weekNo;
  }

  /**
   * =========================================================================================
   * [LUỒNG TẠO THỰC ĐƠN - BƯỚC 2/6: THU THẬP & VALIDATE DỮ LIỆU TẠI DRAWER (FRONTEND COMPONENT)]
   * =========================================================================================
   * - File này: `apps/frontend/src/features/menus/components/MenuDrawer.tsx`
   * - Được gọi từ: File 1 `WeeklyMenuManagementPage.tsx` (qua prop `onSubmit={handleSaveMenu}`).
   * - Nhiệm vụ:
   *   1. Thu thập dữ liệu form: `title`, `targetAgeGroup`, `startDate`, `endDate`, `menuCycleType`.
   *   2. Validate Client-side: Kiểm tra rỗng, ngày bắt đầu <= ngày kết thúc.
   *   3. Chạy hàm `findOverlappingMenu()` kiểm tra xung đột với các menu hiện có trong `existingMenus`.
   * - GỌI FILE TIẾP THEO:
   *   -> Chuyển giao `payload` về lại cho File 1 `WeeklyMenuManagementPage.tsx` thông qua `await onSubmit(payload)`.
   * =========================================================================================
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên thực đơn tuần.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Vui lòng chọn ngày bắt đầu và kết thúc.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }
    if (conflictingMenu) {
      setError(`Không thể lưu thực đơn! Khoảng thời gian từ ${startDate} đến ${endDate} đã có thực đơn "${conflictingMenu.title}" (${conflictingMenu.status}). Vui lòng chọn tuần khác.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      // GỌI NGƯỢC VỀ: onSubmit() được định nghĩa tại handleSaveMenu trong WeeklyMenuManagementPage.tsx
      await onSubmit({
        title: title.trim(),
        targetAgeGroup,
        startDate,
        endDate,
        cycleWeekNumber: Number(cycleWeekNumber),
        menuCycleType,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu thực đơn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Nền làm mờ phần còn lại của màn hình (Backdrop Blur) */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer trượt từ bên phải */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header Drawer */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold shadow-inner">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {mode === 'create' ? 'Tạo thực đơn tuần mới' : 'Chỉnh sửa thông tin thực đơn'}
                </h2>
                <p className="text-xs text-slate-500">
                  {mode === 'create' ? 'Thiết lập chu kỳ dinh dưỡng mầm non' : `Phiên bản v${initialData?.version || 1}.0`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Form */}
          <form id="menu-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Tên thực đơn */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên thực đơn tuần <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Thực đơn Tuần 38 (Khối Mầm - Chồi - Lá)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                required
              />
            </div>

            {/* Nhóm tuổi áp dụng */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Độ tuổi / Khối lớp <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetAgeGroup}
                onChange={(e) => setTargetAgeGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white"
              >
                <option value="ALL_AGES">Toàn trường (Khối Mầm - Chồi - Lá)</option>
                <option value="TODDLER_18_36M">Nhà trẻ (18 - 36 tháng)</option>
                <option value="KINDERGARTEN_3_4Y">Mẫu giáo Bé (3 - 4 tuổi)</option>
                <option value="KINDERGARTEN_4_5Y">Mẫu giáo Nhỡ (4 - 5 tuổi)</option>
                <option value="KINDERGARTEN_5_6Y">Mẫu giáo Lớn (5 - 6 tuổi)</option>
              </select>
            </div>

            {/* Ngày bắt đầu & Ngày kết thúc */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Từ ngày (Thứ 2) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đến ngày (Thứ 6) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  required
                />
              </div>
            </div>

            {/* Cảnh báo trùng lặp khoảng thời gian thực đơn */}
            {conflictingMenu && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-rose-900">Trùng lặp thời gian thực đơn</span>
                  <span>
                    Khoảng thời gian từ <strong>{startDate}</strong> đến <strong>{endDate}</strong> đã có thực đơn "<strong>{conflictingMenu.title}</strong>" (Trạng thái: {conflictingMenu.status}). Vui lòng chọn tuần khác.
                  </span>
                </div>
              </div>
            )}

            {/* Tuần chu kỳ & Loại chu kỳ */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tuần số (Học kỳ)
                </label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={cycleWeekNumber}
                  onChange={(e) => setCycleWeekNumber(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Loại chu kỳ
                </label>
                <select
                  value={menuCycleType}
                  onChange={(e) => setMenuCycleType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white"
                >
                  <option value="WEEKLY">Theo tuần (5 ngày T2 - T6)</option>
                  <option value="BIWEEKLY">Theo 2 tuần</option>
                  <option value="MONTHLY">Theo tháng</option>
                  <option value="CUSTOM">Tùy biến</option>
                </select>
              </div>
            </div>

            {/* Quy chuẩn áp dụng */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <p className="font-bold">Tiêu chuẩn dinh dưỡng Thông tư 28/2016/TT-BGDĐT</p>
                <p className="text-emerald-700 mt-0.5 leading-relaxed">
                  Hệ thống tự động kích hoạt Rule Engine kiểm tra calo (600 - 882 Kcal), tỷ lệ P:L:G (13-20% : 25-35% : 52-60%) và quét dị ứng cho từng trẻ.
                </p>
              </div>
            </div>
          </form>

          {/* Footer Drawer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="menu-form"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{mode === 'create' ? 'Tạo thực đơn' : 'Cập nhật'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
