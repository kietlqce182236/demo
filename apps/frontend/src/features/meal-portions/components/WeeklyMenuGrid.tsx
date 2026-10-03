import React from 'react';
import { WeeklyDayData } from '../types';
import { AlertCircle, Flame, Utensils, Coffee } from 'lucide-react';

interface WeeklyMenuGridProps {
  days: WeeklyDayData[];
}

export const WeeklyMenuGrid: React.FC<WeeklyMenuGridProps> = ({ days }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-stretch">
      {days.map((day) => (
        <div
          key={day.dayOfWeek}
          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
        >
          {/* Day Column Header */}
          <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-bold">{day.formattedDate}</p>
              <h3 className="text-sm font-extrabold text-slate-800">{day.dayName}</h3>
            </div>
            <span className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 font-black text-xs flex items-center justify-center">
              {day.dayCode}
            </span>
          </div>

          {/* Sessions Container */}
          <div className="p-3 space-y-4 flex-1">
            {/* Session 1: BỮA TRƯA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                  <Utensils className="w-3.5 h-3.5 text-teal-600" />
                  <span>BỮA TRƯA</span>
                  <span className="text-[10px] font-medium text-slate-400">({day.lunch.timeText})</span>
                </div>
                <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  {Number(day.lunch.calories).toFixed(1)} Kcal
                </span>
              </div>

              {/* Lunch Dish Items */}
              <div className="space-y-2 text-xs">
                {day.lunch.dishes.map((dish) => (
                  <div key={dish.id} className="group">
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="font-bold text-slate-800 leading-snug">
                        {dish.name}
                      </p>
                      {dish.badgeText && !dish.hasAllergyWarning && (
                        <span className="shrink-0 text-[10px] font-bold text-teal-800 bg-teal-100/70 px-1.5 py-0.2 rounded">
                          {dish.badgeText}
                        </span>
                      )}
                      {dish.hasAllergyWarning && (
                        <span className="shrink-0 text-[9px] font-black text-white bg-rose-600 px-1.5 py-0.2 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                          <span>{dish.badgeText || 'DỊ ỨNG'}</span>
                        </span>
                      )}
                    </div>

                    {dish.description && (
                      <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed mt-0.5">
                        {dish.description}
                      </p>
                    )}

                    {/* Red Substitute Dish Box for Allergy Alert */}
                    {dish.hasAllergyWarning && dish.allergySubstituteText && (
                      <div className="mt-1.5 p-1.5 bg-rose-50 border border-rose-200/80 rounded-lg text-[10.5px] text-rose-700 flex items-start gap-1 font-medium leading-tight">
                        <span className="text-rose-500 font-bold shrink-0">↳</span>
                        <span>{dish.allergySubstituteText}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Session 2: XẾ CHIỀU */}
            <div className="space-y-2 pt-2 border-t border-dashed border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  <span>XẾ CHIỀU</span>
                  <span className="text-[10px] font-medium text-slate-400">({day.afternoonSnack.timeText})</span>
                </div>
                <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  {Number(day.afternoonSnack.calories).toFixed(1)} Kcal
                </span>
              </div>

              {/* Snack Dish Items */}
              <div className="space-y-2 text-xs">
                {day.afternoonSnack.dishes.map((dish) => (
                  <div key={dish.id}>
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="font-bold text-slate-800 leading-snug">
                        {dish.name}
                      </p>
                      {dish.badgeText && (
                        <span className="shrink-0 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                          {dish.badgeText}
                        </span>
                      )}
                    </div>
                    {dish.description && (
                      <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed mt-0.5">
                        {dish.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day Column Footer: Total Calories & Ratio */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" />
              Tổng: {Number(day.nutrition.totalCalories).toFixed(1)} Kcal
            </span>
            <span className="text-teal-700 font-extrabold text-[10px]">
              P:L:G = {day.nutrition.ratioPLG}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
