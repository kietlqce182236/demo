import React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';
import { ClassItem } from '../types';

interface AttendanceControlsProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  mealFilter: string;
  onMealFilterChange: (filter: string) => void;
  classes: ClassItem[];
  selectedClassId: string;
  onClassChange: (classId: string) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  onMarkAllPresent: () => void;
  onSyncMorning: () => void;
  isSyncing?: boolean;
}

export const AttendanceControls: React.FC<AttendanceControlsProps> = ({
  selectedDate,
  onDateChange,
  mealFilter,
  onMealFilterChange,
  classes,
  selectedClassId,
  onClassChange,
  searchQuery,
  onSearchChange,
  onMarkAllPresent,
  onSyncMorning,
  isSyncing = false,
}) => {
  // Format date to "Hôm nay, Thứ Sáu 25/10/2024" format
  const formatDisplayDate = (dStr: string) => {
    try {
      const date = new Date(dStr);
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[date.getDay()];
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dayName} ${dd}/${mm}/${yyyy}`;
    } catch {
      return dStr;
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  return (
    <div className="space-y-3.5">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date Selector */}
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          <button
            onClick={handlePrevDay}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 text-xs font-bold text-slate-800">
            <CalendarIcon className="w-4 h-4 text-teal-600" />
            <span>{formatDisplayDate(selectedDate)}</span>
          </div>
          <button
            onClick={handleNextDay}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Meal Scope Toggle Buttons */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => onMealFilterChange('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              mealFilter === 'ALL'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cả ngày (Trưa + Xế)
          </button>
          <button
            onClick={() => onMealFilterChange('LUNCH')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              mealFilter === 'LUNCH'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chỉ ăn trưa
          </button>
          <button
            onClick={() => onMealFilterChange('SNACK')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              mealFilter === 'SNACK'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chỉ ăn xế
          </button>
        </div>

        {/* Class Selector Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm text-xs font-bold text-slate-800 cursor-pointer">
            <GraduationCap className="w-4 h-4 text-teal-600" />
            <select
              value={selectedClassId}
              onChange={(e) => onClassChange(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-4 font-bold text-slate-800"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.totalStudents} bé)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Filter & Quick Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Child Search Input */}
        <div className="flex-1 min-w-[280px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm tên bé (Bảo An, Khang...) hoặc mã BM-HS..."
            className="w-full bg-white text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm transition text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onMarkAllPresent}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:scale-95 text-white rounded-2xl text-xs font-bold shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Điểm danh CÓ ĂN tất cả</span>
          </button>

          <button
            onClick={onSyncMorning}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 text-teal-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Lấy từ điểm danh đầu giờ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
