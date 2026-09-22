import React from 'react';

export type ConsumptionStatus = 'ATE_ALL' | 'ATE_HALF' | 'ATE_FEW' | 'REFUSED';

interface MealStatusButtonProps {
  currentStatus: ConsumptionStatus;
  onChange: (status: ConsumptionStatus) => void;
}

export const MealStatusButton: React.FC<MealStatusButtonProps> = ({ currentStatus, onChange }) => {
  const options: Array<{ status: ConsumptionStatus; label: string; activeClass: string }> = [
    { status: 'ATE_ALL', label: 'Ăn hết', activeClass: 'bg-emerald-600 text-white shadow-lg' },
    { status: 'ATE_HALF', label: 'Ăn 1/2', activeClass: 'bg-amber-500 text-white shadow-lg' },
    { status: 'ATE_FEW', label: 'Ăn ít', activeClass: 'bg-orange-500 text-white shadow-lg' },
    { status: 'REFUSED', label: 'Bỏ ăn', activeClass: 'bg-rose-600 text-white shadow-lg' },
  ];

  return (
    <div className="inline-flex rounded-xl bg-slate-200 p-1 gap-1">
      {options.map((opt) => {
        const isSelected = currentStatus === opt.status;
        return (
          <button
            key={opt.status}
            type="button"
            onClick={() => onChange(opt.status)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              isSelected ? opt.activeClass : 'text-slate-700 hover:bg-slate-300'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
