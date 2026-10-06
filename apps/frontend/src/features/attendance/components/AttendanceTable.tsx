import React, { useState } from 'react';
import {
  ListFilter,
  Check,
  Edit2,
  Cloud,
  Clock,
  Ban,
  AlertCircle,
  Milk,
  Soup,
  UtensilsCrossed,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { ChildAttendanceItem, MealOption } from '../types';

interface AttendanceTableProps {
  childrenList: ChildAttendanceItem[];
  totalStudents: number;
  lastSyncTime: string;
  recordedBy: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onUpdateStatus: (childId: string, mealOption: MealOption) => void;
  onOpenEditNote: (child: ChildAttendanceItem) => void;
  selectedChildIds: string[];
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectChild: (childId: string) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  childrenList,
  totalStudents,
  lastSyncTime,
  recordedBy,
  currentPage,
  totalPages,
  onPageChange,
  onUpdateStatus,
  onOpenEditNote,
  selectedChildIds,
  onToggleSelectAll,
  onToggleSelectChild,
}) => {
  const isAllSelected = childrenList.length > 0 && childrenList.every((c) => selectedChildIds.includes(c.id));

  // Helper avatar generator with image or initials with pleasant colors
  const getAvatarBadge = (child: ChildAttendanceItem) => {
    if (child.avatarUrl) {
      return (
        <img
          src={child.avatarUrl}
          alt={child.fullName}
          className="w-10 h-10 rounded-full border-2 border-teal-200/90 object-cover shrink-0 shadow-xs"
          onError={(e) => {
            // Fallback: hide broken image and display initials
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    const initials = child.fullName
      .split(' ')
      .slice(-2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

    const colorVariants = [
      'bg-amber-100 text-amber-800 border-amber-300',
      'bg-emerald-100 text-emerald-800 border-emerald-300',
      'bg-teal-100 text-teal-800 border-teal-300',
      'bg-blue-100 text-blue-800 border-blue-300',
      'bg-rose-100 text-rose-800 border-rose-300',
      'bg-purple-100 text-purple-800 border-purple-300',
    ];

    const idx = child.fullName.charCodeAt(0) % colorVariants.length;
    const color = colorVariants[idx];

    return (
      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 ${color}`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table Header Section */}
      <div className="p-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
            <ListFilter className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm text-slate-800 tracking-tight">
                Danh sách học sinh điểm danh ăn bán trú
              </h2>
              <span className="text-[11px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                Đang hiển thị: {childrenList.length} / {totalStudents} bé tiêu biểu
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Cập nhật lần cuối: <strong className="text-slate-700">{lastSyncTime} - {recordedBy}</strong>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <th className="py-3.5 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4 min-w-[200px]">Học Sinh</th>
              <th className="py-3.5 px-4 min-w-[200px] text-center">Điểm Danh (Có mặt / Vắng)</th>
              <th className="py-3.5 px-4 min-w-[240px]">Chế Độ Dinh Dưỡng & Dị Ứng</th>
              <th className="py-3.5 px-4 min-w-[280px]">Ghi Chú Dặn Dò Của Phụ Huynh</th>
              <th className="py-3.5 px-4 min-w-[140px] text-center">Bếp Tiếp Nhận</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {childrenList.map((child) => {
              const isSelected = selectedChildIds.includes(child.id);
              const isAbsent = child.mealOption === 'ABSENT';

              return (
                <tr
                  key={child.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isAbsent ? 'bg-slate-50/40 text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectChild(child.id)}
                      className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                    />
                  </td>

                  {/* Student Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {getAvatarBadge(child)}
                      <div>
                        <p className={`font-extrabold text-sm ${isAbsent ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {child.fullName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium">
                          <span className="px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-bold border border-teal-200/50">
                            {child.studentCode}
                          </span>
                          <span>•</span>
                          <span>{child.genderAgeText}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Điểm danh: Có mặt / Vắng */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold gap-1.5 shadow-inner">
                      {/* Có mặt */}
                      <button
                        onClick={() => onUpdateStatus(child.id, 'ALL_DAY')}
                        className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 font-bold ${
                          !isAbsent
                            ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-600/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                        title="Bé có mặt ăn bán trú hôm nay"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Có mặt</span>
                      </button>

                      {/* Vắng */}
                      <button
                        onClick={() => onUpdateStatus(child.id, 'ABSENT')}
                        className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 font-bold ${
                          isAbsent
                            ? 'bg-rose-700 text-white shadow-sm ring-1 ring-rose-700/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                        title="Bé vắng mặt (cắt suất ăn)"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Vắng</span>
                      </button>
                    </div>
                  </td>

                  {/* Nutrition & Allergy Badge */}
                  <td className="py-3.5 px-4">
                    {isAbsent ? (
                      <span className="text-xs font-semibold text-slate-400 italic">
                        Cắt suất ăn ngày {new Date().toLocaleDateString('vi-VN')}
                      </span>
                    ) : child.dietBadge.type === 'ALLERGY' ? (
                      <div className="space-y-0.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{child.dietBadge.title}</span>
                        </div>
                        {child.dietBadge.description && (
                          <p className="text-[11px] text-red-600/90 font-medium">
                            {child.dietBadge.description}
                          </p>
                        )}
                      </div>
                    ) : child.dietBadge.type === 'INTOLERANCE' ? (
                      <div className="space-y-0.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                          <Milk className="w-3.5 h-3.5 shrink-0" />
                          <span>{child.dietBadge.title}</span>
                        </div>
                        {child.dietBadge.description && (
                          <p className="text-[11px] text-amber-700/90 font-medium">
                            {child.dietBadge.description}
                          </p>
                        )}
                      </div>
                    ) : child.dietBadge.type === 'SPECIAL_CARE' ? (
                      <div className="space-y-0.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold border border-blue-200">
                          <Soup className="w-3.5 h-3.5 shrink-0" />
                          <span>{child.dietBadge.title}</span>
                        </div>
                        {child.dietBadge.description && (
                          <p className="text-[11px] text-blue-700/90 font-medium">
                            {child.dietBadge.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{child.dietBadge.title}</span>
                      </div>
                    )}
                  </td>

                  {/* Parent Notes & Instructions */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-between gap-2 group">
                      <div className="text-xs font-medium">
                        {child.parentNote ? (
                          <p className={isAbsent ? 'text-amber-800 font-semibold' : 'text-slate-700'}>
                            "{child.parentNote}"
                          </p>
                        ) : (
                          <p className="text-slate-400 italic">Không có dặn dò đặc biệt</p>
                        )}
                      </div>
                      <button
                        onClick={() => onOpenEditNote(child)}
                        title="Chỉnh sửa ghi chú phụ huynh"
                        className="opacity-60 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Kitchen Sync Status */}
                  <td className="py-3.5 px-4 text-center">
                    {child.kitchenStatus === 'SYNCED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đã đồng bộ
                      </span>
                    ) : child.kitchenStatus === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-[11px] font-bold">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Chờ bếp duyệt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[11px] font-semibold">
                        <Ban className="w-3 h-3 text-slate-400" />
                        Đã hủy suất
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer: Helper tip + Pagination */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-amber-700 flex items-center gap-1.5 font-medium">
          <span>💡</span>
          <span><strong>Mẹo thao tác:</strong> Bấm nút "Có mặt" hoặc "Vắng" để cập nhật trạng thái báo ăn của bé tức thì.</span>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2 font-semibold text-slate-600">
          <span>Trang {currentPage} / {totalPages}</span>
          <div className="flex items-center gap-1 ml-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                  p === currentPage
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
