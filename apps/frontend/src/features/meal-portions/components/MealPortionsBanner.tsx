import React from 'react';
import { Lock, CheckCircle2, Printer, Sparkles } from 'lucide-react';

interface MealPortionsBannerProps {
  bannerQuote: string;
  isLocked: boolean;
  isPublished: boolean;
  onPrintA4?: () => void;
}

export const MealPortionsBanner: React.FC<MealPortionsBannerProps> = ({
  bannerQuote,
  isLocked,
  isPublished,
  onPrintA4,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2 px-1">
      {/* Green Pill Announcement Tag */}
      <div className="flex items-center gap-2 bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs px-3.5 py-1.5 rounded-full font-semibold shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="tracking-tight">{bannerQuote}</span>
      </div>

      {/* Action Buttons Right */}
      <div className="flex items-center gap-2.5">
        {/* Lock Status Button */}
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300/80 text-slate-500 text-xs font-semibold cursor-not-allowed shadow-2xs"
          title="Thực đơn đã được khóa sau khi công bố"
        >
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Đã khóa chỉnh sửa</span>
        </button>

        {/* Published to Parents Badge Button */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm shadow-teal-800/20 transition active:scale-98"
          title="Đã đồng bộ công bố tới phụ huynh trên app"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-200" />
          <span>Đã công bố tới Phụ huynh</span>
        </button>

        {/* Print / Export A4 Button */}
        <button
          onClick={onPrintA4}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold shadow-sm shadow-teal-600/20 transition active:scale-98"
          title="Xuất định dạng A4 chuẩn báo cáo cơ quan y tế"
        >
          <Printer className="w-3.5 h-3.5 text-white" />
          <span>Xuất PDF / In thực đơn A4</span>
        </button>
      </div>
    </div>
  );
};
