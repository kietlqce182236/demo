import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  ChevronRight,
  Thermometer,
} from 'lucide-react';
import { attendanceApi } from '@/features/attendance/api/attendanceApi';

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

  // Form state - Clean initial state without hardcoded mock data
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

    // Reset clean form for new entry
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

  return (
    <div className="space-y-6">
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

          <button
            onClick={() => handleOpenStep(1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Biên Bản Kiểm Thực Hôm Nay</span>
          </button>
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
                <th className="py-3 px-4">Bước 3 (Trước Khi Ăn)</th>
                <th className="py-3 px-4">Người Thực Hiện</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {inspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Chưa có biên bản kiểm thực nào trong hệ thống. Bấm "Tạo Biên Bản Kiểm Thực Hôm Nay" để bắt đầu ghi sổ.
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
                    <td className={`py-3.5 px-4 font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {item.performerName || 'Bếp viên'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.status === 'COMPLETED'
                            ? isDarkMode
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isDarkMode
                            ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.status === 'COMPLETED' ? '✓ ĐÃ HOÀN TẤT' : '⏳ ĐANG THỰC HIỆN'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
