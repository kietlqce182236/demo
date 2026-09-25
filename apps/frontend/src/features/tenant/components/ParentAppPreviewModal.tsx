import React from 'react';
import { X, Wifi, Battery, Bell, Utensils, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';
import { SchoolBranding } from '../../../core/api/tenant.api';

interface ParentAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: SchoolBranding;
  schoolName: string;
}

export const ParentAppPreviewModal: React.FC<ParentAppPreviewModalProps> = ({
  isOpen,
  onClose,
  branding,
  schoolName,
}) => {
  if (!isOpen) return null;

  // Lấy màu chủ đạo
  const getColorStyles = (color: string) => {
    switch (color) {
      case 'YELLOW':
        return {
          headerBg: 'bg-amber-500',
          badgeBg: 'bg-amber-100 text-amber-800',
          accentText: 'text-amber-600',
          pillBg: 'bg-amber-500 text-white',
          themeName: 'Vàng Mật (Năng lượng)',
        };
      case 'ORANGE':
        return {
          headerBg: 'bg-orange-500',
          badgeBg: 'bg-orange-100 text-orange-800',
          accentText: 'text-orange-600',
          pillBg: 'bg-orange-500 text-white',
          themeName: 'Cam San (Ấm cúng)',
        };
      case 'TEAL':
      default:
        return {
          headerBg: 'bg-teal-600',
          badgeBg: 'bg-teal-100 text-teal-800',
          accentText: 'text-teal-600',
          pillBg: 'bg-teal-600 text-white',
          themeName: 'Teal Past (Mặc định)',
        };
    }
  };

  const theme = getColorStyles(branding.primaryColor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl shadow-2xl p-6 border border-slate-700 flex flex-col items-center max-w-sm w-full relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Mô phỏng App Phụ Huynh
          </h3>
          <p className="text-[11px] text-slate-400">Giao diện iOS / Android theo màu: {theme.themeName}</p>
        </div>

        {/* Khung điện thoại thông minh (Phone Mockup) */}
        <div className="w-[290px] h-[580px] bg-white rounded-[40px] shadow-2xl overflow-hidden border-[6px] border-slate-800 flex flex-col relative">
          {/* Dynamic Island / Tai thỏ */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-30"></div>

          {/* Status bar */}
          <div className="h-7 bg-transparent px-5 flex items-center justify-between text-[10px] text-slate-700 font-semibold z-20 pt-1">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3 h-3" />
            </div>
          </div>

          {/* App Header với màu nhận diện */}
          <div className={`${theme.headerBg} text-white px-4 pt-3 pb-6 rounded-b-[24px] shadow-md transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center">
                  <img
                    src="https://api.iconify.design/lucide:baby.svg"
                    alt="Logo"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">{schoolName}</h4>
                  <p className="text-[10px] opacity-90">Bé: Lê Hoàng Long (3-4T)</p>
                </div>
              </div>
              <div className="p-1.5 bg-white/20 rounded-full">
                <Bell className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Body App Mockup */}
          <div className="flex-1 overflow-y-auto p-3 -mt-3 space-y-2.5 text-xs">
            {/* Thẻ Dinh dưỡng hôm nay */}
            <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-teal-600" /> Thực đơn hôm nay
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${theme.badgeBg}`}>
                  Đã duyệt BGH
                </span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <p>• <b>Bữa trưa:</b> Cơm trắng, Thịt bò xào su su, Canh chua tôm</p>
                <p>• <b>Ăn xế 17h:</b> Bánh flan caramel + Sữa hạt</p>
              </div>
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Bé ăn hết 100% suất
                </span>
                <span className="text-slate-400">11:45 AM</span>
              </div>
            </div>

            {/* Dịch vụ ăn xế 17h & VNPAY */}
            <div className="bg-teal-50/60 rounded-2xl p-3 border border-teal-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-900 text-[11px]">Dịch vụ ăn xế 17h</span>
                <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                  ĐÃ THANH TOÁN
                </span>
              </div>
              <p className="text-[10px] text-teal-800">
                Gói tháng 09/2026 • Cổng VNPAY QR
              </p>
            </div>

            {/* Chỉ số phát triển WHO */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Thể lực chuẩn WHO
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                <div className="bg-white p-1.5 rounded-lg border text-center">
                  <span className="text-slate-400 block">Cân nặng</span>
                  <span className="font-bold text-slate-800">14.8 kg (+0.2 SD)</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border text-center">
                  <span className="text-slate-400 block">Chiều cao</span>
                  <span className="font-bold text-slate-800">96.5 cm (Bình thường)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar indicator */}
          <div className="h-6 flex items-center justify-center">
            <div className="w-24 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
