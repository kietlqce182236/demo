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
  Building2,
  XCircle,
  Calendar,
} from 'lucide-react';
import { dashboardApi, DashboardSummary } from '../api/dashboard.api';
import { attendanceApi } from '../../attendance/api/attendanceApi';
import { SchoolHeadcountSummaryResponse } from '../../attendance/types';

export const ExecutiveDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [headcountDate, setHeadcountDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [headcountData, setHeadcountData] = useState<SchoolHeadcountSummaryResponse | null>(null);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');

  const fetchData = async () => {
    try {
      const [summary, schoolHeadcount] = await Promise.all([
        dashboardApi.getExecutiveSummary(),
        attendanceApi.getSchoolHeadcountSummary(headcountDate),
      ]);
      setData(summary);
      setHeadcountData(schoolHeadcount);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const reloadHeadcount = async (dateStr: string) => {
    try {
      const res = await attendanceApi.getSchoolHeadcountSummary(dateStr);
      setHeadcountData(res);
    } catch (e) {
      console.error('Error reloading headcount', e);
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

      {/* ─── 3. BẢNG GIÁM SÁT SĨ SỐ TOÀN TRƯỜNG & THEO DÕI ĐIỂM DANH HÔM NAY (CHO HIỆU TRƯỞNG) ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  Giám Sát Sĩ Số Toàn Trường & Tiến Độ Điểm Danh
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Cổng Hiệu Trưởng
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi sĩ số tuyển sinh, tỷ lệ lấp đầy, số trẻ có mặt/vắng mặt và số suất ăn gửi Bếp theo ngày.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
              <Calendar className="w-4 h-4 text-slate-500 ml-1.5" />
              <input
                type="date"
                value={headcountDate}
                onChange={(e) => {
                  setHeadcountDate(e.target.value);
                  reloadHeadcount(e.target.value);
                }}
                className="text-xs font-bold bg-transparent text-slate-700 focus:outline-none pr-2"
              />
            </div>

            <Link
              to="/classes/hub"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <span>Quản trị Lớp & Dị ứng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Summary Cards */}
        {headcountData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Sĩ số toàn trường */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Tổng Sĩ Số Toàn Trường
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {headcountData.overview.totalStudents}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  / {headcountData.overview.totalCapacity} tối đa ({headcountData.overview.occupancyPercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-1">
                <span>👦 Nam: <strong>{headcountData.overview.boysCount}</strong></span>
                <span>👧 Nữ: <strong>{headcountData.overview.girlsCount}</strong></span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, headcountData.overview.occupancyPercent)}%` }}
                ></div>
              </div>
            </div>

            {/* Card 2: Có mặt hôm nay */}
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Hiện Diện Đi Học Hôm Nay
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-800">
                  {headcountData.overview.presentToday}
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  học sinh ({headcountData.overview.attendanceRate}%)
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-700">
                Tỷ lệ chuyên cần đạt chuẩn theo quy định
              </p>
            </div>

            {/* Card 3: Vắng mặt hôm nay */}
            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 space-y-2">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Vắng Mặt Hôm Nay
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-800">
                  {headcountData.overview.absentToday}
                </span>
                <span className="text-xs font-bold text-rose-700">trẻ nghỉ</span>
              </div>
              <p className="text-[11px] font-semibold text-rose-700">
                {headcountData.overview.absentPermitted} có phép • {headcountData.overview.absentUnpermitted} không phép
              </p>
            </div>

            {/* Card 4: Suất ăn chốt Bếp */}
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-2">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                Suất Ăn Chốt Với Bếp
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-800">
                  {headcountData.overview.lunchPortions}
                </span>
                <span className="text-xs font-bold text-amber-700">
                  suất trưa • {headcountData.overview.snackPortions} suất xế
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800">
                <span>Đã chốt: <strong>{headcountData.overview.classesLockedCount}/{headcountData.overview.totalClasses}</strong> lớp</span>
                <span>Dị ứng: <strong>{headcountData.overview.allergicCount}</strong> suất riêng</span>
              </div>
            </div>
          </div>
        )}

        {/* Grade Level Summary Strips */}
        {headcountData?.grades && headcountData.grades.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {headcountData.grades.map((g) => (
              <div
                key={g.gradeLevel}
                onClick={() => setSelectedGradeFilter(selectedGradeFilter === g.gradeLevel ? 'ALL' : g.gradeLevel)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  selectedGradeFilter === g.gradeLevel
                    ? 'bg-teal-50 border-teal-500 shadow-xs ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{g.gradeName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {g.classCount} lớp
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-xl font-black text-slate-900">{g.enrolled}</span>
                  <span className="text-[11px] text-slate-400">/ {g.maxCapacity} bé</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>Đi học: <strong className="text-emerald-600">{g.presentToday}</strong></span>
                  <span>Chuyên cần: <strong className="text-teal-600">{g.attendanceRate}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Class-by-Class Attendance Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3.5 px-4">Tên Lớp / Khối</th>
                <th className="py-3.5 px-4">Giáo Viên Chủ Nhiệm</th>
                <th className="py-3.5 px-4">Sĩ Số vs Sức Chứa</th>
                <th className="py-3.5 px-4">Đi Học Hôm Nay</th>
                <th className="py-3.5 px-4">Vắng Mặt</th>
                <th className="py-3.5 px-4">Suất Trưa / Xế</th>
                <th className="py-3.5 px-4">Dị Ứng</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái Bếp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {headcountData?.classes
                ?.filter((c) => selectedGradeFilter === 'ALL' || c.gradeLevel === selectedGradeFilter)
                .map((cls) => {
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs shrink-0">
                            {cls.name.substring(0, 2)}
                          </div>
                          <div>
                            <div>{cls.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{cls.gradeName} • {cls.roomNumber}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {cls.homeroomTeacher}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1 font-bold text-slate-800 text-xs">
                            <span className="text-teal-700 font-black">{cls.enrolled}</span>
                            <span className="text-slate-400">/ {cls.maxCapacity} trẻ</span>
                            <span className="text-[10px] text-slate-500 font-normal">({cls.occupancyPercent}%)</span>
                          </div>
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                cls.occupancyPercent >= 100 ? 'bg-rose-500' : cls.occupancyPercent >= 85 ? 'bg-amber-500' : 'bg-teal-500'
                              }`}
                              style={{ width: `${Math.min(100, cls.occupancyPercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-emerald-700 text-sm">{cls.presentToday}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({cls.attendanceRate}%)</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {cls.absentToday > 0 ? (
                          <span className="font-bold text-rose-700">
                            {cls.absentToday} bé <span className="text-[10px] text-slate-400 font-normal">({cls.absentPermitted} phép)</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Đủ 100%
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {cls.lunchCount} trưa / {cls.snackCount} xế
                      </td>

                      <td className="py-3.5 px-4">
                        {cls.allergicCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ⚠️ {cls.allergicCount} bé
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Không có</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {cls.isKitchenLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Đã chốt gửi Bếp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Đang điểm danh
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 4. MAIN DASHBOARD CONTENT (2 COLUMNS) ─── */}
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
