import React from 'react';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { TodayMealData } from '../types';

interface NutritionStandardBannerProps {
  todayMeal?: Partial<TodayMealData>;
  onViewDetails?: () => void;
}

export const NutritionStandardBanner: React.FC<NutritionStandardBannerProps> = ({
  todayMeal,
  onViewDetails,
}) => {
  const nutrition = todayMeal?.nutritionStandard || {
    title: 'Dinh dưỡng chuẩn viện dinh dưỡng quốc gia',
    subtitle: 'Tổng năng lượng bữa trưa đạt 580 kcal • Protein: 22g • Canxi: 210mg • Chất xơ: 6.5g',
  };

  return (
    <div className="my-6 bg-gradient-to-r from-sky-50/70 via-teal-50/50 to-emerald-50/70 border border-sky-200/80 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-white text-teal-600 border border-teal-200 flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldCheck className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {nutrition.title}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              Chuẩn BYT
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            {nutrition.subtitle}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewDetails}
        className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-700 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
      >
        <span>Chi tiết</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
