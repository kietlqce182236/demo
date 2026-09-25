import React, { useState, useEffect } from 'react';
import { X, Sparkles, Scale, AlertCircle, Check, Info } from 'lucide-react';
import {
  NutritionRule,
  CreateNutritionRulePayload,
  UpdateNutritionRulePayload,
} from '../api/nutrition-rule-engine.api';

interface NutritionRuleDrawerProps {
  isOpen: boolean;
  rule: NutritionRule | null; // null = CREATE, not null = EDIT
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateNutritionRulePayload | UpdateNutritionRulePayload, id?: string) => Promise<void>;
}

export const NutritionRuleDrawer: React.FC<NutritionRuleDrawerProps> = ({
  isOpen,
  rule,
  isLoading,
  onClose,
  onSubmit,
}) => {
  const isEditMode = Boolean(rule);

  // Form states
  const [name, setName] = useState('');
  const [targetAgeGroup, setTargetAgeGroup] = useState('KINDERGARTEN_3_4Y');
  const [mealScope, setMealScope] = useState('FULL_DAY_SCHOOL');

  const [minCaloriesKcal, setMinCaloriesKcal] = useState(615);
  const [maxCaloriesKcal, setMaxCaloriesKcal] = useState(726);

  const [minProteinPercent, setMinProteinPercent] = useState(13);
  const [maxProteinPercent, setMaxProteinPercent] = useState(20);

  const [minFatPercent, setMinFatPercent] = useState(25);
  const [maxFatPercent, setMaxFatPercent] = useState(35);

  const [minCarbPercent, setMinCarbPercent] = useState(52);
  const [maxCarbPercent, setMaxCarbPercent] = useState(60);

  const [minCalciumMg, setMinCalciumMg] = useState(350);
  const [minIronMg, setMinIronMg] = useState(5);
  const [minZincMg, setMinZincMg] = useState(3);
  const [maxSodiumMg, setMaxSodiumMg] = useState(1500);

  const [caPRatioMin, setCaPRatioMin] = useState(1.0);
  const [caPRatioMax, setCaPRatioMax] = useState(1.5);

  const [isStrict, setIsStrict] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (rule) {
        setName(rule.name);
        setTargetAgeGroup(rule.targetAgeGroup);
        setMealScope(rule.mealScope || 'FULL_DAY_SCHOOL');
        setMinCaloriesKcal(Number(rule.minCaloriesKcal));
        setMaxCaloriesKcal(Number(rule.maxCaloriesKcal));
        setMinProteinPercent(Number(rule.minProteinPercent));
        setMaxProteinPercent(Number(rule.maxProteinPercent));
        setMinFatPercent(Number(rule.minFatPercent));
        setMaxFatPercent(Number(rule.maxFatPercent));
        setMinCarbPercent(Number(rule.minCarbPercent));
        setMaxCarbPercent(Number(rule.maxCarbPercent));
        setMinCalciumMg(Number(rule.minCalciumMg));
        setMinIronMg(Number(rule.minIronMg));
        setMinZincMg(Number(rule.minZincMg));
        setMaxSodiumMg(rule.maxSodiumMg ? Number(rule.maxSodiumMg) : 1500);
        setCaPRatioMin(Number(rule.caPRatioMin));
        setCaPRatioMax(Number(rule.caPRatioMax));
        setIsStrict(rule.isStrict);
        setIsActive(rule.isActive);
      } else {
        setName('');
        setTargetAgeGroup('KINDERGARTEN_3_4Y');
        setMealScope('FULL_DAY_SCHOOL');
        setMinCaloriesKcal(615);
        setMaxCaloriesKcal(726);
        setMinProteinPercent(13);
        setMaxProteinPercent(20);
        setMinFatPercent(25);
        setMaxFatPercent(35);
        setMinCarbPercent(52);
        setMaxCarbPercent(60);
        setMinCalciumMg(350);
        setMinIronMg(5);
        setMinZincMg(3);
        setMaxSodiumMg(1500);
        setCaPRatioMin(1.0);
        setCaPRatioMax(1.5);
        setIsStrict(true);
        setIsActive(true);
      }
    }
  }, [isOpen, rule]);

  // Tự động gợi ý chuẩn Thông tư 28 theo nhóm tuổi
  const handleSelectAgeGroupPreset = (age: string) => {
    setTargetAgeGroup(age);
    if (age === 'TODDLER_18_36M') {
      setMinCaloriesKcal(600);
      setMaxCaloriesKcal(735);
      setMinProteinPercent(13);
      setMaxProteinPercent(20);
      setMinFatPercent(30);
      setMaxFatPercent(40);
      setMinCarbPercent(47);
      setMaxCarbPercent(50);
      setMinCalciumMg(300);
      setMinIronMg(4);
      setMinZincMg(2.5);
      if (!name || name.includes('Mẫu giáo')) {
        setName('Chuẩn Dinh dưỡng Nhà trẻ (18 - 36 tháng)');
      }
    } else {
      setMinCaloriesKcal(615);
      setMaxCaloriesKcal(726);
      setMinProteinPercent(13);
      setMaxProteinPercent(20);
      setMinFatPercent(25);
      setMaxFatPercent(35);
      setMinCarbPercent(52);
      setMaxCarbPercent(60);
      setMinCalciumMg(350);
      setMinIronMg(5);
      setMinZincMg(3);
      if (!name || name.includes('Nhà trẻ')) {
        setName('Chuẩn Dinh dưỡng Mẫu giáo (3 - 6 tuổi)');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên quy chuẩn dinh dưỡng.');
      return;
    }

    if (maxCaloriesKcal < minCaloriesKcal) {
      setErrorMessage('Năng lượng tối đa không thể nhỏ hơn năng lượng tối thiểu.');
      return;
    }

    if (maxProteinPercent < minProteinPercent) {
      setErrorMessage('Tỷ lệ Protein tối đa không thể nhỏ hơn tối thiểu.');
      return;
    }

    if (maxFatPercent < minFatPercent) {
      setErrorMessage('Tỷ lệ Lipid tối đa không thể nhỏ hơn tối thiểu.');
      return;
    }

    if (maxCarbPercent < minCarbPercent) {
      setErrorMessage('Tỷ lệ Glucid tối đa không thể nhỏ hơn tối thiểu.');
      return;
    }

    try {
      const payload: CreateNutritionRulePayload = {
        name: name.trim(),
        targetAgeGroup,
        mealScope,
        minCaloriesKcal,
        maxCaloriesKcal,
        minProteinPercent,
        maxProteinPercent,
        minFatPercent,
        maxFatPercent,
        minCarbPercent,
        maxCarbPercent,
        minCalciumMg,
        minIronMg,
        minZincMg,
        maxSodiumMg,
        caPRatioMin,
        caPRatioMax,
        isStrict,
        isActive,
      };

      await onSubmit(payload, rule?.id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu quy chuẩn dinh dưỡng.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Nền làm mờ Backdrop Blur */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Right Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 flex items-center justify-center shadow-inner">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {isEditMode ? 'Chỉnh Sửa Tiêu Chuẩn Dinh Dưỡng' : 'Thêm Tiêu Chuẩn Dinh Dưỡng Mới'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Cấu hình năng lượng Calo và tỷ lệ P-L-C chuẩn Thông tư 28
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="nutrition-rule-drawer-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-xs"
        >
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Phần 1: Tên & Nhóm tuổi */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tên quy chuẩn dinh dưỡng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Quy chuẩn Mẫu giáo Cơ sở Sao Mai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>

            {/* Nhóm tuổi áp dụng */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nhóm lứa tuổi học sinh <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gợi ý chuẩn TT 28
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAgeGroupPreset('TODDLER_18_36M')}
                  className={`py-2 px-3 rounded-xl border text-left font-semibold transition ${
                    targetAgeGroup === 'TODDLER_18_36M'
                      ? 'border-teal-500 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold">Nhà trẻ (18 - 36 tháng)</p>
                  <p className="text-[10px] text-slate-500 font-normal">600 - 735 Kcal • P: 13-20%</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAgeGroupPreset('KINDERGARTEN_3_4Y')}
                  className={`py-2 px-3 rounded-xl border text-left font-semibold transition ${
                    targetAgeGroup === 'KINDERGARTEN_3_4Y' || targetAgeGroup === 'KINDERGARTEN_4_5Y' || targetAgeGroup === 'KINDERGARTEN_5_6Y'
                      ? 'border-teal-500 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold">Mẫu giáo (3 - 6 tuổi)</p>
                  <p className="text-[10px] text-slate-500 font-normal">615 - 726 Kcal • P: 13-20%</p>
                </button>
              </div>
            </div>
          </div>

          {/* Phần 2: Năng lượng Calo (Kcal) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Nhu Cầu Năng Lượng Tại Trường (50 - 60% Nhu Cầu Ngày)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Calo tối thiểu (Kcal)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={minCaloriesKcal}
                  onChange={(e) => setMinCaloriesKcal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Calo tối đa (Kcal)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={maxCaloriesKcal}
                  onChange={(e) => setMaxCaloriesKcal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Phần 3: Cơ cấu Tỷ lệ P - L - G (%) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Cơ Cấu Tỷ Lệ Năng Lượng (P : L : G)
              </h3>
              <span className="text-[10px] text-slate-400 italic">Tổng tỷ lệ = 100%</span>
            </div>

            {/* Protein */}
            <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-2xl space-y-2">
              <span className="font-bold text-blue-900 block">Chất Đạm (Protein - P)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-blue-700">Tối thiểu (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={minProteinPercent}
                    onChange={(e) => setMinProteinPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-blue-200 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-blue-700">Tối đa (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={maxProteinPercent}
                    onChange={(e) => setMaxProteinPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-blue-200 font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Lipid */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-2xl space-y-2">
              <span className="font-bold text-amber-900 block">Chất Béo (Lipid - L)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-amber-700">Tối thiểu (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={minFatPercent}
                    onChange={(e) => setMinFatPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-amber-200 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-amber-700">Tối đa (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={maxFatPercent}
                    onChange={(e) => setMaxFatPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-amber-200 font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Glucid */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl space-y-2">
              <span className="font-bold text-emerald-900 block">Chất Bột Đường (Glucid - G)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-emerald-700">Tối thiểu (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={minCarbPercent}
                    onChange={(e) => setMinCarbPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-emerald-200 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-emerald-700">Tối đa (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={maxCarbPercent}
                    onChange={(e) => setMaxCarbPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-emerald-200 font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Phần 4: Vi chất dinh dưỡng */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Vi Chất & Tỷ Lệ Cân Đối Canxi / Photpho
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Canxi (mg)</label>
                <input
                  type="number"
                  value={minCalciumMg}
                  onChange={(e) => setMinCalciumMg(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Sắt (mg)</label>
                <input
                  type="number"
                  value={minIronMg}
                  onChange={(e) => setMinIronMg(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Kẽm (mg)</label>
                <input
                  type="number"
                  value={minZincMg}
                  onChange={(e) => setMinZincMg(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Tỷ lệ Ca:P Min</label>
                <input
                  type="number"
                  step="0.1"
                  value={caPRatioMin}
                  onChange={(e) => setCaPRatioMin(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Tỷ lệ Ca:P Max</label>
                <input
                  type="number"
                  step="0.1"
                  value={caPRatioMax}
                  onChange={(e) => setCaPRatioMax(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="nutrition-rule-drawer-form"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/25 transition flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditMode ? 'Lưu Thay Đổi' : 'Tạo Tiêu Chuẩn'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
