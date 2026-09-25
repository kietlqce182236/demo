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
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalStudents?: number;
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
  selectedStatus = 'ALL',
  onStatusChange,
  searchQuery,
  onSearchChange,
  totalStudents = 32,
}) => {
  const currentClass = classes.find((c) => c.id === selectedClassId);

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
            onClick={() => onPeriodChange('custom')}
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
                Lớp học hiện tại: {cls.name} • {cls.totalStudents || totalStudents} bé
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
            <option value="ALL">Lọc nhanh tình trạng: Tất cả ngày (Bao gồm ghi chú đặc biệt)</option>
            <option value="PRESENT">Chỉ xem: Có ăn (Cả ngày)</option>
            <option value="LUNCH_ONLY">Chỉ xem: Chỉ ăn trưa</option>
            <option value="ABSENT">Chỉ xem: Nghỉ có phép / Vắng ăn</option>
            <option value="SPECIAL_NOTE">Chỉ xem: Có ghi chú đặc biệt / Cần theo dõi</option>
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
            placeholder="Tìm tên bé hoặc mã số (vd: An, M1-04)..."
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
    </div>
  );
};
