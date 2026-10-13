import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  ChefHat,
  UtensilsCrossed,
  CalendarCheck,
  Package,
  ClipboardList,
  BarChart3,
  MessageSquareText,
  Settings,
  ChevronDown,
  PhoneCall,
  Carrot,
} from 'lucide-react';
import { useSchoolBranding } from '../../../core/hooks/useSchoolBranding';

export const EvaluationSidebar: React.FC = () => {
  const [isServiceOpen, setIsServiceOpen] = useState(true);
  const schoolBranding = useSchoolBranding();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans select-none z-30">
      {/* Brand & Logo */}
      <div>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 p-0.5 flex items-center justify-center text-teal-600 shadow-inner overflow-hidden shrink-0">
            {schoolBranding.logoUrl ? (
              <img
                src={schoolBranding.logoUrl}
                alt={schoolBranding.name}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <UtensilsCrossed className="w-5 h-5 text-teal-600 stroke-[2.5]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-teal-800">KidMeal</span>
              <span className="text-xs font-bold px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">BGH</span>
            </div>
            <p className="text-[10px] text-teal-700 font-semibold truncate mt-0.5" title={schoolBranding.name}>
              {schoolBranding.name}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 text-sm">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left font-medium">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Dashboard Tổng quan</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left font-medium">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Hồ sơ Học sinh</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left font-medium">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Quản trị Lớp học</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left font-medium">
            <ChefHat className="w-4 h-4 text-slate-400" />
            <span>Nhân sự & Bếp</span>
          </button>

          {/* Dịch vụ bán trú Collapsible */}
          <div>
            <button
              onClick={() => setIsServiceOpen(!isServiceOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left font-medium"
            >
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="w-4 h-4 text-slate-400" />
                <span>Dịch vụ bán trú</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isServiceOpen ? 'rotate-180' : ''}`} />
            </button>
            {isServiceOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                <Link to="/snack-roster" className="block py-1.5 px-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50/60 font-medium">
                  Phí ăn xế & Công nợ
                </Link>
                <Link to="/snack-roster" className="block py-1.5 px-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50/60 font-medium">
                  Gói ăn xế
                </Link>
              </div>
            )}
          </div>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left font-medium">
            <CalendarCheck className="w-4 h-4 text-slate-400" />
            <span>Phê duyệt thực đơn</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left font-medium">
            <Package className="w-4 h-4 text-slate-400" />
            <span>Kho & Dinh dưỡng</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left font-medium">
            <ClipboardList className="w-4 h-4 text-slate-400" />
            <span>Sổ kiểm thực 3 bước</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left font-medium">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>Báo cáo tài chính</span>
          </button>

          {/* ACTIVE ITEM: Ý kiến & Đánh giá */}
          <Link
            to="/parent-evaluations"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-teal-600 text-white font-bold shadow-sm shadow-teal-600/30 transition text-left"
          >
            <MessageSquareText className="w-4 h-4 text-white" />
            <span className="flex-1">Ý kiến & Đánh giá</span>
          </Link>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition text-left font-medium">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Cài đặt trường học</span>
          </button>
        </nav>
      </div>

      {/* Footer Profile & Hotline */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        <div className="px-3 py-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600 border border-slate-100">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
            <span>Hotline BGH:</span>
          </div>
          <span className="font-bold text-teal-700">1900 6826</span>
        </div>

        <div className="p-2.5 flex items-center gap-3 rounded-xl hover:bg-slate-50 transition">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80"
              alt="Nguyễn Thu Thủy"
              className="w-9 h-9 rounded-full object-cover border-2 border-teal-500/20"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-800 truncate">Nguyễn Thu Thủy</p>
            <p className="text-[11px] text-slate-400 truncate">Hiệu trưởng cơ sở</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
