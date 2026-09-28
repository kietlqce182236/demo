import React from 'react';
import { ShieldCheck, FileCheck2, TrendingUp, Download, ChevronRight, Home } from 'lucide-react';

interface HistoryHeaderProps {
  classNameTitle?: string;
  academicYear?: string;
  teachers?: string[];
  onOpenTrend?: () => void;
  onOpenExport?: () => void;
}

export const HistoryHeader: React.FC<HistoryHeaderProps> = ({
  classNameTitle = 'Lớp Mầm 1 (3-4 tuổi)',
  academicYear = '2026 - 2027',
  teachers = ['Cô Mai Anh', 'Cô Thu Hằng'],
  onOpenTrend,
  onOpenExport,
}) => {
  return (
    <div className="space-y-3">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1 hover:text-slate-700 transition cursor-pointer">
          <Home className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="hover:text-slate-700 transition cursor-pointer">Bán trú mầm non</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-teal-700 font-bold">Xem lịch sử điểm danh và sức ăn</span>
      </nav>

      {/* Main Header Container */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        {/* Left Title and Badges */}
        <div className="space-y-2">
          {/* Compliance & Security Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
              <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Hồ sơ lưu trữ điện tử chuẩn Bộ GD&ĐT</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Bảo mật Y tế học đường</span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Lịch sử Điểm danh & Đánh giá Sức ăn
          </h1>

          {/* Subtitle details */}
          <p className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700">{classNameTitle}</span>
            <span>•</span>
            <span>Niên khóa {academicYear}</span>
            <span>•</span>
            <span>Giáo viên phụ trách: <strong className="text-slate-700 font-bold">{teachers.join(' & ')}</strong></span>
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Trend comparison button */}
          <button
            onClick={onOpenTrend}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 text-sky-700 font-bold text-xs shadow-sm transition active:scale-95"
          >
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span>So sánh xu hướng</span>
          </button>

          {/* Export report button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Xuất báo cáo Excel / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
