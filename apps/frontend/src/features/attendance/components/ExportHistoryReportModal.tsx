import React, { useState } from 'react';
import { X, Printer, Download, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { AttendanceHistoryResponse } from '../types';

interface ExportHistoryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AttendanceHistoryResponse | null;
}

export const ExportHistoryReportModal: React.FC<ExportHistoryReportModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeWater, setIncludeWater] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportedSuccess(true);
      setTimeout(() => setExportedSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Xuất Báo Cáo Lịch Sử Điểm Danh & Sức Ăn
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {data.classInfo.name} • {data.period.displayRange} ({data.period.weekLabel})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4 print:hidden">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
              1. Chọn định dạng xuất file:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                  format === 'excel'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Bảng tính Excel (.xlsx)</p>
                  <p className="text-[11px] text-slate-500">Chuẩn hóa cho kế toán & tổng hợp số liệu</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                  format === 'pdf'
                    ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 text-teal-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Văn bản PDF (.pdf)</p>
                  <p className="text-[11px] text-slate-500">Kèm chữ ký BGH & Bếp để lưu trữ</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
              2. Tùy chọn nội dung kèm theo:
            </label>
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Kèm nhận xét chi tiết và ghi chú đặc biệt của giáo viên chủ nhiệm</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeWater}
                  onChange={(e) => setIncludeWater(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Kèm thống kê lượng nước uống & sữa cữ phụ của từng học sinh</span>
              </label>
            </div>
          </div>
        </div>

        {/* Report Preview Summary Card */}
        <div className="border border-slate-200 p-5 rounded-2xl bg-white space-y-3 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 uppercase">Tóm tắt dữ liệu xuất:</span>
            <span className="text-[11px] text-teal-700 font-bold">120 lượt ăn / 32 học sinh</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-slate-500">Chuyên cần</p>
              <p className="font-black text-slate-800 text-sm mt-0.5">{data.summary.attendanceRate}%</p>
            </div>
            <div className="p-2 bg-teal-50 rounded-lg">
              <p className="text-teal-700">Ăn hết suất</p>
              <p className="font-black text-teal-800 text-sm mt-0.5">{data.summary.allEatenRate}%</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <p className="text-amber-700">Lưu ý dinh dưỡng</p>
              <p className="font-black text-amber-800 text-sm mt-0.5">{data.summary.specialCareCount} bé</p>
            </div>
            <div className="p-2 bg-sky-50 rounded-lg">
              <p className="text-sky-700">Suất ăn riêng</p>
              <p className="font-black text-sky-800 text-sm mt-0.5">{data.summary.specialDietCount} suất</p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {exportedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã tạo file báo cáo thành công! Quá trình tải xuống tự động bắt đầu.</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Xem trước bản in</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
            >
              Hủy bỏ
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Đang xuất file...' : 'Tải xuống báo cáo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
