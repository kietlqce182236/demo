import React, { useState, useEffect } from 'react';
import { MealStatusButton, ConsumptionStatus } from '../components/MealStatusButton';
import { attendanceApi } from '../api/attendanceApi';
import { ClassItem, MealEvaluationItem, PortionType } from '../types';

export const TeacherTabletPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [evaluations, setEvaluations] = useState<MealEvaluationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load available classes from DB
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await attendanceApi.getClasses();
        setClasses(res || []);
        if (res && res.length > 0) {
          setSelectedClassId(res[0].id);
        }
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    };
    loadClasses();
  }, []);

  // Fetch real evaluations from DB
  const fetchEvaluations = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await attendanceApi.getEvaluationList({
        classId: selectedClassId,
        date,
        mealType: 'LUNCH',
      });
      setEvaluations(res.children || []);
    } catch (err) {
      console.error('Failed to load evaluation list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [selectedClassId, date]);

  // Convert PortionType to ConsumptionStatus
  const mapPortionToConsumption = (p: PortionType): ConsumptionStatus => {
    if (p === 'ALL') return 'ATE_ALL';
    if (p === 'HALF') return 'ATE_HALF';
    return 'REFUSED';
  };

  // Convert ConsumptionStatus to PortionType
  const mapConsumptionToPortion = (c: ConsumptionStatus): PortionType => {
    if (c === 'ATE_ALL') return 'ALL';
    if (c === 'ATE_HALF') return 'HALF';
    return 'NONE';
  };

  const updateStatus = async (childId: string, status: ConsumptionStatus) => {
    const portion = mapConsumptionToPortion(status);
    // Optimistic UI update
    setEvaluations((prev) =>
      prev.map((e) => (e.id === childId ? { ...e, portionConsumed: portion } : e))
    );

    try {
      await attendanceApi.updateChildEvaluation(childId, {
        date,
        mealType: 'LUNCH',
        portionConsumed: portion,
      });
    } catch (err) {
      console.error('Lỗi khi lưu trạng thái ăn của trẻ:', err);
    }
  };

  const handleSaveAndSync = async () => {
    if (!selectedClassId) return;
    setSaving(true);
    try {
      await attendanceApi.lockAndSendEvaluation({
        classId: selectedClassId,
        date,
        mealType: 'LUNCH',
      });
      setMessage({ text: 'Đã lưu và đồng bộ thành công về Bếp!', type: 'success' });
      fetchEvaluations();
    } catch (err: any) {
      setMessage({ text: 'Lỗi: ' + (err.message || 'Không thể đồng bộ'), type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const currentClassName = classes.find((c) => c.id === selectedClassId)?.name || 'Lớp học';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center bg-slate-50">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-slate-800">Ghi nhận Bữa trưa – {currentClassName}</h2>
            {classes.length > 1 && (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-medium"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Chạm để cập nhật tình trạng ăn của từng trẻ (Ngày: {date})</p>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </span>
          )}
          <button
            onClick={handleSaveAndSync}
            disabled={saving || loading || evaluations.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition"
          >
            {saving ? 'Đang đồng bộ...' : 'Lưu & Đồng bộ về Bếp'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách học sinh từ cơ sở dữ liệu...</div>
      ) : evaluations.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          Chưa có học sinh nào được điểm danh có mặt trong lớp này ngày hôm nay.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {evaluations.map((child, idx) => {
            const hasAllergy = child.menuBadge?.type === 'allergy';
            const allergyText = child.menuBadge?.label;

            return (
              <div key={child.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{child.fullName}</p>
                    {hasAllergy ? (
                      <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        ⚠️ {allergyText}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Không có dị ứng</span>
                    )}
                  </div>
                </div>

                <MealStatusButton
                  currentStatus={mapPortionToConsumption(child.portionConsumed)}
                  onChange={(newStatus) => updateStatus(child.id, newStatus)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
