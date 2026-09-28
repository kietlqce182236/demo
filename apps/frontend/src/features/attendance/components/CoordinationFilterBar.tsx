import React from 'react';
import { Search, Filter, Calendar, Users, Utensils, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { CoordinationQueryParams } from '../types';

interface CoordinationFilterBarProps {
  filters: CoordinationQueryParams;
  onFilterChange: (newFilters: Partial<CoordinationQueryParams>) => void;
  onResetFilters: () => void;
  availableClasses: Array<{
    id: string;
    name: string;
    gradeLevel: string;
    totalStudents: number;
  }>;
}

export const CoordinationFilterBar: React.FC<CoordinationFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableClasses,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
      {/* Top Filter Row: Search & Class Picker */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Tìm theo tên bé, mã học sinh, nội dung dặn dò, giáo viên phụ trách..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Class Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <Users className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Lớp:</span>
            <select
              value={filters.classId || ''}
              onChange={(e) => onFilterChange({ classId: e.target.value || undefined })}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">Tất cả các lớp</option>
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.totalStudents} trẻ)
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Ngày:</span>
            <input
              type="date"
              value={filters.date || ''}
              onChange={(e) => onFilterChange({ date: e.target.value || undefined })}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Bottom Filter Row: Session, Priority, Status, Type, and Reset */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
        <span className="text-slate-500 font-bold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" /> Bộ lọc nhanh:
        </span>

        {/* Bữa ăn */}
        <select
          value={filters.mealSession || 'ALL'}
          onChange={(e) => onFilterChange({ mealSession: e.target.value })}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg font-semibold text-slate-700 cursor-pointer focus:outline-none"
        >
          <option value="ALL">Tất cả bữa ăn</option>
          <option value="BREAKFAST">Bữa sáng</option>
          <option value="LUNCH">Bữa trưa chính</option>
          <option value="AFTERNOON_SNACK">Bữa xế chiều</option>
          <option value="ALL_DAY">Cả ngày</option>
        </select>

        {/* Mức độ ưu tiên */}
        <select
          value={filters.priority || 'ALL'}
          onChange={(e) => onFilterChange({ priority: e.target.value })}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg font-semibold text-slate-700 cursor-pointer focus:outline-none"
        >
          <option value="ALL">Tất cả mức ưu tiên</option>
          <option value="URGENT">🚨 Khẩn cấp</option>
          <option value="HIGH">⚠️ Quan trọng</option>
          <option value="NORMAL">ℹ️ Tiêu chuẩn</option>
        </select>

        {/* Trạng thái xử lý */}
        <select
          value={filters.status || 'ALL'}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg font-semibold text-slate-700 cursor-pointer focus:outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">⏳ Chờ tiếp nhận</option>
          <option value="ACKNOWLEDGED">🍳 Bếp đã tiếp nhận</option>
          <option value="RESOLVED">✅ Đã hoàn thành</option>
        </select>

        {/* Phân loại ghi chú */}
        <select
          value={filters.noteType || 'ALL'}
          onChange={(e) => onFilterChange({ noteType: e.target.value })}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg font-semibold text-slate-700 cursor-pointer focus:outline-none"
        >
          <option value="ALL">Tất cả loại ghi chú</option>
          <option value="ALLERGY_WARNING">Cảnh báo dị ứng</option>
          <option value="SPECIAL_DIET">Chế độ ăn riêng (Cháo mềm)</option>
          <option value="PORTION_ADJUSTMENT">Điều chỉnh / Cắt suất</option>
          <option value="MEDICATION_FEEDING">Uống thuốc sau ăn</option>
          <option value="KITCHEN_REQUEST">Yêu cầu nhà bếp</option>
        </select>

        {/* Reset button */}
        {(filters.search || filters.classId || filters.mealSession !== 'ALL' || filters.priority !== 'ALL' || filters.status !== 'ALL' || filters.noteType !== 'ALL') && (
          <button
            onClick={onResetFilters}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-bold transition border border-rose-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>
    </div>
  );
};
