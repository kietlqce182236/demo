import React from 'react';
import { Utensils, Download, Printer } from 'lucide-react';

interface SnackRosterHeaderProps {
  onExport?: () => void;
  onPrint?: () => void;
}

export const SnackRosterHeader: React.FC<SnackRosterHeaderProps> = ({
  onExport,
  onPrint,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
      {/* Breadcrumb & Title */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <Utensils className="w-3.5 h-3.5 text-slate-400" />
          <span className="hover:text-slate-700 cursor-pointer">Kế hoạch suất ăn</span>
          <span>/</span>
          <span className="font-semibold text-slate-700">Danh sách học sinh ăn xế</span>
        </div>

        {/* Page Title */}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Danh sách học sinh ăn xế
        </h1>

        {/* Subtitle */}
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi học sinh đã đăng ký và hoàn thành phí ăn xế để chuẩn bị suất ăn phù hợp.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/90 shadow-sm transition active:scale-95"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Xuất danh sách</span>
        </button>

        {/* Print Button */}
        <button
          onClick={onPrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1b4332] hover:bg-[#143527] text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
        >
          <Printer className="w-4 h-4 text-white" />
          <span>In danh sách</span>
        </button>
      </div>
    </div>
  );
};
