import React from 'react';
import { Search, Camera, ChevronDown } from 'lucide-react';
import { ParentEvaluationSummaryStats } from '../types';

interface EvaluationFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusTab: string; // 'ALL' | 'PENDING' | 'RESPONDED' | 'HAS_PHOTO'
  onStatusTabChange: (status: string) => void;
  ratingFilter: number; // 0 for all
  onRatingChange: (rating: number) => void;
  mealFilter: string; // 'ALL' | ...
  onMealChange: (meal: string) => void;
  classFilter: string; // 'ALL' | ...
  onClassChange: (className: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  stats?: ParentEvaluationSummaryStats;
}

export const EvaluationFilterBar: React.FC<EvaluationFilterBarProps> = ({
  search,
  onSearchChange,
  statusTab,
  onStatusTabChange,
  ratingFilter,
  onRatingChange,
  mealFilter,
  onMealChange,
  classFilter,
  onClassChange,
  sortBy,
  onSortByChange,
  stats,
}) => {
  const total = stats?.totalCount ?? 418;
  const pending = stats?.pendingCount ?? 3;
  const responded = stats?.respondedCount ?? 415;
  const photos = stats?.photosCount ?? 68;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
      {/* Top Row: Search Input + Status Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên phụ huynh, tên bé, lớp học, ..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {/* Tất cả */}
          <button
            onClick={() => onStatusTabChange('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              statusTab === 'ALL'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Tất cả ({total})
          </button>

          {/* Chưa phản hồi */}
          <button
            onClick={() => onStatusTabChange('PENDING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              statusTab === 'PENDING'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusTab === 'PENDING' ? 'bg-white' : 'bg-rose-500'}`}></span>
            <span>Chưa phản hồi ({pending})</span>
          </button>

          {/* Đã phản hồi */}
          <button
            onClick={() => onStatusTabChange('RESPONDED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              statusTab === 'RESPONDED'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Đã phản hồi ({responded})
          </button>

          {/* Có đính kèm ảnh */}
          <button
            onClick={() => onStatusTabChange('HAS_PHOTO')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              statusTab === 'HAS_PHOTO'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Có đính kèm ảnh ({photos})</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: 4 Dropdowns with labels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
        {/* Dropdown 1: Đánh giá sao */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            ĐÁNH GIÁ SAO
          </label>
          <div className="relative">
            <select
              value={ratingFilter}
              onChange={(e) => onRatingChange(Number(e.target.value))}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
            >
              <option value={0}>Tất cả số sao</option>
              <option value={5}>⭐⭐⭐⭐⭐ (5 sao)</option>
              <option value={4}>⭐⭐⭐⭐☆ (4 sao)</option>
              <option value={3}>⭐⭐⭐☆☆ (3 sao)</option>
              <option value={2}>⭐⭐☆☆☆ (2 sao)</option>
              <option value={1}>⭐☆☆☆☆ (1 sao)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Dropdown 2: Bữa ăn / Thực đơn */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            BỮA ĂN / THỰC ĐƠN
          </label>
          <div className="relative">
            <select
              value={mealFilter}
              onChange={(e) => onMealChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">Tất cả các bữa</option>
              <option value="LUNCH">Bữa trưa chính</option>
              <option value="AFTERNOON_SNACK">Gói ăn xế Năng Lượng Cao / Xế chiều</option>
              <option value="BREAKFAST">Bữa sáng</option>
              <option value="STANDARD">Suất ăn dinh dưỡng tiêu chuẩn</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Dropdown 3: Khối lớp mầm non */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            KHỐI LỚP MẦM NON
          </label>
          <div className="relative">
            <select
              value={classFilter}
              onChange={(e) => onClassChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">Tất cả các khối</option>
              <option value="Lớp Mầm 1">Lớp Mầm 1</option>
              <option value="Lớp Mầm 2">Lớp Mầm 2</option>
              <option value="Lớp Mầm 3">Lớp Mầm 3</option>
              <option value="Lớp Chồi 1">Lớp Chồi 1</option>
              <option value="Lớp Chồi 2">Lớp Chồi 2</option>
              <option value="Lớp Chồi 3">Lớp Chồi 3</option>
              <option value="Lớp Lá 1">Lớp Lá 1</option>
              <option value="Lớp Lá 2">Lớp Lá 2</option>
              <option value="Lớp Lá 3">Lớp Lá 3</option>
              <option value="Nhà Trẻ 1">Nhà Trẻ 1</option>
              <option value="Nhà Trẻ 2">Nhà Trẻ 2</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Dropdown 4: Sắp xếp theo */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SẮP XẾP THEO
          </label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
            >
              <option value="NEWEST">Mới nhất trước</option>
              <option value="OLDEST">Cũ nhất trước</option>
              <option value="RATING_HIGH">Đánh giá cao nhất</option>
              <option value="RATING_LOW">Đánh giá thấp nhất</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
