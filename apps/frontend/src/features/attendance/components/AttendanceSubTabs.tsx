import React from 'react';

interface AttendanceSubTabsProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AttendanceSubTabs: React.FC<AttendanceSubTabsProps> = ({
  activeTab = 'attendance',
  onTabChange,
}) => {
  const tabs = [
    { id: 'notes', label: 'Gửi & Xem ghi chú điều phối suất ăn nhanh' },
    { id: 'attendance', label: 'Điểm danh học sinh ăn bán trú' },
    { id: 'evaluation', label: 'Đánh giá mức độ ăn của trẻ sau bữa' },
    { id: 'history', label: 'Xem lịch sử điểm danh và sức ăn' },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-2">
      <div className="max-w-[1440px] mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
