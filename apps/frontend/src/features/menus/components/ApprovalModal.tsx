import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, XCircle, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { WeeklyMenu } from '../api/weekly-menus.api';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: WeeklyMenu | null;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  menu,
  onApprove,
  onReject,
}) => {
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('Đã đối chiếu chuẩn dinh dưỡng Bộ GD&ĐT, duyệt áp dụng cho tuần này.');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !menu || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (actionType === 'reject' && !reason.trim()) {
      setError('Vui lòng nhập lý do từ chối để chuyên viên dinh dưỡng chỉnh sửa.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (actionType === 'approve') {
        await onApprove(menu.id, notes);
      } else {
        await onReject(menu.id, reason);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi xử lý phê duyệt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Nền mờ Backdrop Blur */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                actionType === 'approve'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {actionType === 'approve' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {actionType === 'approve' ? 'Phê duyệt thực đơn tuần' : 'Từ chối thực đơn tuần'}
              </h3>
              <p className="text-xs text-slate-500">{menu.title} (Bản v{menu.version}.0)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab chọn hành động: Duyệt hoặc Từ chối */}
        <div className="flex p-1 bg-slate-100 rounded-2xl my-4">
          <button
            type="button"
            onClick={() => {
              setActionType('approve');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              actionType === 'approve'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Phê duyệt áp dụng</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActionType('reject');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              actionType === 'reject'
                ? 'bg-white text-rose-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Từ chối (Yêu cầu sửa)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tóm tắt dinh dưỡng thực đơn */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Chu kỳ áp dụng:</span>
              <span className="font-semibold text-slate-900">
                {menu.startDate?.split('T')[0]} đến {menu.endDate?.split('T')[0]} (Tuần {menu.cycleWeekNumber})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Năng lượng trung bình:</span>
              <span className="font-bold text-emerald-700">
                {menu.dailyAverageCalories || 780} Kcal / ngày (Chuẩn VN-RDA)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Người lập thực đơn:</span>
              <span className="font-medium text-slate-800">BS. Hoàng Mai Trang (Dinh dưỡng)</span>
            </div>
          </div>

          {actionType === 'approve' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi chú phê duyệt của Ban Giám Hiệu
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Nhập nhận xét hoặc ý kiến chỉ đạo (tùy chọn)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                Lý do từ chối (Bắt buộc) <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Thiếu món tráng miệng ngày thứ 4, giảm bớt đồ chiên rán..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition disabled:opacity-50 ${
                actionType === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Đang xử lý...</span>
                </>
              ) : actionType === 'approve' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác nhận Phê duyệt</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Xác nhận Từ chối</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
