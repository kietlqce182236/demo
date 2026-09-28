import React from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChefHat,
  MessageSquare,
  Edit3,
  Trash2,
  User,
  Users,
  ShieldAlert,
  ArrowRight,
  Send,
  Check,
} from 'lucide-react';
import { CoordinationNoteItem } from '../types';

interface CoordinationNotesListProps {
  notes: CoordinationNoteItem[];
  isLoading: boolean;
  onEditNote: (note: CoordinationNoteItem) => void;
  onDeleteNote: (noteId: string) => void;
  onAcknowledgeNote: (note: CoordinationNoteItem) => void;
  onResolveNote: (note: CoordinationNoteItem) => void;
}

export const CoordinationNotesList: React.FC<CoordinationNotesListProps> = ({
  notes,
  isLoading,
  onEditNote,
  onDeleteNote,
  onAcknowledgeNote,
  onResolveNote,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Đang đồng bộ dữ liệu ghi chú điều phối từ cơ sở dữ liệu...</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h4 className="font-bold text-slate-700 text-base">Không tìm thấy ghi chú điều phối nào</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Chưa có ghi chú nào phù hợp với bộ lọc đã chọn. Giáo viên có thể bấm nút &quot;Tạo Ghi Chú Điều Phối Mới&quot; ở góc trên để gửi dặn dò đến Nhà Bếp hoặc Y Tế trường.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => {
        const isUrgent = note.priority === 'URGENT';
        const isHigh = note.priority === 'HIGH';

        return (
          <div
            key={note.id}
            className={`bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md ${
              isUrgent
                ? 'border-red-300 ring-2 ring-red-500/10 bg-gradient-to-r from-red-50/20 via-white to-white'
                : isHigh
                ? 'border-amber-300/80'
                : 'border-slate-200/90'
            }`}
          >
            {/* Header: Priority, Session, Class, Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Priority Badge */}
                {isUrgent ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    🚨 Khẩn cấp
                  </span>
                ) : isHigh ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    ⚠️ Quan trọng
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    ℹ️ Tiêu chuẩn
                  </span>
                )}

                {/* Note Type */}
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                  {note.noteTypeLabel}
                </span>

                {/* Meal Session */}
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {note.mealSessionLabel}
                </span>

                {/* Class */}
                <span className="text-xs font-bold text-slate-800">
                  {note.className}
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {note.status === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    Chờ Bếp tiếp nhận
                  </span>
                )}
                {note.status === 'ACKNOWLEDGED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-bold">
                    <ChefHat className="w-3.5 h-3.5 text-sky-600" />
                    Bếp đã tiếp nhận
                  </span>
                )}
                {note.status === 'PROCESSING' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Đang chuẩn bị
                  </span>
                )}
                {note.status === 'RESOLVED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Đã hoàn thành
                  </span>
                )}
              </div>
            </div>

            {/* Target Child & Teacher Info */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Child Info */}
              {note.child ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {note.child.avatarLetter}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {note.child.fullName}
                      </span>
                      <span className="font-semibold text-slate-500 text-[11px]">
                        ({note.child.studentCode})
                      </span>
                    </div>
                    {note.child.allergyWarning && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                        <ShieldAlert className="w-3 h-3" />
                        Cảnh báo: {note.child.allergyWarning}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-800">
                    Áp dụng cho toàn thể học sinh {note.className}
                  </span>
                </div>
              )}

              {/* Sender & Target */}
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <span>
                  Lập bởi: <strong className="text-slate-700">{note.teacherName}</strong> ({note.createdAt})
                </span>
                <span>•</span>
                <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                  Gửi: {note.targetRoleLabel}
                </span>
              </div>
            </div>

            {/* Content Title & Details */}
            <div className="mt-1 space-y-1.5">
              <h4 className="font-black text-slate-900 text-sm leading-snug">
                {note.title}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {note.content}
              </p>
            </div>

            {/* Kitchen Response Box (if any) */}
            {note.kitchenResponse && (
              <div className="mt-3 bg-teal-50/60 border border-teal-200/80 rounded-xl p-3.5 text-xs text-teal-950 space-y-1">
                <div className="flex items-center justify-between font-bold text-teal-900">
                  <span className="flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-teal-700" />
                    Phản hồi từ Nhà Bếp: {note.kitchenAcknowledgedBy || 'Bếp Bán Trú'}
                  </span>
                  {note.kitchenAcknowledgedAt && (
                    <span className="text-[11px] text-teal-700 font-medium">
                      Tiếp nhận lúc {note.kitchenAcknowledgedAt}
                    </span>
                  )}
                </div>
                <p className="text-slate-800 text-xs font-medium whitespace-pre-line pl-5">
                  {note.kitchenResponse}
                </p>
              </div>
            )}

            {/* Actions Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Fast Kitchen Acknowledge button */}
                {note.status === 'PENDING' && (
                  <button
                    onClick={() => onAcknowledgeNote(note)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Bếp xác nhận tiếp nhận</span>
                  </button>
                )}

                {/* Fast Resolve button */}
                {note.status !== 'RESOLVED' && (
                  <button
                    onClick={() => onResolveNote(note)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Đánh dấu hoàn thành</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Edit Note */}
                <button
                  onClick={() => onEditNote(note)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition border border-slate-200"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sửa</span>
                </button>

                {/* Delete Note */}
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200"
                  title="Xóa ghi chú này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
