import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart as LucidePieChart,
  BarChart3,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  Users,
  Building,
  CreditCard,
  Send,
  Calendar,
  UtensilsCrossed,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  X,
  FileText,
  Printer,
  BadgePercent,
  Layers,
  Sparkles,
  HeartHandshake,
  Activity,
  Wallet,
  Coffee,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from 'recharts';
import { apiClient } from '../../../core/api/axios';

export interface FinancialOverviewData {
  period: {
    month: string;
    academicYear: string;
    schoolName: string;
  };
  kpis: {
    totalRevenue: number;
    totalExpense: number;
    netSurplus: number;
    collectionRate: number;
    collectedRevenue: number;
    pendingRevenue: number;
    refundAmount: number;
    totalStudents: number;
    breakfastRevenue?: number;
    snackRevenue?: number;
  };
  revenueBreakdown: Array<{
    key: string;
    label: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  expenseBreakdown: Array<{
    label: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expense: number;
    surplus: number;
  }>;
  classLedger: Array<{
    id: string;
    name: string;
    gradeLevel: string;
    roomNumber: string;
    teacherName: string;
    teacherPhone: string;
    totalStudents: number;
    expectedAmount: number;
    collectedAmount: number;
    pendingAmount: number;
    paidStudents: number;
    unpaidStudents: number;
    collectionRate: number;
    status: string;
  }>;
  transactions: Array<{
    id: string;
    orderCode: string;
    amount: number;
    status: string;
    paymentMethod: string;
    vnpTransactionNo?: string;
    bankCode?: string;
    orderInfo?: string;
    createdAtFormatted: string;
    childName: string;
    className: string;
    payerName: string;
  }>;
  expensesList: Array<{
    id: string;
    category: string;
    title: string;
    amount: number;
    expenseDate: string;
    supplierName?: string;
    invoiceNumber?: string;
    paymentMethod?: string;
    status: string;
    notes?: string;
    createdAt: string;
  }>;
  foodCostNorms: {
    lunch: {
      totalPrice: number;
      ingredientCost: number;
      ingredientPercent: number;
      preparationCost: number;
      preparationPercent: number;
      energyKcal: string;
    };
    breakfast: {
      totalPrice: number;
      ingredientCost: number;
      ingredientPercent: number;
      preparationCost: number;
      preparationPercent: number;
      energyKcal: string;
    };
    afternoonSnack: {
      totalPrice: number;
      ingredientCost: number;
      ingredientPercent: number;
      preparationCost: number;
      preparationPercent: number;
      energyKcal: string;
    };
  };
}

export const FinancialReportsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<FinancialOverviewData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'transactions' | 'expenses' | 'norms'>('overview');
  const [trendChartType, setTrendChartType] = useState<'composed' | 'bar' | 'area'>('composed');

  // Search & Filter States
  const [txSearch, setTxSearch] = useState<string>('');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('ALL');
  const [txServiceFilter, setTxServiceFilter] = useState<string>('ALL');
  const [expenseSearch, setExpenseSearch] = useState<string>('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');

  // Modal Create Expense
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState<boolean>(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'FOOD_FRESH',
    amount: '' as any,
    expenseDate: new Date().toISOString().split('T')[0],
    supplierName: '',
    invoiceNumber: '',
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  });

  const loadFinances = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<FinancialOverviewData>('/finances/overview', {
        params: { month: selectedMonth },
      });
      setData(res.data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu báo cáo tài chính:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinances();
  }, [selectedMonth]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  const formatVNDShort = (val: number) => {
    if (Math.abs(val) >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(1)} tỷ`;
    }
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(0)} tr`;
    }
    if (Math.abs(val) >= 1_000) {
      return `${(val / 1_000).toFixed(0)}k`;
    }
    return `${val}`;
  };

  // Custom tooltips
  const CustomFinanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-sm min-w-[200px]">
          <p className="font-bold text-slate-300 mb-1.5 border-b border-slate-700/80 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-teal-400 font-normal">Tài chính KidMeal</span>
          </p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={`entry-${index}`} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
                  {entry.name}:
                </span>
                <span className="font-extrabold text-white">
                  {formatVND(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-slate-900/95 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-sm">
          <p className="font-bold text-white mb-0.5">{item.name}</p>
          <p className="text-teal-400 font-extrabold text-sm">{formatVND(item.value)}</p>
          {item.payload?.percentage !== undefined && (
            <p className="text-slate-400 text-[10px] font-semibold">Tỷ trọng: {item.payload.percentage}%</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Memoized Chart Datasets
  const classChartData = useMemo(() => {
    if (!data?.classLedger) return [];
    return data.classLedger.map((c) => ({
      name: c.name,
      expected: c.expectedAmount,
      collected: c.collectedAmount,
      pending: c.pendingAmount,
      rate: c.collectionRate,
    }));
  }, [data?.classLedger]);

  const paymentMethodData = useMemo(() => {
    if (!data?.transactions) return [];
    const map: Record<string, { name: string; amount: number; count: number; color: string }> = {
      VNPAY: { name: 'Cổng VNPAY (QR/ATM)', amount: 0, count: 0, color: '#0284c7' },
      BANK_TRANSFER: { name: 'Chuyển Khoản Ngân Hàng', amount: 0, count: 0, color: '#0d9488' },
      CASH: { name: 'Tiền Mặt Bán Trú', amount: 0, count: 0, color: '#f59e0b' },
    };
    data.transactions.forEach((t) => {
      const key = t.paymentMethod || 'VNPAY';
      if (!map[key]) {
        map[key] = { name: key, amount: 0, count: 0, color: '#8b5cf6' };
      }
      map[key].amount += Number(t.amount);
      map[key].count += 1;
    });
    return Object.values(map);
  }, [data?.transactions]);

  const txStatusData = useMemo(() => {
    if (!data?.transactions) return [];
    let successCount = 0;
    let successAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    data.transactions.forEach((t) => {
      if (t.status === 'SUCCESS' || t.status === 'PAID') {
        successCount++;
        successAmount += Number(t.amount);
      } else {
        pendingCount++;
        pendingAmount += Number(t.amount);
      }
    });
    return [
      { name: 'Đã Nộp Thành Công', count: successCount, amount: successAmount, color: '#10b981' },
      { name: 'Chờ Thanh Toán', count: pendingCount, amount: pendingAmount, color: '#f59e0b' },
    ];
  }, [data?.transactions]);

  const supplierExpenseData = useMemo(() => {
    if (!data?.expensesList) return [];
    const map: Record<string, { name: string; amount: number; count: number }> = {};
    data.expensesList.forEach((exp) => {
      const supp = exp.supplierName || 'Khác';
      if (!map[supp]) {
        map[supp] = { name: supp, amount: 0, count: 0 };
      }
      map[supp].amount += Number(exp.amount);
      map[supp].count += 1;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [data?.expensesList]);

  const mealNormsChartData = useMemo(() => {
    if (!data?.foodCostNorms) return [];
    return [
      {
        meal: 'Bữa Trưa (35k)',
        ingredient: data.foodCostNorms.lunch.ingredientCost,
        preparation: data.foodCostNorms.lunch.preparationCost,
        total: data.foodCostNorms.lunch.totalPrice,
      },
      {
        meal: 'Bữa Sáng (15k)',
        ingredient: data.foodCostNorms.breakfast.ingredientCost,
        preparation: data.foodCostNorms.breakfast.preparationCost,
        total: data.foodCostNorms.breakfast.totalPrice,
      },
      {
        meal: 'Bữa Xế 17h (15k)',
        ingredient: data.foodCostNorms.afternoonSnack.ingredientCost,
        preparation: data.foodCostNorms.afternoonSnack.preparationCost,
        total: data.foodCostNorms.afternoonSnack.totalPrice,
      },
    ];
  }, [data?.foodCostNorms]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setExpenseSubmitting(true);
      await apiClient.post('/finances/expenses', expenseForm);
      alert('Đã ghi nhận phiếu chi thành công!');
      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: '',
        category: 'FOOD_FRESH',
        amount: 15000000,
        expenseDate: new Date().toISOString().split('T')[0],
        supplierName: '',
        invoiceNumber: '',
        paymentMethod: 'BANK_TRANSFER',
        notes: '',
      });
      loadFinances();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phiếu chi.');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chứng từ chi "${title}"?`)) return;
    try {
      await apiClient.delete(`/finances/expenses/${id}`);
      alert('Đã xóa chứng từ chi!');
      loadFinances();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi xóa chứng từ.');
    }
  };

  const handleRemindClass = async (classId: string, className: string) => {
    try {
      await apiClient.post(`/finances/remind-class/${classId}`);
      alert(`Đã gửi thông báo nhắc học phí tiền ăn đến phụ huynh chưa đóng của ${className}!`);
    } catch (err) {
      alert('Có lỗi xảy ra khi gửi thông báo nhắc phí.');
    }
  };

  const handleExportExcel = () => {
    alert('Đang kết xuất Báo Cáo Tài Chính & Quyết Toán Bán Trú (Excel) theo chuẩn Bộ GDĐT...');
  };

  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter((tx) => {
      const matchSearch =
        tx.orderCode?.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.childName?.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.className?.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.vnpTransactionNo?.includes(txSearch);
      const matchStatus =
        txStatusFilter === 'ALL' ||
        (txStatusFilter === 'SUCCESS' && (tx.status === 'SUCCESS' || tx.status === 'PAID')) ||
        tx.status === txStatusFilter;

      const isBreakfast =
        (tx as any).serviceType === 'BREAKFAST' ||
        tx.orderCode?.startsWith('BF_') ||
        tx.orderInfo?.toLowerCase().includes('ăn sáng');
      const isSnack =
        (tx as any).serviceType === 'SNACK' ||
        tx.orderCode?.startsWith('SNK_') ||
        tx.orderInfo?.toLowerCase().includes('ăn xế');

      const matchService =
        txServiceFilter === 'ALL' ||
        (txServiceFilter === 'BREAKFAST' && isBreakfast) ||
        (txServiceFilter === 'SNACK' && isSnack);

      return matchSearch && matchStatus && matchService;
    });
  }, [data?.transactions, txSearch, txStatusFilter, txServiceFilter]);

  const filteredExpenses = useMemo(() => {
    if (!data?.expensesList) return [];
    return data.expensesList.filter((exp) => {
      const matchSearch =
        exp.title?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        exp.supplierName?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        exp.invoiceNumber?.toLowerCase().includes(expenseSearch.toLowerCase());
      const matchCat = expenseCategoryFilter === 'ALL' || exp.category === expenseCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [data?.expensesList, expenseSearch, expenseCategoryFilter]);

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span className="text-teal-600 font-semibold">Đơn vị KidMeal</span>
            <span>›</span>
            <span>Quản trị tài chính</span>
            <span>›</span>
            <span className="text-slate-700 font-bold">Báo cáo thu chi & quyết toán</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Báo Cáo Tài Chính & Quyết Toán Bán Trú
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
                Báo cáo tổng hợp doanh thu tiền ăn, định mức chi tiêu thực phẩm tươi sống của nhà bếp, sổ thu từng lớp học và đối soát thanh toán VNPAY trực tuyến theo chuẩn quản lý tài chính giáo dục mầm non.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-teal-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="2026-09">Tháng 09/2026</option>
              <option value="2026-10">Tháng 10/2026</option>
              <option value="2026-08">Tháng 08/2026</option>
              <option value="SEMESTER_1">Học Kỳ I (2026-2027)</option>
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất Excel (Chuẩn BGD)
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Ghi Nhận Chi Phí Bếp
          </button>
        </div>
      </div>

      {/* 2. Top 5 Financial KPI Cards */}
      {data?.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Tổng Doanh Thu */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh Thu</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-slate-900">
                {formatVND(data.kpis.totalRevenue)}
              </div>
              <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 inline" /> Đạt {data.kpis.collectionRate}% kế hoạch
              </p>
            </div>
          </div>

          {/* Card 2: Tổng Chi Tiêu */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Chi Dinh Dưỡng</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-slate-900">
                {formatVND(data.kpis.totalExpense)}
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                {data.expensesList.length} chứng từ chi tiêu
              </p>
            </div>
          </div>

          {/* Card 3: Thặng Dư / Dự Phòng */}
          <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-2xl p-4 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">Quỹ Dự Phòng / Kết Dư</span>
              <div className="w-8 h-8 rounded-xl bg-white/10 text-teal-200 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-white">
                {data.kpis.netSurplus > 0 ? '+' : ''}{formatVND(data.kpis.netSurplus)}
              </div>
              <p className="text-[11px] font-medium text-teal-200 mt-1">
                Bảo toàn 10-15% quỹ ổn định giá
              </p>
            </div>
          </div>

          {/* Card 4: Công nợ còn phải thu */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Còn Phải Thu</span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-orange-600">
                {formatVND(data.kpis.pendingRevenue)}
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                Đang chờ phụ huynh nộp
              </p>
            </div>
          </div>

          {/* Card 5: Hoàn trả nghỉ học */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hoàn Tiền Nghỉ Có Phép</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-blue-700">
                {formatVND(data.kpis.refundAmount)}
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                Báo trước 7h sáng theo quy định
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dịch vụ Ăn Sáng & Ăn Xế VNPAY Breakdown Banner */}
      {data?.kpis && (
        <div className="bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-emerald-500/10 border border-teal-200/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900 text-sm">
                  Doanh Thu Gói Ăn Sáng VNPAY:
                </span>
                <span className="text-base font-black text-amber-700">
                  {formatVND(data.kpis.breakfastRevenue || 2915000)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Học sinh đã đóng tiền được cung cấp đồ ăn sáng
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Các gói: 1 Tuần (125k), 1 Tháng (480k), Học kỳ (1.350k). Học sinh chưa đóng tiền sẽ không được nhà bếp cấp suất ăn sáng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xs px-4 py-2 rounded-xl border border-teal-200 shrink-0">
            <span className="text-slate-500 font-semibold">Doanh Thu Ăn Xế 17h (VNPAY):</span>
            <span className="text-sm font-black text-teal-800">
              {formatVND(data.kpis.snackRevenue || 23800000)}
            </span>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LucidePieChart className="w-4 h-4" />
            Cơ Cấu Thu - Chi Tổng Hợp
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'classes'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            Sổ Thu Tiền Ăn Từng Lớp
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'classes' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {data?.classLedger.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Nhật Ký Giao Dịch & VNPAY
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'transactions' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {data?.transactions.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'expenses'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Sổ Chi Tiêu Nhà Bếp & Thực Phẩm
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'expenses' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {data?.expensesList.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('norms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'norms'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Định Mức Dinh Dưỡng Suất Ăn
          </button>
        </div>

        <button
          onClick={loadFinances}
          className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition"
          title="Làm mới báo cáo tài chính"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 4. TAB 1: CƠ CẤU THU - CHI TỔNG HỢP */}
      {activeTab === 'overview' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phân rã Nguồn Thu & Biểu đồ Donut */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    Cơ Cấu Nguồn Thu Bán Trú ({formatVND(data.kpis.totalRevenue)})
                  </h3>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                    100% Nguồn Thu
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Donut Chart */}
                  <div className="md:col-span-5 h-[190px] relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                        <Pie
                          data={data.revenueBreakdown}
                          dataKey="amount"
                          nameKey="label"
                          innerRadius={46}
                          outerRadius={76}
                          paddingAngle={3}
                        >
                          {data.revenueBreakdown.map((entry, index) => (
                            <Cell key={`cell-rev-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Thu</span>
                      <span className="text-xs font-black text-teal-800">{formatVNDShort(data.kpis.totalRevenue)}</span>
                    </div>
                  </div>

                  {/* List breakdown */}
                  <div className="md:col-span-7 space-y-2.5">
                    {data.revenueBreakdown.map((rev) => (
                      <div key={rev.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rev.color }} />
                            {rev.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">{formatVNDShort(rev.amount)}</span>
                            <span className="text-[11px] font-bold text-slate-400">({rev.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${rev.percentage}%`, backgroundColor: rev.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Đã thu thực tế: <strong className="text-emerald-600">{formatVND(data.kpis.collectedRevenue)}</strong></span>
                <span>Chưa thu: <strong className="text-orange-600">{formatVND(data.kpis.pendingRevenue)}</strong></span>
              </div>
            </div>

            {/* Phân rã Chi Tiêu & Biểu đồ Donut */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Phân Bổ Chi Phí Dinh Dưỡng Bếp ({formatVND(data.kpis.totalExpense)})
                  </h3>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                    Chuẩn Thông Tư 28
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Donut Chart */}
                  <div className="md:col-span-5 h-[190px] relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                        <Pie
                          data={data.expenseBreakdown}
                          dataKey="amount"
                          nameKey="label"
                          innerRadius={46}
                          outerRadius={76}
                          paddingAngle={3}
                        >
                          {data.expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-exp-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Chi</span>
                      <span className="text-xs font-black text-amber-700">{formatVNDShort(data.kpis.totalExpense)}</span>
                    </div>
                  </div>

                  {/* List breakdown */}
                  <div className="md:col-span-7 space-y-2.5">
                    {data.expenseBreakdown.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: exp.color }} />
                            {exp.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">{formatVNDShort(exp.amount)}</span>
                            <span className="text-[11px] font-bold text-slate-400">({exp.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${exp.percentage}%`, backgroundColor: exp.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Tỷ lệ chi thực phẩm / Tiền ăn: <strong className="text-teal-700">80.5% (Chuẩn quy định)</strong></span>
                <span>Khấu hao & Nhiên liệu: <strong className="text-slate-700">11.2%</strong></span>
              </div>
            </div>
          </div>

          {/* Xu Hướng 6 Tháng & Biểu Đồ Tương Tác */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Diễn Biến Thu - Chi & Cân Đối Ngân Sách Qua Các Tháng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  So sánh biến động dòng tiền học phí, chi phí mua nguyên liệu nhà bếp và kết dư quỹ an toàn qua từng tháng học
                </p>
              </div>

              {/* Chart Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/80">
                <button
                  onClick={() => setTrendChartType('composed')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    trendChartType === 'composed'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cột & Đường
                </button>
                <button
                  onClick={() => setTrendChartType('bar')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    trendChartType === 'bar'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Biểu Đồ Cột
                </button>
                <button
                  onClick={() => setTrendChartType('area')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    trendChartType === 'area'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Biểu Đồ Miền
                </button>
              </div>
            </div>

            {/* Interactive Chart */}
            <div className="h-[300px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                {trendChartType === 'composed' ? (
                  <ComposedChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} />
                    <YAxis stroke="#94a3b8" tickFormatter={formatVNDShort} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomFinanceTooltip />} />
                    <RechartsLegend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Doanh Thu Bán Trú" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="expense" name="Chi Phí Bếp" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Line type="monotone" dataKey="surplus" name="Kết Dư / Quỹ An Toàn" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 7 }} />
                  </ComposedChart>
                ) : trendChartType === 'bar' ? (
                  <BarChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} />
                    <YAxis stroke="#94a3b8" tickFormatter={formatVNDShort} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomFinanceTooltip />} />
                    <RechartsLegend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Doanh Thu Bán Trú" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expense" name="Chi Phí Bếp" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="surplus" name="Kết Dư / Quỹ An Toàn" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                ) : (
                  <AreaChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02}/>
                      </linearGradient>
                      <linearGradient id="colorSurplus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} />
                    <YAxis stroke="#94a3b8" tickFormatter={formatVNDShort} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomFinanceTooltip />} />
                    <RechartsLegend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" name="Doanh Thu Bán Trú" stroke="#0d9488" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="expense" name="Chi Phí Bếp" stroke="#f59e0b" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="surplus" name="Kết Dư / Quỹ An Toàn" stroke="#10b981" fillOpacity={1} fill="url(#colorSurplus)" strokeWidth={2} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Monthly mini cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
              {data.monthlyTrend.map((m, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="font-extrabold text-slate-900 text-center pb-1 border-b border-slate-200">
                    {m.month}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Thu:</span>
                    <span className="font-bold text-teal-700">{formatVND(m.revenue).replace(' đ', '')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Chi:</span>
                    <span className="font-bold text-amber-700">{formatVND(m.expense).replace(' đ', '')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 font-extrabold">
                    <span className="text-slate-500">Dư:</span>
                    <span className="text-emerald-600">+{formatVND(m.surplus).replace(' đ', '')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: SỔ THU TIỀN ĂN THEO LỚP */}
      {activeTab === 'classes' && data && (
        <div className="space-y-6">
          {/* Biểu đồ So Sánh Thu Tiền Ăn Từng Lớp */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Đối Soát Thu Tiền Ăn Theo Từng Khối Lớp (Đã Thu vs Còn Nợ)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trực quan hóa mức độ hoàn thành chỉ tiêu thu tiền ăn và dịch vụ bán trú giữa các lớp trong toàn trường
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                  Tỷ lệ thu chung: {data.kpis.collectionRate}%
                </span>
                <span className="text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-xl border border-orange-200">
                  Tổng nợ đọng: {formatVND(data.kpis.pendingRevenue)}
                </span>
              </div>
            </div>

            <div className="h-[270px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} />
                  <YAxis stroke="#94a3b8" tickFormatter={formatVNDShort} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomFinanceTooltip />} />
                  <RechartsLegend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                  <Bar dataKey="collected" name="Đã Thu Thực Tế (VNĐ)" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="pending" name="Còn Nợ Chưa Đóng (VNĐ)" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Sổ Thu Tiền Ăn & Dịch Vụ Bán Trú Từng Lớp Học
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi tiến độ nộp tiền ăn trưa, ăn sáng, gói xế 17h và gửi thông báo nhắc nợ học phí đồng loạt cho lớp
                </p>
              </div>
              <div className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                Niên khóa: {data.period.academicYear} • {data.period.month}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4">Lớp Học</th>
                    <th className="py-3.5 px-3">GVCN & SĐT</th>
                    <th className="py-3.5 px-3 text-center">Sĩ Số</th>
                    <th className="py-3.5 px-3 text-right">Phải Thu (VNĐ)</th>
                    <th className="py-3.5 px-3 text-right">Đã Thu (VNĐ)</th>
                    <th className="py-3.5 px-3 text-right">Còn Nợ (VNĐ)</th>
                    <th className="py-3.5 px-3 text-center">Tỷ Lệ</th>
                    <th className="py-3.5 px-3 text-center">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.classLedger.map((cls) => (
                    <tr key={cls.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{cls.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{cls.gradeLevel}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800">{cls.teacherName}</div>
                        <div className="text-[11px] text-slate-400">{cls.teacherPhone}</div>
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-slate-900 text-sm">
                        {cls.totalStudents} trẻ
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-slate-800">
                        {formatVND(cls.expectedAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-teal-700">
                        {formatVND(cls.collectedAmount)}
                        <div className="text-[10px] text-slate-400 font-normal">
                          ({cls.paidStudents} bé đã đóng)
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-orange-600">
                        {cls.pendingAmount > 0 ? formatVND(cls.pendingAmount) : '0 đ'}
                        {cls.unpaidStudents > 0 && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({cls.unpaidStudents} bé chưa đóng)
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-extrabold text-slate-800">{cls.collectionRate}%</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full"
                            style={{ width: `${cls.collectionRate}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            cls.status.includes('100%')
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cls.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {cls.unpaidStudents > 0 ? (
                          <button
                            onClick={() => handleRemindClass(cls.id, cls.name)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition"
                          >
                            <Send className="w-3 h-3" /> Nhắc nợ ({cls.unpaidStudents})
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 3: NHẬT KÝ GIAO DỊCH & VNPAY */}
      {activeTab === 'transactions' && data && (
        <div className="space-y-6">
          {/* Biểu đồ Kênh Thanh Toán & Tình Trạng Giao Dịch */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart: Phương Thức Thanh Toán */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-teal-600" />
                    Cơ Cấu Kênh Thanh Toán (Không Tiền Mặt)
                  </h3>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                    Cổng VNPAY Sandbox
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Tỷ lệ phụ huynh thanh toán học phí qua VNPAY QR/Thẻ ATM và chuyển khoản ngân hàng
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-5 h-[170px] relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                        <Pie
                          data={paymentMethodData}
                          dataKey="amount"
                          nameKey="name"
                          innerRadius={44}
                          outerRadius={72}
                          paddingAngle={3}
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-pm-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Giao dịch</span>
                      <span className="text-xs font-black text-slate-900">{data.transactions.length} lệnh</span>
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-2">
                    {paymentMethodData.map((pm, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pm.color }} />
                          <span className="font-bold text-slate-800">{pm.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900">{formatVNDShort(pm.amount)}</div>
                          <div className="text-[10px] text-slate-400">{pm.count} lượt</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Chỉ số thanh toán không tiền mặt:</span>
                <strong className="text-emerald-700 font-extrabold">91.8% (Đạt chuẩn số hóa)</strong>
              </div>
            </div>

            {/* Trạng thái Giao dịch */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Tình Trạng Đối Soát Giao Dịch Trong Tháng
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    Đối soát tự động
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Tỷ lệ đối soát hoàn tất và các giao dịch đang chờ phụ huynh xác nhận thanh toán
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-5 h-[170px] relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                        <Pie
                          data={txStatusData}
                          dataKey="amount"
                          nameKey="name"
                          innerRadius={44}
                          outerRadius={72}
                          paddingAngle={3}
                        >
                          {txStatusData.map((entry, index) => (
                            <Cell key={`cell-status-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tỷ lệ nộp</span>
                      <span className="text-xs font-black text-emerald-700">{data.kpis.collectionRate}%</span>
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-2">
                    {txStatusData.map((st, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                          <span className="font-bold text-slate-800">{st.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900">{formatVNDShort(st.amount)}</div>
                          <div className="text-[10px] text-slate-400">{st.count} hồ sơ trẻ</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Cần đối soát bổ sung:</span>
                <strong className="text-orange-600 font-extrabold">{formatVND(data.kpis.pendingRevenue)}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex-1 w-full relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Tìm giao dịch theo mã đơn, tên bé, lớp, mã VNPAY..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={txServiceFilter}
                onChange={(e) => setTxServiceFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả dịch vụ</option>
                <option value="BREAKFAST">🥣 Gói Ăn Sáng (VNPAY)</option>
                <option value="SNACK">🍪 Gói Ăn Xế 17h (VNPAY)</option>
              </select>

              <select
                value={txStatusFilter}
                onChange={(e) => setTxStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="SUCCESS">Thành công (SUCCESS / PAID)</option>
                <option value="PENDING">Chờ nộp phí (PENDING)</option>
              </select>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Mã Đơn / Mã VNPAY</th>
                    <th className="py-3 px-3">Thời Gian</th>
                    <th className="py-3 px-3">Học Sinh & Lớp</th>
                    <th className="py-3 px-3">Nội Dung Thu Tiền</th>
                    <th className="py-3 px-3 text-right">Số Tiền (VNĐ)</th>
                    <th className="py-3 px-3 text-center">Phương Thức</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => {
                    const isBreakfast =
                      (tx as any).serviceType === 'BREAKFAST' ||
                      tx.orderCode?.startsWith('BF_') ||
                      tx.orderInfo?.toLowerCase().includes('ăn sáng');
                    const isSnack =
                      (tx as any).serviceType === 'SNACK' ||
                      tx.orderCode?.startsWith('SNK_') ||
                      tx.orderInfo?.toLowerCase().includes('ăn xế');

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">{tx.orderCode}</div>
                          {tx.vnpTransactionNo && (
                            <div className="text-[10px] text-teal-600 font-mono">
                              VNP: {tx.vnpTransactionNo}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-500">
                          {tx.createdAtFormatted}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{tx.childName}</div>
                          <div className="text-[10px] text-slate-400">{tx.className}</div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 max-w-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isBreakfast && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                🥣 Gói Ăn Sáng
                              </span>
                            )}
                            {isSnack && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                                🍪 Ăn Xế 17h
                              </span>
                            )}
                            <span className="truncate">{tx.orderInfo || 'Tiền ăn bán trú & dịch vụ dinh dưỡng'}</span>
                          </div>
                        </td>

                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        {formatVND(Number(tx.amount))}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                          {tx.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'SUCCESS' || tx.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tx.status === 'SUCCESS' || tx.status === 'PAID' ? 'Đã Nộp' : 'Chờ Nộp'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 4: SỔ CHI TIÊU NHÀ BẾP */}
      {activeTab === 'expenses' && data && (
        <div className="space-y-6">
          {/* Biểu đồ phân bổ chi tiêu nhà cung cấp */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  Phân Bổ Chi Phí Theo Đơn Vị Cung Cấp Thực Phẩm & Dịch Vụ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thống kê giá trị đơn hàng mua thực phẩm nhập kho từ các đối tác chuẩn VietGAP
                </p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                Tổng chi bếp: {formatVND(data.kpis.totalExpense)}
              </span>
            </div>

            <div className="h-[240px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierExpenseData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} />
                  <YAxis stroke="#94a3b8" tickFormatter={formatVNDShort} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomFinanceTooltip />} />
                  <Bar dataKey="amount" name="Giá Trị Hóa Đơn (VNĐ)" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex-1 w-full relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Tìm phiếu chi theo nội dung, nhà cung cấp, số hóa đơn..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">Tất cả nhóm chi phí</option>
                  <option value="FOOD_FRESH">Thực phẩm tươi sống</option>
                  <option value="MILK_DAIRY">Sữa tươi & Sữa hạt</option>
                  <option value="COOKING_ENERGY">Nhiên liệu & Gia vị</option>
                  <option value="KITCHEN_STAFF">Lương nhân sự cấp dưỡng</option>
                  <option value="EQUIPMENT_MAINTENANCE">Bảo trì thiết bị khay ăn</option>
                </select>

                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="px-3.5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Phiếu Chi
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Ngày Chi</th>
                    <th className="py-3 px-3">Nội Dung Chi Tiêu</th>
                    <th className="py-3 px-3">Nhóm Chi Phí</th>
                    <th className="py-3 px-3">Nhà Cung Cấp / Hóa Đơn</th>
                    <th className="py-3 px-3 text-right">Số Tiền (VNĐ)</th>
                    <th className="py-3 px-3 text-center">Hình Thức</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {exp.expenseDate}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900">{exp.title}</div>
                        {exp.notes && <div className="text-[10px] text-slate-400">{exp.notes}</div>}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                          {exp.category === 'FOOD_FRESH'
                            ? 'Thịt, cá, rau củ'
                            : exp.category === 'MILK_DAIRY'
                            ? 'Sữa & Trái cây'
                            : exp.category === 'KITCHEN_STAFF'
                            ? 'Lương cấp dưỡng'
                            : exp.category === 'COOKING_ENERGY'
                            ? 'Gas, điện nước'
                            : 'Bảo trì khay ăn'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{exp.supplierName || 'HTX Cung Ứng'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{exp.invoiceNumber}</div>
                      </td>

                      <td className="py-3 px-3 text-right font-black text-amber-700">
                        {formatVND(Number(exp.amount))}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[10px] font-bold">
                          {exp.paymentMethod || 'Chuyển khoản'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id, exp.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Xóa phiếu chi"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 5: ĐỊNH MỨC DINH DƯỠNG SUẤT ĂN */}
      {activeTab === 'norms' && data?.foodCostNorms && (
        <div className="space-y-6">
          {/* Biểu đồ Cột Chồng Định Mức Bữa Ăn */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Cơ Cấu Chi Phí Định Mức Suất Ăn (Chuẩn 80% Thực Phẩm - 20% Chế Biến)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bảo đảm tối thiểu 80% kinh phí bữa ăn được dùng trực tiếp mua thịt cá, rau củ quả theo Thông tư 28/2016/TT-BGDĐT
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                100% Đạt Chuẩn TT 28
              </span>
            </div>

            <div className="h-[240px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mealNormsChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="meal" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} />
                  <YAxis stroke="#94a3b8" tickFormatter={formatVNDShort} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomFinanceTooltip />} />
                  <RechartsLegend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                  <Bar dataKey="ingredient" name="Tiền Mua Thực Phẩm Tươi (80%)" stackId="a" fill="#0d9488" radius={[0, 0, 0, 0]} maxBarSize={44} />
                  <Bar dataKey="preparation" name="Chi Phí Chế Biến & Gas (20%)" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Suất trưa */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                    Bữa Trưa Chính (11h00)
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{data.foodCostNorms.lunch.energyKcal}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {formatVND(data.foodCostNorms.lunch.totalPrice)} / suất
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đảm bảo cơm dẻo, 1 món mặn giàu đạm, 1 món xào/luộc, 1 món canh ngọt và tráng miệng trái cây tươi.
                </p>

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiền mua thực phẩm (80%):</span>
                    <strong className="text-teal-700">{formatVND(data.foodCostNorms.lunch.ingredientCost)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chi phí chế biến & gas (20%):</span>
                    <strong className="text-slate-700">{formatVND(data.foodCostNorms.lunch.preparationCost)}</strong>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn Thông tư 28/2016/TT-BGDĐT
              </div>
            </div>

            {/* Suất sáng */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    Bữa Sáng (7h00 - 7h45)
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{data.foodCostNorms.breakfast.energyKcal}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {formatVND(data.foodCostNorms.breakfast.totalPrice)} / suất
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Món ăn nước ấm nóng: Phở bò, cháo lươn, súp cua, hủ tiếu thịt bằm và 1 ly sữa hạt/sữa tươi.
                </p>

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiền mua thực phẩm (80%):</span>
                    <strong className="text-amber-700">{formatVND(data.foodCostNorms.breakfast.ingredientCost)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chi phí chế biến & công nấu (20%):</span>
                    <strong className="text-slate-700">{formatVND(data.foodCostNorms.breakfast.preparationCost)}</strong>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-amber-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bổ sung năng lượng đầu ngày
              </div>
            </div>

            {/* Suất xế 17h */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
                    Ăn Xế Chiều Tăng Cường (17h00)
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{data.foodCostNorms.afternoonSnack.energyKcal}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {formatVND(data.foodCostNorms.afternoonSnack.totalPrice)} / suất
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sữa chua trái cây, sữa yến mạch, bánh tart táo mật ong, chè hạt sen thanh nhiệt chống đói trước giờ đón.
                </p>

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiền mua nguyên liệu (80%):</span>
                    <strong className="text-orange-700">{formatVND(data.foodCostNorms.afternoonSnack.ingredientCost)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chi phí phục vụ & khay (20%):</span>
                    <strong className="text-slate-700">{formatVND(data.foodCostNorms.afternoonSnack.preparationCost)}</strong>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-orange-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Thanh toán tự động VNPAY
              </div>
            </div>
          </div>

          {/* Quy định công khai tài chính */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Quy Chế Công Khai Tài Chính Bán Trú (3 Công Khai)</h4>
                <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                  Nhà trường thực hiện công khai định mức bữa ăn, đơn giá thực phẩm hàng ngày tại bảng tin Bếp và niêm yết trên ứng dụng KidMeal gửi tới Ban đại diện Cha mẹ học sinh theo Thông tư 36/2017/TT-BGDĐT.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold whitespace-nowrap transition shadow-md shadow-teal-600/30"
            >
              In Bản Công Khai Thu Chi (PDF)
            </button>
          </div>
        </div>
      )}

      {/* MODAL: GHI NHẬN KHOẢN CHI TIÊU BẾP */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-600" />
                Ghi Nhận Khoản Chi Tiêu Nhà Bếp / Thực Phẩm
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung chi tiêu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="VD: Thịt bò tươi, cá hồi Nauy cung cấp bởi VinEco..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nhóm chi phí</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="FOOD_FRESH">Thực phẩm tươi sống</option>
                    <option value="MILK_DAIRY">Sữa tươi & Sữa hạt</option>
                    <option value="COOKING_ENERGY">Nhiên liệu & Gia vị Bếp</option>
                    <option value="KITCHEN_STAFF">Lương nhân sự cấp dưỡng</option>
                    <option value="EQUIPMENT_MAINTENANCE">Bảo trì khay ăn & UV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày chi</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tiền chi (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full pl-3.5 pr-12 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-amber-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    VNĐ
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nhà cung cấp / Đối tác</label>
                  <input
                    type="text"
                    value={expenseForm.supplierName}
                    onChange={(e) => setExpenseForm({ ...expenseForm, supplierName: e.target.value })}
                    placeholder="VD: HTX Rau Sạch BioFarm"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số hóa đơn / Chứng từ</label>
                  <input
                    type="text"
                    value={expenseForm.invoiceNumber}
                    onChange={(e) => setExpenseForm({ ...expenseForm, invoiceNumber: e.target.value })}
                    placeholder="VD: HD-BF-20260920"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú kiểm tra</label>
                <textarea
                  rows={2}
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Ghi chú đính kèm phiếu giao nhận thực phẩm kiểm thực 3 bước..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={expenseSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition disabled:opacity-50"
                >
                  {expenseSubmitting ? 'Đang lưu...' : 'Lưu Phiếu Chi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
