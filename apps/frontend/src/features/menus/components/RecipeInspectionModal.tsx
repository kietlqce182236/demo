import React from 'react';
import { X, Utensils, Flame, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, Scale, Info, Layers, HeartHandshake } from 'lucide-react';
import { MenuDishItem, AllergyConflictItem } from '../api/weekly-menus.api';

interface RecipeInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuDish: MenuDishItem | null;
  dayLabel: string;
  slotName: string;
  allergyConflicts?: AllergyConflictItem[];
  onOpenAdvisory?: () => void;
  onEdit?: () => void;
}

export const RecipeInspectionModal: React.FC<RecipeInspectionModalProps> = ({
  isOpen,
  onClose,
  menuDish,
  dayLabel,
  slotName,
  allergyConflicts = [],
  onOpenAdvisory,
  onEdit,
}) => {
  if (!isOpen || !menuDish) return null;

  const dish = menuDish.dish;
  const portionSize = Number(menuDish.portionSizeG) || 100;
  const standardServing = Number(dish?.standardServingSizeG) || 100;
  const scalingRatio = standardServing > 0 ? portionSize / standardServing : 1;

  const recipeItems = dish?.recipeItems || [];

  // Tính toán dinh dưỡng thực tế theo công thức của trường
  let totalKcal = 0;
  let totalP = 0;
  let totalL = 0;
  let totalG = 0;
  let totalCa = 0;
  let totalFe = 0;
  let totalZn = 0;

  const itemsCalculated = recipeItems.map((ri) => {
    const food = ri.food;
    const netG = Number(ri.netWeightPerPortionG) * scalingRatio;
    const grossG = (Number(ri.grossWeightPerPortionG) || Number(ri.netWeightPerPortionG)) * scalingRatio;
    
    // Công thức: (Định lượng thực tế / 100) * Chỉ số trong DB
    const itemKcal = food ? (netG / 100) * Number(food.energyKcal) : 0;
    const itemP = food ? (netG / 100) * Number(food.proteinG) : 0;
    const itemL = food ? (netG / 100) * Number(food.fatG) : 0;
    const itemG = food ? (netG / 100) * Number(food.carbG) : 0;
    const itemCa = food ? (netG / 100) * (Number(food.calciumMg) || 0) : 0;
    const itemFe = food ? (netG / 100) * (Number(food.ironMg) || 0) : 0;
    const itemZn = food ? (netG / 100) * (Number(food.zincMg) || 0) : 0;

    totalKcal += itemKcal;
    totalP += itemP;
    totalL += itemL;
    totalG += itemG;
    totalCa += itemCa;
    totalFe += itemFe;
    totalZn += itemZn;

    return {
      ri,
      food,
      netG,
      grossG,
      itemKcal,
      itemP,
      itemL,
      itemG,
      allergens: food?.allergens || [],
    };
  });

  // Nếu không có recipeItems chi tiết thì fallback theo dish
  if (recipeItems.length === 0 && dish) {
    totalKcal = Number(menuDish.plannedCalories) || (Number(dish.totalCalories) * scalingRatio);
    totalP = Number(dish.totalProteinG) * scalingRatio;
    totalL = Number(dish.totalFatG) * scalingRatio;
    totalG = Number(dish.totalCarbG) * scalingRatio;
  }

  // Tỷ lệ P - L - G
  const pCal = totalP * 4;
  const lCal = totalL * 9;
  const gCal = totalG * 4;
  const sumEnergyCal = pCal + lCal + gCal;
  const pPct = sumEnergyCal > 0 ? Math.round((pCal / sumEnergyCal) * 100) : 0;
  const lPct = sumEnergyCal > 0 ? Math.round((lCal / sumEnergyCal) * 100) : 0;
  const gPct = sumEnergyCal > 0 ? 100 - pPct - lPct : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {dayLabel} • {slotName}
                </span>
                <span className="bg-emerald-400/30 text-emerald-100 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  Khẩu phần: {portionSize}g
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-200" />
                {dish?.name || 'Chi tiết món ăn'}
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Công thức & định lượng nguyên liệu khớp 100% với thực đơn bán trú học đường
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* CẢNH BÁO DỊ ỨNG HỌC SINH TỪ PHỤ HUYNH (NẾU CÓ XUNG ĐỘT) */}
            {allergyConflicts.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/60 border-2 border-rose-300 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-rose-950 font-black text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse shrink-0" />
                    <span>CẢNH BÁO DỊ ỨNG HỌC SINH ({allergyConflicts.length} bé bị ảnh hưởng)</span>
                  </div>
                  {onOpenAdvisory && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdvisory();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                      <span>Xem tư vấn & Gán món thay thế</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {allergyConflicts.map((c, idx) => {
                    const isCritical = c.severity === 'SEVERE' || c.severity === 'ANAPHYLACTIC';
                    return (
                      <div key={idx} className="bg-white/95 p-2.5 rounded-xl border border-rose-200 flex items-center justify-between shadow-2xs">
                        <div>
                          <span className="font-bold text-slate-800">{c.childName}</span>
                          <span className="text-slate-500 text-[11px] ml-1.5">Lớp {c.className}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          isCritical ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-white'
                        }`}>
                          {c.allergenDetected} ({isCritical ? 'Nguy kịch' : 'Cảnh báo'})
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Gợi ý nguyên liệu thay thế cho bếp */}
                {allergyConflicts[0]?.suggestedIngredientSubstitutions?.length > 0 && (
                  <div className="mt-2 pt-2.5 border-t border-rose-200">
                    <span className="text-xs font-black text-rose-900 flex items-center gap-1 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Gợi ý nguyên liệu thay thế an toàn cho bếp trường học:
                    </span>
                    <div className="space-y-1.5">
                      {allergyConflicts[0].suggestedIngredientSubstitutions.map((sub, sIdx) => (
                        <div key={sIdx} className="bg-white/95 p-2.5 rounded-xl border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="line-through text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                              {sub.originalIngredient}
                            </span>
                            <span className="text-slate-400 font-bold">➡️</span>
                            <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {sub.substituteIngredient} ({sub.suggestedGram}g)
                            </span>
                          </div>
                          <span className="text-[11px] text-emerald-700 italic max-w-sm">
                            {sub.preparationAdvice || sub.nutritionNote}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Banner quy tắc tính dinh dưỡng chuẩn */}
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Scale className="w-4 h-4" />
              </div>
              <div className="text-xs text-emerald-950">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <span>Quy tắc chuẩn hóa dinh dưỡng:</span>
                  <span className="bg-emerald-200/60 text-emerald-900 px-1.5 py-0.2 rounded font-mono text-[11px]">
                    Dinh dưỡng = (Định lượng ăn được / 100) × Chỉ số DB
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700/90 mt-0.5 leading-relaxed">
                  Nguyên liệu cấu thành được tính toán trên 100% phần ăn được, tự động quy đổi chính xác từ kho nguyên liệu thực phẩm trường sang khẩu phần thực tế.
                </p>
              </div>
            </div>

            {/* Thẻ KPI Năng lượng & Tỷ lệ P - L - G */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-bold text-amber-600 block uppercase">Năng lượng</span>
                <span className="text-lg font-black text-amber-900">
                  {Math.round(totalKcal * 10) / 10}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block">Kcal / suất</span>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-bold text-blue-600 block uppercase">Đạm (P)</span>
                <span className="text-lg font-black text-blue-900">
                  {(Math.round(totalP * 10) / 10).toFixed(1)}g
                </span>
                <span className="text-[10px] text-blue-700 font-semibold block">{pPct}% năng lượng</span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-bold text-amber-600 block uppercase">Béo (L)</span>
                <span className="text-lg font-black text-amber-900">
                  {(Math.round(totalL * 10) / 10).toFixed(1)}g
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block">{lPct}% năng lượng</span>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-600 block uppercase">Carb (G)</span>
                <span className="text-lg font-black text-emerald-900">
                  {(Math.round(totalG * 10) / 10).toFixed(1)}g
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block">{gPct}% năng lượng</span>
              </div>
            </div>

            {/* Bảng chi tiết Nguyên liệu & Công thức */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  Bảng định lượng nguyên liệu cấu thành ({itemsCalculated.length} nguyên liệu)
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Khẩu phần chuẩn: {standardServing}g → Thực tế: {portionSize}g
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Tên nguyên liệu</th>
                      <th className="py-2.5 px-2 text-center">Định lượng</th>
                      <th className="py-2.5 px-2 text-center">Calo (Kcal)</th>
                      <th className="py-2.5 px-2 text-center">P (g)</th>
                      <th className="py-2.5 px-2 text-center">L (g)</th>
                      <th className="py-2.5 px-2 text-center">G (g)</th>
                      <th className="py-2.5 px-3 text-center">Dị ứng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {itemsCalculated.map((item, idx) => {
                      const isConflicted = allergyConflicts.some(c => 
                        c.problematicIngredients?.some(p => p.foodId === item.food?.id || p.foodName === item.food?.name)
                      );

                      return (
                        <tr 
                          key={idx} 
                          className={`transition ${
                            isConflicted 
                              ? 'bg-rose-50/80 hover:bg-rose-100/80 font-bold' 
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              {isConflicted && (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-pulse" />
                              )}
                              <span>{item.food?.name || 'Nguyên liệu'}</span>
                              {isConflicted && (
                                <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded uppercase">
                                  Xung đột
                                </span>
                              )}
                            </div>
                            {item.ri.prepNotes && (
                              <span className="block text-[10px] text-slate-400 font-normal italic">
                                {item.ri.prepNotes}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700 bg-slate-50/50">
                            {Math.round(item.netG * 10) / 10}g
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-amber-700">
                            {Math.round(item.itemKcal * 10) / 10}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                            {(Math.round(item.itemP * 10) / 10).toFixed(1)}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                            {(Math.round(item.itemL * 10) / 10).toFixed(1)}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                            {(Math.round(item.itemG * 10) / 10).toFixed(1)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.allergens.length > 0 ? (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                isConflicted 
                                  ? 'bg-rose-600 text-white border-rose-700 shadow-2xs animate-pulse' 
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {item.allergens.join(', ')}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                An toàn
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {itemsCalculated.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          Chưa có dữ liệu nguyên liệu chi tiết cho món ăn này.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {/* Tổng cộng footer */}
                  {itemsCalculated.length > 0 && (
                    <tfoot className="bg-slate-50/90 font-bold border-t border-slate-200 text-slate-800">
                      <tr>
                        <td className="py-2.5 px-3">Tổng cộng ({portionSize}g phần ăn):</td>
                        <td className="py-2.5 px-2 text-center text-slate-900 font-black">
                          {Math.round(itemsCalculated.reduce((acc, i) => acc + i.netG, 0) * 10) / 10}g
                        </td>
                        <td className="py-2.5 px-2 text-center text-amber-800 font-black">
                          {Math.round(totalKcal * 10) / 10} Kcal
                        </td>
                        <td className="py-2.5 px-2 text-center text-blue-800 font-black">
                          {(Math.round(totalP * 10) / 10).toFixed(1)}g
                        </td>
                        <td className="py-2.5 px-2 text-center text-amber-800 font-black">
                          {(Math.round(totalL * 10) / 10).toFixed(1)}g
                        </td>
                        <td className="py-2.5 px-2 text-center text-emerald-800 font-black">
                          {(Math.round(totalG * 10) / 10).toFixed(1)}g
                        </td>
                        <td className="py-2.5 px-3 text-center text-[10px] text-slate-500 font-normal">
                          {itemsCalculated.some(i => i.allergens.length > 0) ? 'Có dị nguyên' : '100% An toàn'}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Món thay thế nếu có */}
            {menuDish.substituteDish && (
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <div>
                    <span className="text-xs font-bold text-teal-900 block">
                      Món thay thế cho trẻ dị ứng: {menuDish.substituteDish.name}
                    </span>
                    <span className="text-[11px] text-teal-700">
                      Calo: {menuDish.substituteDish.totalCalories} Kcal | P: {menuDish.substituteDish.totalProteinG}g | L: {menuDish.substituteDish.totalFatG}g | G: {menuDish.substituteDish.totalCarbG}g
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dữ liệu đồng bộ trực tiếp từ CSDL Dinh dưỡng Bán trú</span>
            </div>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Điều chỉnh món này
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
