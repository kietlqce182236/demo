import React from 'react';
import { X, TrendingUp, BarChart2, CheckCircle2, Award, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

interface TrendComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle?: string;
}

export const TrendComparisonModal: React.FC<TrendComparisonModalProps> = ({
  isOpen,
  onClose,
  classNameTitle = 'Lớp Mầm 1 (3-4 tuổi)',
}) => {
  if (!isOpen) return null;

  const weeklyTrendData = [
    { week: 'Tuần 1', attendanceRate: 91.0, allEatenRate: 78.5, targetRate: 80.0 },
    { week: 'Tuần 2', attendanceRate: 92.5, allEatenRate: 80.2, targetRate: 80.0 },
    { week: 'Tuần 3', attendanceRate: 93.0, allEatenRate: 82.0, targetRate: 80.0 },
    { week: 'Tuần 4', attendanceRate: 94.2, allEatenRate: 83.5, targetRate: 80.0 },
  ];

  const consumptionBreakdownData = [
    { day: 'T2 (21/09)', ateAll: 24, ateHalf: 4, ateLittle: 1, absent: 3 },
    { day: 'T3 (22/09)', ateAll: 25, ateHalf: 3, ateLittle: 1, absent: 3 },
    { day: 'T4 (23/09)', ateAll: 26, ateHalf: 3, ateLittle: 1, absent: 2 },
    { day: 'T5 (24/09)', ateAll: 25, ateHalf: 4, ateLittle: 1, absent: 2 },
    { day: 'T6 (25/09)', ateAll: 26, ateHalf: 3, ateLittle: 1, absent: 2 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 lg:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Biểu Đồ So Sánh Xu Hướng Dinh Dưỡng & Sức Ăn
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Phân tích xu hướng 4 tuần gần nhất • {classNameTitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80">
            <span className="text-[11px] font-bold text-teal-700 uppercase">Tỷ lệ ăn hết suất</span>
            <p className="text-2xl font-black text-teal-900 mt-1">83.5%</p>
            <p className="text-[11px] text-teal-600 font-medium mt-0.5">
              ↗ Tăng 5.0% so với Tuần 5
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80">
            <span className="text-[11px] font-bold text-sky-700 uppercase">Tỷ lệ chuyên cần bán trú</span>
            <p className="text-2xl font-black text-sky-900 mt-1">94.2%</p>
            <p className="text-[11px] text-sky-600 font-medium mt-0.5">
              ↗ Tăng 3.2% so với Tuần 5
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-700 uppercase">Mục tiêu dinh dưỡng</span>
            <p className="text-2xl font-black text-amber-900 mt-1">Đạt 104.3%</p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
              Vượt chuẩn mục tiêu Bộ GD&ĐT
            </p>
          </div>
        </div>

        {/* Chart 1: Xu hướng ăn hết suất qua 4 tuần */}
        <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                1. Xu hướng Tỷ lệ ăn hết suất & Điểm danh 4 tuần
              </h4>
              <p className="text-[11px] text-slate-500">So sánh chỉ số thực tế với mục tiêu tối thiểu 80%</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800">
              Xu hướng tăng tích cực
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(val: number) => [`${val}%`]}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="attendanceRate"
                  name="Tỷ lệ đi học ăn (%)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="allEatenRate"
                  name="Tỷ lệ ăn hết suất (%)"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="targetRate"
                  name="Mục tiêu chuẩn (80%)"
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Phân bố mức độ ăn trong tuần */}
        <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50/50 space-y-3">
          <div>
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
              2. Số lượng trẻ theo mức độ ăn trong tuần 4 (21/09 - 25/09/2026)
            </h4>
            <p className="text-[11px] text-slate-500">Thống kê chi tiết từng ngày theo sĩ số 32 học sinh</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionBreakdownData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: number) => [`${val} bé`]}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="ateAll" name="Ăn hết suất" fill="#0d9488" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="ateHalf" name="Ăn nửa suất" fill="#f59e0b" stackId="a" />
                <Bar dataKey="ateLittle" name="Ăn ít / Bỏ bữa" fill="#ef4444" stackId="a" />
                <Bar dataKey="absent" name="Nghỉ phép" fill="#94a3b8" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
