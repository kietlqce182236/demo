import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { UtensilsCrossed, Calendar, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../core/stores/auth.store';
import { useSchoolBranding } from '../core/hooks/useSchoolBranding';

export const TeacherTabletLayout: React.FC = () => {
  const { user } = useAuthStore();
  const schoolBranding = useSchoolBranding();
  const isPrincipal = user?.roles?.includes('PRINCIPAL') || user?.roles?.includes('SUPER_ADMIN');

  const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 touch-pan-y select-none">
      {/* Tablet Topbar */}
      <header className="h-16 md:h-18 bg-emerald-700 text-white px-4 md:px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 p-0.5 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
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
              <UtensilsCrossed className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-tight">
                Cổng Tablet Giáo Viên
              </h1>
              <span className="text-[10px] bg-emerald-850/80 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-emerald-200 border border-emerald-500/40 truncate max-w-[200px]" title={schoolBranding.name}>
                {schoolBranding.name}
              </span>
            </div>
            <p className="text-xs text-emerald-200 font-medium">
              {user?.fullName ? `Giáo viên: ${user.fullName}` : 'Giáo viên phụ trách'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-100 border border-emerald-600/50">
            <Calendar className="w-4 h-4 text-emerald-300" />
            <span className="capitalize">{todayFormatted}</span>
          </div>

          {isPrincipal && (
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-900 text-white flex items-center gap-1.5 border border-emerald-600/60 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Cổng BGH</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Tablet Touch Content Area */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

