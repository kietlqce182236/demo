import React from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Ban,
  ChevronDown,
} from 'lucide-react';
import { SnackRosterItem } from '../types';

interface SnackRosterTableProps {
  items: SnackRosterItem[];
  isLoading: boolean;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewDetail: (item: SnackRosterItem) => void;
}

export const SnackRosterTable: React.FC<SnackRosterTableProps> = ({
  items,
  isLoading,
  totalItems,
  currentPage,
  totalPages,
  pageSize,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
}) => {
  // Helper to color class badges
  const renderClassBadge = (className: string) => {
    if (className.includes('Mầm')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]">
          {className}
        </span>
      );
    }
    if (className.includes('Chồi')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#ffedd5] text-[#9a3412] border border-[#fed7aa]">
          {className}
        </span>
      );
    }
    if (className.includes('Lá')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
          {className}
        </span>
      );
    }
    // Nhà trẻ
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0]">
        {className}
      </span>
    );
  };

  // Helper to color avatar
  const getAvatarBg = (initials: string, index: number) => {
    const colors = [
      'bg-[#fce7f3] text-[#be185d]', // NA pink
      'bg-[#e0f2fe] text-[#0369a1]', // BM blue
      'bg-[#fef3c7] text-[#b45309]', // TH yellow
      'bg-[#f3e8ff] text-[#7e22ce]', // LL purple
      'bg-[#ccfbf1] text-[#0f766e]', // ĐK teal
      'bg-[#ffe4e6] text-[#e11d48]', // PA rose
      'bg-[#dbeafe] text-[#1d4ed8]', // VD indigo
      'bg-[#d1fae5] text-[#047857]', // MA green
    ];
    return colors[index % colors.length];
  };

  // Helper for diet badge pill
  const renderDietBadge = (item: SnackRosterItem) => {
    const text = item.snackDietBadgeText;

    if (item.snackDietType === 'NO_MILK') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#ffe4e6] text-[#be123c] border border-[#fecdd3]">
          <Ban className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Không sữa</span>
        </span>
      );
    }

    if (item.snackDietType === 'ALLERGY_PEANUT') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]">
          <AlertTriangle className="w-3.5 h-3.5 fill-[#f87171] text-[#fee2e2]" />
          <span>Dị ứng đậu phộng</span>
        </span>
      );
    }

    if (item.snackDietType === 'LOW_SUGAR' || item.snackDietType === 'NO_SUGAR') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
          {text}
        </span>
      );
    }

    if (item.snackDietType === 'SOFT_MASHED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#f3e8ff] text-[#7e22ce] border border-[#e9d5ff]">
          {text}
        </span>
      );
    }

    if (item.snackDietType === 'NO_EGG') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#ffe4e6] text-[#be123c] border border-[#fecdd3]">
          <Ban className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Không trứng</span>
        </span>
      );
    }

    if (item.snackDietType === 'SEAFOOD_ALLERGY') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]">
          <AlertTriangle className="w-3.5 h-3.5 fill-[#f87171] text-[#fee2e2]" />
          <span>Dị ứng hải sản</span>
        </span>
      );
    }

    // Default: Tiêu chuẩn
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">
        {text}
      </span>
    );
  };

  // Helper for pagination numbers
  const renderPaginationButtons = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages.map((p, idx) => {
      if (p === '...') {
        return (
          <span key={`dots-${idx}`} className="px-2 text-slate-400 text-xs font-bold">
            ...
          </span>
        );
      }

      const isCurrent = p === currentPage;
      return (
        <button
          key={`page-${p}`}
          onClick={() => onPageChange(p as number)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
            isCurrent
              ? 'bg-[#1b4332] text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {p}
        </button>
      );
    });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Danh sách phục vụ bữa xế
          </h2>
          <span className="px-3 py-1 rounded-full text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200/70">
            Hiển thị {items.length} trong tổng số {totalItems} học sinh
          </span>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#f0fdf4] text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Chỉ chuẩn bị suất cho trẻ đã hoàn tất phí
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-[#f8fafc]/80 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              <th className="py-3.5 px-6 whitespace-nowrap">MÃ HỌC SINH</th>
              <th className="py-3.5 px-6 whitespace-nowrap">HỌC SINH</th>
              <th className="py-3.5 px-4 whitespace-nowrap">LỚP</th>
              <th className="py-3.5 px-4 whitespace-nowrap">KHỐI</th>
              <th className="py-3.5 px-4 whitespace-nowrap">TRẠNG THÁI PHÍ</th>
              <th className="py-3.5 px-4 whitespace-nowrap">SUẤT ĂN XẾ</th>
              <th className="py-3.5 px-6 min-w-[260px]">GHI CHÚ NHÀ BẾP</th>
              <th className="py-3.5 px-6 text-right whitespace-nowrap">THAO TÁC</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-medium">Đang tải danh sách học sinh ăn xế từ cơ sở dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                  Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Mã học sinh */}
                  <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
                    {item.studentCode}
                  </td>

                  {/* Học sinh (Avatar, Tên, Ngày sinh & Tuổi) */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarBg(
                          item.avatarInitials,
                          idx
                        )}`}
                      >
                        {item.avatarInitials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">
                          {item.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.formattedDob} ({item.ageLabel})
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Lớp */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {renderClassBadge(item.className)}
                  </td>

                  {/* Khối */}
                  <td className="py-4 px-4 font-medium text-slate-700 whitespace-nowrap">
                    {item.blockName}
                  </td>

                  {/* Trạng thái phí */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eefbf2] text-[#15803d] border border-[#bbf7d0]">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{item.paymentStatusLabel}</span>
                    </span>
                  </td>

                  {/* Suất ăn xế */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {renderDietBadge(item)}
                  </td>

                  {/* Ghi chú nhà bếp */}
                  <td className="py-4 px-6">
                    {item.isKitchenHighlight ? (
                      <div className="p-2.5 rounded-xl bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] font-bold text-xs leading-relaxed inline-block">
                        {item.kitchenNotes}
                      </div>
                    ) : (
                      <span className="text-slate-700 text-xs leading-relaxed">
                        {item.kitchenNotes}
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button
                      onClick={() => onViewDetail(item)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-emerald-800 transition active:scale-95"
                    >
                      <span>Chi tiết</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        {/* Left: Info */}
        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <strong className="text-slate-800 font-bold">{startIndex} - {endIndex}</strong> của{' '}
          <strong className="text-slate-800 font-bold">{totalItems}</strong> học sinh
        </div>

        {/* Middle: Page Size Selector */}
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <span>Số lượng:</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="appearance-none bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 pr-6 cursor-pointer focus:outline-none focus:border-emerald-600"
            >
              <option value={8}>8 học sinh / trang</option>
              <option value={16}>16 học sinh / trang</option>
              <option value={24}>24 học sinh / trang</option>
              <option value={32}>32 học sinh / trang</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Pagination Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {renderPaginationButtons()}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
