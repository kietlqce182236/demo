import React from 'react';
import { X, ShieldCheck, AlertTriangle, Phone, User, Calendar, School, Utensils, Printer } from 'lucide-react';
import { SnackRosterItem } from '../types';

interface SnackRosterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SnackRosterItem | null;
}

export const SnackRosterDetailModal: React.FC<SnackRosterDetailModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Chi tiết Suất Ăn Xế Học Sinh
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Mã: {item.studentCode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Student Summary */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              {item.avatarInitials}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-slate-900">
                  {item.fullName}
                </h4>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]">
                  {item.className}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span>{item.blockName}</span>
                <span>•</span>
                <span>{item.formattedDob} ({item.ageLabel})</span>
                <span>•</span>
                <span>{item.gender === 'MALE' ? 'Nam' : 'Nữ'}</span>
              </div>
            </div>
          </div>

          {/* 2. Snack Diet & Kitchen Instructions */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Chế độ ăn xế
              </span>
              <span className="font-bold text-xs">
                {item.snackDietBadgeText}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Chỉ dẫn chuẩn bị của Nhà bếp:
              </p>
              <div
                className={`p-3 rounded-xl text-xs font-medium leading-relaxed ${
                  item.isKitchenHighlight
                    ? 'bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] font-bold'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                {item.kitchenNotes}
              </div>
            </div>
          </div>

          {/* 3. Fee & Service Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Trạng thái phí</span>
              </div>
              <p className="text-sm font-black text-emerald-950 mt-1">
                {item.paymentStatusLabel}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Đủ điều kiện xuất suất ăn
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Utensils className="w-4 h-4 text-slate-500" />
                <span>Suất ăn chiều</span>
              </div>
              <p className="text-sm font-black text-slate-800 mt-1">
                14:15 - 14:45
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bàn giao khay giữ nhiệt
              </p>
            </div>
          </div>

          {/* 4. Emergency Contact */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>Liên hệ phụ huynh:</span>
              <strong className="text-slate-800 font-semibold">{item.emergencyContactName}</strong>
            </div>
            <a
              href={`tel:${item.emergencyContactPhone}`}
              className="text-emerald-700 font-bold hover:underline"
            >
              {item.emergencyContactPhone}
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            <span>In thẻ suất ăn</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
