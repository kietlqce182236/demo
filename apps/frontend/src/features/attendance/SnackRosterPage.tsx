import React, { useState, useEffect, useCallback } from 'react';
import { SnackRosterTopNav } from './components/SnackRosterTopNav';
import { SnackRosterHeader } from './components/SnackRosterHeader';
import { SnackRosterSummaryCards } from './components/SnackRosterSummaryCards';
import { SnackRosterFilterBar } from './components/SnackRosterFilterBar';
import { SnackRosterNoticeBanner } from './components/SnackRosterNoticeBanner';
import { SnackRosterTable } from './components/SnackRosterTable';
import { SnackRosterFooter } from './components/SnackRosterFooter';
import { SnackRosterDetailModal } from './components/SnackRosterDetailModal';
import { attendanceApi } from './api/attendanceApi';
import { SnackRosterResponse, SnackRosterItem } from './types';

export const SnackRosterPage: React.FC = () => {
  // Filter States
  const [search, setSearch] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('ALL');
  const [classId, setClassId] = useState<string>('ALL');
  const [date, setDate] = useState<string>('2026-09-25');
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  // Data & Loading States (Real Database Data)
  const [rosterData, setRosterData] = useState<SnackRosterResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<SnackRosterItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Fetch real data from PostgreSQL backend
  const fetchRosterData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await attendanceApi.getSnackRoster({
        search: search.trim() || undefined,
        gradeLevel: gradeLevel !== 'ALL' ? gradeLevel : undefined,
        classId: classId !== 'ALL' ? classId : undefined,
        date,
        paymentStatus: paymentStatus !== 'ALL' ? paymentStatus : undefined,
        page: currentPage,
        limit: pageSize,
      });
      setRosterData(res);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Snack Service Roster từ DB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, gradeLevel, classId, date, paymentStatus, currentPage, pageSize]);

  // Load data on mount and whenever filters/page change
  useEffect(() => {
    fetchRosterData();
  }, [fetchRosterData]);

  // Handle Apply Filter
  const handleApplyFilter = () => {
    setCurrentPage(1);
    fetchRosterData();
  };

  // Handle Reset Filter
  const handleResetFilter = () => {
    setSearch('');
    setGradeLevel('ALL');
    setClassId('ALL');
    setDate('2026-09-25');
    setPaymentStatus('PAID');
    setCurrentPage(1);
    setPageSize(8);
  };

  // Handle View Detail
  const handleViewDetail = (item: SnackRosterItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  // Export to CSV
  const handleExport = () => {
    if (!rosterData?.items || rosterData.items.length === 0) return;
    const headers = [
      'Mã học sinh',
      'Họ và tên',
      'Ngày sinh',
      'Lớp',
      'Khối',
      'Trạng thái phí',
      'Suất ăn xế',
      'Ghi chú nhà bếp',
    ];

    const rows = rosterData.items.map((it) => [
      `"${it.studentCode}"`,
      `"${it.fullName}"`,
      `"${it.formattedDob}"`,
      `"${it.className}"`,
      `"${it.blockName}"`,
      `"${it.paymentStatusLabel}"`,
      `"${it.snackDietBadgeText}"`,
      `"${it.kitchenNotes.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_sach_hoc_sinh_an_xe_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Roster
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* 1. Header & Secondary Navigation */}
      <SnackRosterTopNav
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 space-y-5">
        {/* Page Title & Breadcrumb */}
        <SnackRosterHeader onExport={handleExport} onPrint={handlePrint} />

        {/* 4 Summary Cards */}
        <SnackRosterSummaryCards
          stats={rosterData?.stats}
          isLoading={isLoading}
        />

        {/* Filter Controls Bar */}
        <SnackRosterFilterBar
          search={search}
          onSearchChange={setSearch}
          gradeLevel={gradeLevel}
          onGradeLevelChange={(val) => {
            setGradeLevel(val);
            setCurrentPage(1);
          }}
          classId={classId}
          onClassIdChange={(val) => {
            setClassId(val);
            setCurrentPage(1);
          }}
          classes={rosterData?.classes || []}
          date={date}
          onDateChange={setDate}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={(val) => {
            setPaymentStatus(val);
            setCurrentPage(1);
          }}
          onApplyFilter={handleApplyFilter}
          onResetFilter={handleResetFilter}
        />

        {/* Yellow Notice Banner for Afternoon Shift */}
        <SnackRosterNoticeBanner
          timeWindow={rosterData?.bannerNotice?.timeWindow || '14:15 - 14:45'}
          specialCount={rosterData?.stats?.specialDietPortions ?? 8}
        />

        {/* Main Service Roster Table */}
        <SnackRosterTable
          items={rosterData?.items || []}
          isLoading={isLoading}
          totalItems={rosterData?.pagination?.totalItems ?? 318}
          currentPage={currentPage}
          totalPages={rosterData?.pagination?.totalPages ?? 40}
          pageSize={pageSize}
          startIndex={rosterData?.pagination?.startIndex ?? 1}
          endIndex={rosterData?.pagination?.endIndex ?? 8}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          onViewDetail={handleViewDetail}
        />

        {/* Footer */}
        <SnackRosterFooter />
      </main>

      {/* Detail Modal */}
      <SnackRosterDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        item={selectedItem}
      />
    </div>
  );
};
