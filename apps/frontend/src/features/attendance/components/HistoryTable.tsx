import React from 'react';
import {
  Table2,
  Users2,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Droplet,
  Eye,
  MessageSquare,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
  Clock,
  CalendarX2,
} from 'lucide-react';
import { AttendanceHistoryItem, AttendanceHistoryResponse } from '../types';

interface HistoryTableProps {
  items: AttendanceHistoryItem[];
  pagination: AttendanceHistoryResponse['pagination'];
  viewMode: 'table' | 'by_child';
  onViewModeChange: (mode: 'table' | 'by_child') => void;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange?: (size: number) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  items,
  pagination,
  viewMode = 'table',
  onViewModeChange,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
}) => {
  const currentPage = pagination?.currentPage || 1;
  const totalPages = pagination?.totalPages || 12;
  const totalItems = pagination?.totalItems || 120;
  const totalWeekMeals = pagination?.totalWeekMeals || 120;

  // Build page numbers: e.g. 1, 2, 3, '...', 12
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table Section Header */}
      <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Nhật ký Chi tiết Từng Học sinh
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/70">
              {items.length} bản ghi hiển thị
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Cập nhật theo thời gian thực từ giáo viên chủ nhiệm & nhân viên y tế học đường
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-white text-teal-800 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Dạng bảng</span>
            </button>
            <button
              onClick={() => onViewModeChange('by_child')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'by_child'
                  ? 'bg-white text-teal-800 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Theo từng bé</span>
            </button>
          </div>

          <button
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Tùy chỉnh hiển thị cột"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1050px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4 w-[120px]">Ngày & Bữa</th>
              <th className="py-3 px-4 w-[180px]">Học sinh</th>
              <th className="py-3 px-4 w-[130px]">Điểm danh ăn</th>
              <th className="py-3 px-4 w-[210px]">Món ăn phục vụ</th>
              <th className="py-3 px-4 w-[140px]">Mức độ ăn</th>
              <th className="py-3 px-4 w-[110px]">Nước / Sữa</th>
              <th className="py-3 px-4 min-w-[210px]">Ghi chú của cô</th>
              <th className="py-3 px-4 w-[140px]">Giáo viên & PH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {items.map((item) => {
              const isAbsent = item.attendanceStatus.includes('ABSENT');
              const isLunchOnly = item.attendanceStatusLabel.includes('Chỉ ăn trưa');
              const percentage = item.consumptionPercentage;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isAbsent ? 'bg-slate-50/40 text-slate-500' : ''
                  }`}
                >
                  {/* Col 1: Ngày & Bữa */}
                  <td className="py-3.5 px-4 align-top">
                    <p className="font-extrabold text-slate-900 text-xs leading-snug">
                      {item.dateFormatted}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {item.mealSession}
                    </p>
                  </td>

                  {/* Col 2: Học sinh */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-200/90 shadow-inner flex items-center justify-center">
                        {item.child.avatarUrl ? (
                          <img
                            src={item.child.avatarUrl}
                            alt={item.child.fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs font-extrabold text-slate-600 uppercase">
                            {item.child.fullName.split(' ').pop()?.charAt(0) || 'B'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-xs truncate">
                          {item.child.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          M1: {item.child.studentCode} • {item.child.gender}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Col 3: Điểm danh ăn */}
                  <td className="py-3.5 px-4 align-top">
                    {isAbsent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <CalendarX2 className="w-3 h-3 text-slate-500" />
                        <span>Nghỉ có phép</span>
                      </span>
                    ) : isLunchOnly ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <Clock className="w-3 h-3 text-sky-600" />
                        <span>Chỉ ăn trưa</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Có ăn (Cả ngày)</span>
                      </span>
                    )}
                  </td>

                  {/* Col 4: Món ăn phục vụ */}
                  <td className="py-3.5 px-4 align-top space-y-1">
                    {isAbsent ? (
                      <span className="text-[11px] text-slate-500 italic block">
                        {item.dishesServed[0] || 'Cắt suất ăn'}
                      </span>
                    ) : (
                      <>
                        {item.dishesServed.map((dish, dIdx) => (
                          <p
                            key={dIdx}
                            className={`text-xs font-semibold leading-tight ${
                              dIdx === 0 ? 'text-slate-800' : 'text-slate-500 text-[11px]'
                            }`}
                          >
                            {dish}
                          </p>
                        ))}

                        {/* Dietary Badge */}
                        {item.dietaryBadge && (
                          <div className="pt-0.5">
                            {item.dietaryBadge.type === 'allergy' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                                <ShieldAlert className="w-3 h-3 text-amber-600" />
                                <span>{item.dietaryBadge.text}</span>
                              </span>
                            ) : item.dietaryBadge.type === 'medical' ? (
                              <span className="text-[10px] text-slate-500 italic block">
                                {item.dietaryBadge.text}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </>
                    )}
                  </td>

                  {/* Col 5: Mức độ ăn */}
                  <td className="py-3.5 px-4 align-top">
                    {isAbsent || percentage === null ? (
                      <span className="text-slate-300 font-bold pl-2">—</span>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          {/* Progress bar line */}
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                percentage >= 80
                                  ? 'bg-teal-500'
                                  : percentage >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          {/* Percentage text & icon */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span
                              className={`font-black text-xs ${
                                percentage >= 80
                                  ? 'text-teal-700'
                                  : percentage >= 40
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {percentage}%
                            </span>
                            {percentage >= 80 ? (
                              <Smile className="w-3.5 h-3.5 text-teal-600" />
                            ) : percentage >= 40 ? (
                              <Meh className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Frown className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Col 6: Nước / Sữa */}
                  <td className="py-3.5 px-4 align-top">
                    {isAbsent || item.waterIntake === '—' ? (
                      <span className="text-slate-300 font-bold pl-2">—</span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                        <Droplet
                          className={`w-3.5 h-3.5 ${
                            item.waterIntake.includes('Nước ấm')
                              ? 'text-amber-500 fill-amber-500/20'
                              : 'text-sky-500 fill-sky-500/20'
                          }`}
                        />
                        <span>{item.waterIntake}</span>
                      </div>
                    )}
                  </td>

                  {/* Col 7: Ghi chú của cô */}
                  <td className="py-3.5 px-4 align-top space-y-1">
                    {item.needSpecialAttention && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Cần theo dõi</span>
                      </span>
                    )}
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {item.teacherNote || (isAbsent ? 'Nghỉ có phép' : '—')}
                    </p>
                  </td>

                  {/* Col 8: Giáo viên & Phụ huynh */}
                  <td className="py-3.5 px-4 align-top space-y-1">
                    <p className="text-xs font-bold text-slate-800">{item.teacherName}</p>

                    {item.parentStatus.type === 'VIEWED' ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-teal-700">
                        <Eye className="w-3 h-3 text-teal-600" />
                        <span>{item.parentStatus.label}</span>
                      </div>
                    ) : item.parentStatus.type === 'RESPONDED' ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                        <MessageSquare className="w-3 h-3 text-amber-600" />
                        <span>{item.parentStatus.label}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <BadgeCheck className="w-3 h-3 text-slate-500" />
                        <span>{item.parentStatus.label}</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                  Không tìm thấy bản ghi điểm danh & sức ăn nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Summary text */}
        <div className="flex items-center gap-2 text-slate-500">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="6">6 bản ghi</option>
            <option value="10">10 bản ghi</option>
            <option value="20">20 bản ghi</option>
          </select>
          <span>trên tổng số <strong>{totalWeekMeals}</strong> lượt ăn tuần này</span>
        </div>

        {/* Right: Page Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* First page button */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Trang đầu"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Prev page button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 text-slate-400">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(Number(p))}
                className={`w-7 h-7 rounded-lg font-bold text-xs transition flex items-center justify-center ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next page button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page button */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Trang cuối"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
