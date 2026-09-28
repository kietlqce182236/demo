import React from 'react';
import { ShieldCheck, Flame, PieChart, Activity } from 'lucide-react';
import { ChildMenuConsumptionData } from '../types';

interface NutritionOverviewCardProps {
  nutrition: ChildMenuConsumptionData['nutritionSummaryToday'];
}

export const NutritionOverviewCard: React.FC<NutritionOverviewCardProps> = ({ nutrition }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Cân Đối Dinh Dưỡng Suất Ăn Hôm Nay (Viện Dinh Dưỡng)
            </h3>
            <p className="text-xs text-slate-500">
              Tổng năng lượng tiếp nhận tại trường đạt chuẩn Thông tư 28/2016/TT-BGDĐT
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
          Đạt 52.8% năng lượng cả ngày
        </span>
      </div>

      {/* Nutrients Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Calo */}
        <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl text-center">
          <span className="text-[11px] font-bold text-amber-800 block">Năng lượng</span>
          <span className="text-lg font-black text-slate-900">{nutrition.calories}</span>
          <span className="text-[11px] text-slate-500 block">kcal</span>
        </div>

        {/* Protein */}
        <div className="bg-red-50/60 border border-red-200/80 p-3 rounded-xl text-center">
          <span className="text-[11px] font-bold text-red-800 block">Chất đạm (P)</span>
          <span className="text-lg font-black text-slate-900">{nutrition.proteinG}g</span>
          <span className="text-[11px] text-slate-500 block">15.5% năng lượng</span>
        </div>

        {/* Lipids */}
        <div className="bg-yellow-50/60 border border-yellow-200/80 p-3 rounded-xl text-center">
          <span className="text-[11px] font-bold text-yellow-800 block">Chất béo (L)</span>
          <span className="text-lg font-black text-slate-900">{nutrition.fatG}g</span>
          <span className="text-[11px] text-slate-500 block">26.0% năng lượng</span>
        </div>

        {/* Glucids */}
        <div className="bg-teal-50/60 border border-teal-200/80 p-3 rounded-xl text-center">
          <span className="text-[11px] font-bold text-teal-800 block">Tinh bột (G)</span>
          <span className="text-lg font-black text-slate-900">{nutrition.carbG}g</span>
          <span className="text-[11px] text-slate-500 block">58.5% năng lượng</span>
        </div>

        {/* Canxi */}
        <div className="bg-sky-50/60 border border-sky-200/80 p-3 rounded-xl text-center">
          <span className="text-[11px] font-bold text-sky-800 block">Canxi</span>
          <span className="text-lg font-black text-slate-900">{nutrition.calciumMg}</span>
          <span className="text-[11px] text-slate-500 block">mg</span>
        </div>

        {/* Chất xơ */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 p-3 rounded-xl text-center">
          <span className="text-[11px] font-bold text-emerald-800 block">Chất xơ</span>
          <span className="text-lg font-black text-slate-900">{nutrition.fiberG}g</span>
          <span className="text-[11px] text-slate-500 block">Tự nhiên</span>
        </div>
      </div>
    </div>
  );
};
