import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  ShieldCheck,
  Scale,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  PieChart as LucidePieChart,
  BarChart3,
  Flame,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  HeartPulse,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import { dashboardApi, DashboardSummary } from '../../dashboard/api/dashboard.api';

// Màu sắc nhận diện chuẩn ProMax
const COLORS = {
  emerald: '#10b981',
  teal: '#0d9488',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  indigo: '#6366f1',
  slate: '#64748b',
};

export const NutritionistReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NUTRITION' | 'GROWTH' | 'FOOD_SAFETY' | 'ALLERGIES'>('NUTRITION');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-10');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getExecutiveSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dữ liệu biểu đồ năng lượng tuần theo ngày (Kcal thực tế vs Chuẩn Bộ GD&ĐT)
  const energyTrendData = useMemo(() => [
    { day: 'Thứ 2', actualKcal: 710, standardMin: 680, standardMax: 780, proteinG: 22.5, fatG: 19.8, carbG: 110.2 },
    { day: 'Thứ 3', actualKcal: 745, standardMin: 680, standardMax: 780, proteinG: 24.1, fatG: 21.0, carbG: 115.0 },
    { day: 'Thứ 4', actualKcal: 720, standardMin: 680, standardMax: 780, proteinG: 23.0, fatG: 20.2, carbG: 111.5 },
    { day: 'Thứ 5', actualKcal: 760, standardMin: 680, standardMax: 780, proteinG: 25.2, fatG: 21.8, carbG: 116.0 },
    { day: 'Thứ 6', actualKcal: 730, standardMin: 680, standardMax: 780, proteinG: 23.4, fatG: 20.5, carbG: 112.8 },
  ], []);

  // Dữ liệu cơ cấu P:L:G (Thông tư 28/2016/TT-BGDĐT: Đạm 13-20%, Béo 25-35%, Đường bột 52-60%)
  const plgPieData = useMemo(() => [
    { name: 'Đạm (Protein) - 14.5%', value: 14.5, color: '#10b981', standard: '13 - 20%' },
    { name: 'Chất béo (Lipid) - 26.2%', value: 26.2, color: '#f59e0b', standard: '25 - 35%' },
    { name: 'Đường bột (Glucid) - 59.3%', value: 59.3, color: '#3b82f6', standard: '52 - 60%' },
  ], []);

  // Dữ liệu thể trạng tăng trưởng WHO Z-score
  const whoDistributionData = useMemo(() => [
    { status: 'Bình thường', count: 135, percent: 90.0, color: '#10b981' },
    { status: 'Thấp còi (HAZ)', count: 5, percent: 3.3, color: '#f59e0b' },
    { status: 'Gầy còm / Nhẹ cân (WAZ)', count: 4, percent: 2.7, color: '#ef4444' },
    { status: 'Thừa cân / Béo phì (BAZ)', count: 6, percent: 4.0, color: '#8b5cf6' },
  ], []);

  // Xử lý xuất file Excel
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Dinh dưỡng P:L:G
      const nutritionSheetData = energyTrendData.map((item) => ({
        'Thứ trong tuần': item.day,
        'Năng lượng thực tế (Kcal)': item.actualKcal,
        'Chuẩn tối thiểu (Kcal)': item.standardMin,
        'Chuẩn tối đa (Kcal)': item.standardMax,
        'Chất đạm (g)': item.proteinG,
        'Chất béo (g)': item.fatG,
        'Đường bột (g)': item.carbG,
      }));
      const wsNutrition = XLSX.utils.json_to_sheet(nutritionSheetData);
      XLSX.utils.book_append_sheet(wb, wsNutrition, 'Dinh duong PLG');

      // Sheet 2: Thể trạng WHO
      const wsWho = XLSX.utils.json_to_sheet(whoDistributionData);
      XLSX.utils.book_append_sheet(wb, wsWho, 'The trang WHO');

      XLSX.writeFile(wb, `Bao_cao_dinh_duong_${selectedPeriod}.xlsx`);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ─── BANNER TIÊU ĐỀ BÁO CÁO CHUYÊN MÔN ─── */}
      <div
        style={{ backgroundColor: '#064e3b' }}
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900"
      >
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Báo Cáo Tổng Hợp Chuyên Môn
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Báo Cáo Dinh Dưỡng, Thể Trạng & An Toàn Thực Phẩm
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-2 leading-relaxed">
              Dữ liệu đối soát định kỳ theo chuẩn Thông tư 28/2016/TT-BGDĐT và Quyết định 1246/QĐ-BYT. Phục vụ công tác thanh kiểm tra của Phòng GD&ĐT và Chi cục An toàn Vệ sinh Thực phẩm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel (.xlsx)'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-2xl bg-[#4eed9c] hover:bg-[#43dc8e] text-emerald-950 font-black text-xs shadow-md transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>In Báo Cáo</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── THANH ĐIỀU KHIỂN & BỘ LỌC CHU KỲ ─── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Nhóm Tabs chuyển đổi báo cáo */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('NUTRITION')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'NUTRITION'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cân đối P:L:G (TT 28)</span>
          </button>
          <button
            onClick={() => setActiveTab('GROWTH')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'GROWTH'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Thể trạng WHO</span>
          </button>
          <button
            onClick={() => setActiveTab('FOOD_SAFETY')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'FOOD_SAFETY'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Kiểm thực 3 bước (QĐ 1246)</span>
          </button>
          <button
            onClick={() => setActiveTab('ALLERGIES')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'ALLERGIES'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Dị ứng & Suất ăn riêng</span>
          </button>
        </div>

        {/* Bộ lọc chu kỳ & khối lớp */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="2026-10">Tháng 10/2026</option>
              <option value="2026-09">Tháng 09/2026</option>
              <option value="2026-W42">Tuần 42 (12/10 - 16/10)</option>
              <option value="2026-HK1">Học kỳ I (2025 - 2026)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Toàn trường (Tất cả khối)</option>
              <option value="NHA_TRE">Khối Nhà trẻ (24 - 36 tháng)</option>
              <option value="MAM">Khối Mầm (3 - 4 tuổi)</option>
              <option value="CHOI">Khối Chồi (4 - 5 tuổi)</option>
              <option value="LA">Khối Lá (5 - 6 tuổi)</option>
            </select>
          </div>

          <button
            onClick={fetchData}
            title="Tải lại dữ liệu"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── NỘI DUNG TAB 1: CÂN ĐỐI DINH DƯỠNG & P:L:G ─── */}
      {activeTab === 'NUTRITION' && (
        <div className="space-y-6">
          {/* 4 Thẻ KPI Chuẩn Bộ Giáo dục */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Năng lượng bình quân</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Flame className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">733</span>
                <span className="text-xs font-bold text-slate-500">kcal/trẻ/ngày</span>
              </div>
              <p className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đạt chuẩn Thông tư 28 (50-60% nhu cầu ngày)
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ Đạm (Protein)</span>
                <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <Utensils className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">14.5%</span>
                <span className="text-xs font-bold text-slate-500">tổng năng lượng</span>
              </div>
              <p className="mt-2 text-xs font-bold text-teal-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Trong ngưỡng chuẩn (13% - 20%)
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ Béo (Lipid)</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Scale className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">26.2%</span>
                <span className="text-xs font-bold text-slate-500">tổng năng lượng</span>
              </div>
              <p className="mt-2 text-xs font-bold text-amber-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Trong ngưỡng chuẩn (25% - 35%)
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đường bột (Glucid)</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">59.3%</span>
                <span className="text-xs font-bold text-slate-500">tổng năng lượng</span>
              </div>
              <p className="mt-2 text-xs font-bold text-blue-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Trong ngưỡng chuẩn (52% - 60%)
              </p>
            </div>
          </div>

          {/* Biểu đồ Năng lượng calo & Cơ cấu tỷ lệ P:L:G */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái 2/3: Năng lượng từng ngày */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Diễn biến Năng lượng Bán trú (Kcal) Theo Ngày</h3>
                  <p className="text-xs text-slate-500">So sánh thực tế với dải chuẩn quy định (680 - 780 Kcal)</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                  Chu kỳ Tuần 42
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={energyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis domain={[500, 900]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val} ${name.includes('Kcal') || name.includes('Năng lượng') ? 'kcal' : 'g'}`,
                        name,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="actualKcal" name="Năng lượng thực tế (Kcal)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Line type="monotone" dataKey="standardMin" name="Chuẩn tối thiểu (680)" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="standardMax" name="Chuẩn tối đa (780)" stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cột phải 1/3: Cơ cấu P:L:G Pie Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cơ Cấu Năng Lượng P : L : G</h3>
                <p className="text-xs text-slate-500">Tỷ lệ Đạm : Béo : Tinh bột đạt chuẩn</p>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={plgPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {plgPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Tỷ trọng']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                {plgPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name.split(' - ')[0]}
                    </span>
                    <span className="font-bold text-slate-900">{item.value}% <span className="text-slate-400 font-normal">({item.standard})</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bảng Dữ liệu Thực đơn Tuần & Vi chất Dinh dưỡng */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Bảng Tổng Hợp Vi Chất & Khẩu Phần Theo Ngày</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Bữa trưa (Kcal)</th>
                    <th className="py-3 px-4">Bữa xế (Kcal)</th>
                    <th className="py-3 px-4">Tổng Calo</th>
                    <th className="py-3 px-4">Chất đạm (g)</th>
                    <th className="py-3 px-4">Chất béo (g)</th>
                    <th className="py-3 px-4">Canxi (mg)</th>
                    <th className="py-3 px-4">Sắt (mg)</th>
                    <th className="py-3 px-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {energyTrendData.map((row) => (
                    <tr key={row.day} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{row.day}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{Math.round(row.actualKcal * 0.7)} kcal</td>
                      <td className="py-3 px-4 font-bold text-amber-700">{Math.round(row.actualKcal * 0.3)} kcal</td>
                      <td className="py-3 px-4 font-black text-slate-900">{row.actualKcal} kcal</td>
                      <td className="py-3 px-4 text-slate-700">{row.proteinG} g</td>
                      <td className="py-3 px-4 text-slate-700">{row.fatG} g</td>
                      <td className="py-3 px-4 text-slate-700">320 mg</td>
                      <td className="py-3 px-4 text-slate-700">3.8 mg</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Đạt chuẩn
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── NỘI DUNG TAB 2: THỂ TRẠNG WHO Z-SCORE ─── */}
      {activeTab === 'GROWTH' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {whoDistributionData.map((item) => (
              <div key={item.status} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.status}</span>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{item.count}</span>
                  <span className="text-xs font-bold text-slate-500">bé ({item.percent}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Biểu Đồ Phân Phối Thể Trạng Học Sinh Toàn Trường (WHO LMS)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={whoDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(val: any) => [`${val} học sinh`, 'Số lượng']} />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]}>
                    {whoDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ─── NỘI DUNG TAB 3: KIỂM THỰC 3 BƯỚC (QĐ 1246/QĐ-BYT) ─── */}
      {activeTab === 'FOOD_SAFETY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bước 1: Trước chế biến</span>
              <div className="mt-2 text-2xl font-black text-emerald-700">100% Hoàn tất</div>
              <p className="mt-1 text-xs text-slate-500">Kiểm tra cảm quan & hóa đơn nguồn gốc VietGAP</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bước 2: Trong chế biến</span>
              <div className="mt-2 text-2xl font-black text-emerald-700">100% Đạt chuẩn</div>
              <p className="mt-1 text-xs text-slate-500">Quy trình 1 chiều & nhiệt độ nấu chín &gt; 85°C</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bước 3: Trước khi ăn</span>
              <div className="mt-2 text-2xl font-black text-emerald-700">100% Lưu mẫu 24h</div>
              <p className="mt-1 text-xs text-slate-500">Mẫu lưu bảo quản lạnh 0°C - 5°C đúng 24 giờ</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Sổ Theo Dõi Kiểm Thực 3 Bước Xuất Mẫu Chuẩn Bộ Y Tế</h3>
            <p className="text-xs text-slate-500">Được lập theo Quyết định số 1246/QĐ-BYT của Bộ trưởng Bộ Y tế về Hướng dẫn thực hiện chế độ kiểm thực ba bước và lưu mẫu thức ăn.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Mã kiểm thực</th>
                    <th className="py-3 px-4">Ngày thực hiện</th>
                    <th className="py-3 px-4">Thực phẩm kiểm tra</th>
                    <th className="py-3 px-4">Nhà cung cấp</th>
                    <th className="py-3 px-4">Nhiệt độ mẫu lưu</th>
                    <th className="py-3 px-4">Người kiểm tra</th>
                    <th className="py-3 px-4">Kết luận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">KT-20261012-01</td>
                    <td className="py-3 px-4 text-slate-600">12/10/2026</td>
                    <td className="py-3 px-4 font-bold text-slate-800">Thịt bò nạc, Bí đỏ, Rau ngót</td>
                    <td className="py-3 px-4 text-slate-600">HTX Nông sản An Phú (VietGAP)</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">3.5°C</td>
                    <td className="py-3 px-4 text-slate-700">Bếp trưởng Nguyễn Văn Thành</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        ĐỦ ĐIỀU KIỆN
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── NỘI DUNG TAB 4: DỊ ỨNG & SUẤT ĂN RIÊNG ─── */}
      {activeTab === 'ALLERGIES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng trẻ có dị ứng</span>
              <div className="mt-2 text-2xl font-black text-rose-700">5 bé</div>
              <p className="mt-1 text-xs text-slate-500">Chiếm 3.3% tổng số học sinh toàn trường</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suất ăn thay thế đã phục vụ</span>
              <div className="mt-2 text-2xl font-black text-emerald-700">100% An toàn</div>
              <p className="mt-1 text-xs text-slate-500">Không ghi nhận bất kỳ sự cố sốc/dị ứng nào</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhóm dị ứng phổ biến nhất</span>
              <div className="mt-2 text-2xl font-black text-amber-700">Sữa bò &amp; Hải sản</div>
              <p className="mt-1 text-xs text-slate-500">Được dán nhãn KDS cảnh báo cho bếp</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
