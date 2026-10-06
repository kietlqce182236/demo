import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Utensils,
  Flame,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
  Scale,
  TrendingUp,
  Eye,
  Heart,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { WeeklyMenu, MenuDishItem, MenuAdvisoryResponse } from '../api/weekly-menus.api';
import { RecipeInspectionModal } from './RecipeInspectionModal';

interface WeeklyGridTableProps {
  menu: WeeklyMenu | null;
  advisory?: MenuAdvisoryResponse | null;
  onOpenDishDrawer: (slot: { dayOfWeek: number; mealTime: string; existingDish?: MenuDishItem | null }) => void;
  onRemoveDish: (menuDishId: string) => Promise<void>;
  onOpenAdvisoryForDish?: (menuDishId: string, initialTab?: 'STUNTED' | 'OBESE' | 'ALLERGIES') => void;
  onOpenAdvisoryModal?: () => void;
  readOnly?: boolean;
}

export interface ResolvedSubstituteInfo {
  type: 'ALLERGIES' | 'OBESE' | 'STUNTED';
  badgeTitle: string;
  tagText: string;
  studentDesc: string;
  containerClasses: string;
  badgeBg: string;
  textColor: string;
}

export const resolveSubstituteInfo = (
  md: MenuDishItem,
  advisory?: MenuAdvisoryResponse | null,
): ResolvedSubstituteInfo => {
  const notes = (md.specialDietNotes || '').toUpperCase();
  const conflictsForDish =
    advisory?.allergyConflicts?.filter((c) => c.menuDishId === md.id || c.dishId === md.dishId) || [];

  // 1. Kiểm tra qua specialDietNotes nếu đã ghi rõ tag
  const isExplicitAllergy =
    notes.includes('LOẠI 3') || notes.includes('LOAI 3') || notes.includes('DỊ ỨNG') || notes.includes('DI UNG') || notes.includes('ALLERG');
  const isExplicitObese =
    notes.includes('LOẠI 2') || notes.includes('LOAI 2') || notes.includes('BÉO PHÌ') || notes.includes('THỪA CÂN') || notes.includes('OBESE');
  const isExplicitStunted =
    notes.includes('LOẠI 1') || notes.includes('LOAI 1') || notes.includes('CÒI XƯƠNG') || notes.includes('SUY DINH DƯỠNG') || notes.includes('STUNTED');

  let type: 'ALLERGIES' | 'OBESE' | 'STUNTED' = 'ALLERGIES';

  if (isExplicitAllergy) {
    type = 'ALLERGIES';
  } else if (isExplicitObese) {
    type = 'OBESE';
  } else if (isExplicitStunted) {
    type = 'STUNTED';
  } else {
    // 2. Tự động suy luận thông minh theo dữ liệu thực tế
    if (conflictsForDish.length > 0) {
      type = 'ALLERGIES';
    } else {
      const origCalo = Number(md.plannedCalories || md.dish?.totalCalories || 0);
      const subCalo = Number(md.substituteDish?.totalCalories || 0);
      const dishFat = Number(md.dish?.totalFatG || 0);
      const isFried = /chiên|rán|mỡ|xào mặn|nướng|kho mặn|đậu phộng/i.test(md.dish?.name || '');

      if (
        (origCalo >= 85 || dishFat >= 4.0 || isFried || (subCalo > 0 && subCalo < origCalo)) &&
        (advisory?.bmiSummary?.overweightObeseCount || 0) > 0
      ) {
        type = 'OBESE';
      } else {
        type = 'STUNTED';
      }
    }
  }

  if (type === 'ALLERGIES') {
    const childNames = Array.from(new Set(conflictsForDish.map((c) => c.childName)));
    const allergens = Array.from(new Set(conflictsForDish.map((c) => c.allergenDetected).filter(Boolean)));
    const studentDesc =
      childNames.length > 0
        ? `Cho ${childNames.length} bé dị ứng ${allergens.join(', ')}: ${childNames.slice(0, 2).join(', ')}${childNames.length > 2 ? '...' : ''}`
        : 'Cho học sinh có cơ địa dị ứng thực phẩm';
    return {
      type,
      badgeTitle: 'Loại 3: Dị ứng',
      tagText: 'Đã đổi món dị ứng',
      studentDesc,
      containerClasses: 'bg-rose-50/95 border-rose-300 text-rose-950 hover:bg-rose-100',
      badgeBg: 'bg-rose-600 text-white',
      textColor: 'text-rose-700',
    };
  }

  if (type === 'OBESE') {
    const count = advisory?.bmiSummary?.overweightObeseCount || 0;
    return {
      type,
      badgeTitle: 'Loại 2: Béo phì',
      tagText: 'Đã đổi giảm calo',
      studentDesc: count > 0 ? `Cho ${count} bé Thừa cân/Béo phì (Giảm calo TT 28)` : 'Cho học sinh thừa cân, béo phì',
      containerClasses: 'bg-purple-50/95 border-purple-300 text-purple-950 hover:bg-purple-100',
      badgeBg: 'bg-purple-600 text-white',
      textColor: 'text-purple-700',
    };
  }

  const count = advisory?.bmiSummary?.wastedUnderweightCount || 0;
  return {
    type,
    badgeTitle: 'Loại 1: Còi xương',
    tagText: 'Đã đổi tăng calo',
    studentDesc: count > 0 ? `Cho ${count} bé Còi xương/SDD (Tăng đạm QĐ 1246)` : 'Cho học sinh còi xương, suy dinh dưỡng',
    containerClasses: 'bg-amber-50/95 border-amber-300 text-amber-950 hover:bg-amber-100',
    badgeBg: 'bg-amber-600 text-white',
    textColor: 'text-amber-800',
  };
};

export const WeeklyGridTable: React.FC<WeeklyGridTableProps> = ({
  menu,
  advisory,
  onOpenDishDrawer,
  onRemoveDish,
  onOpenAdvisoryForDish,
  onOpenAdvisoryModal,
  readOnly = false,
}) => {
  const [inspectingDish, setInspectingDish] = useState<{
    menuDish: MenuDishItem;
    dayLabel: string;
    slotName: string;
  } | null>(null);

  // Hiển thị đầy đủ 7 ngày trong tuần theo chuẩn trường mầm non & bán trú
  const days = [
    { dayOfWeek: 1, label: 'Thứ Hai', shortLabel: 'T2', sub: 'Ngày 1', isWeekend: false },
    { dayOfWeek: 2, label: 'Thứ Ba', shortLabel: 'T3', sub: 'Ngày 2', isWeekend: false },
    { dayOfWeek: 3, label: 'Thứ Tư', shortLabel: 'T4', sub: 'Ngày 3', isWeekend: false },
    { dayOfWeek: 4, label: 'Thứ Năm', shortLabel: 'T5', sub: 'Ngày 4', isWeekend: false },
    { dayOfWeek: 5, label: 'Thứ Sáu', shortLabel: 'T6', sub: 'Ngày 5', isWeekend: false },
    { dayOfWeek: 6, label: 'Thứ Bảy', shortLabel: 'T7', sub: 'Ngày 6', isWeekend: true },
    { dayOfWeek: 7, label: 'Chủ Nhật', shortLabel: 'CN', sub: 'Ngày 7', isWeekend: true },
  ];

  const mealSlots = [
    { key: 'BREAKFAST', name: 'Bữa sáng', time: '08:00', iconColor: 'text-amber-600', bgColor: 'bg-amber-50/60' },
    { key: 'MORNING_SNACK', name: 'Phụ sáng', time: '09:30', iconColor: 'text-blue-600', bgColor: 'bg-blue-50/60' },
    { key: 'LUNCH', name: 'Bữa trưa chính', time: '11:00', iconColor: 'text-emerald-700', bgColor: 'bg-emerald-50/60' },
    { key: 'AFTERNOON_SNACK', name: 'Phụ chiều / Xế', time: '14:30', iconColor: 'text-purple-600', bgColor: 'bg-purple-50/60' },
    { key: 'LATE_SNACK', name: 'Ăn xế 17h (DV)', time: '17:00', iconColor: 'text-orange-600', bgColor: 'bg-orange-50/60' },
  ];

  const getDishesInSlot = (day: number, slotKey: string): MenuDishItem[] => {
    if (!menu?.menuDishes) return [];
    return menu.menuDishes.filter(
      (md) => md.dayOfWeek === day && md.mealTime === slotKey && !md.deletedAt,
    );
  };

  // Tính toán dinh dưỡng chi tiết & chuẩn xác cho từng ngày trong tuần
  const getDailyNutrition = (day: number) => {
    if (!menu?.menuDishes) {
      return {
        calo: 0,
        p: 0,
        l: 0,
        g: 0,
        pPct: 0,
        lPct: 0,
        gPct: 0,
        isOptimal: false,
        statusType: 'empty',
        statusText: 'Chưa lên món',
      };
    }

    const dayDishes = menu.menuDishes.filter((md) => md.dayOfWeek === day && !md.deletedAt);
    if (dayDishes.length === 0) {
      return {
        calo: 0,
        p: 0,
        l: 0,
        g: 0,
        pPct: 0,
        lPct: 0,
        gPct: 0,
        isOptimal: false,
        statusType: 'empty',
        statusText: 'Chưa lên món',
      };
    }

    let totalP = 0;
    let totalL = 0;
    let totalG = 0;
    let sumCaloPlanned = 0;

    for (const md of dayDishes) {
      const dish = md.dish;
      const portion = Number(md.portionSizeG) || 100;
      const standardSize = dish && Number(dish.standardServingSizeG) > 0 ? Number(dish.standardServingSizeG) : 100;
      const ratio = portion / standardSize;

      if (dish) {
        totalP += (Number(dish.totalProteinG) || 0) * ratio;
        totalL += (Number(dish.totalFatG) || 0) * ratio;
        totalG += (Number(dish.totalCarbG) || 0) * ratio;
      }
      sumCaloPlanned += (Number(md.plannedCalories) || 0);
    }

    // Làm tròn 2 chữ số thập phân chuẩn xác, triệt tiêu lỗi số thực IEEE-754 (698.3599999999999)
    totalP = Math.round(totalP * 100) / 100;
    totalL = Math.round(totalL * 100) / 100;
    totalG = Math.round(totalG * 100) / 100;

    // Quy đổi năng lượng theo công thức chuẩn: Kcal = P*4 + L*9 + G*4
    const caloP = totalP * 4;
    const caloL = totalL * 9;
    const caloG = totalG * 4;
    let totalCalo = Math.round((caloP + caloL + caloG) * 100) / 100;

    if (totalCalo === 0 && sumCaloPlanned > 0) {
      totalCalo = Math.round(sumCaloPlanned * 100) / 100;
    }

    const pPct = totalCalo > 0 ? Math.round((caloP / totalCalo) * 1000) / 10 : 0;
    const lPct = totalCalo > 0 ? Math.round((caloL / totalCalo) * 1000) / 10 : 0;
    const gPct = totalCalo > 0 ? Math.round((100 - pPct - lPct) * 10) / 10 : 0;

    // Chuẩn Mẫu giáo bán trú Thông tư 28/2016/TT-BGDĐT:
    // Năng lượng: 615 - 726 Kcal (cho phép khoảng dao động 600 - 750 Kcal)
    // Tỷ lệ P: 13 - 20%, L: 25 - 35%, G: 52 - 60%
    const isCaloStandard = totalCalo >= 615 && totalCalo <= 726;
    const isPOptimal = pPct >= 13 && pPct <= 20;
    const isLOptimal = lPct >= 20 && lPct <= 35;

    let statusText = 'Đạt chuẩn TT 28';
    let statusType: 'optimal' | 'warning' | 'alert' | 'empty' = 'optimal';

    if (totalCalo < 600) {
      statusText = `Thiếu calo (< 615)`;
      statusType = 'warning';
    } else if (totalCalo > 750) {
      statusText = `Vượt calo (> 726)`;
      statusType = 'alert';
    } else if (!isPOptimal || !isLOptimal) {
      statusText = `Cân đối (${pPct}% P : ${lPct}% L)`;
      statusType = 'warning';
    } else {
      statusText = 'Đạt chuẩn TT 28';
      statusType = 'optimal';
    }

    return {
      calo: totalCalo,
      p: totalP,
      l: totalL,
      g: totalG,
      pPct,
      lPct,
      gPct,
      isOptimal: isCaloStandard && isPOptimal && isLOptimal,
      statusType,
      statusText,
    };
  };

  // Tính tỷ lệ trung bình P:L:G của toàn thực đơn
  const avgCal = Number(menu?.dailyAverageCalories || 0);
  const avgP = Number(menu?.dailyAverageProteinG || 0);
  const avgL = Number(menu?.dailyAverageFatG || 0);
  const avgG = Number(menu?.dailyAverageCarbG || 0);
  const avgPPct = avgCal > 0 ? Math.round((avgP * 4 / avgCal) * 100) : 16;
  const avgLPct = avgCal > 0 ? Math.round((avgL * 9 / avgCal) * 100) : 30;
  const avgGPct = Math.max(0, 100 - avgPPct - avgLPct);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden font-sans">
      {/* Header trạng thái thực đơn & dinh dưỡng tổng quan */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {menu?.title || 'Chưa chọn thực đơn'}
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full">
              v{menu?.version || 1}.0
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                menu?.status === 'ACTIVE'
                  ? 'bg-emerald-500 text-white'
                  : menu?.status === 'APPROVED'
                  ? 'bg-blue-100 text-blue-800'
                  : menu?.status === 'SUBMITTED_FOR_REVIEW'
                  ? 'bg-amber-100 text-amber-800'
                  : menu?.status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {menu?.status === 'ACTIVE'
                ? 'ĐANG ÁP DỤNG (ĐÃ KHÓA)'
                : menu?.status === 'APPROVED'
                ? 'ĐÃ DUYỆT (CHỜ CÔNG BỐ)'
                : menu?.status === 'SUBMITTED_FOR_REVIEW'
                ? 'CHỜ BGH DUYỆT'
                : menu?.status === 'REJECTED'
                ? 'BỊ TỪ CHỐI'
                : 'BẢN DỰ THẢO'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Từ ngày {menu?.startDate?.split('T')[0]} đến {menu?.endDate?.split('T')[0]} • Nhóm tuổi:{' '}
            <strong className="text-slate-700">{menu?.targetAgeGroup || 'ALL_AGES'}</strong>
          </p>
        </div>

        {/* Thông số dinh dưỡng tổng quan 4 chỉ số */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-3.5 py-1.5 text-right shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Năng lượng TB</span>
            <span className="text-sm sm:text-base font-black text-emerald-950">
              {avgCal.toFixed(1)} Kcal
            </span>
          </div>

          <div className="bg-blue-50 border border-blue-200/80 rounded-2xl px-3.5 py-1.5 text-right shadow-2xs hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-blue-800 block">Đạm (P) TB</span>
            <span className="text-xs sm:text-sm font-black text-blue-950">
              {avgP.toFixed(1)}g <span className="text-[10px] text-blue-700 font-semibold">({avgPPct}%)</span>
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl px-3.5 py-1.5 text-right shadow-2xs hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Béo (L) TB</span>
            <span className="text-xs sm:text-sm font-black text-amber-950">
              {avgL.toFixed(1)}g <span className="text-[10px] text-amber-700 font-semibold">({avgLPct}%)</span>
            </span>
          </div>

          <div className="bg-teal-50 border border-teal-200/80 rounded-2xl px-3.5 py-1.5 text-right shadow-2xs hidden md:block">
            <span className="text-[10px] uppercase font-bold text-teal-800 block">Đường (G) TB</span>
            <span className="text-xs sm:text-sm font-black text-teal-950">
              {avgG.toFixed(1)}g <span className="text-[10px] text-teal-700 font-semibold">({avgGPct}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Banner Tổng Hợp Cảnh Báo Dị Ứng Học Sinh & Đề Xuất BMI */}
      {advisory && (advisory.allergySummary.totalConflicts > 0 || (advisory.bmiSummary.overweightObeseCount + advisory.bmiSummary.wastedUnderweightCount > 0)) && (
        <div className="mx-5 my-3 p-4 bg-gradient-to-r from-rose-50 via-amber-50/40 to-white border border-rose-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-rose-950 uppercase tracking-wide">
                  Cảnh báo Dinh dưỡng Học đường & An toàn Dị ứng
                </span>
                {advisory.allergySummary.criticalCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                    Nguy kịch: {advisory.allergySummary.criticalCount} bé
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                {advisory.allergySummary.totalConflicts > 0 ? (
                  <span>
                    Phát hiện <strong>{advisory.allergySummary.totalConflicts} xung đột dị ứng</strong> với phụ huynh ({advisory.allergySummary.affectedChildrenCount} bé, {advisory.allergySummary.affectedDishesCount} món).
                  </span>
                ) : (
                  <span>Thực đơn không có xung đột dị ứng học sinh.</span>
                )}
                {(advisory.bmiSummary.overweightObeseCount + advisory.bmiSummary.wastedUnderweightCount) > 0 && (
                  <span className="ml-1 text-amber-900 font-medium">
                    Có <strong>{advisory.bmiSummary.overweightObeseCount} bé thừa cân/béo phì</strong> và <strong>{advisory.bmiSummary.wastedUnderweightCount} bé gầy còm/suy dinh dưỡng</strong> cần cá nhân hóa món ăn & khẩu phần theo TT 28/2016.
                  </span>
                )}
              </p>
            </div>
          </div>

          {onOpenAdvisoryModal && (
            <button
              type="button"
              onClick={onOpenAdvisoryModal}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-200" />
              <span>Phân loại Dinh dưỡng & Ghi chú (Dị ứng • Thấp còi • Béo phì)</span>
            </button>
          )}
        </div>
      )}

      {/* Banner cảnh báo từ chối của BGH nếu có */}
      {menu?.status === 'REJECTED' && menu.rejectionReason && (
        <div className="mx-5 my-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900">
            <p className="font-bold">Ban Giám Hiệu đã từ chối thực đơn này:</p>
            <p className="text-rose-700 mt-0.5 leading-relaxed">{menu.rejectionReason}</p>
            <p className="text-rose-500 text-[11px] mt-1 italic">
              Chuyên viên dinh dưỡng vui lòng tinh chỉnh lại các món ăn theo ý kiến chỉ đạo và bấm "Gửi Hiệu trưởng duyệt".
            </p>
          </div>
        </div>
      )}

      {/* Banner thông báo ĐANG CHỜ DUYỆT */}
      {menu?.status === 'SUBMITTED_FOR_REVIEW' && (
        <div className="mx-5 my-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <p className="font-bold">Thực đơn đang chờ Ban Giám Hiệu phê duyệt</p>
            <p className="text-amber-700 mt-0.5 leading-relaxed">
              Bạn vẫn có thể tinh chỉnh các món ăn hoặc định lượng trong các ô bên dưới nếu cần thiết. Sau khi chỉnh sửa xong, bấm nút <strong>"Cập nhật & Gửi lại Hiệu trưởng duyệt"</strong> ở thanh công cụ phía trên.
            </p>
          </div>
        </div>
      )}

      {/* Banner khi ĐÃ XIN PHÉP HIỆU TRƯỞNG CHỈNH SỬA (Đang chờ Hiệu trưởng duyệt mở khóa) */}
      {(menu?.status === 'APPROVED' || menu?.status === 'ACTIVE') && menu?.editRequestStatus === 'PENDING' && (
        <div className="mx-5 my-3 p-3.5 bg-gradient-to-r from-amber-50 via-purple-50/40 to-white border border-amber-300 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs text-amber-950 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-wider text-amber-900">
                Đang chờ Hiệu trưởng cấp quyền chỉnh sửa thực đơn
              </span>
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                Chờ xét duyệt
              </span>
            </div>
            <p className="text-amber-800 mt-1">
              <strong>Lý do đề xuất:</strong> "{menu.editRequestReason}"
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5 italic">
              Yêu cầu đã được gửi lên Hiệu trưởng lúc {menu.editRequestAt ? new Date(menu.editRequestAt).toLocaleString('vi-VN') : 'vừa xong'}. Khi Hiệu trưởng chấp thuận, thực đơn sẽ tự động mở khóa để điều chỉnh món ăn.
            </p>
          </div>
        </div>
      )}

      {/* Banner khi HIỆU TRƯỞNG TỪ CHỐI YÊU CẦU CHỈNH SỬA */}
      {(menu?.status === 'APPROVED' || menu?.status === 'ACTIVE') && menu?.editRequestStatus === 'REJECTED' && (
        <div className="mx-5 my-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-950">
            <p className="font-bold text-rose-900">Hiệu trưởng đã từ chối yêu cầu xin chỉnh sửa thực đơn này:</p>
            <p className="text-rose-700 mt-0.5 font-medium leading-relaxed">
              "{menu.editRequestResponseNotes || 'Không chấp thuận thay đổi thực đơn trong thời điểm hiện tại.'}"
            </p>
            <p className="text-[11px] text-rose-500 mt-0.5 italic">
              Nếu vẫn cần thay đổi đặc biệt, Chuyên viên Dinh dưỡng vui lòng trao đổi trực tiếp với BGH hoặc gửi lại yêu cầu với lý do giải trình cụ thể hơn.
            </p>
          </div>
        </div>
      )}

      {/* Banner thông báo ĐÃ DUYỆT (CHỜ CÔNG BỐ) - khi chưa xin sửa */}
      {menu?.status === 'APPROVED' && menu?.editRequestStatus !== 'PENDING' && menu?.editRequestStatus !== 'REJECTED' && (
        <div className="mx-5 my-3 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900">
            <p className="font-bold">Thực đơn đã được Hiệu trưởng phê duyệt thành công!</p>
            <p className="text-blue-700 mt-0.5 leading-relaxed">
              {menu.approvalNotes || 'Đạt chuẩn dinh dưỡng Thông tư 28/2016/TT-BGDĐT.'} Đang chờ Hiệu trưởng bấm "Khóa & Công bố" để kích hoạt toàn trường. <em>(Để chỉnh sửa lại, cần bấm "Xin phép Hiệu trưởng chỉnh sửa")</em>
            </p>
          </div>
        </div>
      )}

      {/* Banner thông báo ĐÃ KHÓA & CÔNG BỐ - khi chưa xin sửa */}
      {menu?.status === 'ACTIVE' && menu?.editRequestStatus !== 'PENDING' && menu?.editRequestStatus !== 'REJECTED' && (
        <div className="mx-5 my-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900">
            <p className="font-bold">Thực đơn ĐANG ÁP DỤNG (ĐÃ KHÓA & CÔNG BỐ TOÀN TRƯỜNG)</p>
            <p className="text-emerald-700 mt-0.5 leading-relaxed">
              Thực đơn đang được áp dụng trực tiếp cho Tablet Giáo viên và Màn hình Bếp KDS. Để chỉnh sửa thực đơn này, Chuyên viên Dinh dưỡng cần bấm nút <strong>"Xin phép Hiệu trưởng chỉnh sửa"</strong> để được phê duyệt mở khóa.
            </p>
          </div>
        </div>
      )}

      {/* Lưới Ma trận Thực đơn tuần (Hiển thị 7 ngày đầy đủ) */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse min-w-[980px] table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th 
                className="py-2.5 px-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0"
                style={{ width: '105px' }}
              >
                Bữa ăn
              </th>
              {days.map((day) => (
                <th
                  key={day.dayOfWeek}
                  className={`py-2 px-1 text-center border-l border-slate-100 min-w-[130px] ${
                    day.isWeekend ? 'bg-amber-50/30' : ''
                  }`}
                  style={{ width: `calc((100% - 105px) / ${days.length})` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-xs font-black text-slate-900">{day.label}</span>
                      {day.isWeekend && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800">
                          {day.shortLabel}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{day.sub}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {mealSlots.map((slot) => (
              <tr key={slot.key} className="hover:bg-slate-50/40 transition">
                {/* Cột Tên Bữa Ăn */}
                <td className="p-3 align-top bg-slate-50/60 border-r border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${slot.bgColor.replace('/60', '')}`}></div>
                    <span className="text-xs font-bold text-slate-800">{slot.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block ml-3.5 mt-0.5">
                    {slot.time}
                  </span>
                </td>

                {/* Các Cột tương ứng từng ngày */}
                {days.map((day) => {
                  const dishesInCell = getDishesInSlot(day.dayOfWeek, slot.key);
                  return (
                    <td
                      key={day.dayOfWeek}
                      className={`p-1.5 sm:p-2 align-top border-l border-slate-100 group relative hover:bg-emerald-50/20 transition ${
                        day.isWeekend ? 'bg-amber-50/10' : ''
                      }`}
                    >
                      <div className="space-y-1.5 min-h-[64px]">
                        {dishesInCell.map((md) => {
                          const portion = Number(md.portionSizeG) || 100;
                          const standard = Number(md.dish?.standardServingSizeG) || 100;
                          const ratio = portion / standard;
                          const pVal = ((Number(md.dish?.totalProteinG) || 0) * ratio).toFixed(1);
                          const lVal = ((Number(md.dish?.totalFatG) || 0) * ratio).toFixed(1);
                          const gVal = ((Number(md.dish?.totalCarbG) || 0) * ratio).toFixed(1);

                          return (
                            <div
                              key={md.id}
                              className="bg-white border border-slate-200/80 rounded-xl p-2 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition group/item"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span 
                                  onClick={() => setInspectingDish({ menuDish: md, dayLabel: day.label, slotName: slot.name })}
                                  title="Bấm để xem công thức & nguyên liệu chi tiết"
                                  className="text-xs font-bold text-slate-800 leading-tight hover:text-emerald-700 cursor-pointer transition"
                                >
                                  {md.dish?.name || 'Món ăn'}
                                </span>

                                <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition shrink-0">
                                  <button
                                    onClick={() => setInspectingDish({ menuDish: md, dayLabel: day.label, slotName: slot.name })}
                                    title="Xem công thức & nguyên liệu chi tiết"
                                    className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  {!readOnly && (
                                    <>
                                      <button
                                        onClick={() =>
                                          onOpenDishDrawer({
                                            dayOfWeek: day.dayOfWeek,
                                            mealTime: slot.key,
                                            existingDish: md,
                                          })
                                        }
                                        title="Chỉnh sửa định lượng"
                                        className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => onRemoveDish(md.id)}
                                        title="Xóa món ăn (xóa mềm)"
                                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                <div className="flex items-center gap-1">
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                                    {portion}g
                                  </span>
                                  {md.dish?.recipeItems && md.dish.recipeItems.length > 0 && (
                                    <span 
                                      onClick={() => setInspectingDish({ menuDish: md, dayLabel: day.label, slotName: slot.name })}
                                      title="Xem danh sách nguyên liệu"
                                      className="text-[9px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 rounded border border-teal-100 flex items-center gap-0.5 hover:bg-teal-100 cursor-pointer transition"
                                    >
                                      <Utensils className="w-2.5 h-2.5" />
                                      {md.dish.recipeItems.length} NL
                                    </span>
                                  )}
                                </div>
                                <span className="font-bold text-amber-700 flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5 text-amber-500" />
                                  {Number(md.plannedCalories).toFixed(1)} Kcal
                                </span>
                              </div>

                              {/* Dinh dưỡng chi tiết từng món ăn: P - L - G */}
                              {md.dish && (
                                <div className="mt-1 pt-1 border-t border-slate-100/90 flex items-center justify-between text-[9px] font-semibold text-slate-500">
                                  <span className="text-blue-700" title="Chất Đạm (Protein)">
                                    P: {pVal}g
                                  </span>
                                  <span className="text-amber-700" title="Chất Béo (Lipid)">
                                    L: {lVal}g
                                  </span>
                                  <span className="text-emerald-700" title="Đường Bột (Glucid)">
                                    G: {gVal}g
                                  </span>
                                </div>
                              )}

                              {/* ════════════════════════════════════════════════════════════════ */}
                              {/* KHUYẾN NGHỊ THAY THẾ CHO CÁC MÓN CẦN ĐIỀU CHỈNH HOẶC DỊ ỨNG    */}
                              {/* (Chỉ hiển thị ở những món cần thiết, không phải món nào cũng hiện) */}
                              {/* ════════════════════════════════════════════════════════════════ */}
                                {/* CẢNH BÁO DỊ ỨNG HOẶC GHI CHÚ CHIA PHẦN CHO NHÂN VIÊN */}
                                {(() => {
                                  const conflictsForDish = advisory?.allergyConflicts?.filter((c) => c.menuDishId === md.id) || [];
                                  const hasAllergyConflict = conflictsForDish.length > 0;

                                  if (!hasAllergyConflict && !md.specialDietNotes) return null;

                                  return (
                                    <div className="mt-1.5 pt-1 border-t border-slate-100">
                                      {/* 1. ĐÃ CÓ GHI CHÚ BẾP & GV: Thanh ghi chú 1 dòng gọn gàng, đều đặn */}
                                      {md.specialDietNotes ? (
                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const subInfo = resolveSubstituteInfo(md, advisory);
                                            onOpenAdvisoryForDish?.(md.id, subInfo.type);
                                          }}
                                          className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 transition cursor-pointer hover:bg-amber-100/90 shadow-2xs flex items-center gap-1.5"
                                          title={`Ghi chú Bếp & GV: ${md.specialDietNotes}. Bấm để xem / chỉnh sửa.`}
                                        >
                                          <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                                          <span className="text-[9.5px] font-semibold truncate flex-1">
                                            {md.specialDietNotes}
                                          </span>
                                        </div>
                                      ) : (
                                        /* 2. CẢNH BÁO DỊ ỨNG TRỰC TIẾP: Gọn gàng 1 dòng không làm vỡ chiều cao thẻ */
                                        <button
                                          type="button"
                                          onClick={() => onOpenAdvisoryForDish?.(md.id, 'ALLERGIES')}
                                          className="w-full text-left px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 hover:bg-rose-100 transition cursor-pointer flex items-center justify-between gap-1 shadow-2xs"
                                          title={`Phát hiện ${conflictsForDish.length} bé dị ứng: ${conflictsForDish.map((c) => `${c.childName} (${c.allergenDetected})`).join(', ')}. Bấm để ghi chú cho nhân viên.`}
                                        >
                                          <div className="flex items-center gap-1 truncate text-[10px] font-bold text-rose-700">
                                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                            <span className="truncate">Dị ứng ({conflictsForDish.length} bé)</span>
                                          </div>
                                          <span className="text-[8px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-extrabold shrink-0">
                                            Note
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                            </div>
                          );
                        })}

                        {/* Nút thêm món vào ô */}
                        {!readOnly && (
                          <button
                            onClick={() =>
                              onOpenDishDrawer({
                                dayOfWeek: day.dayOfWeek,
                                mealTime: slot.key,
                                existingDish: null,
                              })
                            }
                            className="w-full py-1 border border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-emerald-700 flex items-center justify-center gap-1 transition opacity-40 group-hover:opacity-100"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm món</span>
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* HÀNG TỔNG KẾT CALO & DINH DƯỠNG (P - L - G) Ở CHÂN BẢNG           */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <tfoot className="border-t-2 border-slate-300">
            {/* DÒNG 1: TỔNG NĂNG LƯỢNG / NGÀY */}
            <tr className="bg-slate-50 font-bold text-xs">
              <td className="p-3 text-slate-800 font-black">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Tổng Calo / Ngày</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                  Chuẩn: 615 - 726 Kcal
                </span>
              </td>
              {days.map((day) => {
                const nutri = getDailyNutrition(day.dayOfWeek);
                return (
                  <td key={day.dayOfWeek} className="p-3 text-center border-l border-slate-200">
                    <span className="text-sm font-black text-slate-900 block tracking-tight">
                      {nutri.calo > 0 ? `${nutri.calo.toFixed(1)} Kcal` : '0 Kcal'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                        nutri.statusType === 'optimal'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                          : nutri.statusType === 'empty'
                          ? 'bg-slate-200 text-slate-500'
                          : nutri.statusType === 'warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {nutri.statusText}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* DÒNG 2: KHỐI LƯỢNG DINH DƯỠNG (GRAM P - L - G) */}
            <tr className="bg-white text-xs border-t border-slate-200">
              <td className="p-3 text-slate-700 font-bold">
                <div className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Khối lượng chất (g)</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400 block mt-0.5">
                  Đạm (P) • Béo (L) • Đường (G)
                </span>
              </td>
              {days.map((day) => {
                const nutri = getDailyNutrition(day.dayOfWeek);
                return (
                  <td key={day.dayOfWeek} className="p-2.5 text-center border-l border-slate-200 align-middle">
                    {nutri.calo > 0 ? (
                      <div className="flex flex-col gap-1 text-[11px] font-semibold">
                        <div className="flex items-center justify-between px-2 py-0.5 bg-blue-50/80 text-blue-900 rounded-lg">
                          <span className="text-[10px] font-bold text-blue-600">Đạm (P):</span>
                          <span>{nutri.p.toFixed(1)}g</span>
                        </div>
                        <div className="flex items-center justify-between px-2 py-0.5 bg-amber-50/80 text-amber-900 rounded-lg">
                          <span className="text-[10px] font-bold text-amber-600">Béo (L):</span>
                          <span>{nutri.l.toFixed(1)}g</span>
                        </div>
                        <div className="flex items-center justify-between px-2 py-0.5 bg-emerald-50/80 text-emerald-900 rounded-lg">
                          <span className="text-[10px] font-bold text-emerald-600">Đường (G):</span>
                          <span>{nutri.g.toFixed(1)}g</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">-</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* DÒNG 3: CƠ CẤU NĂNG LƯỢNG P : L : G (%) & THANH TỶ LỆ TRỰC QUAN */}
            <tr className="bg-slate-50/80 text-xs border-t border-slate-200">
              <td className="p-3 text-slate-700 font-bold">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cơ cấu P : L : G (%)</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400 block mt-0.5">
                  Chuẩn: 13-20% : 25-35% : 52-60%
                </span>
              </td>
              {days.map((day) => {
                const nutri = getDailyNutrition(day.dayOfWeek);
                return (
                  <td key={day.dayOfWeek} className="p-2.5 text-center border-l border-slate-200 align-middle">
                    {nutri.calo > 0 ? (
                      <div className="space-y-1.5">
                        {/* Thanh mini ratio bar 3 màu */}
                        <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 shadow-inner">
                          <div
                            style={{ width: `${nutri.pPct}%` }}
                            className="bg-blue-600 h-full"
                            title={`Đạm (P): ${nutri.pPct}%`}
                          />
                          <div
                            style={{ width: `${nutri.lPct}%` }}
                            className="bg-amber-500 h-full"
                            title={`Béo (L): ${nutri.lPct}%`}
                          />
                          <div
                            style={{ width: `${nutri.gPct}%` }}
                            className="bg-emerald-500 h-full"
                            title={`Đường (G): ${nutri.gPct}%`}
                          />
                        </div>
                        <div className="text-[11px] font-black text-slate-800 tracking-tight">
                          <span className="text-blue-700" title="Tỷ lệ Đạm (P)">{nutri.pPct}%</span>
                          <span className="text-slate-400 mx-1">:</span>
                          <span className="text-amber-700" title="Tỷ lệ Béo (L)">{nutri.lPct}%</span>
                          <span className="text-slate-400 mx-1">:</span>
                          <span className="text-emerald-700" title="Tỷ lệ Đường (G)">{nutri.gPct}%</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal kiểm tra công thức & nguyên liệu chi tiết */}
      <RecipeInspectionModal
        isOpen={!!inspectingDish}
        onClose={() => setInspectingDish(null)}
        menuDish={inspectingDish?.menuDish || null}
        dayLabel={inspectingDish?.dayLabel || ''}
        slotName={inspectingDish?.slotName || ''}
        allergyConflicts={
          inspectingDish
            ? advisory?.allergyConflicts?.filter((c) => c.menuDishId === inspectingDish.menuDish.id) || []
            : []
        }
        onOpenAdvisory={
          inspectingDish && onOpenAdvisoryForDish
            ? () => onOpenAdvisoryForDish(inspectingDish.menuDish.id)
            : onOpenAdvisoryModal
        }
        onEdit={
          !readOnly && inspectingDish
            ? () => {
                const md = inspectingDish.menuDish;
                onOpenDishDrawer({
                  dayOfWeek: md.dayOfWeek,
                  mealTime: md.mealTime,
                  existingDish: md,
                });
              }
            : undefined
        }
      />
    </div>
  );
};
