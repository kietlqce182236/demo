import React from 'react';
import { NutritionBar } from '../components/NutritionBar';
import { WhoGrowthChart } from '../../growth/components/WhoGrowthChart';
import { ShieldAlert } from 'lucide-react';
import { VnpayCheckoutButton } from '../../payments/components/VnpayCheckoutButton';

export const MenuPlanningPage: React.FC = () => {
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
