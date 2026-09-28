import React from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { AttendanceResponse } from '../types';

interface ExportReportModalProps {
  data: AttendanceResponse | null;
  selectedDate: string;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  data,
  selectedDate,
  onClose,
}) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Phiếu Báo Suất Ăn Bán Trú Trong Ngày
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Chuẩn mẫu báo ăn Bếp một chiều - Trường Mầm Non Ban Mai
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>In phiếu báo</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="border border-slate-300 p-6 rounded-2xl bg-white space-y-6 text-slate-900 text-xs">
          {/* School & Form Header */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-4">
            <div>
              <p className="font-extrabold text-sm uppercase">PHÒNG GD&ĐT QUẬN / HUYỆN</p>
              <p className="font-bold text-sm uppercase text-teal-800">TRƯỜNG MẦM NON BAN MAI - CS01</p>
              <p className="text-[11px] text-slate-500">Mã đơn vị: BM-MN-01</p>
            </div>
            <div className="text-right">
              <p className="font-black text-sm uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="font-bold text-[11px]">Độc lập - Tự do - Hạnh phúc</p>
              <p className="text-[11px] text-slate-500 mt-1">Ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-lg font-black uppercase text-slate-900">
              PHIẾU BÁO SUẤT ĂN BÁN TRÚ HÀNG NGÀY
            </h2>
            <p className="font-bold text-teal-700">{data.classInfo.name} • Năm học {data.classInfo.academicYear}</p>
          </div>

          {/* Quick Metrics Table */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="border border-slate-300 p-3 rounded-xl">
              <p className="text-[11px] text-slate-500 font-bold">Tổng Sĩ Số Lớp</p>
              <p className="text-xl font-black text-slate-900 mt-1">{data.summary.totalClassStudents}</p>
            </div>
            <div className="border border-slate-300 p-3 rounded-xl bg-teal-50">
              <p className="text-[11px] text-teal-800 font-bold">Ăn Bán Trú</p>
              <p className="text-xl font-black text-teal-700 mt-1">{data.summary.registeredToday}</p>
            </div>
            <div className="border border-slate-300 p-3 rounded-xl bg-amber-50">
              <p className="text-[11px] text-amber-800 font-bold">Vắng Mặt / Nghỉ Ăn</p>
              <p className="text-xl font-black text-amber-700 mt-1">{data.summary.absentCount}</p>
            </div>
            <div className="border border-slate-300 p-3 rounded-xl bg-red-50">
              <p className="text-[11px] text-red-800 font-bold">Suất Ăn Kiêng / Dị Ứng</p>
              <p className="text-xl font-black text-red-700 mt-1">{data.summary.dietSpecialCount}</p>
            </div>
          </div>

          {/* Special Diet List */}
          <div className="space-y-2">
            <p className="font-bold uppercase text-[11px] text-slate-700">
              1. Danh sách học sinh có chế độ ăn kiêng & Lưu ý dị ứng:
            </p>
            <table className="w-full border-collapse border border-slate-300 text-[11px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 p-2 text-center w-10">STT</th>
                  <th className="border border-slate-300 p-2">Mã HS</th>
                  <th className="border border-slate-300 p-2">Họ và Tên</th>
                  <th className="border border-slate-300 p-2">Chế độ kiêng / Dị ứng</th>
                  <th className="border border-slate-300 p-2">Món thay thế Bếp thực hiện</th>
                </tr>
              </thead>
              <tbody>
                {data.children
                  .filter((c) => c.dietBadge.type === 'ALLERGY' || c.dietBadge.type === 'INTOLERANCE' || c.dietBadge.type === 'SPECIAL_CARE')
                  .map((c, idx) => (
                    <tr key={c.id}>
                      <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-bold">{c.studentCode}</td>
                      <td className="border border-slate-300 p-2 font-bold">{c.fullName}</td>
                      <td className="border border-slate-300 p-2 text-red-700 font-bold">{c.dietBadge.title}</td>
                      <td className="border border-slate-300 p-2">{c.dietBadge.description || 'Chế độ riêng'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
            <div>
              <p className="font-bold">GIÁO VIÊN CHỦ NHIỆM</p>
              <p className="text-[11px] text-slate-400 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-800">Cô Mai Anh</p>
            </div>
            <div>
              <p className="font-bold">BẾP TRƯỞNG TIẾP NHẬN</p>
              <p className="text-[11px] text-slate-400 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-800">Cô Phạm Lan</p>
            </div>
            <div>
              <p className="font-bold">BAN GIÁM HIỆU DUYỆT</p>
              <p className="text-[11px] text-slate-400 italic mt-0.5">(Ký và đóng dấu)</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-800">Nguyễn Thị Minh Tâm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
