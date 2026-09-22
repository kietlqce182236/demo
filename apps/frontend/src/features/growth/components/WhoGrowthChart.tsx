import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface GrowthDataPoint {
  month: number;
  childWeight: number;
  sdMinus2: number;
  median: number;
  sdPlus2: number;
}

const mockWhoData: GrowthDataPoint[] = [
  { month: 24, childWeight: 12.2, sdMinus2: 10.6, median: 12.2, sdPlus2: 14.3 },
  { month: 27, childWeight: 12.9, sdMinus2: 11.2, median: 12.9, sdPlus2: 15.2 },
  { month: 30, childWeight: 13.5, sdMinus2: 11.8, median: 13.6, sdPlus2: 16.0 },
  { month: 33, childWeight: 14.1, sdMinus2: 12.4, median: 14.2, sdPlus2: 16.8 },
  { month: 36, childWeight: 14.6, sdMinus2: 12.9, median: 14.8, sdPlus2: 17.6 },
];

export const WhoGrowthChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">
            Biểu đồ Tăng trưởng Cân nặng theo Tuổi (WHO Standards)
          </h3>
          <p className="text-xs text-slate-500">Bé: Trần Gia Bảo (Lớp Chồi 1) – Bé trai</p>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
          Z-Score: +0.2 SD (Phát triển bình thường)
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockWhoData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" unit=" thg" tick={{ fontSize: 12 }} />
            <YAxis unit=" kg" domain={[8, 20]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

            {/* WHO Đường biên +2SD (Thừa cân) */}
            <Line
              type="monotone"
              dataKey="sdPlus2"
              name="+2 SD (Nguy cơ thừa cân)"
              stroke="#f59e0b"
              strokeDasharray="4 4"
              dot={false}
            />

            {/* WHO Đường Median Chuẩn */}
            <Line
              type="monotone"
              dataKey="median"
              name="Chuẩn Trung vị WHO"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />

            {/* WHO Đường biên -2SD (Suy dinh dưỡng) */}
            <Line
              type="monotone"
              dataKey="sdMinus2"
              name="-2 SD (Nguy cơ thiếu cân)"
              stroke="#ef4444"
              strokeDasharray="4 4"
              dot={false}
            />

            {/* Cân nặng thực tế của trẻ */}
            <Line
              type="monotone"
              dataKey="childWeight"
              name="Cân nặng thực tế của trẻ"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
