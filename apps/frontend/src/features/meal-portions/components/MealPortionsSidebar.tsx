import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ChefHat,
  UtensilsCrossed,
  CalendarCheck,
  Package,
  ClipboardCheck,
  BarChart3,
  Settings,
  Headphones,
  LogOut,
} from 'lucide-react';

export const MealPortionsSidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard Tổng quan', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Hồ sơ Học sinh', icon: Users, path: '/children' },
    { name: 'Quản trị Lớp học', icon: GraduationCap, path: '/classes' },
    { name: 'Nhân sự & Bếp', icon: ChefHat, path: '/staff' },
    { name: 'Dịch vụ bán trú', icon: UtensilsCrossed, path: '/snack-roster' },
    { name: 'Phê duyệt thực đơn', icon: CalendarCheck, path: '/meal-portions', active: true },
    { name: 'Kho & Định dưỡng', icon: Package, path: '/inventory' },
    { name: 'Sổ kiểm thực 3 bước', icon: ClipboardCheck, path: '/food-safety' },
    { name: 'Báo cáo tài chính', icon: BarChart3, path: '/financial-reports' },
    { name: 'Cài đặt trường học', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sm select-none">
      {/* Top Brand Logo */}
      <div>
        <div className="p-4 pb-3 flex items-center gap-2.5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <UtensilsCrossed className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-800">
                KidMeal
              </span>
              <span className="bg-teal-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                BGH
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Bán trú mầm non thông minh
            </p>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active || location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/20 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Cards: Hotline & Profile */}
      <div className="p-3 space-y-2 border-t border-slate-100 bg-slate-50/50">
        {/* Hotline Support Card */}
        <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Hotline Dinh dưỡng</p>
              <p className="text-xs font-bold text-slate-800 tracking-tight">1900 6826</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* User Account Card */}
        <div className="p-2 rounded-xl flex items-center justify-between hover:bg-slate-100/70 transition">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-teal-500 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-xs text-teal-800">
                NT
              </div>
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                Nguyễn Thu Thủy
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Hiệu trưởng • BGH
              </p>
            </div>
          </div>
          <button
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
            title="Đăng xuất / Chuyển quyền"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
