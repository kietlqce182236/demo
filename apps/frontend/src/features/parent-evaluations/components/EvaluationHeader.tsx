import React from 'react';
import {
  FileSpreadsheet,
  SlidersHorizontal,
  Bell,
  Calendar,
  MessageSquareHeart,
} from 'lucide-react';

interface EvaluationHeaderProps {
  onExport: () => void;
  onOpenConfig: () => void;
}

export const EvaluationHeader: React.FC<EvaluationHeaderProps> = ({
  onExport,
  onOpenConfig,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & User Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="hover:text-teal-700 cursor-pointer">Bán trú KidMeal</span>
          <span>&gt;</span>
          <span className="hover:text-teal-700 cursor-pointer">Tương tác Phụ huynh</span>
          <span>&gt;</span>
          <span className="text-teal-700 font-semibold">Ý kiến & Đánh giá suất ăn</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Niên khóa 2024 - 2025</span>
          </div>

          <button className="relative p-1.5 text-slate-500 hover:text-slate-800 transition">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80"
            alt="User"
            className="w-7 h-7 rounded-full object-cover border border-slate-200"
          />
        </div>
      </div>

      {/* Main Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <MessageSquareHeart className="w-5 h-5 text-teal-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Ý kiến & Đánh giá Suất ăn Bán trú
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-10.5">
            Tổng hợp phản hồi, mức độ hài lòng và lắng nghe ý kiến của Phụ huynh học sinh năm học 2024 - 2025
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition active:scale-98"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất báo cáo ý kiến (Excel)</span>
          </button>

          <button
            onClick={onOpenConfig}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/30 transition active:scale-98"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Cấu hình khảo sát định kỳ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
