import React from 'react';
import { BookOpen, Printer, PlusSquare } from 'lucide-react';

interface HistoryBottomBannerProps {
  onOpenCaloGuide?: () => void;
  onPrintLogBook?: () => void;
}

export const HistoryBottomBanner: React.FC<HistoryBottomBannerProps> = ({
  onOpenCaloGuide,
  onPrintLogBook,
}) => {
  return (
    <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/70 to-slate-50 border border-teal-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Left Icon & Text */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-teal-200 shadow-sm flex items-center justify-center text-teal-600 flex-shrink-0 mt-0.5">
          <PlusSquare className="w-6 h-6 text-teal-600" />
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Quy chuẩn Y tế & Dinh dưỡng Mầm non Quốc Gia
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
              Thông tư 28/BGDĐT
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Mọi dữ liệu sức ăn và suất dị ứng được lưu vết bất biến trong 24 tháng phục vụ thanh tra y tế học đường và cung cấp minh bạch cho phụ huynh học sinh.
          </p>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
        <button
          onClick={onOpenCaloGuide}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-sm transition active:scale-95"
        >
          <BookOpen className="w-3.5 h-3.5 text-teal-600" />
          <span>Sổ tay Calo độ tuổi</span>
        </button>

        <button
          onClick={onPrintLogBook}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-sm transition active:scale-95"
        >
          <Printer className="w-3.5 h-3.5 text-teal-600" />
          <span>In mẫu sổ lưu ký</span>
        </button>
      </div>
    </div>
  );
};
