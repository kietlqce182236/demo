import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users2,
  Coffee,
  FileCheck2,
  PackageOpen,
  ShieldCheck,
  CircleDollarSign,
  Settings,
  Headphones,
  MoreVertical,
  ChevronDown,
  Bell,
  UtensilsCrossed,
  Sparkles,
  Scale,
} from 'lucide-react';
import { UserProfileModal } from '../features/auth/components/UserProfileModal';
import { useAuthStore } from '../core/stores/auth.store';

export const AdminDashboardLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Danh mục menu chuẩn xác theo hình ảnh thiết kế Ban Giám Hiệu
  const navItems = [
    { label: 'Dashboard Tổng quan', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Quản trị Lớp học', path: '/classes', icon: GraduationCap },
    { label: 'Nhân sự & Bếp', path: '/staff', icon: Users2 },
    { label: 'Dịch vụ bán trú', path: '/services', icon: Coffee },
    { label: 'Phê duyệt thực đơn', path: '/menus', icon: FileCheck2 },
    { label: 'Kho & Dinh dưỡng', path: '/inventory', icon: PackageOpen },
    { label: 'Sổ kiểm thực 3 bước', path: '/food-safety', icon: ShieldCheck },
    { label: 'Báo cáo tài chính', path: '/finances', icon: CircleDollarSign },
    { label: 'Cài đặt trường học', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-slate-800">
      {/* 1. Sidebar Trái */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shadow-xs z-30">
        <div>
          {/* Header Sidebar: KidMeal BGH */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shadow-inner">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight">KidMeal BGH</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">MN Sao Mai – Cơ sở 1</p>
            </div>
          </div>

          {/* Tag Cổng Ban Giám Hiệu */}
          <div className="px-4 pt-3.5 pb-1">
            <div className="bg-teal-50/80 border border-teal-200/60 rounded-full py-1 px-3 flex items-center gap-2 text-[11px] font-bold text-teal-800">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
              <span>CỔNG BAN GIÁM HIỆU</span>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="px-3 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Nếu đang ở root '/' thì active Cài đặt trường học hoặc check startsWith
              const isActive =
                item.path === '/settings'
                  ? location.pathname === '/settings' || location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Chân Sidebar */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* Thẻ Tổng đài Dinh Dưỡng */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 leading-tight">Tổng đài Dinh Dưỡng</p>
              <p className="text-xs font-bold text-teal-800 tracking-tight">1900 6826</p>
            </div>
          </div>

          {/* Thẻ User BGH: Cô Thu Thủy - Hiệu Trưởng */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 cursor-pointer flex-1"
            >
              <div className="w-8 h-8 rounded-full bg-teal-800 text-teal-50 font-bold text-xs flex items-center justify-center shadow-inner">
                TT
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                  {user?.fullName || 'Cô Thu Thủy'}
                </p>
                <p className="text-[10px] text-slate-400">Hiệu Trưởng</p>
              </div>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              title="Xem & Cập nhật hồ sơ cá nhân"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between z-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <UtensilsCrossed className="w-4 h-4 text-teal-600" />
            <span className="hover:text-slate-800 cursor-pointer">Bán trú KidMeal</span>
            <span>›</span>
            <span className="text-slate-900 font-semibold">Cài đặt hệ thống & Quản trị tài khoản</span>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            {/* Học kỳ Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition">
              <span>📅 Năm học 2024 - 2025 • Học kỳ I</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
            </div>

            {/* User Profile Pill */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition"
            >
              <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center">
                TT
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {user?.fullName || 'Nguyễn Thu Thủy'}
                </span>
                <span className="text-[10px] text-teal-700 font-medium block">
                  BGH Mầm non
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Scrollable Page Container */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

      {/* Modal Hồ sơ cá nhân (Dành cho tất cả các role) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
