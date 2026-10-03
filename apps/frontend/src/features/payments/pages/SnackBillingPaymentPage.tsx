import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Plus,
  Search,
  Sparkles,
  QrCode,
  ShieldCheck,
  Info,
  Calendar,
  User,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../../../core/api/axios';
import { VnpayCheckoutButton } from '../components/VnpayCheckoutButton';

export interface SnackInvoiceItem {
  id: string;
  orderCode: string;
  childName: string;
  className: string;
  packageName: string;
  amount: number;
  periodText: string;
  status: 'PENDING' | 'PAID' | 'SUCCESS' | 'FAILED';
  paidAt?: string;
  vnpTransactionNo?: string;
}

export const SnackBillingPaymentPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SnackInvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showSandboxGuide, setShowSandboxGuide] = useState(true);

  // New registration modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReg, setNewReg] = useState({
    childName: '',
    className: 'Lớp Mầm 1',
    packageName: 'Gói Năng Lượng Chiều 17h',
    amount: 550000,
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<SnackInvoiceItem[]>('/payments/invoices');
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách hóa đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReg.childName) return;

    setSubmitting(true);
    try {
      await apiClient.post('/payments/invoices', newReg);
      setIsModalOpen(false);
      setNewReg({
        childName: '',
        className: 'Lớp Mầm 1',
        packageName: 'Gói Năng Lượng Chiều 17h',
        amount: 550000,
      });
      await fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo hóa đơn.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.childName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.orderCode?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PAID' && (inv.status === 'PAID' || inv.status === 'SUCCESS')) ||
      inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = invoices
    .filter((i) => i.status === 'PAID' || i.status === 'SUCCESS')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPending = invoices
    .filter((i) => i.status === 'PENDING')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ─── 1. TOP HEADER BANNER ─── */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Cổng Thanh Toán Trực Tuyến VNPAY
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Dịch Vụ Ăn Xế 17:00 & Thanh Toán Bán Trú
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Tích hợp trực tiếp cổng VNPAY Sandbox HMAC-SHA512. Dữ liệu hóa đơn và giao dịch được lưu trữ và truy vấn thời gian thực từ cơ sở dữ liệu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchInvoices}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-2 text-xs font-bold"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-blue-400 hover:bg-blue-300 text-blue-950 font-bold text-xs shadow-lg transition flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Đăng Ký Ăn Xế Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. VNPAY SANDBOX TEST CARD CALLOUT ─── */}
      {showSandboxGuide && (
        <div className="p-4 rounded-3xl bg-blue-50/80 border border-blue-200 text-xs space-y-2 text-blue-900 shadow-sm relative">
          <button
            onClick={() => setShowSandboxGuide(false)}
            className="absolute right-4 top-4 text-blue-400 hover:text-blue-600 font-bold"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Thông Tin Thẻ Thử Nghiệm VNPAY Sandbox (Môi Trường Test)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 font-mono text-[11px]">
            <div className="bg-white p-2 rounded-xl border border-blue-100">
              <span className="text-slate-400 block text-[10px] font-sans">Ngân hàng</span>
              <strong className="text-blue-950">NCB</strong>
            </div>
            <div className="bg-white p-2 rounded-xl border border-blue-100 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px] font-sans">Số thẻ test</span>
              <strong className="text-blue-950">9704198526191432198</strong>
            </div>
            <div className="bg-white p-2 rounded-xl border border-blue-100">
              <span className="text-slate-400 block text-[10px] font-sans">Tên chủ thẻ</span>
              <strong className="text-blue-950">NGUYEN VAN A</strong>
            </div>
            <div className="bg-white p-2 rounded-xl border border-blue-100">
              <span className="text-slate-400 block text-[10px] font-sans">Ngày phát hành</span>
              <strong className="text-blue-950">07/15</strong>
            </div>
            <div className="bg-white p-2 rounded-xl border border-blue-100">
              <span className="text-slate-400 block text-[10px] font-sans">Mã OTP</span>
              <strong className="text-emerald-700 font-black">123456</strong>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. STATS SUMMARY ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Đơn Đăng Ký</div>
          <div className="text-2xl font-black text-slate-900">{invoices.length} <span className="text-sm font-semibold text-slate-400">giao dịch</span></div>
          <div className="text-xs text-slate-400">Dịch vụ ăn xế chiều 17h</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã Thu (VNPAY)</div>
          <div className="text-2xl font-black text-emerald-700">
            {totalPaid.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-400">VNĐ</span>
          </div>
          <div className="text-xs text-emerald-600 font-semibold">Tự động kích hoạt suất ăn bếp</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Chờ Thanh Toán</div>
          <div className="text-2xl font-black text-amber-700">
            {totalPending.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-400">VNĐ</span>
          </div>
          <div className="text-xs text-amber-600 font-semibold">Chờ phụ huynh hoàn tất qua QR</div>
        </div>
      </div>

      {/* ─── 4. SEARCH & FILTER ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã đơn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-semibold"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PAID">Đã thanh toán (SUCCESS / PAID)</option>
          <option value="PENDING">Chờ thanh toán (PENDING)</option>
        </select>
      </div>

      {/* ─── 5. INVOICES TABLE ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Mã Đơn / Học Sinh</th>
                <th className="py-3.5 px-3">Gói Dịch Vụ</th>
                <th className="py-3.5 px-3">Kỳ Phí</th>
                <th className="py-3.5 px-3">Số Tiền</th>
                <th className="py-3.5 px-3">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác Thanh Toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Đang tải danh sách hóa đơn từ cơ sở dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'PAID' || inv.status === 'SUCCESS';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.childName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {inv.orderCode} • {inv.className}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        {inv.packageName}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-600">
                        {inv.periodText}
                      </td>
                      <td className="py-3.5 px-3 font-black text-slate-900">
                        {Number(inv.amount).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-3">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đã thanh toán {inv.vnpTransactionNo ? `(Mã: ${inv.vnpTransactionNo})` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Chờ thanh toán
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isPaid ? (
                          <VnpayCheckoutButton
                            invoiceId={inv.orderCode || inv.id}
                            amount={Number(inv.amount)}
                            orderInfo={`Thanh toán ăn xế ${inv.childName} ${inv.periodText}`}
                          />
                        ) : (
                          <span className="text-slate-400 font-semibold text-[11px]">
                            Hoàn tất {inv.paidAt ? `(${inv.paidAt})` : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chưa có hóa đơn ăn xế nào. Bấm "Tạo Đăng Ký Ăn Xế Mới" để tạo hóa đơn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 6. MODAL CREATE INVOICE ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Đăng Ký Suất Ăn Xế 17h Mới</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Bé Học Sinh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Bảo Nam"
                  value={newReg.childName}
                  onChange={(e) => setNewReg({ ...newReg, childName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lớp Học</label>
                <select
                  value={newReg.className}
                  onChange={(e) => setNewReg({ ...newReg, className: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  <option value="Lớp Mầm 1">Lớp Mầm 1 (3-4 tuổi)</option>
                  <option value="Lớp Chồi 2">Lớp Chồi 2 (4-5 tuổi)</option>
                  <option value="Lớp Lá 1">Lớp Lá 1 (5-6 tuổi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Gói Dịch Vụ</label>
                <select
                  value={newReg.packageName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const price = val.includes('30.000') ? 660000 : val.includes('20.000') ? 440000 : 550000;
                    setNewReg({ ...newReg, packageName: val, amount: price });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  <option value="Gói Năng Lượng Chiều 17h">Gói Năng Lượng Chiều 17h (25.000đ/ngày • 550.000đ/tháng)</option>
                  <option value="Gói Dinh Dưỡng Cao Cấp">Gói Dinh Dưỡng Cao Cấp (30.000đ/ngày • 660.000đ/tháng)</option>
                  <option value="Gói Tiêu Chuẩn Truyền Thống">Gói Tiêu Chuẩn Truyền Thống (20.000đ/ngày • 440.000đ/tháng)</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-900">Tổng tiền thanh toán VNPAY:</span>
                <span className="text-base font-black text-blue-800">
                  {newReg.amount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo Hóa Đơn Trực Tuyến'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
