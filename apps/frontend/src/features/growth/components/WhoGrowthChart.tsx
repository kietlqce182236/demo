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

export interface GrowthDataPoint {
  month: number;
  childWeight: number;
  sdMinus2: number;
  median: number;
  sdPlus2: number;
}

interface WhoGrowthChartProps {
  data?: GrowthDataPoint[];
  childName?: string;
  className?: string;
  zScoreText?: string;
}

export const WhoGrowthChart: React.FC<WhoGrowthChartProps> = ({
  data,
  childName,
  className,
  zScoreText,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-12">
        <p className="text-sm font-semibold text-slate-500">Chưa có dữ liệu đo thể lực cho học sinh này.</p>
        <p className="text-xs text-slate-400 mt-1">Vui lòng ghi nhận chỉ số cân đo mới từ thực tế.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">
            Biểu đồ Tăng trưởng Cân nặng theo Tuổi (WHO Standards)
          </h3>
          {(childName || className) && (
            <p className="text-xs text-slate-500">
              {childName && `Bé: ${childName}`} {className && `(${className})`}
            </p>
          )}
        </div>
        {zScoreText && (
          <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
            {zScoreText}
          </span>
        )}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" unit=" thg" tick={{ fontSize: 12 }} />
            <YAxis unit=" kg" domain={['dataMin - 1', 'dataMax + 2']} tick={{ fontSize: 12 }} />
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
