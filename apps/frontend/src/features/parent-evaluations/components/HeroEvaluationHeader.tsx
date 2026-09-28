import React from 'react';
import { Star, Clock, CheckCircle2, Quote } from 'lucide-react';
import { PortalStatsData } from '../types';

interface HeroEvaluationHeaderProps {
  stats: PortalStatsData;
}

export const HeroEvaluationHeader: React.FC<HeroEvaluationHeaderProps> = ({ stats }) => {
  return (
    <div className="mb-6 space-y-4">
      {/* Top Header Label */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Lắng nghe đồng hành</span>
          <span className="text-teal-400">•</span>
          <span className="normal-case font-medium">Học kỳ I (2024 - 2025)</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          Đánh giá & Góp ý Suất ăn Bán trú
        </h1>
      </div>

      {/* Hero Quote & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Principal Quote Banner */}
        <div className="lg:col-span-8 bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-white border border-teal-100 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-2 right-4 text-teal-200/50 pointer-events-none select-none">
            <Quote className="w-24 h-24 rotate-180" />
          </div>

          <div className="relative z-10 flex gap-4">
            <span className="text-4xl font-serif text-teal-600 leading-none select-none">“</span>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                Mọi ý kiến đóng góp của Ba Mẹ đều là động lực quý giá để KidMeal không ngừng hoàn thiện từng bữa cơm dinh dưỡng, an toàn và ngập tràn niềm vui cho các thiên thần nhỏ.
              </p>
              <p className="text-xs font-bold text-teal-800">
                Cô Nguyễn Thu Thủy <span className="font-normal text-slate-500">• Hiệu trưởng & Ban Điều hành Tổ Dinh dưỡng</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: 2 KPI Highlight Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          {/* Card 1: Độ hài lòng */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Độ Hài Lòng</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <div className="my-1.5">
              <span className="text-2xl lg:text-3xl font-black text-slate-900">
                {stats.satisfactionRating?.toFixed(1) || '4.9'}
              </span>
              <span className="text-sm font-bold text-slate-500"> / 5.0</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Từ {stats.totalReviewsCount || 485} phụ huynh gửi phản hồi
            </p>
          </div>

          {/* Card 2: Xử lý < 24 giờ */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">Xử Lý &lt; 24 Giờ</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-1.5">
              <span className="text-2xl lg:text-3xl font-black text-emerald-700">
                {stats.responseRatePercent || 100}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {stats.responseTimeSubtitle || 'Tiếp nhận & giải trình minh bạch'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
