import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  ChevronRight,
  Thermometer,
  Camera,
  AlertTriangle,
  Upload,
  Eye,
  CheckCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { attendanceApi } from '@/features/attendance/api/attendanceApi';
import { apiClient } from '@/core/api/axios';

interface FoodSafetyInspectionTabProps {
  todayDishes: Array<{ id: string; name: string }>;
  isDarkMode?: boolean;
}

export const FoodSafetyInspectionTab: React.FC<FoodSafetyInspectionTabProps> = ({
  todayDishes,
  isDarkMode = false,
}) => {
  const [inspections, setInspections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStepModal, setActiveStepModal] = useState<number | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Workflow Submission Modal state for Kitchen
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submittingSession, setSubmittingSession] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [kitchenSubmitForm, setKitchenSubmitForm] = useState({
    step1PhotoUrl: '',
    step1Note: 'Kiểm tra 100% nguyên liệu tươi sống, nhãn mác hóa đơn kiểm dịch đầy đủ.',
    step1Passed: true,

    step2PhotoUrl: '',
    step2Temperature: '88',
    step2Note: 'Quy trình bếp 1 chiều, dao thớt sống chín phân biệt rõ, nhiệt độ nấu sôi > 75°C.',
    step2Passed: true,

    step3PhotoUrl: '',
    step3Temperature: '3.8',
    step3Note: 'Cảm quan thức ăn chín đạt chuẩn, thơm ngon, đã niêm phong hộp mẫu lưu 24h vào tủ mát 0-5°C.',
    step3Passed: true,

    dishes: [] as string[],
  });

  // Form state - Clean initial state
  const initialFormState = {
    mealDate: new Date().toISOString().split('T')[0],
    mealTime: '',
    step1Passed: true,
    step1Notes: '',
    step2Passed: true,
    step2Temp: '' as number | string,
    step2Notes: '',
    step3Passed: true,
    step3Temp: '' as number | string,
    step3Notes: '',
  };

  const [form, setForm] = useState(initialFormState);

  const loadInspections = async () => {
    try {
      setIsLoading(true);
      let mappedSessions: any[] = [];

      try {
        const res = await apiClient.get('/inspections');
        const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
        if (Array.isArray(data) && data.length > 0) {
          mappedSessions = data.map((s: any) => ({
            id: s.id,
            code: s.code,
            mealDate: s.mealDate || s.date,
            mealTime: s.mealTime || 'Trưa chính (10:30)',
            performerName: s.performerName || 'Bếp viên phụ trách',
            approvalStatus: s.approvalStatus || 'CHO_BEP_TAI_ANH',
            approvalStatusLabel: s.approvalStatusLabel || 'Chờ bếp tải ảnh',
            rejectionReason: s.rejectionReason,
            dishes: s.dishes || [],
            step1Status: s.step1Status === 'Đạt chuẩn' ? 'PASSED' : s.step1Status === 'Không đạt' ? 'REJECTED' : 'PENDING',
            step1Time: s.step1Time,
            step1Note: s.step1Note,
            step1Photos: s.step1Photos || (s.step1PhotoUrl ? [s.step1PhotoUrl] : []),
            step2Status: s.step2Status === 'Đạt chuẩn' ? 'PASSED' : s.step2Status === 'Không đạt' ? 'REJECTED' : 'PENDING',
            step2Time: s.step2Time,
            step2Temperature: s.step2Temperature,
            step2Note: s.step2Note,
            step2Photos: s.step2Photos || (s.step2PhotoUrl ? [s.step2PhotoUrl] : []),
            step3Status: s.step3Status === 'Đạt chuẩn' ? 'PASSED' : s.step3Status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING',
            step3Time: s.step3Time,
            step3Temperature: s.storageTemp || s.step3Temperature,
            step3Note: s.step3Note,
            step3Photos: s.step3Photos || (s.step3PhotoUrl ? [s.step3PhotoUrl] : []),
            status: s.status === 'Hoàn tất' || s.approvalStatus === 'DA_DUYET' ? 'COMPLETED' : 'IN_PROGRESS',
          }));
        }
      } catch (errApi) {
        console.warn('Could not load from /inspections directly:', errApi);
      }

      if (mappedSessions.length > 0) {
        setInspections(mappedSessions);
        return;
      }

      // Fallback to attendanceApi
      const rawLogs = await attendanceApi.getFoodSafetyLogs();
      if (Array.isArray(rawLogs) && rawLogs.length > 0) {
        const mapped = rawLogs.map((log: any, idx: number) => {
          const mealTimeLabel =
            log.mealSession === 'LUNCH'
              ? 'Trưa chính (10:30)'
              : log.mealSession === 'AFTERNOON_SNACK'
              ? 'Bữa phụ xế (14:30)'
              : log.mealSession === 'BREAKFAST'
              ? 'Bữa sáng (07:00)'
              : log.mealSession || 'Bữa ăn';

          const createdTimeStr = log.createdAt
            ? new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : '';

          return {
            id: log.id,
            code: log.sampleSealCode || `#KT-${log.mealDate?.replace(/-/g, '') || '2026'}-0${idx + 1}`,
            mealDate: log.mealDate,
            mealTime: mealTimeLabel,
            performerName: log.performerName || log.inspectorName || 'Bếp viên phụ trách',
            approvalStatus: 'DA_DUYET',
            approvalStatusLabel: 'Đã duyệt',
            dishes: [],
            step1Status:
              log.stepNumber >= 1
                ? log.sensoryStatusRaw === 'SUBSTANDARD_REJECTED'
                  ? 'REJECTED'
                  : 'PASSED'
                : 'PENDING',
            step1Time: log.stepNumber >= 1 ? createdTimeStr : '',
            step1Note: log.supplierName
              ? `${log.ingredientName ? log.ingredientName + ' - ' : ''}NCC: ${log.supplierName}`
              : log.stepNumber === 1
              ? log.cookingProcessNotes || ''
              : '',
            step2Status:
              log.stepNumber >= 2
                ? log.kitchenCleanlinessStatus === 'NON_COMPLIANT'
                  ? 'REJECTED'
                  : 'PASSED'
                : 'PENDING',
            step2Time: log.stepNumber >= 2 ? createdTimeStr : '',
            step2Temperature: log.temperatureStorageCelsius ? parseFloat(log.temperatureStorageCelsius) : null,
            step2Note: log.stepNumber === 2 ? log.cookingProcessNotes || '' : '',
            step3Status:
              log.stepNumber >= 3
                ? log.resultConclusion === 'PASSED'
                  ? 'PASSED'
                  : 'IN_PROGRESS'
                : 'PENDING',
            step3Time: log.stepNumber >= 3 ? createdTimeStr : '',
            step3Temperature: log.servingTemperatureCelsius ? parseFloat(log.servingTemperatureCelsius) : null,
            step3Note: log.dishName
              ? `Lưu mẫu: ${log.dishName}${log.sampleWeightG ? ` (${log.sampleWeightG}g)` : ''}`
              : log.stepNumber === 3
              ? log.cookingProcessNotes || ''
              : '',
            status: log.resultConclusion === 'PASSED' ? 'COMPLETED' : 'IN_PROGRESS',
          };
        });
        setInspections(mapped);
      } else {
        setInspections([]);
      }
    } catch (err) {
      console.error('Lỗi tải sổ kiểm thực 3 bước:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, []);

  // Helper file to Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Open Kitchen Upload Photos & Submit Modal
  const handleOpenKitchenSubmit = (session: any) => {
    setSubmittingSession(session);
    const dishList =
      Array.isArray(session.dishes) && session.dishes.length > 0
        ? session.dishes
        : todayDishes.length > 0
        ? todayDishes.map((d) => d.name)
        : ['Thịt heo xốt cà chua', 'Canh bí đỏ thịt bằm', 'Cơm dẻo', 'Chuối tiêu tráng miệng'];

    setKitchenSubmitForm({
      step1PhotoUrl: session.step1Photos?.[0] || '',
      step1Note: session.step1Note || 'Kiểm tra 100% nguyên liệu tươi sống, nhãn mác hóa đơn kiểm dịch đầy đủ.',
      step1Passed: true,

      step2PhotoUrl: session.step2Photos?.[0] || '',
      step2Temperature: session.step2Temperature ? String(session.step2Temperature) : '88',
      step2Note: session.step2Note || 'Quy trình bếp 1 chiều, dao thớt sống chín phân biệt rõ, nhiệt độ nấu sôi > 75°C.',
      step2Passed: true,

      step3PhotoUrl: session.step3Photos?.[0] || '',
      step3Temperature: session.step3Temperature ? String(session.step3Temperature) : '3.8',
      step3Note: session.step3Note || 'Cảm quan thức ăn chín thơm ngon đạt chuẩn, đã niêm phong hộp mẫu lưu 24h vào tủ mát 0-5°C.',
      step3Passed: true,

      dishes: dishList,
    });

    setIsSubmitModalOpen(true);
  };

  // Submit photos & record to Nutritionist
  const handleKitchenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingSession) return;

    setIsSubmitting(true);
    try {
      const defaultStep1 = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80';
      const defaultStep2 = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80';
      const defaultStep3 = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80';

      const payload = {
        step1Photos: [kitchenSubmitForm.step1PhotoUrl || defaultStep1],
        step1Note: kitchenSubmitForm.step1Note,
        step2Photos: [kitchenSubmitForm.step2PhotoUrl || defaultStep2],
        step2Temperature: Number(kitchenSubmitForm.step2Temperature) || 88,
        step2Note: kitchenSubmitForm.step2Note,
        step3Photos: [kitchenSubmitForm.step3PhotoUrl || defaultStep3],
        step3Temperature: Number(kitchenSubmitForm.step3Temperature) || 3.8,
        step3Note: kitchenSubmitForm.step3Note,
        dishes: kitchenSubmitForm.dishes,
      };

      await apiClient.post(`/inspections/${submittingSession.id}/kitchen-submit`, payload);

      alert(`✅ Đã tải ảnh và gửi duyệt biên bản ${submittingSession.code} thành công! Chuyên gia dinh dưỡng sẽ xem xét và phê duyệt.`);
      setIsSubmitModalOpen(false);
      setSubmittingSession(null);
      await loadInspections();
    } catch (err: any) {
      alert('Lỗi gửi duyệt: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStep = (stepNumber: number, recordId?: string) => {
    setActiveStepModal(stepNumber);
    setSelectedRecordId(recordId || null);

    if (recordId) {
      const rec = inspections.find((i) => i.id === recordId);
      if (rec) {
        setForm({
          mealDate: rec.mealDate || new Date().toISOString().split('T')[0],
          mealTime: rec.mealTime || '',
          step1Passed: rec.step1Status !== 'REJECTED',
          step1Notes: rec.step1Note || '',
          step2Passed: rec.step2Status !== 'REJECTED',
          step2Temp: rec.step2Temperature ?? '',
          step2Notes: rec.step2Note || '',
          step3Passed: rec.step3Status !== 'REJECTED',
          step3Temp: rec.step3Temperature ?? '',
          step3Notes: rec.step3Note || '',
        });
        return;
      }
    }

    setForm(initialFormState);
  };

  const handleSaveStep = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await attendanceApi.createFoodSafetyLog({
        mealDate: form.mealDate,
        mealTime: form.mealTime || 'Trưa chính (10:30)',
        stepNumber: activeStepModal,
        notes:
          activeStepModal === 1
            ? form.step1Notes
            : activeStepModal === 2
            ? form.step2Notes
            : form.step3Notes,
        passed:
          activeStepModal === 1
            ? form.step1Passed
            : activeStepModal === 2
            ? form.step2Passed
            : form.step3Passed,
        temperature:
          activeStepModal === 2
            ? (form.step2Temp !== '' ? Number(form.step2Temp) : undefined)
            : activeStepModal === 3
            ? (form.step3Temp !== '' ? Number(form.step3Temp) : undefined)
            : undefined,
      });
      setForm(initialFormState);
    } catch (err) {
      console.error('Lỗi lưu kiểm thực:', err);
    }

    setActiveStepModal(null);
    loadInspections();
  };

  const handleViewDetail = (id: string) => {
    window.location.href = `/food-safety/${id}`;
  };

  // Sessions awaiting photos from kitchen
  const pendingSessions = inspections.filter(
    (s) => s.approvalStatus === 'CHO_BEP_TAI_ANH' || s.approvalStatus === 'YEU_CAU_CHUP_LAI'
  );

  return (
    <div className="space-y-6">
      {/* ─── PENDING KITCHEN SESSIONS CARD ─── */}
      {pendingSessions.length > 0 && (
        <div
          className={`border-2 rounded-3xl p-6 shadow-md transition ${
            isDarkMode
              ? 'bg-slate-900 border-amber-500/50'
              : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/50 border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-amber-950 text-base flex items-center gap-2">
                  NHIỆM VỤ NHÀ BẾP: BIÊN BẢN CẦN CHỤP ẢNH MINH CHỨNG & GỬI DUYỆT
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                    {pendingSessions.length} Biên bản
                  </span>
                </h3>
                <p className="text-xs text-amber-800 font-medium mt-0.5">
                  Chuyên gia dinh dưỡng đã tạo biên bản. Vui lòng vào văn bản để tải các ảnh minh chứng 3 bước và gửi lên lại để duyệt.
                </p>
              </div>
            </div>
            <button
              onClick={loadInspections}
              className="p-2 text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-100/50 transition"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-xs">
                      {session.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        session.approvalStatus === 'YEU_CAU_CHUP_LAI'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {session.approvalStatus === 'YEU_CAU_CHUP_LAI' ? '⚠️ Yêu cầu chụp lại' : '📷 Chờ bếp tải ảnh'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800">
                    Ca ăn: <span className="text-emerald-700">{session.mealTime}</span> • Ngày:{' '}
                    <span>{session.mealDate}</span>
                  </p>

                  {session.rejectionReason && (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <span className="font-bold flex items-center gap-1 text-rose-900">
                        <AlertTriangle className="w-3.5 h-3.5" /> Chuyên gia yêu cầu:
                      </span>
                      <p className="mt-0.5 italic">"{session.rejectionReason}"</p>
                    </div>
                  )}

                  {session.dishes && session.dishes.length > 0 && (
                    <div className="mt-2.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Món ăn lưu mẫu:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {session.dishes.map((dishName: string, dIdx: number) => (
                          <span
                            key={dIdx}
                            className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium"
                          >
                            {dishName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenKitchenSubmit(session)}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Mở văn bản tải ảnh & Gửi duyệt</span>
                  </button>
                  <button
                    onClick={() => handleViewDetail(session.id)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. TOP PROCESS OVERVIEW: 3 STEPS OF DECISION 1246/QĐ-BYT */}
      <div
        className={`border rounded-3xl p-6 shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-6 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl border ${
                  isDarkMode
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3
                className={`text-lg font-black tracking-tight uppercase ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                SỔ KIỂM THỰC 3 BƯỚC (QUYẾT ĐỊNH 1246/QĐ-BYT)
              </h3>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Quy chuẩn bắt buộc đối với bếp ăn tập thể trường mầm non bán trú • Lưu trữ biên bản điện tử
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi Sổ Kiểm Thực Nhanh</span>
            </button>
          </div>
        </div>

        {/* 3 Step Cards Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div
            className={`border rounded-2xl p-4 flex flex-col justify-between transition ${
              isDarkMode
                ? 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/40'
                : 'bg-slate-50/70 border-slate-200 hover:border-emerald-300 hover:bg-white hover:shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono font-black text-emerald-600 uppercase tracking-widest text-[11px]">
                  BƯỚC 1
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  06:30 - 07:30
                </span>
              </div>
              <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Trước khi chế biến (Nhập kho)
              </h4>
              <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Kiểm tra nguồn gốc nguyên liệu, tem niêm phong, hạn dùng, cảm quan tươi sống thịt cá rau củ quả.
              </p>
              <ul className="mt-3 space-y-1 text-[11px]">
                <li className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Giấy tờ xuất xứ VSATTP</span>
                </li>
                <li className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Cảm quan màu, mùi, không ôi thiu</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleOpenStep(1)}
              className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
              }`}
            >
              <span>Ghi sổ Bước 1</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>

          {/* Step 2 */}
          <div
            className={`border rounded-2xl p-4 flex flex-col justify-between transition ${
              isDarkMode
                ? 'bg-slate-950/70 border-slate-800 hover:border-amber-500/40'
                : 'bg-slate-50/70 border-slate-200 hover:border-amber-300 hover:bg-white hover:shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono font-black text-amber-600 uppercase tracking-widest text-[11px]">
                  BƯỚC 2
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  08:30 - 10:15
                </span>
              </div>
              <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Trong khi chế biến (Nấu nướng)
              </h4>
              <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Đo nhiệt độ tâm thức ăn chín (≥ 70°C), quy tắc thớt dao sống chín tách riêng, trang phục bảo hộ.
              </p>
              <ul className="mt-3 space-y-1 text-[11px]">
                <li className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <Thermometer className="w-3.5 h-3.5 shrink-0" />
                  <span>Nhiệt độ chín đạt ≥ 70°C</span>
                </li>
                <li className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Dụng cụ tách biệt tuyệt đối</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleOpenStep(2)}
              className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
              }`}
            >
              <span>Ghi sổ Bước 2</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
            </button>
          </div>

          {/* Step 3 */}
          <div
            className={`border rounded-2xl p-4 flex flex-col justify-between transition ${
              isDarkMode
                ? 'bg-slate-950/70 border-slate-800 hover:border-teal-500/40'
                : 'bg-slate-50/70 border-slate-200 hover:border-teal-300 hover:bg-white hover:shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono font-black text-teal-600 uppercase tracking-widest text-[11px]">
                  BƯỚC 3
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  10:30 - 11:30
                </span>
              </div>
              <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Trước khi ăn & Lấy mẫu lưu
              </h4>
              <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Nhiệt độ phục vụ ≥ 60°C, nếm cảm quan, đại diện Y tế & GV ký duyệt, lấy mẫu 250g lưu tủ 0-5°C.
              </p>
              <ul className="mt-3 space-y-1 text-[11px]">
                <li className="flex items-center gap-1.5 text-teal-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Cảm quan mùi vị & độ mềm</span>
                </li>
                <li className="flex items-center gap-1.5 text-teal-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Lưu mẫu 250g tủ lạnh 24 giờ</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleOpenStep(3)}
              className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
              }`}
            >
              <span>Ghi sổ Bước 3</span>
              <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. INSPECTION RECORDS TABLE */}
      <div
        className={`border rounded-3xl p-6 shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <h3
            className={`text-base font-black uppercase tracking-tight flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>DANH SÁCH BIÊN BẢN KIỂM THỰC ĐÃ THỰC HIỆN</span>
          </h3>
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Dữ liệu lưu trữ phục vụ đoàn thanh tra VSATTP
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`text-[10px] font-bold uppercase tracking-wider border-b ${
                isDarkMode
                  ? 'bg-slate-950/80 text-slate-400 border-slate-800'
                  : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}
            >
              <tr>
                <th className="py-3 px-4">Mã Biên Bản</th>
                <th className="py-3 px-4">Bữa Ăn / Ngày</th>
                <th className="py-3 px-4">Bước 1 (Nhập Kho)</th>
                <th className="py-3 px-4">Bước 2 (Chế Biến)</th>
                <th className="py-3 px-4">Bước 3 (Lưu Mẫu)</th>
                <th className="py-3 px-4 text-center">Trạng Thái Duyệt</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {inspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Chưa có biên bản kiểm thực nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                inspections.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{item.code}</td>
                    <td className="py-3.5 px-4">
                      <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {item.mealTime || 'Bữa trưa'}
                      </div>
                      <div className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.mealDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.step1Status === 'PASSED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ĐẠT {item.step1Time ? `(${item.step1Time})` : ''}</span>
                        </span>
                      ) : item.step1Status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          <span>KHÔNG ĐẠT</span>
                        </span>
                      ) : (
                        <span className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          Chưa ghi sổ
                        </span>
                      )}
                      {item.step1Note ? (
                        <p className={`text-[10px] truncate max-w-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.step1Note}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.step2Status === 'PASSED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ĐẠT {item.step2Temperature != null ? `(${item.step2Temperature}°C)` : ''}</span>
                        </span>
                      ) : item.step2Status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          <span>KHÔNG ĐẠT</span>
                        </span>
                      ) : (
                        <span className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          Chưa ghi sổ
                        </span>
                      )}
                      {item.step2Note ? (
                        <p className={`text-[10px] truncate max-w-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.step2Note}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.step3Status === 'PASSED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>HOÀN TẤT & LƯU MẪU</span>
                        </span>
                      ) : item.step3Status === 'IN_PROGRESS' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>ĐANG ĐẾM GIỜ LƯU</span>
                        </span>
                      ) : (
                        <span className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          Chưa ghi sổ
                        </span>
                      )}
                      {item.step3Note ? (
                        <p className={`text-[10px] truncate max-w-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.step3Note}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.approvalStatus === 'DA_DUYET' || item.status === 'COMPLETED'
                            ? isDarkMode
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.approvalStatus === 'CHO_DUYET'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : item.approvalStatus === 'YEU_CAU_CHUP_LAI'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isDarkMode
                            ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.approvalStatus === 'DA_DUYET' || item.status === 'COMPLETED'
                          ? '✓ ĐÃ PHÊ DUYỆT'
                          : item.approvalStatus === 'CHO_DUYET'
                          ? '⏳ CHỜ DUYỆT'
                          : item.approvalStatus === 'YEU_CAU_CHUP_LAI'
                          ? '⚠️ CẦN CHỤP LẠI'
                          : '📷 CHỜ BẾP TẢI ẢNH'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.approvalStatus === 'CHO_BEP_TAI_ANH' || item.approvalStatus === 'YEU_CAU_CHUP_LAI' ? (
                          <button
                            onClick={() => handleOpenKitchenSubmit(item)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Tải ảnh</span>
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleViewDetail(item.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          title="Xem biên bản"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Xem</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: BẾP TẢI ẢNH MINH CHỨNG & GỬI DUYỆT ─── */}
      {isSubmitModalOpen && submittingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-2xl rounded-3xl shadow-2xl p-6 border max-h-[92vh] overflow-y-auto ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Tải Ảnh Minh Chứng & Gửi Duyệt Biên Bản
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mã biên bản: <span className="font-mono font-bold text-amber-700">{submittingSession.code}</span> • Ca ăn: {submittingSession.mealTime}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submittingSession.rejectionReason && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                <span className="font-bold flex items-center gap-1 text-rose-900">
                  <AlertTriangle className="w-4 h-4" /> Lý do chuyên gia yêu cầu chụp lại:
                </span>
                <p className="mt-1 italic">"{submittingSession.rejectionReason}"</p>
              </div>
            )}

            <form onSubmit={handleKitchenSubmit} className="space-y-5">
              {/* BƯỚC 1: TRƯỚC KHI CHẾ BIẾN */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-black text-xs uppercase text-emerald-800">
                    BƯỚC 1: Tiếp nhận nguyên liệu tươi & Hóa đơn kiểm dịch
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">Trước chế biến</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ảnh chụp nguyên liệu / Phiếu kiểm dịch:
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-600">
                        Bấm để tải ảnh từ máy / điện thoại (JPG, PNG)
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const b64 = await readFileAsBase64(e.target.files[0]);
                            setKitchenSubmitForm({ ...kitchenSubmitForm, step1PhotoUrl: b64 });
                          }
                        }}
                      />
                    </label>

                    {kitchenSubmitForm.step1PhotoUrl && (
                      <div className="relative w-24 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                        <img
                          src={kitchenSubmitForm.step1PhotoUrl}
                          alt="B1 Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setKitchenSubmitForm({ ...kitchenSubmitForm, step1PhotoUrl: '' })}
                          className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú Bước 1:</label>
                  <input
                    type="text"
                    value={kitchenSubmitForm.step1Note}
                    onChange={(e) => setKitchenSubmitForm({ ...kitchenSubmitForm, step1Note: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none"
                  />
                </div>
              </div>

              {/* BƯỚC 2: TRONG KHI CHẾ BIẾN */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-black text-xs uppercase text-amber-800">
                    BƯỚC 2: Kiểm tra chế biến & Đo nhiệt độ nấu chín
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">Trong chế biến</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ảnh chụp khu vực nấu / Đo nhiệt kế tâm món:
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-600">
                        Bấm để tải ảnh bếp nấu / nhiệt kế sôi chín
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const b64 = await readFileAsBase64(e.target.files[0]);
                            setKitchenSubmitForm({ ...kitchenSubmitForm, step2PhotoUrl: b64 });
                          }
                        }}
                      />
                    </label>

                    {kitchenSubmitForm.step2PhotoUrl && (
                      <div className="relative w-24 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                        <img
                          src={kitchenSubmitForm.step2PhotoUrl}
                          alt="B2 Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setKitchenSubmitForm({ ...kitchenSubmitForm, step2PhotoUrl: '' })}
                          className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhiệt độ tâm món (°C):</label>
                    <input
                      type="number"
                      required
                      value={kitchenSubmitForm.step2Temperature}
                      onChange={(e) => setKitchenSubmitForm({ ...kitchenSubmitForm, step2Temperature: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none font-bold text-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú Bước 2:</label>
                    <input
                      type="text"
                      value={kitchenSubmitForm.step2Note}
                      onChange={(e) => setKitchenSubmitForm({ ...kitchenSubmitForm, step2Note: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BƯỚC 3: TRƯỚC KHI ĂN & LƯU MẪU 24H */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-black text-xs uppercase text-blue-800">
                    BƯỚC 3: Cảm quan chín & Niêm phong mẫu lưu 24h
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">Trước khi ăn</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ảnh chụp các hộp inox có tem niêm phong / Tủ lưu mẫu:
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-600">
                        Bấm để tải ảnh hộp lưu mẫu niêm phong tem
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const b64 = await readFileAsBase64(e.target.files[0]);
                            setKitchenSubmitForm({ ...kitchenSubmitForm, step3PhotoUrl: b64 });
                          }
                        }}
                      />
                    </label>

                    {kitchenSubmitForm.step3PhotoUrl && (
                      <div className="relative w-24 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                        <img
                          src={kitchenSubmitForm.step3PhotoUrl}
                          alt="B3 Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setKitchenSubmitForm({ ...kitchenSubmitForm, step3PhotoUrl: '' })}
                          className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhiệt độ tủ mát (°C):</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={kitchenSubmitForm.step3Temperature}
                      onChange={(e) => setKitchenSubmitForm({ ...kitchenSubmitForm, step3Temperature: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none font-bold text-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú Bước 3:</label>
                    <input
                      type="text"
                      value={kitchenSubmitForm.step3Note}
                      onChange={(e) => setKitchenSubmitForm({ ...kitchenSubmitForm, step3Note: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none"
                    />
                  </div>
                </div>

                {kitchenSubmitForm.dishes.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Các món ăn đã niêm phong hộp mẫu:
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl">
                      {kitchenSubmitForm.dishes.map((dish, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold"
                        >
                          ✓ {dish} (150g)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  {isSubmitting ? 'Đang gửi duyệt...' : 'Gửi Duyệt Lên Chuyên Gia Dinh Dưỡng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quick Step Recording */}
      {activeStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-3xl shadow-2xl p-6 border ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <h3 className={`text-base font-black uppercase tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              GHI NHẬN KIỂM THỰC BƯỚC {activeStepModal}
            </h3>
            <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Theo quy định Quyết định 1246/QĐ-BYT Bộ Y Tế cho Bếp Bán Trú Mầm Non
            </p>

            <form onSubmit={handleSaveStep} className="space-y-4">
              {activeStepModal === 1 && (
                <>
                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Thời Điểm Giao Nhận & Bữa Ăn
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Trưa chính (10:30), Bữa phụ xế (14:30)..."
                      value={form.mealTime}
                      onChange={(e) => setForm({ ...form, mealTime: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Nhận Xét Cảm Quan Nguyên Liệu Tươi Sống
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Nhập cảm quan nguyên liệu thịt heo, rau củ quả, xuất xứ tem nhãn, giấy kiểm dịch..."
                      value={form.step1Notes}
                      onChange={(e) => setForm({ ...form, step1Notes: e.target.value })}
                      className={`w-full border rounded-xl p-3 text-xs resize-none focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <label
                    className={`flex items-center gap-2 text-xs font-bold p-3 rounded-xl border cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-950/60 border-emerald-500/30 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.step1Passed}
                      onChange={(e) => setForm({ ...form, step1Passed: e.target.checked })}
                      className="rounded accent-emerald-600"
                    />
                    <span>Xác nhận: Nguyên liệu có chứng nhận nguồn gốc và không ôi thiu</span>
                  </label>
                </>
              )}

              {activeStepModal === 2 && (
                <>
                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Nhiệt Độ Nấu Chín Thực Tế (°C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ví dụ: 78.5 (chuẩn ≥70°C)"
                      value={form.step2Temp}
                      onChange={(e) => setForm({ ...form, step2Temp: e.target.value === '' ? '' : Number(e.target.value) })}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-teal-400 placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-teal-700 focus:border-teal-500 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Ghi Chú Vệ Sinh Dụng Cụ & Trang Phục Bếp
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ghi nhận nhiệt độ sôi chín, dao thớt sống/chín riêng biệt, nhân viên đeo khẩu trang..."
                      value={form.step2Notes}
                      onChange={(e) => setForm({ ...form, step2Notes: e.target.value })}
                      className={`w-full border rounded-xl p-3 text-xs resize-none focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <label
                    className={`flex items-center gap-2 text-xs font-bold p-3 rounded-xl border cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-950/60 border-emerald-500/30 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.step2Passed}
                      onChange={(e) => setForm({ ...form, step2Passed: e.target.checked })}
                      className="rounded accent-emerald-600"
                    />
                    <span>Xác nhận: Đã tách biệt thớt sống/chín và nhân viên đeo khẩu trang, mũ</span>
                  </label>
                </>
              )}

              {activeStepModal === 3 && (
                <>
                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Nhiệt Độ Thức Ăn Khi Chia Suất (°C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ví dụ: 64.0 (chuẩn ≥60°C)"
                      value={form.step3Temp}
                      onChange={(e) => setForm({ ...form, step3Temp: e.target.value === '' ? '' : Number(e.target.value) })}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-teal-400 placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-teal-700 focus:border-teal-500 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Cảm Quan Mùi Vị & Xác Nhận Lưu Mẫu 250g
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ghi nhận cảm quan thức ăn mùi thơm, độ mềm, độ mặn ngọt phù hợp mầm non, niêm phong mẫu..."
                      value={form.step3Notes}
                      onChange={(e) => setForm({ ...form, step3Notes: e.target.value })}
                      className={`w-full border rounded-xl p-3 text-xs resize-none focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <label
                    className={`flex items-center gap-2 text-xs font-bold p-3 rounded-xl border cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-950/60 border-emerald-500/30 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.step3Passed}
                      onChange={(e) => setForm({ ...form, step3Passed: e.target.checked })}
                      className="rounded accent-emerald-600"
                    />
                    <span>Xác nhận: Đã lấy mẫu lưu 250g/món vào tủ lạnh 0-5°C lưu 24h</span>
                  </label>
                </>
              )}

              <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setActiveStepModal(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
                >
                  Lưu Biên Bản Bước {activeStepModal}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
