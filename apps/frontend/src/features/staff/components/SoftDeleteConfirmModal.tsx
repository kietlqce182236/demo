import React from 'react';
import { AlertTriangle, Archive, X } from 'lucide-react';
import { StaffUser } from '../api/staff.api';

interface SoftDeleteConfirmModalProps {
  isOpen: boolean;
  staff: StaffUser | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SoftDeleteConfirmModal: React.FC<SoftDeleteConfirmModalProps> = ({
  isOpen,
  staff,
  isLoading,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Nền làm mờ backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Hộp thoại thông báo */}
      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Chuyển vào lưu trữ (Xóa mềm)?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bạn đang yêu cầu chuyển tài khoản nhân sự sang danh mục lưu trữ.
            </p>
          </div>
        </div>

        {/* Thông tin nhân sự */}
        <div className="my-5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {staff.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">{staff.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{staff.email}</p>
          </div>
        </div>

        {/* Cảnh báo an toàn dữ liệu */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 mb-6 flex gap-2.5">
          <AlertTriangle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 leading-relaxed">
            <span className="font-bold">Bảo toàn dữ liệu: </span>
            Hệ thống áp dụng cơ chế <strong>xóa mềm</strong>. Toàn bộ lịch sử điểm danh học sinh,
            sổ kiểm thực 3 bước và phân công lớp học của nhân sự này vẫn được lưu giữ nguyên vẹn
            và có thể khôi phục bất cứ lúc nào.
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition flex items-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
            <span>Xác nhận xóa mềm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
