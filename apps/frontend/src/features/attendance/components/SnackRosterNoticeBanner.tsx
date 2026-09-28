import React from 'react';
import { Bell } from 'lucide-react';

interface SnackRosterNoticeBannerProps {
  timeWindow?: string;
  specialCount?: number;
}

export const SnackRosterNoticeBanner: React.FC<SnackRosterNoticeBannerProps> = ({
  timeWindow = '14:15 - 14:45',
  specialCount = 8,
}) => {
  return (
    <div className="bg-[#fef9ee] border border-[#fde68a] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
      {/* Left Notice Content */}
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#fed7aa]/50 border border-[#fcd34d] flex items-center justify-center text-amber-800 shrink-0">
          <Bell className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-950">
            Lưu ý ca chiều (Giờ ra món: {timeWindow})
          </h4>
          <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
            Vận chuyển khay giữ nhiệt đến các lớp trước 14:15. Bàn giao riêng{' '}
            <u className="font-semibold text-amber-950 cursor-pointer">
              {specialCount} suất ăn chế độ đặc biệt
            </u>{' '}
            (Không sữa, ít đường, dị ứng đậu phộng) có dán nhãn tên bé và mã HS.
          </p>
        </div>
      </div>

      {/* Right Approval Badge */}
      <div className="shrink-0 self-end sm:self-center">
        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#fde68a] text-amber-950 border border-[#f59e0b]/40 shadow-2xs">
          Kiểm thực bước 2: Đã duyệt
        </span>
      </div>
    </div>
  );
};
