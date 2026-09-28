import React, { useState } from 'react';
import {
  Scale,
  Download,
  CheckCircle2,
  Wheat,
  Beef,
  Fish,
  Leaf,
  Droplets,
  Apple,
  ShieldCheck,
  Thermometer,
  Refrigerator,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  PortionPlanDetails,
  FoodSafetyStep,
  MacroRatio,
} from '../types';
import { SpicesModal } from './SpicesModal';

interface PortionPlanSectionProps {
  portionPlan: PortionPlanDetails;
  foodSafetySteps: FoodSafetyStep[];
  macroRatio: MacroRatio;
  isWarehouseExported: boolean;
  exportedAt?: string;
  onApproveExport: () => Promise<void>;
  onExportExcel: () => void;
  isApproving: boolean;
}

export const PortionPlanSection: React.FC<PortionPlanSectionProps> = ({
  portionPlan,
  foodSafetySteps,
  macroRatio,
  isWarehouseExported,
  exportedAt,
  onApproveExport,
  onExportExcel,
  isApproving,
}) => {
  const [isSpicesModalOpen, setIsSpicesModalOpen] = useState(false);

  // Icon mapping helper
  const getIngredientIcon = (category: string) => {
    switch (category) {
      case 'GRAIN':
        return <Wheat className="w-5 h-5 text-amber-600" />;
      case 'MEAT':
        return <Beef className="w-5 h-5 text-rose-600" />;
      case 'SEAFOOD':
        return <Fish className="w-5 h-5 text-orange-600" />;
      case 'SPECIAL_DIET':
        return <Beef className="w-5 h-5 text-red-600" />;
      case 'VEGETABLE':
        return <Leaf className="w-5 h-5 text-emerald-600" />;
      case 'OIL':
        return <Droplets className="w-5 h-5 text-amber-500" />;
      case 'FRUIT':
        return <Apple className="w-5 h-5 text-lime-600" />;
      default:
        return <Wheat className="w-5 h-5 text-teal-600" />;
    }
  };

  const getIconBg = (category: string) => {
    switch (category) {
      case 'GRAIN':
        return 'bg-amber-100/70';
      case 'MEAT':
        return 'bg-rose-100/70';
      case 'SEAFOOD':
        return 'bg-orange-100/70';
      case 'SPECIAL_DIET':
        return 'bg-red-100';
      case 'VEGETABLE':
        return 'bg-emerald-100/70';
      case 'OIL':
        return 'bg-amber-100/70';
      case 'FRUIT':
        return 'bg-lime-100/70';
      default:
        return 'bg-teal-100/70';
    }
  };

  return (
    <section className="space-y-4 pt-4 border-t border-slate-200">
      {/* Top Header of UC56 Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-slate-800 tracking-tight">
                Kế hoạch Định lượng Suất ăn Nhà bếp & Dự trù Kho (UC56)
              </h2>
              <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200">
                Tự động tính: {portionPlan.studentCount} suất bán trú thực tế
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Bảng định mức tiêu chuẩn được tính toán theo thuật toán trọng lượng thô, trừ tỷ lệ hao hụt sơ chế và tách riêng {portionPlan.allergicSubstituteCount} suất đặc biệt.
            </p>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Export Excel Button */}
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300/80 text-slate-700 text-xs font-bold shadow-2xs transition active:scale-98"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất Excel phiếu xuất kho</span>
          </button>

          {/* Approve Warehouse Export Button */}
          <button
            onClick={onApproveExport}
            disabled={isApproving || isWarehouseExported}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-98 ${
              isWarehouseExported
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-900/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>
              {isApproving
                ? 'Đang xử lý...'
                : isWarehouseExported
                ? 'Đã duyệt lệnh xuất kho tuần'
                : 'Duyệt lệnh xuất kho nguyên liệu tuần'}
            </span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Dự trù Nhóm Thực phẩm Chính Bữa Trưa */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
          {/* Subheader */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-800">
                Dự trù Nhóm Thực phẩm Chính Bữa Trưa ({portionPlan.studentCount} Trẻ)
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {portionPlan.statusBadge}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Đơn vị: {portionPlan.unit}
            </span>
          </div>

          {/* List of 7 Food Cards */}
          <div className="space-y-2.5">
            {portionPlan.ingredients.map((ing) => (
              <div
                key={ing.id}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white flex items-center justify-between transition gap-3"
              >
                {/* Left info & icon */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(
                      ing.category,
                    )}`}
                  >
                    {getIngredientIcon(ing.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-xs text-slate-800">
                        {ing.ingredientName}
                      </p>
                      {ing.targetBadge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            ing.category === 'SPECIAL_DIET'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {ing.targetBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {ing.quotaDescription}
                    </p>
                  </div>
                </div>

                {/* Right Quantity & Warehouse note */}
                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-base font-black text-slate-800">
                      {ing.calculatedQuantity.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{ing.unit}</span>
                  </div>
                  <p
                    className={`text-[10.5px] font-medium ${
                      ing.category === 'SPECIAL_DIET'
                        ? 'text-rose-600 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {ing.warehouseStockText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (4 cols): 3 Cards */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Kiểm Thực 3 Bước & Lưu Mẫu */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-xs text-slate-800">
                Kiểm Thực 3 Bước & Lưu Mẫu
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Quy trình tiếp phẩm buổi sáng và lưu mẫu 24h tại tủ inox chuyên dụng được BGH và Nhân viên Y tế giám sát.
            </p>

            <div className="space-y-2 pt-1">
              {foodSafetySteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
                >
                  <span className="font-semibold text-slate-700">
                    Bước {step.stepNumber}: {step.name.split(':')[0]}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      step.badgeColor === 'cyan'
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {step.badgeText}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Tỷ lệ Năng Lượng (P - L - G) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-800">
                Tỷ lệ Năng Lượng (P – L – G)
              </h3>
              <span className="bg-teal-50 text-teal-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-teal-100">
                {macroRatio.ratioText}
              </span>
            </div>

            {/* Donut Chart & Legend */}
            <div className="flex items-center gap-5 py-1">
              {/* Circular Graphic */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Glucid Segment (60%) */}
                  <path
                    className="text-teal-700"
                    strokeDasharray="60, 100"
                    strokeDashoffset="0"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Lipid Segment (26%) */}
                  <path
                    className="text-cyan-500"
                    strokeDasharray="26, 100"
                    strokeDashoffset="-60"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Protein Segment (14%) */}
                  <path
                    className="text-teal-400"
                    strokeDasharray="14, 100"
                    strokeDashoffset="-86"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-slate-800">100%</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0"></span>
                  <span className="font-semibold text-slate-700">
                    Chất đạm (P): <strong>{macroRatio.protein.percent}%</strong>
                  </span>
                  <span className="text-slate-400 text-[10px]">({macroRatio.protein.gramText})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>
                  <span className="font-semibold text-slate-700">
                    Chất béo (L): <strong>{macroRatio.lipid.percent}%</strong>
                  </span>
                  <span className="text-slate-400 text-[10px]">({macroRatio.lipid.gramText})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-700 shrink-0"></span>
                  <span className="font-semibold text-slate-700">
                    Đường bột (G): <strong>{macroRatio.glucid.percent}%</strong>
                  </span>
                  <span className="text-slate-400 text-[10px]">({macroRatio.glucid.gramText})</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic border-t border-slate-100 pt-2 font-medium">
              {macroRatio.standardNote}
            </p>
          </div>

          {/* Card 3: Link to Full Kitchen Inventory Modal */}
          <div
            onClick={() => setIsSpicesModalOpen(true)}
            className="p-3.5 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200/90 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white text-slate-700 border border-slate-200 flex items-center justify-center group-hover:text-teal-600 transition">
                <Wheat className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-800 group-hover:text-teal-700 transition">
                  Xem toàn bộ bảng định lượng kho bếp
                </p>
                <p className="text-[10.5px] text-slate-400 font-medium">
                  Bao gồm gia vị mắm muối, gas, sữa hộp
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      {/* Modal */}
      <SpicesModal
        isOpen={isSpicesModalOpen}
        onClose={() => setIsSpicesModalOpen(false)}
        studentCount={portionPlan.studentCount}
      />
    </section>
  );
};
