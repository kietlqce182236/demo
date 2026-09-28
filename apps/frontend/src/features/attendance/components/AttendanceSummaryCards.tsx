import React from 'react';
import { Users, Utensils, UtensilsCrossed, AlertTriangle, ShieldAlert, HeartPulse } from 'lucide-react';

interface AttendanceSummaryCardsProps {
  summary: {
    totalClassStudents: number;
    officialRatioPercent: number;
    registeredToday: number;
    registeredRatioPercent: number;
    absentCount: number;
    absentPermitted: number;
    absentUnpermitted: number;
    dietSpecialCount: number;
    dietSpecialSummary: string;
  };
}

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Tổng sĩ số lớp */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
        <div>
          <p className="text-xs font-semibold text-slate-500">Tổng sĩ số lớp</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-black text-slate-900">{summary.totalClassStudents}</span>
            <span className="text-xs font-semibold text-slate-500">trẻ</span>
          </div>
          <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {summary.officialRatioPercent}% học sinh chính thức
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Card 2: Đăng ký ăn hôm nay */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
        <div>
          <p className="text-xs font-semibold text-slate-500">Đăng ký ăn hôm nay</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-black text-teal-700">{summary.registeredToday}</span>
            <span className="text-xs font-semibold text-slate-500">/ {summary.totalClassStudents} bé ({summary.registeredRatioPercent}%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden max-w-[120px]">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all"
              style={{ width: `${summary.registeredRatioPercent}%` }}
            ></div>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <Utensils className="w-6 h-6" />
        </div>
      </div>

      {/* Card 3: Nghỉ ăn / Vắng mặt */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
        <div>
          <p className="text-xs font-semibold text-slate-500">Nghỉ ăn / Vắng mặt</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-black text-amber-600">{summary.absentCount}</span>
            <span className="text-xs font-semibold text-slate-500">trẻ</span>
          </div>
          <p className="text-[11px] font-medium text-amber-700 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {summary.absentPermitted} có phép • {summary.absentUnpermitted} không phép
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
      </div>

      {/* Card 4: Chế độ kiêng / Dị ứng */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
        <div>
          <p className="text-xs font-semibold text-slate-500">Chế độ kiêng / Dị ứng</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-black text-red-600">{summary.dietSpecialCount}</span>
            <span className="text-xs font-semibold text-slate-500">cần món riêng</span>
          </div>
          <p className="text-[11px] font-medium text-red-700 mt-1 flex items-center gap-1 truncate max-w-[150px]" title={summary.dietSpecialSummary}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {summary.dietSpecialSummary}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
          <HeartPulse className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
