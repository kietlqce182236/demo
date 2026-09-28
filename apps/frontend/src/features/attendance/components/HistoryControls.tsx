import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  School,
  Filter,
  Search,
  X,
  CalendarRange,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ClassItem } from '../types';

interface HistoryControlsProps {
  classes: ClassItem[];
  selectedClassId: string;
  onClassChange: (classId: string) => void;
  dateRangeText: string;
  weekLabel: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  selectedPeriod: 'week' | 'month' | 'semester' | 'custom';
  onPeriodChange: (period: 'week' | 'month' | 'semester' | 'custom') => void;
  onOpenCustomDate?: () => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalStudents?: number;
  totalFilteredItems?: number;
  totalWeekMeals?: number;
  onResetFilters?: () => void;
}

export const HistoryControls: React.FC<HistoryControlsProps> = ({
  classes,
  selectedClassId,
  onClassChange,
  dateRangeText = '21/09 - 25/09/2026',
  weekLabel = 'Tuần 4',
  onPrevWeek,
  onNextWeek,
  selectedPeriod = 'week',
  onPeriodChange,
  onOpenCustomDate,
  selectedStatus = 'ALL',
  onStatusChange,
  searchQuery,
  onSearchChange,
  totalStudents = 32,
  totalFilteredItems,
  totalWeekMeals,
  onResetFilters,
}) => {
  const currentClass = classes.find((c) => c.id === selectedClassId);

  const isFilterActive =
    selectedStatus !== 'ALL' ||
    searchQuery.trim() !== '' ||
    selectedPeriod !== 'week';

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'PRESENT':
        return 'Có ăn (Cả ngày)';
      case 'LUNCH_ONLY':
        return 'Chỉ ăn trưa';
      case 'ABSENT':
        return 'Nghỉ học / Vắng';
      case 'SPECIAL_NOTE':
        return 'Có ghi chú / Suất riêng';
      case 'PORTION_ALL':
        return 'Ăn hết suất (100%)';
      case 'PORTION_HALF':
        return 'Ăn một nửa (50%)';
      case 'PORTION_NONE':
        return 'Ăn ít / Bỏ bữa';
      default:
        return s;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3.5">
      {/* Row 1: Date Range Navigator & Period Presets */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
        {/* Left: Date Range with Prev/Next buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shadow-inner">
            <button
              onClick={onPrevWeek}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-black text-slate-800 tracking-tight">
                {dateRangeText}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                {weekLabel}
              </span>
            </div>

            <button
              onClick={onNextWeek}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
              title="Tuần kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Period Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => onPeriodChange('week')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedPeriod === 'week'
                ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Tuần này
          </button>

          <button
            onClick={() => onPeriodChange('month')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedPeriod === 'month'
                ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Tháng 09/2026
          </button>

          <button
            onClick={() => onPeriodChange('semester')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedPeriod === 'semester'
                ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Học kỳ I
          </button>

          <button
            onClick={() => {
              onPeriodChange('custom');
              onOpenCustomDate?.();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedPeriod === 'custom'
                ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Tùy chọn ngày</span>
          </button>
        </div>
      </div>

      {/* Row 2: Class Selector, Status Filter & Search Input */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Class Selection Dropdown */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-teal-600">
            <School className="w-4 h-4" />
          </div>
          <select
            value={selectedClassId}
            onChange={(e) => onClassChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-bold rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition cursor-pointer appearance-none"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                Lớp học: {cls.name} • {cls.totalStudents || totalStudents} bé
              </option>
            ))}
            {classes.length === 0 && (
              <option value="">Lớp Mầm 1 (3-4 tuổi) • {totalStudents} bé</option>
            )}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>

        {/* Quick Status Filter Dropdown */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500">
            <Filter className="w-4 h-4" />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-bold rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition cursor-pointer appearance-none"
          >
            <option value="ALL">Lọc tình trạng: Tất cả (Cả ngày, nghỉ, suất riêng)</option>
            <option value="PRESENT">1. Chỉ xem: Có ăn (Cả ngày)</option>
            <option value="LUNCH_ONLY">2. Chỉ xem: Chỉ ăn trưa</option>
            <option value="ABSENT">3. Chỉ xem: Nghỉ có phép / Vắng ăn</option>
            <option value="SPECIAL_NOTE">4. Chỉ xem: Suất dị ứng / Có lưu ý y tế</option>
            <option value="PORTION_ALL">5. Mức độ ăn: Ăn hết suất (100%)</option>
            <option value="PORTION_HALF">6. Mức độ ăn: Ăn một nửa (50%)</option>
            <option value="PORTION_NONE">7. Mức độ ăn: Ăn ít / Bỏ bữa (≤ 20%)</option>
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Tìm tên bé, mã số, món ăn hoặc ghi chú..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-medium rounded-xl border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Row 3: Active Filters & Quick Reset Bar (Rendered when filtering is active) */}
      {isFilterActive && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>Đang lọc:</span>
            </span>

            {selectedPeriod !== 'week' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold">
                <span>Kỳ: {selectedPeriod === 'month' ? 'Tháng 09/2026' : selectedPeriod === 'semester' ? 'Học kỳ I' : 'Tùy chọn'}</span>
                <button
                  onClick={() => onPeriodChange('week')}
                  className="hover:text-teal-950 p-0.5"
                  title="Quay lại tuần này"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                <span>Trạng thái: {getStatusLabel(selectedStatus)}</span>
                <button
                  onClick={() => onStatusChange('ALL')}
                  className="hover:text-amber-950 p-0.5"
                  title="Xóa lọc trạng thái"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-bold">
                <span>Từ khóa: "{searchQuery}"</span>
                <button
                  onClick={() => onSearchChange('')}
                  className="hover:text-sky-950 p-0.5"
                  title="Xóa từ khóa"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {typeof totalFilteredItems === 'number' && (
              <span className="text-[11px] text-slate-500 font-medium pl-1">
                (Tìm thấy <strong>{totalFilteredItems}</strong> bản ghi)
              </span>
            )}
          </div>

          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] font-extrabold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa tất cả bộ lọc</span>
          </button>
        </div>
      )}
    </div>
  );
};
