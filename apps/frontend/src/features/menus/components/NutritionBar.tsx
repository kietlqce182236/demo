import React from 'react';

interface NutritionBarProps {
  totalCalories: number;
  proteinPercent: number; // Chuẩn: 13-20%
  lipidPercent: number;   // Chuẩn: 25-35%
  glucidPercent: number;  // Chuẩn: 52-60%
}

export const NutritionBar: React.FC<NutritionBarProps> = ({
  totalCalories,
  proteinPercent,
  lipidPercent,
  glucidPercent,
}) => {
  const isProteinValid = proteinPercent >= 13 && proteinPercent <= 20;
  const isLipidValid = lipidPercent >= 25 && lipidPercent <= 35;
  const isGlucidValid = glucidPercent >= 52 && glucidPercent <= 60;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs text-slate-500 font-medium">Năng lượng bữa ăn</span>
          <div className="text-2xl font-black text-slate-800">
            {totalCalories} <span className="text-sm font-normal text-slate-500">kcal/trẻ</span>
          </div>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-200">
          Đạt chuẩn TT 28/2016/TT-BGDĐT
        </span>
      </div>

      {/* Cân đối Đa lượng P - L - G Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Cân đối Đa lượng (P : L : G)</span>
          <span>{proteinPercent}% : {lipidPercent}% : {glucidPercent}%</span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${proteinPercent}%` }}
            className="bg-rose-500 transition-all"
            title={`Đạm (P): ${proteinPercent}%`}
          />
          <div
            style={{ width: `${lipidPercent}%` }}
            className="bg-amber-400 transition-all"
            title={`Chất béo (L): ${lipidPercent}%`}
          />
          <div
            style={{ width: `${glucidPercent}%` }}
            className="bg-sky-500 transition-all"
            title={`Bột đường (G): ${glucidPercent}%`}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] pt-2 text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Đạm (P): <strong>{proteinPercent}%</strong> {isProteinValid ? '✓' : '⚠️'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>Béo (L): <strong>{lipidPercent}%</strong> {isLipidValid ? '✓' : '⚠️'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
            <span>Đường (G): <strong>{glucidPercent}%</strong> {isGlucidValid ? '✓' : '⚠️'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
