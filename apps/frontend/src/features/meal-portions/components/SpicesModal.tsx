import React from 'react';
import { X, Check, Package, Flame, Sparkles } from 'lucide-react';

interface SpicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentCount: number;
}

export const SpicesModal: React.FC<SpicesModalProps> = ({
  isOpen,
  onClose,
  studentCount,
}) => {
  if (!isOpen) return null;

  const fullInventory = [
    { name: 'Nước mắm cá cơm Phú Quốc 40°N', quota: '3ml / trẻ / ngày', total: '0.98 lít', note: 'Nêm canh & món rim' },
    { name: 'Muối tinh sấy I-ốt chuẩn y tế', quota: '1g / trẻ / ngày', total: '0.33 kg', note: 'Kho gia vị khô' },
    { name: 'Hạt nêm thịt thăn xương ống Knorr', quota: '2g / trẻ / ngày', total: '0.66 kg', note: 'Dùng nêm nước dùng' },
    { name: 'Đường phèn tinh khiết Biên Hòa', quota: '4g / trẻ / ngày', total: '1.31 kg', note: 'Nấu chè xế & sốt ngọt' },
    { name: 'Gas công nghiệp PetroVietnam 45kg', quota: '0.04 kg / suất', total: '13.1 kg', note: 'Bình gas kho bếp A' },
    { name: 'Sữa chua Probi & TH True Milk 110ml', quota: '1 hộp / trẻ / cữ', total: '328 hộp', note: 'Kho mát bảo quản 6°C' },
    { name: 'Hành hoa & ngò rí tươi sạch', quota: '5g / trẻ / ngày', total: '1.64 kg', note: 'Giao sáng sớm 06:15' },
    { name: 'Gừng sẻ củ & tỏi ta bóc vỏ', quota: '2g / trẻ / ngày', total: '0.66 kg', note: 'Khử tanh gia vị cá & lươn' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                Toàn bộ Bảng Định lượng Kho Bếp Bán trú
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Gia vị mắm muối, gas hóa lỏng, phụ liệu tươi & sữa hộp (Tính theo {studentCount} suất)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Table */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Tên vật tư / Phụ liệu</th>
                  <th className="py-2.5 px-3">Định mức quy chuẩn</th>
                  <th className="py-2.5 px-3 text-right">Tổng dự trù</th>
                  <th className="py-2.5 px-3">Ghi chú kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {fullInventory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-teal-50/40 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{item.quota}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-teal-800">
                      {item.total}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-xl text-xs text-teal-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Định mức hao phí gia vị và nhiên liệu nấu được thẩm định tự động theo tiêu chuẩn Bộ GD&ĐT Thông tư 28/2016/TT-BGDĐT.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
          >
            Đóng bảng định lượng
          </button>
        </div>
      </div>
    </div>
  );
};
