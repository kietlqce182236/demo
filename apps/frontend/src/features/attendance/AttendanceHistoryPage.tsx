import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttendanceTopNav } from './components/AttendanceTopNav';
import { AttendanceSubTabs } from './components/AttendanceSubTabs';
import { HistoryHeader } from './components/HistoryHeader';
import { HistoryControls } from './components/HistoryControls';
import { HistorySummaryCards } from './components/HistorySummaryCards';
import { HistoryTable } from './components/HistoryTable';
import { HistoryBottomBanner } from './components/HistoryBottomBanner';
import { TrendComparisonModal } from './components/TrendComparisonModal';
import { ExportHistoryReportModal } from './components/ExportHistoryReportModal';
import { CustomDateRangeModal } from './components/CustomDateRangeModal';
import { attendanceApi } from './api/attendanceApi';
import {
  AttendanceHistoryResponse,
  ClassItem,
} from './types';
import { Loader2, AlertCircle, X, ShieldCheck, HeartHandshake, PhoneCall } from 'lucide-react';

export const AttendanceHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester' | 'custom'>('week');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '2026-09-21',
    end: '2026-09-25',
  });
  const [weekNumber, setWeekNumber] = useState<number>(4);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [viewMode, setViewMode] = useState<'table' | 'by_child'>('table');

  // Real Database Data
  const [historyData, setHistoryData] = useState<AttendanceHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isTrendOpen, setIsTrendOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState<boolean>(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Classes from Backend
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classList = await attendanceApi.getClasses();
        setClasses(classList);
        if (classList.length > 0) {
          const mam1 = classList.find((c) => c.name.includes('Mầm 1'));
          setSelectedClassId(mam1 ? mam1.id : classList[0].id);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách lớp học:', err);
      }
    };
    loadClasses();
  }, []);

  // Fetch History from Real Database
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await attendanceApi.getHistoryList({
        classId: selectedClassId || undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
        period: selectedPeriod,
        status: selectedStatus,
        search: searchQuery,
        viewMode,
        page: currentPage,
        limit: pageSize,
      });
      setHistoryData(data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu lịch sử điểm danh & sức ăn:', err);
      showToast('Không thể kết nối máy chủ dữ liệu lịch sử', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedClassId,
    dateRange.start,
    dateRange.end,
    selectedPeriod,
    selectedStatus,
    searchQuery,
    viewMode,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Tab change handler
  const handleTabChange = (tab: string) => {
    if (tab === 'notes') navigate('/coordination-notes');
    else if (tab === 'attendance') navigate('/attendance');
    else if (tab === 'evaluation') navigate('/evaluation');
    else if (tab === 'history') navigate('/history');
  };

  // Date range navigator handlers
  const handlePrevWeek = () => {
    if (weekNumber > 1) {
      setWeekNumber((w) => w - 1);
      const start = new Date(dateRange.start);
      start.setDate(start.getDate() - 7);
      const end = new Date(dateRange.end);
      end.setDate(end.getDate() - 7);
      setDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      });
      setSelectedPeriod('week');
      setCurrentPage(1);
    }
  };

  const handleNextWeek = () => {
    setWeekNumber((w) => w + 1);
    const start = new Date(dateRange.start);
    start.setDate(start.getDate() + 7);
    const end = new Date(dateRange.end);
    end.setDate(end.getDate() + 7);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
    setSelectedPeriod('week');
    setCurrentPage(1);
  };

  // Period Preset changes
  const handlePeriodChange = (period: 'week' | 'month' | 'semester' | 'custom') => {
    setSelectedPeriod(period);
    setCurrentPage(1);

    if (period === 'week') {
      setDateRange({
        start: '2026-09-21',
        end: '2026-09-25',
      });
      setWeekNumber(4);
    } else if (period === 'month') {
      setDateRange({
        start: '2026-09-01',
        end: '2026-09-30',
      });
    } else if (period === 'semester') {
      setDateRange({
        start: '2026-09-01',
        end: '2027-01-15',
      });
    } else if (period === 'custom') {
      setIsCustomDateOpen(true);
    }
  };

  // Apply custom date from modal
  const handleApplyCustomDate = (start: string, end: string, label: string) => {
    setDateRange({ start, end });
    setSelectedPeriod('custom');
    setCurrentPage(1);
    showToast(`Đã áp dụng khoảng thời gian: ${label}`, 'success');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedPeriod('week');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setDateRange({
      start: '2026-09-21',
      end: '2026-09-25',
    });
    setWeekNumber(4);
    setCurrentPage(1);
    showToast('Đã xóa tất cả bộ lọc, trở về trạng thái tuần này', 'info');
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all border animate-slideIn ${
            toast.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : toast.type === 'info'
              ? 'bg-slate-800 text-white border-slate-700'
              : 'bg-emerald-700 text-white border-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-200" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar Navigation */}
      <AttendanceTopNav onSearch={setSearchQuery} />

      {/* Sub Tabs */}
      <AttendanceSubTabs activeTab="history" onTabChange={handleTabChange} />

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Header & Title */}
        <HistoryHeader
          classNameTitle={selectedClass?.name || historyData?.classInfo.name || 'Lớp Mầm 1 (3-4 tuổi)'}
          academicYear={selectedClass?.academicYear || historyData?.classInfo.academicYear || '2026 - 2027'}
          teachers={historyData?.classInfo.teachers || ['Cô Mai Anh', 'Cô Thu Hằng']}
          onOpenTrend={() => setIsTrendOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
        />

        {/* Filter Controls Bar */}
        <HistoryControls
          classes={classes}
          selectedClassId={selectedClassId}
          onClassChange={(id) => {
            setSelectedClassId(id);
            setCurrentPage(1);
          }}
          dateRangeText={historyData?.period.displayRange || '21/09 - 25/09/2026'}
          weekLabel={historyData?.period.weekLabel || `Tuần ${weekNumber}`}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          onOpenCustomDate={() => setIsCustomDateOpen(true)}
          selectedStatus={selectedStatus}
          onStatusChange={(s) => {
            setSelectedStatus(s);
            setCurrentPage(1);
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
          }}
          totalStudents={selectedClass?.totalStudents || historyData?.classInfo.totalStudents || 32}
          totalFilteredItems={historyData?.pagination.totalItems}
          totalWeekMeals={historyData?.pagination.totalWeekMeals}
          onResetFilters={handleResetFilters}
        />

        {/* 4 Summary Cards */}
        <HistorySummaryCards summary={historyData?.summary} />

        {/* Loading Indicator or Main Table */}
        {isLoading && !historyData ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">
              Đang truy vấn cơ sở dữ liệu lịch sử điểm danh & sức ăn...
            </p>
          </div>
        ) : (
          <HistoryTable
            items={historyData?.items || []}
            pagination={
              historyData?.pagination || {
                currentPage: 1,
                totalPages: 12,
                totalItems: 120,
                limit: 10,
                totalWeekMeals: 120,
              }
            }
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPageChange={(p) => setCurrentPage(p)}
            pageSize={pageSize}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
            onFilterChild={(childName) => {
              setSearchQuery(childName);
              setCurrentPage(1);
              showToast(`Đang lọc nhật ký của bé: ${childName}`, 'info');
            }}
          />
        )}

        {/* Bottom Compliance & Standards Banner */}
        <HistoryBottomBanner
          onOpenCaloGuide={() => {
            showToast('Đang mở Sổ tay Khuyến nghị Nhu cầu Năng lượng & Calo theo độ tuổi (Viện Dinh Dưỡng Quốc Gia)', 'info');
          }}
          onPrintLogBook={() => {
            window.print();
          }}
        />
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-extrabold text-slate-700">
              KidMeal © 2025 Bản quyền thuộc KidMeal Education Tech.
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5 text-teal-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Tiêu chuẩn VSATTP Bộ Giáo dục & Đào tạo
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5 text-sky-700 font-bold">
              <HeartHandshake className="w-4 h-4 text-sky-600" />
              LiveSync Bếp 1 chiều
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-amber-700">
              <PhoneCall className="w-3.5 h-3.5" />
              Hỗ trợ kỹ thuật: <strong>1900 6868</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Hệ thống ổn định 99.9%
            </span>
          </div>
        </div>
      </footer>

      {/* Interactive Trend Comparison Modal */}
      <TrendComparisonModal
        isOpen={isTrendOpen}
        onClose={() => setIsTrendOpen(false)}
        classNameTitle={selectedClass?.name || 'Lớp Mầm 1 (3-4 tuổi)'}
        trends={historyData?.trends}
        summary={historyData?.summary}
      />

      {/* Export Report Modal */}
      <ExportHistoryReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={historyData}
      />

      {/* Custom Date Range Picker Modal */}
      <CustomDateRangeModal
        isOpen={isCustomDateOpen}
        onClose={() => setIsCustomDateOpen(false)}
        currentStartDate={dateRange.start}
        currentEndDate={dateRange.end}
        onApply={handleApplyCustomDate}
      />
    </div>
  );
};
