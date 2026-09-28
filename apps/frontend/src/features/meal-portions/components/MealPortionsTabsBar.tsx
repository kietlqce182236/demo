import React from 'react';
import { Calendar, Scale, Lock, Info } from 'lucide-react';

interface MealPortionsTabsBarProps {
  activeTab: 'menu' | 'portion' | 'both';
  onTabChange: (tab: 'menu' | 'portion' | 'both') => void;
  studentCount: number;
}

export const MealPortionsTabsBar: React.FC<MealPortionsTabsBarProps> = ({
  activeTab,
  onTabChange,
  studentCount,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1 border-b border-slate-200 pb-3">
      {/* Left Segmented Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 w-fit">
        {/* Tab 1: UC46 Lịch Thực Đơn Tuần */}
        <button
          onClick={() => onTabChange('menu')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'menu' || activeTab === 'both'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <Calendar className="w-4 h-4 text-teal-600" />
          <span>Lịch Thực Đơn Tuần (UC46)</span>
        </button>

        {/* Tab 2: UC56 Kế hoạch Định lượng Suất ăn Nhà bếp */}
        <button
          onClick={() => onTabChange('portion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'portion'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4 text-emerald-500" />
          <span>Kế hoạch Định lượng Suất ăn Nhà bếp (UC56)</span>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200">
            Tự động x {studentCount} suất
          </span>
        </button>
      </div>

      {/* Right Warning / Read-only Notice */}
      <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/70 text-amber-800 text-[11px] px-3.5 py-1.5 rounded-xl font-medium max-w-xl">
        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>
          <strong>Chế độ chỉ đọc (Read-only):</strong> Thực đơn đã công bố phụ huynh. Mọi thay đổi đột xuất cần mở khóa BGH kèm biên bản.
        </span>
      </div>
    </div>
  );
};
