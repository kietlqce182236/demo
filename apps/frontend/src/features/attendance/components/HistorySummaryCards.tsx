import React from 'react';
import { UserCheck, Utensils, Flag, ShieldCheck, TrendingUp, Smile } from 'lucide-react';
import { AttendanceHistoryResponse } from '../types';

interface HistorySummaryCardsProps {
  summary?: AttendanceHistoryResponse['summary'];
}

export const HistorySummaryCards: React.FC<HistorySummaryCardsProps> = ({ summary }) => {
  const attendanceRate = summary?.attendanceRate ?? 0;
  const attendanceDiff = summary?.attendanceRateDiff ?? 0;
  const avgAttendanceText = summary?.avgAttendanceText ?? '—';

  const allEatenRate = summary?.allEatenRate ?? 0;
  const eatenEvaluationText = summary?.eatenEvaluationText ?? (allEatenRate >= 80 ? 'Thích nghi tốt' : 'Cần theo dõi');
  const eatenTargetText = summary?.eatenTargetText ?? 'Mục tiêu ≥ 80%';

  const specialCareCount = summary?.specialCareCount ?? 0;
  const specialCareTag = summary?.specialCareTag ?? 'Cần theo dõi';
  const specialCareChildren = summary?.specialCareChildren && summary.specialCareChildren.length > 0
    ? summary.specialCareChildren.join(', ')
    : 'Không có trẻ cần chú ý';

  const specialDietCount = summary?.specialDietCount ?? 0;
  const dietSafetyRate = summary?.dietSafetyRate ?? 100;
  const dietIncidentsCount = summary?.dietIncidentsCount ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Tỷ lệ đi học ăn bán trú TB */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Tỷ lệ đi học ăn bán trú TB</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {attendanceRate}%
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100 text-[11px]">
          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-extrabold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{attendanceDiff}% so tuần trước</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-medium">{avgAttendanceText}</span>
        </div>
      </div>

      {/* Card 2: Tỷ lệ ăn hết suất TB */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Tỷ lệ ăn hết suất TB</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {allEatenRate}%
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-sm">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100 text-[11px]">
          <span className="inline-flex items-center gap-1 text-sky-700 font-extrabold">
            <Smile className="w-3.5 h-3.5 text-sky-600" />
            <span>{eatenEvaluationText}</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-medium">{eatenTargetText}</span>
        </div>
      </div>

      {/* Card 3: Trẻ cần lưu ý dinh dưỡng */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Trẻ cần lưu ý dinh dưỡng</p>
            <div className="flex items-baseline gap-1 mt-2">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {String(specialCareCount).padStart(2, '0')}
              </h3>
              <span className="text-xs font-bold text-slate-500">bé</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
            <Flag className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100 text-[11px]">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
            {specialCareTag}
          </span>
          <span className="text-slate-500 font-medium truncate max-w-[120px]" title={specialCareChildren}>
            {specialCareChildren}
          </span>
        </div>
      </div>

      {/* Card 4: Suất ăn chế độ riêng / Dị ứng */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Suất ăn chế độ riêng / Dị ứng</p>
            <div className="flex items-baseline gap-1 mt-2">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {specialDietCount}
              </h3>
              <span className="text-xs font-bold text-slate-500">suất/tuần</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100 text-[11px]">
          <span className="inline-flex items-center gap-1 text-teal-700 font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>An toàn {dietSafetyRate}%</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-medium">{dietIncidentsCount} sự cố</span>
        </div>
      </div>
    </div>
  );
};
