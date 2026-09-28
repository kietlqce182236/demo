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
  ArrowRight,
  UserCheck,
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
  onFilterChild?: (studentName: string) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  items,
  pagination,
  viewMode = 'table',
  onViewModeChange,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  onFilterChild,
}) => {
  const currentPage = pagination?.currentPage ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.totalItems ?? items.length;
  const totalWeekMeals = pagination?.totalWeekMeals ?? totalItems;

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

  // Group items by child for "Theo từng bé" view mode
  const groupedChildren = React.useMemo(() => {
    const map = new Map<string, {
      child: AttendanceHistoryItem['child'];
      meals: AttendanceHistoryItem[];
      totalMeals: number;
      ateAllCount: number;
      ateHalfCount: number;
      ateLittleCount: number;
      absentCount: number;
      specialDiet?: string;
      latestNote?: string;
      averagePercent: number;
    }>();

    items.forEach((item) => {
      const code = item.child.studentCode;
      if (!map.has(code)) {
        map.set(code, {
          child: item.child,
          meals: [],
          totalMeals: 0,
          ateAllCount: 0,
          ateHalfCount: 0,
          ateLittleCount: 0,
          absentCount: 0,
          specialDiet: item.dietaryBadge?.text,
          latestNote: item.teacherNote,
          averagePercent: 0,
        });
      }

      const entry = map.get(code)!;
      entry.meals.push(item);
      entry.totalMeals++;

      if (item.dietaryBadge?.text) {
        entry.specialDiet = item.dietaryBadge.text;
      }
      if (item.teacherNote && !entry.latestNote) {
        entry.latestNote = item.teacherNote;
      }

      if (item.attendanceStatus.includes('ABSENT')) {
        entry.absentCount++;
      } else {
        if (item.portionConsumed === 'ALL' || item.consumptionPercentage === 100) {
          entry.ateAllCount++;
        } else if (item.portionConsumed === 'HALF' || (item.consumptionPercentage && item.consumptionPercentage >= 40 && item.consumptionPercentage <= 70)) {
          entry.ateHalfCount++;
        } else {
          entry.ateLittleCount++;
        }
      }
    });

    return Array.from(map.values()).map((entry) => {
      const presentCount = entry.totalMeals - entry.absentCount;
      const avg = presentCount > 0
        ? Math.round(
            entry.meals.reduce((acc, m) => acc + (m.consumptionPercentage || 0), 0) / presentCount
          )
        : 0;
      return { ...entry, averagePercent: avg };
    });
  }, [items]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table Section Header */}
      <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              {viewMode === 'table' ? 'Nhật ký Chi tiết Từng Học sinh' : 'Tổng hợp Sức Ăn Theo Từng Bé'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/70">
              {viewMode === 'table' ? `${items.length} bản ghi hiển thị` : `${groupedChildren.length} học sinh`}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {viewMode === 'table'
              ? 'Dữ liệu thời gian thực từ giáo viên chủ nhiệm & nhân viên dinh dưỡng học đường'
              : 'Tổng quan lịch sử ăn uống, tỷ lệ tiêu thụ và cảnh báo chế độ ăn riêng biệt'}
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
              <Users2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Theo từng bé</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Mode: Grouped By Child */}
      {viewMode === 'by_child' ? (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50">
          {groupedChildren.map((entry) => (
            <div
              key={entry.child.studentCode}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition space-y-3.5"
            >
              {/* Child Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {entry.child.avatarUrl ? (
                    <img
                      src={entry.child.avatarUrl}
                      alt={entry.child.fullName}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600 text-sm">
                      {entry.child.fullName.split(' ').pop()?.[0] || 'B'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {entry.child.fullName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                        {entry.child.studentCode}
                      </span>
                      <span>•</span>
                      <span>{entry.child.gender}</span>
                    </div>
                  </div>
                </div>

                {entry.specialDiet && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                    Chế độ riêng
                  </span>
                )}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Hết suất</p>
                  <p className="text-xs font-black text-emerald-600">{entry.ateAllCount} bữa</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Ăn 1/2</p>
                  <p className="text-xs font-black text-amber-600">{entry.ateHalfCount} bữa</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Nghỉ/Ăn ít</p>
                  <p className="text-xs font-black text-rose-600">
                    {entry.absentCount + entry.ateLittleCount} bữa
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600">Mức độ ăn trung bình:</span>
                  <span className="font-extrabold text-teal-700">{entry.averagePercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      entry.averagePercent >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                        : entry.averagePercent >= 50
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'bg-gradient-to-r from-rose-400 to-rose-500'
                    }`}
                    style={{ width: `${entry.averagePercent}%` }}
                  />
                </div>
              </div>

              {/* Special Diet or Note */}
              {entry.specialDiet && (
                <div className="text-[11px] font-semibold text-amber-800 bg-amber-50/70 p-2 rounded-xl border border-amber-200/80">
                  Suất ăn: {entry.specialDiet}
                </div>
              )}

              {/* Filter Button */}
              <button
                type="button"
                onClick={() => {
                  onFilterChild?.(entry.child.fullName);
                  onViewModeChange('table');
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-teal-700 hover:text-white bg-teal-50 hover:bg-teal-600 rounded-xl transition"
              >
                <span>Xem chi tiết nhật ký bé</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {groupedChildren.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 font-medium">
              Không có học sinh nào phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      ) : (
        /* View Mode: Table */
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
                    {/* Col 1: Date & Session */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 text-[13px]">
                        {item.dateFormatted}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {item.mealSession}
                      </div>
                    </td>

                    {/* Col 2: Child Avatar & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {item.child.avatarUrl ? (
                          <img
                            src={item.child.avatarUrl}
                            alt={item.child.fullName}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                            {item.child.fullName.split(' ').pop()?.[0] || 'B'}
                          </div>
                        )}
                        <div>
                          <p
                            onClick={() => onFilterChild?.(item.child.fullName)}
                            className="font-bold text-slate-900 text-xs hover:text-teal-700 cursor-pointer transition"
                            title="Bấm để lọc riêng bé này"
                          >
                            {item.child.fullName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                            <span className="font-mono">{item.child.studentCode}</span>
                            <span>•</span>
                            <span>{item.child.gender}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Col 3: Attendance Status */}
                    <td className="py-3 px-4">
                      {isAbsent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <CalendarX2 className="w-3 h-3 text-rose-500" />
                          <span>{item.attendanceStatusLabel}</span>
                        </span>
                      ) : isLunchOnly ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{item.attendanceStatusLabel}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>{item.attendanceStatusLabel}</span>
                        </span>
                      )}
                    </td>

                    {/* Col 4: Dishes Served & Special Diet Badges */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {item.dishesServed.map((dish, dIdx) => (
                          <p
                            key={dIdx}
                            className={`text-xs ${
                              isAbsent
                                ? 'text-slate-400 italic line-through'
                                : 'text-slate-800 font-medium'
                            }`}
                          >
                            {dish}
                          </p>
                        ))}

                        {item.dietaryBadge && (
                          <div className="pt-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                item.dietaryBadge.type === 'allergy'
                                  ? 'bg-amber-100/90 text-amber-900 border border-amber-300'
                                  : 'bg-purple-100 text-purple-900 border border-purple-300'
                              }`}
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>{item.dietaryBadge.text}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Col 5: Portion Consumed Progress Bar */}
                    <td className="py-3 px-4">
                      {isAbsent ? (
                        <span className="text-slate-400 font-medium">—</span>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-800">
                              {percentage !== null ? `${percentage}%` : '100%'}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">
                              {percentage === 100
                                ? 'Hết suất'
                                : percentage && percentage >= 50
                                ? 'Ăn 1/2'
                                : 'Ăn ít / Bỏ'}
                            </span>
                          </div>

                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                (percentage ?? 100) >= 80
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                                  : (percentage ?? 100) >= 50
                                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                  : 'bg-gradient-to-r from-rose-400 to-rose-500'
                              }`}
                              style={{ width: `${percentage ?? 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Col 6: Water Intake */}
                    <td className="py-3 px-4">
                      {isAbsent ? (
                        <span className="text-slate-400 font-medium">—</span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Droplet className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span>{item.waterIntake}</span>
                        </div>
                      )}
                    </td>

                    {/* Col 7: Teacher Note & Special Attention */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {item.needSpecialAttention && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span>Cần chú ý dinh dưỡng</span>
                          </div>
                        )}
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {item.teacherNote || (
                            <span className="text-slate-400 italic">Không có ghi chú thêm</span>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* Col 8: Teacher Name & Parent Status */}
                    <td className="py-3 px-4 space-y-1">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>{item.teacherName}</span>
                      </div>

                      {item.parentStatus && (
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.parentStatus.type === 'RESPONDED'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : item.parentStatus.type === 'RECONCILED'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {item.parentStatus.type === 'RESPONDED' ? (
                            <MessageSquare className="w-2.5 h-2.5 text-sky-600" />
                          ) : item.parentStatus.type === 'RECONCILED' ? (
                            <CheckCircle2 className="w-2.5 h-2.5 text-purple-600" />
                          ) : (
                            <Eye className="w-2.5 h-2.5 text-slate-500" />
                          )}
                          <span>{item.parentStatus.label}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <SlidersHorizontal className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        Không tìm thấy bản ghi điểm danh & sức ăn nào phù hợp với bộ lọc
                      </p>
                      <p className="text-xs text-slate-400">
                        Hãy thử điều chỉnh lại từ khóa tìm kiếm, trạng thái hoặc khoảng thời gian
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Summary text */}
        <div className="flex items-center gap-2 text-slate-500">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="6">6 bản ghi</option>
            <option value="10">10 bản ghi</option>
            <option value="20">20 bản ghi</option>
          </select>
          <span>
            trên tổng số <strong>{totalItems}</strong> bản ghi phù hợp ({totalWeekMeals} suất ăn trong kỳ)
          </span>
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
                className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-sm font-extrabold'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
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
