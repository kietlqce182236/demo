import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  UtensilsCrossed,
  ShieldAlert,
  Flame,
  Scale,
  Sparkles,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  FileEdit,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { weeklyMenusApi, MenuStatistics, WeeklyMenu } from '../api/weekly-menus.api';
import { MenuStatsCards } from '../components/MenuStatsCards';

export const NutritionistDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<MenuStatistics | null>(null);
  const [recentMenus, setRecentMenus] = useState<WeeklyMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      weeklyMenusApi.getStatistics(),
      weeklyMenusApi.getMenus({ status: 'ALL' }),
    ])
      .then(([statsRes, menusRes]) => {
        setStats(statsRes);
        setRecentMenus(menusRes.slice(0, 4));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Banner chào mừng & Thông điệp chuyên môn */}
      <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Cổng Chuyên môn Dinh dưỡng Mầm non
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Kiểm soát Thực đơn & Dinh dưỡng Chuẩn Bộ GD&ĐT
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-2 leading-relaxed">
            Hệ thống Rule Engine tự động giám sát năng lượng calo bán trú, cân đối tỷ lệ Đạm - Béo - Tinh bột và quét cảnh báo xung đột thực phẩm gây dị ứng cho từng trẻ.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/nutritionist/menus"
              className="px-5 py-2.5 rounded-2xl bg-[#4eed9c] hover:bg-[#43dc8e] text-emerald-950 font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Quản lý Thực đơn tuần</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/nutritionist/rules"
              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
            >
              <Scale className="w-4 h-4" />
              <span>Tiêu chuẩn & Dị ứng</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5 Thẻ Thống kê KPI */}
      <MenuStatsCards stats={stats} loading={loading} />

      {/* 2 Khối nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái 2/3: Thực đơn tuần gần nhất */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chu kỳ Thực đơn tuần gần đây</h3>
                <p className="text-xs text-slate-500">Tiến độ phê duyệt và công bố</p>
              </div>
            </div>
            <Link
              to="/nutritionist/menus"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentMenus.map((menu) => (
              <div
                key={menu.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-200 transition flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{menu.title}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      v{menu.version}.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Áp dụng: {menu.startDate?.split('T')[0]} ➔ {menu.endDate?.split('T')[0]} • Nhóm tuổi: {menu.targetAgeGroup}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Năng lượng TB</span>
                    <span className="text-xs font-black text-emerald-800">{menu.dailyAverageCalories || 780} Kcal</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      menu.status === 'ACTIVE'
                        ? 'bg-emerald-500 text-white'
                        : menu.status === 'APPROVED'
                        ? 'bg-blue-100 text-blue-800'
                        : menu.status === 'SUBMITTED_FOR_REVIEW'
                        ? 'bg-amber-100 text-amber-800'
                        : menu.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {menu.status === 'ACTIVE'
                      ? 'Đang áp dụng'
                      : menu.status === 'APPROVED'
                      ? 'Đã duyệt'
                      : menu.status === 'SUBMITTED_FOR_REVIEW'
                      ? 'Chờ duyệt'
                      : menu.status === 'REJECTED'
                      ? 'Bị từ chối'
                      : 'Bản nháp'}
                  </span>
                  <Link
                    to="/nutritionist/menus"
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-600 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột phải 1/3: Cảnh báo Dị ứng & Tác vụ nhanh */}
        <div className="space-y-6">
          {/* Hộp cảnh báo Rule Engine Dị ứng */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cảnh báo Dị ứng (Rule Engine)</h3>
                <p className="text-xs text-slate-500">Giám sát tự động theo hồ sơ trẻ</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl text-rose-800">
                <p className="font-bold flex items-center gap-1.5 text-[11px] text-rose-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  Lớp Mầm 1: 2 trẻ dị ứng Tôm / Cua
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-rose-700">
                  Món "Canh rau ngót nấu tôm" ngày Thứ 2 đã được Rule Engine gán món thay thế "Canh bí đỏ thịt băm".
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-800">
                <p className="font-bold flex items-center gap-1.5 text-[11px] text-amber-900">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Lớp Chồi 2: 1 trẻ bất dung nạp Lactose
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                  Bữa xế chiều thay sữa bò bằng sữa hạt sen organic.
                </p>
              </div>
            </div>
          </div>

          {/* Phím tắt công cụ nghiệp vụ */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tác vụ chuyên môn nhanh
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/nutritionist/menus"
                className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold transition flex flex-col items-center text-center gap-1"
              >
                <CalendarDays className="w-5 h-5 text-emerald-700" />
                <span>Lập thực đơn</span>
              </Link>
              <Link
                to="/nutritionist/rules"
                className="p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold transition flex flex-col items-center text-center gap-1"
              >
                <Scale className="w-5 h-5 text-teal-700" />
                <span>Cấu hình quy tắc</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
