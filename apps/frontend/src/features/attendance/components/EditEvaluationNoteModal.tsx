import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare, GlassWater, AlertCircle } from 'lucide-react';
import { MealEvaluationItem } from '../types';

interface EditEvaluationNoteModalProps {
  isOpen: boolean;
  child: MealEvaluationItem | null;
  onClose: () => void;
  onSave: (childId: string, waterIntake: string, notes: string, syncStatus: string) => Promise<void>;
}

export const EditEvaluationNoteModal: React.FC<EditEvaluationNoteModalProps> = ({
  isOpen,
  child,
  onClose,
  onSave,
}) => {
  const [waterIntake, setWaterIntake] = useState('');
  const [notes, setNotes] = useState('');
  const [syncStatus, setSyncStatus] = useState('SENT');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (child) {
      setWaterIntake(child.waterIntake || '200ml Nước ấm');
      setNotes(child.teacherNote || '');
      setSyncStatus(child.sendState?.status || 'SENT');
    }
  }, [child]);

  if (!isOpen || !child) return null;

  const quickWaterOptions = [
    '200ml Nước ấm',
    '250ml Nước ấm',
    '150ml Nước ấm',
    '150ml Nước gừng mật ong',
    '180ml Sữa yến mạch',
    '180ml Sữa hạt đậu nành',
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(child.id, waterIntake, notes, syncStatus);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm border border-teal-200">
              {child.avatarLetter}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{child.fullName}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {child.studentCode} • {child.genderAgeText}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Water/Milk Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <GlassWater className="w-4 h-4 text-teal-600" />
              Nước / Sữa uống thêm sau bữa
            </label>
            <input
              type="text"
              value={waterIntake}
              onChange={(e) => setWaterIntake(e.target.value)}
              placeholder="Ví dụ: 200ml Nước ấm"
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            />
            {/* Quick choices */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickWaterOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setWaterIntake(opt)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                    waterIntake === opt
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Teacher Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              Ghi chú của cô giáo
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ghi nhận sức ăn, biểu hiện của trẻ hoặc yêu cầu dặn dò..."
              className="w-full text-xs font-medium p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none"
            />
          </div>

          {/* Sync Status Flag */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Trạng thái gửi phụ huynh & bếp
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSyncStatus('SENT')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition text-center ${
                  syncStatus === 'SENT'
                    ? 'bg-teal-50 border-teal-500 text-teal-700 ring-2 ring-teal-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Đã gửi bình thường
              </button>
              <button
                type="button"
                onClick={() => setSyncStatus('PENDING')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition text-center ${
                  syncStatus === 'PENDING'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Chờ gửi duyệt
              </button>
              <button
                type="button"
                onClick={() => setSyncStatus('URGENT_PARENT')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition text-center ${
                  syncStatus === 'URGENT_PARENT'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Báo phụ huynh gấp
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
