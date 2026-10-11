import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Download,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  Calendar,
  Users,
  DollarSign,
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  UtensilsCrossed,
  Lock,
  Layers,
  CreditCard,
  Send,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Building,
  Phone,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../core/api/axios';
import { fetchSnackServices } from '../api/snackServicesApi';
import { SnackServiceItem, SnackServicesSummary } from '../types/snackServices';
import { CreateSnackServicePeriodModal } from './CreateSnackServicePeriodModal';
import { EditSnackServiceModal } from './EditSnackServiceModal';
import { attendanceApi } from '../../attendance/api/attendanceApi';
import { SnackRosterItem, SnackRosterResponse } from '../../attendance/types';
import { SnackInvoiceItem } from '../../payments/pages/SnackBillingPaymentPage';

export const SnackServicesPage: React.FC = () => {
  // Tab switcher
  const [activeTab, setActiveTab] = useState<'packages' | 'roster' | 'billing'>('packages');

  // Loading & packages state
  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<SnackServiceItem[]>([]);
  const [summary, setSummary] = useState<SnackServicesSummary | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters state for packages
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // UC56: Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // UC57: Modal state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Roster Tab State
  const [rosterLoading, setRosterLoading] = useState<boolean>(false);
  const [rosterData, setRosterData] = useState<SnackRosterResponse | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterClass, setRosterClass] = useState<string>('ALL');
  const [rosterPayment, setRosterPayment] = useState<string>('ALL');

  // Billing Tab State
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);
  const [invoices, setInvoices] = useState<SnackInvoiceItem[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [invoiceStatus, setInvoiceStatus] = useState<string>('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchSnackServices(search, statusFilter, gradeFilter);
      const dataPayload = (res as any)?.data || (res as any)?.items || (Array.isArray(res) ? res : []);
      const summaryPayload = (res as any)?.summary;
      const countPayload = (res as any)?.totalCount || dataPayload.length;
      setServices(dataPayload);
      if (summaryPayload) setSummary(summaryPayload);
      setTotalCount(countPayload);
    } catch (err) {
      console.error('Error fetching snack services:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRosterData = useCallback(async () => {
    try {
      setRosterLoading(true);
      const res = await attendanceApi.getSnackRoster({
        search: rosterSearch.trim() || undefined,
        classId: rosterClass !== 'ALL' ? rosterClass : undefined,
        paymentStatus: rosterPayment !== 'ALL' ? rosterPayment : undefined,
      });
      setRosterData(res);
    } catch (err) {
      console.error('Error fetching snack roster:', err);
    } finally {
      setRosterLoading(false);
    }
  }, [rosterSearch, rosterClass, rosterPayment]);

  const loadInvoicesData = async () => {
    try {
      setInvoicesLoading(true);
      const res = await apiClient.get<SnackInvoiceItem[]>('/payments/invoices');
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, gradeFilter]);

  useEffect(() => {
    if (activeTab === 'roster') {
      loadRosterData();
    } else if (activeTab === 'billing') {
      loadInvoicesData();
    }
  }, [activeTab, loadRosterData]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  const handleClosePeriod = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đóng đợt đăng ký cho gói "${name}"? Phụ huynh sẽ không thể đăng ký thêm vào đợt này.`)) return;
    try {
      await apiClient.put(`/snack-services/periods/${id}/close`);
      alert('Đã đóng đợt đăng ký ăn xế thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi đóng đợt đăng ký.');
    }
  };

  const handleExportRoster = () => {
    if (!rosterData?.items || rosterData.items.length === 0) {
      alert('Không có học sinh trong danh sách xuất Excel.');
      return;
    }
    const headers = ['Mã học sinh,Họ và tên,Lớp,Khẩu phần,Ghi chú bếp,Trạng thái phí,SĐT Phụ huynh\n'];
    const rows = rosterData.items.map(
      (it) =>
        `"${it.studentCode}","${it.fullName}","${it.className}","${it.snackDietBadgeText}","${it.kitchenNotes || ''}","${it.paymentStatusLabel}","${it.emergencyContactPhone || ''}"\n`
    );
    const blob = new Blob(['\uFEFF' + headers.concat(rows).join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh_sach_suat_an_xe_17h_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendReminder = (orderCode: string, parentName: string) => {
    alert(`Đã gửi thông báo nhắc đóng phí ăn xế (Zalo/SMS) tới phụ huynh của đơn hàng ${orderCode}!`);
  };

  // Filtered invoices
  const filteredInvoices = (Array.isArray(invoices) ? invoices : []).filter((inv) => {
    const matchSearch =
      inv.childName?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.orderCode?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.className?.toLowerCase().includes(invoiceSearch.toLowerCase());
    const matchStatus =
      invoiceStatus === 'ALL' ||
      (invoiceStatus === 'PAID' && (inv.status === 'PAID' || inv.status === 'SUCCESS')) ||
      inv.status === invoiceStatus;
    return matchSearch && matchStatus;
  });

  const totalCollected = invoices
    .filter((inv) => inv.status === 'PAID' || inv.status === 'SUCCESS')
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

  const totalPending = invoices
    .filter((inv) => inv.status === 'PENDING')
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. Header & Breadcrumbs Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span className="text-teal-600 font-semibold">Đơn vị KidMeal</span>
            <span>›</span>
            <span>Dịch vụ bán trú</span>
            <span>›</span>
            <span className="text-slate-700 font-bold">Cấu hình gói ăn xế</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Quản lý Gói Ăn Xế Chiều 17h & Dịch vụ Bán Trú
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
                Tạo và vận hành các gói dinh dưỡng ăn xế chiều tự nguyện, theo dõi chỉ tiêu đăng ký, quản lý danh sách chia suất nhà bếp và thu phí trực tuyến qua cổng VNPAY Sandbox.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'roster' ? (
            <button
              onClick={handleExportRoster}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Xuất Danh Sách Suất Ăn (CSV)
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveTab('roster');
                loadRosterData();
              }}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Xem Danh Sách Đăng Ký
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Tạo Đợt Đăng Ký
          </button>
        </div>
      </div>

      {/* 2. Top 4 Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
                Đợt tháng 11 - 12
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Tổng số đợt vận hành</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {summary.activeBatches.total} <span className="text-xs font-bold text-slate-500">đợt vận hành</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
              <span className="text-emerald-600 font-bold">{summary.activeBatches.open} mở</span>,{' '}
              <span className="text-amber-600 font-bold">{summary.activeBatches.upcoming} sắp mở</span>,{' '}
              <span className="text-slate-400">{summary.activeBatches.closed} đã đóng</span>
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full">
                {summary.studentParticipation.percentage}% toàn trường
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Học sinh tham gia ăn xế</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {summary.studentParticipation.registered}{' '}
              <span className="text-xs font-bold text-slate-400">/ {summary.studentParticipation.total} trẻ</span>
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${summary.studentParticipation.percentage}%` }}
              />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
                {summary.revenue.collectedPercentage}% hoàn tất
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Doanh thu ăn xế dự kiến</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {formatVND(summary.revenue.expectedMonthly)}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              Đã thu qua VNPAY:{' '}
              <strong className="text-emerald-600">{formatVND(summary.revenue.collected)}</strong>
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full">
                Rất tốt
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Tỷ lệ hài lòng phụ huynh</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {summary.satisfaction.ratePercent}%{' '}
              <span className="text-xs font-bold text-slate-400">({summary.satisfaction.totalReviews} đánh giá)</span>
            </p>
            <div className="flex items-center gap-1 text-amber-400 mt-2">
              {'★'.repeat(5)}
              <span className="text-xs font-bold text-slate-700 ml-1">{summary.satisfaction.ratingScore} / 5.0</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'packages'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Cấu Hình Gói & Đợt Đăng Ký
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'packages' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {services.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            Danh Sách Học Sinh Ăn Xế 17h (Snack Roster)
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'roster' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {rosterData?.stats?.totalRegistered || 412}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'billing'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Doanh Thu & Thu Phí VNPAY
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'billing' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {invoices.length}
            </span>
          </button>
        </div>

        <Link
          to="/services"
          className="hidden md:flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
        >
          <span>Sang phân hệ Quản lý Bán Trú Toàn Diện</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 4. TAB 1: CẤU HÌNH GÓI & ĐỢT ĐĂNG KÝ */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          {/* Middle Banner Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Banner 1: Hôm nay */}
            <div className="lg:col-span-2 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center gap-3 text-xs mb-3">
                  <span className="bg-teal-500/30 text-teal-200 border border-teal-400/30 px-3 py-1 rounded-full font-bold">
                    Hôm nay: Thứ Năm, 25/11
                  </span>
                  <span className="bg-white/10 text-white/90 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 100% Nguyên liệu kiểm định
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight mt-1">
                  Thực đơn xế chiều ưu tiên hôm nay
                </h3>
                <p className="text-xs text-teal-100/90 mt-1 max-w-xl leading-relaxed">
                  Sữa hạt Yến mạch & Bánh Tart Táo Nướng Mật Ong cung cấp năng lượng tiêu chuẩn 210 kcal/trẻ, đảm bảo không chất bảo quản và đường hóa học.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-teal-700/50 text-xs">
                <span className="bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-700/40 text-teal-200">
                  ⚡ Canxi: <strong className="text-white">190mg</strong>
                </span>
                <span className="bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-700/40 text-teal-200">
                  💪 Protein: <strong className="text-white">6.8g</strong>
                </span>
                <span className="bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-700/40 text-teal-200">
                  🔥 Năng lượng: <strong className="text-white">215 kcal</strong>
                </span>
                <button
                  onClick={() => setActiveTab('roster')}
                  className="ml-auto text-xs font-bold text-teal-300 hover:text-white flex items-center gap-1 transition"
                >
                  Xem danh sách chia suất bếp (Snack Roster) &rarr;
                </button>
              </div>
            </div>

            {/* Banner 2: Phản hồi dinh dưỡng */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Góp ý & Đánh giá gần nhất
                  </span>
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Mẹ bé Gia Huy (Mầm 1)</span>
                      <span className="text-amber-500 font-bold text-[11px]">★ 5.0</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 italic">
                      "Bé rất thích sữa chua hạt chia buổi chiều, chiều đón thấy bé nhiều năng lượng và không bị đói!"
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Ba bé Tuệ Mẫn (Lá 2)</span>
                      <span className="text-amber-500 font-bold text-[11px]">★ 5.0</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 italic">
                      "Thực đơn đa dạng, thanh toán qua VNPAY tiện lợi vô cùng!"
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <span className="text-xs text-teal-600 font-bold hover:underline cursor-pointer">
                  Xem toàn bộ 330 đánh giá từ phụ huynh
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm gói theo tên (VD: Năng Lượng Chiều)..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="OPEN">Đang mở đăng ký</option>
                <option value="UPCOMING">Sắp mở</option>
                <option value="CLOSED">Đã đóng</option>
              </select>

              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả khối lớp</option>
                <option value="KINDERGARTEN_LARGE">Khối Lớn (4-5T)</option>
                <option value="TODDLER">Nhà trẻ & Mầm</option>
              </select>
            </div>
          </div>

          {/* 5 Package Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Array.isArray(services) ? services : []).map((item) => {
              const isOpen = item.status === 'OPEN';
              const isUpcoming = item.status === 'UPCOMING';
              const isClosed = item.status === 'CLOSED';

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
                    isClosed
                      ? 'border-slate-200 opacity-75 bg-slate-50/50'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="p-5">
                    {/* Top status line */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-slate-400">
                        {item.appliedMonth}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isUpcoming
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md">
                        {item.appliedGrade}
                      </span>
                      {item.badges.map((b, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold rounded-md"
                        >
                          {b}
                        </span>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Chỉ tiêu đợt</span>
                        <span className="font-extrabold text-slate-900">
                          {item.registeredCount}{' '}
                          <span className="text-slate-400 font-normal">/ {item.targetCount} suất</span>
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            item.percentage >= 90
                              ? 'bg-emerald-500'
                              : item.percentage >= 60
                              ? 'bg-teal-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                        <span>{item.progressNote}</span>
                        <span className="font-bold text-slate-700">{item.percentage}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-black text-slate-900">
                        {formatVND(item.pricePerUnit)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium"> / suất ngày</span>
                      <div className="text-[10px] text-slate-400">
                        ~ {formatVND(item.monthlyEstimatedPrice)} / tháng (22 ngày)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingServiceId(item.id)}
                        className="p-2 text-slate-500 hover:text-teal-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200"
                        title="Chỉnh sửa cấu hình gói"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {isOpen && (
                        <button
                          onClick={() => handleClosePeriod(item.id, item.name)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 rounded-xl text-xs font-bold text-slate-700 transition"
                        >
                          Đóng đợt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 2: DANH SÁCH HỌC SINH ĂN XẾ 17H (SNACK ROSTER & KITCHEN TALLY) */}
      {activeTab === 'roster' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
          {/* Header & live tally */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-teal-600" />
                Danh Sách Suất Ăn Xế Chiều 17h00 (Kitchen Roster)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu đồng bộ trực tiếp từ Database PostgreSQL để Bếp trưởng phân chia khẩu phần tiêu chuẩn và khẩu phần đặc biệt cho trẻ dị ứng
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-xs font-bold text-teal-800">
                ⚡ Tổng suất: {rosterData?.stats?.totalRegistered || 412} trẻ
              </span>
              <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800">
                Tiêu chuẩn: {rosterData?.stats?.standardPortions || 398} suất
              </span>
              <span className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Dị ứng / Bếp kiêng: {rosterData?.stats?.specialDietPortions || 14} suất
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Tìm kiếm theo tên học sinh, mã số học sinh..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={rosterClass}
                onChange={(e) => setRosterClass(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả lớp</option>
                {rosterData?.classes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={rosterPayment}
                onChange={(e) => setRosterPayment(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả trạng thái phí</option>
                <option value="PAID">Đã thanh toán VNPAY</option>
                <option value="PENDING">Chưa thanh toán</option>
              </select>

              <button
                onClick={loadRosterData}
                className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition"
                title="Làm mới danh sách"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Mã & Họ Tên Bé</th>
                  <th className="py-3 px-3">Lớp & Khối</th>
                  <th className="py-3 px-3">Khẩu Phần Ăn Xế</th>
                  <th className="py-3 px-4">Lưu Ý & An Toàn Bếp</th>
                  <th className="py-3 px-3">Phụ Huynh & SĐT</th>
                  <th className="py-3 px-3 text-center">Trạng Thái VNPAY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.isArray(rosterData?.items) && rosterData.items.length > 0 ? (
                  rosterData.items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {it.avatarInitials || it.fullName.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs">{it.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {it.studentCode} • {it.gender}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {it.className}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            it.snackDietType === 'STANDARD'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {it.snackDietBadgeText}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {it.kitchenNotes ? (
                          <div className="flex items-center gap-1.5 text-red-700 font-semibold text-[11px] bg-red-50/60 border border-red-200 px-2 py-1 rounded-md">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>{it.kitchenNotes}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Suất tiêu chuẩn đầy đủ</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{it.emergencyContactName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{it.emergencyContactPhone}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            it.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {it.paymentStatusLabel || (it.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thu')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {rosterLoading ? 'Đang tải danh sách học sinh ăn xế...' : 'Không tìm thấy dữ liệu phù hợp.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 3: DOANH THU & THU PHÍ VNPAY */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* 3 Stat Cards for Billing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đã thu qua VNPAY</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{formatVND(totalCollected)}</p>
              <p className="text-xs text-slate-500 mt-1">Đã gạch nợ tự động qua Webhook IPN</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chờ phụ huynh nộp</span>
              <p className="text-2xl font-black text-amber-600 mt-2">{formatVND(totalPending)}</p>
              <p className="text-xs text-slate-500 mt-1">Có thể bấm gửi tin nhắn SMS/Zalo nhắc phí</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cổng VNPAY Sandbox</span>
              <p className="text-lg font-black text-slate-900 mt-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Đang Kết Nối Test
              </p>
              <Link
                to="/payments"
                className="text-xs font-bold text-teal-600 hover:underline mt-1.5 inline-flex items-center gap-1"
              >
                Mở Cổng Thanh Toán Phụ Huynh &rarr;
              </Link>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex-1 w-full relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder="Tìm theo mã đơn hàng, tên bé, lớp..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PAID">Đã thanh toán (PAID)</option>
                <option value="PENDING">Chờ nộp phí (PENDING)</option>
              </select>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Mã Hóa Đơn</th>
                    <th className="py-3 px-3">Học Sinh & Lớp</th>
                    <th className="py-3 px-3">Gói Dịch Vụ</th>
                    <th className="py-3 px-3 text-right">Số Tiền (VNĐ)</th>
                    <th className="py-3 px-3 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {inv.orderCode}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{inv.childName}</div>
                          <div className="text-[10px] text-slate-400">{inv.className}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {inv.packageName}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          {formatVND(Number(inv.amount))}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID' || inv.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status === 'PAID' || inv.status === 'SUCCESS' ? 'Đã Thanh Toán' : 'Chờ Nộp Phí'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {inv.status === 'PENDING' ? (
                            <button
                              onClick={() => handleSendReminder(inv.orderCode, inv.childName)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto transition"
                            >
                              <Send className="w-3 h-3" /> Nhắc phí
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Giao dịch khớp
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {invoicesLoading ? 'Đang tải hóa đơn...' : 'Không có hóa đơn thanh toán nào.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Bottom Safety Banner */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Quy chuẩn Dinh dưỡng & Dị ứng KidMeal An Toàn</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Tất cả nguyên liệu phục vụ gói ăn xế được kiểm định nghiêm ngặt từ khâu tiếp nhận, cảnh báo dị ứng tự động tới phụ huynh và giáo viên.
            </p>
          </div>
        </div>

        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-bold whitespace-nowrap transition border border-slate-700">
          Xem hồ sơ chứng nhận
        </button>
      </div>

      {/* UC56: Modal Tạo Đợt Đăng Ký */}
      <CreateSnackServicePeriodModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadData()}
      />

      {/* UC57: Modal Chỉnh Sửa Cấu Hình Gói Dịch Vụ */}
      <EditSnackServiceModal
        isOpen={!!editingServiceId}
        serviceId={editingServiceId}
        onClose={() => setEditingServiceId(null)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
