import React from 'react';
import { Utensils, Droplets, ShieldCheck, CheckCircle2, TrendingUp } from 'lucide-react';
import { ChildMenuConsumptionData } from '../types';

interface ConsumptionKPIStripProps {
  metrics?: Partial<ChildMenuConsumptionData['metrics']>;
}

export const ConsumptionKPIStrip: React.FC<ConsumptionKPIStripProps> = ({ metrics }) => {
  const safeMetrics = {
    consumptionRate: metrics?.consumptionRate ?? 98,
    consumptionStatusLabel: metrics?.consumptionStatusLabel || 'Bé ăn rất tốt, hết suất',
    waterIntakeToday: metrics?.waterIntakeToday || '750 / 800 ml',
    waterPercentage: metrics?.waterPercentage ?? 94,
    allergyStatusText: metrics?.allergyStatusText || 'An toàn, không dị ứng',
    syncStatusText: metrics?.syncStatusText || 'Đồng bộ lúc 15:30',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* KPI 1: Tỷ lệ ăn hết suất */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">Sức ăn hôm nay</span>
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
            <Utensils className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{safeMetrics.consumptionRate}%</span>
            <span className="text-xs font-bold text-emerald-600">Đạt chuẩn</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
            {safeMetrics.consumptionStatusLabel}
          </p>
        </div>
        {/* Progress mini bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, safeMetrics.consumptionRate)}%` }}
          ></div>
        </div>
      </div>

      {/* KPI 2: Lượng nước uống */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">Lượng nước uống</span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
            <Droplets className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{safeMetrics.waterIntakeToday}</span>
          </div>
          <p className="text-[11px] font-semibold text-sky-700 mt-0.5">
            Đạt {safeMetrics.waterPercentage}% tiêu chuẩn Viện Dinh Dưỡng
          </p>
        </div>
        {/* Progress mini bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, safeMetrics.waterPercentage)}%` }}
          ></div>
        </div>
      </div>

      {/* KPI 3: An toàn dị ứng */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">An toàn dị ứng</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">100%</span>
            <span className="text-xs font-bold text-slate-700">Cách ly</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">
            {safeMetrics.allergyStatusText}
          </p>
        </div>
        <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div className="bg-emerald-600 h-1.5 rounded-full w-full"></div>
        </div>
      </div>

      {/* KPI 4: Trạng thái đồng bộ từ lớp */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">Nhật ký từ Lớp học</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-sm font-black text-slate-800 block">Đã ghi nhận đủ 3 bữa</span>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">
            {safeMetrics.syncStatusText}
          </p>
        </div>
        <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-teal-700">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Theo dõi trực tiếp từ giáo viên</span>
        </div>
      </div>
    </div>
  );
};
