import React, { useEffect, useState } from 'react';
import {
  X,
  Edit2,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Save,
  Tag,
  Clock,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from 'lucide-react';
import { fetchSnackServiceById, updateSnackService } from '../api/snackServicesApi';
import { UpdateSnackServiceDto } from '../types/snackServices';

interface Props {
  isOpen: boolean;
  serviceId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SERVICE_TYPE_OPTIONS = [
  { value: 'AFTER_SCHOOL_SNACK', label: 'Bữa ăn xế chiều' },
  { value: 'PREMIUM_MILK', label: 'Sữa tươi cao cấp' },
  { value: 'ORGANIC_FRUIT', label: 'Trái cây hữu cơ' },
  { value: 'CUSTOM_NUTRITION', label: 'Dinh dưỡng đặc biệt' },
];

const BILLING_CYCLE_OPTIONS = [
  { value: 'PER_MEAL', label: 'Theo bữa ăn (Theo ngày)' },
  { value: 'WEEKLY', label: 'Theo tuần' },
  { value: 'MONTHLY', label: 'Theo tháng' },
  { value: 'SEMESTER', label: 'Theo học kỳ' },
];

export const EditSnackServiceModal: React.FC<Props> = ({
  isOpen,
  serviceId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('AFTER_SCHOOL_SNACK');
  const [billingCycle, setBillingCycle] = useState('PER_MEAL');
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');

  useEffect(() => {
    if (isOpen && serviceId) {
      loadServiceDetail(serviceId);
      setSubmitMessage(null);
    }
  }, [isOpen, serviceId]);

  const loadServiceDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetchSnackServiceById(id);
      if (res.success && res.data) {
        const data = res.data;
        setName(data.name || '');
        setDescription(data.description || '');
        setServiceType(data.serviceType || 'AFTER_SCHOOL_SNACK');
        setBillingCycle(data.billingCycle || 'PER_MEAL');
        setPricePerUnit(Number(data.pricePerUnit) || 0);
        setIsActive(data.isActive ?? true);
        setAvailableFrom(data.availableFrom ? data.availableFrom.substring(0, 10) : '');
        setAvailableTo(data.availableTo ? data.availableTo.substring(0, 10) : '');
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin gói dịch vụ:', err);
      setSubmitMessage({ type: 'error', text: 'Không thể tải dữ liệu gói ăn xế từ cơ sở dữ liệu.' });
    } finally {
      setLoading(false);
    }
  };

  const monthlyEstimate = pricePerUnit * 22;
  const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) return;

    if (!name.trim()) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng nhập tên gói dịch vụ.' });
      return;
    }

    if (pricePerUnit < 0) {
      setSubmitMessage({ type: 'error', text: 'Đơn giá không được âm.' });
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const dto: UpdateSnackServiceDto = {
        name: name.trim(),
        description: description.trim(),
        serviceType,
        billingCycle,
        pricePerUnit,
        isActive,
        availableFrom: availableFrom || undefined,
        availableTo: availableTo || undefined,
      };

      const res = await updateSnackService(serviceId, dto);
      if (res.success) {
        setSubmitMessage({ type: 'success', text: res.message || 'Cập nhật cấu hình gói dịch vụ thành công!' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật gói dịch vụ.';
      setSubmitMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Slide-in Right Panel */}
      <div
        className="relative w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Edit2 className="w-4 h-4" />
              </div>
              Chỉnh Sửa Cấu Hình Gói Dịch Vụ
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 ml-10">
              UC57 • Cập nhật thông tin gói ăn xế, đơn giá và thời gian áp dụng trực tiếp trong PostgreSQL DB
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Đang tải dữ liệu thực từ database...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-6 flex-1 overflow-y-auto">

            {/* SECTION 1: Thông tin cơ bản */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Thông tin gói dịch vụ</h3>
                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold ml-auto">UC57 Config</span>
              </div>

              {/* Tên gói */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  Tên gói dịch vụ ăn xế *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  placeholder="Nhập tên gói..."
                  required
                />
              </div>

              {/* Loại dịch vụ & Chu kỳ tính phí */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Loại dịch vụ ăn xế *
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  >
                    {SERVICE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Chu kỳ tính phí *
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  >
                    {BILLING_CYCLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: Đơn giá & Thời gian */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Đơn giá & Thời gian áp dụng</h3>
              </div>

              {/* Đơn giá / ngày */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  Đơn giá / suất/bé/ngày (VNĐ) *
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="number"
                      value={pricePerUnit}
                      onChange={(e) => setPricePerUnit(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition pr-16"
                      min={0}
                      step={1000}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                      đ / ngày
                    </span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs flex-1">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Ước tính / tháng (22 ngày)</p>
                    <p className="text-sm font-black text-emerald-700 mt-0.5">
                      {formatVND(monthlyEstimate)} <span className="text-[10px] font-normal text-emerald-500">đ/tháng/trẻ</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Ngày bắt đầu & Ngày kết thúc */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Ngày bắt đầu áp dụng *
                  </label>
                  <input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Ngày kết thúc (Không bắt buộc)
                  </label>
                  <input
                    type="date"
                    value={availableTo}
                    onChange={(e) => setAvailableTo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Trạng thái & Mô tả */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Trạng thái & Mô tả chi tiết</h3>
              </div>

              {/* Toggle Active status */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-800">Trạng thái hoạt động gói dịch vụ</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isActive
                      ? 'Gói đang HOẠT ĐỘNG và cho phép đăng ký đợt'
                      : 'Gói đang ĐÓNG (ngừng tiếp nhận tạo đợt đăng ký mới)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                      : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
                  }`}
                >
                  {isActive ? (
                    <>
                      <ToggleRight className="w-4 h-4" /> Đang Mở
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" /> Đã Đóng
                    </>
                  )}
                </button>
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  Mô tả chi tiết thực đơn & giá trị dinh dưỡng
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Nhập mô tả chi tiết thực đơn..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition resize-none"
                />
              </div>
            </div>

            {/* Notification message */}
            {submitMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold ${
                  submitMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {submitMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{submitMessage.text}</span>
              </div>
            )}
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-200 bg-slate-50/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Hủy bỏ / Quay lại
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Đang lưu vào DB...' : 'Lưu Thay Đổi Cấu Hình'}
          </button>
        </div>
      </div>
    </div>
  );
};
