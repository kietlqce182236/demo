import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, ShieldAlert, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { WeeklyMenu } from '../api/weekly-menus.api';

interface RequestEditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: WeeklyMenu | null;
  onSubmitRequest: (id: string, reason: string) => Promise<void>;
}

export const RequestEditMenuModal: React.FC<RequestEditMenuModalProps> = ({
  isOpen,
  onClose,
  menu,
  onSubmitRequest,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !menu || typeof document === 'undefined') return null;

  const quickReasonSuggestions = [
    'Điều chỉnh món ăn do phụ huynh vừa khai báo thêm dị ứng thực phẩm đột xuất.',
    'Thay thế nguyên liệu do nhà cung ứng thực phẩm tươi sống tạm thời hết hàng.',
    'Cân đối lại định lượng calo và P:L:G theo tư vấn chuyên sâu BMI học sinh.',
    'Thay đổi món ăn tráng miệng và nước uống cho phù hợp thời tiết trong tuần.',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Vui lòng nhập lý do cụ thể để Hiệu trưởng xem xét cho phép chỉnh sửa.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitRequest(menu.id, reason.trim());
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi gửi yêu cầu xin phép chỉnh sửa.'
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
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Xin phép Hiệu trưởng chỉnh sửa thực đơn
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {menu.title} (v{menu.version}.0 • {menu.status === 'ACTIVE' ? 'Đã công bố' : 'Đã duyệt'})
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

        {/* Thông báo quy định */}
        <div className="my-4 p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            Thực đơn này đã được Hiệu trưởng phê duyệt và khóa bảo vệ dữ liệu. Theo quy chuẩn quản lý trường học,
            để thay đổi món ăn hoặc định lượng, bạn cần gửi tờ trình xin phép kèm lý do. Khi Hiệu trưởng duyệt đồng ý,
            thực đơn sẽ được mở khóa về bản dự thảo để chỉnh sửa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Lý do đề xuất điều chỉnh thực đơn:</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ghi rõ lý do điều chỉnh: thay thế món nào, vì lý do gì (dị ứng, thiếu nguyên liệu, hay cân đối lại vi chất)..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-medium leading-relaxed"
            />
          </div>

          {/* Gợi ý lý do nhanh */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Gợi ý lý do nhanh (bấm để điền):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickReasonSuggestions.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setReason(item)}
                  className="px-2.5 py-1 rounded-xl text-[11px] bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-medium transition text-left cursor-pointer border border-transparent hover:border-amber-200"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

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
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu lên Hiệu trưởng'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
