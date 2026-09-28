import React from 'react';
import { ChevronRight, FileText, Send, Radio } from 'lucide-react';

interface AttendanceHeaderProps {
  classNameTitle?: string;
  cutoffTime?: string;
  onExportReport?: () => void;
  onLockAndSendKitchen?: () => void;
  isLocked?: boolean;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  classNameTitle = 'Lớp Mầm 1 (3-4 tuổi)',
  cutoffTime = '08:45',
  onExportReport,
  onLockAndSendKitchen,
  isLocked = false,
}) => {
  return (
    <div className="space-y-3">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <span className="hover:text-teal-700 cursor-pointer flex items-center gap-1">
          <span>🏠</span> Trang chủ
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="hover:text-teal-700 cursor-pointer">Bán trú mầm non</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-teal-700 font-bold">Điểm danh học sinh ăn bán trú</span>
      </div>

      {/* Main Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Điểm danh suất ăn Bán trú - {classNameTitle}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200/80 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Thời gian thực (LiveSync Bếp trung tâm)
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Theo dõi sát sao từng khẩu phần ăn, thực đơn dinh dưỡng và dị ứng đặc thù cho trẻ mầm non.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onExportReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Xuất phiếu báo ăn</span>
          </button>

          <button
            onClick={onLockAndSendKitchen}
            disabled={isLocked}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition ${
              isLocked
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 ring-2 ring-teal-600/20'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isLocked ? 'Đã Chốt & Gửi Bếp' : `Chốt sĩ số & Gửi Bếp (${cutoffTime})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
