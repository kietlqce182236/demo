import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  Coffee,
  Sun,
  Moon,
  Clock,
  Sparkles,
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  Info,
  Check,
  X,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  Layers,
  HeartPulse,
} from 'lucide-react';
import { apiClient } from '../../../core/api/axios';

export interface DayboardingServiceItem {
  id: string;
  name: string;
  description: string;
  serviceType: string;
  billingCycle: string;
  pricePerUnit: number;
  isActive: boolean;
  availableFrom?: string;
  availableTo?: string;
}

export interface DayboardingClassItem {
  id: string;
  name: string;
  gradeLevel: string;
  academicYear: string;
  roomNumber: string;
  teacherName: string;
  teacherPhone: string;
  totalStudents: number;
  boardingCount: number;
  breakfastCount: number;
  snackCount: number;
  latePickupCount: number;
  allergyCount: number;
  dailyAttendanceStatus: string;
}

export interface DayboardingStudentItem {
  id: string;
  studentCode: string;
  fullName: string;
  className: string;
  classId: string;
  gradeLevel: string;
  gender: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  isDayboarding: boolean;
  isBreakfast: boolean;
  isSnack17h: boolean;
  isLatePickup: boolean;
  paymentStatus: 'PAID' | 'PENDING';
  allergies: string[];
  dietaryNotes: string;
}

export interface DayboardingSummary {
  totalStudents: number;
  dayboardingCount: number;
  breakfastCount: number;
  snackCount: number;
  latePickupCount: number;
  totalRevenueExpected: number;
  totalAllergyCases: number;
}

export const DayboardingServicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'classes' | 'students' | 'guidelines'>('catalog');
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<DayboardingSummary | null>(null);
  const [services, setServices] = useState<DayboardingServiceItem[]>([]);
  const [classes, setClasses] = useState<DayboardingClassItem[]>([]);
  const [students, setStudents] = useState<DayboardingStudentItem[]>([]);

  // Search & Filter state for students
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('ALL');

  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<DayboardingServiceItem | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    serviceType: 'DAYBOARDING_STANDARD',
    billingCycle: 'MONTHLY',
    pricePerUnit: 0,
    isActive: true,
  });

  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<DayboardingStudentItem | null>(null);
  const [enrollmentFormData, setEnrollmentFormData] = useState({
    isDayboarding: true,
    isBreakfast: false,
    isSnack17h: false,
    isLatePickup: false,
    dietaryNotes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/snack-services/dayboarding');
      const data = (res as any)?.data?.data || (res as any)?.data || res;
      if (data) {
        setSummary(data.summary || null);
        setServices(data.services || []);
        setClasses(data.classes || []);
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dịch vụ bán trú:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatVND = (num: number | undefined | null) => {
    const val = typeof num === 'number' && !isNaN(num) ? num : Number(num) || 0;
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case 'DAYBOARDING_STANDARD':
        return { label: 'Bán trú chuẩn', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'BREAKFAST':
        return { label: 'Ăn sáng tại trường', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'AFTER_SCHOOL_SNACK':
        return { label: 'Ăn xế 17h00', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'LATE_PICKUP':
        return { label: 'Trông ngoài giờ', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'FACILITIES_CARE':
        return { label: 'Đồ dùng & CSVC', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: 'Dịch vụ phụ', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getBillingCycleText = (cycle: string) => {
    switch (cycle) {
      case 'DAILY':
        return 'Theo ngày';
      case 'MONTHLY':
        return 'Theo tháng';
      case 'SEMESTER':
        return 'Theo học kỳ';
      case 'PER_MEAL':
        return 'Theo suất ăn';
      default:
        return cycle;
    }
  };

  // Open modal create/edit service
  const handleOpenCreateService = () => {
    setEditingService(null);
    setServiceFormData({
      name: '',
      description: '',
      serviceType: 'DAYBOARDING_STANDARD',
      billingCycle: 'MONTHLY',
      pricePerUnit: 35000,
      isActive: true,
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service: DayboardingServiceItem) => {
    setEditingService(service);
    const price = service.pricePerUnit ?? (service as any).feeAmount ?? 35000;
    const sType = service.serviceType ?? (service as any).type ?? 'DAYBOARDING_STANDARD';
    const active = service.isActive !== undefined ? Boolean(service.isActive) : (service as any).status === 'ACTIVE';

    setServiceFormData({
      name: service.name,
      description: service.description,
      serviceType: sType,
      billingCycle: service.billingCycle || 'DAILY',
      pricePerUnit: price,
      isActive: active,
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await apiClient.put(`/snack-services/${editingService.id}`, serviceFormData);
        alert('Cập nhật gói dịch vụ thành công!');
      } else {
        await apiClient.post('/snack-services', serviceFormData);
        alert('Thêm mới dịch vụ bán trú thành công!');
      }
      setIsServiceModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dịch vụ.');
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa hoặc tạm ngưng gói dịch vụ "${name}"?`)) return;
    try {
      await apiClient.delete(`/snack-services/${id}`);
      alert('Đã xóa dịch vụ thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa dịch vụ.');
    }
  };

  // Student enrollment modal
  const handleOpenEditEnrollment = (st: DayboardingStudentItem) => {
    setSelectedStudent(st);
    setEnrollmentFormData({
      isDayboarding: st.isDayboarding,
      isBreakfast: st.isBreakfast,
      isSnack17h: st.isSnack17h,
      isLatePickup: st.isLatePickup,
      dietaryNotes: st.dietaryNotes,
    });
    setIsEnrollmentModalOpen(true);
  };

  const handleSaveEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await apiClient.post('/snack-services/enrollment', {
        childId: selectedStudent.id,
        ...enrollmentFormData,
      });
      alert(`Đã cập nhật dịch vụ bán trú cho học sinh ${selectedStudent.fullName}!`);
      setIsEnrollmentModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật dịch vụ cho học sinh.');
    }
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.emergencyContactPhone.includes(studentSearch);

      const matchClass = selectedClassFilter === 'ALL' || s.className === selectedClassFilter || s.classId === selectedClassFilter;

      let matchService = true;
      if (selectedServiceFilter === 'BREAKFAST') matchService = s.isBreakfast;
      if (selectedServiceFilter === 'SNACK') matchService = s.isSnack17h;
      if (selectedServiceFilter === 'LATE_PICKUP') matchService = s.isLatePickup;
      if (selectedServiceFilter === 'ALLERGY') matchService = s.allergies && s.allergies.length > 0;

      return matchSearch && matchClass && matchService;
    });
  }, [students, studentSearch, selectedClassFilter, selectedServiceFilter]);

  // Export real Excel / CSV file
  const handleExportExcel = () => {
    if (students.length === 0) {
      alert('Chưa có dữ liệu học sinh để xuất báo cáo.');
      return;
    }

    const headers = [
      'STT',
      'Mã Học Sinh',
      'Họ Và Tên',
      'Lớp Học',
      'Khối Lớp',
      'Giới Tính',
      'Ngày Sinh',
      'Bán Trú Trưa',
      'Ăn Sáng',
      'Ăn Xế 17h',
      'Đón Muộn',
      'Cảnh Báo Dị Ứng Thực Phẩm',
      'Ghi Chú Dinh Dưỡng',
      'Người Liên Hệ',
      'Số Điện Thoại Phụ Huynh',
      'Tình Trạng Học Phí Bán Trú',
    ];

    const rows = students.map((st, index) => [
      index + 1,
      `"${st.studentCode}"`,
      `"${st.fullName}"`,
      `"${st.className}"`,
      `"${st.gradeLevel}"`,
      `"${st.gender}"`,
      `"${st.dateOfBirth}"`,
      st.isDayboarding ? 'Có' : 'Không',
      st.isBreakfast ? 'Có' : 'Không',
      st.isSnack17h ? 'Có' : 'Không',
      st.isLatePickup ? 'Có' : 'Không',
      st.allergies && st.allergies.length > 0 ? `"${st.allergies.join(', ')}"` : 'Không có',
      `"${(st.dietaryNotes || '').replace(/"/g, '""')}"`,
      `"${st.emergencyContactName}"`,
      `"${st.emergencyContactPhone}"`,
      st.paymentStatus === 'PAID' ? 'Đã thu phí' : 'Chờ nộp',
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Ban_Tru_Hoc_Duong_KidMeal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
            <span className="text-teal-600 font-semibold">Đơn vị KidMeal</span>
            <span>›</span>
            <span>Dịch vụ trường học</span>
            <span>›</span>
            <span className="text-slate-700 font-bold">Dịch vụ bán trú</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Quản lý Dịch vụ Bán Trú Học Đường
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
                Quản lý toàn diện các dịch vụ ăn uống và chăm sóc bán trú: Bữa trưa, phòng ngủ điều hòa, ăn sáng, ăn xế chiều 17h và trông muộn theo chuẩn Thông tư 28/2016/TT-BGDĐT.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất Báo Cáo Bán Trú (Excel)
          </button>
          <button
            onClick={handleOpenCreateService}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Thêm Dịch Vụ Mới
          </button>
        </div>
      </div>

      {/* 2. Top KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Học sinh bán trú */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Học sinh bán trú</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {summary?.dayboardingCount || 412}
              <span className="text-sm font-semibold text-slate-400"> / {summary?.totalStudents || 418}</span>
            </div>
            <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 inline" /> Tỷ lệ 98.6% sĩ số
            </p>
          </div>
        </div>

        {/* Card 2: Suất trưa & Ngủ trưa */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trưa & Ngủ trưa</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {summary?.dayboardingCount || 412} <span className="text-xs font-semibold text-slate-400">suất/ngày</span>
            </div>
            <p className="text-[11px] font-medium text-blue-600 mt-1 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 inline" /> Giường nệm riêng 100%
            </p>
          </div>
        </div>

        {/* Card 3: Ăn sáng tại trường */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ăn sáng tại trường</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {summary?.breakfastCount || 185} <span className="text-xs font-semibold text-slate-400">học sinh</span>
            </div>
            <p className="text-[11px] font-medium text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 inline" /> 7h00 - 7h45 sáng
            </p>
          </div>
        </div>

        {/* Card 4: Gói ăn xế chiều 17h */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ăn xế 17h00</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {summary?.snackCount || 242} <span className="text-xs font-semibold text-slate-400">học sinh</span>
            </div>
            <p className="text-[11px] font-medium text-orange-600 mt-1 flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5 inline" /> Năng lượng tăng cường
            </p>
          </div>
        </div>

        {/* Card 5: Dự thu bán trú tháng */}
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">Dự thu tháng</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-teal-200 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-white">
              {formatVND(summary?.totalRevenueExpected || 328500000)}
            </div>
            <p className="text-[11px] font-medium text-teal-200 mt-1">
              Ước tính theo 22 ngày ăn
            </p>
          </div>
        </div>
      </div>

      {/* 3. Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Danh Mục Dịch Vụ & Biểu Phí
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'catalog' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {services.length}
            </span>
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
            Bán Trú Từng Lớp Học
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'classes' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {classes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Sổ Đăng Ký Học Sinh
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'students' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'guidelines'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Info className="w-4 h-4" />
            Quy Định & Tiêu Chuẩn BGDĐT
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>Theo dõi cảnh báo: </span>
          <span className="font-bold text-slate-800">{summary?.totalAllergyCases || 8} trẻ dị ứng thực phẩm</span>
        </div>
      </div>

      {/* 4. Tab Content 1: Danh mục dịch vụ & biểu phí */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((item) => {
              const price = item.pricePerUnit ?? (item as any).feeAmount ?? 0;
              const serviceType = item.serviceType ?? (item as any).type ?? 'DAYBOARDING_STANDARD';
              const isActive = item.isActive !== undefined ? Boolean(item.isActive) : (item as any).status === 'ACTIVE';
              const badge = getServiceTypeBadge(serviceType);
              const monthlyEst =
                item.billingCycle === 'DAILY'
                  ? price * 22
                  : item.billingCycle === 'MONTHLY'
                  ? price
                  : price;

              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                    isActive ? 'border-slate-200/90' : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span className="text-[11px] font-semibold text-slate-500">
                          {isActive ? 'Đang áp dụng' : 'Tạm ngưng'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-lg font-black text-teal-700">
                          {formatVND(price)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {' '}
                          / {getBillingCycleText(item.billingCycle)}
                        </span>
                      </div>
                      {item.billingCycle === 'DAILY' && (
                        <span className="text-[11px] text-slate-400">
                          ~ {formatVND(monthlyEst)} /tháng
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditService(item)}
                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Chỉnh sửa đơn giá
                      </button>
                      <button
                        onClick={() => handleDeleteService(item.id, item.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Xóa dịch vụ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Tab Content 2: Tình trạng bán trú từng lớp học */}
      {activeTab === 'classes' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Thống Kê Tình Trạng Bán Trú Từng Lớp Học
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi quân số ăn trưa, ăn sáng, ăn xế 17h và trẻ có tiền sử dị ứng thực phẩm theo từng phòng học
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
              Niên khóa: 2024 - 2025
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">Lớp Học</th>
                  <th className="py-3.5 px-3">Phòng & GVCN</th>
                  <th className="py-3.5 px-3 text-center">Sĩ Số</th>
                  <th className="py-3.5 px-3 text-center">Bán Trú Trưa</th>
                  <th className="py-3.5 px-3 text-center">Ăn Sáng</th>
                  <th className="py-3.5 px-3 text-center">Ăn Xế 17h</th>
                  <th className="py-3.5 px-3 text-center">Đón Muộn</th>
                  <th className="py-3.5 px-3 text-center">Cảnh Báo Dị Ứng</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((cls) => {
                  const boardingPercent = Math.round((cls.boardingCount / cls.totalStudents) * 100) || 100;
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{cls.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{cls.gradeLevel}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800">{cls.teacherName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-teal-600 inline" /> {cls.teacherPhone}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center font-extrabold text-slate-900 text-sm">
                        {cls.totalStudents}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-teal-700">{cls.boardingCount}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({boardingPercent}%)</span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {cls.breakfastCount} trẻ
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                          {cls.snackCount} trẻ
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-medium text-slate-600">
                        {cls.latePickupCount} trẻ
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {cls.allergyCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[11px]">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                            {cls.allergyCount} trẻ
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">Không có</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            cls.dailyAttendanceStatus === 'ĐÃ CHỐT BÁN TRÚ'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cls.dailyAttendanceStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab Content 3: Sổ đăng ký dịch vụ của học sinh */}
      {activeTab === 'students' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden space-y-4 p-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Tìm học sinh theo tên, mã bé, số điện thoại phụ huynh..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả lớp học</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedServiceFilter}
                onChange={(e) => setSelectedServiceFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả dịch vụ</option>
                <option value="BREAKFAST">Có đăng ký Ăn sáng</option>
                <option value="SNACK">Có đăng ký Ăn xế 17h</option>
                <option value="LATE_PICKUP">Có đăng ký Đón muộn</option>
                <option value="ALLERGY">Có cảnh báo dị ứng</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Mã & Họ Tên Bé</th>
                  <th className="py-3 px-3">Lớp</th>
                  <th className="py-3 px-3">Dịch Vụ Bán Trú Đăng Ký</th>
                  <th className="py-3 px-3">Ghi Chú Dinh Dưỡng / Dị Ứng</th>
                  <th className="py-3 px-3">Phụ Huynh & SĐT</th>
                  <th className="py-3 px-3 text-center">Học Phí Bán Trú</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {st.fullName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">{st.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {st.studentCode} • {st.gender}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                        {st.className}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {st.isDayboarding && (
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-md font-bold text-[10px]">
                            Trưa + Ngủ
                          </span>
                        )}
                        {st.isBreakfast && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-[10px]">
                            Ăn sáng
                          </span>
                        )}
                        {st.isSnack17h && (
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md font-bold text-[10px]">
                            Ăn xế 17h
                          </span>
                        )}
                        {st.isLatePickup && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold text-[10px]">
                            Trông muộn
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 max-w-xs">
                      {st.allergies && st.allergies.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px] w-fit">
                            <ShieldAlert className="w-3 h-3 text-red-600" />
                            Dị ứng: {st.allergies.join(', ')}
                          </span>
                          <span className="text-[10px] text-slate-500 italic truncate">
                            {st.dietaryNotes}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">{st.dietaryNotes || 'Suất tiêu chuẩn'}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800 text-xs">
                        {st.emergencyContactName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {st.emergencyContactPhone}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {st.paymentStatus === 'PAID' ? 'Đã thu phí' : 'Chờ nộp'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenEditEnrollment(st)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition"
                      >
                        Sửa dịch vụ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Tab Content 4: Quy định & Tiêu chuẩn */}
      {activeTab === 'guidelines' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-2">
              Thông tư 28/2016/TT-BGDĐT
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quy định năng lượng bán trú tại trường chiếm 50 - 60% nhu cầu cả ngày của trẻ. Cân đối tỷ lệ P:L:G (Protein 13-20%, Lipid 25-35%, Glucid 52-60%). Đảm bảo tối thiểu 10 loại thực phẩm khác nhau trong mỗi bữa trưa chính.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <Moon className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-2">
              Tiêu Chuẩn Giấc Ngủ Bán Trú
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mỗi trẻ được trang bị giường bạt/nệm cá nhân riêng biệt, gối và chăn được giặt sấy hấp tiệt trùng định kỳ mỗi thứ Sáu hàng tuần. Phòng ngủ đảm bảo thoáng khí, nhiệt độ điều hòa duy trì 26 - 27°C.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center mb-3">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm mb-2">
              Quyết định 1246/QĐ-BYT (Kiểm thực 3 bước)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thực hiện nghiêm ngặt kiểm thực 3 bước (Trước chế biến, Trong chế biến, Trước khi ăn) và lưu mẫu thức ăn 24 giờ trong tủ lạnh chuyên dụng từ 0°C đến 5°C với sự giám sát của BGH và nhân viên y tế trường.
            </p>
          </div>
        </div>
      )}

      {/* MODAL 1: Thêm / Sửa Gói Dịch Vụ Bán Trú */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-teal-600" />
                {editingService ? 'Chỉnh Sửa Gói Dịch Vụ Bán Trú' : 'Thêm Mới Gói Dịch Vụ Bán Trú'}
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên dịch vụ bán trú <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={serviceFormData.name}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                  placeholder="VD: Bán Trú Tiêu Chuẩn (Bữa Trưa & Giường Nệm)"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại dịch vụ</label>
                  <select
                    value={serviceFormData.serviceType}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, serviceType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="DAYBOARDING_STANDARD">Bán trú tiêu chuẩn</option>
                    <option value="BREAKFAST">Ăn sáng tại trường</option>
                    <option value="AFTER_SCHOOL_SNACK">Ăn xế chiều 17h</option>
                    <option value="LATE_PICKUP">Trông ngoài giờ</option>
                    <option value="FACILITIES_CARE">Chăm sóc CSVC bán trú</option>
                    <option value="ORGANIC_FRUIT">Trái cây hữu cơ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chu kỳ tính phí</label>
                  <select
                    value={serviceFormData.billingCycle}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="DAILY">Theo ngày thực tế</option>
                    <option value="MONTHLY">Theo tháng (22 ngày)</option>
                    <option value="SEMESTER">Theo học kỳ</option>
                    <option value="PER_MEAL">Theo suất ăn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đơn vị định mức đơn giá (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={serviceFormData.pricePerUnit}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, pricePerUnit: Number(e.target.value) })}
                    className="w-full pl-3.5 pr-12 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-teal-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    VNĐ
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả dịch vụ & thực đơn</label>
                <textarea
                  rows={3}
                  value={serviceFormData.description}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                  placeholder="Mô tả tiêu chuẩn định lượng, giờ phục vụ, tiện ích đi kèm..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={serviceFormData.isActive}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Kích hoạt và áp dụng cho niên khóa hiện tại
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition"
                >
                  {editingService ? 'Lưu Thay Đổi' : 'Tạo Dịch Vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Cập Nhật Dịch Vụ Cho Học Sinh */}
      {isEnrollmentModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Cập Nhật Dịch Vụ Bán Trú
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedStudent.fullName} • {selectedStudent.className}
                </p>
              </div>
              <button
                onClick={() => setIsEnrollmentModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEnrollment} className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <div className="font-bold text-xs text-slate-800">Bán trú trưa & ngủ trưa</div>
                    <div className="text-[10px] text-slate-400">Suất ăn trưa dinh dưỡng + giường nệm riêng</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enrollmentFormData.isDayboarding}
                    onChange={(e) =>
                      setEnrollmentFormData({ ...enrollmentFormData, isDayboarding: e.target.checked })
                    }
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <div className="font-bold text-xs text-slate-800">Ăn sáng tại trường (7h00 - 7h45)</div>
                    <div className="text-[10px] text-slate-400">Phở, cháo, súp ấm nóng + sữa hạt</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enrollmentFormData.isBreakfast}
                    onChange={(e) =>
                      setEnrollmentFormData({ ...enrollmentFormData, isBreakfast: e.target.checked })
                    }
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <div className="font-bold text-xs text-slate-800">Ăn xế chiều tăng cường (17h00)</div>
                    <div className="text-[10px] text-slate-400">Sữa chua trái cây, bánh tart, sữa yến mạch</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enrollmentFormData.isSnack17h}
                    onChange={(e) =>
                      setEnrollmentFormData({ ...enrollmentFormData, isSnack17h: e.target.checked })
                    }
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <div className="font-bold text-xs text-slate-800">Trông trẻ ngoài giờ (17h15 - 18h30)</div>
                    <div className="text-[10px] text-slate-400">Giữ trẻ đón muộn có giáo viên kèm</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enrollmentFormData.isLatePickup}
                    onChange={(e) =>
                      setEnrollmentFormData({ ...enrollmentFormData, isLatePickup: e.target.checked })
                    }
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú kiêng cữ / Dị ứng thực phẩm riêng
                </label>
                <textarea
                  rows={2}
                  value={enrollmentFormData.dietaryNotes}
                  onChange={(e) =>
                    setEnrollmentFormData({ ...enrollmentFormData, dietaryNotes: e.target.value })
                  }
                  placeholder="VD: Kiêng hải sản vỏ cứng, không uống sữa bò..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEnrollmentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition"
                >
                  Lưu Đăng Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
