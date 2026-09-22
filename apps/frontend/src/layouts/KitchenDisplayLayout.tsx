import React, { useState, useEffect } from 'react';
import { ChefHat, AlertOctagon, CheckCircle2, Clock } from 'lucide-react';

export const KitchenDisplayLayout: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('vi-VN'));

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('vi-VN')), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col font-mono selection:bg-none">
      {/* KDS Header - Màn hình Bếp Bán Trú */}
      <header className="h-20 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl font-bold">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-amber-400">
              KITCHEN DISPLAY SYSTEM (KDS)
            </h1>
            <p className="text-xs text-slate-400">Trường Mầm non Hoa Mai Đỏ – Khu vực Bếp Bán trú</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">BỮA ĂN HIỆN TẠI</span>
            <span className="text-xl font-black text-emerald-400">BỮA TRƯA CHÍNH (10:30)</span>
          </div>
          <div className="text-3xl font-black text-white bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
            {time}
          </div>
        </div>
      </header>

      {/* Realtime Suất Ăn Grid */}
      <div className="flex-1 p-6 grid grid-cols-3 gap-6 overflow-hidden">
        {/* Card 1: Tổng hợp suất ăn hôm nay */}
        <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <span className="text-xs font-bold text-slate-400 tracking-wider">TỔNG SUẤT ĂN CHỐT</span>
            <div className="text-6xl font-black text-white mt-2">248 <span className="text-2xl text-slate-500 font-normal">suất</span></div>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Khối Nhà trẻ (18-36 tháng):</span>
                <span className="font-bold text-amber-400">62 suất (Xay/Cháo)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Khối Mẫu giáo (3-6 tuổi):</span>
                <span className="font-bold text-emerald-400">186 suất (Cơm mềm)</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl flex items-center gap-3 text-xs text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            100% các lớp đã hoàn tất điểm danh lúc 08:30 sáng
          </div>
        </div>

        {/* Card 2: Cảnh báo Dị ứng đỏ khẩn cấp */}
        <div className="bg-red-950/40 border-2 border-red-600/60 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center gap-2 text-red-400">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
              <span className="text-sm font-black tracking-widest uppercase">CẢNH BÁO DỊ ỨNG ĐẶC BIỆT</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="bg-red-900/60 border border-red-500/50 p-3.5 rounded-xl">
                <div className="flex justify-between font-bold text-red-200">
                  <span>Trần Gia Bảo (Lớp Chồi 1)</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-black">SỐC PHẢN VỆ</span>
                </div>
                <p className="text-xs text-red-300 mt-1">Dị ứng: <strong>ĐẬU PHỘNG & HẢI SẢN</strong></p>
                <p className="text-xs text-yellow-300 mt-1 font-semibold">→ Suất thay thế: Thịt heo nạc rim mè</p>
              </div>

              <div className="bg-red-900/40 border border-red-500/30 p-3.5 rounded-xl">
                <div className="flex justify-between font-bold text-red-200">
                  <span>Lê Hoàng Nam (Lớp Mầm 2)</span>
                  <span className="bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded font-bold">DỊ ỨNG NẶNG</span>
                </div>
                <p className="text-xs text-red-300 mt-1">Dị ứng: <strong>SỮA BÒ & CHẾ PHẨM TỪ SỮA</strong></p>
                <p className="text-xs text-yellow-300 mt-1 font-semibold">→ Tráng miệng thay thế: Nước ép dưa hấu</p>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-red-400/80 italic text-center">
            * Bếp trưởng bắt buộc kiểm tra tem nhãn suất ăn riêng trước khi chuyển lên lớp
          </span>
        </div>

        {/* Card 3: Danh mục món ăn trưa nay */}
        <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <span className="text-xs font-bold text-slate-400 tracking-wider">THỰC ĐƠN TRƯA THỨ BA</span>
            <div className="mt-4 space-y-3">
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-brand-400 font-bold block">MÓN MẶN</span>
                <span className="text-base font-bold text-white">Thịt bò xào củ quả ngũ sắc</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-sky-400 font-bold block">MÓN CANH</span>
                <span className="text-base font-bold text-white">Canh cua nấu mồng tơi mướp hương</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-amber-400 font-bold block">TRÁNG MIỆNG</span>
                <span className="text-base font-bold text-white">Chuối tiêu chín cây</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-4 h-4" />
            Lưu mẫu thức ăn lúc 09:45 bởi Đỗ Văn Bếp
          </div>
        </div>
      </div>
    </div>
  );
};
