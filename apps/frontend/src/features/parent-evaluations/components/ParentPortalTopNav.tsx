import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, Utensils, ShieldAlert, Coffee, CreditCard, MessageSquare, Baby } from 'lucide-react';
import { useSchoolBranding } from '../../../core/hooks/useSchoolBranding';
import { ChildProfile } from '../types';

interface ParentPortalTopNavProps {
  child?: ChildProfile;
  activeTab?: 'menu-consumption' | 'allergies' | 'snacks' | 'breakfast' | 'tuition' | 'evaluation';
}

export const ParentPortalTopNav: React.FC<ParentPortalTopNavProps> = ({ child, activeTab = 'evaluation' }) => {
  const schoolBranding = useSchoolBranding();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link to="/child-menu-consumption" className="flex items-center gap-2 hover:opacity-90 transition">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 p-0.5 flex items-center justify-center text-white shadow-sm overflow-hidden shrink-0">
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
                  <Utensils className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-teal-800 leading-none">
                  Kid<span className="text-emerald-500">Meal</span>
                </span>
                <span className="text-[10px] text-teal-700 font-semibold truncate max-w-[160px]" title={schoolBranding.name}>
                  {schoolBranding.name}
                </span>
              </div>
            </Link>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Cổng Phụ Huynh
            </span>

            {/* Child Selector Dropdown */}
            <div className="ml-3 hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full cursor-pointer transition text-xs font-semibold text-slate-700">
              <Baby className="w-4 h-4 text-teal-600" />
              <span>{child?.name ? `Bé ${child.name.split(' ').slice(-2).join(' ')}` : 'Bé Bảo Nam'} - {child?.className || 'Lớp Thỏ Trắng'} ({child?.gradeLevel || '4–5T'})</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            {/* Tab 1: Thực đơn & Sức ăn (Monitor Child's Menu and Consumption) */}
            <Link
              to="/child-menu-consumption"
              className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'menu-consumption'
                  ? 'bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50 font-semibold'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Thực đơn & Sức ăn</span>
            </Link>

            {/* Tab 2: Khai báo Dị ứng & Kiêng cữ */}
            <Link
              to="/declare-allergy"
              className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'allergies'
                  ? 'bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50 font-semibold'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Khai báo Dị ứng</span>
            </Link>
            {/* Tab 3: Mua Gói Ăn Sáng VNPAY */}
            <Link
              to="/parent-breakfast"
              className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'breakfast' || activeTab === 'snacks'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs'
                  : 'text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 font-bold border border-amber-200'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Gói Ăn Sáng (VNPAY)</span>
            </Link>


            {/* Tab 5: Đánh giá & Góp ý (Submit Meal Evaluation) */}
            <Link
              to="/submit-evaluation"
              className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'evaluation'
                  ? 'bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50 font-semibold'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Đánh giá & Góp ý</span>
            </Link>
          </nav>

          {/* Right: Notifications & Parent Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              title="Thông báo"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Parent Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 p-0.5 shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                  alt={child?.parentName || 'Chị Hoàng Yến'}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {child?.parentName || 'Chị Hoàng Yến'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {child?.parentRole || 'Mẹ bé Bảo Nam'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
