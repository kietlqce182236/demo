import React, { useState, useEffect } from 'react';
import { parentEvaluationApi } from './api/parentEvaluationApi';
import { ChildMenuConsumptionData } from './types';
import { ParentPortalTopNav } from './components/ParentPortalTopNav';
import { ChildInfoStrip } from './components/ChildInfoStrip';
import { ConsumptionKPIStrip } from './components/ConsumptionKPIStrip';
import { DaySelectorTabs } from './components/DaySelectorTabs';
import { DailySessionsTimeline } from './components/DailySessionsTimeline';
import { NutritionOverviewCard } from './components/NutritionOverviewCard';
import { WeeklyConsumptionHistoryTable } from './components/WeeklyConsumptionHistoryTable';
import { PortalFooter } from './components/PortalFooter';
import { Loader2, Utensils, Sparkles, RefreshCw } from 'lucide-react';

export const MonitorChildMenuConsumptionPage: React.FC = () => {
  const [data, setData] = useState<ChildMenuConsumptionData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (date?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await parentEvaluationApi.getChildMenuConsumption(undefined, date || selectedDate);
      setData(res);
      if (date) setSelectedDate(date);
    } catch (err: any) {
      console.error('Error fetching child menu and consumption data:', err);
      setError(err.message || 'Không thể tải dữ liệu thực từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const handleHeartReaction = async (attendanceId: string) => {
    try {
      await parentEvaluationApi.toggleHeartReaction(attendanceId);
    } catch (err) {
      console.error('Error sending heart reaction:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-700">
          Đang tải thực đơn & dữ liệu sức ăn thực tế của bé...
        </p>
        <p className="text-xs text-slate-500 mt-1">Truy vấn cơ sở dữ liệu PostgreSQL KidMeal</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl max-w-md">
          <p className="text-sm font-bold text-red-800">Lỗi kết nối cơ sở dữ liệu</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          <button
            onClick={() => loadData(selectedDate)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased">
      {/* 1. Top Navigation Bar with active tab "Thực đơn & Sức ăn" */}
      <ParentPortalTopNav child={data.child} activeTab="menu-consumption" />

      {/* 2. Sub-Header Child Profile & Allergy Strip */}
      <ChildInfoStrip child={data.child} />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Hero Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Theo dõi toàn diện</span>
              <span className="text-teal-400">•</span>
              <span className="normal-case font-medium">Bữa ăn bán trú</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Thực đơn & Sức ăn của Bé
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Cập nhật trực tiếp thực đơn hằng ngày, lượng nước uống và đánh giá sức ăn từ giáo viên chủ nhiệm & tổ bếp
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadData(selectedDate)}
            className="self-start sm:self-auto px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>

        {/* 3. KPI Metrics Overview Strip */}
        <ConsumptionKPIStrip metrics={data.metrics} />

        {/* 4. Weekday Selector Tabs */}
        <DaySelectorTabs
          days={data.daysInWeek}
          selectedDate={selectedDate}
          onSelectDate={(newDate) => setSelectedDate(newDate)}
        />

        {/* 5. Daily Meal Sessions & Teacher Observations Timeline */}
        <DailySessionsTimeline
          sessions={data.sessions}
          onHeartReaction={handleHeartReaction}
        />

        {/* 6. Nutrition Overview Card (Standards of National Institute of Nutrition) */}
        <NutritionOverviewCard nutrition={data.nutritionSummaryToday} />

        {/* 7. Weekly Consumption History Table */}
        <WeeklyConsumptionHistoryTable
          history={data.weeklySummary}
          childName={data.child.name}
        />
      </main>

      {/* 8. Footer */}
      <PortalFooter />
    </div>
  );
};
