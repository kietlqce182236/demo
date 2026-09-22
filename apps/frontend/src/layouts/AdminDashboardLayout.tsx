import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Utensils, 
  Users, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  CreditCard, 
  ClipboardCheck,
  LogOut,
  School
} from 'lucide-react';

export const AdminDashboardLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Thực đơn & Dinh dưỡng', path: '/menus', icon: Calendar },
    { label: 'Hồ sơ trẻ & Dị ứng', path: '/children', icon: Users },
    { label: 'Điểm danh bữa ăn', path: '/attendance', icon: ClipboardCheck },
    { label: 'Theo dõi thể lực WHO', path: '/growth', icon: TrendingUp },
    { label: 'An toàn thực phẩm', path: '/food-safety', icon: ShieldCheck },
    { label: 'Dịch vụ & Học phí', path: '/payments', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="bg-brand-500 p-2 rounded-lg text-slate-950 font-bold">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">KidsNutriJournal</h1>
            <p className="text-xs text-brand-500">Mầm non Bán trú</p>
          </div>
        </div>

        {/* Tenant Switcher / School Info */}
        <div className="px-4 py-3 bg-slate-800/50 m-3 rounded-lg flex items-center gap-2 border border-slate-700">
          <School className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-200 truncate">Trường MN Hoa Mai Đỏ</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
              DD
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Chuyên viên DD</p>
              <p className="text-[10px] text-slate-400">Ban Giám Hiệu</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-800 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-bold text-slate-800">
            Hệ thống Quản lý Dinh dưỡng Bán trú
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full border border-brand-200 font-medium">
              Năm học 2025 - 2026
            </span>
          </div>
        </header>

        {/* Page Container */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
