import React, { useState, useEffect } from 'react';
import { X, Utensils, Flame, Sparkles, AlertTriangle, ShieldCheck, Plus, Check } from 'lucide-react';
import { DishItem, MenuDishItem, AdjustDishPayload } from '../api/weekly-menus.api';

interface DishAdjustmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AdjustDishPayload) => Promise<void>;
  dishes: DishItem[];
  initialSlot?: {
    dayOfWeek: number;
    mealTime: string;
    existingDish?: MenuDishItem | null;
  } | null;
}

export const DishAdjustmentDrawer: React.FC<DishAdjustmentDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dishes,
  initialSlot,
}) => {
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [mealTime, setMealTime] = useState<string>('LUNCH');
  const [selectedDishId, setSelectedDishId] = useState<string>('');
  const [portionSizeG, setPortionSizeG] = useState<number>(100);
  const [substituteDishId, setSubstituteDishId] = useState<string>('');
  const [specialDietNotes, setSpecialDietNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayNames: Record<number, string> = {
    1: 'Thứ Hai',
    2: 'Thứ Ba',
    3: 'Thứ Tư',
    4: 'Thứ Năm',
    5: 'Thứ Sáu',
  };

  const mealTimeNames: Record<string, string> = {
    BREAKFAST: 'Bữa sáng (08h00)',
    MORNING_SNACK: 'Phụ sáng (09h30)',
    LUNCH: 'Bữa trưa chính (11h00)',
    AFTERNOON_SNACK: 'Phụ chiều / Xế (14h30)',
    LATE_SNACK: 'Ăn xế 17h (Dịch vụ muộn)',
  };

  useEffect(() => {
    if (initialSlot) {
      setDayOfWeek(initialSlot.dayOfWeek);
      setMealTime(initialSlot.mealTime);
      if (initialSlot.existingDish) {
        setSelectedDishId(initialSlot.existingDish.dishId);
        setPortionSizeG(Number(initialSlot.existingDish.portionSizeG) || 100);
        setSubstituteDishId(initialSlot.existingDish.substituteDishId || '');
        setSpecialDietNotes(initialSlot.existingDish.specialDietNotes || '');
      } else {
        setSelectedDishId(dishes[0]?.id || '');
        setPortionSizeG(100);
        setSubstituteDishId('');
        setSpecialDietNotes('');
      }
    }
    setError(null);
  }, [initialSlot, dishes, isOpen]);

  // Món ăn được chọn
  const currentDish = dishes.find((d) => d.id === selectedDishId);
  const substituteDish = dishes.find((d) => d.id === substituteDishId);

  // Tính calo dự kiến dựa trên định lượng gram
  const calculatedCalories = currentDish
    ? Math.round(
        (Number(currentDish.totalCalories) * (portionSizeG / Number(currentDish.standardServingSizeG || 100))),
      )
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDishId) {
      setError('Vui lòng chọn một món ăn.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        dayOfWeek,
        mealTime,
        dishId: selectedDishId,
        portionSizeG: Number(portionSizeG),
        substituteDishId: substituteDishId || undefined,
        specialDietNotes: specialDietNotes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi khi tinh chỉnh món ăn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Nền mờ Backdrop Blur */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-700 flex items-center justify-center font-bold shadow-inner">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {initialSlot?.existingDish ? 'Tinh chỉnh món ăn' : 'Thêm món vào bữa ăn'}
                </h2>
                <p className="text-xs text-slate-500">
                  {dayNames[dayOfWeek]} • {mealTimeNames[mealTime]}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Form */}
          <form id="dish-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Chọn Ngày & Bữa ăn */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ngày trong tuần
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white"
                >
                  <option value={1}>Thứ Hai</option>
                  <option value={2}>Thứ Ba</option>
                  <option value={3}>Thứ Tư</option>
                  <option value={4}>Thứ Năm</option>
                  <option value={5}>Thứ Sáu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bữa ăn
                </label>
                <select
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white"
                >
                  <option value="BREAKFAST">Bữa sáng (08h00)</option>
                  <option value="MORNING_SNACK">Phụ sáng (09h30)</option>
                  <option value="LUNCH">Bữa trưa chính (11h00)</option>
                  <option value="AFTERNOON_SNACK">Phụ chiều / Xế (14h30)</option>
                  <option value="LATE_SNACK">Ăn xế 17h (Dịch vụ)</option>
                </select>
              </div>
            </div>

            {/* Chọn Món ăn */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Chọn món ăn từ ngân hàng món <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedDishId}
                onChange={(e) => {
                  setSelectedDishId(e.target.value);
                  const d = dishes.find((item) => item.id === e.target.value);
                  if (d) setPortionSizeG(Number(d.standardServingSizeG) || 100);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white font-medium"
                required
              >
                <option value="">-- Chọn món ăn --</option>
                {dishes.map((dish) => (
                  <option key={dish.id} value={dish.id}>
                    {dish.name} ({dish.totalCalories} Kcal / {dish.standardServingSizeG}g)
                  </option>
                ))}
              </select>
            </div>

            {/* Định lượng suất ăn & Năng lượng tính toán */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Định lượng (Gram / suất) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    step={5}
                    value={portionSizeG}
                    onChange={(e) => setPortionSizeG(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-bold"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                    gam
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Năng lượng dự kiến
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 font-black text-xs sm:text-sm flex items-center justify-between">
                  <span>{calculatedCalories} Kcal</span>
                  <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
              </div>
            </div>

            {/* Thông tin vi chất dinh dưỡng của món ăn */}
            {currentDish && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <p className="text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">
                  Chỉ số dinh dưỡng theo suất ({portionSizeG}g):
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">Đạm (Protein)</span>
                    <span className="font-bold text-slate-800">
                      {(
                        Number(currentDish.totalProteinG) *
                        (portionSizeG / Number(currentDish.standardServingSizeG || 100))
                      ).toFixed(1)}g
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">Béo (Lipid)</span>
                    <span className="font-bold text-slate-800">
                      {(
                        Number(currentDish.totalFatG) *
                        (portionSizeG / Number(currentDish.standardServingSizeG || 100))
                      ).toFixed(1)}g
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">Bột đường (Carb)</span>
                    <span className="font-bold text-slate-800">
                      {(
                        Number(currentDish.totalCarbG) *
                        (portionSizeG / Number(currentDish.standardServingSizeG || 100))
                      ).toFixed(1)}g
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Món thay thế dị ứng (Substitute Dish) theo ai-menu-advisor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Món thay thế cho trẻ dị ứng (Tùy chọn)</span>
                <span className="text-[10px] font-normal text-emerald-600 lowercase bg-emerald-50 px-2 py-0.5 rounded-full">
                  Chuẩn AI Dinh dưỡng
                </span>
              </label>
              <select
                value={substituteDishId}
                onChange={(e) => setSubstituteDishId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition bg-white"
              >
                <option value="">-- Không có món thay thế (Dùng chung) --</option>
                {dishes
                  .filter((d) => d.id !== selectedDishId)
                  .map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name} ({dish.totalCalories} Kcal)
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Áp dụng cho học sinh có cảnh báo dị ứng hải sản / trứng / sữa bò trong lớp.
              </p>
            </div>

            {/* Ghi chú chế độ ăn đặc biệt */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi chú chế biến & Dị ứng
              </label>
              <textarea
                value={specialDietNotes}
                onChange={(e) => setSpecialDietNotes(e.target.value)}
                placeholder="Ví dụ: Cắt hạt lựu cho lớp Mầm, băm nhuyễn, ít muối..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
          </form>

          {/* Footer Drawer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="dish-form"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/25 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Xác nhận món</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
