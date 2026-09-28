import React from 'react';
import { Users, ShieldCheck, School, Utensils, Check } from 'lucide-react';
import { SnackRosterStats } from '../types';

interface SnackRosterSummaryCardsProps {
  stats?: SnackRosterStats;
  isLoading?: boolean;
}

export const SnackRosterSummaryCards: React.FC<SnackRosterSummaryCardsProps> = ({
  stats,
  isLoading = false,
}) => {
  const totalRegistered = stats?.totalRegistered ?? 318;
  const paidCount = stats?.paidCount ?? 318;
  const paidPercent = stats?.paidPercent ?? 100;
  const totalClasses = stats?.totalClasses ?? 12;
  const todayTotal = stats?.todayTotalPortions ?? 318;
  const standardCount = stats?.standardPortions ?? 310;
  const specialCount = stats?.specialDietPortions ?? 8;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Tổng học sinh ăn xế */}
      <div className="bg-[#f0f9f4] border border-[#d2edd9] rounded-2xl p-5 shadow-sm relative overflow-hidden transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-[#ddf2e4] px-2.5 py-0.5 rounded-full">
            Bán trú
          </span>
        </div>

        <div className="mt-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            TỔNG HỌC SINH ĂN XẾ
          </p>
          <p className="text-3xl font-black text-[#134e32] mt-0.5">
            {isLoading ? '...' : `${totalRegistered} trẻ`}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <div className="w-4 h-4 rounded-full bg-emerald-200/60 flex items-center justify-center text-emerald-800">
            <Check className="w-3 h-3 stroke-[2.5]" />
          </div>
          <span>Đã đăng ký bán trú tháng 09</span>
        </div>
      </div>

      {/* Card 2: Đã hoàn thành phí */}
      <div className="bg-[#f0f7ff] border border-[#cfe2ff] rounded-2xl p-5 shadow-sm relative overflow-hidden transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-[11px] font-bold text-white bg-[#0284c7] px-2.5 py-0.5 rounded-full">
            {paidPercent}%
          </span>
        </div>

        <div className="mt-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            ĐÃ HOÀN THÀNH PHÍ
          </p>
          <p className="text-3xl font-black text-[#0c4a6e] mt-0.5">
            {isLoading ? '...' : `${paidCount} / ${totalRegistered}`}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 font-medium">
          <div className="w-4 h-4 rounded-full bg-blue-200/60 flex items-center justify-center text-blue-800">
            <Check className="w-3 h-3 stroke-[2.5]" />
          </div>
          <span>Đủ điều kiện xuất suất ăn</span>
        </div>
      </div>

      {/* Card 3: Số lớp có ăn xế */}
      <div className="bg-[#fff8f0] border border-[#fde4cb] rounded-2xl p-5 shadow-sm relative overflow-hidden transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
            <School className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-[#fdecdb] px-2.5 py-0.5 rounded-full">
            4 Khối
          </span>
        </div>

        <div className="mt-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            SỐ LỚP CÓ ĂN XẾ
          </p>
          <p className="text-3xl font-black text-[#9a3412] mt-0.5">
            {isLoading ? '...' : `${totalClasses} lớp`}
          </p>
        </div>

        <div className="mt-3 text-xs text-amber-700/90 font-medium">
          Khối Nhà trẻ, Mầm, Chồi, Lá
        </div>
      </div>

      {/* Card 4: Tổng suất xế hôm nay */}
      <div className="bg-[#fdf2f4] border border-[#fad2d8] rounded-2xl p-5 shadow-sm relative overflow-hidden transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
            <Utensils className="w-5 h-5 text-rose-600" />
          </div>
          <span className="text-[11px] font-bold text-white bg-[#9f1239] px-2.5 py-0.5 rounded-full">
            Hôm nay
          </span>
        </div>

        <div className="mt-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
            TỔNG SUẤT XẾ HÔM NAY
          </p>
          <p className="text-3xl font-black text-[#881337] mt-0.5">
            {isLoading ? '...' : `${todayTotal} suất`}
          </p>
        </div>

        <div className="mt-3 text-xs text-rose-700 font-medium">
          <strong className="font-bold text-rose-800">{standardCount}</strong> Tiêu chuẩn •{' '}
          <strong className="font-bold text-rose-800">{specialCount}</strong> Chế độ riêng
        </div>
      </div>
    </div>
  );
};
