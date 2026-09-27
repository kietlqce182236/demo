import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AdminDashboardLayout } from './layouts/AdminDashboardLayout';
import { TeacherTabletLayout } from './layouts/TeacherTabletLayout';
import { KitchenDisplayLayout } from './layouts/KitchenDisplayLayout';
import { NutritionBar } from './features/menus/components/NutritionBar';
import { MealStatusButton, ConsumptionStatus } from './features/attendance/components/MealStatusButton';
import { WhoGrowthChart } from './features/growth/components/WhoGrowthChart';
import { VnpayCheckoutButton } from './features/payments/components/VnpayCheckoutButton';
import { ChefHat, Tablet, LayoutDashboard, ShieldAlert, Sparkles } from 'lucide-react';

// Demo Page: Tổng quan Dinh dưỡng & Thực đơn
const MenuPlanningDemo = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Rule Engine Dinh Dưỡng Đang Kích Hoạt
          </span>
          <h2 className="text-2xl font-black mt-2">Thực đơn Tuần 3 – Khối Mẫu Giáo (3-6 tuổi)</h2>
          <p className="text-emerald-100 text-sm mt-1">Được phê duyệt bởi Chuyên viên Dinh dưỡng Hoàng Mai</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-emerald-200 block">Độ bao phủ calo bán trú</span>
          <span className="text-3xl font-black">52.8%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <NutritionBar
            totalCalories={685}
            proteinPercent={16.5}
            lipidPercent={28.2}
            glucidPercent={55.3}
          />
          <WhoGrowthChart />
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Cảnh báo Xung đột Dị ứng (Rule Engine)
            </h3>
            <div className="space-y-2.5">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <strong>Bé Trần Gia Bảo:</strong> Dị ứng Lạc (Đậu phộng) → Món "Gà xào sả ớt rắc đậu" đã được tự động thay thế bằng "Gà rim nước mắm".
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <strong>Bé Lê Hoàng Nam:</strong> Hạn chế sữa bò → Tráng miệng đổi sang sữa hạt hữu cơ.
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Thanh toán Tiền ăn & Dịch vụ Ăn xế</h3>
            <p className="text-xs text-slate-500 mb-4">Học phí bán trú Tháng 10/2025</p>
            <VnpayCheckoutButton
              invoiceId="INV-2025-10-001"
              amount={1850000}
              orderInfo="Thanh toan tien an ban tru Thang 10 Be Tran Gia Bao"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo Page: Tablet Giáo Viên Điểm Danh
const TeacherTabletDemo = () => {
  const [children, setChildren] = useState([
    { id: '1', name: 'Trần Gia Bảo', allergy: 'Đậu phộng (Nặng)', status: 'ATE_ALL' as ConsumptionStatus },
    { id: '2', name: 'Nguyễn Ngọc Hân', allergy: null, status: 'ATE_ALL' as ConsumptionStatus },
    { id: '3', name: 'Lê Hoàng Nam', allergy: 'Sữa bò', status: 'ATE_HALF' as ConsumptionStatus },
    { id: '4', name: 'Phạm Minh Khang', allergy: null, status: 'REFUSED' as ConsumptionStatus },
    { id: '5', name: 'Đỗ Thùy Linh', allergy: null, status: 'ATE_ALL' as ConsumptionStatus },
  ]);

  const updateStatus = (id: string, status: ConsumptionStatus) => {
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="font-bold text-lg text-slate-800">Ghi nhận Bữa trưa – Lớp Chồi 1</h2>
          <p className="text-xs text-slate-500">Chạm để cập nhật tình trạng ăn của từng trẻ</p>
        </div>
        <button className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition">
          Lưu & Đồng bộ về Bếp
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {children.map((child, idx) => (
          <div key={child.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </span>
              <div>
                <p className="font-bold text-sm text-slate-800">{child.name}</p>
                {child.allergy ? (
                  <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                    ⚠️ {child.allergy}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Không có dị ứng</span>
                )}
              </div>
            </div>

            <MealStatusButton
              currentStatus={child.status}
              onChange={(newStatus) => updateStatus(child.id, newStatus)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

import { SnackServicesPage } from './features/snack-services/pages/SnackServicesPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* Quick Navigation Floating Bar để kiểm tra 3 chế độ màn hình */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700 text-xs font-semibold">
        <span className="text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Chế độ xem:
        </span>
        <Link to="/snack-services" className="flex items-center gap-1.5 hover:text-brand-400 transition">
          <LayoutDashboard className="w-4 h-4" /> Web Admin BGH
        </Link>
        <span className="text-slate-600">|</span>
        <Link to="/tablet" className="flex items-center gap-1.5 hover:text-emerald-400 transition">
          <Tablet className="w-4 h-4" /> Tablet Giáo Viên
        </Link>
        <span className="text-slate-600">|</span>
        <Link to="/kds" className="flex items-center gap-1.5 hover:text-amber-400 transition">
          <ChefHat className="w-4 h-4" /> KDS Màn hình Bếp
        </Link>
      </div>

      <Routes>
        {/* Layout 1: Web Admin / Chuyên viên Dinh dưỡng */}
        <Route path="/" element={<AdminDashboardLayout />}>
          <Route index element={<SnackServicesPage />} />
          <Route path="snack-services" element={<SnackServicesPage />} />
          <Route path="menus" element={<MenuPlanningDemo />} />
          <Route path="children" element={<MenuPlanningDemo />} />
          <Route path="growth" element={<MenuPlanningDemo />} />
          <Route path="payments" element={<MenuPlanningDemo />} />
        </Route>

        {/* Layout 2: Tablet Giáo viên trên lớp */}
        <Route path="/tablet" element={<TeacherTabletLayout />}>
          <Route index element={<TeacherTabletDemo />} />
          <Route path="record" element={<TeacherTabletDemo />} />
        </Route>

        {/* Layout 3: KDS Màn hình Bếp Bán trú */}
        <Route path="/kds" element={<KitchenDisplayLayout />} />
      </Routes>
    </BrowserRouter>
  );
};
