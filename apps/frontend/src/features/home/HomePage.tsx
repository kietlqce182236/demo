import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ChefHat,
  Tablet,
  LayoutDashboard,
  ShieldCheck,
  Heart,
  Activity,
  CreditCard,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Award,
  Calendar,
  Lock,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Zap,
  Check,
  Building2,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  Apple
} from 'lucide-react';
import { useAuthStore } from '../../core/stores/auth.store';
import { useSchoolBranding } from '../../core/hooks/useSchoolBranding';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const schoolBranding = useSchoolBranding();
  const [activeTab, setActiveTab] = useState<'principal' | 'nutritionist' | 'teacher' | 'kitchen' | 'parent'>('nutritionist');

  const roles = user?.roles || [];
  const getMyPortalPath = (): string => {
    if (roles.includes('KITCHEN_STAFF') || roles.includes('KITCHEN_MANAGER')) return '/kitchen';
    if (roles.includes('NUTRITIONIST')) return '/nutritionist/menus';
    if (roles.includes('TEACHER')) return '/tablet';
    if (roles.includes('PRINCIPAL') || roles.includes('SUPER_ADMIN') || roles.includes('SCHOOL_MANAGEMENT')) return '/dashboard';
    if (roles.includes('PARENT')) return '/child-menu-consumption';
    return '/dashboard';
  };

  const roleLabel = (roles.includes('KITCHEN_STAFF') || roles.includes('KITCHEN_MANAGER'))
    ? 'Nhân Viên Bếp'
    : roles.includes('NUTRITIONIST')
    ? 'Chuyên Gia Dinh Dưỡng'
    : roles.includes('PRINCIPAL') || roles.includes('SUPER_ADMIN')
    ? 'Ban Giám Hiệu'
    : roles.includes('TEACHER')
    ? 'Giáo Viên Bán Trú'
    : roles.includes('PARENT')
    ? 'Phụ Huynh'
    : 'Nhân Sự';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          1. NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 p-0.5 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
              {schoolBranding.logoUrl ? (
                <img
                  src={schoolBranding.logoUrl}
                  alt={schoolBranding.name}
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <UtensilsCrossed className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-600 bg-clip-text text-transparent">
                  KidMeal
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  NutriBud
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-700 truncate max-w-[280px]" title={schoolBranding.name}>
                {schoolBranding.name}
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#portals" className="hover:text-emerald-700 transition">5 Phân Hệ</a>
            <a href="#standards" className="hover:text-emerald-700 transition">Chuẩn BYT & BGDĐT</a>
            <a href="#features" className="hover:text-emerald-700 transition">Tính Năng Nổi Bật</a>
            <a href="#workflow" className="hover:text-emerald-700 transition">Quy Trình Khép Kín</a>
            <a href="#contact" className="hover:text-emerald-700 transition">Liên Hệ</a>
          </nav>

          {/* User Auth Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900">{user?.fullName}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {roleLabel}
                  </span>
                </div>
                <Link
                  to={getMyPortalPath()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Vào Cổng Của Bạn</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Đăng xuất"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2.5 rounded-xl text-slate-700 hover:text-emerald-700 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition group"
                >
                  <span>Dùng Thử Hệ Thống</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-emerald-50/60 via-teal-50/30 to-slate-50">
        {/* Decorative background blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-amber-200/30 rounded-full blur-2xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chuyển Đổi Số Dinh Dưỡng Mầm Non Chuẩn Quốc Gia</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Quản Lý Dinh Dưỡng & Suất Ăn{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Khoa Học Cho Trẻ Mầm Non
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
              Nền tảng hợp nhất số hóa quy trình thực đơn chuẩn{' '}
              <strong className="text-slate-900 font-semibold">Thông tư 28/2016/TT-BGDĐT</strong>,
              kiểm thực 3 bước & lưu mẫu 24h chuẩn{' '}
              <strong className="text-slate-900 font-semibold">Quyết định 1246/QĐ-BYT</strong>,
              theo dõi tăng trưởng <strong className="text-slate-900 font-semibold">WHO Z-Score</strong> và
              thanh toán ăn xế <strong className="text-slate-900 font-semibold">VNPAY</strong>.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? getMyPortalPath() : '/login'}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center gap-2.5 transition transform hover:-translate-y-0.5"
              >
                <span>{isAuthenticated ? 'Vào Bàn Làm Việc Của Bạn' : 'Trải Nghiệm Hệ Thống Ngay'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#portals"
                className="px-7 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm sm:text-base border border-slate-200 shadow-sm transition"
              >
                Khám Phá 5 Phân Hệ
              </a>
            </div>

            {/* Quick Stats Highlights */}
            <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="text-2xl sm:text-3xl font-black text-emerald-700">100%</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Chuẩn TT 28/BGDĐT</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="text-2xl sm:text-3xl font-black text-teal-700">24 Giờ</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Lưu Mẫu Chuẩn BYT</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="text-2xl sm:text-3xl font-black text-amber-600">&lt; 100ms</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Báo Suất Bếp Socket.IO</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="text-2xl sm:text-3xl font-black text-sky-700">5 Cổng</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Phân Quyền Chuyên Biệt</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. 5 CHUYÊN PHÂN HỆ (ROLE-BASED PORTALS SHOWCASE)
      ───────────────────────────────────────────────────────────── */}
      <section id="portals" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Kiến Trúc Đa Phân Hệ
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              5 Cổng Tác Nghiệp Dành Cho Từng Bộ Phận
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              Mỗi vai trò trong nhà trường đều sở hữu một không gian làm việc chuyên biệt, tinh gọn và tối ưu năng suất.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-4xl mx-auto">
            <button
              onClick={() => setActiveTab('principal')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'principal'
                  ? 'bg-white text-teal-800 shadow-md border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-600" />
              <span>1. Ban Giám Hiệu</span>
            </button>

            <button
              onClick={() => setActiveTab('nutritionist')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'nutritionist'
                  ? 'bg-white text-emerald-800 shadow-md border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
              <span>2. Chuyên Gia Dinh Dưỡng</span>
            </button>

            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'teacher'
                  ? 'bg-white text-blue-800 shadow-md border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tablet className="w-4 h-4 text-blue-600" />
              <span>3. Giáo Viên Bán Trú</span>
            </button>

            <button
              onClick={() => setActiveTab('kitchen')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'kitchen'
                  ? 'bg-white text-amber-800 shadow-md border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChefHat className="w-4 h-4 text-amber-600" />
              <span>4. Bếp Ăn (KDS)</span>
            </button>

            <button
              onClick={() => setActiveTab('parent')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'parent'
                  ? 'bg-white text-purple-800 shadow-md border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="w-4 h-4 text-purple-600" />
              <span>5. Phụ Huynh Học Sinh</span>
            </button>
          </div>

          {/* Active Tab Content Card */}
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-5xl mx-auto">
            {activeTab === 'principal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full">
                    <Building2 className="w-3.5 h-3.5" />
                    Cổng Ban Giám Hiệu & Quản Trị Trường
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Phê Duyệt Thực Đơn & Điều Hành Bán Trú Toàn Diện
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Giúp Hiệu trưởng nắm bắt tức thời toàn bộ hoạt động dinh dưỡng trong trường: từ việc duyệt thực đơn theo tuần, giám sát doanh thu tiền ăn xế, kiểm tra sổ kiểm thực 3 bước đến quản lý học sinh & tài khoản nhân sự.
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      Phê duyệt hoặc từ chối thực đơn tuần kèm lý do trực quan
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      Theo dõi tiến độ thanh toán dịch vụ ăn xế 17h & gửi thông báo nhắc nợ
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      Kiểm soát nhật ký hệ thống (Audit Logs) và danh sách phụ huynh, học sinh
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition"
                    >
                      <span>Trải nghiệm Cổng Hiệu Trưởng</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">Dashboard BGH {schoolBranding.name}</span>
                    <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">Trực tuyến</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                      <div className="text-xl font-black text-teal-700">98.5%</div>
                      <div className="text-[11px] text-slate-500 font-medium">Tỷ lệ ăn bán trú</div>
                    </div>
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <div className="text-xl font-black text-emerald-700">Đã Duyệt</div>
                      <div className="text-[11px] text-slate-500 font-medium">Thực đơn Tuần 42</div>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Doanh thu dịch vụ ăn xế tháng</span>
                      <span className="text-emerald-600 font-black">18.450.000 đ</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[82%]"></div>
                    </div>
                    <div className="text-[10px] text-slate-400">Đã thu 82% qua cổng thanh toán VNPAY</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'nutritionist' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    Cổng Chuyên Gia Dinh Dưỡng (NutriKid)
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Lên Thực Đơn Thông Minh & Rule Engine Cân Đối Calo
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Công cụ đắc lực cho nhân viên y tế và chuyên gia dinh dưỡng: Tự động tính toán tỷ lệ Đạm - Béo - Đường (P:L:G), kiểm tra xung đột dị ứng từng bé và vẽ biểu đồ tăng trưởng WHO LMS Z-score.
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Tự động tính năng lượng calo & tỷ lệ P:L:G chuẩn Thông tư 28
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Phát hiện và cảnh báo dị ứng chéo (Sữa, Trứng, Hải sản, Đậu phộng...)
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Theo dõi cân đo, tính WAZ, HAZ, BAZ tự động biểu diễn biểu đồ WHO
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                    >
                      <span>Vào Cổng Chuyên Gia Dinh Dưỡng</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">Phân Tích Cân Đối P:L:G</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Đạt Chuẩn TT28</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700">Protein (Đạm): 15.2%</span>
                        <span className="text-emerald-600">Chuẩn: 14 - 16%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[15.2%]"></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700">Lipid (Chất béo): 26.4%</span>
                        <span className="text-emerald-600">Chuẩn: 20 - 30%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[26.4%]"></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700">Glucid (Chất bột đường): 58.4%</span>
                        <span className="text-emerald-600">Chuẩn: 55 - 65%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-[58.4%]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Năng lượng đạt 735 kcal/ngày (đáp ứng 55% nhu cầu khuyến nghị mẫu giáo).</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'teacher' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                    <Tablet className="w-3.5 h-3.5" />
                    Cổng Tablet Giáo Viên Lớp Học
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Điểm Danh Suất Ăn & Đánh Giá Tiêu Thụ Tức Thì
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Thiết kế tối ưu cho màn hình Tablet cầm tay của cô giáo: Điểm danh trẻ ăn sáng, trưa, xế chỉ với 1 chạm. Đánh giá trẻ ăn hết suất hay cần điều chỉnh, đồng bộ ngay lập tức tới nhà bếp.
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      Điểm danh sĩ số lớp nhanh, tự động trừ phần ăn bé nghỉ
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      Phù hợp thao tác cảm ứng lớn, không giật lag
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      Nhắc nhở ngay trẻ có ghi chú dị ứng trước giờ phát khay ăn
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                    >
                      <span>Trải nghiệm Cổng Tablet Giáo Viên</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">Lớp Mầm 1 (30 Trẻ)</span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Điểm Danh Bữa Trưa</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">1</div>
                        <div>
                          <div className="font-bold text-slate-800">Nguyễn Bảo An</div>
                          <div className="text-[10px] text-slate-400">Có mặt • Ăn hết suất</div>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">Đã Ăn</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-rose-50/60 rounded-xl border border-rose-200 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold">2</div>
                        <div>
                          <div className="font-bold text-slate-800">Trần Gia Hưng</div>
                          <div className="text-[10px] text-rose-600 font-semibold">⚠️ Dị ứng Hải sản & Đậu phộng</div>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md font-bold text-[10px]">Suất Riêng</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kitchen' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                    <ChefHat className="w-3.5 h-3.5" />
                    Cổng Màn Hình Bếp (Kitchen Display System)
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Định Lượng Realtime, Kiểm Thực 3 Bước & Lưu Mẫu 24h
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Hệ thống KDS thông minh tại nhà bếp kết nối trực tiếp với giáo viên qua WebSocket: Tự động tổng hợp số suất ăn theo biến động điểm danh, thực hiện biên bản kiểm thực 3 bước và đếm ngược hủy mẫu 24 giờ.
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      Cập nhật tổng suất ăn tức thì ngay khi cô giáo điểm danh
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      Quy trình kiểm thực 3 bước theo Quyết định 1246/QĐ-BYT
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      Bộ đếm ngược thời gian lưu mẫu 24h tại tủ lạnh 0-5°C
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to={isAuthenticated ? '/kitchen' : '/login'}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
                    >
                      <span>Vào Màn Hình Bếp KDS</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-bold text-slate-200">KDS Trực Tiếp Bếp Chính</span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Bữa Trưa 11:00
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                      <div className="text-2xl font-black text-amber-400">328</div>
                      <div className="text-[11px] text-slate-400 font-semibold">Suất Tiêu Chuẩn</div>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                      <div className="text-2xl font-black text-rose-400">12</div>
                      <div className="text-[11px] text-slate-400 font-semibold">Suất Dị Ứng Riêng</div>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                    <span>Lưu mẫu 24h: Canh bí đỏ thịt bằm</span>
                    <span className="font-mono font-bold text-emerald-400">Còn 18h 42m</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'parent' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                    <Heart className="w-3.5 h-3.5" />
                    Cổng Phụ Huynh Học Sinh
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Minh Bạch Bữa Ăn, Khai Báo Dị Ứng & Đóng Phí VNPAY
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Cầu nối vững chắc giữa gia đình và nhà trường: Ba mẹ dễ dàng xem thực đơn tuần, theo dõi con đã ăn gì ở lớp, khai báo các thực phẩm dị ứng và thanh toán tiền ăn xế 17h trực tuyến an toàn.
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      Xem thực đơn từng ngày & ghi chú tiêu thụ bữa ăn của con
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      Khai báo thực phẩm con bị dị ứng để nhà trường bố trí suất ăn riêng
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      Đăng ký & quét mã VNPAY thanh toán tiền ăn xế chỉ trong 30 giây
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition"
                    >
                      <span>Trải nghiệm Cổng Phụ Huynh</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">Sổ Bán Trú Bé Minh Khang</span>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Lớp Chồi 2</span>
                  </div>
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2 text-xs">
                    <div className="font-bold text-purple-900">Bữa trưa hôm nay:</div>
                    <div className="text-slate-700">• Cơm trắng dẻo</div>
                    <div className="text-slate-700">• Thịt heo kho trứng cút</div>
                    <div className="text-slate-700">• Canh cải bó xôi nấu tôm</div>
                    <div className="pt-1 text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Bé ăn hết suất, uống đủ nước.
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700">Dịch vụ ăn xế 17h</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Đã thanh toán VNPAY
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. TIÊU CHUẨN QUY ĐỊNH BGDĐT & BYT
      ───────────────────────────────────────────────────────────── */}
      <section id="standards" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold text-teal-800 uppercase tracking-widest bg-teal-100/70 px-3 py-1 rounded-full border border-teal-300">
              Quy Chuẩn Chuyên Môn
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tuân Thủ Tuyệt Đối Tiêu Chuẩn Quốc Gia
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              KidMeal được lập trình sẵn các công thức và quy trình kiểm duyệt khắt khe theo đúng các văn bản quy phạm pháp luật hiện hành.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Standard 1 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Thông Tư 28/2016/TT-BGDĐT
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Đảm bảo năng lượng cung cấp tại trường mầm non đạt 50-60% nhu cầu khuyến nghị cả ngày. Tỷ lệ cơ cấu năng lượng tối ưu: Đạm (14-16%), Béo (20-30%), Bột đường (55-65%).
              </p>
            </div>

            {/* Standard 2 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Quyết Định 1246/QĐ-BYT
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thực hiện quy trình kiểm thực 3 bước nghiêm ngặt: Kiểm tra trước khi chế biến, trong khi chế biến và trước khi ăn. Tủ lưu mẫu thực phẩm chuẩn 24h ở nhiệt độ 0-5°C có niêm phong.
              </p>
            </div>

            {/* Standard 3 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Chuẩn Tăng Trưởng WHO 2006
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tính toán chỉ số nhân trắc học LMS Z-Score: Cân nặng theo tuổi (WAZ), Chiều cao theo tuổi (HAZ) và BMI theo tuổi (BAZ). Phát hiện sớm suy dinh dưỡng, thấp còi, thừa cân.
              </p>
            </div>

            {/* Standard 4 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Cổng Thanh Toán VNPAY
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tích hợp cổng thanh toán trực tuyến bảo mật cao, ký điện tử chuẩn HMAC-SHA512. Xử lý IPN Webhook tức thì, minh bạch lịch sử và tạo mã QR thanh toán ăn xế thuận tiện cho phụ huynh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. QUY TRÌNH VẬN HÀNH KHÉP KÍN 6 BƯỚC
      ───────────────────────────────────────────────────────────── */}
      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Quy Trình Hoạt Động
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Vòng Lặp Vận Hành Bán Trú Tự Động Hóa
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              Từ khâu lập kế hoạch đến khi trẻ thưởng thức và phụ huynh phản hồi — mọi thao tác đều được số hóa trơn tru.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 relative group hover:border-emerald-400 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mx-auto">
                01
              </div>
              <h4 className="text-xs font-black text-slate-900">Lên Thực Đơn</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Chuyên gia lập thực đơn tuần, tự động kiểm tra P:L:G & dị ứng
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 relative group hover:border-emerald-400 transition">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center mx-auto">
                02
              </div>
              <h4 className="text-xs font-black text-slate-900">BGH Phê Duyệt</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Hiệu trưởng duyệt số hóa 1-chạm & công khai thực đơn tới trường
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 relative group hover:border-emerald-400 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center mx-auto">
                03
              </div>
              <h4 className="text-xs font-black text-slate-900">Cô Điểm Danh</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Giáo viên điểm danh bán trú trên Tablet ngay đầu buổi sáng
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 relative group hover:border-emerald-400 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center mx-auto">
                04
              </div>
              <h4 className="text-xs font-black text-slate-900">Bếp Nhận Suất</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Màn hình KDS nhận định lượng suất ăn theo sĩ số thực qua WebSocket
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 relative group hover:border-emerald-400 transition">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 font-black text-sm flex items-center justify-center mx-auto">
                05
              </div>
              <h4 className="text-xs font-black text-slate-900">Kiểm Thực 3 Bước</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Nhập kho, nấu chín, lưu mẫu thức ăn 24 giờ đúng chuẩn BYT
              </p>
            </div>

            {/* Step 6 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 relative group hover:border-emerald-400 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center mx-auto">
                06
              </div>
              <h4 className="text-xs font-black text-slate-900">Ba Mẹ Theo Dõi</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Xem lượng ăn con, đóng tiền ăn xế VNPAY và gửi đánh giá bữa ăn
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. BANNER DÙNG THỬ & ĐĂNG NHẬP NHANH
      ───────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
            <Zap className="w-3.5 h-3.5" />
            Trải Nghiệm Trực Quan Không Cần Cài Đặt
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Sẵn Sàng Nâng Tầm Chất Lượng Bữa Ăn Mầm Non?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Hệ thống KidMeal hỗ trợ đa trường mầm non (Multi-tenant) với cơ sở dữ liệu phân lập an toàn, hoạt động ổn định trên cả máy tính, máy tính bảng và điện thoại.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition transform hover:-translate-y-0.5"
            >
              Đăng Nhập Vào Hệ Thống
            </Link>
            <a
              href="#contact"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition"
            >
              Tư Vấn Triển Khai Cho Trường
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-slate-950 text-slate-400 text-xs py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <span className="text-xl font-black text-white">KidMeal</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Hệ sinh thái chuyển đổi số quản lý dinh dưỡng, an toàn thực phẩm và thanh toán ăn xế cho các trường mầm non tại Việt Nam.
              </p>
              <div className="text-[11px] text-slate-500">
                Bản quyền © 2026 KidMeal / NutriBud. Tất cả các quyền được bảo lưu.
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-200">5 Phân Hệ Tác Nghiệp</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/login" className="hover:text-emerald-400 transition">Cổng Ban Giám Hiệu</Link></li>
                <li><Link to="/login" className="hover:text-emerald-400 transition">Cổng Chuyên Gia Dinh Dưỡng</Link></li>
                <li><Link to="/login" className="hover:text-emerald-400 transition">Cổng Tablet Giáo Viên Bán Trú</Link></li>
                <li><Link to="/login" className="hover:text-emerald-400 transition">Cổng Màn Hình Bếp (KDS)</Link></li>
                <li><Link to="/login" className="hover:text-emerald-400 transition">Cổng Phụ Huynh & Học Sinh</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-200">Tiêu Chuẩn Tuân Thủ</h4>
              <ul className="space-y-2 text-xs">
                <li>• Thông tư 28/2016/TT-BGDĐT Dinh dưỡng mầm non</li>
                <li>• Quyết định 1246/QĐ-BYT Kiểm thực 3 bước & Lưu mẫu 24h</li>
                <li>• Chuẩn tăng trưởng nhân trắc học WHO 2006</li>
                <li>• Cổng thanh toán trực tuyến an toàn VNPAY Sandbox</li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-200">Hỗ Trợ Kỹ Thuật & Trường Học</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hotline: 1900 6868 (8:00 - 18:00)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Email: support@kidmeal.edu.vn</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Khu Công Nghệ Cao, TP. Hồ Chí Minh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
