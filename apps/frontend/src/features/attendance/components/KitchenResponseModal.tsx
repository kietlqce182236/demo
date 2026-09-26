import React, { useState } from 'react';
import { X, ChefHat, CheckCircle2, AlertCircle } from 'lucide-react';
import { CoordinationNoteItem } from '../types';

interface KitchenResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: CoordinationNoteItem | null;
  mode: 'ACKNOWLEDGE' | 'RESOLVE';
  onSubmit: (responseNote: string) => Promise<void>;
}

export const KitchenResponseModal: React.FC<KitchenResponseModalProps> = ({
  isOpen,
  onClose,
  note,
  mode,
  onSubmit,
}) => {
  const [responseNote, setResponseNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !note) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit(responseNote.trim());
      setResponseNote('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAcknowledge = mode === 'ACKNOWLEDGE';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isAcknowledge ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isAcknowledge ? <ChefHat className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isAcknowledge ? 'Bếp Tiếp Nhận Ghi Chú' : 'Xác Nhận Hoàn Thành Điều Phối'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {note.className} • {note.child ? note.child.fullName : 'Toàn lớp'}
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

        {/* Note brief info */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
          <p className="font-bold text-slate-900">{note.title}</p>
          <p className="text-slate-600 line-clamp-2">{note.content}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {isAcknowledge
                ? 'Nội dung phản hồi từ Bếp / Giải pháp chuẩn bị:'
                : 'Ghi chú xác nhận hoàn thành (Tùy chọn):'}
            </label>
            <textarea
              rows={3}
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder={
                isAcknowledge
                  ? 'VD: Bếp đã tiếp nhận, đã phân công nấu riêng 1 phần cháo hạt sen mềm dán nhãn riêng giao lúc 10h40...'
                  : 'VD: Đã phục vụ đúng yêu cầu của cô giáo, bé đã ăn hết phần...'
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 ${
                isAcknowledge ? 'bg-sky-600 hover:bg-sky-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isAcknowledge ? <ChefHat className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{isSubmitting ? 'Đang cập nhật DB...' : isAcknowledge ? 'Xác nhận tiếp nhận' : 'Hoàn tất điều phối'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
