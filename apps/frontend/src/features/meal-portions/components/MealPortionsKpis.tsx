import React from 'react';
import { Users, ShieldAlert, Zap, ShieldCheck } from 'lucide-react';
import { PortionPlanKPIs } from '../types';

interface MealPortionsKpisProps {
  kpis: PortionPlanKPIs;
}

export const MealPortionsKpis: React.FC<MealPortionsKpisProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Tổng Sĩ Số Bán Trú */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
              TỔNG SĨ SỐ BÁN TRÚ
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {kpis.totalBoardingStudents}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                / {kpis.totalEnrolledStudents} trẻ
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-emerald-600 text-xs font-bold gap-1">
          <span>▲</span>
          <span>{kpis.attendanceBadgeText}</span>
        </div>
      </div>

      {/* Card 2: Trẻ Ăn Dị Ứng / Thay Thế */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
              TRẺ ĂN DỊ ỨNG / THAY THẾ
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-600 tracking-tight">
                {kpis.allergicChildrenCount}
              </span>
              <span className="text-xs font-semibold text-rose-500">trẻ cảnh báo đỏ</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-amber-600 text-xs font-bold gap-1">
          <span>▲</span>
          <span>{kpis.allergicBadgeText}</span>
        </div>
      </div>

      {/* Card 3: Năng Lượng Bình Quân */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
              NĂNG LƯỢNG BÌNH QUÂN
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {kpis.avgCalories}
              </span>
              <span className="text-xs font-semibold text-slate-500">Kcal/trẻ/ngày</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Zap className="w-5 h-5 fill-teal-500 text-teal-600" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center text-teal-700 text-xs font-medium gap-1.5">
          <span className="inline-block bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-bold text-[10px]">
            {kpis.energyCoverageRate}%
          </span>
          <span className="text-[11px] truncate">Nhu cầu năng lượng cả ngày (Chuẩn)</span>
        </div>
      </div>

      {/* Card 4: Trạng Thái Pháp Lý BGH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
              TRẠNG THÁI PHÁP LÝ BGH
            </p>
            <div className="mt-1.5">
              <span className="inline-flex items-center gap-1.5 bg-emerald-700 text-white text-xs font-black px-3 py-1 rounded-full shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                {kpis.legalApprovalStatus}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500 truncate">
          {kpis.legalNoticeText}
        </div>
      </div>
    </div>
  );
};
