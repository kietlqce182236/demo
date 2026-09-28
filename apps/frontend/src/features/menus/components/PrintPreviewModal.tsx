import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ExportDataResponse } from '../api/weekly-menus.api';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExportDataResponse | null;
  onDownloadCsv: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  onDownloadCsv,
}) => {
  if (!isOpen || !data || typeof document === 'undefined') return null;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Nền mờ Backdrop Blur */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full p-4 sm:p-8 overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Thanh công cụ Modal trên đầu (Ẩn khi in ấn qua CSS @media print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Xem trước bản in thực đơn A4 ngang</span>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Chuẩn Thông tư 28
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadCsv}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Tải file Excel (.csv)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>In thực đơn (PDF / Máy in)</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nội dung trang in (Phù hợp in A4) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 rounded-2xl mt-4 border border-slate-100 print:border-none print:bg-white print:p-0">
          <div className="text-center pb-4 border-b border-slate-300">
            <p className="text-xs uppercase font-semibold text-slate-600 tracking-wider">
              PHÒNG GIÁO DỤC VÀ ĐÀO TẠO • {data.schoolName}
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
              BẢNG THỰC ĐƠN BÁN TRÚ TUẦN
            </h1>
            <p className="text-xs font-bold text-emerald-800 mt-1">
              {data.title} ({data.version}) — {data.targetAgeGroupVi}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Thời gian áp dụng: {data.dateRange} | Tuần thứ: {data.cycleWeekNumber}
            </p>

            <div className="mt-2 inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-900">
              <span>Năng lượng: {data.dailyAverageCalories} Kcal/ngày</span>
              <span>•</span>
              <span>Tỷ lệ: {data.plgRatio}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{data.standardCompliance}</span>
            </div>
          </div>

          {/* Ma trận bảng thực đơn */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-emerald-900 text-white text-center font-bold">
                  <th className="border border-slate-300 p-2.5 w-36">Bữa ăn / Giờ ăn</th>
                  <th className="border border-slate-300 p-2.5">Thứ Hai</th>
                  <th className="border border-slate-300 p-2.5">Thứ Ba</th>
                  <th className="border border-slate-300 p-2.5">Thứ Tư</th>
                  <th className="border border-slate-300 p-2.5">Thứ Năm</th>
                  <th className="border border-slate-300 p-2.5">Thứ Sáu</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 p-2.5 font-bold text-slate-900 bg-slate-100/70">
                      {row.mealTimeVi}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-slate-800 leading-relaxed font-medium">
                      {row.mondayDishes}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-slate-800 leading-relaxed font-medium">
                      {row.tuesdayDishes}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-slate-800 leading-relaxed font-medium">
                      {row.wednesdayDishes}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-slate-800 leading-relaxed font-medium">
                      {row.thursdayDishes}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-slate-800 leading-relaxed font-medium">
                      {row.fridayDishes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phần ký duyệt của các bộ phận */}
          <div className="grid grid-cols-3 gap-6 pt-8 mt-6 text-center text-xs">
            <div>
              <p className="font-bold text-slate-800 uppercase">Người lập bảng</p>
              <p className="text-[11px] text-slate-400 italic mb-12">(Ký và ghi rõ họ tên)</p>
              <p className="font-bold text-slate-900">{data.preparedBy}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 uppercase">Bếp trưởng / Giám sát</p>
              <p className="text-[11px] text-slate-400 italic mb-12">(Ký và ghi rõ họ tên)</p>
              <p className="font-bold text-slate-900">Nguyễn Văn Bếp</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 uppercase">Hiệu trưởng phê duyệt</p>
              <p className="text-[11px] text-slate-400 italic mb-12">(Ký, đóng dấu)</p>
              <p className="font-bold text-emerald-800">{data.approvedBy}</p>
              <p className="text-[11px] text-slate-400">{data.approvedDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
