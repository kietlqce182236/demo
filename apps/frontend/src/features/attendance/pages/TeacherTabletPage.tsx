import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, CheckCircle2, XCircle, AlertTriangle, Utensils, 
  UtensilsCrossed, ShieldAlert, Lock, Check, Search, 
  Clock, ChefHat, RefreshCw, Send, Sparkles, UserCheck, 
  FileText, ArrowRight, MessageSquare
} from 'lucide-react';
import { attendanceApi } from '../api/attendanceApi';
import { MealStatusButton, ConsumptionStatus } from '../components/MealStatusButton';
import { 
  ClassItem, 
  AttendanceResponse, 
  ChildAttendanceItem, 
  MealOption, 
  MealEvaluationItem, 
  PortionType 
} from '../types';
import { getKitchenSocket } from '../../../core/socket';
import { useAuthStore } from '../../../core/stores/auth.store';

export const TeacherTabletPage: React.FC = () => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // Tab state: 'checkin' (Điểm danh Sĩ số Sáng) | 'evaluation' (Ghi nhận Bữa trưa)
  const [activeTab, setActiveTab] = useState<'checkin' | 'evaluation'>('checkin');

  // Filter & Search
  const [filterMode, setFilterMode] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'ALLERGY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data states
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [evaluations, setEvaluations] = useState<MealEvaluationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLockingKitchen, setIsLockingKitchen] = useState<boolean>(false);
  const [isSavingEvaluation, setIsSavingEvaluation] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  // Toast / feedback message
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Load Classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await attendanceApi.getClasses();
        setClasses(res || []);
        if (res && res.length > 0 && !selectedClassId) {
          // If user has a matching class by homeroom or name, pick it, else pick the first
          setSelectedClassId(res[0].id);
        }
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    };
    loadClasses();
  }, []);

  // 2. Fetch Attendance Data for Tab 1
  const fetchAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    setIsLoading(true);
    try {
      const data = await attendanceApi.getAttendanceList({
        classId: selectedClassId,
        date: selectedDate,
        limit: 100,
      });
      setAttendanceData(data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu điểm danh:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, selectedDate]);

  // 3. Fetch Meal Evaluation for Tab 2
  const fetchEvaluations = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      const res = await attendanceApi.getEvaluationList({
        classId: selectedClassId,
        date: selectedDate,
        mealType: 'LUNCH',
      });
      setEvaluations(res.children || []);
    } catch (err) {
      console.error('Failed to load evaluation list', err);
    }
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    if (selectedClassId) {
      fetchAttendance();
      fetchEvaluations();
    }
  }, [selectedClassId, selectedDate, fetchAttendance, fetchEvaluations]);

  // 4. Real-time WebSocket Listeners
  useEffect(() => {
    const socket = getKitchenSocket();
    const handleKitchenPortions = (payload: any) => {
      if (payload && payload.classId === selectedClassId) {
        showToast(payload.message || '👨‍🍳 Bếp trung tâm đã nhận số lượng suất ăn của lớp!', 'info');
        fetchAttendance();
      }
    };
    socket.on('KITCHEN_PORTIONS_ACKNOWLEDGED', handleKitchenPortions);
    return () => {
      socket.off('KITCHEN_PORTIONS_ACKNOWLEDGED', handleKitchenPortions);
    };
  }, [selectedClassId, fetchAttendance]);

  // 5. Actions for Tab 1 (Điểm danh & Báo suất Bếp)
  const handleUpdateChildMealOption = async (childId: string, mealOption: MealOption) => {
    if (!attendanceData) return;

    // Optimistic Update
    setAttendanceData((prev) => {
      if (!prev) return null;
      const isAbsent = mealOption === 'ABSENT';
      const updatedChildren = prev.children.map((c) =>
        c.id === childId ? { ...c, mealOption, isAbsent } : c
      );
      const registered = updatedChildren.filter((c) => !c.isAbsent).length;
      const absent = updatedChildren.length - registered;

      return {
        ...prev,
        summary: {
          ...prev.summary,
          registeredToday: registered,
          registeredRatioPercent: Math.round((registered / prev.summary.totalClassStudents) * 100),
          absentCount: absent,
        },
        children: updatedChildren,
      };
    });

    try {
      await attendanceApi.updateChildAttendance(childId, {
        date: selectedDate,
        mealOption,
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật điểm danh học sinh:', err);
      showToast('Lỗi cập nhật điểm danh', 'error');
      fetchAttendance();
    }
  };

  const handleMarkAllPresent = async () => {
    if (!selectedClassId) return;
    setIsMarkingAll(true);
    try {
      await attendanceApi.markAllPresent({
        classId: selectedClassId,
        date: selectedDate,
        mealOption: 'ALL_DAY',
      });
      showToast('Đã điểm danh tất cả học sinh có mặt ăn cả ngày!', 'success');
      await fetchAttendance();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi điểm danh tất cả', 'error');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleLockAndSendKitchen = async () => {
    if (!selectedClassId || !attendanceData) return;
    setIsLockingKitchen(true);
    try {
      await attendanceApi.lockAndSendToKitchen({
        classId: selectedClassId,
        date: selectedDate,
        notes: `Chốt sĩ số lớp lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
      });
      showToast('Đã chốt sĩ số và gửi trực tiếp về Nhà Bếp!', 'success');
      await fetchAttendance();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi chốt sĩ số gửi Bếp', 'error');
    } finally {
      setIsLockingKitchen(false);
    }
  };

  // 6. Actions for Tab 2 (Ghi nhận Sức ăn Bữa trưa)
  const mapPortionToConsumption = (p: PortionType): ConsumptionStatus => {
    if (p === 'ALL') return 'ATE_ALL';
    if (p === 'HALF') return 'ATE_HALF';
    return 'REFUSED';
  };

  const mapConsumptionToPortion = (c: ConsumptionStatus): PortionType => {
    if (c === 'ATE_ALL') return 'ALL';
    if (c === 'ATE_HALF') return 'HALF';
    return 'NONE';
  };

  const updateEvaluationStatus = async (childId: string, status: ConsumptionStatus) => {
    const portion = mapConsumptionToPortion(status);
    setEvaluations((prev) =>
      prev.map((e) => (e.id === childId ? { ...e, portionConsumed: portion } : e))
    );

    try {
      await attendanceApi.updateChildEvaluation(childId, {
        date: selectedDate,
        mealType: 'LUNCH',
        portionConsumed: portion,
      });
    } catch (err) {
      console.error('Lỗi khi lưu trạng thái ăn của trẻ:', err);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedClassId) return;
    setIsSavingEvaluation(true);
    try {
      await attendanceApi.lockAndSendEvaluation({
        classId: selectedClassId,
        date: selectedDate,
        mealType: 'LUNCH',
      });
      showToast('Đã lưu và đồng bộ đánh giá sức ăn về Nhà Bếp & Phụ Huynh!', 'success');
      fetchEvaluations();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đồng bộ đánh giá', 'error');
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  // Filtered children for Tab 1
  const filteredChildren = useMemo(() => {
    if (!attendanceData?.children) return [];
    return attendanceData.children.filter((c) => {
      // Filter by search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.fullName.toLowerCase().includes(q);
        const matchesCode = c.studentCode.toLowerCase().includes(q);
        if (!matchesName && !matchesCode) return false;
      }
      // Filter by status mode
      if (filterMode === 'PRESENT') return !c.isAbsent;
      if (filterMode === 'ABSENT') return c.isAbsent;
      if (filterMode === 'ALLERGY') return c.dietBadge?.type === 'ALLERGY' || c.dietBadge?.type === 'SPECIAL_CARE';
      return true;
    });
  }, [attendanceData?.children, searchQuery, filterMode]);

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentClassName = currentClass?.name || 'Lớp học';
  const summary = attendanceData?.summary;
  const kitchen = attendanceData?.kitchenConnection;
  const isLocked = kitchen?.isLocked || false;

  return (
    <div className="space-y-6">
      {/* ─── 1. TOP CLASS SĨ SỐ KPI BANNER (HIỆN RÕ SĨ SỐ LỚP CỦA GIÁO VIÊN) ─── */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/20">
              {currentClassName.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {currentClassName}
                </h2>
                {classes.length > 1 && (
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.totalStudents} bé)
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Năm học: {currentClass?.academicYear || '2026-2027'} • Phòng: {currentClass?.roomNumber || 'P.101'}
              </p>
            </div>
          </div>

          {/* Date Picker & Kitchen Status Pill */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-white transition"
            />
            {isLocked ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Đã chốt gửi Bếp
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Chưa chốt số liệu với Bếp
              </span>
            )}
          </div>
        </div>

        {/* 4 Cards: Sĩ số chi tiết của lớp */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Card 1: Tổng Sĩ Số Lớp */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Tổng Sĩ Số Lớp
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-black text-slate-900">
                {summary?.totalClassStudents || 0}
              </span>
              <span className="text-xs font-bold text-slate-500">học sinh</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600">
              100% học sinh đăng ký danh bộ
            </p>
          </div>

          {/* Card 2: Có Mặt Hôm Nay */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Có Mặt Đi Học
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-black text-emerald-800">
                {summary?.registeredToday || 0}
              </span>
              <span className="text-xs font-bold text-emerald-700">
                / {summary?.totalClassStudents || 0} bé
              </span>
            </div>
            <p className="text-[11px] font-bold text-emerald-700">
              Chuyên cần: {summary?.registeredRatioPercent || 0}%
            </p>
          </div>

          {/* Card 3: Vắng Mặt Hôm Nay */}
          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 space-y-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Vắng Mặt Hôm Nay
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-black text-rose-800">
                {summary?.absentCount || 0}
              </span>
              <span className="text-xs font-bold text-rose-700">bé nghỉ</span>
            </div>
            <p className="text-[11px] font-semibold text-rose-700">
              {summary?.absentPermitted || 0} có phép • {summary?.absentUnpermitted || 0} không phép
            </p>
          </div>

          {/* Card 4: Dị Ứng / Suất Riêng */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-1">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Dị Ứng / Suất Riêng
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-black text-amber-800">
                {summary?.dietSpecialCount || 0}
              </span>
              <span className="text-xs font-bold text-amber-700">khay riêng</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-700 truncate" title={summary?.dietSpecialSummary}>
              {summary?.dietSpecialSummary || 'Không có trẻ dị ứng'}
            </p>
          </div>
        </div>

        {/* Real-time Toast Alert */}
        {toast && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toast.text}</span>
          </div>
        )}
      </div>

      {/* ─── 2. SUB-TABS: CHUYỂN ĐỔI NGHIỆP VỤ GIÁO VIÊN ─── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl max-w-lg">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === 'checkin'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>1. Điểm Danh Sĩ Số & Báo Bếp</span>
        </button>
        <button
          onClick={() => setActiveTab('evaluation')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === 'evaluation'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>2. Ghi Nhận Sức Ăn Bữa Trưa</span>
        </button>
      </div>

      {/* ─── 3. TAB 1: ĐIỂM DANH SĨ SỐ SÁNG & BÁO SUẤT CHO NHÀ BẾP ─── */}
      {activeTab === 'checkin' && (
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-5">
          {/* Action Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search & Filters */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên bé hoặc mã..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterMode === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tất cả ({attendanceData?.children.length || 0})
                </button>
                <button
                  onClick={() => setFilterMode('PRESENT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterMode === 'PRESENT' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Đi học ({summary?.registeredToday || 0})
                </button>
                <button
                  onClick={() => setFilterMode('ABSENT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterMode === 'ABSENT' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Vắng ({summary?.absentCount || 0})
                </button>
                <button
                  onClick={() => setFilterMode('ALLERGY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterMode === 'ALLERGY' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Dị ứng ({summary?.dietSpecialCount || 0})
                </button>
              </div>
            </div>

            {/* Main Action Buttons: Điểm danh tất cả & Chốt gửi bếp */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllPresent}
                disabled={isMarkingAll || isLoading}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isMarkingAll ? 'Đang cập nhật...' : 'Điểm danh tất cả có mặt'}</span>
              </button>

              <button
                onClick={handleLockAndSendKitchen}
                disabled={isLockingKitchen || isLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <ChefHat className="w-4 h-4" />
                <span>{isLockingKitchen ? 'Đang gửi Bếp...' : 'Chốt Sĩ Số & Báo Bếp'}</span>
              </button>
            </div>
          </div>

          {/* Children Attendance Cards List */}
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-emerald-600" />
              Đang tải danh sách học sinh lớp {currentClassName}...
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Không tìm thấy học sinh nào theo bộ lọc đã chọn.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredChildren.map((child, idx) => {
                const isChildAbsent = child.mealOption === 'ABSENT';
                const hasAllergy = child.dietBadge?.type === 'ALLERGY' || child.dietBadge?.type === 'SPECIAL_CARE';

                return (
                  <div
                    key={child.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isChildAbsent
                        ? 'bg-rose-50/40 border-rose-200'
                        : hasAllergy
                        ? 'bg-amber-50/30 border-amber-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isChildAbsent
                              ? 'bg-rose-200 text-rose-800'
                              : hasAllergy
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {child.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">
                              {child.fullName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              #{child.studentCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {child.genderAgeText || (child.gender === 'FEMALE' ? 'Nữ' : 'Nam')}
                          </p>

                          {hasAllergy && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md mt-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {child.dietBadge.title || 'Dị ứng thực phẩm'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {isChildAbsent ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                            Nghỉ ăn
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            Có mặt
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meal Option Action Buttons (Touch buttons on tablet) */}
                    <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleUpdateChildMealOption(child.id, 'ALL_DAY')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                          child.mealOption === 'ALL_DAY'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Ăn cả ngày</span>
                      </button>

                      <button
                        onClick={() => handleUpdateChildMealOption(child.id, 'LUNCH_ONLY')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                          child.mealOption === 'LUNCH_ONLY'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Chỉ ăn trưa</span>
                      </button>

                      <button
                        onClick={() => handleUpdateChildMealOption(child.id, 'ABSENT')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                          child.mealOption === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Vắng mặt</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 4. TAB 2: GHI NHẬN SỨC ĂN BỮA TRƯA (HẾT SUẤT / 1/2 / BỎ BỮA) ─── */}
      {activeTab === 'evaluation' && (
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Đánh Giá Lượng Thức Ăn Trẻ Đã Tiêu Thụ – {currentClassName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chạm vào các nút để đánh giá tình trạng ăn của từng trẻ. Dữ liệu sẽ đồng bộ về Bếp và Phụ huynh.
              </p>
            </div>

            <button
              onClick={handleSaveEvaluation}
              disabled={isSavingEvaluation || evaluations.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSavingEvaluation ? 'Đang đồng bộ...' : 'Lưu & Đồng Bộ Bếp / PH'}</span>
            </button>
          </div>

          {evaluations.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Chưa có học sinh nào được điểm danh có mặt trong lớp này ngày hôm nay.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {evaluations.map((child, idx) => {
                const hasAllergy = child.menuBadge?.type === 'allergy';
                const allergyText = child.menuBadge?.label;

                return (
                  <div key={child.id} className="py-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-2xl transition">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-black text-sm text-slate-800">{child.fullName}</p>
                        {hasAllergy ? (
                          <span className="text-[11px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                            ⚠️ {allergyText}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Suất ăn tiêu chuẩn</span>
                        )}
                      </div>
                    </div>

                    <MealStatusButton
                      currentStatus={mapPortionToConsumption(child.portionConsumed)}
                      onChange={(newStatus) => updateEvaluationStatus(child.id, newStatus)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
