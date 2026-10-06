import React from 'react';
import {
  UtensilsCrossed,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface OneWayKitchenMenuTabProps {
  todayMenu: Array<{
    id: string;
    name: string;
    type: string;
    portionSize: string;
    calories: string;
  }>;
  totalLunchPortions: number;
  totalSnackPortions: number;
  rawIngredients?: Array<any>;
  isDarkMode?: boolean;
}

export const OneWayKitchenMenuTab: React.FC<OneWayKitchenMenuTabProps> = ({
  todayMenu,
  totalLunchPortions,
  totalSnackPortions,
  rawIngredients: dbIngredients,
  isDarkMode = false,
}) => {
  // Effective portion count
  const portionCount = totalLunchPortions;
  const snackCount = totalSnackPortions;

  // Dynamic raw ingredient calculations based on database items
  const rawIngredients = (dbIngredients && dbIngredients.length > 0)
    ? dbIngredients.map((item, idx) => ({
        id: item.id || `db-ing-${idx}`,
        name: item.name,
        category: item.category || 'Nguyên liệu',
        unitPerChild: item.unitPerChild || (item.grossWeightG ? `${item.grossWeightG}g` : '100g'),
        totalRequired: item.grossWeightG
          ? `${((portionCount * item.grossWeightG) / 1000).toFixed(1)} kg`
          : `${((portionCount * 100) / 1000).toFixed(1)} kg`,
        supplier: item.supplierName || 'Kho Thực Phẩm Bán Trú',
        status: 'XUẤT ĐỦ',
        storageLoc: item.dishName ? `Món: ${item.dishName}` : 'Kho Bếp Trung Tâm',
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* 1. SƠ ĐỒ QUY TRÌNH BẾP MỘT CHIỀU ĐẠT CHUẨN BYT */}
      <div
        className={`rounded-3xl p-6 transition-all ${
          isDarkMode
            ? 'bg-slate-900 border border-slate-800 shadow-2xl'
            : 'bg-white border border-slate-200/90 shadow-sm'
        }`}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl border ${
                  isDarkMode
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}
              >
                <Layers className="w-6 h-6" />
              </div>
              <h3
                className={`text-lg font-black uppercase tracking-wider ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                SƠ ĐỒ VẬN HÀNH BẾP MỘT CHIỀU (ONE-WAY KITCHEN FLOW)
              </h3>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Tuyệt đối không chồng chéo giữa luồng thực phẩm sống và thực phẩm chín • Tuân thủ Thông tư 28/2016/TT-BGDĐT
            </p>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black border ${
              isDarkMode
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ĐẠT CHUẨN ISO 22000 & HACCP</span>
          </div>
        </div>

        {/* 4 Steps Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Zone 1 */}
          <div
            className={`rounded-2xl p-4 flex flex-col justify-between relative group transition ${
              isDarkMode
                ? 'bg-slate-950/70 border border-slate-800 hover:border-amber-400/50'
                : 'bg-slate-50/80 border border-slate-200/80 hover:border-amber-400 hover:bg-white shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  KHU VỰC 1
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200/80 text-slate-600'}`}>
                  06:30 - 07:30
                </span>
              </div>
              <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Tiếp Nhận & Kiểm Định</h4>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Giao nhận thực phẩm, cân khối lượng, đối chiếu hóa đơn, kiểm tra cảm quan Bước 1.
              </p>
            </div>
            <div
              className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold ${
                isDarkMode ? 'border-slate-800/80 text-amber-300' : 'border-slate-200/80 text-amber-700'
              }`}
            >
              <span>Cân điện tử 150kg</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Zone 2 */}
          <div
            className={`rounded-2xl p-4 flex flex-col justify-between relative group transition ${
              isDarkMode
                ? 'bg-slate-950/70 border border-slate-800 hover:border-amber-400/50'
                : 'bg-slate-50/80 border border-slate-200/80 hover:border-amber-400 hover:bg-white shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  KHU VỰC 2
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200/80 text-slate-600'}`}>
                  07:30 - 08:30
                </span>
              </div>
              <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sơ Chế Thô & Làm Sạch</h4>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Bồn rửa rau củ & sơ chế thịt cá tách riêng. Ngâm rửa rau củ bằng nước muối loãng.
              </p>
            </div>
            <div
              className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold ${
                isDarkMode ? 'border-slate-800/80 text-amber-300' : 'border-slate-200/80 text-amber-700'
              }`}
            >
              <span>Bồn rửa inox 3 hộc</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Zone 3 */}
          <div
            className={`rounded-2xl p-4 flex flex-col justify-between relative group transition ${
              isDarkMode
                ? 'bg-slate-950/70 border border-slate-800 hover:border-amber-400/50'
                : 'bg-slate-50/80 border border-slate-200/80 hover:border-amber-400 hover:bg-white shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  KHU VỰC 3
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200/80 text-slate-600'}`}>
                  08:30 - 10:15
                </span>
              </div>
              <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Chế Biến Nhiệt (Nấu Chín)</h4>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Tủ nấu cơm hơi nước, bếp hầm, chảo xào công nghiệp. Nhiệt độ tâm thức ăn ≥ 70°C.
              </p>
            </div>
            <div
              className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold ${
                isDarkMode ? 'border-slate-800/80 text-amber-300' : 'border-slate-200/80 text-amber-700'
              }`}
            >
              <span>Tủ hấp 24 khay</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Zone 4 */}
          <div
            className={`rounded-2xl p-4 flex flex-col justify-between relative group transition ${
              isDarkMode
                ? 'bg-slate-950/70 border border-slate-800 hover:border-amber-400/50'
                : 'bg-slate-50/80 border border-slate-200/80 hover:border-amber-400 hover:bg-white shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  KHU VỰC 4
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200/80 text-slate-600'}`}>
                  10:30 - 11:30
                </span>
              </div>
              <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Chia Suất & Chuyển Lớp</h4>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Phân chia theo định lượng sĩ số đã chốt, dán tem khay dị ứng, chuyển thang máy lên các tầng.
              </p>
            </div>
            <div
              className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold ${
                isDarkMode ? 'border-slate-800/80 text-emerald-400' : 'border-slate-200/80 text-emerald-700'
              }`}
            >
              <span>Thang máy thức ăn #01</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MENU DETAILS & NUTRITIONAL PROFILE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dishes Breakdown (Span 5) */}
        <div
          className={`lg:col-span-5 rounded-3xl p-6 flex flex-col justify-between transition-all ${
            isDarkMode
              ? 'bg-slate-900 border border-slate-800 shadow-2xl'
              : 'bg-white border border-slate-200/90 shadow-sm'
          }`}
        >
          <div>
            <div
              className={`flex items-center justify-between pb-3 mb-4 border-b ${
                isDarkMode ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <h3
                className={`text-base font-black uppercase tracking-wider flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                <UtensilsCrossed className="w-5 h-5 text-amber-500" />
                <span>THỰC ĐƠN BỮA TRƯA & PHỤ XẾ</span>
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  isDarkMode
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {todayMenu.length} Món
              </span>
            </div>

            <div className="space-y-3">
              {todayMenu.length === 0 ? (
                <div
                  className={`p-6 text-center text-xs rounded-2xl border ${
                    isDarkMode
                      ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  Chưa có món ăn nào trong thực đơn hôm nay.
                </div>
              ) : (
                todayMenu.map((dish) => (
                <div
                  key={dish.id}
                  className={`rounded-2xl p-3.5 transition ${
                    isDarkMode
                      ? 'bg-slate-950/70 border border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isDarkMode ? 'text-amber-400' : 'text-amber-700'
                      }`}
                    >
                      {dish.type === 'MAIN_COURSE'
                        ? 'MÓN MẶN CHÍNH'
                        : dish.type === 'SOUP'
                        ? 'MÓN CANH DINH DƯỠNG'
                        : dish.type === 'RICE_STAPLE'
                        ? 'TINH BỘT NĂNG LƯỢNG'
                        : 'MÓN PHỤ / TRÁNG MIỆNG'}
                    </span>
                    <span
                      className={`text-xs font-black ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                      }`}
                    >
                      {dish.calories}
                    </span>
                  </div>
                  <h4 className={`text-sm font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {dish.name}
                  </h4>
                  <div
                    className={`flex items-center justify-between text-xs mt-2 pt-2 border-t ${
                      isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200/80 text-slate-500'
                    }`}
                  >
                    <span>Định lượng tiêu chuẩn / trẻ:</span>
                    <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>
                      {dish.portionSize}
                    </strong>
                  </div>
                </div>
              )))}
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl text-xs mt-4 flex items-center gap-2 border ${
              isDarkMode
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Năng lượng đáp ứng 55% nhu cầu khuyến nghị cho trẻ mầm non (Bộ GD&ĐT).</span>
          </div>
        </div>

        {/* Right: Automated Raw Material Requisition Table (Span 7) */}
        <div
          className={`lg:col-span-7 rounded-3xl p-6 flex flex-col justify-between transition-all ${
            isDarkMode
              ? 'bg-slate-900 border border-slate-800 shadow-2xl'
              : 'bg-white border border-slate-200/90 shadow-sm'
          }`}
        >
          <div>
            <div
              className={`flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b ${
                isDarkMode ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <div>
                <h3
                  className={`text-base font-black uppercase tracking-wider flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <Package className="w-5 h-5 text-emerald-500" />
                  <span>ĐỊNH LƯỢNG NGUYÊN LIỆU XUẤT KHO REALTIME</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tự động nhân theo tổng số suất đã chốt điểm danh ({portionCount} suất trưa • {snackCount} phần xế)
                </p>
              </div>

              <span
                className={`text-xs font-black px-3 py-1 rounded-full border ${
                  isDarkMode
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                ✓ Kho Đã Xuất Đủ 100%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`text-[10px] font-bold uppercase tracking-wider border-b ${
                    isDarkMode
                      ? 'bg-slate-950/80 text-slate-400 border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <tr>
                    <th className="py-2.5 px-3">Tên Thực Phẩm</th>
                    <th className="py-2.5 px-3">Định Suất / Trẻ</th>
                    <th className="py-2.5 px-3">Tổng Khối Lượng</th>
                    <th className="py-2.5 px-3">Nguồn Gốc / Kho</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {rawIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        Chưa có dữ liệu nguyên liệu sơ chế cho thực đơn hôm nay.
                      </td>
                    </tr>
                  ) : (
                    rawIngredients.map((item) => (
                      <tr
                        key={item.id}
                        className={`transition ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'}`}
                      >
                        <td className="py-2.5 px-3">
                          <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {item.name}
                          </div>
                          <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.category}
                          </div>
                        </td>
                        <td
                          className={`py-2.5 px-3 font-mono font-semibold ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          {item.unitPerChild}
                        </td>
                        <td
                          className={`py-2.5 px-3 font-mono font-black text-sm ${
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                          }`}
                        >
                          {item.totalRequired}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-[11px] truncate max-w-[130px] ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          <div>{item.supplier}</div>
                          <div className={isDarkMode ? 'text-teal-400 text-[10px]' : 'text-teal-700 text-[10px] font-semibold'}>
                            {item.storageLoc}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              isDarkMode
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className={`pt-3 border-t text-xs italic text-center mt-3 ${
              isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
            }`}
          >
            * Định lượng nguyên liệu được tính toán theo bảng thành phần thực phẩm Viện Dinh Dưỡng Quốc Gia.
          </div>
        </div>
      </div>
    </div>
  );
};
