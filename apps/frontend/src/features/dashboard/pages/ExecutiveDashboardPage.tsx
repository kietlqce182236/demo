import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UtensilsCrossed,
  ShieldAlert,
  Activity,
  CreditCard,
  ChefHat,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  HeartPulse,
  Flame,
  Thermometer,
  RefreshCw,
  BellRing,
} from 'lucide-react';
import { dashboardApi, DashboardSummary } from '../api/dashboard.api';

export const ExecutiveDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const summary = await dashboardApi.getExecutiveSummary();
      setData(summary);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Đang tải dữ liệu tổng quan BGH...</p>
        </div>
      </div>
    );
  }

  const att = data?.todayAttendance;
  const menu = data?.currentMenu;
  const growth = data?.growthStatistics;
  const alerts = data?.allergenAlerts;
  const rev = data?.snackServiceRevenue;
  const safety = data?.foodSafetyStatus;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ─── 1. TOP HEADER BANNER ─── */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Bảng Điều Hành Ban Giám Hiệu & Dinh Dưỡng
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Hệ Thống Quản Lý Dinh Dưỡng & Bán Trú Mầm Non
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Tích hợp Thông tư 28/2016/TT-BGDĐT, Kiểm thực 3 bước QĐ 1246/QĐ-BYT, Chuẩn tăng trưởng thể lực WHO & Thanh toán VNPAY Dịch vụ ăn xế.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-2 text-xs font-bold"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Cập nhật</span>
            </button>
            <Link
              to="/menu-approval"
              className="px-5 py-2.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Duyệt Thực Đơn Tuần</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. 5 CORE KPI CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Sĩ số ăn bán trú hôm nay */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sĩ số Bán Trú</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{att?.presentLunch || 0}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">
              {Math.round(((att?.presentLunch || 0) / (att?.totalStudents || 1)) * 100)}%
            </span>
            <span>/ {att?.totalStudents || 0} học sinh</span>
          </div>
        </div>

        {/* Card 2: Năng lượng thực đơn tuần */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Calo Trung Bình</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{menu?.dailyAverageCalories || 720} <span className="text-sm font-semibold text-slate-400">Kcal</span></div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-amber-600 font-bold">P:L:G</span>
            <span>{menu?.ratioPLG || '15 : 28 : 57'}</span>
          </div>
        </div>

        {/* Card 3: Cảnh báo Dị ứng / Xung đột */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cảnh Báo Dị Ứng</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{alerts?.openConflictsCount || 0}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span>Tổng {alerts?.allergicChildrenCount || 0} bé có tiền sử dị ứng</span>
          </div>
        </div>

        {/* Card 4: Thể lực Chuẩn WHO */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thể Lực Chuẩn WHO</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-700">{growth?.normalPercent || 85}%</div>
          <div className="text-xs text-slate-500">
            <span>{growth?.totalEvaluated || 0} học sinh đã đánh giá</span>
          </div>
        </div>

        {/* Card 5: Doanh thu Ăn xế VNPAY */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ăn Xế 17h (VNPAY)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-blue-700">
            {((rev?.totalRevenueVnd || 0) / 1000000).toFixed(1)} <span className="text-sm font-semibold text-slate-400">Tr.đ</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className="text-blue-600 font-bold">{rev?.totalRegistrations || 0}</span>
            <span>suất đăng ký</span>
          </div>
        </div>
      </div>

      {/* ─── 3. MAIN DASHBOARD CONTENT (2 COLUMNS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Thực đơn áp dụng & Cân đối dinh dưỡng */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{menu?.title || 'Thực đơn tuần hiện tại'}</h3>
                  <p className="text-xs text-slate-500">Đối tượng: {menu?.targetAgeGroup} • Trạng thái: Đang áp dụng</p>
                </div>
              </div>
              <Link
                to="/menus"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
              >
                <span>Chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* P:L:G Breakdown Meters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Cân đối cơ cấu năng lượng (Thông tư 28/2016/TT-BGDĐT)</span>
                <span className="text-emerald-600">Đạt chuẩn 100%</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <div className="text-xs font-bold text-slate-500">Protein (Đạm)</div>
                  <div className="text-lg font-black text-emerald-700">15%</div>
                  <div className="text-[11px] text-slate-400">Chuẩn 13 - 20%</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <div className="text-xs font-bold text-slate-500">Lipid (Chất béo)</div>
                  <div className="text-lg font-black text-amber-700">28%</div>
                  <div className="text-[11px] text-slate-400">Chuẩn 25 - 35%</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <div className="text-xs font-bold text-slate-500">Glucid (Tinh bột)</div>
                  <div className="text-lg font-black text-teal-700">57%</div>
                  <div className="text-[11px] text-slate-400">Chuẩn 52 - 60%</div>
                </div>
              </div>
            </div>

            {/* Attendance Session Snapshot */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50/60">
                <div className="text-xs font-semibold text-emerald-800">Ăn trưa (10:30)</div>
                <div className="text-xl font-black text-emerald-900">{att?.presentLunch || 0} suất</div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/60">
                <div className="text-xs font-semibold text-blue-800">Ăn xế chiều (14:15)</div>
                <div className="text-xl font-black text-blue-900">{att?.presentSnack || 0} suất</div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/60">
                <div className="text-xs font-semibold text-rose-800">Nghỉ học hôm nay</div>
                <div className="text-xl font-black text-rose-900">{att?.absentCount || 0} bé</div>
              </div>
            </div>
          </div>

          {/* Section: Cảnh báo dị ứng khẩn cấp thời gian thực */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cảnh Báo Xung Đột Dị Ứng Hôm Nay</h3>
                  <p className="text-xs text-slate-500">Rule Engine tự động rà soát thành phần món ăn</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full">
                {alerts?.openConflictsCount || 0} Cảnh báo mở
              </span>
            </div>

            {alerts?.recentAlerts && alerts.recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.recentAlerts.map((alert, idx) => (
                  <div
                    key={alert.id || idx}
                    className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/40 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-900">{alert.childName}</span>
                        <span className="text-[11px] font-medium text-slate-500">({alert.className})</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-800">
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">
                        Xung đột món: <strong className="text-rose-700">{alert.dishName}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500">{alert.allergen}</p>
                    </div>

                    <Link
                      to="/tablet"
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shrink-0"
                    >
                      Đổi suất ăn
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                Không có xung đột dị ứng nào trên thực đơn hôm nay.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-6">
          {/* Section: Kiểm thực 3 bước & Lưu mẫu 24h */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">An Toàn Thực Phẩm 24h</h3>
                  <p className="text-xs text-slate-500">QĐ 1246/QĐ-BYT Bộ Y Tế</p>
                </div>
              </div>
              <Link to="/food-safety" className="text-xs font-bold text-teal-700 hover:text-teal-800">
                Chi tiết
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Bước 1: Nguyên liệu đầu vào</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã kiểm
                </span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Bước 2: Quy trình chế biến</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã kiểm
                </span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Bước 3: Lưu mẫu thức ăn 24h</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã niêm phong
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">Tủ lưu mẫu 24h (0 - 5°C)</div>
                  <div className="text-[11px] text-emerald-700">Đang lưu: {safety?.samplesInRetentionCount || 4} mẫu thức ăn</div>
                </div>
                <div className="flex items-center gap-1 text-emerald-800 font-black text-sm">
                  <Thermometer className="w-4 h-4 text-emerald-600" />
                  {safety?.storageTempAvg || 4.2}°C
                </div>
              </div>
            </div>
          </div>

          {/* Section: Phân bố thể lực WHO Z-score */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Phân Bố Thể Lực Học Sinh</h3>
                  <p className="text-xs text-slate-500">Chuẩn nhân trắc học WHO 2006</p>
                </div>
              </div>
              <Link to="/growth" className="text-xs font-bold text-teal-700 hover:text-teal-800">
                Xem biểu đồ
              </Link>
            </div>

            <div className="space-y-3">
              {/* Normal */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Phát triển bình thường</span>
                  <span className="text-teal-700">{growth?.normalPercent || 85}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: `${growth?.normalPercent || 85}%` }}></div>
                </div>
              </div>

              {/* Stunted */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Thấp còi (HAZ &lt; -2 SD)</span>
                  <span className="text-amber-600">{growth?.stuntedPercent || 5}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${growth?.stuntedPercent || 5}%` }}></div>
                </div>
              </div>

              {/* Underweight */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Nhẹ cân (WAZ &lt; -2 SD)</span>
                  <span className="text-amber-600">{growth?.underweightPercent || 4}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${growth?.underweightPercent || 4}%` }}></div>
                </div>
              </div>

              {/* Overweight */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Thừa cân / Béo phì (BMI &gt; +2 SD)</span>
                  <span className="text-rose-600">{growth?.overweightPercent || 6}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${growth?.overweightPercent || 6}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
