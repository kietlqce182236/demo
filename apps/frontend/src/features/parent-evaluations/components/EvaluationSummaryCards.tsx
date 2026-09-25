import React from 'react';
import { Star, Smile, Clock, CheckCircle2 } from 'lucide-react';
import { ParentEvaluationSummaryStats } from '../types';

interface EvaluationSummaryCardsProps {
  stats?: ParentEvaluationSummaryStats;
}

export const EvaluationSummaryCards: React.FC<EvaluationSummaryCardsProps> = ({ stats }) => {
  const avgRating = stats?.avgRating ? stats.avgRating.toFixed(1) : '4.7';
  const positiveRate = stats?.positiveRate ? stats.positiveRate.toFixed(1) : '92.4';
  const pendingCount = stats?.pendingCount ?? 3;
  const respondedCount = stats?.respondedCount ?? 415;
  const totalCount = stats?.totalCount ?? 418;
  const pendingClasses = stats?.pendingClassesCount ?? 3;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Điểm hài lòng trung bình */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Điểm hài lòng trung bình</span>
          <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
            <Star className="w-3.5 h-3.5 fill-teal-500 text-teal-500" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{avgRating}</span>
          <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
          <Star className="w-4 h-4 fill-amber-400 text-amber-400 mb-0.5" />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/60">
            +0.2
          </span>
          <span className="truncate">{totalCount} lượt đánh giá thực</span>
        </div>
      </div>

      {/* Card 2: Tỷ lệ khen ngợi tích cực */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Tỷ lệ khen ngợi tích cực</span>
          <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Smile className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{positiveRate}%</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="truncate">Món ăn ngon, rau tươi sạch</span>
        </div>
      </div>

      {/* Card 3: Đang chờ BGH phản hồi */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Đang chờ BGH phản hồi</span>
          <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-3xl font-black text-rose-600 tracking-tight">{pendingCount}</span>
          <span className="text-xs font-bold text-slate-600">phản hồi</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200/60">
            Cần xử lý trong ngày
          </span>
          <span className="text-slate-400 text-[11px]">{pendingClasses} lớp</span>
        </div>
      </div>

      {/* Card 4: Đã xử lý & giải đáp */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Đã xử lý & giải đáp</span>
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{respondedCount}</span>
          <span className="text-xs font-bold text-slate-600">lượt</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Đạt 99.3%</span>
          <span>•</span>
          <span className="text-slate-500 truncate">TB giải đáp 2.5 giờ</span>
        </div>
      </div>
    </div>
  );
};
