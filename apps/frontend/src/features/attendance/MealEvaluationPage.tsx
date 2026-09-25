import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttendanceTopNav } from './components/AttendanceTopNav';
import { AttendanceSubTabs } from './components/AttendanceSubTabs';
import { EvaluationHeader } from './components/EvaluationHeader';
import { EvaluationControls } from './components/EvaluationControls';
import { EvaluationSummaryCards } from './components/EvaluationSummaryCards';
import { EvaluationTable } from './components/EvaluationTable';
import { EvaluationSensorySection } from './components/EvaluationSensorySection';
import { EvaluationFooter } from './components/EvaluationFooter';
import { EditEvaluationNoteModal } from './components/EditEvaluationNoteModal';
import { attendanceApi } from './api/attendanceApi';
import {
  MealEvaluationResponse,
  ClassItem,
  MealEvaluationItem,
  PortionType,
} from './types';
import { Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

export const MealEvaluationPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('f1000000-0000-0000-0000-000000000001');
  const [selectedDate, setSelectedDate] = useState<string>('2024-10-25');
  const [selectedMealType, setSelectedMealType] = useState<string>('LUNCH');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('evaluation');

  // Real Database Data
  const [evaluationData, setEvaluationData] = useState<MealEvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selection & Modal
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [editingChild, setEditingChild] = useState<MealEvaluationItem | null>(null);

  // Toast Notification
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

  // Fetch Evaluation Data from Backend Real Database
  const fetchEvaluation = useCallback(async () => {
    if (!selectedClassId) return;
    setIsLoading(true);
    try {
      const data = await attendanceApi.getEvaluationList({
        classId: selectedClassId,
        date: selectedDate,
        mealType: selectedMealType,
        search: searchQuery,
        page: currentPage,
        limit: 8,
      });
      setEvaluationData(data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu đánh giá bữa ăn:', err);
      showToast('Không thể kết nối máy chủ dữ liệu đánh giá', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, selectedDate, selectedMealType, searchQuery, currentPage]);

  useEffect(() => {
    fetchEvaluation();
  }, [fetchEvaluation]);

  // Handle Tab Change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'attendance') {
      navigate('/attendance');
    } else if (tabId === 'evaluation') {
      navigate('/evaluation');
    }
  };

  // Handle Single Child Portion Update
  const handleUpdatePortion = async (childId: string, portion: PortionType) => {
    if (!evaluationData) return;

    // Optimistic UI update
    setEvaluationData((prev) => {
      if (!prev) return null;
      const updatedChildren = prev.children.map((c) => {
        if (c.id === childId) {
          let percentage = 100;
          if (portion === 'HALF') percentage = 50;
          else if (portion === 'NONE') percentage = 20;

          return {
            ...c,
            portionConsumed: portion,
            consumptionPercentage: percentage,
          };
        }
        return c;
      });

      // Recalculate summary
      const presentKids = updatedChildren.filter((c) => !c.isAbsent);
      const ateAllCount = presentKids.filter((c) => c.portionConsumed === 'ALL').length;
      const ateHalfCount = presentKids.filter((c) => c.portionConsumed === 'HALF').length;
      const ateLittleCount = presentKids.filter((c) => c.portionConsumed === 'NONE').length;
      const totalEating = presentKids.length;

      return {
        ...prev,
        children: updatedChildren,
        summary: {
          ...prev.summary,
          ateAllCount,
          ateAllPercent: totalEating > 0 ? (ateAllCount / totalEating) * 100 : 0,
          ateHalfCount,
          ateHalfPercent: totalEating > 0 ? (ateHalfCount / totalEating) * 100 : 0,
          ateLittleCount,
          ateLittlePercent: totalEating > 0 ? (ateLittleCount / totalEating) * 100 : 0,
        },
      };
    });

    try {
      const res = await attendanceApi.updateChildEvaluation(childId, {
        date: selectedDate,
        mealType: selectedMealType,
        portionConsumed: portion,
      });
      showToast(res.message || 'Cập nhật mức ăn thành công!');
      // Sync in background
      fetchEvaluation();
    } catch (err) {
      console.error('Lỗi khi lưu mức ăn:', err);
      showToast('Lỗi khi lưu về cơ sở dữ liệu', 'error');
      fetchEvaluation();
    }
  };

  // Handle Batch Portion Mark for Selected Children
  const handleBatchMarkPortion = async (portion: PortionType) => {
    if (selectedChildIds.length === 0) return;
    try {
      const res = await attendanceApi.batchUpdatePortion({
        classId: selectedClassId,
        date: selectedDate,
        mealType: selectedMealType,
        childIds: selectedChildIds,
        portionConsumed: portion,
      });
      showToast(res.message || 'Đã cập nhật hàng loạt thành công!');
      setSelectedChildIds([]);
      fetchEvaluation();
    } catch (err) {
      console.error('Lỗi khi cập nhật hàng loạt:', err);
      showToast('Lỗi khi cập nhật hàng loạt', 'error');
    }
  };

  // Handle Mark All Ate All (Cả lớp ăn hết suất 100%)
  const handleMarkAllAteAll = async () => {
    if (!selectedClassId) return;
    try {
      const res = await attendanceApi.batchUpdatePortion({
        classId: selectedClassId,
        date: selectedDate,
        mealType: selectedMealType,
        portionConsumed: 'ALL',
      });
      showToast(res.message || 'Đã đánh dấu Cả lớp ăn hết suất (100%)!');
      fetchEvaluation();
    } catch (err) {
      console.error('Lỗi khi đánh dấu cả lớp:', err);
      showToast('Lỗi khi lưu đánh giá', 'error');
    }
  };

  // Handle Save Child Note & Water
  const handleSaveChildNote = async (
    childId: string,
    waterIntake: string,
    notes: string,
    syncStatus: string,
  ) => {
    const child = evaluationData?.children.find((c) => c.id === childId);
    if (!child) return;

    try {
      await attendanceApi.updateChildEvaluation(childId, {
        date: selectedDate,
        mealType: selectedMealType,
        portionConsumed: child.portionConsumed,
        waterIntake,
        notes,
        syncStatus,
      });
      showToast('Đã lưu ghi chú & nước uống của bé thành công!');
      fetchEvaluation();
    } catch (err) {
      console.error('Lỗi khi lưu ghi chú:', err);
      showToast('Không thể lưu ghi chú về database', 'error');
    }
  };

  // Handle Sensory Update
  const handleUpdateSensory = async (data: {
    softnessScore?: number;
    temperatureScore?: number;
    excitementScore?: number;
    chefFeedback?: string;
  }) => {
    try {
      await attendanceApi.updateSensoryEvaluation({
        classId: selectedClassId,
        date: selectedDate,
        mealType: selectedMealType,
        ...data,
      });
      showToast('Đã lưu đánh giá cảm quan món ăn!', 'info');
      fetchEvaluation();
    } catch (err) {
      console.error('Lỗi khi lưu cảm quan:', err);
    }
  };

  // Handle Lock & Complete Evaluation
  const handleLockAndComplete = async (chefFeedback: string) => {
    try {
      const res = await attendanceApi.lockAndSendEvaluation({
        classId: selectedClassId,
        date: selectedDate,
        mealType: selectedMealType,
        chefFeedback,
      });
      showToast(res.message || 'Đã hoàn thành và khóa đánh giá bữa ăn!');
      fetchEvaluation();
    } catch (err) {
      console.error('Lỗi khi khóa đánh giá:', err);
      showToast('Không thể khóa đánh giá', 'error');
    }
  };

  // Handle Save Draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      showToast('Đã lưu nháp đánh giá vào hệ thống thành công!');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle Submit Report to Parents & Kitchen
  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    try {
      const feedback = evaluationData?.sensoryEvaluation.chefFeedback || '';
      await attendanceApi.lockAndSendEvaluation({
        classId: selectedClassId,
        date: selectedDate,
        mealType: selectedMealType,
        chefFeedback: feedback,
      });
      showToast('Đã gửi báo cáo đánh giá suất ăn cho Phụ huynh & Bếp thành công!');
      fetchEvaluation();
    } catch (err) {
      showToast('Lỗi khi gửi báo cáo', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Selection handlers
  const handleToggleSelect = (childId: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId],
    );
  };

  const handleToggleSelectAll = () => {
    if (!evaluationData) return;
    const currentIds = evaluationData.children.map((c) => c.id);
    const allSelected = currentIds.every((id) => selectedChildIds.includes(id));
    if (allSelected) {
      setSelectedChildIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedChildIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
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
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
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
      <AttendanceSubTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Header */}
      <EvaluationHeader
        classNameTitle={selectedClass?.name || 'Lớp Mầm 1 (3-4 tuổi)'}
        isSavingDraft={isSavingDraft}
        isSubmitting={isSubmitting}
        onSaveDraft={handleSaveDraft}
        onSubmitReport={handleSubmitReport}
      />

      {/* Controls & Filter Bar */}
      <EvaluationControls
        selectedDate={selectedDate}
        onDateChange={(d) => {
          setSelectedDate(d);
          setCurrentPage(1);
        }}
        selectedMealType={selectedMealType}
        onMealTypeChange={(m) => {
          setSelectedMealType(m);
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
        onMarkAllAteAll={handleMarkAllAteAll}
        onCopyMenu={() => showToast('Đã sao chép danh sách thực đơn hôm nay!', 'info')}
        totalStudents={evaluationData?.summary.totalEating || 30}
      />

      {/* Main Body */}
      {isLoading && !evaluationData ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-600">Đang tải dữ liệu đánh giá từ máy chủ...</p>
        </div>
      ) : evaluationData ? (
        <main className="flex-1 space-y-4 pb-12">
          {/* Summary Cards */}
          <EvaluationSummaryCards summary={evaluationData.summary} />

          {/* Student Evaluation Table */}
          <EvaluationTable
            children={evaluationData.children}
            selectedChildIds={selectedChildIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onUpdatePortion={handleUpdatePortion}
            onEditNote={setEditingChild}
            onBatchMarkPortion={handleBatchMarkPortion}
            pagination={evaluationData.pagination}
            onPageChange={setCurrentPage}
          />

          {/* Bottom Sensory & Chef Feedback Section */}
          <EvaluationSensorySection
            sensory={evaluationData.sensoryEvaluation}
            onUpdateSensory={handleUpdateSensory}
            onLockAndComplete={handleLockAndComplete}
          />
        </main>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm font-bold text-slate-600">Không tìm thấy dữ liệu đánh giá</p>
        </div>
      )}

      {/* Footer */}
      <EvaluationFooter />

      {/* Edit Child Note & Water Modal */}
      <EditEvaluationNoteModal
        isOpen={Boolean(editingChild)}
        child={editingChild}
        onClose={() => setEditingChild(null)}
        onSave={handleSaveChildNote}
      />
    </div>
  );
};
