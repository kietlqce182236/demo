import React from 'react';
import { Search, Calendar, Filter, RotateCcw, ChevronDown } from 'lucide-react';

interface ClassOption {
  id: string;
  name: string;
  gradeLevel: string;
  blockName: string;
}

interface SnackRosterFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  gradeLevel: string;
  onGradeLevelChange: (val: string) => void;
  classId: string;
  onClassIdChange: (val: string) => void;
  classes: ClassOption[];
  date: string;
  onDateChange: (val: string) => void;
  paymentStatus: string;
  onPaymentStatusChange: (val: string) => void;
  onApplyFilter: () => void;
  onResetFilter: () => void;
}

export const SnackRosterFilterBar: React.FC<SnackRosterFilterBarProps> = ({
  search,
  onSearchChange,
  gradeLevel,
  onGradeLevelChange,
  classId,
  onClassIdChange,
  classes,
  date,
  onDateChange,
  paymentStatus,
  onPaymentStatusChange,
  onApplyFilter,
  onResetFilter,
}) => {
  // Filter classes based on selected grade level
  const filteredClasses = classes.filter((c) => {
    if (!gradeLevel || gradeLevel === 'ALL') return true;
    return c.blockName === gradeLevel || c.gradeLevel === gradeLevel;
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3 items-end">
        {/* 1. Tìm kiếm học sinh */}
        <div className="lg:col-span-3">
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Tìm kiếm học sinh
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã học sinh..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onApplyFilter()}
              className="w-full bg-[#f8fafc] focus:bg-white text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* 2. Khối học */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Khối học
          </label>
          <div className="relative">
            <select
              value={gradeLevel}
              onChange={(e) => {
                onGradeLevelChange(e.target.value);
                onClassIdChange('ALL');
              }}
              className="w-full appearance-none bg-[#f8fafc] focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition text-slate-800 font-medium pr-8 cursor-pointer"
            >
              <option value="ALL">Tất cả các khối</option>
              <option value="Khối Nhà trẻ">Khối Nhà trẻ</option>
              <option value="Khối Mầm">Khối Mầm</option>
              <option value="Khối Chồi">Khối Chồi</option>
              <option value="Khối Lá">Khối Lá</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 3. Lớp học */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Lớp học
          </label>
          <div className="relative">
            <select
              value={classId}
              onChange={(e) => onClassIdChange(e.target.value)}
              className="w-full appearance-none bg-[#f8fafc] focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition text-slate-800 font-medium pr-8 cursor-pointer"
            >
              <option value="ALL">Tất cả các lớp</option>
              {filteredClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 4. Ngày phục vụ */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Ngày phục vụ
          </label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full bg-[#f8fafc] focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition text-slate-800 font-medium cursor-pointer"
            />
          </div>
        </div>

        {/* 5. Trạng thái phí */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Trạng thái phí
          </label>
          <div className="relative">
            <select
              value={paymentStatus}
              onChange={(e) => onPaymentStatusChange(e.target.value)}
              className="w-full appearance-none bg-[#f8fafc] focus:bg-white text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition text-slate-800 font-medium pr-8 cursor-pointer"
            >
              <option value="PAID">Đã hoàn thành</option>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="UNPAID">Chưa hoàn thành</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons: Filter & Reset */}
        <div className="lg:col-span-1 flex items-center gap-2">
          {/* Apply Filter Button */}
          <button
            onClick={onApplyFilter}
            className="flex-1 lg:flex-none p-2.5 bg-[#143d2c] hover:bg-[#0e2d20] text-white rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center"
            title="Áp dụng bộ lọc"
          >
            <Filter className="w-4 h-4 fill-white text-white" />
          </button>

          {/* Reset Filter Button */}
          <button
            onClick={onResetFilter}
            className="flex-1 lg:flex-none p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition active:scale-95 flex items-center justify-center"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
