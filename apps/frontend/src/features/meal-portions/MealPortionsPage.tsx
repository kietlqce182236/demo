import React, { useState, useEffect, useCallback } from 'react';
import { MealPortionPlanResponse } from './types';
import { mealPortionsApi } from './api/mealPortionsApi';
import { MealPortionsSidebar } from './components/MealPortionsSidebar';
import { MealPortionsTopNav } from './components/MealPortionsTopNav';
import { MealPortionsBanner } from './components/MealPortionsBanner';
import { MealPortionsHeader } from './components/MealPortionsHeader';
import { MealPortionsKpis } from './components/MealPortionsKpis';
import { MealPortionsTabsBar } from './components/MealPortionsTabsBar';
import { WeeklyMenuGrid } from './components/WeeklyMenuGrid';
import { PortionPlanSection } from './components/PortionPlanSection';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const MealPortionsPage: React.FC = () => {
  const [weekNumber, setWeekNumber] = useState<number>(14);
  const [schoolYear, setSchoolYear] = useState<string>('Năm học 2024 - 2025 - Học kỳ 1');
  const [activeTab, setActiveTab] = useState<'both' | 'menu' | 'portion'>('both');

  const [data, setData] = useState<MealPortionPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Fetch real data from PostgreSQL backend
  const loadPlanData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await mealPortionsApi.getWeeklyPlan({
        weekNumber,
        schoolYear,
      });
      setData(res);
    } catch (err: any) {
      console.error('Lỗi khi tải Kế hoạch Định lượng Suất ăn từ DB:', err);
      setError(err?.response?.data?.message || 'Không thể kết nối đến máy chủ cơ sở dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  }, [weekNumber, schoolYear]);

  useEffect(() => {
    loadPlanData();
  }, [loadPlanData]);

  // Show auto-dismissing toast
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Week navigation
  const handlePrevWeek = () => {
    if (weekNumber > 1) {
      setWeekNumber((prev) => prev - 1);
    }
  };

  const handleNextWeek = () => {
    setWeekNumber((prev) => prev + 1);
  };

  const handleToday = () => {
    setWeekNumber(14);
  };

  // Approve warehouse export
  const handleApproveExport = async () => {
    if (!data) return;
    setIsApproving(true);
    try {
      const res = await mealPortionsApi.approveWarehouseExport(data.id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              isWarehouseExported: true,
              exportedAt: res.exportedAt,
            }
          : null,
      );
      showToast('Đã duyệt lệnh xuất kho nguyên liệu tuần thành công vào cơ sở dữ liệu!', 'success');
    } catch (err) {
      console.error('Lỗi duyệt lệnh xuất kho:', err);
      showToast('Lỗi khi duyệt lệnh xuất kho. Vui lòng thử lại.', 'info');
    } finally {
      setIsApproving(false);
    }
  };

  // Export Excel CSV
  const handleExportExcel = () => {
    if (!data) return;
    const url = mealPortionsApi.getExportExcelUrl(data.id);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `phieu-du-tru-xuat-kho-tuan-${weekNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất dữ liệu phiếu xuất kho Excel (CSV) từ hệ thống cơ sở dữ liệu!', 'success');
  };

  // Print A4
  const handlePrintA4 = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* 1. Left Sidebar Matching KidMeal BGH */}
      <MealPortionsSidebar />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <MealPortionsTopNav
          weekNumber={weekNumber}
          schoolYear={schoolYear}
          formattedDateRange={data?.formattedDateRange || '18/11/2024 - 22/11/2024'}
          onWeekChange={setWeekNumber}
        />

        {/* Page Inner Container */}
        <main className="flex-1 p-5 md:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-16 right-8 z-50 animate-bounce">
              <div className="flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold border border-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{toastMessage.text}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500">
                Đang truy xuất dữ liệu thực tế từ Database PostgreSQL...
              </p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-bold text-rose-800">{error}</p>
              <button
                onClick={loadPlanData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Thử tải lại
              </button>
            </div>
          )}

          {/* Normal Render when Data Loaded */}
          {!isLoading && data && (
            <>
              {/* Banner with BGH National System Notice & Action Buttons */}
              <MealPortionsBanner
                bannerQuote={data.bannerQuote}
                isLocked={data.isLocked}
                isPublished={data.isPublishedToParents}
                onPrintA4={handlePrintA4}
              />

              {/* Title & Date Navigation */}
              <MealPortionsHeader
                weekNumber={data.weekNumber}
                formattedDateRange={data.formattedDateRange}
                standardQuote={data.standardQuote}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                onToday={handleToday}
              />

              {/* 4 Summary KPI Cards */}
              <MealPortionsKpis kpis={data.kpis} />

              {/* Segmented Tabs Bar */}
              <MealPortionsTabsBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                studentCount={data.portionPlan.studentCount}
              />

              {/* Tab 1: Weekly Menu Grid (UC46) */}
              {(activeTab === 'both' || activeTab === 'menu') && (
                <WeeklyMenuGrid days={data.weeklyMenu} />
              )}

              {/* Tab 2: Kitchen Portion Planning & Warehouse Inventory (UC56) */}
              {(activeTab === 'both' || activeTab === 'portion') && (
                <PortionPlanSection
                  portionPlan={data.portionPlan}
                  foodSafetySteps={data.foodSafetySteps}
                  macroRatio={data.macroRatio}
                  isWarehouseExported={data.isWarehouseExported}
                  exportedAt={data.exportedAt}
                  onApproveExport={handleApproveExport}
                  onExportExcel={handleExportExcel}
                  isApproving={isApproving}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
