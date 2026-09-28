import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Coffee,
  GraduationCap,
  Sparkles,
  Copy,
  Search,
  ChevronDown,
} from 'lucide-react';
import { ClassItem } from '../types';

interface EvaluationControlsProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedMealType: string;
  onMealTypeChange: (meal: string) => void;
  classes: ClassItem[];
  selectedClassId: string;
  onClassChange: (classId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMarkAllAteAll: () => void;
  onCopyMenu?: () => void;
  totalStudents?: number;
}

export const EvaluationControls: React.FC<EvaluationControlsProps> = ({
  selectedDate,
  onDateChange,
  selectedMealType,
  onMealTypeChange,
  classes,
  selectedClassId,
  onClassChange,
  searchQuery,
  onSearchChange,
  onMarkAllAteAll,
  onCopyMenu,
  totalStudents = 30,
}) => {
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

  // Format date display (e.g. Hôm nay, Thứ Sáu 25/10/2024)
  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[d.getDay()];
    const dateFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    return `Hôm nay, ${dayName} ${dateFormatted}`;
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="max-w-[1440px] mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* Left Side: Date, Meals, Class */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-500 transition"
              title="Ngày trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>{formatDateDisplay(selectedDate)}</span>
            </div>
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-500 transition"
              title="Ngày tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Meal Sessions */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => onMealTypeChange('LUNCH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedMealType === 'LUNCH'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Bữa Trưa (10:30 - 11:30)</span>
            </button>

            <button
              onClick={() => onMealTypeChange('AFTERNOON_SNACK')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedMealType === 'AFTERNOON_SNACK'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Bữa Xế (14:15 - 15:00)</span>
            </button>
          </div>

          {/* Class Dropdown */}
          <div className="relative">
            <select
              value={selectedClassId}
              onChange={(e) => onClassChange(e.target.value)}
              className="appearance-none bg-teal-50/70 hover:bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold pl-8 pr-8 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-sm transition"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.totalStudents || 30} suất
                </option>
              ))}
            </select>
            <GraduationCap className="w-4 h-4 text-teal-700 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-teal-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right Side: Quick Action & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Quick Button: Cả lớp ăn hết suất (100%) */}
          <button
            onClick={onMarkAllAteAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cả lớp ăn hết suất (100%)</span>
          </button>

          {/* Quick Button: Sao chép thực đơn */}
          <button
            onClick={onCopyMenu}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 shadow-sm transition"
          >
            <Copy className="w-3.5 h-3.5 text-teal-600" />
            <span>Sao chép thực đơn</span>
          </button>

          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm tên bé..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-xs pl-8 pr-3 py-2 rounded-xl text-slate-800 placeholder:text-slate-400 transition focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
