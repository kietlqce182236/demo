import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { ChildAttendanceItem } from '../types';

interface EditNoteModalProps {
  child: ChildAttendanceItem | null;
  onClose: () => void;
  onSave: (childId: string, newNote: string) => void;
}

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  child,
  onClose,
  onSave,
}) => {
  if (!child) return null;

  const [note, setNote] = useState(child.parentNote || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(child.id, note);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Chỉnh sửa Dặn dò Phụ huynh & Lưu ý
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Học sinh: <strong className="text-teal-700">{child.fullName}</strong> ({child.studentCode})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nội dung dặn dò của phụ huynh / Ghi chú điều phối:
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập dặn dò uống thuốc, chế độ ăn, dặn dò bình nước, thời gian đón sớm..."
              className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 text-xs bg-amber-50 p-3 rounded-2xl border border-amber-200/70 text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Ghi chú này sẽ được đồng bộ trực tiếp tới bảng hiển thị bếp và sổ liên lạc điện tử.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
