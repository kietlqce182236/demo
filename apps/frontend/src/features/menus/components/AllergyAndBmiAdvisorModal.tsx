import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
  Search,
  User,
  Heart,
  Flame,
  UtensilsCrossed,
  ChefHat,
  Apple,
  TrendingDown,
  TrendingUp,
  Baby,
} from 'lucide-react';
import {
  weeklyMenusApi,
  MenuAdvisoryResponse,
  AllergyConflictItem,
  WeeklyMenu,
  MenuDishItem,
} from '../api/weekly-menus.api';

interface AllergyAndBmiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuId: string;
  menuTitle?: string;
  menu?: WeeklyMenu | null;
  focusMenuDishId?: string | null;
  initialTab?: 'STUNTED' | 'OBESE' | 'ALLERGIES';
  categoryLock?: 'STUNTED' | 'OBESE' | 'ALLERGIES' | null;
  onSubstituteApplied?: () => void;
}

type TabType = 'STUNTED' | 'OBESE' | 'ALLERGIES';

export const AllergyAndBmiAdvisorModal: React.FC<AllergyAndBmiAdvisorModalProps> = ({
  isOpen,
  onClose,
  menuId,
  menuTitle,
  menu,
  focusMenuDishId,
  initialTab = 'STUNTED',
  categoryLock = null,
  onSubstituteApplied,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(categoryLock || initialTab || 'STUNTED');
  const [internalLock, setInternalLock] = useState<'STUNTED' | 'OBESE' | 'ALLERGIES' | null>(categoryLock ?? null);
  const [advisory, setAdvisory] = useState<MenuAdvisoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters for allergy conflicts
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [dayFilter, setDayFilter] = useState<number | 'ALL'>('ALL');
  const [searchChild, setSearchChild] = useState<string>('');

  const focusedDish = menu?.menuDishes?.find((md) => md.id === focusMenuDishId);

  const fetchAdvisory = async () => {
    if (!menuId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await weeklyMenusApi.getAdvisory(menuId);
      setAdvisory(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu cảnh báo dị ứng và BMI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const lock = categoryLock ?? null;
      setInternalLock(lock);
      const target = lock || initialTab || 'STUNTED';
      setActiveTab(target);
      if (menuId) {
        fetchAdvisory();
      }
    }
  }, [isOpen, categoryLock, initialTab, menuId]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleApplySubstitute = async (
    menuDishId: string,
    substituteDishId: string | null,
    targetCategory?: 'STUNTED' | 'OBESE' | 'ALLERGIES',
    detailInfo?: string,
  ) => {
    try {
      setApplyingId(menuDishId);
      let note: string | undefined = undefined;
      if (substituteDishId) {
        if (targetCategory === 'ALLERGIES') {
          note = `[LOẠI 3: DỊ ỨNG] Thay thế an toàn cho học sinh dị ứng${detailInfo ? `: ${detailInfo}` : ''}`;
        } else if (targetCategory === 'OBESE') {
          note = `[LOẠI 2: THỪA CÂN / BÉO PHÌ] Giảm calo và chất béo theo TT 28 cho học sinh béo phì`;
        } else if (targetCategory === 'STUNTED') {
          note = `[LOẠI 1: CÒI XƯƠNG / SDD] Tăng calo và protein theo QĐ 1246 cho học sinh còi xương`;
        } else {
          note = `[MÓN THAY THẾ] Thay thế món theo chế độ riêng`;
        }
      }

      await weeklyMenusApi.applySubstitute(
        menuId,
        menuDishId,
        substituteDishId,
        note,
      );
      showToast(
        substituteDishId
          ? 'Đã áp dụng thành công món thay thế an toàn cho thực đơn!'
          : 'Đã hủy món thay thế, quay về món gốc.',
        'success',
      );
      await fetchAdvisory();
      if (onSubstituteApplied) {
        onSubstituteApplied();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể cập nhật món thay thế.', 'error');
    } finally {
      setApplyingId(null);
    }
  };

  // Day names helper
  const dayNames: Record<number, string> = {
    1: 'Thứ Hai',
    2: 'Thứ Ba',
    3: 'Thứ Tư',
    4: 'Thứ Năm',
    5: 'Thứ Sáu',
    6: 'Thứ Bảy',
    7: 'Chủ Nhật',
  };

  const mealTimeNames: Record<string, string> = {
    BREAKFAST: 'Bữa Sáng (07:00)',
    MORNING_SNACK: 'Bữa Phụ Sáng (09:00)',
    LUNCH: 'Bữa Trưa (11:00)',
    AFTERNOON_SNACK: 'Bữa Xế Chiều (14:30)',
    LATE_SNACK: 'Bữa Xế Muộn (17:00)',
  };

  // Filtered allergy conflicts
  const filteredConflicts = useMemo(() => {
    if (!advisory?.allergyConflicts) return [];
    let list = advisory.allergyConflicts;

    // QUAN TRỌNG: Khi chọn 1 món cụ thể, CHỈ lọc học sinh dị ứng món đó, KHÔNG hiển thị học sinh dị ứng các món/nguyên liệu khác!
    if (focusMenuDishId) {
      list = list.filter((c) => c.menuDishId === focusMenuDishId);
    }

    if (severityFilter === 'CRITICAL') {
      list = list.filter((c) => c.severity === 'SEVERE' || c.severity === 'ANAPHYLACTIC');
    } else if (severityFilter === 'WARNING') {
      list = list.filter((c) => c.severity === 'MODERATE' || c.severity === 'MILD');
    }

    if (!focusMenuDishId && dayFilter !== 'ALL') {
      list = list.filter((c) => c.dayOfWeek === dayFilter);
    }

    if (searchChild.trim()) {
      const query = searchChild.toLowerCase();
      list = list.filter((c) => {
        const matchName = c.childName.toLowerCase().includes(query);
        const matchClass = c.className.toLowerCase().includes(query);
        const matchDish = c.dishName.toLowerCase().includes(query);
        const matchAllergen = c.allergenDetected.toLowerCase().includes(query);
        return matchName || matchClass || matchDish || matchAllergen;
      });
    }

    return list;
  }, [advisory, severityFilter, dayFilter, searchChild, focusMenuDishId]);

  // Tab badge counts
  const stuntedCount = advisory?.bmiSummary.wastedUnderweightCount || 0;
  const obeseCount = advisory?.bmiSummary.overweightObeseCount || 0;
  const allergyCount = advisory?.allergySummary.totalConflicts || 0;
  const dishAllergyKidsCount = useMemo(() => {
    return new Set(filteredConflicts.map((c) => c.childId)).size;
  }, [filteredConflicts]);

  // Dynamic header titles according to the active type
  const headerInfo = useMemo(() => {
    if (activeTab === 'ALLERGIES') {
      return {
        badgeIcon: ShieldAlert,
        badgeText: 'LOẠI 3: DỊ ỨNG THỰC PHẨM',
        badgeColor: 'bg-purple-500/20 border-purple-400/40 text-purple-200',
        title: 'Thực đơn Thay thế: Nhóm Trẻ Dị ứng Thực phẩm',
        desc: focusedDish
          ? `Danh sách học sinh dị ứng với món "${focusedDish.dish?.name}". Gợi ý nguyên liệu an toàn cho Bếp và đề xuất món thay thế an toàn 100% không chứa dị nguyên.`
          : 'Học sinh có tiền sử dị ứng với các nguyên liệu trong thực đơn tuần. Đề xuất món ăn an toàn 100% từ kho món của trường để thay thế.',
      };
    }
    if (activeTab === 'OBESE') {
      return {
        badgeIcon: Flame,
        badgeText: 'LOẠI 2: THỪA CÂN / BÉO PHÌ',
        badgeColor: 'bg-rose-500/20 border-rose-400/40 text-rose-200',
        title: 'Thực đơn Thay thế: Nhóm Trẻ Béo phì / Thừa cân',
        desc: focusedDish
          ? `Điều chỉnh giảm calo và chất béo cho món "${focusedDish.dish?.name}" (${focusedDish.plannedCalories || focusedDish.dish?.totalCalories} Kcal). Đề xuất món thanh đạm, hấp luộc theo Thông tư 28/2016/TT-BGDĐT.`
          : 'Học sinh có chỉ số BMI vượt chuẩn WHO (thừa cân / béo phì). Đề xuất thực đơn thanh đạm, giảm 15-20% calo và hạn chế đồ chiên rán.',
      };
    }
    return {
      badgeIcon: Heart,
      badgeText: 'LOẠI 1: CÒI XƯƠNG / SUY DINH DƯỠNG',
      badgeColor: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
      title: 'Thực đơn Thay thế: Nhóm Trẻ Còi xương / Suy dinh dưỡng',
      desc: focusedDish
        ? `Tăng cường năng lượng và đạm cho món "${focusedDish.dish?.name}". Đề xuất món giàu dinh dưỡng, vi chất theo Quyết định 1246/QĐ-BYT.`
        : 'Học sinh bị gầy còm, thấp còi hoặc nhẹ cân theo chỉ số Z-score WHO. Đề xuất tăng cường 15-20% calo và bổ sung đạm sinh học cao.',
    };
  }, [activeTab, focusedDish]);

  if (!isOpen) return null;

  // ────────────────────────────────────────────────────────────────────
  // Renders
  // ────────────────────────────────────────────────────────────────────

  const renderBmiGroupSection = (
    group: NonNullable<MenuAdvisoryResponse['bmiRecommendations']['overweightGroup']>,
    type: 'OBESE' | 'STUNTED',
  ) => {
    const isObese = type === 'OBESE';
    const regulationName = isObese
      ? 'Thông tư 28/2016/TT-BGDĐT'
      : 'Quyết định 1246/QĐ-BYT';
    const sectionTitle = isObese
      ? 'Đề xuất các món ăn thanh đạm cho trẻ thừa cân / béo phì'
      : 'Đề xuất các món ăn đậm năng lượng & giàu vi chất cho trẻ còi xương / suy dinh dưỡng';
    const childListTitle = isObese
      ? 'Danh sách học sinh thừa cân / béo phì trong trường'
      : 'Danh sách học sinh còi xương / gầy còm / suy dinh dưỡng';

    return (
      <div className="space-y-6">
        {/* KPI METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className={isObese ? 'bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex flex-col justify-between' : 'bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between'}>
            <div className={isObese ? 'flex items-center justify-between text-rose-700' : 'flex items-center justify-between text-amber-700'}>
              <span className="text-[11px] font-bold uppercase tracking-wider">Tổng trẻ bị ảnh hưởng</span>
              <User className="w-4 h-4" />
            </div>
            <div className={isObese ? 'mt-2 text-2xl sm:text-3xl font-black text-rose-950' : 'mt-2 text-2xl sm:text-3xl font-black text-amber-950'}>
              {group.count}
            </div>
            <span className={isObese ? 'text-[11px] text-rose-600/80 mt-1 font-medium' : 'text-[11px] text-amber-600/80 mt-1 font-medium'}>
              Cần thực đơn thay thế riêng
            </span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tỷ lệ toàn trường</span>
              {isObese ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-950">
              {Math.round((group.count / Math.max(advisory?.bmiSummary.totalEvaluated || 1, 1)) * 100)}%
            </div>
            <span className="text-[11px] text-blue-600/80 mt-1 font-medium">
              Trên tổng {advisory?.bmiSummary.totalEvaluated || 0} trẻ
            </span>
          </div>

          <div className={isObese ? 'bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between' : 'bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 flex flex-col justify-between'}>
            <div className={isObese ? 'flex items-center justify-between text-emerald-700' : 'flex items-center justify-between text-teal-700'}>
              <span className="text-[11px] font-bold uppercase tracking-wider">Món đề xuất thay thế</span>
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div className={isObese ? 'mt-2 text-2xl sm:text-3xl font-black text-emerald-950' : 'mt-2 text-2xl sm:text-3xl font-black text-teal-950'}>
              {group.recommendedSubstituteDishes.length}
            </div>
            <span className={isObese ? 'text-[11px] text-emerald-600/80 mt-1 font-medium' : 'text-[11px] text-teal-600/80 mt-1 font-medium'}>
              Phù hợp thể trạng từ kho món
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">Quy chuẩn áp dụng</span>
              <Info className="w-4 h-4" />
            </div>
            <div className="mt-2 text-sm font-black text-slate-900 leading-snug">
              {regulationName}
            </div>
            <span className="text-[11px] text-slate-500/80 mt-1 font-medium">
              Bộ GD&ĐT / Bộ Y tế
            </span>
          </div>
        </div>

        {/* PHÁC ĐỒ DINH DƯỠNG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-5 rounded-2xl border space-y-2.5 ${
            isObese ? 'bg-rose-50/50 border-rose-200/70' : 'bg-amber-50/50 border-amber-200/70'
          }`}>
            <h5 className={`font-black text-xs uppercase tracking-wide flex items-center gap-1.5 ${
              isObese ? 'text-rose-900' : 'text-amber-900'
            }`}>
              <Info className={`w-4 h-4 ${isObese ? 'text-rose-600' : 'text-amber-600'}`} />
              <span>Chiến lược Dinh dưỡng Lâm sàng</span>
            </h5>
            <p className="text-xs text-slate-700 leading-relaxed">
              {group.clinicalStrategy}
            </p>
          </div>

          <div className={`p-5 rounded-2xl border space-y-2.5 ${
            isObese ? 'bg-amber-50/50 border-amber-200/70' : 'bg-teal-50/50 border-teal-200/70'
          }`}>
            <h5 className={`font-black text-xs uppercase tracking-wide flex items-center gap-1.5 ${
              isObese ? 'text-amber-900' : 'text-teal-900'
            }`}>
              <UtensilsCrossed className={`w-4 h-4 ${isObese ? 'text-amber-600' : 'text-teal-600'}`} />
              <span>Hướng dẫn Bếp & Giáo viên trên Lớp</span>
            </h5>
            <p className="text-xs text-slate-700 leading-relaxed">
              {group.portionAdvice}
            </p>
          </div>
        </div>

        {/* DANH SÁCH HỌC SINH */}
        <div className="space-y-3">
          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Baby className="w-4 h-4 text-slate-600" />
            <span>{childListTitle}:</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.children.map((child) => (
              <div
                key={child.childId}
                className={`p-4 rounded-2xl border space-y-2 shadow-2xs hover:shadow-xs transition ${
                  isObese ? 'bg-white border-rose-200/80' : 'bg-white border-amber-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white ${
                      isObese ? 'bg-rose-500' : 'bg-amber-500'
                    }`}>
                      {child.childName.charAt(0)}
                    </div>
                    <span className="font-black text-xs text-slate-900">{child.childName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                    isObese ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    BMI {child.bmi}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex flex-wrap gap-1.5">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">{child.className}</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">{child.weightKg}kg</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">{child.heightCm}cm</span>
                </div>
                <div className={`text-[10px] font-semibold italic ${
                  isObese ? 'text-rose-700' : 'text-amber-800'
                }`}>
                  {child.statusText}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ĐỀ XUẤT MÓN ĂN THAY THẾ */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isObese ? 'bg-emerald-50/30 border-emerald-200' : 'bg-teal-50/30 border-teal-200'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
              {isObese ? (
                <Apple className="w-5 h-5 text-emerald-600" />
              ) : (
                <Sparkles className="w-5 h-5 text-teal-600" />
              )}
              <span>{sectionTitle}</span>
            </h5>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
              isObese ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
            }`}>
              {group.recommendedSubstituteDishes.length} món
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.recommendedSubstituteDishes.map((dish) => (
              <div
                key={dish.dishId}
                className={`p-4 rounded-2xl border shadow-2xs hover:shadow-xs transition space-y-2 ${
                  isObese ? 'bg-white border-emerald-200' : 'bg-white border-teal-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-900">{dish.dishName}</span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                    isObese ? 'text-emerald-800 bg-emerald-100' : 'text-teal-800 bg-teal-100'
                  }`}>
                    {dish.totalCalories} Kcal
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                  <span className="text-blue-700">P: {dish.totalProteinG}g</span>
                  <span className="text-amber-700">L: {dish.totalFatG}g</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{dish.reason}</p>

                {focusMenuDishId && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {focusedDish?.substituteDishId === dish.dishId ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đang được gán cho món này</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplySubstitute(focusMenuDishId, null)}
                          disabled={applyingId === focusMenuDishId}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition border border-rose-200 cursor-pointer"
                        >
                          Hủy gán
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplySubstitute(focusMenuDishId, dish.dishId, activeTab as 'STUNTED' | 'OBESE')}
                        disabled={applyingId === focusMenuDishId}
                        className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer ${
                          isObese
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {applyingId === focusMenuDishId
                            ? 'Đang áp dụng...'
                            : `Gán món này thay thế cho [${focusedDish?.dish?.name || 'món đang chọn'}]`}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {group.recommendedSubstituteDishes.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              Hiện chưa có món ăn thay thế nào phù hợp trong kho món của trường.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200/90 overflow-hidden">
        {/* MODAL HEADER */}
        <div 
          style={{ backgroundColor: '#064e3b' }}
          className="p-5 sm:p-6 bg-slate-900 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white flex items-start justify-between relative overflow-hidden shrink-0"
        >
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-1.5 max-w-3xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold tracking-wide uppercase ${headerInfo.badgeColor}`}>
              <headerInfo.badgeIcon className="w-3.5 h-3.5" />
              <span>{headerInfo.badgeText}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{headerInfo.title}</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-normal">
              Thực đơn: <strong className="text-white underline underline-offset-2 font-bold">{advisory?.menuTitle || menuTitle || 'Thực đơn tuần'}</strong>. 
              {headerInfo.desc}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer relative z-10 border border-white/10"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK TOAST */}
        {feedback && (
          <div
            className={`px-5 py-3 text-xs font-bold flex items-center justify-between transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-rose-500 text-white shadow-md'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB / CATEGORY BAR */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 py-2.5 shrink-0">
          {internalLock ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">Đang xem:</span>
              {activeTab === 'ALLERGIES' && (
                <div className="px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 bg-purple-700 text-white shadow-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Loại 3: Dị ứng Thực phẩm</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white/20">
                    {focusMenuDishId ? filteredConflicts.length : allergyCount} bé
                  </span>
                </div>
              )}
              {activeTab === 'OBESE' && (
                <div className="px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 bg-rose-600 text-white shadow-sm">
                  <Flame className="w-4 h-4" />
                  <span>Loại 2: Béo phì / Thừa cân</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white/20">
                    {obeseCount} bé
                  </span>
                </div>
              )}
              {activeTab === 'STUNTED' && (
                <div className="px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 bg-amber-600 text-white shadow-sm">
                  <Heart className="w-4 h-4" />
                  <span>Loại 1: Còi xương / Suy dinh dưỡng</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white/20">
                    {stuntedCount} bé
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setInternalLock(null)}
                className="ml-2 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition cursor-pointer"
                title="Bấm để mở danh sách cả 3 loại"
              >
                Chuyển xem loại khác
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
              {/* TAB 1: Còi xương / Suy dinh dưỡng */}
              <button
                onClick={() => setActiveTab('STUNTED')}
                className={`px-3 sm:px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'STUNTED'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Loại 1:</span>
                <span>Còi xương / SDD</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                    activeTab === 'STUNTED' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {stuntedCount}
                </span>
              </button>

              {/* TAB 2: Béo phì / Thừa cân */}
              <button
                onClick={() => setActiveTab('OBESE')}
                className={`px-3 sm:px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'OBESE'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span className="hidden sm:inline">Loại 2:</span>
                <span>Béo phì</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                    activeTab === 'OBESE' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {obeseCount}
                </span>
              </button>

              {/* TAB 3: Dị ứng */}
              <button
                onClick={() => setActiveTab('ALLERGIES')}
                className={`px-3 sm:px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'ALLERGIES'
                    ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">Loại 3:</span>
                <span>Dị ứng</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                    activeTab === 'ALLERGIES' ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {allergyCount}
                </span>
              </button>
            </div>
          )}

          <button
            onClick={fetchAdvisory}
            disabled={loading}
            className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại phân tích"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* BANNER THÔNG TIN MÓN ĐANG ĐƯỢC CHỌN ĐỂ ĐỀ XUẤT THAY THẾ */}
          {focusedDish && (
            <div 
              style={{ backgroundColor: '#0f172a' }}
              className="p-4 rounded-2xl bg-slate-900 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-700 animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/40">
                  <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-300 font-black uppercase tracking-wider bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-700/80">
                      Mục tiêu đề xuất món thay thế
                    </span>
                    <span className="text-xs text-slate-200 font-bold">
                      {dayNames[focusedDish.dayOfWeek]} • {mealTimeNames[focusedDish.mealTime] || focusedDish.mealTime}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-1">
                    {focusedDish.dish?.name}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Khẩu phần gốc</span>
                  <span className="text-xs font-black text-amber-400">
                    {focusedDish.plannedCalories || focusedDish.dish?.totalCalories} Kcal • {focusedDish.portionSizeG || 100}g
                  </span>
                </div>
                {focusedDish.substituteDish && (() => {
                  const subNotes = (focusedDish.specialDietNotes || '').toUpperCase();
                  const isAllergy = subNotes.includes('LOẠI 3') || subNotes.includes('DỊ ỨNG') || subNotes.includes('ALLERG');
                  const isObese = subNotes.includes('LOẠI 2') || subNotes.includes('BÉO PHÌ') || subNotes.includes('THỪA CÂN');
                  const isStunted = subNotes.includes('LOẠI 1') || subNotes.includes('CÒI XƯƠNG') || subNotes.includes('SUY DINH DƯỠNG');
                  const catLabel = isAllergy ? 'Loại 3: Dị ứng' : isObese ? 'Loại 2: Béo phì' : isStunted ? 'Loại 1: Còi xương' : 'Chế độ riêng';
                  return (
                    <div className="bg-emerald-950/80 border border-emerald-700/80 px-3 py-1.5 rounded-xl text-right">
                      <span className="text-[10px] text-emerald-400 block font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Đã gán cho {catLabel}
                      </span>
                      <span className="text-xs font-black text-emerald-300">
                        {focusedDish.substituteDish.name}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          {loading && !advisory ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Đang quét hồ sơ sức khỏe và dị ứng toàn bộ học sinh...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-bold">Đã xảy ra lỗi</h4>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          ) : activeTab === 'STUNTED' ? (
            /* ════════════════════════════════════════════════════════════ */
            /* TAB 1: LOẠI 1 — CÒI XƯƠNG / SUY DINH DƯỠNG / GẦY CÒM    */
            /* ════════════════════════════════════════════════════════════ */
            <div className="space-y-6">
              {/* Section intro banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-yellow-50/60 to-orange-50/30 border border-amber-200 flex items-start gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                  <Heart className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-amber-950">
                    {focusedDish
                      ? `Loại 1: Điều chỉnh Dinh dưỡng Món "${focusedDish.dish?.name}" cho Trẻ Còi xương`
                      : 'Loại 1: Thực đơn Thay thế cho Trẻ Còi xương / Suy dinh dưỡng'}
                  </h3>
                  <p className="text-xs text-amber-900/80 leading-relaxed">
                    Trẻ bị <strong>gầy còm (wasted)</strong>, <strong>thấp còi (stunted)</strong>, hoặc <strong>nhẹ cân (underweight)</strong> theo chỉ số Z-score WHO cần được tăng cường 15-20% mật độ năng lượng khẩu phần, ưu tiên đạm sinh học cao (thịt đỏ, cá, trứng), bổ sung Canxi, Sắt, Kẽm và Vitamin nhóm B theo Quyết định 1246/QĐ-BYT.
                  </p>
                </div>
              </div>

              {advisory?.bmiRecommendations.wastedGroup ? (
                renderBmiGroupSection(advisory.bmiRecommendations.wastedGroup, 'STUNTED')
              ) : (
                <div className="py-12 text-center rounded-3xl bg-emerald-50 border border-dashed border-emerald-200 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">Không có học sinh còi xương / suy dinh dưỡng</h4>
                  <p className="text-xs text-slate-500">
                    Tất cả học sinh trong trường đều có chỉ số tăng trưởng bình thường.
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'OBESE' ? (
            /* ════════════════════════════════════════════════════════════ */
            /* TAB 2: LOẠI 2 — BÉO PHÌ / THỪA CÂN                       */
            /* ════════════════════════════════════════════════════════════ */
            <div className="space-y-6">
              {/* Section intro banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-pink-50/60 to-orange-50/30 border border-rose-200 flex items-start gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/30">
                  <Flame className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-rose-950">
                    {focusedDish
                      ? `Loại 2: Điều chỉnh Giảm Calo/Béo Món "${focusedDish.dish?.name}" cho Trẻ Béo phì`
                      : 'Loại 2: Thực đơn Thay thế cho Trẻ Béo phì / Thừa cân'}
                  </h3>
                  <p className="text-xs text-rose-900/80 leading-relaxed">
                    Trẻ bị <strong>thừa cân (overweight)</strong> hoặc <strong>béo phì (obese)</strong> cần kiểm soát giảm 15-20% tổng calo, hạn chế đồ rán, mỡ và tinh bột nhanh, tăng cường chất xơ từ rau củ tươi, ưu tiên các món hấp, luộc, thanh đạm theo Thông tư 28/2016/TT-BGDĐT.
                  </p>
                </div>
              </div>

              {advisory?.bmiRecommendations.overweightGroup ? (
                renderBmiGroupSection(advisory.bmiRecommendations.overweightGroup, 'OBESE')
              ) : (
                <div className="py-12 text-center rounded-3xl bg-emerald-50 border border-dashed border-emerald-200 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">Không có học sinh béo phì / thừa cân</h4>
                  <p className="text-xs text-slate-500">
                    Tất cả học sinh đều có chỉ số BMI trong giới hạn bình thường.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════ */
            /* TAB 3: LOẠI 3 — TRẺ BỊ DỊ ỨNG THỰC PHẨM                  */
            /* ════════════════════════════════════════════════════════════ */
            <div className="space-y-6">
              {/* Section intro banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-violet-50/60 to-rose-50/30 border border-purple-200 flex items-start gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-purple-950">
                    {focusedDish
                      ? `Loại 3: Danh sách Học sinh Dị ứng Món "${focusedDish.dish?.name}"`
                      : 'Loại 3: Thực đơn Thay thế cho Trẻ bị Dị ứng Thực phẩm'}
                  </h3>
                  <p className="text-xs text-purple-900/80 leading-relaxed">
                    {focusedDish ? (
                      <>
                        Phát hiện <strong>{dishAllergyKidsCount} học sinh</strong> trong trường bị dị ứng với thành phần món này (<strong>{Array.from(new Set(filteredConflicts.map((c) => c.allergenDetected))).join(', ') || 'Dị nguyên'}</strong>). Dưới đây là thông tin chi tiết từng bé và danh sách món ăn thay thế an toàn 100% không chứa dị nguyên từ kho món.
                      </>
                    ) : (
                      <>
                        Dựa trên hồ sơ dị ứng do <strong>phụ huynh khai báo</strong>, hệ thống tự động quét toàn bộ nguyên liệu trong thực đơn tuần, phát hiện xung đột, gợi ý <strong>nguyên liệu thay thế an toàn</strong> cho nhà bếp và đề xuất <strong>món ăn an toàn 100%</strong> từ kho món của trường để gán thay thế 1-click.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* TOP 4 METRICS CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-rose-700">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {focusMenuDishId ? 'Ca dị ứng món này' : 'Tổng ca xung đột'}
                    </span>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-950">
                    {focusMenuDishId ? filteredConflicts.length : (advisory?.allergySummary.totalConflicts || 0)}
                  </div>
                  <span className="text-[11px] text-rose-600/80 mt-1 font-medium">
                    {focusMenuDishId ? 'Học sinh xung đột trực tiếp' : 'Trong toàn bộ tuần học'}
                  </span>
                </div>

                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-700">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {focusMenuDishId ? 'Mức độ cảnh báo' : 'Nguy cấp (Severe)'}
                    </span>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-black text-amber-950">
                    {focusMenuDishId
                      ? filteredConflicts.some((c) => c.severity === 'SEVERE' || c.severity === 'ANAPHYLACTIC')
                        ? 'Nguy cấp'
                        : 'Cảnh báo'
                      : (advisory?.allergySummary.criticalCount || 0)}
                  </div>
                  <span className="text-[11px] text-amber-700/80 mt-1 font-medium">
                    {focusMenuDishId ? 'Cần suất ăn riêng biệt tuyệt đối' : 'Cần suất ăn riêng biệt tuyệt đối'}
                  </span>
                </div>

                <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-blue-700">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Trẻ bị ảnh hưởng</span>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-950">
                    {focusMenuDishId
                      ? dishAllergyKidsCount
                      : (advisory?.allergySummary.affectedChildrenCount || 0)}
                  </div>
                  <span className="text-[11px] text-blue-600/80 mt-1 font-medium">
                    {focusMenuDishId ? 'Bé dị ứng món đang chọn' : 'Học sinh có tiền sử dị ứng'}
                  </span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-emerald-700">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {focusMenuDishId ? 'Dị nguyên phát hiện' : 'Món ăn có dị nguyên'}
                    </span>
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div className="mt-2 text-sm sm:text-base font-black text-emerald-950 truncate">
                    {focusMenuDishId
                      ? Array.from(new Set(filteredConflicts.map((c) => c.allergenDetected))).join(', ') || 'Không có'
                      : `${advisory?.allergySummary.affectedDishesCount || 0} món`}
                  </div>
                  <span className="text-[11px] text-emerald-700/80 mt-1 font-medium">
                    {focusMenuDishId ? 'Cần tránh tuyệt đối cho trẻ' : 'Cần gán món thay thế an toàn'}
                  </span>
                </div>
              </div>

              {/* FILTER TOOLBAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex flex-wrap items-center gap-2">
                  {focusMenuDishId ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-100/90 border border-purple-200 text-purple-900 text-xs font-bold">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                      <span>
                        Đang xem riêng học sinh dị ứng món: <strong className="underline underline-offset-2">{focusedDish?.dish?.name}</strong>
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => setSeverityFilter('ALL')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            severityFilter === 'ALL'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Tất cả
                        </button>
                        <button
                          onClick={() => setSeverityFilter('CRITICAL')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            severityFilter === 'CRITICAL'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Nguy cấp ({advisory?.allergySummary.criticalCount || 0})
                        </button>
                        <button
                          onClick={() => setSeverityFilter('WARNING')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            severityFilter === 'WARNING'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          Cảnh báo ({advisory?.allergySummary.warningCount || 0})
                        </button>
                      </div>

                      {/* Day filter */}
                      <select
                        value={dayFilter}
                        onChange={(e) => setDayFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="ALL">Tất cả các ngày trong tuần</option>
                        <option value={1}>Thứ Hai</option>
                        <option value={2}>Thứ Ba</option>
                        <option value={3}>Thứ Tư</option>
                        <option value={4}>Thứ Năm</option>
                        <option value={5}>Thứ Sáu</option>
                        <option value={6}>Thứ Bảy</option>
                        <option value={7}>Chủ Nhật</option>
                      </select>
                    </>
                  )}
                </div>

                {/* Search input */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchChild}
                    onChange={(e) => setSearchChild(e.target.value)}
                    placeholder="Tìm tên bé, lớp, món ăn..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* CONFLICTS LIST */}
              {filteredConflicts.length === 0 ? (
                <div className="py-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">
                    {focusMenuDishId
                      ? `Món "${focusedDish?.dish?.name || 'này'}" an toàn tuyệt đối`
                      : 'Không có xung đột dị ứng nào theo bộ lọc'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {focusMenuDishId
                      ? 'Không có bất kỳ học sinh nào trong trường bị dị ứng với nguyên liệu của món ăn này.'
                      : 'Tất cả món ăn trong phạm vi đã chọn đều an toàn cho các bé.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredConflicts.map((item) => (
                    <div
                      key={item.conflictId}
                      className={`p-5 rounded-3xl border transition shadow-xs space-y-4 ${
                        item.menuDishId === focusMenuDishId ? 'ring-2 ring-rose-500 shadow-md bg-rose-50/50' : ''
                      } ${
                        item.severity === 'SEVERE' || item.severity === 'ANAPHYLACTIC'
                          ? 'bg-rose-50/30 border-rose-200/90 hover:border-rose-300'
                          : 'bg-amber-50/30 border-amber-200/80 hover:border-amber-300'
                      }`}
                    >
                      {/* CARD ROW 1: CHILD INFO & DISH INFO */}
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        {/* Bé & Dị ứng */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0 ${
                              item.severity === 'SEVERE' || item.severity === 'ANAPHYLACTIC'
                                ? 'bg-rose-600'
                                : 'bg-amber-600'
                            }`}
                          >
                            {item.childName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-slate-900">{item.childName}</h4>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                {item.className}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                  item.severity === 'SEVERE' || item.severity === 'ANAPHYLACTIC'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {item.severity === 'ANAPHYLACTIC'
                                  ? 'Sốc phản vệ nguy cấp'
                                  : item.severity === 'SEVERE'
                                  ? 'Dị ứng nặng'
                                  : 'Dị ứng vừa'}
                              </span>
                            </div>
                            <div className="text-xs text-rose-700 font-bold flex items-center gap-1.5 mt-0.5">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <span>Dị ứng: {item.allergenDetected}</span>
                              {item.reactionTreatment && (
                                <span className="text-[11px] text-slate-500 font-normal">
                                  — Xử trí khẩn cấp: {item.reactionTreatment}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Món ăn xung đột trong thực đơn */}
                        <div className="text-right sm:text-right">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Món trong thực đơn
                          </div>
                          <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-1.5 justify-end">
                            <span className="text-rose-600 underline underline-offset-2">
                              {item.dishName}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              ({item.portionSizeG}g - {item.plannedCalories} Kcal)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                            {dayNames[item.dayOfWeek] || `Thứ ${item.dayOfWeek}`} • {mealTimeNames[item.mealTime] || item.mealTime}
                          </div>
                        </div>
                      </div>

                      {/* CARD ROW 2: PROBLEMATIC INGREDIENTS BANNER */}
                      <div className="p-3 rounded-2xl bg-white border border-rose-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800">
                            Thành phần gây dị ứng trong món:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.problematicIngredients.map((ing, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-xs font-black border border-rose-300"
                              >
                                {ing.foodName} ({ing.netWeightPerPortionG}g)
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Trạng thái đã gán món thay thế */}
                        {item.substituteDishId ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Đã gán: {item.currentSubstituteDishName}</span>
                            </span>
                            <button
                              onClick={() => handleApplySubstitute(item.menuDishId, null)}
                              disabled={applyingId === item.menuDishId}
                              className="px-2 py-1 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              Hủy gán
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
                            Chưa gán món thay thế
                          </span>
                        )}
                      </div>

                      {/* CARD ROW 3: 2 ACTION COLUMNS (INGREDIENTS & DISHES) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* CỘT 1: GỢI Ý NGUYÊN LIỆU THAY THẾ (DÀNH CHO BẾP CHẾ BIẾN RIÊNG) */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-2xs">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                              <ChefHat className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                Gợi ý nguyên liệu thay thế cho Bếp
                              </h5>
                              <p className="text-[10px] text-slate-500">
                                Giữ trọn vẹn cấu trúc món, đổi thành phần dị nguyên
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            {item.suggestedIngredientSubstitutions.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90 text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between font-bold text-slate-800">
                                  <span className="text-rose-600 line-through">
                                    {sub.originalIngredient}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="text-emerald-700 font-black">
                                    {sub.substituteIngredient} ({sub.suggestedGram}g)
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 leading-relaxed">
                                  <strong>Dinh dưỡng:</strong> {sub.nutritionNote}
                                </div>
                                <div className="text-[10px] text-amber-800 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/60">
                                  <strong>Lưu ý bếp:</strong> {sub.preparationAdvice}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* CỘT 2: GỢI Ý MÓN ĂN THAY THẾ AN TOÀN TRONG KHO (DÀNH CHO THỰC ĐƠN) */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-2xs">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                              <UtensilsCrossed className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                Món ăn an toàn thay thế từ Kho món
                              </h5>
                              <p className="text-[10px] text-slate-500">
                                100% không chứa chất dị ứng của bé, calo tương đương
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {item.suggestedSubstituteDishes.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2">
                                Không tìm thấy món thay thế phù hợp trong kho món của trường.
                              </p>
                            ) : (
                              item.suggestedSubstituteDishes.map((subDish) => {
                                const isCurrent = item.substituteDishId === subDish.dishId;
                                return (
                                  <div
                                    key={subDish.dishId}
                                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                                      isCurrent
                                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                                        : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-100/70'
                                    }`}
                                  >
                                    <div className="space-y-0.5">
                                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                        <span>{subDish.dishName}</span>
                                        {isCurrent && (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                                            Đang áp dụng
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-medium">
                                        {subDish.totalCalories} Kcal • {subDish.totalProteinG}g Đạm • {subDish.totalFatG}g Béo
                                      </div>
                                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                                        Thành phần: {subDish.ingredientsSummary}
                                      </div>
                                    </div>

                                    <button
                                      onClick={() =>
                                        handleApplySubstitute(
                                          item.menuDishId,
                                          isCurrent ? null : subDish.dishId,
                                          'ALLERGIES',
                                          `${item.childName} (${item.allergenDetected})`,
                                        )
                                      }
                                      disabled={applyingId === item.menuDishId}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                                        isCurrent
                                          ? 'bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                      }`}
                                    >
                                      {applyingId === item.menuDishId ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : isCurrent ? (
                                        'Hủy gán'
                                      ) : (
                                        'Gán món này'
                                      )}
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            Mọi thay đổi món ăn thay thế sẽ tự động đồng bộ sang bảng điều phối nhà bếp và nhật ký ăn bán trú của trẻ.
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition ml-auto cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
