import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { DayTabItem } from '../types';

interface DaySelectorTabsProps {
  days: DayTabItem[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const DaySelectorTabs: React.FC<DaySelectorTabsProps> = ({
  days,
  selectedDate,
  onSelectDate,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Week Label */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 tracking-tight">
              Thực đơn & Sức ăn Tuần 9 (Tháng 10/2024)
            </h3>
            <p className="text-[11px] text-slate-500">
              Chọn ngày trong tuần để xem chi tiết từng bữa ăn của con
            </p>
          </div>
        </div>

        {/* Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {days.map((day) => {
            const isSelected = day.date === selectedDate;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{day.dayName}</span>
                <span className={isSelected ? 'text-teal-200 text-[11px]' : 'text-slate-400 text-[11px]'}>
                  {day.dateFormatted}
                </span>
                {day.isCompleted && (
                  <Check className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
