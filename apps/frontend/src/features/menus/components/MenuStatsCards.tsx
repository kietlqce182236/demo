import React from 'react';
import {
  CalendarDays,
  CheckCircle,
  Clock,
  FileEdit,
  Flame,
  Scale,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { MenuStatistics } from '../api/weekly-menus.api';

interface MenuStatsCardsProps {
  stats: MenuStatistics | null;
  loading?: boolean;
}

export const MenuStatsCards: React.FC<MenuStatsCardsProps> = ({ stats, loading }) => {
  const cards = [
    {
      title: 'Tổng thực đơn tuần',
      value: stats?.total ?? 0,
      subText: 'Chu kỳ năm học 2026-2027',
      icon: CalendarDays,
      badge: 'Toàn trường',
      badgeColor: 'bg-slate-100 text-slate-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200/80',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Đang áp dụng (Khóa)',
      value: stats?.active ?? 0,
      subText: 'Công bố toàn trường & KDS Bếp',
      icon: CheckCircle,
      badge: 'Hiệu lực',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      bgColor: 'bg-white',
      borderColor: 'border-emerald-200/80',
      iconBg: 'bg-emerald-500 text-white shadow-sm',
    },
    {
      title: 'Chờ BGH phê duyệt',
      value: stats?.submitted ?? 0,
      subText: 'Cần Ban Giám Hiệu kiểm duyệt',
      icon: Clock,
      badge: stats?.submitted ? 'Cần duyệt gấp' : 'Hoàn tất',
      badgeColor: stats?.submitted ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-600',
      bgColor: 'bg-white',
      borderColor: stats?.submitted ? 'border-amber-300' : 'border-slate-200/80',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Bản dự thảo & Tinh chỉnh',
      value: stats?.draft ?? 0,
      subText: 'Đang soạn thảo / Đổi món',
      icon: FileEdit,
      badge: 'Đang soạn',
      badgeColor: 'bg-blue-100 text-blue-800',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200/80',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Năng lượng TB / Ngày',
      value: `${stats?.avgCalories ?? 780} Kcal`,
      subText: 'P: 14% | L: 28% | G: 58%',
      icon: Flame,
      badge: 'Chuẩn TT 28',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
      bgColor: 'bg-linear-to-br from-emerald-50/60 to-white',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-linear-to-tr from-emerald-600 to-teal-500 text-white shadow-md',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`${card.bgColor} ${card.borderColor} border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                {card.badge}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500">{card.title}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                {loading ? <span className="inline-block w-12 h-6 bg-slate-200 animate-pulse rounded"></span> : card.value}
              </h3>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">{card.subText}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
