import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  RotateCw,
  ChefHat,
  MessageSquarePlus,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { AttendanceTopNav } from './components/AttendanceTopNav';
import { AttendanceSubTabs } from './components/AttendanceSubTabs';
import { CoordinationKPIStrip } from './components/CoordinationKPIStrip';
import { CoordinationFilterBar } from './components/CoordinationFilterBar';
import { CoordinationNotesList } from './components/CoordinationNotesList';
import { CreateEditCoordinationNoteModal } from './components/CreateEditCoordinationNoteModal';
import { KitchenResponseModal } from './components/KitchenResponseModal';
import { coordinationApi } from './api/coordinationApi';
import {
  MealCoordinationData,
  CoordinationQueryParams,
  CoordinationNoteItem,
  CreateCoordinationNotePayload,
  UpdateCoordinationNotePayload,
} from './types';

export const MealCoordinationNotesPage: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<MealCoordinationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [filters, setFilters] = useState<CoordinationQueryParams>({
    mealSession: 'ALL',
    status: 'ALL',
    priority: 'ALL',
    noteType: 'ALL',
    search: '',
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<CoordinationNoteItem | null>(null);

  const [kitchenModalConfig, setKitchenModalConfig] = useState<{
    isOpen: boolean;
    note: CoordinationNoteItem | null;
    mode: 'ACKNOWLEDGE' | 'RESOLVE';
  }>({
    isOpen: false,
    note: null,
    mode: 'ACKNOWLEDGE',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);

      const res = await coordinationApi.getCoordinationNotes(filters);
      setData(res);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu ghi chú điều phối:', err);
      showToast('Không thể tải dữ liệu điều phối từ server', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilters: Partial<CoordinationQueryParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      mealSession: 'ALL',
      status: 'ALL',
      priority: 'ALL',
      noteType: 'ALL',
      search: '',
      classId: undefined,
      date: undefined,
    });
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'attendance') navigate('/attendance');
    else if (tabId === 'evaluation') navigate('/evaluation');
    else if (tabId === 'history') navigate('/history');
    else if (tabId === 'notes') navigate('/coordination-notes');
  };

  // Handlers for Note CRUD
  const handleSaveNote = async (
    payload: CreateCoordinationNotePayload | UpdateCoordinationNotePayload,
    noteId?: string,
  ) => {
    if (noteId) {
      await coordinationApi.updateCoordinationNote(noteId, payload as UpdateCoordinationNotePayload);
      showToast('Đã cập nhật ghi chú điều phối thành công!');
    } else {
      await coordinationApi.createCoordinationNote(payload as CreateCoordinationNotePayload);
      showToast('Đã tạo mới và đồng bộ ghi chú điều phối đến Nhà Bếp!');
    }
    await loadData(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ghi chú điều phối này? Dữ liệu sẽ được gỡ khỏi cơ sở dữ liệu.')) {
      return;
    }
    try {
      await coordinationApi.deleteCoordinationNote(noteId);
      showToast('Đã xóa ghi chú điều phối thành công!');
      await loadData(true);
    } catch (err: any) {
      showToast('Lỗi khi xóa ghi chú: ' + err.message, 'error');
    }
  };

  const handleAcknowledgeClick = (note: CoordinationNoteItem) => {
    setKitchenModalConfig({
      isOpen: true,
      note,
      mode: 'ACKNOWLEDGE',
    });
  };

  const handleResolveClick = (note: CoordinationNoteItem) => {
    setKitchenModalConfig({
      isOpen: true,
      note,
      mode: 'RESOLVE',
    });
  };

  const handleKitchenModalSubmit = async (responseNote: string) => {
    if (!kitchenModalConfig.note) return;
    const noteId = kitchenModalConfig.note.id;

    if (kitchenModalConfig.mode === 'ACKNOWLEDGE') {
      await coordinationApi.acknowledgeCoordinationNote(noteId, {
        acknowledgedBy: 'Bếp trưởng Trần Văn Bếp',
        kitchenResponse: responseNote || undefined,
      });
      showToast('Nhà bếp đã xác nhận tiếp nhận yêu cầu điều phối!');
    } else {
      await coordinationApi.resolveCoordinationNote(noteId, {
        resolutionNote: responseNote || undefined,
      });
      showToast('Đã đánh dấu hoàn thành điều phối suất ăn!');
    }
    await loadData(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-500 backdrop-blur-md'
                : 'bg-red-900/90 text-white border-red-500 backdrop-blur-md'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 1. Top Navigation Bar */}
      <AttendanceTopNav onSearch={(q) => handleFilterChange({ search: q })} />

      {/* 2. Sub Navigation Tabs: notes is ACTIVE */}
      <AttendanceSubTabs activeTab="notes" onTabChange={handleTabChange} />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 pb-32 space-y-6">
        {/* Header & Main Fast Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 px-3 py-0.5 rounded-full">
                Bàn Điều Phối Suất Ăn Giáo Viên (Teacher Console)
              </span>
              <span className="text-xs font-semibold text-slate-500">
                • {data?.selectedClass.name || 'Lớp Chồi 1'} ({data?.selectedClass.totalStudents || 26} học sinh)
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Quản lý Ghi chú Điều phối Bữa ăn Bán trú
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-2xl">
              Cầu nối dặn dò trực tiếp giữa Giáo viên chủ nhiệm trên lớp, Bếp bán trú, Cán bộ Dinh dưỡng &amp; Y tế học đường theo tiêu chuẩn Thông tư 28/2016/TT-BGDĐT.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Refresh Button */}
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 font-bold text-xs transition flex items-center gap-1.5"
              title="Làm mới dữ liệu từ PostgreSQL"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            {/* Create New Note Button */}
            <button
              onClick={() => {
                setNoteToEdit(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-teal-700/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Ghi Chú Điều Phối Mới</span>
            </button>
          </div>
        </div>

        {/* Notice Info Banner */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 border border-teal-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300 shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Hệ thống Đồng bộ Realtime Đến Màn hình Bếp (KDS) &amp; Phiếu Tiếp Phẩm
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Mọi ghi chú điều chỉnh suất ăn (cháo bệnh, đổi món dị ứng, cắt suất đón sớm) lập trước <strong>08h45</strong> sáng được tự động hạch toán vào định lượng kho và khay ăn chia lớp.
              </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-teal-300 bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-700/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Kết nối Bếp: Bếp trưởng Trần Văn Bếp
          </div>
        </div>

        {/* 4. KPI Strip */}
        <CoordinationKPIStrip
          summary={
            data?.summary || {
              totalNotes: 0,
              urgentCount: 0,
              highCount: 0,
              pendingCount: 0,
              acknowledgedCount: 0,
              resolvedCount: 0,
            }
          }
          filterDate={data?.filterDate || new Date().toISOString().split('T')[0]}
        />

        {/* 5. Filter Toolbar */}
        <CoordinationFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          availableClasses={data?.availableClasses || []}
        />

        {/* 6. Notes List */}
        <CoordinationNotesList
          notes={data?.notes || []}
          isLoading={isLoading}
          onEditNote={(note) => {
            setNoteToEdit(note);
            setIsCreateModalOpen(true);
          }}
          onDeleteNote={handleDeleteNote}
          onAcknowledgeNote={handleAcknowledgeClick}
          onResolveNote={handleResolveClick}
        />
      </main>

      {/* Modals */}
      <CreateEditCoordinationNoteModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNoteToEdit(null);
        }}
        noteToEdit={noteToEdit}
        selectedClassId={data?.selectedClass.id || ''}
        availableClasses={data?.availableClasses || []}
        availableChildren={data?.availableChildren || []}
        onSave={handleSaveNote}
      />

      <KitchenResponseModal
        isOpen={kitchenModalConfig.isOpen}
        onClose={() => setKitchenModalConfig((prev) => ({ ...prev, isOpen: false }))}
        note={kitchenModalConfig.note}
        mode={kitchenModalConfig.mode}
        onSubmit={handleKitchenModalSubmit}
      />
    </div>
  );
};
