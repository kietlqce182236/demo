import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, XCircle, AlertCircle, ShieldAlert, FileText, User } from 'lucide-react';
import { WeeklyMenu } from '../api/weekly-menus.api';

interface RespondEditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: WeeklyMenu | null;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const RespondEditRequestModal: React.FC<RespondEditRequestModalProps> = ({
  isOpen,
  onClose,
  menu,
  onApprove,
  onReject,
}) => {
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !menu || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (actionType === 'reject' && !rejectReason.trim()) {
      setError('Vui lòng nhập lý do từ chối yêu cầu chỉnh sửa.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (actionType === 'approve') {
        await onApprove(menu.id, notes.trim() || undefined);
      } else {
        await onReject(menu.id, rejectReason.trim());
      }
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi xử lý yêu cầu chỉnh sửa.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 overflow-hidden z-10 animate-in zoom-in-95 duration-200 border border-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-2xs ${
                actionType === 'approve'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {actionType === 'approve' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {actionType === 'approve'
                  ? 'Chấp thuận cho phép chỉnh sửa thực đơn'
                  : 'Từ chối yêu cầu xin chỉnh sửa'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {menu.title} (v{menu.version}.0)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông tin đơn xin phép từ CV Dinh dưỡng */}
        <div className="my-4 p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              Tờ trình xin phép từ Chuyên viên Dinh dưỡng
            </span>
            {menu.editRequestAt && (
              <span className="text-[10px] text-amber-800 font-medium">
                {new Date(menu.editRequestAt).toLocaleString('vi-VN')}
              </span>
            )}
          </div>
          <p className="text-xs text-amber-950 font-bold bg-white/70 p-3 rounded-xl border border-amber-200/60 leading-relaxed">
            "{menu.editRequestReason || 'Chuyên viên dinh dưỡng đề xuất điều chỉnh thực đơn tuần.'}"
          </p>
          <p className="text-[11px] text-amber-800 mt-2 font-medium">
            💡 Nếu Hiệu trưởng chấp thuận, thực đơn sẽ được <strong>mở khóa về trạng thái Bản dự thảo (DRAFT)</strong> để Chuyên viên Dinh dưỡng chỉnh sửa lại các món ăn và gửi duyệt lại.
          </p>
        </div>

        {/* Tabs chọn Quyết định của Hiệu trưởng */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setActionType('approve')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              actionType === 'approve'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chấp thuận mở khóa</span>
          </button>
          <button
            type="button"
            onClick={() => setActionType('reject')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              actionType === 'reject'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Từ chối yêu cầu</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {actionType === 'approve' ? (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Ý kiến chỉ đạo / Ghi chú của Hiệu trưởng (Không bắt buộc):
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Đồng ý mở khóa để điều chỉnh món ăn thay thế cho học sinh dị ứng hải sản..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none font-medium leading-relaxed"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                <span>Lý do Hiệu trưởng từ chối mở khóa:</span>
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do không cho phép chỉnh sửa thực đơn này..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none font-medium leading-relaxed"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-2xl text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                actionType === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
              }`}
            >
              {actionType === 'approve' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận Chấp thuận mở khóa'}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận Từ chối yêu cầu'}</span>
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
