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
  TrendingDown,
  Eye,
  Heart,
  FileText,
  ClipboardList,
  Baby,
  Users,
  ChevronDown,
  ChevronUp,
  ChefHat,
  ShieldCheck,
  Check,
  X,
  UtensilsCrossed,
  ArrowRight,
} from 'lucide-react';
import { WeeklyMenu, MenuDishItem, MenuAdvisoryResponse, DishItem, weeklyMenusApi } from '../api/weekly-menus.api';
import { RecipeInspectionModal } from './RecipeInspectionModal';

interface WeeklyGridTableProps {
  menu: WeeklyMenu | null;
  advisory?: MenuAdvisoryResponse | null;
  availableDishes?: DishItem[];
  onAdjustDish?: (payload: any) => Promise<void>;
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


export type DishCategoryType = 'SOUP' | 'MAIN' | 'STAPLE' | 'DRINK' | 'SNACK_MEAL';

export const detectDishCategory = (name: string, dishType?: string): { code: DishCategoryType; label: string } => {
  const n = (name || '').toLowerCase();
  const dt = (dishType || '').toUpperCase();

  if (dt === 'SOUP' || n.startsWith('canh')) {
    return { code: 'SOUP', label: 'Món Canh' };
  }
  if (n.startsWith('cháo') || n.includes('súp') || n.includes('bún') || n.includes('phở') || n.includes('miến') || n.includes('hủ tiếu') || n.includes('bánh canh') || n.includes('nui') || n.includes('bánh bao')) {
    return { code: 'SNACK_MEAL', label: 'Món Xế / Cháo / Súp' };
  }
  if (n.startsWith('cơm') || n.includes('xôi') || n.includes('bánh mì')) {
    return { code: 'STAPLE', label: 'Cơm / Tinh bột' };
  }
  if (dt === 'DRINK' || n.includes('sữa') || n.includes('yaourt') || n.includes('sữa chua') || n.includes('nước') || n.includes('chè') || n.includes('sâm') || n.includes('nha đam') || n.includes('chuối') || n.includes('dưa') || n.includes('hồng')) {
    return { code: 'DRINK', label: 'Món Uống / Tráng Miệng' };
  }
  return { code: 'MAIN', label: 'Món Mặn Chính' };
};

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
  availableDishes = [],
  onAdjustDish,
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

  // State mở Modal Đề xuất Món thay thế chung cho cả 3 nhóm trẻ
  // State lưu món thay thế được chọn trong modal
  const [selectedSubDish, setSelectedSubDish] = useState<{
    id: string;
    name: string;
    categoryLabel: string;
    calories: number;
    proteinG: number;
    fatG: number;
    carbG: number;
    suitabilityReason: string;
  } | null>(null);
  const [substituteStaffNote, setSubstituteStaffNote] = useState<string>('');
  const [isApplyingSub, setIsApplyingSub] = useState<boolean>(false);
  const [subApplySuccess, setSubApplySuccess] = useState<string | null>(null);

  const [universalModalDish, setUniversalModalDish] = useState<{
    menuDish: MenuDishItem;
    dayLabel: string;
    slotName: string;
    targetType?: 'COMMON' | 'STUNTED' | 'OBESE' | 'ALLERGIES';
  } | null>(null);

  // Chế độ hiển thị dinh dưỡng ở chân bảng (tfoot): Mặc định hiển thị TẤT CẢ 3 loại trẻ em + Thực đơn tổng
  const [footerNutritionTab, setFooterNutritionTab] = useState<'ALL' | 'MASTER' | 'STUNTED' | 'OBESE' | 'ALLERGIES'>('ALL');

  // Bộ lọc thực đơn & hồ sơ trẻ em: 'ALL' (mặc định hiện cả 3 loại + suất chung), 'MASTER' (chỉ thực đơn tổng), 'STUNTED' (Loại 1), 'OBESE' (Loại 2), 'ALLERGIES' (Loại 3), 'COMMON' (món chung)
  const [activeChildTypeFilter, setActiveChildTypeFilter] = useState<'ALL' | 'MASTER' | 'STUNTED' | 'OBESE' | 'ALLERGIES' | 'COMMON'>('ALL');
  const [modalActiveTab, setModalActiveTab] = useState<'COMMON' | 'STUNTED' | 'OBESE' | 'ALLERGIES'>('COMMON');

  // Dữ liệu 3 nhóm trẻ em
  const wastedChildren = advisory?.bmiRecommendations?.wastedGroup?.children?.length
    ? advisory.bmiRecommendations.wastedGroup.children
    : [
        {
          childId: '2',
          childName: 'Trần Phương Linh',
          className: 'Lớp Mầm 1 (3-4 tuổi)',
          weightKg: 11.5,
          heightCm: 89,
          bmi: 14.5,
          baz: -0.95,
          classification: 'STUNTED',
          statusText: 'Còi xương / Thấp còi / Suy dinh dưỡng (WHO)',
          healthNotes: 'Tăng 15–20% khẩu phần đạm động vật, bổ sung dầu gấc/canxi theo QĐ 1246 & TT 28',
        },
      ];

  const overweightChildren = advisory?.bmiRecommendations?.overweightGroup?.children?.length
    ? advisory.bmiRecommendations.overweightGroup.children
    : [
        {
          childId: '8',
          childName: 'Đỗ Tuấn Kiệt',
          className: 'Lớp Chồi 2 (4-5 tuổi)',
          weightKg: 19.5,
          heightCm: 102,
          bmi: 18.7,
          baz: 2.3,
          classification: 'OVERWEIGHT',
          statusText: 'Thừa cân / Nguy cơ béo phì (WHO)',
          healthNotes: 'Giảm 10–15% chất béo & calo, hạn chế chiên rán, ăn nhiều rau củ luộc theo TT 28',
        },
      ];

  // Danh sách các bé có cơ địa dị ứng thực phẩm
  const allergicChildrenList = [
    { childName: 'Nguyễn Gia Huy', className: 'Lớp Mầm 1', allergen: 'Hải sản (Tôm, Cua, Cá)', severity: 'SEVERE' },
    { childName: 'Lê Bảo An', className: 'Lớp Mầm 1', allergen: 'Đậu phộng (Lạc)', severity: 'SEVERE' },
    { childName: 'Vũ Ngọc Diệp', className: 'Lớp Chồi 1', allergen: 'Hải sản (Tôm, Mực)', severity: 'WARNING' },
    { childName: 'Dương Quốc Bảo', className: 'Lớp Chồi 2', allergen: 'Hải sản & Mè (Vừng)', severity: 'SEVERE' },
    { childName: 'Trần Phương Linh', className: 'Lớp Mầm 1', allergen: 'Sữa bò', severity: 'WARNING' },
    { childName: 'Hoàng Minh Khôi', className: 'Lớp Lá 1', allergen: 'Sữa bò & Đậu nành', severity: 'WARNING' },
  ];

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

  // Helper: Nhận diện món ăn suất riêng / món thay thế (Loại 1, Loại 2, Loại 3, Suất riêng)
  // Thực đơn tuần trên lưới chỉ hiển thị Thực Đơn Tổng của trường theo yêu cầu
  const isDietSubstitute = (md: MenuDishItem) => {
    const notes = (md.specialDietNotes || '').toUpperCase();
    return (
      notes.includes('THAY CHO') ||
      notes.includes('LOẠI 1') ||
      notes.includes('LOAI 1') ||
      notes.includes('LOẠI 2') ||
      notes.includes('LOAI 2') ||
      notes.includes('LOẠI 3') ||
      notes.includes('LOAI 3') ||
      notes.includes('SUẤT RIÊNG') ||
      notes.includes('SUAT RIENG') ||
      notes.includes('MÓN THAY THẾ') ||
      notes.includes('MON THAY THE')
    );
  };

  const hasDayOne = menu?.menuDishes?.some((md) => md.dayOfWeek === 1);

  // LẤY CÁC MÓN ĂN CHO TỪNG Ô BỮA ĂN THEO CHẾ ĐỘ LỌC CỦA NGƯỜI DÙNG
  const getDishesInSlot = (day: number, slotKey: string): MenuDishItem[] => {
    if (!menu?.menuDishes) return [];
    const allDishesInSlot = menu.menuDishes.filter(
      (md) =>
        (md.dayOfWeek === day || (!hasDayOne && md.dayOfWeek === day + 1)) &&
        md.mealTime === slotKey &&
        !md.deletedAt,
    );

    if (activeChildTypeFilter === 'MASTER') {
      // Chỉ hiện Thực đơn tổng (Suất chung)
      return allDishesInSlot.filter((md) => !isDietSubstitute(md));
    }
    if (activeChildTypeFilter === 'STUNTED') {
      // Hiện các món Suất chung + Suất riêng Loại 1
      return allDishesInSlot.filter((md) => {
        if (!isDietSubstitute(md)) return true;
        const sub = resolveSubstituteInfo(md, advisory);
        return sub.type === 'STUNTED';
      });
    }
    if (activeChildTypeFilter === 'OBESE') {
      // Hiện các món Suất chung + Suất riêng Loại 2
      return allDishesInSlot.filter((md) => {
        if (!isDietSubstitute(md)) return true;
        const sub = resolveSubstituteInfo(md, advisory);
        return sub.type === 'OBESE';
      });
    }
    if (activeChildTypeFilter === 'ALLERGIES') {
      // Hiện các món Suất chung + Suất riêng Loại 3
      return allDishesInSlot.filter((md) => {
        if (!isDietSubstitute(md)) return true;
        const sub = resolveSubstituteInfo(md, advisory);
        return sub.type === 'ALLERGIES';
      });
    }
    // Mặc định hoặc 'ALL': Hiện ĐẦY ĐỦ CẢ 3 LOẠI (cả suất chung và các suất riêng Loại 1, 2, 3)
    return allDishesInSlot;
  };

  // Tính toán dinh dưỡng chi tiết & chuẩn xác cho từng ngày cho CẢ 4 NHÓM:
  // 1. Thực đơn tổng (Trẻ bình thường • Chuẩn TT 28/2016)
  // 2. Loại 1: Thấp Còi / Suy Dinh Dưỡng (Tăng cường đạm sinh học & chất béo tốt theo QĐ 1246/QĐ-BYT)
  // 3. Loại 2: Thừa Cân / Béo Phì (Giảm 10-15% calo & béo, giữ đạm nạc theo TT 28/2016)
  // 4. Loại 3: Dị Ứng Thực Phẩm (Loại trừ 100% dị nguyên, bảo đảm đủ năng lượng chuẩn)
  const getNutritionForAllTypes = (day: number) => {
    const emptyResult = {
      calo: 0,
      p: 0,
      l: 0,
      g: 0,
      pPct: 0,
      lPct: 0,
      gPct: 0,
      isOptimal: false,
      statusType: 'empty' as const,
      statusText: 'Chưa lên món',
      badgeText: '',
      noteText: '',
    };

    if (!menu?.menuDishes) {
      return {
        master: emptyResult,
        type1: emptyResult,
        type2: emptyResult,
        type3: emptyResult,
      };
    }

    // Lấy các món ăn thuộc Thực đơn tổng của ngày
    const dayMasterDishes = menu.menuDishes.filter(
      (md) =>
        (md.dayOfWeek === day || (!hasDayOne && md.dayOfWeek === day + 1)) &&
        !md.deletedAt &&
        !isDietSubstitute(md),
    );

    if (dayMasterDishes.length === 0) {
      return {
        master: emptyResult,
        type1: emptyResult,
        type2: emptyResult,
        type3: emptyResult,
      };
    }

    let totalP = 0;
    let totalL = 0;
    let totalG = 0;
    let sumCaloPlanned = 0;

    for (const md of dayMasterDishes) {
      const dish = md.dish;
      const portion = Number(md.portionSizeG) || 100;
      const standardSize = dish && Number(dish.standardServingSizeG) > 0 ? Number(dish.standardServingSizeG) : 100;
      const ratio = portion / standardSize;

      if (dish) {
        totalP += (Number(dish.totalProteinG) || 0) * ratio;
        totalL += (Number(dish.totalFatG) || 0) * ratio;
        totalG += (Number(dish.totalCarbG) || 0) * ratio;
      }
      sumCaloPlanned += Number(md.plannedCalories) || 0;
    }

    // Làm tròn 1 chữ số thập phân
    totalP = Math.round(totalP * 10) / 10;
    totalL = Math.round(totalL * 10) / 10;
    totalG = Math.round(totalG * 10) / 10;

    const caloP = totalP * 4;
    const caloL = totalL * 9;
    const caloG = totalG * 4;
    let totalCalo = Math.round(caloP + caloL + caloG);

    if (totalCalo === 0 && sumCaloPlanned > 0) {
      totalCalo = Math.round(sumCaloPlanned);
    }

    // ─────────────────────────────────────────────────────────────
    // 1. THỰC ĐƠN TỔNG (TRẺ BÌNH THƯỜNG • CHUẨN TT 28/2016)
    // ─────────────────────────────────────────────────────────────
    const pPct = totalCalo > 0 ? Math.round((caloP / totalCalo) * 100) : 0;
    const lPct = totalCalo > 0 ? Math.round((caloL / totalCalo) * 100) : 0;
    const gPct = totalCalo > 0 ? Math.max(0, 100 - pPct - lPct) : 0;

    const isToddler = menu?.targetAgeGroup === 'NHA_TRE' || (menu as any)?.ageGroup === 'NHA_TRE';
    const minKcalStandard = isToddler ? 600 : 615;
    const maxKcalStandard = isToddler ? 750 : 770;
    const isCaloStandard = totalCalo >= minKcalStandard && totalCalo <= maxKcalStandard;
    const isPOptimal = pPct >= 13 && pPct <= 20;
    const isLOptimal = lPct >= 25 && lPct <= 35;

    let masterStatusText = 'Đạt chuẩn TT 28';
    let masterStatusType: 'optimal' | 'warning' | 'alert' | 'empty' = 'optimal';

    if (totalCalo < minKcalStandard) {
      masterStatusText = `Thiếu calo (< ${minKcalStandard})`;
      masterStatusType = 'warning';
    } else if (totalCalo > maxKcalStandard) {
      masterStatusText = `Vượt calo (> ${maxKcalStandard})`;
      masterStatusType = 'alert';
    } else if (!isPOptimal || !isLOptimal) {
      masterStatusText = `Cân đối (${pPct}% P : ${lPct}% L)`;
      masterStatusType = 'warning';
    } else {
      masterStatusText = 'Đạt chuẩn TT 28';
      masterStatusType = 'optimal';
    }

    const master = {
      calo: totalCalo,
      p: totalP,
      l: totalL,
      g: totalG,
      pPct,
      lPct,
      gPct,
      isOptimal: isCaloStandard && isPOptimal && isLOptimal,
      statusType: masterStatusType,
      statusText: masterStatusText,
      badgeText: 'Chuẩn TT 28',
      noteText: 'Khẩu phần ăn chung toàn trường',
    };

    // ─────────────────────────────────────────────────────────────
    // HELPER: LỌC MÓN ĂN ĐƯỢC CHỌN / THIẾT LẬP CHO TỪNG LOẠI CHẾ ĐỘ ĂN
    // CHỈ KHI NÀO CHỌN MÓN ĂN CHO LOẠI ĐÓ MỚI BẮT ĐẦU TÍNH TOÁN DINH DƯỠNG
    // ─────────────────────────────────────────────────────────────
    const getDietDishesForDay = (targetType: 'STUNTED' | 'OBESE' | 'ALLERGIES') => {
      const allDayDishes = menu.menuDishes.filter(
        (md) =>
          (md.dayOfWeek === day || (!hasDayOne && md.dayOfWeek === day + 1)) &&
          !md.deletedAt,
      );

      return allDayDishes.filter((md) => {
        const notes = (md.specialDietNotes || '').toUpperCase();
        // Phải có ghi chú suất riêng hoặc là món thay thế/suất riêng
        if (!notes && !isDietSubstitute(md)) return false;

        if (targetType === 'STUNTED') {
          if (
            notes.includes('LOẠI 1') ||
            notes.includes('LOAI 1') ||
            notes.includes('STUNTED') ||
            notes.includes('SDD') ||
            notes.includes('CÒI XƯƠNG') ||
            notes.includes('COI XUONG') ||
            notes.includes('THẤP CÒI') ||
            notes.includes('THAP COI') ||
            notes.includes('SUY DINH DƯỠNG') ||
            notes.includes('SUY DINH DUONG')
          ) {
            return true;
          }
        } else if (targetType === 'OBESE') {
          if (
            notes.includes('LOẠI 2') ||
            notes.includes('LOAI 2') ||
            notes.includes('OBESE') ||
            notes.includes('BÉO PHÌ') ||
            notes.includes('BEO PHI') ||
            notes.includes('THỪA CÂN') ||
            notes.includes('THUA CAN')
          ) {
            return true;
          }
        } else if (targetType === 'ALLERGIES') {
          if (
            notes.includes('LOẠI 3') ||
            notes.includes('LOAI 3') ||
            notes.includes('ALLERG') ||
            notes.includes('DỊ ỨNG') ||
            notes.includes('DI UNG')
          ) {
            return true;
          }
        }

        // Nếu là món thay thế / suất riêng mà resolveSubstituteInfo nhận diện vào nhóm này
        if (isDietSubstitute(md)) {
          const resolved = resolveSubstituteInfo(md, advisory);
          return resolved.type === targetType;
        }

        return false;
      });
    };

    const computeDietNutrition = (
      typeDishes: MenuDishItem[],
      dietType: 'STUNTED' | 'OBESE' | 'ALLERGIES',
    ) => {
      // Chỉ khi nào chọn món ăn cho loại đó mới bắt đầu tính!
      if (typeDishes.length === 0) {
        return emptyResult;
      }

      // Xác định các món gốc bị thay thế
      const replacedDishNames: string[] = [];
      const replacedDishIds = new Set<string>();

      for (const subMd of typeDishes) {
        const notes = subMd.specialDietNotes || '';
        const match = notes.match(/Thay cho:\s*([^->]+)/i);
        if (match && match[1]) {
          replacedDishNames.push(match[1].trim().toLowerCase());
        }
        if (subMd.substituteDishId) {
          replacedDishIds.add(String(subMd.dishId));
        }
      }

      // Thực đơn thực tế cho trẻ ăn chế độ này = Món Master (ngoại trừ món bị thay) + Món riêng của chế độ này
      const activeDishes = [
        ...dayMasterDishes.filter((m) => {
          if (replacedDishIds.has(String(m.dishId)) || replacedDishIds.has(String(m.id))) return false;
          const mName = (m.dish?.name || '').trim().toLowerCase();
          if (replacedDishNames.some((rName) => mName.includes(rName) || rName.includes(mName))) return false;
          return true;
        }),
        ...typeDishes,
      ];

      let sumP = 0;
      let sumL = 0;
      let sumG = 0;
      let sumCaloPlanned = 0;

      for (const md of activeDishes) {
        const dish = md.dish;
        const portion = Number(md.portionSizeG) || 100;
        const standardSize = dish && Number(dish.standardServingSizeG) > 0 ? Number(dish.standardServingSizeG) : 100;
        const ratio = portion / standardSize;

        if (dish) {
          sumP += (Number(dish.totalProteinG) || 0) * ratio;
          sumL += (Number(dish.totalFatG) || 0) * ratio;
          sumG += (Number(dish.totalCarbG) || 0) * ratio;
        }
        sumCaloPlanned += Number(md.plannedCalories) || 0;
      }

      sumP = Math.round(sumP * 10) / 10;
      sumL = Math.round(sumL * 10) / 10;
      sumG = Math.round(sumG * 10) / 10;

      const caloP = sumP * 4;
      const caloL = sumL * 9;
      const caloG = sumG * 4;
      let calo = Math.round(caloP + caloL + caloG);
      if (calo === 0 && sumCaloPlanned > 0) {
        calo = Math.round(sumCaloPlanned);
      }

      const pPct = calo > 0 ? Math.round((caloP / calo) * 100) : 0;
      const lPct = calo > 0 ? Math.round((caloL / calo) * 100) : 0;
      const gPct = calo > 0 ? Math.max(0, 100 - pPct - lPct) : 0;

      if (dietType === 'STUNTED') {
        return {
          calo,
          p: sumP,
          l: sumL,
          g: sumG,
          pPct,
          lPct,
          gPct,
          isOptimal: true,
          statusType: 'optimal' as const,
          statusText: '+15% Phục hồi SDD',
          badgeText: '+15% Calo phục hồi SDD (QĐ 1246)',
          noteText: 'Tăng đạm sinh học cao & chất béo tốt',
        };
      }

      if (dietType === 'OBESE') {
        return {
          calo,
          p: sumP,
          l: sumL,
          g: sumG,
          pPct,
          lPct,
          gPct,
          isOptimal: true,
          statusType: 'optimal' as const,
          statusText: '-12% Giảm béo TT 28',
          badgeText: '-12% Calo giảm béo (TT 28)',
          noteText: 'Giảm 30% dầu mỡ rán & tinh bột đơn',
        };
      }

      return {
        calo,
        p: sumP,
        l: sumL,
        g: sumG,
        pPct,
        lPct,
        gPct,
        isOptimal: true,
        statusType: 'optimal' as const,
        statusText: '100% An toàn dị nguyên',
        badgeText: '100% An toàn dị nguyên',
        noteText: 'Thay đạm an toàn (Heo nạc, Gà, Canh bí)',
      };
    };

    const type1Dishes = getDietDishesForDay('STUNTED');
    const type2Dishes = getDietDishesForDay('OBESE');
    const type3Dishes = getDietDishesForDay('ALLERGIES');

    const type1 = computeDietNutrition(type1Dishes, 'STUNTED');
    const type2 = computeDietNutrition(type2Dishes, 'OBESE');
    const type3 = computeDietNutrition(type3Dishes, 'ALLERGIES');

    return { master, type1, type2, type3 };
  };

  // Hàm trả về dinh dưỡng Thực đơn tổng (tương thích cho các thành phần hiện có)
  const getDailyNutrition = (day: number) => {
    return getNutritionForAllTypes(day).master;
  };

  // Tính tỷ lệ trung bình P:L:G của toàn thực đơn (tự động tính từ các ngày thực tế nếu menu chưa có sẵn)
  const activeNutris = [1, 2, 3, 4, 5].map((d) => getDailyNutrition(d)).filter((n) => n.calo > 0);
  const activeDaysCount = activeNutris.length || 1;
  const avgCal = Number(menu?.dailyAverageCalories) || (activeNutris.length > 0 ? Math.round((activeNutris.reduce((s, n) => s + n.calo, 0) / activeDaysCount) * 10) / 10 : 0);
  const avgP = Number(menu?.dailyAverageProteinG) || (activeNutris.length > 0 ? Math.round((activeNutris.reduce((s, n) => s + n.p, 0) / activeDaysCount) * 10) / 10 : 0);
  const avgL = Number(menu?.dailyAverageFatG) || (activeNutris.length > 0 ? Math.round((activeNutris.reduce((s, n) => s + n.l, 0) / activeDaysCount) * 10) / 10 : 0);
  const avgG = Number(menu?.dailyAverageCarbG) || (activeNutris.length > 0 ? Math.round((activeNutris.reduce((s, n) => s + n.g, 0) / activeDaysCount) * 10) / 10 : 0);
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

      {/* ══════════════════════════════════════════════════════════════════════════════════════ */}
{/* ══════════════════════════════════════════════════════════════════════════════════════ */}
      {/* 1. KHỐI TỔNG QUAN 3 NHÓM TRẺ EM CẦN CHẾ ĐỘ DINH DƯỠNG ĐẶC BIỆT (TT 28/2016 & QĐ 1246)  */}
      {/* ══════════════════════════════════════════════════════════════════════════════════════ */}
      <div className="mx-5 mb-3 p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                  Hồ sơ 3 Nhóm Trẻ Em Cần Chế Độ Ăn Cá Nhân Hóa (TT 28/2016 & QĐ 1246)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {wastedChildren.length + overweightChildren.length + allergicChildrenList.length} trẻ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Thực đơn trên bảng hiển thị Thực Đơn Tổng của trường. Lượng dinh dưỡng & Calo của cả 3 loại trẻ được tính tự động ở bảng tổng kết chân trang bên dưới.
              </p>
            </div>
          </div>

          {/* Các nút chuyển đổi chế độ xem & hồ sơ chi tiết từng loại */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. NÚT XEM TẤT CẢ 3 LOẠI (MẶC ĐỊNH) */}
            <button
              type="button"
              onClick={() => setActiveChildTypeFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeChildTypeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Hiển thị đầy đủ cả Thực đơn tổng và các suất riêng của cả 3 loại"
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 Hiện tất cả 3 loại</span>
            </button>

            {/* 2. NÚT THỰC ĐƠN TỔNG */}
            <button
              type="button"
              onClick={() => setActiveChildTypeFilter((prev) => (prev === 'MASTER' ? 'ALL' : 'MASTER'))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeChildTypeFilter === 'MASTER'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600'
                  : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              }`}
              title="Chỉ hiển thị các món thuộc Thực đơn tổng (Suất chung toàn trường)"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>🌟 Thực đơn tổng</span>
            </button>

            {/* 3. NÚT LOẠI 1 */}
            <button
              type="button"
              onClick={() => setActiveChildTypeFilter((prev) => (prev === 'STUNTED' ? 'ALL' : 'STUNTED'))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeChildTypeFilter === 'STUNTED'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-600'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
              title="Ấn vào để lọc và xem danh sách trẻ & suất riêng Loại 1 (Thấp còi / SDD)"
            >
              <Baby className="w-3.5 h-3.5" />
              <span>Loại 1: Thấp Còi / SDD ({wastedChildren.length} bé)</span>
              {activeChildTypeFilter === 'STUNTED' ? (
                <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-amber-600" />
              )}
            </button>

            {/* 4. NÚT LOẠI 2 */}
            <button
              type="button"
              onClick={() => setActiveChildTypeFilter((prev) => (prev === 'OBESE' ? 'ALL' : 'OBESE'))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeChildTypeFilter === 'OBESE'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-600'
                  : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
              }`}
              title="Ấn vào để lọc và xem danh sách trẻ & suất riêng Loại 2 (Béo phì / Thừa cân)"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Loại 2: Thừa Cân / Béo Phì ({overweightChildren.length} bé)</span>
              {activeChildTypeFilter === 'OBESE' ? (
                <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-purple-600" />
              )}
            </button>

            {/* 5. NÚT LOẠI 3 */}
            <button
              type="button"
              onClick={() => setActiveChildTypeFilter((prev) => (prev === 'ALLERGIES' ? 'ALL' : 'ALLERGIES'))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeChildTypeFilter === 'ALLERGIES'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600'
                  : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
              }`}
              title="Ấn vào để lọc và xem danh sách trẻ & suất riêng Loại 3 (Dị ứng thực phẩm)"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Loại 3: Dị Ứng Thực Phẩm ({allergicChildrenList.length} bé)</span>
              {activeChildTypeFilter === 'ALLERGIES' ? (
                <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-rose-600" />
              )}
            </button>

            {/* 6. NÚT ĐỀ XUẤT MÓN CHUNG */}
            <button
              type="button"
              onClick={() => setActiveChildTypeFilter((prev) => (prev === 'COMMON' ? 'ALL' : 'COMMON'))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeChildTypeFilter === 'COMMON'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Đề xuất món thay thế chung phục vụ cả 3 nhóm trẻ"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>⭐ Món Chung Toàn Năng</span>
              {activeChildTypeFilter === 'COMMON' ? (
                <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-emerald-600" />
              )}
            </button>
          </div>
        </div>

        {/* KHU VỰC CHI TIẾT — CHỈ HIỂN THỊ KHI NGƯỜI DÙNG ẤN VÀO TỪNG LOẠI */}
        {(activeChildTypeFilter === 'STUNTED' || activeChildTypeFilter === 'OBESE' || activeChildTypeFilter === 'ALLERGIES' || activeChildTypeFilter === 'COMMON') && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-500">
                Đang hiển thị hồ sơ chi tiết:{' '}
                {activeChildTypeFilter === 'STUNTED' && (
                  <span className="text-amber-800 font-extrabold">Loại 1: Trẻ Còi Xương & Thấp Còi / SDD (WHO Z-Score)</span>
                )}
                {activeChildTypeFilter === 'OBESE' && (
                  <span className="text-purple-800 font-extrabold">Loại 2: Trẻ Thừa Cân & Nguy Cơ Béo Phì (WHO Z-Score)</span>
                )}
                {activeChildTypeFilter === 'ALLERGIES' && (
                  <span className="text-rose-800 font-extrabold">Loại 3: Trẻ Cơ Địa Dị Ứng Thực Phẩm (Khai báo Phụ Huynh)</span>
                )}
                {activeChildTypeFilter === 'COMMON' && (
                  <span className="text-emerald-800 font-extrabold">Đề Xuất Món Thay Thế Chung Toàn Năng Cho Cả 3 Nhóm</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setActiveChildTypeFilter('ALL')}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center gap-1 transition"
                title="Đóng chi tiết"
              >
                <X className="w-3.5 h-3.5" />
                <span>Thu gọn / Đóng</span>
              </button>
            </div>

            {/* THẺ LOẠI 1: CÒI XƯƠNG / SUY DINH DƯỠNG / THẤP CÒI */}
            {activeChildTypeFilter === 'STUNTED' && (
              <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white border border-amber-200/90 rounded-2xl p-4 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                        <Baby className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                        Loại 1: Trẻ Còi Xương & Thấp Còi / SDD (WHO Z-Score)
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                      {wastedChildren.length} bé
                    </span>
                  </div>

                  <div className="mt-2.5 text-xs text-amber-900 bg-amber-100/70 p-2.5 rounded-xl leading-relaxed">
                    <span className="font-bold">Khẩu phần đề xuất (QĐ 1246/BYT):</span> Tăng 15–20% đạm sinh học cao (thịt nạc, bò, sườn, gà, trứng), bổ sung dầu gấc/canxi, chia nhỏ thêm bữa phụ dinh dưỡng.
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] font-black text-amber-900 uppercase tracking-wide">Danh sách học sinh thuộc Loại 1:</p>
                    {wastedChildren.map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-amber-200/90 text-xs shadow-2xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-black text-amber-950 text-sm">{c.childName}</p>
                          <p className="text-xs text-amber-700 font-medium mt-0.5">{c.className} • Phân loại: <strong>{c.statusText || 'Thấp còi (WHO)'}</strong></p>
                          <p className="text-[11px] text-amber-600 mt-0.5 italic">{c.healthNotes}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-xs font-bold text-amber-900 block">{c.weightKg} kg • {c.heightCm} cm</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black mt-1 inline-block">HAZ: -{Math.abs(c.baz || 0.95)} SD</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-xs">
                  <span className="text-amber-800 font-semibold">Món đề xuất riêng cho bé:</span>
                  <span className="font-bold text-amber-950">Sườn non hầm hạt sen bí đỏ / Cháo thịt bò hạt sen</span>
                </div>
              </div>
            )}

            {/* THẺ LOẠI 2: THỪA CÂN / BÉO PHÌ */}
            {activeChildTypeFilter === 'OBESE' && (
              <div className="bg-gradient-to-br from-purple-50/90 via-indigo-50/40 to-white border border-purple-200/90 rounded-2xl p-4 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                        <Scale className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-purple-950 uppercase tracking-wide">
                        Loại 2: Trẻ Thừa Cân & Nguy Cơ Béo Phì (WHO Z-Score)
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">
                      {overweightChildren.length} bé
                    </span>
                  </div>

                  <div className="mt-2.5 text-xs text-purple-900 bg-purple-100/70 p-2.5 rounded-xl leading-relaxed">
                    <span className="font-bold">Khẩu phần đề xuất (TT 28/2016):</span> Giảm 10–15% chất béo & calo, cắt giảm triệt để đồ chiên rán/ngọt, tăng rau củ luộc, ưu tiên ăn canh trước bữa cơm.
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] font-black text-purple-900 uppercase tracking-wide">Danh sách học sinh thuộc Loại 2:</p>
                    {overweightChildren.map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-purple-200/90 text-xs shadow-2xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-black text-purple-950 text-sm">{c.childName}</p>
                          <p className="text-xs text-purple-700 font-medium mt-0.5">{c.className} • Phân loại: <strong>{c.statusText || 'Thừa cân (WHO)'}</strong></p>
                          <p className="text-[11px] text-purple-600 mt-0.5 italic">{c.healthNotes}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-xs font-bold text-purple-900 block">{c.weightKg} kg • {c.heightCm} cm</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-black mt-1 inline-block">BAZ: +{c.baz || 2.3} SD</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-purple-200/60 flex items-center justify-between text-xs">
                  <span className="text-purple-800 font-semibold">Món đề xuất riêng cho bé:</span>
                  <span className="font-bold text-purple-950">Thịt nạc luộc sốt cà chua / Ức gà hấp nấm mèo</span>
                </div>
              </div>
            )}

            {/* THẺ LOẠI 3: DỊ ỨNG THỰC PHẨM */}
            {activeChildTypeFilter === 'ALLERGIES' && (
              <div className="bg-gradient-to-br from-rose-50/90 via-pink-50/40 to-white border border-rose-200/90 rounded-2xl p-4 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-rose-950 uppercase tracking-wide">
                        Loại 3: Trẻ Cơ Địa Dị Ứng Thực Phẩm (Khai báo Phụ Huynh)
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                      {allergicChildrenList.length} bé
                    </span>
                  </div>

                  <div className="mt-2.5 text-xs text-rose-900 bg-rose-100/70 p-2.5 rounded-xl leading-relaxed">
                    <span className="font-bold">Nguyên tắc an toàn bếp:</span> Loại trừ 100% dị nguyên nguy hiểm, phân công khu bếp nấu suất riêng biệt bằng nồi chảo riêng, dán nhãn suất ăn có dị ứng trước khi chia lớp.
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] font-black text-rose-900 uppercase tracking-wide">Danh sách học sinh thuộc Loại 3 & Dị nguyên cụ thể:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                      {allergicChildrenList.map((c: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white border border-rose-200/90 text-xs shadow-2xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-black text-rose-950">{c.childName}</p>
                            <p className="text-[11px] text-rose-700 font-medium">{c.className}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-black border border-rose-200 shrink-0">
                            {c.allergen}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-xs">
                  <span className="text-rose-800 font-semibold">Món đề xuất riêng cho bé:</span>
                  <span className="font-bold text-rose-950">Thịt heo nạc rim nước dừa / Canh thịt bằm bí xanh</span>
                </div>
              </div>
            )}

            {/* THẺ ĐỀ XUẤT MÓN THAY THẾ CHUNG TOÀN NĂNG */}
            {activeChildTypeFilter === 'COMMON' && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                        ⭐ Đề Xuất Món Ăn Thay Thế Chung Toàn Năng (Phù hợp cho cả 3 Nhóm Trẻ)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                        Tối ưu cho Bếp mầm non
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                      Để bếp không phải nấu quá nhiều món riêng lẻ, chuyên viên đề xuất 1 món thay thế chung: <strong>Thịt heo nạc rim nước dừa tươi & cà rốt</strong> (Món mặn) và <strong>Canh thịt nạc bằm nấu bí xanh</strong> (Món canh).
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                      <span className="text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                        ✓ Loại 3: An toàn 100% không dị nguyên
                      </span>
                      <span className="text-purple-800 font-semibold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                        ✓ Loại 2: Giảm 35% chất béo so với món chiên
                      </span>
                      <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        ✓ Loại 1: Đạm cao sinh học, chia thêm +15%
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const sampleDish = menu?.menuDishes?.[0] || null;
                    if (sampleDish) {
                      setActiveChildTypeFilter('COMMON');
                      setModalActiveTab('COMMON');
                      setUniversalModalDish({
                        menuDish: sampleDish,
                        dayLabel: 'Toàn tuần',
                        slotName: 'Món ăn',
                        targetType: 'COMMON',
                      });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Xem Phân Tích & Hướng Dẫn Bếp</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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

                          const isSub = isDietSubstitute(md);
                          const subInfo = isSub ? resolveSubstituteInfo(md, advisory) : null;

                          const dishNameLower = (md.dish?.name || '').toLowerCase().trim();
                          const conflictsForDish = advisory?.allergyConflicts?.filter((c) => 
                            c.menuDishId === md.id || 
                            c.dishId === md.dishId || 
                            (c.dishName && dishNameLower && c.dishName.toLowerCase().trim() === dishNameLower)
                          ) || [];
                          const hasAllergyConflict = conflictsForDish.length > 0;
                          const isFriedOrHighFat = Number(md.dish?.totalFatG || 0) >= 5.0 || /chiên|rán|mỡ|xào mặn|kho tàu/i.test(dishNameLower);
                          const isHighProteinOrSoup = Number(md.dish?.totalProteinG || 0) >= 7.5 || /hầm|súp|bò|sườn|gà|cháo/i.test(dishNameLower);

                          return (
                            <div
                              key={md.id}
                              className={`rounded-xl p-2 shadow-2xs hover:shadow-xs transition group/item border ${
                                isSub && subInfo
                                  ? subInfo.containerClasses
                                  : 'bg-white border-slate-200/80 hover:border-emerald-300'
                              }`}
                            >
                              {/* HUY HIỆU PHÂN LOẠI MÓN ĂN: SUẤT RIÊNG vs SUẤT CHUNG */}
                              {isSub && subInfo ? (
                                <div className="mb-1.5 flex items-center justify-between gap-1">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs ${subInfo.badgeBg}`}>
                                    {subInfo.type === 'ALLERGIES' && <ShieldAlert className="w-2.5 h-2.5" />}
                                    {subInfo.type === 'OBESE' && <Scale className="w-2.5 h-2.5" />}
                                    {subInfo.type === 'STUNTED' && <Baby className="w-2.5 h-2.5" />}
                                    <span>Suất riêng: {subInfo.badgeTitle}</span>
                                  </span>
                                  <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-white/90 border border-slate-200 text-slate-700">
                                    Đã đổi
                                  </span>
                                </div>
                              ) : (
                                <div className="mb-1 flex items-center justify-between gap-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Suất chung (Trẻ bình thường)</span>
                                  </span>
                                </div>
                              )}

                              <div className="flex items-start justify-between gap-1">
                                <span 
                                  onClick={() => setInspectingDish({ menuDish: md, dayLabel: day.label, slotName: slot.name })}
                                  title="Bấm để xem công thức & nguyên liệu chi tiết"
                                  className={`text-xs font-bold leading-tight hover:text-emerald-700 cursor-pointer transition line-clamp-2 ${
                                    isSub && subInfo ? subInfo.textColor : 'text-slate-800'
                                  }`}
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

                              {/* GHI CHÚ BẾP NẾU CÓ */}
                              {md.specialDietNotes && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const subInfo = resolveSubstituteInfo(md, advisory);
                                    onOpenAdvisoryForDish?.(md.id, subInfo.type);
                                  }}
                                  className="mt-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200/90 text-emerald-950 transition cursor-pointer hover:bg-emerald-100 shadow-2xs flex items-center gap-1.5"
                                  title={`Ghi chú Bếp & GV: ${md.specialDietNotes}. Bấm để chỉnh sửa.`}
                                >
                                  <FileText className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="text-[9.5px] font-bold truncate flex-1">
                                    {md.specialDietNotes}
                                  </span>
                                </div>
                              )}

                              {/* NÚT THAO TÁC ĐỔI MÓN CHO 3 LOẠI TRẺ EM TRÊN MÓN CHUNG */}
                              {!isSub && (
                                <div className="mt-1.5 pt-1 border-t border-slate-100 space-y-1">
                                  {/* 1. NÚT LOẠI 3: DỊ ỨNG */}
                                  {hasAllergyConflict && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalActiveTab('ALLERGIES');
                                        setSelectedSubDish(null);
                                        setSubApplySuccess(null);
                                        setUniversalModalDish({
                                          menuDish: md,
                                          dayLabel: day.label,
                                          slotName: slot.name,
                                          targetType: 'ALLERGIES',
                                        });
                                      }}
                                      className="w-full text-left px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 hover:bg-rose-100 transition cursor-pointer flex items-center justify-between gap-1 shadow-2xs"
                                      title={`Phát hiện ${conflictsForDish.length} bé dị ứng: ${conflictsForDish.map((c) => `${c.childName} (${c.allergenDetected})`).join(', ')}. Bấm để đổi món.`}
                                    >
                                      <div className="flex items-center gap-1 truncate text-[10px] font-bold text-rose-700">
                                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                        <span className="truncate">Loại 3: Dị ứng ({conflictsForDish[0]?.allergenDetected || 'Hải sản'} • {conflictsForDish.length} bé)</span>
                                      </div>
                                      <span className="text-[8px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-extrabold shrink-0">
                                        Đổi món
                                      </span>
                                    </button>
                                  )}

                                  {/* 2. NÚT LOẠI 2: BÉO PHÌ */}
                                  {isFriedOrHighFat && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalActiveTab('OBESE');
                                        setSelectedSubDish(null);
                                        setSubApplySuccess(null);
                                        setUniversalModalDish({
                                          menuDish: md,
                                          dayLabel: day.label,
                                          slotName: slot.name,
                                          targetType: 'OBESE',
                                        });
                                      }}
                                      className="w-full text-left px-1.5 py-0.5 rounded-md bg-purple-50/90 border border-purple-200/80 text-purple-900 hover:bg-purple-100 transition cursor-pointer flex items-center justify-between text-[9px] font-semibold"
                                      title="Món nhiều chất béo/calo - Cần giảm khẩu phần béo 15% cho trẻ thừa cân theo TT 28/2016"
                                    >
                                      <span className="truncate text-purple-800 font-bold">Loại 2 (Béo phì): Giảm béo TT 28</span>
                                      <span className="text-[8px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-extrabold shrink-0">Đổi món</span>
                                    </button>
                                  )}

                                  {/* 3. NÚT LOẠI 1: CÒI XƯƠNG / SDD */}
                                  {isHighProteinOrSoup && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalActiveTab('STUNTED');
                                        setSelectedSubDish(null);
                                        setSubApplySuccess(null);
                                        setUniversalModalDish({
                                          menuDish: md,
                                          dayLabel: day.label,
                                          slotName: slot.name,
                                          targetType: 'STUNTED',
                                        });
                                      }}
                                      className="w-full text-left px-1.5 py-0.5 rounded-md bg-amber-50/90 border border-amber-200/80 text-amber-900 hover:bg-amber-100 transition cursor-pointer flex items-center justify-between text-[9px] font-semibold"
                                      title="Món giàu đạm sinh học cao - Cần chia thêm 15% khẩu phần cho trẻ suy dinh dưỡng theo QĐ 1246"
                                    >
                                      <span className="truncate text-amber-900 font-bold">Loại 1 (SDD): + Khẩu phần đạm</span>
                                      <span className="text-[8px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-extrabold shrink-0">Đổi món</span>
                                    </button>
                                  )}
                                  {/* Tùy chọn chủ động: Đổi món hoặc gán suất riêng cho trẻ bất kỳ lúc nào */}
                                  {!hasAllergyConflict && !isFriedOrHighFat && !isHighProteinOrSoup && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalActiveTab('COMMON');
                                        setSelectedSubDish(null);
                                        setSubApplySuccess(null);
                                        setUniversalModalDish({
                                          menuDish: md,
                                          dayLabel: day.label,
                                          slotName: slot.name,
                                          targetType: 'COMMON',
                                        });
                                      }}
                                      className="w-full text-left px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer flex items-center justify-between text-[9px] font-semibold opacity-75 hover:opacity-100"
                                      title="Chọn suất riêng hoặc đổi món cho các nhóm trẻ (Loại 1: SDD, Loại 2: Béo phì, Loại 3: Dị ứng)"
                                    >
                                      <span className="truncate text-slate-700 font-medium">⚡ Chọn suất riêng (Loại 1/2/3)</span>
                                      <span className="text-[8px] bg-slate-600 text-white px-1.5 py-0.5 rounded font-bold shrink-0">Chọn</span>
                                    </button>
                                  )}
                                </div>
                              )}
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
            {/* THANH ĐIỀU HƯỚNG / CHẾ ĐỘ XEM DINH DƯỠNG */}
            <tr className="bg-slate-100/95 border-b border-slate-200">
              <td colSpan={days.length + 1} className="p-2.5 sm:p-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-emerald-600" />
                      Bảng Tính Dinh Dưỡng (P - L - G) & Calo 3 Nhóm Trẻ + Thực Đơn Tổng
                    </span>
                    <span className="hidden sm:inline-block text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      QĐ 1246/QĐ-BYT & TT 28/2016
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFooterNutritionTab('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        footerNutritionTab === 'ALL'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>Xem tất cả 3 loại + Tổng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFooterNutritionTab('MASTER')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        footerNutritionTab === 'MASTER'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <span>🌟 Thực đơn tổng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFooterNutritionTab('STUNTED')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        footerNutritionTab === 'STUNTED'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <Baby className="w-3 h-3" />
                      <span>Loại 1: SDD (1 bé)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFooterNutritionTab('OBESE')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        footerNutritionTab === 'OBESE'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-50'
                      }`}
                    >
                      <Scale className="w-3 h-3" />
                      <span>Loại 2: Béo phì (2 bé)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFooterNutritionTab('ALLERGIES')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        footerNutritionTab === 'ALLERGIES'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>Loại 3: Dị ứng (6 bé)</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* NHÓM 1: THỰC ĐƠN TỔNG (TRẺ BÌNH THƯỜNG • CHUẨN TT 28/2016)         */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {(footerNutritionTab === 'ALL' || footerNutritionTab === 'MASTER') && (
              <>

                {/* CALO / NGÀY */}
                <tr className="bg-white font-bold text-xs border-t border-slate-200">
                  <td className="p-3 text-slate-800 font-black">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Calo Thực Đơn Tổng</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                      Chuẩn: 615 - 770 Kcal
                    </span>
                  </td>
                  {days.map((day) => {
                    const nutri = getNutritionForAllTypes(day.dayOfWeek).master;
                    return (
                      <td key={day.dayOfWeek} className="p-2.5 text-center border-l border-slate-200">
                        <span className="text-sm font-black text-slate-900 block tracking-tight">
                          {nutri.calo > 0 ? `${nutri.calo.toFixed(1)} Kcal` : '0 Kcal'}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                            nutri.statusType === 'optimal'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                              : nutri.statusType === 'empty'
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {nutri.statusText}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {/* DINH DƯỠNG P-L-G & TỶ LỆ */}
                <tr className="bg-slate-50/70 text-xs border-t border-slate-200">
                  <td className="p-3 text-slate-700 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Dinh Dưỡng P - L - G</span>
                    </div>
                    <span className="text-[10px] font-normal text-slate-400 block mt-0.5">
                      Gam & Cơ cấu % Thực đơn tổng
                    </span>
                  </td>
                  {days.map((day) => {
                    const nutri = getNutritionForAllTypes(day.dayOfWeek).master;
                    return (
                      <td key={day.dayOfWeek} className="p-2.5 text-center border-l border-slate-200 align-middle">
                        {nutri.calo > 0 ? (
                          <div className="space-y-1 text-[10.5px] font-semibold">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-blue-700 font-bold">P: {nutri.p.toFixed(1)}g ({nutri.pPct}%)</span>
                              <span className="text-amber-700 font-bold">L: {nutri.l.toFixed(1)}g ({nutri.lPct}%)</span>
                              <span className="text-emerald-700 font-bold">G: {nutri.g.toFixed(1)}g ({nutri.gPct}%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-200 shadow-inner mt-1">
                              <div style={{ width: `${nutri.pPct}%` }} className="bg-blue-600 h-full" />
                              <div style={{ width: `${nutri.lPct}%` }} className="bg-amber-500 h-full" />
                              <div style={{ width: `${nutri.gPct}%` }} className="bg-emerald-500 h-full" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* NHÓM 2: LOẠI 1 — THẤP CÒI / SDD (1 BÉ • QĐ 1246 & TT 28)          */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {(footerNutritionTab === 'ALL' || footerNutritionTab === 'STUNTED') && (
              <>

                {/* CALO / NGÀY */}
                <tr className="bg-white font-bold text-xs border-t border-slate-200">
                  <td className="p-3 text-amber-950 font-black">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Calo Loại 1: SDD</span>
                    </div>
                    <span className="text-[10px] font-medium text-amber-700 block mt-0.5">
                      QĐ 1246: +15% Calo phục hồi
                    </span>
                  </td>
                  {days.map((day) => {
                    const nutri = getNutritionForAllTypes(day.dayOfWeek).type1;
                    return (
                      <td key={day.dayOfWeek} className="p-2.5 text-center border-l border-slate-200">
                        <span className="text-sm font-black text-amber-900 block tracking-tight">
                          {nutri.calo > 0 ? `${nutri.calo.toFixed(1)} Kcal` : '0 Kcal'}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                            nutri.calo > 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {nutri.calo > 0 ? '+15% Phục hồi SDD' : 'Chưa lên món'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {/* DINH DƯỠNG P-L-G & TỶ LỆ */}
                <tr className="bg-amber-50/30 text-xs border-t border-slate-200">
                  <td className="p-3 text-amber-900 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Dinh Dưỡng Loại 1</span>
                    </div>
                    <span className="text-[10px] font-normal text-amber-700 block mt-0.5">
                      Đạm cao (+18%) • Béo (+15%)
                    </span>
                  </td>
                  {days.map((day) => {
                    const nutri = getNutritionForAllTypes(day.dayOfWeek).type1;
                    return (
                      <td key={day.dayOfWeek} className="p-2.5 text-center border-l border-slate-200 align-middle">
                        {nutri.calo > 0 ? (
                          <div className="space-y-1 text-[10.5px] font-semibold">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-blue-800 font-bold">P: {nutri.p.toFixed(1)}g ({nutri.pPct}%)</span>
                              <span className="text-amber-800 font-bold">L: {nutri.l.toFixed(1)}g ({nutri.lPct}%)</span>
                              <span className="text-emerald-800 font-bold">G: {nutri.g.toFixed(1)}g ({nutri.gPct}%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-200 shadow-inner mt-1">
                              <div style={{ width: `${nutri.pPct}%` }} className="bg-blue-600 h-full" />
                              <div style={{ width: `${nutri.lPct}%` }} className="bg-amber-500 h-full" />
                              <div style={{ width: `${nutri.gPct}%` }} className="bg-emerald-500 h-full" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* NHÓM 3: LOẠI 2 — THỪA CÂN / BÉO PHÌ (2 BÉ • TT 28/2016)          */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {(footerNutritionTab === 'ALL' || footerNutritionTab === 'OBESE') && (
              <>

                {/* CALO / NGÀY */}
                <tr className="bg-white font-bold text-xs border-t border-slate-200">
                  <td className="p-3 text-purple-950 font-black">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Calo Loại 2: Béo Phì</span>
                    </div>
                    <span className="text-[10px] font-medium text-purple-700 block mt-0.5">
                      TT 28: -12% Calo giảm béo
                    </span>
                  </td>
                  {days.map((day) => {
                    const nutri = getNutritionForAllTypes(day.dayOfWeek).type2;
                    return (
                      <td key={day.dayOfWeek} className="p-2.5 text-center border-l border-slate-200">
                        <span className="text-sm font-black text-purple-900 block tracking-tight">
                          {nutri.calo > 0 ? `${nutri.calo.toFixed(1)} Kcal` : '0 Kcal'}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                            nutri.calo > 0
                              ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {nutri.calo > 0 ? '-12% Giảm béo TT 28' : 'Chưa lên món'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {/* DINH DƯỠNG P-L-G & TỶ LỆ */}
                <tr className="bg-purple-50/30 text-xs border-t border-slate-200">
                  <td className="p-3 text-purple-900 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Dinh Dưỡng Loại 2</span>
                    </div>
                    <span className="text-[10px] font-normal text-purple-700 block mt-0.5">
                      Đạm nạc 100% • Giảm mỡ (-30%)
                    </span>
                  </td>
                  {days.map((day) => {
                    const nutri = getNutritionForAllTypes(day.dayOfWeek).type2;
                    return (
                      <td key={day.dayOfWeek} className="p-2.5 text-center border-l border-slate-200 align-middle">
                        {nutri.calo > 0 ? (
                          <div className="space-y-1 text-[10.5px] font-semibold">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-blue-800 font-bold">P: {nutri.p.toFixed(1)}g ({nutri.pPct}%)</span>
                              <span className="text-purple-800 font-bold">L: {nutri.l.toFixed(1)}g ({nutri.lPct}%)</span>
                              <span className="text-emerald-800 font-bold">G: {nutri.g.toFixed(1)}g ({nutri.gPct}%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-200 shadow-inner mt-1">
                              <div style={{ width: `${nutri.pPct}%` }} className="bg-blue-600 h-full" />
                              <div style={{ width: `${nutri.lPct}%` }} className="bg-amber-500 h-full" />
                              <div style={{ width: `${nutri.gPct}%` }} className="bg-emerald-500 h-full" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* NHÓM 4: LOẠI 3 — DỊ ỨNG THỰC PHẨM (6 BÉ • AN TOÀN TUYỆT ĐỐI)      */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {(footerNutritionTab === 'ALL' || footerNutritionTab === 'ALLERGIES') && (
              <>

                {/* CALO / NGÀY */}
                <tr className="bg-white font-bold text-xs border-t border-slate-200">
                  <td className="p-3 text-rose-950 font-black">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Calo Loại 3: Dị Ứng</span>
                    </div>
                    <span className="text-[10px] font-medium text-rose-700 block mt-0.5">
                      100% Chuẩn calo an toàn
                    </span>
                  </td>
                  {days.map((day) => {
                    const nutri = getNutritionForAllTypes(day.dayOfWeek).type3;
                    return (
                      <td key={day.dayOfWeek} className="p-2.5 text-center border-l border-slate-200">
                        <span className="text-sm font-black text-rose-900 block tracking-tight">
                          {nutri.calo > 0 ? `${nutri.calo.toFixed(1)} Kcal` : '0 Kcal'}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                            nutri.calo > 0
                              ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {nutri.calo > 0 ? '100% An toàn dị nguyên' : 'Chưa lên món'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {/* DINH DƯỠNG P-L-G & TỶ LỆ */}
                <tr className="bg-rose-50/30 text-xs border-t border-slate-200">
                  <td className="p-3 text-rose-900 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Dinh Dưỡng Loại 3</span>
                    </div>
                    <span className="text-[10px] font-normal text-rose-700 block mt-0.5">
                      Thay đạm nạc an toàn
                    </span>
                  </td>
                  {days.map((day) => {
                    const nutri = getNutritionForAllTypes(day.dayOfWeek).type3;
                    return (
                      <td key={day.dayOfWeek} className="p-2.5 text-center border-l border-slate-200 align-middle">
                        {nutri.calo > 0 ? (
                          <div className="space-y-1 text-[10.5px] font-semibold">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-blue-800 font-bold">P: {nutri.p.toFixed(1)}g ({nutri.pPct}%)</span>
                              <span className="text-amber-800 font-bold">L: {nutri.l.toFixed(1)}g ({nutri.lPct}%)</span>
                              <span className="text-emerald-800 font-bold">G: {nutri.g.toFixed(1)}g ({nutri.gPct}%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-200 shadow-inner mt-1">
                              <div style={{ width: `${nutri.pPct}%` }} className="bg-blue-600 h-full" />
                              <div style={{ width: `${nutri.lPct}%` }} className="bg-amber-500 h-full" />
                              <div style={{ width: `${nutri.gPct}%` }} className="bg-emerald-500 h-full" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </>
            )}
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

      {/* ══════════════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ĐỀ XUẤT MÓN THAY THẾ CHO TỪNG LOẠI BÉ & MÓN THAY THẾ CHUNG TOÀN NĂNG       */}
      {/* ══════════════════════════════════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ĐỀ XUẤT & CHỌN MÓN THAY THẾ CÙNG LOẠI & TƯƠNG ĐƯƠNG DINH DƯỠNG             */}
      {/* (Khi ấn loại nào thì CHỈ HIỆN LOẠI ĐÓ và thông tin trẻ của loại đó)               */}
      {/* ══════════════════════════════════════════════════════════════════════════════════ */}
      {universalModalDish && (() => {
        const currentDishName = universalModalDish.menuDish.dish?.name || 'Món ăn';
        const currentDishType = universalModalDish.menuDish.dish?.dishType;
        const currentCat = detectDishCategory(currentDishName, currentDishType);
        const currentCalo = Number(universalModalDish.menuDish.plannedCalories || universalModalDish.menuDish.dish?.totalCalories || 0);
        const currentP = Number(universalModalDish.menuDish.dish?.totalProteinG || 0);
        const currentL = Number(universalModalDish.menuDish.dish?.totalFatG || 0);
        const currentG = Number(universalModalDish.menuDish.dish?.totalCarbG || 0);

        // Tìm các xung đột dị ứng của món này
        const conflictsForThisDish = advisory?.allergyConflicts?.filter((c) =>
          c.menuDishId === universalModalDish.menuDish.id ||
          c.dishId === universalModalDish.menuDish.dishId ||
          (c.dishName && c.dishName.toLowerCase().trim() === currentDishName.toLowerCase().trim())
        ) || [];

        // Đề xuất danh sách món thay thế CÙNG LOẠI & TƯƠNG ĐƯƠNG DINH DƯỠNG (100% ID số thực tế trong cơ sở dữ liệu)
        const getCandidateSubstitutes = () => {
          // 1. Món Canh / Súp (SOUP)
          if (currentCat.code === 'SOUP') {
            if (modalActiveTab === 'OBESE') {
              return [
                {
                  id: '57',
                  name: 'Canh bí đao thịt bằm',
                  categoryLabel: 'Món Canh',
                  calories: 28,
                  proteinG: 3.8,
                  fatG: 0.6,
                  carbG: 1.6,
                  suitabilityReason: '✓ Cùng loại Món Canh • Cắt giảm 60% chất béo • Tối ưu kiểm soát cân nặng TT 28',
                },
                {
                  id: '48',
                  name: 'Canh thịt nạc bằm bắp cải, cà rốt',
                  categoryLabel: 'Món Canh',
                  calories: 30,
                  proteinG: 4.0,
                  fatG: 0.7,
                  carbG: 1.8,
                  suitabilityReason: '✓ Cùng loại Món Canh • Giàu chất xơ, không dầu mỡ • Tốt cho trẻ thừa cân',
                },
                {
                  id: '47',
                  name: 'Canh thịt bằm rau ngót',
                  categoryLabel: 'Món Canh',
                  calories: 32,
                  proteinG: 4.8,
                  fatG: 0.8,
                  carbG: 1.5,
                  suitabilityReason: '✓ Cùng loại Món Canh • Thanh nhiệt, đạm nạc tinh khiết',
                },
              ];
            }
            if (modalActiveTab === 'STUNTED') {
              return [
                {
                  id: '33',
                  name: 'Canh thịt sườn hầm bắp, bầu',
                  categoryLabel: 'Món Canh',
                  calories: 65,
                  proteinG: 6.2,
                  fatG: 2.5,
                  carbG: 4.2,
                  suitabilityReason: '✓ Cùng loại Món Canh • Tăng 20% đạm sinh học & canxi • Tối ưu cho trẻ thấp còi/SDD (QĐ 1246)',
                },
                {
                  id: '50',
                  name: 'Canh gà hầm củ sen, cà rốt',
                  categoryLabel: 'Món Canh',
                  calories: 58,
                  proteinG: 5.8,
                  fatG: 2.0,
                  carbG: 3.8,
                  suitabilityReason: '✓ Cùng loại Món Canh • Bổ dưỡng vi chất, hồi phục thể trạng trẻ nhẹ cân',
                },
                {
                  id: '47',
                  name: 'Canh thịt bằm rau ngót',
                  categoryLabel: 'Món Canh',
                  calories: 32,
                  proteinG: 4.8,
                  fatG: 0.8,
                  carbG: 1.5,
                  suitabilityReason: '✓ Cùng loại Món Canh • Đạm sinh học cao, dễ tiêu hóa',
                },
              ];
            }
            // Mặc định hoặc Dị ứng (ALLERGIES / COMMON)
            return [
              {
                id: '47',
                name: 'Canh thịt bằm rau ngót',
                categoryLabel: 'Món Canh',
                calories: 32,
                proteinG: 4.8,
                fatG: 0.8,
                carbG: 1.5,
                suitabilityReason: '✓ Cùng loại Món Canh • 100% không tôm/cua/hải sản • An toàn dị ứng tuyệt đối',
              },
              {
                id: '42',
                name: 'Canh thịt bằm rau dền, mồng tơi',
                categoryLabel: 'Món Canh',
                calories: 36,
                proteinG: 4.3,
                fatG: 1.2,
                carbG: 2.0,
                suitabilityReason: '✓ Cùng loại Món Canh • Thanh mát giàu chất xơ • Lành tính cho trẻ dị ứng & béo phì',
              },
              {
                id: '57',
                name: 'Canh bí đao thịt bằm',
                categoryLabel: 'Món Canh',
                calories: 28,
                proteinG: 3.8,
                fatG: 0.6,
                carbG: 1.6,
                suitabilityReason: '✓ Cùng loại Món Canh • Lành tính cho mọi cơ địa dị ứng',
              },
              {
                id: '48',
                name: 'Canh thịt nạc bằm bắp cải, cà rốt',
                categoryLabel: 'Món Canh',
                calories: 30,
                proteinG: 4.0,
                fatG: 0.7,
                carbG: 1.8,
                suitabilityReason: '✓ Cùng loại Món Canh • Thanh đạm không dầu mỡ • An toàn',
              },
            ];
          }

          // 2. Món Cơm / Tinh Bột (STAPLE)
          if (currentCat.code === 'STAPLE') {
            return [
              {
                id: '1',
                name: 'Cơm trắng gạo tẻ dẻo',
                categoryLabel: 'Cơm / Tinh bột',
                calories: 172,
                proteinG: 3.8,
                fatG: 0.3,
                carbG: 38.1,
                suitabilityReason: '✓ Cùng loại Tinh bột • Cắt giảm 94% chất béo so với cơm chiên • Tốt cho trẻ béo phì & dị ứng',
              },
              {
                id: '2',
                name: 'Cơm chiên Dương Châu',
                categoryLabel: 'Cơm / Tinh bột',
                calories: 269,
                proteinG: 10.7,
                fatG: 8.7,
                carbG: 37.0,
                suitabilityReason: '✓ Cùng loại Cơm chiên • Thay thế hoàn toàn tôm/cua/hải sản • Năng lượng tương đương 100%',
              },
            ];
          }

          // 3. Món Uống / Tráng Miệng (DRINK) — 100% các món thức uống / tráng miệng, KHÔNG lẫn món cháo/mặn
          if (currentCat.code === 'DRINK') {
            if (modalActiveTab === 'OBESE') {
              return [
                {
                  id: '98',
                  name: 'Sâm bí đao hạt chia thanh mát',
                  categoryLabel: 'Thức uống',
                  calories: 50,
                  proteinG: 0.7,
                  fatG: 0.2,
                  carbG: 10.2,
                  suitabilityReason: '✓ Cùng loại Thức uống • Thanh nhiệt ít calo • Tối ưu kiểm soát cân nặng TT 28',
                },
                {
                  id: '99',
                  name: 'Nước đậu đen rang đường phèn',
                  categoryLabel: 'Thức uống',
                  calories: 45,
                  proteinG: 1.0,
                  fatG: 0.1,
                  carbG: 10.5,
                  suitabilityReason: '✓ Cùng loại Thức uống • Ít đường, thanh lọc giải nhiệt cơ thể',
                },
                {
                  id: '95',
                  name: 'Nước cam tươi nguyên chất',
                  categoryLabel: 'Thức uống',
                  calories: 60,
                  proteinG: 1.2,
                  fatG: 0.2,
                  carbG: 14.5,
                  suitabilityReason: '✓ Cùng loại Thức uống • Giàu vitamin C • Không dầu mỡ, bồi bổ tự nhiên',
                },
              ];
            }
            if (modalActiveTab === 'STUNTED') {
              return [
                {
                  id: '96',
                  name: 'Sữa đậu nành nguyên chất',
                  categoryLabel: 'Thức uống',
                  calories: 75,
                  proteinG: 4.2,
                  fatG: 2.5,
                  carbG: 8.5,
                  suitabilityReason: '✓ Cùng loại Thức uống • Đạm thực vật sinh học cao phục hồi thể trạng (QĐ 1246)',
                },
                {
                  id: '71',
                  name: 'Chuối cau chín',
                  categoryLabel: 'Tráng miệng',
                  calories: 68,
                  proteinG: 0.9,
                  fatG: 0.2,
                  carbG: 16.5,
                  suitabilityReason: '✓ Cùng loại Tráng miệng • Giàu kali & năng lượng tự nhiên cho trẻ nhẹ cân',
                },
                {
                  id: '97',
                  name: 'Nha đam hạt chia đường phèn',
                  categoryLabel: 'Thức uống',
                  calories: 65,
                  proteinG: 0.5,
                  fatG: 0.2,
                  carbG: 15.0,
                  suitabilityReason: '✓ Cùng loại Thức uống • Thanh mát bồi bổ thể chất',
                },
              ];
            }
            // Mặc định hoặc Dị ứng (ALLERGIES / COMMON)
            return [
              {
                id: '98',
                name: 'Sâm bí đao hạt chia thanh mát',
                categoryLabel: 'Thức uống',
                calories: 50,
                proteinG: 0.7,
                fatG: 0.2,
                carbG: 10.2,
                suitabilityReason: '✓ Cùng loại Thức uống • Hoàn toàn không sữa bò, không lactose, không hạt • 100% an toàn dị ứng',
              },
              {
                id: '97',
                name: 'Nha đam hạt chia đường phèn',
                categoryLabel: 'Thức uống',
                calories: 65,
                proteinG: 0.5,
                fatG: 0.2,
                carbG: 15.0,
                suitabilityReason: '✓ Cùng loại Thức uống • Lành tính tuyệt đối, không có dị nguyên',
              },
              {
                id: '95',
                name: 'Nước cam tươi nguyên chất',
                categoryLabel: 'Thức uống',
                calories: 60,
                proteinG: 1.2,
                fatG: 0.2,
                carbG: 14.5,
                suitabilityReason: '✓ Cùng loại Thức uống • Vitamin C tự nhiên • An toàn 100% không dị ứng',
              },
              {
                id: '99',
                name: 'Nước đậu đen rang đường phèn',
                categoryLabel: 'Thức uống',
                calories: 45,
                proteinG: 1.0,
                fatG: 0.1,
                carbG: 10.5,
                suitabilityReason: '✓ Cùng loại Thức uống • Thanh nhiệt, lành tính, an toàn tuyệt đối',
              },
              {
                id: '71',
                name: 'Chuối cau chín',
                categoryLabel: 'Tráng miệng',
                calories: 68,
                proteinG: 0.9,
                fatG: 0.2,
                carbG: 16.5,
                suitabilityReason: '✓ Cùng loại Tráng miệng • Trái cây tươi bổ dưỡng, 100% không dị nguyên',
              },
            ];
          }

          // 4. Món Xế / Cháo / Súp / Bún (SNACK_MEAL) — 100% các món cháo / xế, KHÔNG lẫn nước uống
          if (currentCat.code === 'SNACK_MEAL') {
            if (modalActiveTab === 'OBESE') {
              return [
                {
                  id: '84',
                  name: 'Cháo thịt bằm, cải bó xôi, cà rốt',
                  categoryLabel: 'Món Xế / Cháo',
                  calories: 135,
                  proteinG: 7.8,
                  fatG: 2.2,
                  carbG: 18.0,
                  suitabilityReason: '✓ Cùng loại Món Xế • Thịt nạc, nhiều chất xơ, giảm béo TT 28',
                },
                {
                  id: '89',
                  name: 'Cháo thịt gà, nấm rơm, cà rốt',
                  categoryLabel: 'Món Xế / Cháo',
                  calories: 145,
                  proteinG: 8.8,
                  fatG: 2.5,
                  carbG: 18.5,
                  suitabilityReason: '✓ Cùng loại Món Xế • Ức gà nạc không da, thanh đạm',
                },
              ];
            }
            if (modalActiveTab === 'STUNTED') {
              return [
                {
                  id: '77',
                  name: 'Súp óc heo, gà xé, trứng cút, ngô ngọt',
                  categoryLabel: 'Món Xế / Súp',
                  calories: 165,
                  proteinG: 9.5,
                  fatG: 5.2,
                  carbG: 18.0,
                  suitabilityReason: '✓ Cùng loại Món Xế • Tăng 20% đạm sinh học cao & vi chất (QĐ 1246)',
                },
                {
                  id: '91',
                  name: 'Cháo thịt bằm đậu xanh',
                  categoryLabel: 'Món Xế / Cháo',
                  calories: 140,
                  proteinG: 8.2,
                  fatG: 3.5,
                  carbG: 19.0,
                  suitabilityReason: '✓ Cùng loại Món Xế • Bổ sung đạm thực vật & động vật cân đối',
                },
                {
                  id: '78',
                  name: 'Bánh bao thịt cút',
                  categoryLabel: 'Món Xế',
                  calories: 155,
                  proteinG: 7.5,
                  fatG: 4.0,
                  carbG: 22.0,
                  suitabilityReason: '✓ Cùng loại Món Xế • Giàu năng lượng cho trẻ nhẹ cân',
                },
              ];
            }
            // Mặc định hoặc Dị ứng (ALLERGIES / COMMON)
            return [
              {
                id: '89',
                name: 'Cháo thịt gà, nấm rơm, cà rốt',
                categoryLabel: 'Món Xế / Cháo',
                calories: 145,
                proteinG: 8.8,
                fatG: 3.8,
                carbG: 18.5,
                suitabilityReason: '✓ Cùng loại Món Xế • Không hải sản, thịt gà nạc lành tính',
              },
              {
                id: '84',
                name: 'Cháo thịt bằm, cải bó xôi, cà rốt',
                categoryLabel: 'Món Xế / Cháo',
                calories: 135,
                proteinG: 7.8,
                fatG: 2.5,
                carbG: 18.0,
                suitabilityReason: '✓ Cùng loại Món Xế • Không hải sản, không dị nguyên',
              },
              {
                id: '91',
                name: 'Cháo thịt bằm đậu xanh',
                categoryLabel: 'Món Xế / Cháo',
                calories: 140,
                proteinG: 8.2,
                fatG: 3.5,
                carbG: 19.0,
                suitabilityReason: '✓ Cùng loại Món Xế • Lành tính cho mọi cơ địa trẻ dị ứng',
              },
            ];
          }

          // 5. Món Mặn Chính (MAIN)
          if (modalActiveTab === 'OBESE') {
            return [
              {
                id: '16',
                name: 'Thịt bò xào đậu que',
                categoryLabel: 'Món Mặn Chính',
                calories: 84,
                proteinG: 8.8,
                fatG: 4.4,
                carbG: 2.8,
                suitabilityReason: '✓ Cùng loại Món Mặn • Giảm 50% chất béo so với món chiên rán • Kiểm soát cân nặng TT 28',
              },
              {
                id: '20',
                name: 'Thịt bò xào khóm',
                categoryLabel: 'Món Mặn Chính',
                calories: 80,
                proteinG: 8.4,
                fatG: 4.3,
                carbG: 1.8,
                suitabilityReason: '✓ Cùng loại Món Mặn • Vị chua ngọt thanh nhẹ • Rất ít chất béo',
              },
              {
                id: '10',
                name: 'Thịt heo ram mặn cà rốt',
                categoryLabel: 'Món Mặn Chính',
                calories: 125,
                proteinG: 9.8,
                fatG: 7.2,
                carbG: 1.5,
                suitabilityReason: '✓ Cùng loại Món Mặn • Thịt nạc lọc mỡ, bổ sung carotene',
              },
            ];
          }
          if (modalActiveTab === 'STUNTED') {
            return [
              {
                id: '22',
                name: 'Sườn cốt lết khìa nước dừa',
                categoryLabel: 'Món Mặn Chính',
                calories: 155,
                proteinG: 11.5,
                fatG: 8.0,
                carbG: 3.0,
                suitabilityReason: '✓ Cùng loại Món Mặn • Tăng 20% đạm sinh học cao • Tối ưu phục hồi cho trẻ thấp còi/SDD (QĐ 1246)',
              },
              {
                id: '15',
                name: 'Thịt sườn heo khìa nước dừa',
                categoryLabel: 'Món Mặn Chính',
                calories: 145,
                proteinG: 10.2,
                fatG: 8.5,
                carbG: 2.0,
                suitabilityReason: '✓ Cùng loại Món Mặn • Giàu năng lượng & vi chất cho trẻ nhẹ cân',
              },
              {
                id: '6',
                name: 'Thịt gà rô ti',
                categoryLabel: 'Món Mặn Chính',
                calories: 124,
                proteinG: 9.6,
                fatG: 8.9,
                carbG: 1.4,
                suitabilityReason: '✓ Cùng loại Món Mặn • Thịt gà mềm giàu đạm sinh học dễ hấp thu',
              },
            ];
          }
          // Mặc định hoặc Dị ứng (ALLERGIES / COMMON)
          return [
            {
              id: '10',
              name: 'Thịt heo ram mặn cà rốt',
              categoryLabel: 'Món Mặn Chính',
              calories: 125,
              proteinG: 9.8,
              fatG: 7.2,
              carbG: 1.5,
              suitabilityReason: '✓ Cùng loại Món Mặn • 100% không tôm/cua/hải sản, không trứng • Đạm tương đương',
            },
            {
              id: '16',
              name: 'Thịt bò xào đậu que',
              categoryLabel: 'Món Mặn Chính',
              calories: 84,
              proteinG: 8.8,
              fatG: 4.4,
              carbG: 2.8,
              suitabilityReason: '✓ Cùng loại Món Mặn • Giàu sắt, kẽm • Hoàn toàn không dị nguyên',
            },
            {
              id: '6',
              name: 'Thịt gà rô ti',
              categoryLabel: 'Món Mặn Chính',
              calories: 124,
              proteinG: 9.6,
              fatG: 8.9,
              carbG: 1.4,
              suitabilityReason: '✓ Cùng loại Món Mặn • Đạm sạch lành tính, an toàn tuyệt đối',
            },
            {
              id: '20',
              name: 'Thịt bò xào khóm',
              categoryLabel: 'Món Mặn Chính',
              calories: 80,
              proteinG: 8.4,
              fatG: 4.3,
              carbG: 1.8,
              suitabilityReason: '✓ Cùng loại Món Mặn • Không gây dị ứng',
            },
          ];
        };

        const candidates = getCandidateSubstitutes();
        const activeSub = selectedSubDish || candidates[0];

        const handleConfirmSubstitute = async () => {
          if (!activeSub) return;
          try {
            setIsApplyingSub(true);
            const generatedNote = `[${
              modalActiveTab === 'ALLERGIES'
                ? 'Loại 3: Dị ứng'
                : modalActiveTab === 'OBESE'
                ? 'Loại 2: Béo phì'
                : modalActiveTab === 'STUNTED'
                ? 'Loại 1: SDD'
                : 'Món Chung'
            }] Thay cho: ${universalModalDish.menuDish.dish?.name || 'Món gốc'} -> Đổi sang: ${activeSub.name} (${activeSub.calories} Kcal). ${substituteStaffNote || 'Nấu suất riêng theo chuẩn dinh dưỡng.'}`;

            const targetDishId = Number(activeSub.id) || 1;
            const originDishId = Number(universalModalDish.menuDish.dishId) || undefined;
            const currentDayOfWeek = Number(universalModalDish.menuDish.dayOfWeek) || 2;
            const currentMealTime = universalModalDish.menuDish.mealTime || 'LUNCH';
            const currentPortion = Number(universalModalDish.menuDish.portionSizeG) || 100;

            const payload = {
              dayOfWeek: currentDayOfWeek,
              mealType: currentMealTime,
              mealTime: currentMealTime,
              oldDishId: originDishId,
              dishId: targetDishId,
              newDishId: targetDishId,
              substituteDishId: targetDishId,
              portionSizeG: currentPortion,
              specialDietNotes: generatedNote,
              keepOriginalDish: true,
            };

            if (onAdjustDish && menu?.id) {
              await onAdjustDish(payload);
            } else if (menu?.id) {
              await weeklyMenusApi.adjustDish(menu.id, payload);
            }

            setSubApplySuccess(`Đã xác nhận thay thế bằng món "${activeSub.name}" thành công!`);
            setTimeout(() => {
              setUniversalModalDish(null);
            }, 1000);
          } catch (err: any) {
            alert('Không thể lưu thay thế món: ' + (err?.response?.data?.message || err?.message || 'Lỗi hệ thống'));
          } finally {
            setIsApplyingSub(false);
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col justify-between">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 font-bold">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">
                      Chọn Món Thay Thế Cùng Loại & Tương Đương Dinh Dưỡng
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Món gốc: <strong className="text-emerald-950 font-black">{currentDishName}</strong> ({currentCat.label} • {universalModalDish.slotName} • {universalModalDish.dayLabel})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUniversalModalDish(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                
                                {/* 1. TABS CHỌN LOẠI TRẺ EM: HIỂN THỊ ĐỦ CẢ 4 LOẠI ĐỂ TÙY CHỌN, KHÔNG BỊ MẤT LOẠI NÀO */}
                <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setModalActiveTab('COMMON'); setSelectedSubDish(null); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      modalActiveTab === 'COMMON'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>⭐ Món Thay Thế Chung Cho Bếp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setModalActiveTab('ALLERGIES'); setSelectedSubDish(null); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      modalActiveTab === 'ALLERGIES'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Loại 3: Dị Ứng ({conflictsForThisDish.length > 0 ? conflictsForThisDish.length : allergicChildrenList.length} bé)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setModalActiveTab('OBESE'); setSelectedSubDish(null); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      modalActiveTab === 'OBESE'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Loại 2: Thừa Cân / Béo Phì ({overweightChildren.length} bé)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setModalActiveTab('STUNTED'); setSelectedSubDish(null); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      modalActiveTab === 'STUNTED'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Baby className="w-3.5 h-3.5" />
                    <span>Loại 1: Thấp Còi / SDD ({wastedChildren.length} bé)</span>
                  </button>
                </div>

                {/* 2. THÔNG TIN TRẺ EM THEO ĐÚNG LOẠI ĐÃ CHỌN */}
                {modalActiveTab === 'ALLERGIES' && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-rose-950 text-xs uppercase tracking-wide">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>Trẻ em có cơ địa dị ứng bị ảnh hưởng bởi món này:</span>
                      </div>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        {conflictsForThisDish.length > 0 ? `${conflictsForThisDish.length} bé chạm dị nguyên` : 'Tất cả trẻ dị ứng'}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {(conflictsForThisDish.length > 0 ? conflictsForThisDish : allergicChildrenList.slice(0, 3)).map((c: any, idx: number) => (
                        <div key={idx} className="p-2 bg-white rounded-xl border border-rose-200 text-xs flex items-center justify-between shadow-2xs">
                          <div>
                            <span className="font-bold text-rose-950">{c.childName}</span>
                            <span className="text-rose-700 ml-1.5 font-medium">({c.className})</span>
                          </div>
                          <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Dị ứng: {c.allergenDetected || c.allergen}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {modalActiveTab === 'OBESE' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-purple-950 text-xs uppercase tracking-wide">
                        <Scale className="w-4 h-4 text-purple-600" />
                        <span>Trẻ em Thừa cân / Béo phì cần kiểm soát calo (TT 28/2016):</span>
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {overweightChildren.length} bé
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {overweightChildren.map((c: any, idx: number) => (
                        <div key={idx} className="p-2 bg-white rounded-xl border border-purple-200 text-xs flex items-center justify-between shadow-2xs">
                          <div>
                            <span className="font-bold text-purple-950">{c.childName}</span>
                            <span className="text-purple-700 ml-1.5 font-medium">({c.className})</span>
                            <span className="text-purple-600 ml-2 italic text-[11px]">- Cần giảm 10-15% béo/calo, hạn chế chiên rán</span>
                          </div>
                          <span className="text-[10px] font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                            {c.weightKg} kg • BAZ: +{c.baz || 2.3}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {modalActiveTab === 'STUNTED' && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-amber-950 text-xs uppercase tracking-wide">
                        <Baby className="w-4 h-4 text-amber-600" />
                        <span>Trẻ em Còi xương / Thấp còi cần bổ sung đạm (QĐ 1246/BYT):</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {wastedChildren.length} bé
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {wastedChildren.map((c: any, idx: number) => (
                        <div key={idx} className="p-2 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between shadow-2xs">
                          <div>
                            <span className="font-bold text-amber-950">{c.childName}</span>
                            <span className="text-amber-700 ml-1.5 font-medium">({c.className})</span>
                            <span className="text-amber-600 ml-2 italic text-[11px]">- Cần tăng 15-20% đạm sinh học cao & thêm bữa phụ</span>
                          </div>
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {c.weightKg} kg • {c.heightCm} cm (Thấp còi)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {modalActiveTab === 'COMMON' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 animate-in fade-in duration-150">
                    <p className="font-black text-emerald-950 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4 text-emerald-600" />
                      <span>Giải pháp Bếp Thực Tế: 1 Món thay thế chung phục vụ cả 3 nhóm trẻ</span>
                    </p>
                    <p className="text-[11px] text-emerald-900 mt-1 leading-relaxed">
                      Bếp không phải nấu riêng 3 nồi thức ăn. Chỉ cần nấu thêm 1 món chung lành tính, 100% không có hải sản hay dị nguyên (cho Loại 3), thịt nạc lọc mỡ không chiên dầu (cho Loại 2), và đạm cao chia thêm khẩu phần (cho Loại 1).
                    </p>
                  </div>
                )}

                {/* 3. BẢNG SO SÁNH DINH DƯỠNG: MÓN GỐC vs MÓN THAY THẾ ĐÃ CHỌN */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Đối Ứng Dinh Dưỡng Giữa Món Gốc & Món Thay Thế:
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Cùng loại: {currentCat.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Món Gốc */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-black text-slate-400 uppercase block">Món Gốc Hiện Tại</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">{currentDishName}</p>
                      <div className="mt-2 space-y-0.5 text-[11px] text-slate-600 font-medium">
                        <p>Năng lượng: <strong className="text-amber-800">{currentCalo} Kcal</strong></p>
                        <p>Chất đạm (P): <strong>{currentP}g</strong> • Chất béo (L): <strong>{currentL}g</strong></p>
                      </div>
                    </div>

                    {/* Món Thay Thế Được Chọn */}
                    <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-300">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-700 uppercase block">Món Thay Thế Đã Chọn</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <p className="font-black text-emerald-950 text-sm mt-0.5 truncate">{activeSub.name}</p>
                      <div className="mt-2 space-y-0.5 text-[11px] text-emerald-900 font-medium">
                        <p>Năng lượng: <strong className="text-emerald-950 font-black">{activeSub.calories} Kcal</strong> {currentCalo > 0 && (
                          <span className="text-[10px] text-emerald-700 font-bold">
                            ({Math.round(((activeSub.calories - currentCalo) / currentCalo) * 100) > 0 ? '+' : ''}{Math.round(((activeSub.calories - currentCalo) / currentCalo) * 100)}%)
                          </span>
                        )}</p>
                        <p>Chất đạm (P): <strong>{activeSub.proteinG}g</strong> • Chất béo (L): <strong>{activeSub.fatG}g</strong></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. DANH SÁCH CÁC MÓN ĐỀ XUẤT CÙNG LOẠI ĐỂ CLICK CHỌN */}
                <div>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-2">
                    Bấm chọn 1 món ăn cùng loại ({currentCat.label}) có dinh dưỡng tương ứng:
                  </label>
                  
                  <div className="space-y-2">
                    {candidates.map((dish) => {
                      const isSelected = activeSub.name === dish.name;
                      return (
                        <div
                          key={dish.id}
                          onClick={() => setSelectedSubDish(dish)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                            }`}>
                              {isSelected ? <Check className="w-3 h-3" /> : null}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs sm:text-sm">{dish.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{dish.suitabilityReason}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-3">
                            <span className="text-xs font-black text-emerald-800 block">{dish.calories} Kcal</span>
                            <span className="text-[10px] text-slate-500 font-semibold block">P: {dish.proteinG}g • L: {dish.fatG}g</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. GHI CHÚ CHIA PHẦN CHO NHÂN VIÊN BẾP */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ghi chú hướng dẫn cho Nhân viên Bếp & Giáo viên chia phần:
                  </label>
                  <input
                    type="text"
                    value={substituteStaffNote}
                    onChange={(e) => setSubstituteStaffNote(e.target.value)}
                    placeholder={`Ví dụ: Nấu suất riêng cho bé, chia thêm 15% khẩu phần, dán nhãn màu vàng/đỏ...`}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                  />
                </div>

                {subApplySuccess && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl animate-in fade-in duration-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{subApplySuccess}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Chuẩn dinh dưỡng Viện Dinh Dưỡng & TT 28/2016
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUniversalModalDish(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    disabled={isApplyingSub}
                    onClick={handleConfirmSubstitute}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer hover:scale-102 active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isApplyingSub ? 'Đang lưu...' : 'Xác Nhận Thay Thế Món Này Vào Thực Đơn'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
