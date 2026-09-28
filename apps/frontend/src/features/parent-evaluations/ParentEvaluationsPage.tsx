import React, { useState, useEffect, useCallback } from 'react';
import { EvaluationSidebar } from './components/EvaluationSidebar';
import { EvaluationHeader } from './components/EvaluationHeader';
import { EvaluationSummaryCards } from './components/EvaluationSummaryCards';
import { EvaluationFilterBar } from './components/EvaluationFilterBar';
import { EvaluationCard } from './components/EvaluationCard';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { SurveyConfigModal } from './components/SurveyConfigModal';
import { parentEvaluationApi } from './api/parentEvaluationApi';
import {
  ParentEvaluationItem,
  ParentEvaluationResponse,
  ParentEvaluationSummaryStats,
} from './types';
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';

export const ParentEvaluationsPage: React.FC = () => {
  // Filter States
  const [search, setSearch] = useState<string>('');
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [mealFilter, setMealFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(4);

  // Data & Loading States (Real PostgreSQL DB)
  const [data, setData] = useState<ParentEvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals & Toast State
  const [activePhoto, setActivePhoto] = useState<{ url: string; caption: string } | null>(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch real data from backend
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await parentEvaluationApi.getEvaluations({
        search: search.trim() || undefined,
        status: statusTab !== 'ALL' ? statusTab : undefined,
        rating: ratingFilter > 0 ? ratingFilter : undefined,
        mealType: mealFilter !== 'ALL' ? mealFilter : undefined,
        className: classFilter !== 'ALL' ? classFilter : undefined,
        sortBy,
        page: currentPage,
        limit: pageSize,
      });
      setData(res);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá từ database:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusTab, ratingFilter, mealFilter, classFilter, sortBy, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Respond to Parent Evaluation
  const handleRespond = async (id: string, responseContent: string, pushNotification: boolean) => {
    try {
      const updated = await parentEvaluationApi.respondToEvaluation(id, {
        responseContent,
        pushNotification,
        respondedByName: 'Hiệu trưởng Nguyễn Thu Thủy',
        status: 'RESPONDED',
        isDrafting: false,
      });

      // Update in local state
      setData((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.map((it) => (it.id === id ? updated : it));
        return {
          ...prev,
          items: newItems,
          summaryStats: {
            ...prev.summaryStats,
            pendingCount: Math.max(0, prev.summaryStats.pendingCount - 1),
            respondedCount: prev.summaryStats.respondedCount + 1,
          },
        };
      });

      setToastMessage('Đã gửi phản hồi thành công và thông báo tới phụ huynh qua ứng dụng KidMeal!');
      setTimeout(() => setToastMessage(null), 4000);
      fetchData();
    } catch (err) {
      console.error('Lỗi khi gửi phản hồi:', err);
      alert('Không thể lưu phản hồi. Vui lòng kiểm tra kết nối cơ sở dữ liệu!');
    }
  };

  // Export to Excel / CSV
  const handleExport = () => {
    if (!data?.items || data.items.length === 0) return;
    const headers = [
      'STT',
      'Phụ huynh',
      'Học sinh',
      'Lớp',
      'Bữa ăn',
      'Số sao',
      'Nội dung ý kiến',
      'Trạng thái',
      'Phản hồi từ BGH',
      'Thời gian',
    ];

    const rows = data.items.map((it, idx) => [
      idx + 1,
      `"${it.parentNameCustom || ''}"`,
      `"${it.childNameCustom || ''}"`,
      `"${it.classNameCustom || ''}"`,
      `"${it.mealTitle || it.mealType}"`,
      it.rating,
      `"${it.content.replace(/"/g, '""')}"`,
      `"${it.statusLabel || it.status}"`,
      `"${(it.responseContent || '').replace(/"/g, '""')}"`,
      `"${it.feedbackTimeLabel || it.feedbackDate}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Y_Kien_Phu_Huynh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper Pagination calculation
  const totalItems = data?.pagination.totalItems ?? 418;
  const totalPages = data?.pagination.totalPages ?? 105;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Render Page buttons
  const renderPaginationButtons = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }

    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition text-xs"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={idx}
              onClick={() => setCurrentPage(p)}
              className={`w-8 h-8 rounded-xl font-bold text-xs transition ${
                currentPage === p
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs">
              ...
            </span>
          ),
        )}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition text-xs"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50/60 font-sans">
      {/* SIDEBAR: KidMeal BGH */}
      <EvaluationSidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <EvaluationHeader
          onExport={handleExport}
          onOpenConfig={() => setIsSurveyModalOpen(true)}
        />

        {/* 4 Summary KPI Cards */}
        <EvaluationSummaryCards stats={data?.summaryStats} />

        {/* Filter Bar */}
        <EvaluationFilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          statusTab={statusTab}
          onStatusTabChange={(tab) => {
            setStatusTab(tab);
            setCurrentPage(1);
          }}
          ratingFilter={ratingFilter}
          onRatingChange={(r) => {
            setRatingFilter(r);
            setCurrentPage(1);
          }}
          mealFilter={mealFilter}
          onMealChange={(m) => {
            setMealFilter(m);
            setCurrentPage(1);
          }}
          classFilter={classFilter}
          onClassChange={(c) => {
            setClassFilter(c);
            setCurrentPage(1);
          }}
          sortBy={sortBy}
          onSortByChange={(s) => {
            setSortBy(s);
            setCurrentPage(1);
          }}
          stats={data?.summaryStats}
        />

        {/* Evaluation Cards List */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              Đang tải danh sách ý kiến phụ huynh từ cơ sở dữ liệu...
            </p>
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <p className="font-bold text-sm text-slate-700">Không tìm thấy đánh giá nào phù hợp với bộ lọc</p>
            <p className="text-xs text-slate-400">Vui lòng điều chỉnh tiêu chí tìm kiếm hoặc thiết lập lại bộ lọc.</p>
            <button
              onClick={() => {
                setSearch('');
                setStatusTab('ALL');
                setRatingFilter(0);
                setMealFilter('ALL');
                setClassFilter('ALL');
                setSortBy('NEWEST');
                setCurrentPage(1);
              }}
              className="mt-3 px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold rounded-xl text-xs transition"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.items.map((item) => (
              <EvaluationCard
                key={item.id}
                item={item}
                onRespond={handleRespond}
                onPhotoClick={(ph) => setActivePhoto(ph)}
              />
            ))}
          </div>
        )}

        {/* Pagination Section */}
        {data && data.items.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
            <div>
              Đang hiển thị{' '}
              <span className="font-bold text-slate-800">
                {startItem} - {endItem}
              </span>{' '}
              trong tổng số{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> đánh giá của Phụ huynh
            </div>

            {renderPaginationButtons()}
          </div>
        )}
      </main>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!activePhoto}
        photo={activePhoto}
        onClose={() => setActivePhoto(null)}
      />

      {/* Survey Config Modal */}
      <SurveyConfigModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slideUp text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
