import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/auth.store';
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Search,
  Filter,
  X,
  Printer,
  Download,
  Calendar,
  User,
  Utensils,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Send,
} from 'lucide-react';
import { apiClient } from '@/core/api/axios';

export interface InspectionRecordItem {
  id: string;
  code: string;
  date?: string;
  mealDate: string;
  mealTime: string;
  mealSession?: string;
  performerName: string;
  totalPortions?: number;
  storageTemp?: number;
  status: 'Hoàn tất' | 'Chưa hoàn tất' | 'Có cảnh báo' | string;
  approvalStatus?: 'CHO_BEP_TAI_ANH' | 'CHO_DUYET' | 'DA_DUYET' | 'YEU_CAU_CHUP_LAI' | string;
  approvalStatusLabel?: string;
  rejectionReason?: string;
  dishes?: string[];
  sealedAt?: string;
  disposedAt?: string;
  step1Status?: string;
  step1Time?: string;
  step1Note?: string;
  step1PhotoUrl?: string;
  step1Photos?: string[];
  step2Status?: string;
  step2Time?: string;
  step2Temperature?: number;
  step2Note?: string;
  step2PhotoUrl?: string;
  step2Photos?: string[];
  step3Status?: string;
  step3Time?: string;
  step3Temperature?: number;
  step3Note?: string;
  step3PhotoUrl?: string;
  step3Photos?: string[];
  sampleItems?: Array<{
    id: string;
    dishName: string;
    sampleCode: string;
    quantityGrams: number;
    temperatureC?: number;
    containerType?: string;
    status?: string;
    storedAt?: string;
    disposeAt?: string;
  }>;
}

export const InspectionsPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isPrincipalOrManagement = roles.includes('SCHOOL_MANAGEMENT') || roles.includes('SCHOOL_MANAGER') || roles.includes('PRINCIPAL');
  const isKitchenOrNutritionist = roles.includes('KITCHEN_STAFF') || roles.includes('KITCHEN_MANAGER') || roles.includes('NUTRITIONIST');
  // Khi ở phân hệ Ban Giám Hiệu (/food-safety) hoặc tài khoản BGH, chỉ được xem không được thêm/sửa/xóa
  const isReadOnly = location.pathname.startsWith('/food-safety') || (isPrincipalOrManagement && !isKitchenOrNutritionist);

  const [records, setRecords] = useState<InspectionRecordItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'ASSIGN_KITCHEN' | 'DIRECT_3_STEPS'>('ASSIGN_KITCHEN');
  const navigate = useNavigate();

  // Search and Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mealFilter, setMealFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // 3-Step Creation Form State
  const [form, setForm] = useState({
    mealDate: new Date().toISOString().split('T')[0],
    mealTime: 'Trưa chính (10:30)',
    step1Passed: true,
    step2Passed: true,
    step2KitchenPassed: true,
    step2Temperature: '85',
    step3Passed: true,
    step3Temperature: '68',
    step1Note: 'Nguyên liệu tươi sống, nhãn mác rõ ràng, đạt chuẩn cảm quan khi giao nhận.',
    step2Note: 'Quy trình bếp 1 chiều tuân thủ nghiêm ngặt, nhiệt độ nấu sôi trên 75°C.',
    step3Note: 'Mùi vị thơm ngon, chín đều, màu sắc tự nhiên, định lượng chia khay đồng đều.',
    step1Photo: null as File | null,
    step2Photo: null as File | null,
    step3Photo: null as File | null,
  });

  const [dishes, setDishes] = useState<Array<{ id: string; name: string; qty: string }>>([
    { id: 'd1', name: 'Thịt heo xốt cà chua', qty: '150' },
    { id: 'd2', name: 'Canh bí đỏ thịt bằm', qty: '150' },
    { id: 'd3', name: 'Cơm tấm dẻo', qty: '150' },
    { id: 'd4', name: 'Chuối tiêu tráng miệng', qty: '120' },
  ]);

  useEffect(() => {
    fetchRecords();
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const res = await apiClient.get('/dishes', { params: { limit: 20 } });
      const items = res.data?.items || [];
      if (items.length > 0) {
        setDishes(
          items.slice(0, 5).map((d: any) => ({
            id: String(d.id),
            name: d.name,
            qty: '150',
          }))
        );
      }
    } catch (err) {
      console.warn('Could not load dishes from API, using default preschool dish items:', err);
    }
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      // First try the consolidated 3-step inspection sessions endpoint
      const res = await apiClient.get('/inspections');
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      if (data.length > 0) {
        setRecords(data);
      } else {
        // Fallback to sample items and format them
        const samplesRes = await apiClient.get('/inspections/samples');
        const rawSamples = Array.isArray(samplesRes.data) ? samplesRes.data : Array.isArray(samplesRes.data?.data) ? samplesRes.data.data : [];
        const sampleList = rawSamples;
        if (Array.isArray(sampleList) && sampleList.length > 0) {
          const synthesized: InspectionRecordItem[] = sampleList.map((s: any, idx: number) => ({
            id: String(s.id),
            code: s.code || s.sampleCode || `BB-KT-${s.date?.replace(/-/g, '') || '2026'}-0${idx + 1}`,
            date: s.date || s.mealDate,
            mealDate: s.date || s.mealDate || new Date().toISOString().split('T')[0],
            mealTime: s.mealSession || 'Trưa chính (10:30)',
            performerName: s.collectorName || 'Nguyễn Văn Cường (Bếp trưởng)',
            totalPortions: 380,
            storageTemp: Number(s.storageTemp) || 3.8,
            status: s.status === 'STORED' ? 'Hoàn tất' : s.status === 'DISPOSED' ? 'Hoàn tất' : 'Chưa hoàn tất',
            step1Status: 'Đạt chuẩn',
            step2Status: 'Đạt chuẩn',
            step3Status: 'Đạt chuẩn',
            sampleItems: [
              {
                id: String(s.id),
                dishName: s.dishName,
                sampleCode: s.sampleCode || s.code,
                quantityGrams: Number(s.sampleWeight) || 150,
                status: s.status,
              },
            ],
          }));
          setRecords(synthesized);
        } else {
          setRecords([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch records', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openNewModal = () => {
    setActiveRecordId(null);
    setCurrentStep(1);
    setModalMode('ASSIGN_KITCHEN');
    setForm({
      mealDate: new Date().toISOString().split('T')[0],
      mealTime: 'Trưa chính (10:30)',
      step1Passed: true,
      step2Passed: true,
      step2KitchenPassed: true,
      step2Temperature: '85',
      step3Passed: true,
      step3Temperature: '68',
      step1Note: 'Nhà bếp vui lòng chụp đầy đủ ảnh 3 bước (nguyên liệu tươi + hóa đơn kiểm dịch, quy trình nấu sôi > 75°C, hộp inox niêm phong mẫu lưu 24h) và gửi duyệt.',
      step2Note: 'Quy trình bếp 1 chiều tuân thủ nghiêm ngặt, nhiệt độ nấu sôi trên 75°C.',
      step3Note: 'Mùi vị thơm ngon, chín đều, màu sắc tự nhiên, định lượng chia khay đồng đều.',
      step1Photo: null,
      step2Photo: null,
      step3Photo: null,
    });
    setIsModalVisible(true);
  };

  const handleAssignToKitchen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mealSession = form.mealTime.includes('sáng')
        ? 'BREAKFAST'
        : form.mealTime.includes('xế')
        ? 'AFTERNOON_SNACK'
        : 'LUNCH';

      await apiClient.post('/inspections/create-session', {
        mealDate: form.mealDate,
        mealSession,
        mealTime: form.mealTime,
        dishes: dishes.map((d) => d.name),
        note: form.step1Note || 'Biên bản kiểm thực khởi tạo bởi Chuyên gia dinh dưỡng. Nhà bếp vui lòng chụp đầy đủ ảnh 3 bước và gửi duyệt.',
      });

      alert('✅ Đã tạo biên bản kiểm thực thành công! Đã gửi yêu cầu chụp ảnh minh chứng tới nhà bếp.');
      setIsModalVisible(false);
      await fetchRecords();
    } catch (err: any) {
      alert('Lỗi tạo biên bản: ' + (err.response?.data?.message || err.message));
    }
  };

  const openContinueStep = (record: InspectionRecordItem, step: number) => {
    setActiveRecordId(record.id);
    setCurrentStep(step);
    if (step === 2) {
      setForm((prev) => ({
        ...prev,
        step2Passed: true,
        step2KitchenPassed: true,
        step2Temperature: '85',
        step2Note: record.step2Note || 'Quy trình bếp 1 chiều đảm bảo vệ sinh, nhiệt độ nấu sôi > 75°C.',
        step2Photo: null,
      }));
    }
    if (step === 3) {
      setForm((prev) => ({
        ...prev,
        step3Passed: true,
        step3Temperature: '68',
        step3Note: record.step3Note || 'Món ăn chín mềm vừa miệng, màu sắc cảm quan đạt chuẩn.',
        step3Photo: null,
      }));
    }
    setIsModalVisible(true);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleStep1Submit = async () => {
    try {
      let photoBase64: string | undefined = undefined;
      if (form.step1Photo) {
        photoBase64 = await convertFileToBase64(form.step1Photo);
      }
      await apiClient.post('/inspections/step1', {
        mealDate: form.mealDate,
        mealTime: form.mealTime,
        note: form.step1Note,
        photoBase64,
      });
      alert('Đã lưu Bước 1 (Giao nhận & Cảm quan) thành công! Tiếp tục Bước 2.');
      setCurrentStep(2);
      fetchRecords();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStep2Submit = async () => {
    try {
      let photoBase64: string | undefined = undefined;
      if (form.step2Photo) {
        photoBase64 = await convertFileToBase64(form.step2Photo);
      }
      const targetId = activeRecordId || (records[0]?.id ? records[0].id : 'new');
      await apiClient.patch(`/inspections/${targetId}/step2`, {
        note: form.step2Note,
        photoBase64,
        temperatureC: Number(form.step2Temperature) || 85,
      });
      alert('Đã lưu Bước 2 (Kiểm tra trong khi chế biến) thành công! Tiếp tục Bước 3.');
      setCurrentStep(3);
      fetchRecords();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let photoBase64: string | undefined = undefined;
      if (form.step3Photo) {
        photoBase64 = await convertFileToBase64(form.step3Photo);
      }
      const targetId = activeRecordId || (records[0]?.id ? records[0].id : 'new');
      const payload = {
        note: form.step3Note,
        photoBase64,
        temperatureC: Number(form.step3Temperature) || 68,
        items: dishes.map((d) => ({
          dishId: d.id,
          dishName: d.name,
          quantityGrams: Number(d.qty) || 150,
        })),
      };

      await apiClient.patch(`/inspections/${targetId}/step3`, payload);
      alert('Đã hoàn tất Bước 3 và niêm phong mẫu lưu 24h thành công theo chuẩn QĐ 1246/QĐ-BYT!');
      setIsModalVisible(false);
      fetchRecords();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleNavigateDetail = (id: string) => {
    const isNutritionist = window.location.pathname.startsWith('/nutritionist');
    const targetUrl = isNutritionist ? `/nutritionist/food-safety/${id}` : `/food-safety/${id}`;
    navigate(targetUrl);
  };

  // Helper date formatter: YYYY-MM-DD -> DD/MM/YYYY
  const formatDisplayDate = (d?: string) => {
    if (!d) return '--/--/----';
    const clean = d.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return d;
  };

  // Helper to export CSV for Decision 1246/QĐ-BYT
  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Mã biên bản',
      'Ngày kiểm thực',
      'Ca ăn',
      'Người thực hiện',
      'B1: Trước chế biến',
      'B2: Trong chế biến',
      'B3: Trước khi ăn & Lưu mẫu',
      'Nhiệt độ tủ lưu mẫu (°C)',
      'Trạng thái',
    ];

    const rows = filteredRecords.map((r, i) => [
      i + 1,
      `"${r.code || ''}"`,
      `"${formatDisplayDate(r.mealDate)}"`,
      `"${r.mealTime || ''}"`,
      `"${r.performerName || ''}"`,
      `"${r.step1Status || 'Đạt chuẩn'}"`,
      `"${r.step2Status || 'Đạt chuẩn'}"`,
      `"${r.step3Status || 'Đạt chuẩn'}"`,
      `"${r.storageTemp ?? 3.8}"`,
      `"${r.status || 'Hoàn tất'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `So_Kiem_Thuc_Ba_Buoc_QD1246_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  // Helper to Print formal Decision 1246 log book
  const handlePrintInspectionBook = () => {
    setIsExportModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Filtered Records calculation
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      !search ||
      r.code?.toLowerCase().includes(search.toLowerCase()) ||
      r.performerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.mealTime?.toLowerCase().includes(search.toLowerCase()) ||
      r.mealDate?.includes(search);

    const matchesStatus =
      statusFilter === 'ALL' ||
      r.status === statusFilter ||
      r.approvalStatus === statusFilter ||
      (statusFilter === 'CHO_DUYET' && r.approvalStatus === 'CHO_DUYET') ||
      (statusFilter === 'CHO_BEP_TAI_ANH' && r.approvalStatus === 'CHO_BEP_TAI_ANH') ||
      (statusFilter === 'DA_DUYET' && (r.approvalStatus === 'DA_DUYET' || r.status === 'Hoàn tất')) ||
      (statusFilter === 'YEU_CAU_CHUP_LAI' && (r.approvalStatus === 'YEU_CAU_CHUP_LAI' || r.status === 'Có cảnh báo'));

    const matchesMeal = mealFilter === 'ALL' || r.mealTime?.toLowerCase().includes(mealFilter.toLowerCase());
    const matchesDate = !dateFilter || r.mealDate === dateFilter || r.date === dateFilter;

    return matchesSearch && matchesStatus && matchesMeal && matchesDate;
  });

  const totalCount = records.length;
  const completedCount = records.filter((r) => r.status === 'Hoàn tất').length;
  const incompletedCount = records.filter((r) => r.status === 'Chưa hoàn tất').length;
  const warningCount = records.filter((r) => r.status === 'Có cảnh báo').length;

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* ─── HEADER & ACTIONS ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Sổ Kiểm Thực Ba Bước Điện Tử
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Quy chuẩn Bộ Y Tế — QĐ 1246/QĐ-BYT • Niên khóa 2026 - 2027
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {isReadOnly && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Quyền Ban Giám Hiệu: Giám sát ATTP (Chỉ xem)</span>
            </div>
          )}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 font-bold text-xs shadow-sm transition active:scale-95"
          >
            <FileText className="w-4 h-4 text-slate-500" /> Xuất sổ (PDF/Excel)
          </button>
          {!isReadOnly && (
            <button
              onClick={openNewModal}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Lập biên bản kiểm thực mới
            </button>
          )}
        </div>
      </div>

      {/* ─── 4 KPI STATS COUNTER CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3.5 hover:shadow-md transition">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng biên bản</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3.5 hover:shadow-md transition">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hoàn tất</p>
            <p className="text-2xl font-black text-blue-600 mt-0.5">{completedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3.5 hover:shadow-md transition">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Chưa hoàn tất</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{incompletedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3.5 hover:shadow-md transition">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Có cảnh báo</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{warningCount}</p>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER TOOLBAR ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã biên bản, người làm, ca ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold text-slate-700 transition"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="CHO_DUYET">⏳ Chờ duyệt</option>
            <option value="CHO_BEP_TAI_ANH">📷 Chờ bếp tải ảnh</option>
            <option value="DA_DUYET">✓ Đã duyệt (Hoàn tất)</option>
            <option value="YEU_CAU_CHUP_LAI">⚠️ Yêu cầu chụp lại</option>
          </select>

          <select
            value={mealFilter}
            onChange={(e) => setMealFilter(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold text-slate-700 transition"
          >
            <option value="ALL">Tất cả ca ăn</option>
            <option value="Trưa">Bữa trưa chính</option>
            <option value="Sáng">Bữa sáng</option>
            <option value="Xế">Bữa phụ xế</option>
          </select>

          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-700 font-medium transition"
            />
          </div>

          <button
            onClick={fetchRecords}
            title="Tải lại dữ liệu"
            className="p-2 text-slate-500 hover:text-emerald-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {(search || statusFilter !== 'ALL' || mealFilter !== 'ALL' || dateFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setMealFilter('ALL');
                setDateFilter('');
              }}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition border border-dashed border-slate-200"
              title="Xóa bộ lọc"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── DATA TABLE OF 3-STEP INSPECTION RECORDS ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Mã biên bản</th>
                <th className="px-4 py-3.5">Ngày</th>
                <th className="px-4 py-3.5">Ca ăn</th>
                <th className="px-4 py-3.5">Người thực hiện</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5 text-center w-36">Thao tác</th>
                <th className="px-4 py-3.5 text-center w-28">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Đang tải danh sách biên bản kiểm thực...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Mã biên bản */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 tracking-wide font-mono">
                          {record.code}
                        </span>
                      </div>
                    </td>

                    {/* Ngày */}
                    <td className="px-4 py-3.5 text-slate-600 font-semibold">
                      {formatDisplayDate(record.mealDate)}
                    </td>

                    {/* Ca ăn */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Utensils className="w-3 h-3" />
                        {record.mealTime || 'Trưa chính (10:30)'}
                      </span>
                    </td>

                    {/* Người thực hiện */}
                    <td className="px-4 py-3.5 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{record.performerName || 'Bếp trưởng phụ trách'}</span>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3.5">
                      {record.approvalStatus === 'CHO_DUYET' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse">
                          <Clock className="w-3 h-3" /> Chờ duyệt
                        </span>
                      ) : record.approvalStatus === 'CHO_BEP_TAI_ANH' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Camera className="w-3 h-3" /> Chờ bếp tải ảnh
                        </span>
                      ) : record.approvalStatus === 'YEU_CAU_CHUP_LAI' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Yêu cầu chụp lại
                        </span>
                      ) : record.approvalStatus === 'DA_DUYET' || record.status === 'Hoàn tất' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Đã duyệt
                        </span>
                      ) : record.status === 'Có cảnh báo' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Có cảnh báo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> Chưa hoàn tất
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3.5 text-center">
                      {record.approvalStatus === 'CHO_DUYET' ? (
                        <button
                          onClick={() => handleNavigateDetail(record.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm text-xs transition active:scale-95 w-full flex items-center justify-center gap-1"
                        >
                          Duyệt ngay <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : record.approvalStatus === 'CHO_BEP_TAI_ANH' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-amber-700 bg-amber-50 border border-amber-200 text-xs font-semibold">
                          <Camera className="w-3.5 h-3.5" /> Chờ bếp
                        </span>
                      ) : record.approvalStatus === 'DA_DUYET' || record.status === 'Hoàn tất' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã xong
                        </span>
                      ) : record.approvalStatus === 'YEU_CAU_CHUP_LAI' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 text-xs font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Chờ chụp lại
                        </span>
                      ) : isReadOnly ? (
                        <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-amber-800 bg-amber-50 border border-amber-200 text-xs font-semibold w-full">
                          <Clock className="w-3.5 h-3.5" />
                          {record.step2Status === 'Đạt chuẩn' ? 'Đang làm B.3' : 'Đang làm B.2'}
                        </span>
                      ) : record.step2Status === 'Đạt chuẩn' ? (
                        <button
                          onClick={() => openContinueStep(record, 3)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-sm text-xs transition active:scale-95 w-full flex items-center justify-center gap-1"
                        >
                          Làm tiếp B.3 <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => openContinueStep(record, 2)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-sm text-xs transition active:scale-95 w-full flex items-center justify-center gap-1"
                        >
                          Làm tiếp B.2 <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>

                    {/* Chi tiết */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleNavigateDetail(record.id)}
                        className="px-2.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold transition inline-flex items-center gap-1 whitespace-nowrap border border-emerald-200/60"
                      >
                        Chi tiết <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}

              {!isLoading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <p className="font-semibold text-slate-500">Chưa có biên bản kiểm thực nào phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">Bấm "+ Lập biên bản kiểm thực mới" để tạo biên bản đầu tiên</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: LẬP BIÊN BẢN KIỂM THỰC 3 BƯỚC ─── */}
      {isModalVisible && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Lập Biên Bản Kiểm Thực 3 Bước Điện Tử
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Theo Quy chuẩn Quyết định 1246/QĐ-BYT</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalVisible(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Switch Mode */}
            <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setModalMode('ASSIGN_KITCHEN')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  modalMode === 'ASSIGN_KITCHEN'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Giao Nhà Bếp Chụp Ảnh & Gửi Duyệt</span>
              </button>
              <button
                type="button"
                onClick={() => setModalMode('DIRECT_3_STEPS')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  modalMode === 'DIRECT_3_STEPS'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Tự Ghi Nhận Nhanh 3 Bước</span>
              </button>
            </div>

            {/* ASSIGN KITCHEN FORM */}
            {modalMode === 'ASSIGN_KITCHEN' && (
              <form onSubmit={handleAssignToKitchen} className="p-6 overflow-y-auto space-y-4">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Quy trình kiểm thực điện tử liên thông Chuyên gia Dinh dưỡng & Nhà bếp:
                  </p>
                  <p className="mt-1 text-emerald-800">
                    Chuyên gia dinh dưỡng khởi tạo biên bản → Nhân viên nhà bếp mở văn bản để chụp và tải ảnh minh chứng 3 bước (nguyên liệu, chế biến, lưu mẫu) → Gửi lên lại để Chuyên gia dinh dưỡng xem và phê duyệt Đạt chuẩn.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ngày kiểm thực</label>
                    <input
                      type="date"
                      required
                      value={form.mealDate}
                      onChange={(e) => setForm({ ...form, mealDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ca ăn</label>
                    <select
                      required
                      value={form.mealTime}
                      onChange={(e) => setForm({ ...form, mealTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium outline-none"
                    >
                      <option value="Trưa chính (10:30)">Trưa chính (10:30)</option>
                      <option value="Bữa sáng (07:15)">Bữa sáng (07:15)</option>
                      <option value="Bữa xế chiều (14:30)">Bữa xế chiều (14:30)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Món ăn thực đơn cần kiểm thực & lưu mẫu 24h:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const name = window.prompt('Nhập tên món ăn mới:');
                        if (name && name.trim()) {
                          setDishes([...dishes, { id: 'd' + Date.now(), name: name.trim(), qty: '150' }]);
                        }
                      }}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm món
                    </button>
                  </div>
                  <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    {dishes.map((d, index) => (
                      <div key={d.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-800">{index + 1}. {d.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">150g / hộp inox</span>
                          <button
                            type="button"
                            onClick={() => setDishes(dishes.filter((item) => item.id !== d.id))}
                            className="text-slate-400 hover:text-rose-600 font-bold px-1"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú / Yêu cầu dinh dưỡng gửi tới Nhà bếp:
                  </label>
                  <textarea
                    rows={3}
                    value={form.step1Note}
                    onChange={(e) => setForm({ ...form, step1Note: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Nhà bếp vui lòng chụp đầy đủ ảnh minh chứng 3 bước (nguyên liệu, chế biến, lưu mẫu) và gửi duyệt."
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalVisible(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Tạo Biên Bản & Chuyển Giao Bếp Chụp Ảnh</span>
                  </button>
                </div>
              </form>
            )}

            {/* DIRECT 3 STEPS WIZARD */}
            {modalMode === 'DIRECT_3_STEPS' && (
              <>
                {/* Wizard Step Indicator */}
                <div className="flex bg-slate-50 border-b border-slate-100 px-6 py-3 gap-2 shrink-0">
                  <div
                    className={`flex-1 text-center text-xs font-bold py-2 rounded-xl transition-all ${
                      currentStep === 1
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : currentStep > 1
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    Bước 1: Tiếp nhận
                  </div>
                  <div
                    className={`flex-1 text-center text-xs font-bold py-2 rounded-xl transition-all ${
                      currentStep === 2
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : currentStep > 2
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    Bước 2: Chế biến
                  </div>
                  <div
                    className={`flex-1 text-center text-xs font-bold py-2 rounded-xl transition-all ${
                      currentStep === 3
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    Bước 3: Lưu mẫu 24h
                  </div>
                </div>

                {/* Wizard Body Form */}
                <div className="p-6 overflow-y-auto space-y-5">
                  {/* Common header info (Meal date & Session) */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ngày kiểm thực</label>
                      <input
                        type="date"
                        required
                        value={form.mealDate}
                        onChange={(e) => setForm({ ...form, mealDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ca ăn</label>
                      <select
                        required
                        value={form.mealTime}
                        onChange={(e) => setForm({ ...form, mealTime: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium outline-none"
                      >
                        <option value="Bữa sáng (07:15)">Bữa sáng (07:15)</option>
                        <option value="Trưa chính (10:30)">Trưa chính (10:30)</option>
                        <option value="Bữa xế chiều (14:30)">Bữa xế chiều (14:30)</option>
                      </select>
                    </div>
                  </div>

              {/* BƯỚC 1: TIẾP NHẬN NGUYÊN LIỆU */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h4 className="font-bold text-emerald-800 text-sm">
                      BƯỚC 1: Giao nhận & Cảm quan nguyên liệu tươi sống
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">Trước khi chế biến</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <p className="text-xs font-bold text-slate-700">Nguyên liệu giao nhận sáng nay:</p>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-white p-3 rounded-xl border border-slate-100 font-medium">
                      <li>Thịt heo nạc đùi sạch (Cty CP) — 14.5 kg, kiểm dịch đạt chuẩn</li>
                      <li>Bí đỏ hồ lô loại 1 (Hợp tác xã) — 8.0 kg, tươi cuống</li>
                      <li>Gạo tẻ thơm ST25 đóng bao — 25.0 kg, nguyên tem mác</li>
                      <li>Chuối tiêu quả mầm non — 18.0 kg, không dập nát</li>
                    </ul>

                    <label className="flex items-center gap-3 cursor-pointer bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 transition">
                      <input
                        type="checkbox"
                        checked={form.step1Passed}
                        onChange={(e) => setForm({ ...form, step1Passed: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <span className="text-xs font-bold text-emerald-800">
                        Xác nhận: 100% Nguyên liệu đạt chuẩn cảm quan & có đầy đủ hóa đơn kiểm dịch
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Hình ảnh chứng từ / Hóa đơn giao nhận
                    </label>
                    {form.step1Photo ? (
                      <div className="relative w-44 h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <img
                          src={URL.createObjectURL(form.step1Photo)}
                          alt="Preview B1"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, step1Photo: null })}
                          className="absolute top-1.5 right-1.5 bg-rose-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold hover:bg-rose-600"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-emerald-50/30 transition cursor-pointer">
                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs font-semibold text-slate-600">
                          Bấm để tải ảnh hóa đơn / thực phẩm tươi (JPG, PNG)
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files && setForm({ ...form, step1Photo: e.target.files[0] })
                          }
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú nhận xét</label>
                    <textarea
                      rows={2}
                      value={form.step1Note}
                      onChange={(e) => setForm({ ...form, step1Note: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalVisible(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleStep1Submit}
                      disabled={!form.step1Passed}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
                    >
                      Lưu Bước 1 & Sang Bước 2 <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* BƯỚC 2: CHẾ BIẾN NẤU CHÍN */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h4 className="font-bold text-emerald-800 text-sm">
                      BƯỚC 2: Kiểm tra trong quá trình chế biến thức ăn
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">Bếp 1 chiều & Nhiệt độ sôi</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 transition">
                      <input
                        type="checkbox"
                        checked={form.step2Passed}
                        onChange={(e) => setForm({ ...form, step2Passed: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Vệ sinh dao thớt, dụng cụ chứa đựng phân biệt rõ sống - chín
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 transition">
                      <input
                        type="checkbox"
                        checked={form.step2KitchenPassed}
                        onChange={(e) => setForm({ ...form, step2KitchenPassed: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Quy trình bếp 1 chiều, sàn khô ráo, nhân viên mang găng tay và tạp dề
                      </span>
                    </label>

                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-xs font-bold text-emerald-800">Nhiệt độ tâm món khi nấu sôi:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={form.step2Temperature}
                          onChange={(e) => setForm({ ...form, step2Temperature: e.target.value })}
                          className="w-16 px-2 py-1 text-xs border border-emerald-300 rounded-lg text-center font-bold text-emerald-800 bg-white"
                        />
                        <span className="text-xs font-bold text-emerald-700">°C (&gt; 75°C)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ảnh chụp khu vực nấu / Giám sát bếp
                    </label>
                    {form.step2Photo ? (
                      <div className="relative w-44 h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <img
                          src={URL.createObjectURL(form.step2Photo)}
                          alt="Preview B2"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, step2Photo: null })}
                          className="absolute top-1.5 right-1.5 bg-rose-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold hover:bg-rose-600"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-emerald-50/30 transition cursor-pointer">
                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs font-semibold text-slate-600">
                          Tải ảnh bếp đang nấu hoặc dụng cụ tiệt trùng
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files && setForm({ ...form, step2Photo: e.target.files[0] })
                          }
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú Bước 2</label>
                    <textarea
                      rows={2}
                      value={form.step2Note}
                      onChange={(e) => setForm({ ...form, step2Note: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Quay lại Bước 1
                    </button>
                    <button
                      type="button"
                      onClick={handleStep2Submit}
                      disabled={!form.step2Passed || !form.step2KitchenPassed}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
                    >
                      Lưu Bước 2 & Sang Bước 3 <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* BƯỚC 3: CẢM QUAN TRƯỚC KHI ĂN & LƯU MẪU 24H */}
              {currentStep === 3 && (
                <form onSubmit={handleStep3Submit} className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h4 className="font-bold text-emerald-800 text-sm">
                      BƯỚC 3: Cảm quan thức ăn chín & Niêm phong mẫu lưu 24h
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">Quy chuẩn tủ mát 0-5°C</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 transition">
                      <input
                        type="checkbox"
                        checked={form.step3Passed}
                        onChange={(e) => setForm({ ...form, step3Passed: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Thử nếm cảm quan đạt chuẩn: thơm ngon, vừa khẩu vị lứa tuổi mầm non, không mùi lạ
                      </span>
                    </label>

                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs font-bold text-blue-900 mb-2">
                        Định lượng lưu mẫu (Tối thiểu 100g - 150g/món theo QĐ 1246):
                      </p>
                      <div className="space-y-2">
                        {dishes.map((dish, idx) => (
                          <div
                            key={dish.id}
                            className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-blue-100"
                          >
                            <span className="text-xs font-bold text-slate-700">{dish.name}</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                required
                                min="100"
                                max="500"
                                value={dish.qty}
                                onChange={(e) => {
                                  const updated = [...dishes];
                                  updated[idx].qty = e.target.value;
                                  setDishes(updated);
                                }}
                                className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg text-center font-bold text-slate-800"
                              />
                              <span className="text-xs text-slate-500 font-medium">gram</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ảnh khay thức ăn chia / Hộp lưu mẫu dán tem niêm phong
                    </label>
                    {form.step3Photo ? (
                      <div className="relative w-44 h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <img
                          src={URL.createObjectURL(form.step3Photo)}
                          alt="Preview B3"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, step3Photo: null })}
                          className="absolute top-1.5 right-1.5 bg-rose-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold hover:bg-rose-600"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-emerald-50/30 transition cursor-pointer">
                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs font-semibold text-slate-600">
                          Tải ảnh khay thức ăn hoặc hộp lưu mẫu
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files && setForm({ ...form, step3Photo: e.target.files[0] })
                          }
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú Bước 3</label>
                    <textarea
                      rows={2}
                      value={form.step3Note}
                      onChange={(e) => setForm({ ...form, step3Note: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Quay lại Bước 2
                    </button>
                    <button
                      type="submit"
                      disabled={!form.step3Passed}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Hoàn tất & Niêm phong mẫu lưu
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
          </div>
        </div>
      )}

      {/* ─── MODAL: XUẤT SỔ (PDF / EXCEL CHUẨN QĐ 1246) ─── */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Xuất Sổ Kiểm Thực Ba Bước</h3>
                  <p className="text-xs text-slate-500 font-medium">Chuẩn Quyết định 1246/QĐ-BYT</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có thể xuất toàn bộ danh sách <strong>{filteredRecords.length} biên bản</strong> hiện có ra file Excel (CSV có dấu UTF-8) hoặc in bản trình duyệt định dạng chuẩn thanh tra an toàn thực phẩm.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-between p-3.5 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                      Tải file Excel / CSV
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Bảng tính chi tiết 3 bước & nhiệt độ lưu mẫu
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={handlePrintInspectionBook}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-800 text-white rounded-xl shadow-sm">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-slate-800">
                      In sổ kiểm thực (PDF)
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Biểu mẫu hành chính trình đoàn kiểm tra ATTP
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal icon helper
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </svg>
);
