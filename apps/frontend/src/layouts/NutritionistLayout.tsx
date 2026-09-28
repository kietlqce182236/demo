import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  User,
  Home,
  CheckCircle2,
  LogOut,
  Settings,
  Sparkles,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { useAuthStore } from '../core/stores/auth.store';
import { UserProfileModal } from '../features/auth/components/UserProfileModal';

export const NutritionistLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // 10 Tabs ngang chuẩn xác theo ảnh thiết kế NutriKid
  const navTabs = [
    { label: 'Tổng quan', path: '/nutritionist/dashboard' },
    { label: 'Học sinh', path: '/nutritionist/children' },
    { label: 'Dị ứng', path: '/nutritionist/allergens' },
    { label: 'Nguyên liệu', path: '/nutritionist/foods' },
    { label: 'Món ăn & Công thức', path: '/nutritionist/dishes' },
    { label: 'Quy tắc dinh dưỡng', path: '/nutritionist/rules' },
    { label: 'Thực đơn', path: '/nutritionist/menus' },
    { label: 'Kiểm thực', path: '/nutritionist/food-safety' },
    { label: 'Tăng trưởng', path: '/nutritionist/growth' },
    { label: 'Báo cáo', path: '/nutritionist/reports' },
  ];

  // Xác định tiêu đề breadcrumb theo URL hiện tại
  const getBreadcrumbTitle = () => {
    const current = navTabs.find((t) => location.pathname.startsWith(t.path));
    if (current) return current.label;
    if (location.pathname.includes('/menus')) return 'Quản lý thực đơn tuần';
    if (location.pathname.includes('/rules')) return 'Quy chuẩn dinh dưỡng & Dị ứng';
    return 'Cổng Chuyên gia Dinh dưỡng';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* ─── 1. TOPBAR HEADER CHUẨN XÁC 100% THEO HÌNH ẢNH NUTRIKID ─── */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hàng 1: Logo NutriKid, Search Bar trung tâm, Thông báo & Profile BS. Hoàng Mai Trang */}
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo bên trái: Khung xanh rêu bo tròn + Tên NutriKid + Badge BẢN CHUẨN */}
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/nutritionist/menus" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-2xl bg-[#0f382c] border border-emerald-800 flex items-center justify-center text-emerald-400 shadow-md group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 fill-emerald-300" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight">
                    NutriKid <span className="text-slate-500 font-medium text-xs sm:text-sm">- Dinh dưỡng Mầm non</span>
                  </span>
                  <span className="bg-[#4eed9c]/25 border border-emerald-500/30 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    BẢN CHUẨN
                  </span>
                </div>
              </Link>
            </div>

            {/* Ô tìm kiếm ở trung tâm: Bo tròn nền #f1f5f9 */}
            <div className="flex-1 max-w-xl mx-2 hidden md:block">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh, thực đơn, thực phẩm..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full bg-[#f1f5f9] hover:bg-[#ebf0f6] focus:bg-white text-slate-800 placeholder-slate-400 text-xs sm:text-sm pl-10 pr-4 py-2 rounded-2xl border border-transparent focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Bên phải: Chuông thông báo, Tin nhắn, Profile Chuyên gia Dinh dưỡng */}
            <div className="flex items-center gap-3">
              {/* Icon chuông thông báo (Bell) có chấm đỏ */}
              <button
                title="Thông báo cảnh báo dinh dưỡng & duyệt thực đơn"
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <Bell className="w-5 h-5" />
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white absolute top-1.5 right-1.5 animate-pulse"></span>
              </button>

              {/* Icon tin nhắn chat (MessageSquare) */}
              <button
                title="Tin nhắn & Trao đổi với Bếp / BGH"
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition hidden sm:block"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1"></div>

              {/* Profile User: BS. Hoàng Mai Trang - Chuyên viên dinh dưỡng */}
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100/80 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-[#0a3526] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-emerald-500/20">
                    <User className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {user?.fullName || 'BS. Hoàng Mai Trang'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Chuyên viên dinh dưỡng</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu Cá nhân */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-xs font-bold text-slate-900">{user?.fullName || 'BS. Hoàng Mai Trang'}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email || 'dinhduong@hoamai.edu.vn'}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Role: NUTRITIONIST
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Thông tin cá nhân & Bảo mật (2FA)
                    </button>

                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất hệ thống
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hàng 2: Thanh Tab Bar ngang (Horizontal Tabs) */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-100">
            {navTabs.map((tab) => {
              // Active nếu URL khớp hoặc startsWith
              const isActive =
                tab.path === '/nutritionist/menus'
                  ? location.pathname.startsWith('/nutritionist/menus') || location.pathname === '/nutritionist'
                  : location.pathname.startsWith(tab.path);

              return (
                <Link
                  key={tab.label}
                  to={tab.path}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#4eed9c] text-emerald-950 font-bold shadow-xs hover:bg-[#45dc90]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Hàng 3: Dải phụ (Subbar / Breadcrumb) & Huy hiệu Chuẩn VN-RDA 2024 */}
        <div className="bg-[#f8fafc] border-t border-slate-200/60 py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
            {/* Breadcrumb bên trái */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Link to="/nutritionist/menus" className="hover:text-emerald-700 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Trang chủ</span>
              </Link>
              <span>›</span>
              <span className="text-slate-500">Dinh dưỡng Mầm non</span>
              <span>›</span>
              <span className="text-slate-900 font-bold">{getBreadcrumbTitle()}</span>
            </div>

            {/* Badge bên phải: Chuẩn VN-RDA 2024 (Viện Dinh Dưỡng Quốc Gia) */}
            <div className="flex items-center gap-1.5 bg-[#4eed9c]/20 border border-emerald-500/40 text-emerald-900 font-bold text-xs px-3.5 py-1 rounded-full shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chuẩn VN-RDA 2024 (Viện Dinh Dưỡng Quốc Gia)</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── 2. VÙNG NỘI DUNG CHÍNH (RENDER CÁC TRANG CON CỦA DINH DƯỠNG) ─── */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      )}
    </div>
  );
};
