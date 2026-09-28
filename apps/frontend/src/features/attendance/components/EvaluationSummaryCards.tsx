import React from 'react';
import { Utensils, Smile, Meh, Frown } from 'lucide-react';

interface EvaluationSummaryCardsProps {
  summary: {
    totalClassStudents: number;
    totalEating: number;
    absentCount: number;
    ateAllCount: number;
    ateAllPercent: number;
    ateHalfCount: number;
    ateHalfPercent: number;
    ateLittleCount: number;
    ateLittlePercent: number;
  };
}

export const EvaluationSummaryCards: React.FC<EvaluationSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4 max-w-[1440px] mx-auto">
      {/* Card 1: Tổng trẻ ăn bán trú */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <Utensils className="w-5 h-5" />
          </div>
          {summary.absentCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              -{summary.absentCount} bé nghỉ ăn
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900">{summary.totalEating}</span>
            <span className="text-base font-bold text-slate-400">/{summary.totalClassStudents}</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">Tổng trẻ ăn bán trú bữa này</p>
        </div>

        {/* Bottom Accent Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-teal-600 h-full rounded-full transition-all duration-500"
            style={{
              width: `${summary.totalClassStudents > 0 ? (summary.totalEating / summary.totalClassStudents) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Card 2: Ăn hết suất (100%) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Smile className="w-5 h-5" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {summary.ateAllPercent.toFixed(1)}%
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{summary.ateAllCount}</span>
            <span className="text-sm font-bold text-slate-500">bé</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">Ăn hết suất (100%)</p>
        </div>

        {/* Bottom Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, summary.ateAllPercent)}%` }}
          />
        </div>
      </div>

      {/* Card 3: Ăn một nửa (50%) - Cần theo dõi */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Meh className="w-5 h-5" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {summary.ateHalfPercent.toFixed(1)}%
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{summary.ateHalfCount}</span>
            <span className="text-sm font-bold text-slate-500">bé</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">Ăn một nửa (50%) - Cần theo dõi</p>
        </div>

        {/* Bottom Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, summary.ateHalfPercent)}%` }}
          />
        </div>
      </div>

      {/* Card 4: Ăn ít / Bỏ bữa (<20%) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Frown className="w-5 h-5" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {summary.ateLittlePercent.toFixed(1)}%
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{summary.ateLittleCount}</span>
            <span className="text-sm font-bold text-slate-500">bé</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">Ăn ít / Bỏ bữa (&lt;20%)</p>
        </div>

        {/* Bottom Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-rose-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, summary.ateLittlePercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
