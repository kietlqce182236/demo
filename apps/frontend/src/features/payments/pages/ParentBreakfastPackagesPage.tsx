import React, { useState, useEffect } from 'react';
import {
  Coffee,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  QrCode,
  Calendar,
  Baby,
  Utensils,
  X,
  ExternalLink,
  Zap,
  Info,
  BadgeCheck,
  Ban,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { apiClient } from '../../../core/api/axios';
import { ParentPortalTopNav } from '../../parent-evaluations/components/ParentPortalTopNav';

export interface BreakfastPackage {
  id: string;
  code: string;
  name: string;
  mealCount: number;
  daysValid: number;
  price: number;
  pricePerMeal: number;
  description: string;
  menuItems: string[];
  popular?: boolean;
  savingsText?: string;
}

export interface EligibilityStatus {
  studentId: number;
  isEligible: boolean;
  status: 'ELIGIBLE' | 'EXPIRED' | 'PENDING_PAYMENT' | 'NO_SUBSCRIPTION';
  activeSubscription: {
    id: number;
    packageName: string;
    mealCount: number;
    endDate: string;
    paidAt: string;
  } | null;
  pendingSubscription: {
    id: number;
    packageName: string;
    amount: number;
  } | null;
  message: string;
}

export interface SubscriptionHistoryItem {
  id: number;
  studentId: number;
  packageName: string;
  mealCount: number;
  amount: number;
  status: string;
  startDate?: string;
  endDate?: string;
  vnpayOrderId?: string;
  vnpayTransactionNo?: string;
  paidAt?: string;
  createdAt: string;
  student?: {
    fullName: string;
    studentCode: string;
    class?: { name: string };
  };
}

export const ParentBreakfastPackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<BreakfastPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(1);
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);

  // Checkout modal
  const [selectedPackage, setSelectedPackage] = useState<BreakfastPackage | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [activeSubscriptionId, setActiveSubscriptionId] = useState<number | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Payment tab inside modal
  const [paymentMethodTab, setPaymentMethodTab] = useState<'CARD' | 'QR' | 'EXTERNAL'>('CARD');
  const [cardNumber, setCardNumber] = useState<string>('9704198526191432198');
  const [cardHolder, setCardHolder] = useState<string>('NGUYEN VAN A');
  const [cardDate, setCardDate] = useState<string>('07/15');
  const [cardOtp, setCardOtp] = useState<string>('123456');

  // Load packages & students
  const loadData = async () => {
    try {
      setLoading(true);
      const [pkgRes, stuRes] = await Promise.all([
        apiClient.get('/payments/breakfast/packages'),
        apiClient.get('/children'),
      ]);

      setPackages(pkgRes.data?.data || pkgRes.data || []);
      const stuList = stuRes.data?.items || (Array.isArray(stuRes.data) ? stuRes.data : []);
      setStudents(stuList);

      if (stuList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stuList[0].id);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu gói ăn sáng:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load eligibility for selected student
  const loadEligibility = async (studentId: number) => {
    try {
      const res = await apiClient.get(`/payments/breakfast/status/${studentId}`);
      setEligibility(res.data?.data || res.data);
    } catch (err) {
      console.error('Lỗi kiểm tra quyền lợi ăn sáng:', err);
    }
  };

  // Load subscription history
  const loadHistory = async (studentId?: number) => {
    try {
      const res = await apiClient.get('/payments/breakfast/subscriptions', {
        params: studentId ? { studentId } : {},
      });
      setHistory(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử gói ăn sáng:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadEligibility(selectedStudentId);
      loadHistory(selectedStudentId);
    }
  }, [selectedStudentId]);

  const currentStudent = students.find((s) => Number(s.id) === Number(selectedStudentId)) || students[0];

  const handleSelectPackage = async (pkg: BreakfastPackage) => {
    setSelectedPackage(pkg);
    setCheckoutLoading(true);
    setCheckoutModalOpen(true);
    setPaymentMethodTab('CARD');
    try {
      // Create subscription in PENDING status
      const res = await apiClient.post('/payments/breakfast/subscribe', {
        studentId: Number(selectedStudentId),
        packageId: pkg.id,
      });
      const sub = res.data?.data || res.data;
      setActiveSubscriptionId(Number(sub.id || sub.subscriptionId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi khởi tạo gói ăn sáng.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // VNPAY redirect checkout (Open in new tab to preserve user state and prevent locking on code 71)
  const handleVnpayRedirect = async () => {
    if (!activeSubscriptionId) return;
    try {
      setCheckoutLoading(true);
      const res = await apiClient.post('/payments/breakfast/create-url', {
        subscriptionId: activeSubscriptionId,
      });
      const paymentUrl = res.data?.data?.paymentUrl || res.data?.paymentUrl;
      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
      } else {
        alert('Không nhận được URL thanh toán VNPAY');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo liên kết VNPAY.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Simulate payment (Sandbox immediate test)
  const handleSimulatePayment = async (customTxCode?: string) => {
    if (!activeSubscriptionId) return;
    try {
      setCheckoutLoading(true);
      const res = await apiClient.post('/payments/breakfast/simulate-pay', {
        subscriptionId: activeSubscriptionId,
        transactionCode: customTxCode || 'VNP_NCB_' + Date.now().toString().slice(-8),
      });
      const data = res.data?.data || res.data;
      setSuccessNotice(`Chúc mừng! Bạn đã hoàn tất thanh toán VNPAY cho gói "${data.packageName}". Suất ăn sáng dinh dưỡng của bé đã được kích hoạt ngay lập tức!`);
      setCheckoutModalOpen(false);
      // Reload eligibility & history
      await loadEligibility(selectedStudentId);
      await loadHistory(selectedStudentId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi xử lý thanh toán VNPAY.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Parent Portal */}
      <ParentPortalTopNav activeTab="snacks" />

      {/* Hero Banner Section */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 text-white py-10 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/60 border border-teal-500/40 text-teal-200 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Coffee className="w-3.5 h-3.5 text-amber-300" />
              Dịch Vụ Dinh Dưỡng Bữa Sáng (07:15 – 08:00)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Đăng Ký & Mua Gói Ăn Sáng Dinh Dưỡng Cho Bé
            </h1>
            <p className="text-teal-100 text-sm max-w-2xl leading-relaxed">
              Khởi đầu ngày mới tràn đầy năng lượng với thực đơn cháo súp hầm xương bổ dưỡng, phở gà ta mầm non và sữa hạt hữu cơ đạt chuẩn Bộ GD&ĐT. Thanh toán an toàn, minh bạch qua VNPAY QR.
            </p>
          </div>

          {/* Student Selector Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 w-full md:w-80 shadow-lg text-white">
            <span className="text-xs font-bold uppercase text-teal-200 tracking-wider flex items-center gap-1.5 mb-2">
              <Baby className="w-4 h-4 text-amber-300" /> Chọn học sinh nhận suất ăn
            </span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              className="w-full bg-teal-950/80 border border-teal-400/50 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {students.map((stu) => (
                <option key={stu.id} value={stu.id} className="bg-slate-900 text-white font-medium">
                  {stu.fullName} ({stu.studentCode || `HS-${stu.id}`}) — {stu.class?.name || 'Mầm'}
                </option>
              ))}
            </select>
            {currentStudent && (
              <div className="mt-2.5 text-xs text-teal-200 flex items-center justify-between pt-2 border-t border-white/10">
                <span>Lớp: <strong className="text-white">{currentStudent.class?.name || 'Mầm 1'}</strong></span>
                <span>Mã số: <strong className="text-amber-300">{currentStudent.studentCode || `HS-${currentStudent.id}`}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Success Alert */}
        {successNotice && (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 text-emerald-900 flex items-start justify-between gap-3 shadow-md animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0 mt-0.5">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm">Thanh Toán Gói Ăn Sáng Thành Công!</h4>
                <p className="text-xs text-emerald-800 mt-0.5 font-medium">{successNotice}</p>
              </div>
            </div>
            <button
              onClick={() => setSuccessNotice(null)}
              className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. STATUS & ELIGIBILITY BANNER (ĐIỀU KIỆN CÓ/KHÔNG CÓ SUẤT ĂN SÁNG) */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                Trạng thái quyền lợi hôm nay
              </span>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
                Tình Trạng Suất Ăn Sáng Của Bé {currentStudent?.fullName}
              </h2>
            </div>
            <button
              onClick={() => {
                loadEligibility(selectedStudentId);
                loadHistory(selectedStudentId);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition border border-teal-200 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Kiểm tra lại
            </button>
          </div>

          {eligibility?.isEligible ? (
            /* TRƯỜNG HỢP 1: ĐÃ ĐÓNG TIỀN — ĐƯỢC CUNG CẤP ĐỒ ĂN SÁNG */
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-50 to-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white uppercase tracking-wider">
                      Đã Kích Hoạt Suất Ăn Sáng
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      Gói: {eligibility.activeSubscription?.packageName}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Học sinh ĐÃ ĐÓNG TIỀN và ĐƯỢC CUNG CẤP ĐỒ ĂN SÁNG nóng hổi tại trường (07:15 – 08:00) mỗi ngày.
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span>Hạn sử dụng: <strong>{eligibility.activeSubscription?.endDate ? new Date(eligibility.activeSubscription.endDate).toLocaleDateString('vi-VN') : '30 ngày'}</strong></span>
                    <span>•</span>
                    <span>Số bữa gói: <strong>{eligibility.activeSubscription?.mealCount} bữa</strong></span>
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 self-end md:self-auto">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Bếp & GVCN</span>
                  <span className="text-xs font-black text-emerald-700">Đã chốt suất ăn</span>
                </div>
                <span className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5">
                  <Utensils className="w-4 h-4" /> Suất Ăn Sẵn Sàng
                </span>
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP 2: CHƯA ĐÓNG TIỀN — KHÔNG CÓ ĐỒ ĂN SÁNG */
            <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-400 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Ban className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white uppercase tracking-wider">
                      Chưa Đóng Tiền — Chưa Cung Cấp Đồ Ăn Sáng
                    </span>
                    <span className="text-xs font-bold text-rose-800">
                      Không có suất ăn sáng hôm nay
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Học sinh CHƯA MUA GÓI / CHƯA THANH TOÁN. Nhà bếp và giáo viên sẽ không chuẩn bị suất ăn sáng cho bé.
                  </p>
                  <p className="text-xs text-rose-700 font-medium">
                    Phụ huynh vui lòng chọn gói ăn sáng bên dưới và thanh toán qua VNPAY để kích hoạt suất ăn ngay lập tức cho con.
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-end md:self-auto">
                <a
                  href="#pricing-packages"
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Mua Gói Ngay Bằng VNPAY
                </a>
              </div>
            </div>
          )}
        </section>

        {/* 2. CHỌN GÓI ĂN SÁNG (PRICING PACKAGES) */}
        <section id="pricing-packages" className="space-y-4">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <span className="text-xs font-extrabold text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Bảng Giá Tiết Kiệm & Dinh Dưỡng
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Lựa Chọn Gói Ăn Sáng Phù Hợp Cho Bé
            </h2>
            <p className="text-xs text-slate-500">
              Thực đơn 60 món ăn sáng dinh dưỡng được chuyên gia kiểm duyệt, chế biến tại chỗ từ 05:30 sáng, đảm bảo nóng hổi và an toàn vệ sinh 100%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {packages.map((pkg) => {
              const isPopular = pkg.popular;
              return (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-3xl p-6 transition-all duration-300 relative flex flex-col justify-between ${
                    isPopular
                      ? 'border-2 border-teal-600 shadow-xl ring-4 ring-teal-600/10 scale-102 z-10'
                      : 'border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-300'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3.5 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" /> Phổ Biến Nhất ({pkg.savingsText})
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {pkg.mealCount} Bữa Sáng
                      </span>
                      <span className="text-xs font-bold text-teal-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Hạn {pkg.daysValid} ngày
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">
                          {formatVND(pkg.price).replace(' đ', '')}
                        </span>
                        <span className="text-sm font-extrabold text-slate-500">đ</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                        ~{formatVND(pkg.pricePerMeal)} / bữa ăn sáng
                      </span>
                    </div>

                    {/* Menu items sample */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Món ăn sáng tiêu biểu:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {pkg.menuItems.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => handleSelectPackage(pkg)}
                      className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                        isPopular
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-teal-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Đăng Ký & Đóng Tiền VNPAY
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. LỊCH SỬ MUA GÓI & NHẬT KÝ ĐÓNG TIỀN VNPAY */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-teal-600" />
                Lịch Sử Mua Gói & Nhật Ký Thanh Toán VNPAY Của Bé
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các gói ăn sáng đã đăng ký, mã giao dịch VNPAY và thời hạn sử dụng suất ăn
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200 self-start sm:self-auto">
              Tổng số lần đăng ký: {history.length}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">Mã Đơn / GD VNPAY</th>
                  <th className="py-3.5 px-3">Gói Dịch Vụ</th>
                  <th className="py-3.5 px-3 text-center">Số Bữa</th>
                  <th className="py-3.5 px-3 text-right">Số Tiền (VNĐ)</th>
                  <th className="py-3.5 px-3 text-center">Thời Hạn Suất Ăn</th>
                  <th className="py-3.5 px-3 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-center">Quyền Lợi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      Bé chưa có lịch sử mua gói ăn sáng. Vui lòng chọn gói ở trên để đăng ký.
                    </td>
                  </tr>
                ) : (
                  history.map((sub) => {
                    const isPaid = sub.status === 'PAID';
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-slate-900">{sub.vnpayOrderId || `BF-ORD-${sub.id}`}</div>
                          {sub.vnpayTransactionNo && (
                            <div className="text-[10px] text-teal-600 font-semibold">
                              VNP: {sub.vnpayTransactionNo}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{sub.packageName}</div>
                          <div className="text-[10px] text-slate-400">
                            Ngày tạo: {new Date(sub.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                          {sub.mealCount} bữa
                        </td>

                        <td className="py-3.5 px-3 text-right font-black text-slate-900">
                          {formatVND(Number(sub.amount))}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {sub.startDate && sub.endDate ? (
                            <div className="text-[11px] text-slate-700 font-semibold">
                              {new Date(sub.startDate).toLocaleDateString('vi-VN')} – {new Date(sub.endDate).toLocaleDateString('vi-VN')}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Kích hoạt khi thanh toán</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isPaid ? 'Đã Thanh Toán' : 'Chờ Thanh Toán'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Được Cung Cấp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                              <Ban className="w-3.5 h-3.5" /> Không Cung Cấp
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* CHECKOUT MODAL (VNPAY GATEWAY / SANDBOX IN-APP / QR) */}
      {checkoutModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center font-black text-xs shadow-md">
                  VNPAY
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 leading-tight">
                    Cổng Thanh Toán VNPAY
                  </h3>
                  <p className="text-xs text-slate-400">Đăng ký & thanh toán suất ăn sáng dinh dưỡng</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order details summary */}
            <div className="bg-slate-50 rounded-2xl p-3.5 space-y-1.5 border border-slate-200/80 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Học sinh thụ hưởng:</span>
                <strong className="text-slate-900">{currentStudent?.fullName} ({currentStudent?.studentCode})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói ăn sáng:</span>
                <strong className="text-slate-900">{selectedPackage.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số lượng suất ăn:</span>
                <strong className="text-slate-900">{selectedPackage.mealCount} bữa ({selectedPackage.daysValid} ngày)</strong>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-700">Tổng tiền cần thanh toán:</span>
                <strong className="font-black text-teal-700 text-base">{formatVND(selectedPackage.price)}</strong>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentMethodTab('CARD')}
                className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  paymentMethodTab === 'CARD'
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                Thẻ ATM NCB (Test)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethodTab('QR')}
                className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  paymentMethodTab === 'QR'
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                Quét VNPAY-QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethodTab('EXTERNAL')}
                className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  paymentMethodTab === 'EXTERNAL'
                    ? 'bg-white text-rose-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                Cổng Ngoài VNPAY
              </button>
            </div>

            {/* TAB 1: CARD ATM NCB */}
            {paymentMethodTab === 'CARD' && (
              <div className="space-y-3 animate-fade-in">
                {/* Visual ATM card */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
                  <div className="absolute right-3 top-3 opacity-20">
                    <CreditCard className="w-20 h-20" />
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black text-sm tracking-widest text-amber-300">NCB BANK</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                      VNPAY SANDBOX
                    </span>
                  </div>
                  <div className="font-mono text-base tracking-widest font-bold my-2 text-slate-100">
                    9704 1985 2619 1432 198
                  </div>
                  <div className="flex justify-between items-end text-[11px] text-slate-300 pt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Chủ thẻ</span>
                      <span className="font-bold uppercase tracking-wider text-white">NGUYEN VAN A</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Hạn thẻ</span>
                      <span className="font-bold text-white font-mono">07/15</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Mã OTP</span>
                      <span className="font-bold text-amber-300 font-mono">123456</span>
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Số thẻ ATM:</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tên chủ thẻ:</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày phát hành:</label>
                    <input
                      type="text"
                      value={cardDate}
                      onChange={(e) => setCardDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Mã xác thực OTP:</label>
                    <input
                      type="text"
                      value={cardOtp}
                      onChange={(e) => setCardOtp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-800 text-teal-700 font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment('VNP_NCB_' + Date.now().toString().slice(-8))}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {checkoutLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  )}
                  {checkoutLoading
                    ? 'Đang Xác Thực Bảo Mật VNPAY & Kích Hoạt...'
                    : `Xác Nhận Thanh Toán Thẻ NCB (${formatVND(selectedPackage.price)})`}
                </button>
              </div>
            )}

            {/* TAB 2: QR CODE */}
            {paymentMethodTab === 'QR' && (
              <div className="space-y-3 text-center animate-fade-in py-1">
                <div className="p-4 bg-slate-50 border-2 border-dashed border-teal-300 rounded-2xl inline-block shadow-sm">
                  <div className="w-44 h-44 mx-auto bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center relative">
                    <QrCode className="w-36 h-36 text-slate-800" />
                    <span className="absolute bottom-1 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                      VNPAY QR
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">
                    Mở Ứng Dụng Ngân Hàng Hoặc Ví VNPAY Để Quét Mã
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Số tiền: <strong className="text-teal-700">{formatVND(selectedPackage.price)}</strong> • Mã GD: <span className="font-mono">BF_{activeSubscriptionId || 'NEW'}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment('VNP_QR_' + Date.now().toString().slice(-8))}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {checkoutLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  )}
                  {checkoutLoading
                    ? 'Đang Đồng Bộ Kết Quả Quét Mã QR...'
                    : `Tôi Đã Quét Mã & Thanh Toán Thành Công`}
                </button>
              </div>
            )}

            {/* TAB 3: EXTERNAL GATEWAY */}
            {paymentMethodTab === 'EXTERNAL' && (
              <div className="space-y-3 animate-fade-in">
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Info className="w-4 h-4 shrink-0 text-amber-600" />
                    Giải Thích Về Cổng VNPAY Sandbox Bên Ngoài:
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-700">
                    Khi chuyển hướng sang máy chủ bên ngoài của VNPAY, nếu bạn thấy thông báo:
                    <br />
                    <strong className="text-rose-700">"Website này chưa được phê duyệt (Mã lỗi 71)"</strong>
                    <br />
                    Đó là do tài khoản VNPAY Sandbox yêu cầu xác thực tên miền merchant trực tiếp với kỹ thuật VNPAY (1900 555577 / hotrovnpay@vnpay.vn).
                  </p>
                  <p className="text-[11px] text-teal-800 font-bold bg-teal-50 p-2 rounded-lg border border-teal-200">
                    👉 Bạn chỉ cần chọn tab <strong className="text-teal-900">"Thẻ ATM NCB"</strong> hoặc <strong className="text-indigo-900">"Quét VNPAY-QR"</strong> ở trên để hoàn tất thanh toán trực tiếp và nhận suất ăn sáng cho bé ngay lập tức!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleVnpayRedirect}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Mở Cổng VNPAY.vn Bên Ngoài (Tab Mới)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
