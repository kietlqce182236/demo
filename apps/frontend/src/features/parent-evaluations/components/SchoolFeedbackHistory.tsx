import React from 'react';
import {
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  ExternalLink,
  Headphones,
  User,
  ChefHat,
  Sparkles,
} from 'lucide-react';
import { ParentHistoryItem } from '../types';

interface SchoolFeedbackHistoryProps {
  history: ParentHistoryItem[];
  parentName: string;
}

export const SchoolFeedbackHistory: React.FC<SchoolFeedbackHistoryProps> = ({
  history,
  parentName,
}) => {
  const respondedCount = history.filter(
    (h) => h.status === 'RESPONDED' || h.status === 'RESOLVED'
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 mb-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Nhật ký Đóng góp & Phản hồi của Trường
            </h2>
            <p className="text-xs text-slate-500">
              Lịch sử các ý kiến trước đây của {parentName || 'mẹ Hoàng Yến'}
            </p>
          </div>
        </div>

        <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
          Tổng cộng: {respondedCount} ý kiến đã phản hồi
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-5">
        {history.map((item) => {
          const isResolved = item.status === 'RESOLVED';
          const isPending = item.status === 'PENDING';
          const isFoodCategory =
            item.category?.includes('Món ăn') || item.category?.includes('Thực đơn');

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-4 md:p-5 transition hover:border-slate-300"
            >
              {/* Card Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                      isFoodCategory
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.category || 'Món ăn & Dinh dưỡng'}
                  </span>

                  <span className="text-slate-500 font-medium">
                    {item.title || `${item.code} • Ngày gửi: ${item.date}`}
                  </span>
                </div>

                {/* Status Pill */}
                <div className="shrink-0">
                  {isResolved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{item.statusLabel || 'Đã Xử Lý'}</span>
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{item.statusLabel || 'Đang xử lý'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      <span>{item.statusLabel || 'Đã tiếp nhận'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Parent Message Bubble */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed mb-3 flex items-start gap-2.5 shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
                <p className="italic text-slate-700">“{item.content}”</p>
              </div>

              {/* School Official Response Box (if responded) */}
              {item.responseContent ? (
                <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-4 ml-2 sm:ml-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {item.respondedByName?.includes('Mai Lan') ? 'L' : 'B'}
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900">
                          {item.respondedByName || 'Tổ Dinh Dưỡng & Bếp Trưởng'}
                        </span>
                        <span className="text-slate-500 font-normal ml-1">
                          • {item.responseHeader ? `${item.responseHeader} ` : ''}
                          {item.respondedAt
                            ? `Phản hồi ngày ${new Date(item.respondedAt).toLocaleDateString('vi-VN')}`
                            : 'Đã phản hồi'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                      {item.respondedByName?.includes('Mai Lan')
                        ? 'Giáo viên phụ trách'
                        : 'Phản hồi chính thức'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pl-9">
                    “{item.responseContent}”
                  </p>

                  {item.priorityNote && (
                    <div className="pl-9 pt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 transition cursor-pointer">
                        <ExternalLink className="w-3 h-3 text-teal-600" />
                        <span>{item.priorityNote}</span>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-3 ml-2 sm:ml-4 text-xs text-slate-500 italic border border-slate-200 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ban Giám Hiệu & Tổ Dinh dưỡng đang tiếp nhận và sẽ phản hồi trong vòng 24 giờ làm việc.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Hotline Information */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-600 font-medium">
        <Headphones className="w-4 h-4 text-teal-600" />
        <span>
          Phòng Thanh Tra & Chăm Sóc Khách Hàng luôn sẵn sàng tiếp nhận góp ý 24/7 qua{' '}
          <strong className="text-teal-700 font-bold">Hotline 1900 6868 (Phím 2)</strong>
        </span>
      </div>
    </div>
  );
};
