import React from 'react';
import { School, Search, Bell, ChevronDown, UtensilsCrossed } from 'lucide-react';
import { useSchoolBranding } from '../../../core/hooks/useSchoolBranding';

interface AttendanceTopNavProps {
  onSearch?: (query: string) => void;
}

export const AttendanceTopNav: React.FC<AttendanceTopNavProps> = ({ onSearch }) => {
  const schoolBranding = useSchoolBranding();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-2.5">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-100 overflow-hidden shrink-0">
            {schoolBranding.logoUrl ? (
              <img
                src={schoolBranding.logoUrl}
                alt={schoolBranding.name}
                className="w-full h-full object-cover rounded-[10px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <UtensilsCrossed className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-teal-700">Kid</span>
              <span className="text-xl font-black tracking-tight text-amber-500">Meal</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 -mt-1 tracking-wide">Dinh Dưỡng Bán Trú</p>
          </div>
        </div>

        {/* Campus / School Selector */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 transition rounded-xl border border-slate-200/80 cursor-pointer text-xs font-semibold text-slate-700 max-w-[280px]">
          <School className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="truncate" title={schoolBranding.name}>{schoolBranding.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm học sinh, lớp mầm, thực đơn món"
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Right Status & Profile */}
        <div className="flex items-center gap-4">
          {/* System Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Hệ thống: <strong>Hoạt động bình thường</strong></span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-xl transition">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                alt="Cô Mai Anh"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback avatar
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-xs font-bold text-amber-700">MA</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">Cô Mai Anh</p>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Hiệu phó Nuôi dưỡng</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
