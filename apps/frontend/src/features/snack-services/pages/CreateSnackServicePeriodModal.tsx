import React, { useState } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Sparkles,
  FileText,
  Zap,
  Coffee,
  Info,
  Clock,
  AlertTriangle,
  Utensils,
} from 'lucide-react';
import { createSnackServicePeriod } from '../api/snackServicesApi';
import { CreateSnackServicePeriodDto } from '../types/snackServices';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GRADE_OPTIONS = [
  { value: 'ALL', label: 'Toàn trường' },
  { value: 'TODDLER_1_2Y', label: 'Nhà trẻ (1.5 - 3T)' },
  { value: 'KINDERGARTEN_3_4Y', label: 'Lớp Mầm (3 - 4T)' },
  { value: 'KINDERGARTEN_4_5Y', label: 'Lớp Chồi (4 - 5T)' },
  { value: 'KINDERGARTEN_5_6Y', label: 'Lớp Lá (5 - 6T)' },
];

const PRESET_PACKAGES = [
  {
    name: 'Gói Ăn Sáng Trải Nghiệm 1 Tuần (5 bữa)',
    mealCount: 5,
    feeAmount: 125000,
    days: 7,
    notes: 'Cháo bò bằm cà rốt, phở bò mầm non, súp gà ngô non, sữa tươi tiệt trùng.',
  },
  {
    name: 'Gói Ăn Sáng Tiêu Chuẩn 1 Tháng (22 bữa)',
    mealCount: 22,
    feeAmount: 480000,
    days: 30,
    notes: 'Phở gà ta, cháo chim bồ câu hạt sen, bún mọc nấm hương, súp cá hồi rau củ, sữa hạt tươi tự nấu.',
  },
  {
    name: 'Gói Ăn Sáng Dinh Dưỡng Cao Cấp (22 bữa)',
    mealCount: 22,
    feeAmount: 550000,
    days: 30,
    notes: 'Thực đơn thượng hạng: Cháo cá hồi Nauy, phở bò Kobe mầm non, yến chưng hạt chia, sữa hạt óc chó macca.',
  },
  {
    name: 'Gói Ăn Sáng Trọn Học Kỳ I (66 bữa)',
    mealCount: 66,
    feeAmount: 1350000,
    days: 90,
    notes: 'Trọn gói học kỳ 3 tháng. Tặng kèm hoa quả tươi nhập khẩu và sữa chua men sống mỗi sáng.',
  },
];

export const CreateSnackServicePeriodModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [packageName, setPackageName] = useState('Gói Ăn Sáng Tiêu Chuẩn Tháng 11/2026 (22 bữa)');
  const [mealCount, setMealCount] = useState<number>(22);
  const [feeAmount, setFeeAmount] = useState<number>(480000);
  const [selectedGrades, setSelectedGrades] = useState<string[]>(['ALL']);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [registrationDeadline, setRegistrationDeadline] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)
  );
  const [menuNotes, setMenuNotes] = useState(
    'Thực đơn ăn sáng nóng hổi phục vụ lúc 07h15 - 08h00: Phở gà, cháo bò bằm bí đỏ, súp gà ngô non & sữa hạt tươi chuẩn 295 kcal.'
  );

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof PRESET_PACKAGES)[0]) => {
    setPackageName(preset.name);
    setMealCount(preset.mealCount);
    setFeeAmount(preset.feeAmount);
    setMenuNotes(preset.notes);
    const start = new Date();
    const end = new Date(start.getTime() + preset.days * 86400000);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const toggleGrade = (grade: string) => {
    if (grade === 'ALL') {
      setSelectedGrades(['ALL']);
      return;
    }
    const filtered = selectedGrades.filter((g) => g !== 'ALL');
    if (filtered.includes(grade)) {
      const next = filtered.filter((g) => g !== grade);
      setSelectedGrades(next.length === 0 ? ['ALL'] : next);
    } else {
      setSelectedGrades([...filtered, grade]);
    }
  };

  const pricePerMeal = Math.round(feeAmount / (mealCount || 1));
  const formatVND = (amt: number) => new Intl.NumberFormat('vi-VN').format(amt);

  const handleSubmit = async (publishStatus: 'OPEN' | 'CLOSED') => {
    if (!packageName.trim()) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng nhập tên gói ăn sáng.' });
      return;
    }
    if (feeAmount <= 0) {
      setSubmitMessage({ type: 'error', text: 'Đơn giá gói phải lớn hơn 0 đ.' });
      return;
    }
    if (!startDate || !endDate) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng chọn thời gian bắt đầu và kết thúc gói.' });
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const dto: CreateSnackServicePeriodDto = {
        name: packageName.trim(),
        feeAmount: Number(feeAmount),
        startDate,
        endDate,
        registrationDeadline: registrationDeadline || undefined,
        status: publishStatus,
        appliedGrades: selectedGrades,
        nutritionNotes: menuNotes,
      };

      const res = await createSnackServicePeriod(dto);
      setSubmitMessage({
        type: 'success',
        text:
          publishStatus === 'OPEN'
            ? `Đã tạo "${packageName}" thành công! Gói đã hiển thị trên Cổng Phụ huynh để phụ huynh mua ngay qua VNPAY.`
            : `Đã lưu nháp "${packageName}" thành công (Trạng thái tạm khóa).`,
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra khi tạo gói ăn sáng.';
      setSubmitMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-in Right Panel */}
      <div
        className="relative w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-teal-50/70 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Tạo Gói Dịch Vụ Ăn Sáng Mới
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Khi Hiệu trưởng tạo và mở đợt, phụ huynh sẽ thấy ngay trên Cổng Phụ huynh để chọn và thanh toán qua VNPAY.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Quick Preset Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Chọn nhanh gói mẫu tiêu chuẩn
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_PACKAGES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    packageName === p.name
                      ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-1 ring-teal-500'
                      : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-extrabold text-slate-900 line-clamp-1">{p.name}</p>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-teal-700 font-bold">{formatVND(p.feeAmount)} đ</span>
                    <span className="text-slate-500 font-medium">{p.mealCount} bữa</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Tên gói & Đơn giá */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tên gói ăn sáng hiển thị cho phụ huynh *
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="VD: Gói Ăn Sáng Tiêu Chuẩn Tháng 11/2026 (22 bữa)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Số bữa ăn sáng trong gói *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={mealCount}
                    onChange={(e) => setMealCount(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    bữa
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Đơn giá trọn gói (VND) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(Number(e.target.value))}
                    min={0}
                    step={10000}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    đ
                  </span>
                </div>
              </div>
            </div>

            {/* Price breakdown pill */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-teal-800 font-medium">Đơn giá trung bình mỗi bữa sáng:</span>
              <span className="font-black text-teal-700 text-sm">
                ~ {formatVND(pricePerMeal)} đ / bữa
              </span>
            </div>
          </div>

          {/* Section 2: Thời gian áp dụng */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              Thời gian phục vụ & Hạn chót đăng ký
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ngày bắt đầu phục vụ *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ngày kết thúc phục vụ *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Hạn chót phụ huynh đăng ký trên App
              </label>
              <input
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Section 3: Khối lớp áp dụng */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Khối lớp áp dụng
            </label>
            <div className="flex flex-wrap gap-2">
              {GRADE_OPTIONS.map((g) => {
                const isSelected = selectedGrades.includes(g.value);
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => toggleGrade(g.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Thực đơn & Dinh dưỡng */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả thực đơn & Tiêu chuẩn dinh dưỡng (07h15 - 08h00)
            </label>
            <textarea
              value={menuNotes}
              onChange={(e) => setMenuNotes(e.target.value)}
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition resize-none"
              placeholder="VD: Phở gà, cháo bò, súp ngô non & sữa hạt tự nấu chuẩn 295 kcal..."
            />
          </div>

          {/* Notice */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
            <Zap className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong>Cơ chế tự động đồng bộ Cổng Phụ huynh:</strong> Khi chọn{' '}
              <span className="font-bold underline">"Mở bán cho Phụ huynh"</span>, gói ăn sáng này sẽ
              ngay lập tức xuất hiện trong mục <em>"Gói dịch vụ ăn sáng"</em> của Cổng Phụ huynh.
              Phụ huynh có thể nhấn mua và thanh toán Sandbox qua VNPAY ngay tức thì.
            </div>
          </div>

          {/* Submit Message */}
          {submitMessage && (
            <div
              className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-bold ${
                submitMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {submitMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              {submitMessage.text}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-5 border-t border-slate-200 bg-slate-50/80 shrink-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleSubmit('CLOSED')}
              disabled={submitting}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              Lưu bản nháp (Tạm khóa)
            </button>
            <button
              onClick={() => handleSubmit('OPEN')}
              disabled={submitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {submitting ? 'Đang khởi tạo...' : 'Kích hoạt & Mở bán cho Phụ huynh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
