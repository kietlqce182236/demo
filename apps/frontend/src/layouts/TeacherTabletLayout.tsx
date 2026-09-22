import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ClipboardCheck, UtensilsCrossed, AlertTriangle } from 'lucide-react';

export const TeacherTabletLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-slate-100 touch-pan-y select-none">
      {/* Tablet Topbar - Cỡ chữ to, nút bấm tối thiểu 48px */}
      <header className="h-18 bg-emerald-700 text-white px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Lớp Chồi 1 – Ghi nhận Bữa ăn</h1>
            <p className="text-xs text-emerald-200">Cô Nguyễn Lan Anh phụ trách</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/attendance"
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
              location.pathname === '/attendance' ? 'bg-white text-emerald-800' : 'bg-emerald-800/60 text-white'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            Điểm danh suất ăn
          </Link>
          <Link
            to="/attendance/record"
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
              location.pathname === '/attendance/record' ? 'bg-white text-emerald-800' : 'bg-emerald-800/60 text-white'
            }`}
          >
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            Trạng thái ăn & Dị ứng
          </Link>
        </div>
      </header>

      {/* Main Tablet Touch Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};
