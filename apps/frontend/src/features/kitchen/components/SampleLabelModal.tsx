import React from 'react';
import { X, Printer, QrCode } from 'lucide-react';

interface SampleLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: {
    id: string;
    dishName: string;
    mealSession: string;
    mealDate: string;
    sampleWeight: number;
    storageTemp: number;
    collectorName: string;
    sealedAt: string;
    expiresAt: string;
    code: string;
  } | null;
  isDarkMode?: boolean;
}

export const SampleLabelModal: React.FC<SampleLabelModalProps> = ({
  isOpen,
  onClose,
  sample,
  isDarkMode = false,
}) => {
  if (!isOpen || !sample) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all ${
          isDarkMode
            ? 'bg-slate-900 border border-slate-700 text-slate-100'
            : 'bg-white border border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isDarkMode
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}
            >
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`text-base font-black uppercase tracking-wider ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                TEM NIÊM PHONG LƯU MẪU 24H
              </h3>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Theo Quyết định số 1246/QĐ-BYT Bộ Y Tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${
              isDarkMode
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: The Physical Label Preview (Always high-contrast print white) */}
        <div className="p-6 space-y-4">
          <div
            id="printable-label"
            className="bg-white text-slate-900 p-5 rounded-2xl border-2 border-dashed border-amber-400 shadow-md font-sans space-y-3"
          >
            {/* School & Law Banner */}
            <div className="border-b-2 border-slate-900 pb-2 text-center">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                BẾP ĂN BÁN TRÚ MẦM NON
              </div>
              <div className="text-sm font-black text-amber-600 uppercase tracking-widest mt-0.5">
                TEM LƯU MẪU THỨC ĂN (24 GIỜ)
              </div>
              <div className="text-[9px] text-slate-500 font-semibold italic">
                (Quy định lưu tối thiểu 24h ở nhiệt độ 0 - 5°C)
              </div>
            </div>

            {/* QR Code and Key Info Grid */}
            <div className="flex items-center gap-4">
              {/* Fake QR block */}
              <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded-xl flex flex-col items-center justify-center shrink-0 p-1">
                <QrCode className="w-14 h-14 text-slate-800" />
                <span className="text-[8px] font-mono font-bold text-slate-600">{sample.code}</span>
              </div>

              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Tên món ăn:</span>
                  <span className="font-black text-sm text-slate-900 leading-tight">{sample.dishName}</span>
                </div>
                <div className="flex items-center gap-3 pt-0.5">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Bữa ăn:</span>
                    <span className="font-bold text-slate-800 text-[11px]">{sample.mealSession}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Khối lượng:</span>
                    <span className="font-black text-emerald-600 text-[11px]">{sample.sampleWeight}g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps & Temperature */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Thời điểm lưu:</span>
                <span className="font-bold text-slate-900">{sample.sealedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Thời điểm hủy dự kiến:</span>
                <span className="font-bold text-rose-600">{sample.expiresAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Nhiệt độ tủ mát:</span>
                <span className="font-bold text-teal-700">{sample.storageTemp}°C (Đạt chuẩn)</span>
              </div>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 text-center pt-2 text-[10px] text-slate-600 border-t border-slate-200">
              <div>
                <span className="font-bold block">Người lấy mẫu</span>
                <span className="font-black text-slate-900 mt-4 block">{sample.collectorName || '(Ký tên)'}</span>
              </div>
              <div>
                <span className="font-bold block">Người giám sát (Y tế/BGH)</span>
                <span className="font-black text-slate-400 mt-4 block italic">(Ký & ghi rõ họ tên)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              isDarkMode
                ? 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>In Tem Dán Hộp Inox (Barcode)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
