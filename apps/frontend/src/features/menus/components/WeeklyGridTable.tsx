import React from 'react';
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
} from 'lucide-react';
import { WeeklyMenu, MenuDishItem } from '../api/weekly-menus.api';

interface WeeklyGridTableProps {
  menu: WeeklyMenu | null;
  onOpenDishDrawer: (slot: { dayOfWeek: number; mealTime: string; existingDish?: MenuDishItem | null }) => void;
  onRemoveDish: (menuDishId: string) => Promise<void>;
  readOnly?: boolean;
}

export const WeeklyGridTable: React.FC<WeeklyGridTableProps> = ({
  menu,
  onOpenDishDrawer,
  onRemoveDish,
  readOnly = false,
}) => {
  const days = [
    { dayOfWeek: 1, label: 'Thứ Hai', sub: 'Ngày 1' },
    { dayOfWeek: 2, label: 'Thứ Ba', sub: 'Ngày 2' },
    { dayOfWeek: 3, label: 'Thứ Tư', sub: 'Ngày 3' },
    { dayOfWeek: 4, label: 'Thứ Năm', sub: 'Ngày 4' },
    { dayOfWeek: 5, label: 'Thứ Sáu', sub: 'Ngày 5' },
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

  // Tính tổng calo cho từng ngày trong tuần
  const getDailyCalo = (day: number): number => {
    if (!menu?.menuDishes) return 0;
    return menu.menuDishes
      .filter((md) => md.dayOfWeek === day && !md.deletedAt)
      .reduce((sum, md) => sum + (Number(md.plannedCalories) || 0), 0);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header trạng thái thực đơn */}
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

        {/* Thông số dinh dưỡng tổng quan */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Năng lượng TB/ngày</span>
            <span className="text-base font-black text-emerald-950">{menu?.dailyAverageCalories || 0} Kcal</span>
          </div>
        </div>
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
            <p className="font-bold">Thực đơn đã được gửi lên Ban Giám Hiệu (Đang chờ duyệt)</p>
            <p className="text-amber-700 mt-0.5 leading-relaxed">
              Thực đơn hiện đang trong quá trình xét duyệt của Hiệu trưởng. Các ô món ăn tạm thời được khóa để đảm bảo tính toàn vẹn dữ liệu.
            </p>
          </div>
        </div>
      )}

      {/* Banner thông báo ĐÃ DUYỆT (CHỜ CÔNG BỐ) */}
      {menu?.status === 'APPROVED' && (
        <div className="mx-5 my-3 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900">
            <p className="font-bold">Thực đơn đã được Hiệu trưởng phê duyệt thành công!</p>
            <p className="text-blue-700 mt-0.5 leading-relaxed">
              {menu.approvalNotes || 'Đạt chuẩn dinh dưỡng Thông tư 28/2016/TT-BGDĐT.'} Đang chờ Hiệu trưởng bấm "Khóa & Công bố" để kích hoạt toàn trường.
            </p>
          </div>
        </div>
      )}

      {/* Banner thông báo ĐÃ KHÓA & CÔNG BỐ */}
      {menu?.status === 'ACTIVE' && (
        <div className="mx-5 my-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900">
            <p className="font-bold">Thực đơn ĐANG ÁP DỤNG (ĐÃ KHÓA & CÔNG BỐ)</p>
            <p className="text-emerald-700 mt-0.5 leading-relaxed">
              Thực đơn đang được áp dụng trực tiếp cho Tablet Giáo viên và Màn hình Bếp KDS. Để chỉnh sửa, vui lòng bấm "Tạo bản v..." để nhân bản tạo phiên bản mới.
            </p>
          </div>
        </div>
      )}

      {/* Lưới Ma trận Thực đơn tuần */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="py-3 px-2 w-32 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Bữa ăn
              </th>
              {days.map((day) => (
                <th key={day.dayOfWeek} className="py-3 px-2 text-center border-l border-slate-100 min-w-[145px] sm:min-w-[160px]">
                  <span className="block text-xs font-black text-slate-900">{day.label}</span>
                  <span className="block text-[10px] text-slate-400 font-medium">{day.sub}</span>
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

                {/* 5 Cột tương ứng 5 ngày Thứ 2 -> Thứ 6 */}
                {days.map((day) => {
                  const dishesInCell = getDishesInSlot(day.dayOfWeek, slot.key);
                  return (
                    <td
                      key={day.dayOfWeek}
                      className="p-2.5 align-top border-l border-slate-100 group relative hover:bg-emerald-50/20 transition"
                    >
                      <div className="space-y-1.5 min-h-[64px]">
                        {dishesInCell.map((md) => (
                          <div
                            key={md.id}
                            className="bg-white border border-slate-200/80 rounded-xl p-2 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition group/item"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-bold text-slate-800 leading-tight">
                                {md.dish?.name || 'Món ăn'}
                              </span>

                              {!readOnly && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition shrink-0">
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
                                </div>
                              )}
                            </div>

                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                                {md.portionSizeG}g
                              </span>
                              <span className="font-bold text-amber-700 flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 text-amber-500" />
                                {md.plannedCalories} Kcal
                              </span>
                            </div>

                            {/* Món thay thế cho trẻ dị ứng */}
                            {md.substituteDish && (
                              <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50/60 p-1 rounded-lg">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                <span className="truncate">Thay thế: {md.substituteDish.name}</span>
                              </div>
                            )}
                          </div>
                        ))}

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

          {/* Hàng tổng kết Calo từng ngày ở chân bảng */}
          <tfoot>
            <tr className="bg-slate-100/70 border-t-2 border-slate-200 font-bold text-xs">
              <td className="p-3 text-slate-700 font-bold">Tổng Calo / Ngày</td>
              {days.map((day) => {
                const totalDayCalo = getDailyCalo(day.dayOfWeek);
                const isOptimal = totalDayCalo >= 650 && totalDayCalo <= 880;
                return (
                  <td key={day.dayOfWeek} className="p-3 text-center border-l border-slate-200">
                    <span className="text-sm font-black text-slate-900 block">{totalDayCalo} Kcal</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full inline-block mt-0.5 ${
                        isOptimal
                          ? 'bg-emerald-100 text-emerald-800'
                          : totalDayCalo === 0
                          ? 'bg-slate-200 text-slate-500'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isOptimal ? 'Đạt chuẩn' : totalDayCalo === 0 ? 'Chưa lên món' : 'Chưa cân bằng'}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
