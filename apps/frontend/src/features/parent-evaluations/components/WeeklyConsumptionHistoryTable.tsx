import React from 'react';
import { History, CheckCircle2, Droplets, Camera, User } from 'lucide-react';
import { WeeklyConsumptionItem } from '../types';

interface WeeklyConsumptionHistoryTableProps {
  history?: WeeklyConsumptionItem[];
  childName?: string;
}

export const WeeklyConsumptionHistoryTable: React.FC<WeeklyConsumptionHistoryTableProps> = ({
  history = [],
  childName = 'Bé Bảo Nam',
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Bảng Tổng Hợp Sức Ăn Cả Tuần của {childName || 'Bé Bảo Nam'}
            </h3>
            <p className="text-xs text-slate-500">
              Nhật ký bất biến lưu trữ minh bạch giữa Nhà trường và Gia đình
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          5 ngày học trong tuần
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-bold">
              <th className="py-3 px-3 rounded-l-xl">Ngày & Thứ</th>
              <th className="py-3 px-3">Thực đơn bữa trưa</th>
              <th className="py-3 px-3 text-center">Tỷ lệ ăn</th>
              <th className="py-3 px-3 text-center">Mức độ</th>
              <th className="py-3 px-3">Lượng nước</th>
              <th className="py-3 px-3 min-w-[240px]">Nhận xét của giáo viên</th>
              <th className="py-3 px-3 text-center rounded-r-xl">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(Array.isArray(history) ? history : []).map((row) => (
              <tr key={row.date} className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                  <div>{row.dayName}</div>
                  <div className="text-[11px] text-slate-400 font-normal">{row.dateFormatted}</div>
                </td>

                <td className="py-3 px-3">
                  <p className="font-semibold text-slate-800 line-clamp-2 max-w-xs">{row.dishes}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                    {row.badgeText}
                  </span>
                </td>

                <td className="py-3 px-3 text-center">
                  <span className="font-black text-slate-900 text-sm">{row.percentage}%</span>
                </td>

                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{row.portionLabel}</span>
                  </span>
                </td>

                <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                  <div className="flex items-center gap-1 font-semibold">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    <span>{row.waterIntake}</span>
                  </div>
                </td>

                <td className="py-3 px-3 text-slate-700 italic">
                  <div className="flex items-start gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>“{row.teacherFeedback}”</span>
                  </div>
                </td>

                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
