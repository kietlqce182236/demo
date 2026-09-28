import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MealPortionsHeaderProps {
  weekNumber: number;
  formattedDateRange: string;
  standardQuote: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onToday?: () => void;
}

export const MealPortionsHeader: React.FC<MealPortionsHeaderProps> = ({
  weekNumber,
  formattedDateRange,
  standardQuote,
  onPrevWeek,
  onNextWeek,
  onToday,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
            Quản trị Thực đơn Tuần & Kế hoạch Định lượng Suất ăn
          </h1>
          <span className="bg-sky-100 text-sky-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-sky-200">
            TUẦN {weekNumber}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">
          {standardQuote}
        </p>
      </div>

      {/* Date Range Navigation Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
          <button
            onClick={onPrevWeek}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-bold text-slate-700 select-none">
            Tuần {weekNumber}: {formattedDateRange}
          </span>
          <button
            onClick={onNextWeek}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition"
            title="Tuần kế tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onToday}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition active:scale-95"
        >
          Hôm nay
        </button>
      </div>
    </div>
  );
};
