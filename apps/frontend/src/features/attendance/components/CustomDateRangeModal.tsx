import React, { useState } from 'react';
import { X, Calendar, CalendarRange, Check, RotateCcw } from 'lucide-react';

interface CustomDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStartDate: string;
  currentEndDate: string;
  onApply: (startDate: string, endDate: string, label: string) => void;
}

export const CustomDateRangeModal: React.FC<CustomDateRangeModalProps> = ({
  isOpen,
  onClose,
  currentStartDate,
  currentEndDate,
  onApply,
}) => {
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);

  if (!isOpen) return null;

  const handlePreset = (type: 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_7_days' | 'last_30_days') => {
    const today = new Date('2026-09-25T12:00:00'); // current real-world date

    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dt}`;
    };

    if (type === 'today') {
      setStartDate(formatYMD(today));
      setEndDate(formatYMD(today));
    } else if (type === 'this_week') {
      // Monday 21/09/2026 to Friday 25/09/2026
      setStartDate('2026-09-21');
      setEndDate('2026-09-25');
    } else if (type === 'last_week') {
      // 14/09/2026 to 18/09/2026
      setStartDate('2026-09-14');
      setEndDate('2026-09-18');
    } else if (type === 'this_month') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (type === 'last_7_days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      setStartDate(formatYMD(past));
      setEndDate(formatYMD(today));
    } else if (type === 'last_30_days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 29);
      setStartDate(formatYMD(past));
      setEndDate(formatYMD(today));
    }
  };

  const handleApply = () => {
    if (!startDate || !endDate) return;
    const sParts = startDate.split('-');
    const eParts = endDate.split('-');
    const displayLabel = sParts.length === 3 && eParts.length === 3
      ? `${sParts[2]}/${sParts[1]} - ${eParts[2]}/${eParts[1]}/${eParts[0]}`
      : `${startDate} - ${endDate}`;
    onApply(startDate, endDate, displayLabel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Tùy Chọn Khoảng Thời Gian Lịch Sử
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Chọn khoảng ngày bắt đầu và kết thúc để lọc hồ sơ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
            Phím tắt chọn nhanh:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePreset('this_week')}
              className="px-3 py-2 text-xs font-bold bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-xl transition text-slate-700 text-center"
            >
              Tuần này (21-25/09)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('this_month')}
              className="px-3 py-2 text-xs font-bold bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-xl transition text-slate-700 text-center"
            >
              Tháng 09/2026
            </button>
            <button
              type="button"
              onClick={() => handlePreset('last_7_days')}
              className="px-3 py-2 text-xs font-bold bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-xl transition text-slate-700 text-center"
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => handlePreset('today')}
              className="px-3 py-2 text-xs font-bold bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-xl transition text-slate-700 text-center"
            >
              Hôm nay (25/09)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('last_week')}
              className="px-3 py-2 text-xs font-bold bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-xl transition text-slate-700 text-center"
            >
              Tuần trước (14-18/09)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('last_30_days')}
              className="px-3 py-2 text-xs font-bold bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-xl transition text-slate-700 text-center"
            >
              30 ngày qua
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Từ ngày:</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-white text-xs font-bold rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Đến ngày:</span>
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-white text-xs font-bold rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition"
          >
            <Check className="w-4 h-4" />
            <span>Áp dụng bộ lọc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
