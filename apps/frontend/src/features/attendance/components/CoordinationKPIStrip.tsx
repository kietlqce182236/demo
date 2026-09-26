import React from 'react';
import { ClipboardList, AlertTriangle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CoordinationKPIStripProps {
  summary: {
    totalNotes: number;
    urgentCount: number;
    highCount: number;
    pendingCount: number;
    acknowledgedCount: number;
    resolvedCount: number;
  };
  filterDate: string;
}

export const CoordinationKPIStrip: React.FC<CoordinationKPIStripProps> = ({ summary, filterDate }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng ghi chú */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tổng ghi chú điều phối
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-800 tracking-tight">
            {summary.totalNotes}
          </span>
          <span className="text-xs font-semibold text-slate-500">yêu cầu trong ngày</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          Đồng bộ giữa GV, Bếp & BGH
        </p>
      </div>

      {/* 2. Khẩn cấp */}
      <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-xs hover:shadow-md transition relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            Khẩn cấp (Ưu tiên số 1)
          </span>
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-red-600 tracking-tight">
            {summary.urgentCount}
          </span>
          <span className="text-xs font-semibold text-red-500">cần can thiệp ngay</span>
        </div>
        <p className="mt-2 text-xs text-red-600/90 flex items-center gap-1.5 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          Dị ứng & Cắt đổi suất sát giờ
        </p>
      </div>

      {/* 3. Chờ tiếp nhận */}
      <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Chờ Bếp tiếp nhận
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-600 tracking-tight">
            {summary.pendingCount}
          </span>
          <span className="text-xs font-semibold text-amber-700/80">chờ xử lý</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Đã thông báo đến tablet nhà bếp
        </p>
      </div>

      {/* 4. Đã hoàn tất */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Đã xử lý & Phục vụ xong
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-600 tracking-tight">
            {summary.resolvedCount}
          </span>
          <span className="text-xs font-semibold text-emerald-700/80">đã xong (Bếp đã giao)</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Đạt tỷ lệ {summary.totalNotes > 0 ? Math.round((summary.resolvedCount / summary.totalNotes) * 100) : 100}% kế hoạch
        </p>
      </div>
    </div>
  );
};
