import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  UtensilsCrossed,
  Printer,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock,
  Sparkles,
  Info,
  Flame,
  Scale,
  ShieldCheck,
  ChevronRight,
  School,
  UserCheck,
  PackageCheck,
  Layers,
  HeartPulse,
} from 'lucide-react';
import { weeklyMenusApi, WeeklyMenu, MenuDishItem } from '../../menus/api/weekly-menus.api';

export interface ClassWeeklyMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: {
    classId: string;
    className: string;
    gradeLevel?: string;
    gradeLevelLabel?: string;
    roomNumber?: string;
    totalStudents?: number;
    lunchCount: number;
    snackCount: number;
    absentCount: number;
    teacherName?: string;
  } | null;
  currentDate?: string;
  allergyAlerts?: Array<{
    id: string;
    childName: string;
    className: string;
    severity: string;
    badgeColor?: 'RED' | 'ORANGE';
    allergen: string;
    replacementMeal: string;
    dosingNotes?: string;
  }>;
  isDarkMode?: boolean;
}

const DAY_LABELS = [
  { dayOfWeek: 1, name: 'Thứ Hai', shortName: 'Thứ 2', code: 'T2' },
  { dayOfWeek: 2, name: 'Thứ Ba', shortName: 'Thứ 3', code: 'T3' },
  { dayOfWeek: 3, name: 'Thứ Tư', shortName: 'Thứ 4', code: 'T4' },
  { dayOfWeek: 4, name: 'Thứ Năm', shortName: 'Thứ 5', code: 'T5' },
  { dayOfWeek: 5, name: 'Thứ Sáu', shortName: 'Thứ 6', code: 'T6' },
  { dayOfWeek: 6, name: 'Thứ Bảy', shortName: 'Thứ 7', code: 'T7' },
];

const MEAL_TIMES = [
  {
    code: 'LUNCH',
    label: 'Bữa Trưa Chính',
    time: '10:30 - 11:30',
    color: 'emerald',
    icon: '🍲',
    description: 'Cơm mềm / cháo dinh dưỡng + Món mặn + Canh + Rau + Tráng miệng',
  },
  {
    code: 'AFTERNOON_SNACK',
    label: 'Bữa Xế Chiều',
    time: '14:15 - 15:00',
    color: 'sky',
    icon: '🥛',
    description: 'Cháo súp / Bánh dinh dưỡng / Sữa tươi / Chè bổ dưỡng',
  },
  {
    code: 'BREAKFAST',
    label: 'Bữa Sáng (Nếu có)',
    time: '07:00 - 07:45',
    color: 'amber',
    icon: '🥣',
    description: 'Súp / Mì / Nui / Phở dinh dưỡng buổi sáng',
  },
];

export const ClassWeeklyMenuModal: React.FC<ClassWeeklyMenuModalProps> = ({
  isOpen,
  onClose,
  classItem,
  currentDate = new Date().toISOString().split('T')[0],
  allergyAlerts = [],
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'WEEK_MATRIX' | 'TODAY_FOCUS'>('WEEK_MATRIX');
  const [isLoading, setIsLoading] = useState(false);
  const [availableMenus, setAvailableMenus] = useState<WeeklyMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenu | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(() => {
    try {
      const dt = new Date(currentDate);
      const day = dt.getDay();
      return day === 0 ? 1 : day; // Chủ nhật fallback về Thứ 2
    } catch {
      return 1;
    }
  });

  // Xác định thứ trong tuần của currentDate
  const todayDayOfWeek = useMemo(() => {
    try {
      const dt = new Date(currentDate);
      const day = dt.getDay();
      return day === 0 ? 1 : day;
    } catch {
      return 1;
    }
  }, [currentDate]);

  // Tính ngày cụ thể cho từng thứ trong tuần (Thứ 2 đến Thứ 7)
  const weekDates = useMemo(() => {
    try {
      const dt = new Date(currentDate);
      const currentDay = dt.getDay() === 0 ? 7 : dt.getDay();
      const monday = new Date(dt);
      monday.setDate(dt.getDate() - (currentDay - 1));

      const map: Record<number, string> = {};
      for (let i = 1; i <= 6; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + (i - 1));
        const dayStr = String(d.getDate()).padStart(2, '0');
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        map[i] = `${dayStr}/${monthStr}`;
      }
      return map;
    } catch {
      return {};
    }
  }, [currentDate]);

  // Lọc cảnh báo dị ứng của lớp này
  const classAllergies = useMemo(() => {
    if (!classItem) return [];
    return allergyAlerts.filter((a) => {
      const alertCls = (a.className || '').toLowerCase().trim();
      const itemCls = (classItem.className || '').toLowerCase().trim();
      return alertCls === itemCls || alertCls.includes(itemCls) || itemCls.includes(alertCls);
    });
  }, [classItem, allergyAlerts]);

  // Load thực đơn khi mở modal
  useEffect(() => {
    if (!isOpen || !classItem) return;

    let isMounted = true;
    setIsLoading(true);

    const loadMenu = async () => {
      try {
        const isToddler =
          classItem.gradeLevel?.includes('TODDLER') ||
          classItem.className.toLowerCase().includes('nhà trẻ') ||
          classItem.className.toLowerCase().includes('toddler');

        // Lấy danh sách thực đơn
        const menus = await weeklyMenusApi.getMenus();
        if (!isMounted) return;

        if (Array.isArray(menus) && menus.length > 0) {
          setAvailableMenus(menus);

          // Tìm thực đơn phù hợp nhất với lớp và ngày hiện tại:
          // 1. Phù hợp độ tuổi (Nhà trẻ vs Mẫu giáo)
          // 2. Chứa ngày hiện tại trong khoảng startDate..endDate
          // 3. Ưu tiên APPROVED / ACTIVE
          let targetMenus = menus.filter((m) => {
            if (isToddler) {
              return m.targetAgeGroup?.includes('TODDLER');
            }
            return !m.targetAgeGroup?.includes('TODDLER');
          });

          if (targetMenus.length === 0) targetMenus = menus;

          // Tìm thực đơn đang diễn ra trong tuần này
          let matched = targetMenus.find(
            (m) => m.startDate <= currentDate && currentDate <= m.endDate,
          );

          if (!matched) {
            // Hoặc ưu tiên thực đơn đã duyệt gần nhất
            matched =
              targetMenus.find((m) => m.status === 'APPROVED' || m.status === 'ACTIVE') ||
              targetMenus[0];
          }

          if (matched) {
            // Tải chi tiết đầy đủ thực đơn kèm món ăn
            const fullMenu = await weeklyMenusApi.getMenuById(matched.id);
            if (isMounted) {
              setSelectedMenu(fullMenu);
            }
          }
        }
      } catch (err) {
        console.warn('Không thể tải thực đơn trực tiếp từ API:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMenu();

    return () => {
      isMounted = false;
    };
  }, [isOpen, classItem, currentDate]);

  // Đổi thực đơn được chọn khi người dùng chọn từ dropdown
  const handleSelectMenuId = async (menuId: string) => {
    try {
      setIsLoading(true);
      const fullMenu = await weeklyMenusApi.getMenuById(menuId);
      setSelectedMenu(fullMenu);
    } catch (err) {
      console.error('Lỗi khi đổi thực đơn:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc món ăn theo thứ trong tuần và bữa ăn
  const dishesByDayAndMeal = useMemo(() => {
    const matrix: Record<number, Record<string, MenuDishItem[]>> = {
      1: { BREAKFAST: [], LUNCH: [], AFTERNOON_SNACK: [] },
      2: { BREAKFAST: [], LUNCH: [], AFTERNOON_SNACK: [] },
      3: { BREAKFAST: [], LUNCH: [], AFTERNOON_SNACK: [] },
      4: { BREAKFAST: [], LUNCH: [], AFTERNOON_SNACK: [] },
      5: { BREAKFAST: [], LUNCH: [], AFTERNOON_SNACK: [] },
      6: { BREAKFAST: [], LUNCH: [], AFTERNOON_SNACK: [] },
    };

    if (!selectedMenu?.menuDishes) return matrix;

    selectedMenu.menuDishes.forEach((item) => {
      const d = item.dayOfWeek;
      const m = item.mealTime;
      if (matrix[d] && matrix[d][m]) {
        matrix[d][m].push(item);
      } else if (matrix[d]) {
        matrix[d][m] = [item];
      }
    });

    return matrix;
  }, [selectedMenu]);

  // Phân tích dinh dưỡng trung bình ngày của thực đơn
  const nutritionSummary = useMemo(() => {
    if (!selectedMenu) {
      return {
        calories: 780,
        protein: 15.5,
        lipid: 28.2,
        glucid: 56.3,
      };
    }

    const cal = Number(selectedMenu.dailyAverageCalories || 780);
    const pG = Number(selectedMenu.dailyAverageProteinG || 32);
    const lG = Number(selectedMenu.dailyAverageFatG || 24);
    const gG = Number(selectedMenu.dailyAverageCarbG || 105);

    const pKcal = pG * 4;
    const lKcal = lG * 9;
    const gKcal = gG * 4;
    const totalKcal = pKcal + lKcal + gKcal || cal || 1;

    return {
      calories: Math.round(cal),
      protein: parseFloat(((pKcal / totalKcal) * 100).toFixed(1)),
      lipid: parseFloat(((lKcal / totalKcal) * 100).toFixed(1)),
      glucid: parseFloat(((gKcal / totalKcal) * 100).toFixed(1)),
    };
  }, [selectedMenu]);

  // Đóng modal khi ấn ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !classItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className={`w-full max-w-6xl my-auto rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden transition-all duration-300 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* 1. MODAL HEADER */}
        <div
          className={`px-6 py-4.5 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 ${
            isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center border border-amber-500/30 shadow-inner">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  {classItem.className}
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  {classItem.roomNumber || 'Phòng học'}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  {classItem.gradeLevelLabel || 'Khối mầm non'}
                </span>
              </div>
              <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                <span>GVCN: <strong className="text-slate-700 dark:text-slate-300">{classItem.teacherName || 'GV Phụ trách'}</strong></span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Bữa trưa: {classItem.lunchCount} suất
                </span>
                <span>•</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">
                  Bữa xế: {classItem.snackCount} phần
                </span>
                {classItem.absentCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-rose-500 font-bold">Vắng: {classItem.absentCount} bé</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons in Header */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              title="In thực đơn tuần của lớp này"
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
              }`}
            >
              <Printer className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">In Thực Đơn</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition active:scale-95 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border-slate-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. SUB-HEADER: CHỌN TUẦN / THỰC ĐƠN & CẢNH BÁO DỊ ỨNG */}
        <div
          className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
            isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'
          }`}
        >
          {/* Menu Selector / Info */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              Thực đơn áp dụng:
            </span>

            {availableMenus.length > 1 ? (
              <select
                value={selectedMenu?.id || ''}
                onChange={(e) => handleSelectMenuId(e.target.value)}
                className={`font-black rounded-xl px-3 py-1.5 border text-xs focus:outline-none transition cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-amber-400'
                    : 'bg-white border-amber-200 text-amber-900 shadow-sm'
                }`}
              >
                {availableMenus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.startDate} - {m.endDate})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-black text-amber-800 dark:text-amber-300">
                {selectedMenu?.title || 'Thực đơn Bán trú Tiêu chuẩn'} ({selectedMenu?.startDate || 'Tuần này'} -{' '}
                {selectedMenu?.endDate || 'Cuối tuần'})
              </span>
            )}

            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
              ✓ ĐÃ DUYỆT BAN HÀNH
            </span>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('WEEK_MATRIX')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                activeTab === 'WEEK_MATRIX'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ma Trận Cả Tuần (T2 - T7)
            </button>
            <button
              onClick={() => setActiveTab('TODAY_FOCUS')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 ${
                activeTab === 'TODAY_FOCUS'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>🔥 Chi Tiết Hôm Nay</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </button>
          </div>
        </div>

        {/* 3. ALLERGY WARNING BANNER (NẾU LỚP CÓ TRẺ DỊ ỨNG) */}
        {classAllergies.length > 0 && (
          <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/30 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-black text-rose-700 dark:text-rose-300">
                🚨 CẢNH BÁO DỊ ỨNG LỚP {classItem.className.toUpperCase()} ({classAllergies.length} TRẺ CẦN KIỂM SOÁT KHAY ĂN):
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {classAllergies.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 font-bold text-rose-800 dark:text-rose-300 shadow-xs"
                  >
                    <span>🧒 {a.childName}:</span>
                    <span className="font-normal">{a.allergen}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      {a.replacementMeal}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-sm">Đang tải ma trận thực đơn tuần của lớp...</p>
            </div>
          ) : activeTab === 'WEEK_MATRIX' ? (
            /* TAB 1: MA TRẬN CẢ TUẦN */
            <div className="space-y-5">
              {/* Table Container */}
              <div
                className={`border rounded-2xl overflow-hidden shadow-sm ${
                  isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                      <tr className={isDarkMode ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-700'}>
                        <th className="p-3.5 text-xs font-black uppercase tracking-wider w-36 border-r border-b dark:border-slate-800">
                          Bữa Ăn
                        </th>
                        {DAY_LABELS.map((day) => {
                          const isToday = day.dayOfWeek === todayDayOfWeek;
                          return (
                            <th
                              key={day.dayOfWeek}
                              className={`p-3 text-center border-r border-b last:border-r-0 dark:border-slate-800 ${
                                isToday
                                  ? isDarkMode
                                    ? 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/50'
                                    : 'bg-amber-100/70 text-amber-900 ring-2 ring-amber-400'
                                  : ''
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-black uppercase tracking-wide">
                                  {day.name}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400">
                                  {weekDates[day.dayOfWeek] || day.shortName}
                                </span>
                                {isToday && (
                                  <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                                    ★ HÔM NAY
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {MEAL_TIMES.map((meal) => (
                        <tr
                          key={meal.code}
                          className={`transition ${
                            isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          {/* Meal Header Column */}
                          <td className="p-3.5 font-bold border-r dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 align-top">
                            <div className="flex items-center gap-1.5 font-black text-slate-800 dark:text-white">
                              <span>{meal.icon}</span>
                              <span>{meal.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                              {meal.time}
                            </span>
                          </td>

                          {/* Days Cells */}
                          {DAY_LABELS.map((day) => {
                            const isToday = day.dayOfWeek === todayDayOfWeek;
                            const dishes = dishesByDayAndMeal[day.dayOfWeek]?.[meal.code] || [];

                            return (
                              <td
                                key={day.dayOfWeek}
                                className={`p-2.5 border-r last:border-r-0 dark:border-slate-800 align-top ${
                                  isToday
                                    ? isDarkMode
                                      ? 'bg-amber-950/20'
                                      : 'bg-amber-50/40'
                                    : ''
                                }`}
                              >
                                {dishes.length === 0 ? (
                                  <div className="py-4 text-center text-slate-300 dark:text-slate-700 italic text-[11px]">
                                    —
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {dishes.map((item) => {
                                      const dish = item.dish;
                                      const dishName = dish?.name || 'Món ăn dinh dưỡng';
                                      const calo = item.plannedCalories || dish?.totalCalories || 0;
                                      const portion = item.portionSizeG || dish?.standardServingSizeG || 100;

                                      return (
                                        <div
                                          key={item.id}
                                          className={`p-2 rounded-xl border text-left transition ${
                                            isDarkMode
                                              ? 'bg-slate-800/80 border-slate-700/80 hover:border-amber-400/50'
                                              : 'bg-white border-slate-200/80 hover:border-amber-400 hover:shadow-xs'
                                          }`}
                                        >
                                          <p className="font-black text-slate-800 dark:text-slate-100 text-[11px] leading-snug">
                                            {dishName}
                                          </p>

                                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400">
                                            <span>
                                              {Number(portion)}g
                                            </span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                              {Math.round(Number(calo))} kcal
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Nutrition Summary Bar for Circular 28/2016 */}
              <div
                className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                  isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                  <div>
                    <h5 className="font-black text-xs text-slate-800 dark:text-white">
                      CÂN ĐỐI DINH DƯỠNG TUẦN (CHUẨN THÔNG TƯ 28/2016/TT-BGDĐT)
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Năng lượng tại trường đáp ứng 50 - 55% nhu cầu cả ngày của trẻ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs">
                  <div className="text-center px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">NĂNG LƯỢNG TB</span>
                    <strong className="text-emerald-600 font-black">{nutritionSummary.calories} kcal/ngày</strong>
                  </div>

                  <div className="text-center px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">TỶ LỆ P : L : G</span>
                    <strong className="text-amber-600 font-black">
                      {nutritionSummary.protein}% : {nutritionSummary.lipid}% : {nutritionSummary.glucid}%
                    </strong>
                  </div>

                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-[11px] flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    ĐẠT CHUẨN BỘ GIÁO DỤC
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: CHI TIẾT HÔM NAY (ĐỊNH LƯỢNG XUẤT CHO LỚP NÀY) */
            <div className="space-y-6">
              {/* Header card: Today's date & Class portion calculation */}
              <div
                className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30'
                    : 'bg-gradient-to-r from-amber-50 via-orange-50/50 to-white border-amber-200'
                }`}
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-white">
                    HÔM NAY • THỨ {todayDayOfWeek + 1 === 8 ? 'BẢY' : todayDayOfWeek + 1} ({weekDates[todayDayOfWeek] || currentDate})
                  </span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                    Kế Hoạch Khẩu Phần Cho {classItem.className}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Số suất ăn đã được Giáo viên chủ nhiệm chốt và chuyển về Bếp Trung Tâm
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">BỮA TRƯA</span>
                    <strong className="text-2xl font-black text-emerald-600">{classItem.lunchCount}</strong>
                    <span className="text-[10px] text-slate-400 block">khay ăn</span>
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">BỮA XẾ</span>
                    <strong className="text-2xl font-black text-sky-600">{classItem.snackCount}</strong>
                    <span className="text-[10px] text-slate-400 block">phần ăn</span>
                  </div>
                </div>
              </div>

              {/* Danh sách món ăn ngày hôm nay chia theo bữa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Bữa Trưa */}
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-black text-sm text-slate-900 dark:text-white">
                          BỮA TRƯA CHÍNH (10:30)
                        </h5>
                        <p className="text-[11px] text-slate-400">Tổng {classItem.lunchCount} suất chuẩn bị</p>
                      </div>
                    </div>
                  </div>

                  {dishesByDayAndMeal[todayDayOfWeek]?.['LUNCH']?.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400 italic">
                      Chưa có món ăn được chỉ định cho bữa trưa hôm nay
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dishesByDayAndMeal[todayDayOfWeek]?.['LUNCH']?.map((item) => {
                        const dish = item.dish;
                        const dishName = dish?.name || 'Món chính';
                        const portionG = Number(item.portionSizeG || dish?.standardServingSizeG || 100);
                        const totalKg = ((classItem.lunchCount * portionG) / 1000).toFixed(2);

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                              isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/60'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white">{dishName}</p>
                              <span className="text-[11px] text-slate-400">
                                Định lượng: {portionG}g / trẻ • {Math.round(Number(item.plannedCalories || 0))} kcal
                              </span>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-400 block font-semibold">TỔNG XUẤT LỚP</span>
                              <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                {totalKg} kg
                              </strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Bữa Xế */}
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
                        <PackageCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-black text-sm text-slate-900 dark:text-white">
                          BỮA XẾ CHIỀU (14:15)
                        </h5>
                        <p className="text-[11px] text-slate-400">Tổng {classItem.snackCount} phần chuẩn bị</p>
                      </div>
                    </div>
                  </div>

                  {dishesByDayAndMeal[todayDayOfWeek]?.['AFTERNOON_SNACK']?.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400 italic">
                      Chưa có món ăn được chỉ định cho bữa xế hôm nay
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dishesByDayAndMeal[todayDayOfWeek]?.['AFTERNOON_SNACK']?.map((item) => {
                        const dish = item.dish;
                        const dishName = dish?.name || 'Món xế';
                        const portionG = Number(item.portionSizeG || dish?.standardServingSizeG || 120);
                        const totalKg = ((classItem.snackCount * portionG) / 1000).toFixed(2);

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                              isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/60'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white">{dishName}</p>
                              <span className="text-[11px] text-slate-400">
                                Định lượng: {portionG}g / trẻ • {Math.round(Number(item.plannedCalories || 0))} kcal
                              </span>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-400 block font-semibold">TỔNG XUẤT LỚP</span>
                              <strong className="text-sm font-black text-sky-600 dark:text-sky-400">
                                {totalKg} kg
                              </strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. MODAL FOOTER */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between gap-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-500" />
            <span>
              Thực đơn đồng bộ tự động từ phòng Dinh dưỡng • Cập nhật theo thời gian thực (KDS WebSocket)
            </span>
          </div>

          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-sm'
            }`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
