import React from 'react';
import { Search, Bell, MessageSquare, User, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SnackRosterTopNavProps {
  onSearchChange?: (val: string) => void;
  searchValue?: string;
}

export const SnackRosterTopNav: React.FC<SnackRosterTopNavProps> = ({
  onSearchChange,
  searchValue = '',
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Header Row */}
      <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-sm">
            <svg
              className="w-6 h-6 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12a10 10 0 0 1 10-10z" />
              <path d="M12 6c-3.3 0-6 2.7-6 6a6 6 0 0 0 6 6c3.3 0 6-2.7 6-6" />
              <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                NutriKid
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                CATERING PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              Hệ Thống Quản Lý Dinh Dưỡng Mầm Non
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm học sinh, lớp, thực đơn món xế..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs pl-11 pr-4 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Right Status, Alerts & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notification Button */}
          <button
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
            title="Thông báo"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Messages Button */}
          <button
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
            title="Tin nhắn bếp"
          >
            <MessageSquare className="w-5 h-5 text-slate-700" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                Vũ Ngọc Minh
              </p>
              <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full mt-0.5">
                Nhân viên cấp dưỡng
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-slate-100">
              <User className="w-5 h-5 text-slate-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-t border-slate-100 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center gap-8 text-xs font-semibold text-slate-600 overflow-x-auto scrollbar-none">
          <Link
            to="/dashboard"
            className="py-3 hover:text-emerald-700 transition whitespace-nowrap"
          >
            Tổng quan
          </Link>
          <Link
            to="/menus"
            className="py-3 hover:text-emerald-700 transition whitespace-nowrap"
          >
            Kế hoạch suất ăn
          </Link>
          <Link
            to="/snack-roster"
            className="py-3 text-emerald-700 border-b-2 border-emerald-600 font-bold whitespace-nowrap"
          >
            Học sinh ăn xế
          </Link>
          <Link
            to="/evaluation"
            className="py-3 hover:text-emerald-700 transition whitespace-nowrap"
          >
            Thực đơn ngày
          </Link>
          <Link
            to="/kds"
            className="py-3 hover:text-emerald-700 transition whitespace-nowrap"
          >
            Bếp & Chế biến
          </Link>
          <Link
            to="/attendance"
            className="py-3 hover:text-emerald-700 transition whitespace-nowrap"
          >
            Kiểm thực
          </Link>
          <Link
            to="/history"
            className="py-3 hover:text-emerald-700 transition whitespace-nowrap"
          >
            Báo cáo
          </Link>
        </div>
      </div>
    </header>
  );
};
