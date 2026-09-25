import React, { useState, useEffect, useCallback } from 'react';
import { AttendanceTopNav } from './components/AttendanceTopNav';
import { AttendanceSubTabs } from './components/AttendanceSubTabs';
import { AttendanceHeader } from './components/AttendanceHeader';
import { AttendanceControls } from './components/AttendanceControls';
import { AttendanceSummaryCards } from './components/AttendanceSummaryCards';
import { AttendanceTable } from './components/AttendanceTable';
import { AttendanceBottomSections } from './components/AttendanceBottomSections';
import { EditNoteModal } from './components/EditNoteModal';
import { ExportReportModal } from './components/ExportReportModal';
import { attendanceApi } from './api/attendanceApi';
import { AttendanceResponse, ClassItem, ChildAttendanceItem, MealOption } from './types';
import { Loader2, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  // State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('f1000000-0000-0000-0000-000000000001');
  const [selectedDate, setSelectedDate] = useState<string>('2024-10-25');
  const [mealFilter, setMealFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('attendance');

  // Attendance Data from Real Database
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Selection & Modals
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [editingChild, setEditingChild] = useState<ChildAttendanceItem | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classList = await attendanceApi.getClasses();
        setClasses(classList);
        if (classList.length > 0 && !selectedClassId) {
          setSelectedClassId(classList[0].id);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách lớp học:', err);
      }
    };
    loadClasses();
  }, []);

  // Fetch Attendance Data from Backend
  const fetchAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    setIsLoading(true);
    try {
      const data = await attendanceApi.getAttendanceList({
        classId: selectedClassId,
        date: selectedDate,
        mealFilter,
        search: searchQuery,
        page: currentPage,
        limit: 8,
      });
      setAttendanceData(data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu điểm danh:', err);
      showToast('Không thể kết nối máy chủ dữ liệu điểm danh', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, selectedDate, mealFilter, searchQuery, currentPage]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Handle Meal Status Update
  const handleUpdateMealStatus = async (childId: string, mealOption: MealOption) => {
    if (!attendanceData) return;

    // Optimistic UI Update
    setAttendanceData((prev) => {
      if (!prev) return null;
      const updatedChildren = prev.children.map((c) => {
        if (c.id === childId) {
          const isAbsent = mealOption === 'ABSENT';
          let kitchenStatus: 'SYNCED' | 'PENDING' | 'CANCELLED' = isAbsent ? 'CANCELLED' : 'SYNCED';
          return {
            ...c,
            mealOption,
            isAbsent,
            kitchenStatus,
          };
        }
        return c;
      });

      // Recalculate summary
      const absentCount = updatedChildren.filter((c) => c.mealOption === 'ABSENT').length;
      const registeredToday = prev.summary.totalClassStudents - absentCount;

      return {
        ...prev,
        children: updatedChildren,
        summary: {
          ...prev.summary,
          registeredToday,
          registeredRatioPercent: parseFloat(((registeredToday / prev.summary.totalClassStudents) * 100).toFixed(1)),
          absentCount,
        },
      };
    });

    try {
      const res = await attendanceApi.updateChildAttendance(childId, {
        date: selectedDate,
        mealOption,
      });
      showToast(res.message || 'Cập nhật trạng thái suất ăn thành công!');
      // Re-fetch in background to sync all portions & metrics exactly
      fetchAttendance();
    } catch (err) {
      console.error('Lỗi khi lưu điểm danh:', err);
      showToast('Lỗi khi lưu điểm danh về cơ sở dữ liệu', 'error');
      fetchAttendance();
    }
  };

  // Handle Mark All Present
  const handleMarkAllPresent = async () => {
    if (!selectedClassId) return;
    try {
      const res = await attendanceApi.markAllPresent({
        classId: selectedClassId,
        date: selectedDate,
        mealOption: 'ALL_DAY',
      });
      showToast(res.message || 'Đã điểm danh CÓ ĂN toàn bộ học sinh');
      fetchAttendance();
    } catch (err) {
      console.error('Lỗi khi điểm danh tất cả:', err);
      showToast('Lỗi khi thực hiện điểm danh tất cả', 'error');
    }
  };

  // Handle Sync Morning Checkin
  const handleSyncMorning = async () => {
    if (!selectedClassId) return;
    setIsSyncing(true);
    try {
      const res = await attendanceApi.syncFromMorning({
        classId: selectedClassId,
        date: selectedDate,
      });
      showToast(res.message || 'Đã đồng bộ từ điểm danh đầu giờ thành công');
      fetchAttendance();
    } catch (err) {
      console.error('Lỗi khi đồng bộ đầu giờ:', err);
      showToast('Lỗi khi đồng bộ điểm danh đầu giờ', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Lock and Send to Kitchen
  const handleLockKitchen = async () => {
    if (!selectedClassId) return;
    setIsLocking(true);
    try {
      const res = await attendanceApi.lockAndSendToKitchen({
        classId: selectedClassId,
        date: selectedDate,
      });
      setIsLocked(true);
      showToast(res.message || 'Đã khóa sổ và gửi số lượng suất ăn tới Bếp Trung Tâm');
    } catch (err) {
      console.error('Lỗi khi khóa danh sách gửi bếp:', err);
      showToast('Lỗi khi gửi dữ liệu tới bếp', 'error');
    } finally {
      setIsLocking(false);
    }
  };

  // Handle Save Parent Note
  const handleSaveNote = async (childId: string, newNote: string) => {
    try {
      const child = attendanceData?.children.find((c) => c.id === childId);
      if (!child) return;

      await attendanceApi.updateChildAttendance(childId, {
        date: selectedDate,
        mealOption: child.mealOption,
        notes: newNote,
      });
      showToast('Đã lưu ghi chú dặn dò phụ huynh thành công!');
      setEditingChild(null);
      fetchAttendance();
    } catch (err) {
      console.error('Lỗi khi lưu ghi chú:', err);
      showToast('Lỗi khi lưu ghi chú về cơ sở dữ liệu', 'error');
    }
  };

  // Selection handlers
  const handleToggleSelectAll = (checked: boolean) => {
    if (!attendanceData) return;
    if (checked) {
      setSelectedChildIds(attendanceData.children.map((c) => c.id));
    } else {
      setSelectedChildIds([]);
    }
  };

  const handleToggleSelectChild = (childId: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId],
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-5 duration-300">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-red-600'
                : toast.type === 'info'
                ? 'bg-blue-600'
                : 'bg-teal-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Top Navigation Bar */}
      <AttendanceTopNav onSearch={(q) => setSearchQuery(q)} />

      {/* 2. Sub Navigation Tabs */}
      <AttendanceSubTabs activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Header & Title */}
        <AttendanceHeader
          classNameTitle={attendanceData?.classInfo.name || 'Lớp Mầm 1 (3-4 tuổi)'}
          cutoffTime={attendanceData?.kitchenConnection.cutoffTime || '08:45'}
          onExportReport={() => setIsExportOpen(true)}
          onLockAndSendKitchen={handleLockKitchen}
          isLocked={isLocked}
        />

        {/* Controls & Filter Toolbar */}
        <AttendanceControls
          selectedDate={selectedDate}
          onDateChange={(d) => {
            setSelectedDate(d);
            setCurrentPage(1);
          }}
          mealFilter={mealFilter}
          onMealFilterChange={(f) => {
            setMealFilter(f);
            setCurrentPage(1);
          }}
          classes={classes}
          selectedClassId={selectedClassId}
          onClassChange={(cId) => {
            setSelectedClassId(cId);
            setCurrentPage(1);
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
          }}
          onMarkAllPresent={handleMarkAllPresent}
          onSyncMorning={handleSyncMorning}
          isSyncing={isSyncing}
        />

        {/* 4 Summary KPI Cards */}
        {attendanceData && <AttendanceSummaryCards summary={attendanceData.summary} />}

        {/* Loading State or Main Data Table */}
        {isLoading && !attendanceData ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Đang truy vấn cơ sở dữ liệu bán trú...</p>
          </div>
        ) : attendanceData ? (
          <AttendanceTable
            childrenList={attendanceData.children}
            totalStudents={attendanceData.summary.totalClassStudents}
            lastSyncTime={attendanceData.kitchenConnection.lastSyncTime}
            recordedBy={attendanceData.kitchenConnection.recordedBy}
            currentPage={attendanceData.pagination.currentPage}
            totalPages={attendanceData.pagination.totalPages}
            onPageChange={(p) => setCurrentPage(p)}
            onUpdateStatus={handleUpdateMealStatus}
            onOpenEditNote={(child) => setEditingChild(child)}
            selectedChildIds={selectedChildIds}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectChild={handleToggleSelectChild}
          />
        ) : null}

        {/* Bottom 2 Cards: K-Kitchen Live Sync & Today's Menu */}
        {attendanceData && (
          <AttendanceBottomSections
            kitchen={{
              ...attendanceData.kitchenConnection,
              isLocked,
            }}
            todayMenu={attendanceData.todayMenu}
            onLockKitchen={handleLockKitchen}
            isLocking={isLocking}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 px-6 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium">
            <strong className="text-teal-700">KidMeal</strong> © 2025 Hệ thống Giám sát & Nuôi dưỡng Bán trú Chuẩn Mầm non.
          </p>
          <div className="flex items-center gap-6 font-semibold">
            <span className="hover:text-teal-700 cursor-pointer">Quy chuẩn VSATTP Bộ Giáo dục</span>
            <span className="hover:text-teal-700 cursor-pointer">Đồng bộ LiveSync Bếp 1 chiều</span>
            <span className="hover:text-teal-700 cursor-pointer">Hỗ trợ kỹ thuật: <strong>1900 6868</strong></span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EditNoteModal
        child={editingChild}
        onClose={() => setEditingChild(null)}
        onSave={handleSaveNote}
      />

      {isExportOpen && (
        <ExportReportModal
          data={attendanceData}
          selectedDate={selectedDate}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
};
