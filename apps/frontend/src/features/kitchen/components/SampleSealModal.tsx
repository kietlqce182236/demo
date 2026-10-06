import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SampleSealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSample: any) => void;
  todayDishes: Array<{ id: string; name: string }>;
  isDarkMode?: boolean;
}

export const SampleSealModal: React.FC<SampleSealModalProps> = ({
  isOpen,
  onClose,
  onSave,
  todayDishes,
  isDarkMode = false,
}) => {
  const [dishName, setDishName] = useState(todayDishes[0]?.name || '');
  const [mealSession, setMealSession] = useState('Trưa chính (10:30)');
  const [sampleWeight, setSampleWeight] = useState(250);
  const [storageTemp, setStorageTemp] = useState(3.4);
  const [fridgeUnit, setFridgeUnit] = useState('Tủ Mát Lưu Mẫu');
  const [collectorName, setCollectorName] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const newRecord = {
      id: Math.random().toString(36).substring(2, 9),
      code: `SMP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`,
      dishName,
      mealSession,
      mealDate: now.toLocaleDateString('vi-VN'),
      sampleWeight,
      storageTemp,
      fridgeUnit,
      collectorName,
      sealedAt: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('vi-VN'),
      expiresAt: expiry.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + expiry.toLocaleDateString('vi-VN'),
      status: 'RETAINED' as const,
      countdownHours: 24,
      notes,
    };

    onSave(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all ${
          isDarkMode
            ? 'bg-slate-900 border border-slate-700 text-slate-100'
            : 'bg-white border border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isDarkMode
                  ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                  : 'bg-teal-50 text-teal-600 border-teal-200'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`text-base font-black uppercase tracking-wider ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                LẤY MẪU & NIÊM PHONG THỨC ĂN 24H
              </h3>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Quyết định 1246/QĐ-BYT • Tiêu chuẩn mầm non
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${
              isDarkMode
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Dish Selection */}
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Món Ăn Lưu Mẫu *
            </label>
            <select
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              required
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition ${
                isDarkMode
                  ? 'bg-slate-800 border border-slate-700 text-white focus:border-teal-400'
                  : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-teal-500'
              }`}
            >
              {todayDishes.length > 0 ? (
                todayDishes.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="Cơm tẻ dẻo ST25">Cơm tẻ dẻo ST25</option>
                  <option value="Thịt kho trứng cút">Thịt kho trứng cút</option>
                  <option value="Canh cải bó xôi thịt bằm">Canh cải bó xôi thịt bằm</option>
                  <option value="Su hào xào nấm">Su hào xào nấm</option>
                  <option value="Chuối tiêu tráng miệng">Chuối tiêu tráng miệng</option>
                  <option value="Sữa chua yến mạch ăn xế">Sữa chua yến mạch ăn xế</option>
                </>
              )}
            </select>
          </div>

          {/* Session & Weight Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Bữa Ăn
              </label>
              <select
                value={mealSession}
                onChange={(e) => setMealSession(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition ${
                  isDarkMode
                    ? 'bg-slate-800 border border-slate-700 text-white focus:border-teal-400'
                    : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-teal-500'
                }`}
              >
                <option value="Bữa sáng (07:30)">Bữa sáng (07:30)</option>
                <option value="Trưa chính (10:30)">Trưa chính (10:30)</option>
                <option value="Bữa phụ xế (14:30)">Bữa phụ xế (14:30)</option>
                <option value="Bữa ăn xế muộn (17:00)">Bữa ăn xế muộn (17:00)</option>
              </select>
            </div>

            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Khối Lượng Mẫu (gram) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  max="500"
                  value={sampleWeight}
                  onChange={(e) => setSampleWeight(Number(e.target.value))}
                  required
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition ${
                    isDarkMode
                      ? 'bg-slate-800 border border-slate-700 text-emerald-400 focus:border-teal-400'
                      : 'bg-slate-50 border border-slate-300 text-emerald-700 focus:bg-white focus:border-teal-500'
                  }`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  gram (≥100g)
                </span>
              </div>
            </div>
          </div>

          {/* Fridge & Temperature Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Tủ Lưu Mẫu
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Tủ Sanaky #01 - Khay A1"
                value={fridgeUnit}
                onChange={(e) => setFridgeUnit(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition ${
                  isDarkMode
                    ? 'bg-slate-800 border border-slate-700 text-white focus:border-teal-400 placeholder-slate-500'
                    : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-teal-500 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Nhiệt Độ Tủ (°C) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="3.4"
                  value={storageTemp}
                  onChange={(e) => setStorageTemp(Number(e.target.value))}
                  required
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition ${
                    isDarkMode
                      ? 'bg-slate-800 border border-slate-700 text-teal-400 focus:border-teal-400 placeholder-slate-500'
                      : 'bg-slate-50 border border-slate-300 text-teal-700 focus:bg-white focus:border-teal-500 placeholder-slate-400'
                  }`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  °C (0 - 5°C)
                </span>
              </div>
            </div>
          </div>

          {/* Collector Name */}
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Người Lấy Mẫu & Niêm Phong *
            </label>
            <input
              type="text"
              placeholder="Nhập họ tên nhân viên / bếp trưởng lấy mẫu..."
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              required
              className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition ${
                isDarkMode
                  ? 'bg-slate-800 border border-slate-700 text-white focus:border-teal-400 placeholder-slate-500'
                  : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-teal-500 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Notes */}
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Ghi Chú Cảm Quan & Dụng Cụ
            </label>
            <textarea
              rows={2}
              placeholder="Ghi nhận dụng cụ lấy mẫu vô trùng, tem niêm phong, hạn dùng..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full rounded-xl p-3 text-xs focus:outline-none transition resize-none ${
                isDarkMode
                  ? 'bg-slate-800 border border-slate-700 text-slate-200 focus:border-teal-400 placeholder-slate-500'
                  : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-teal-500 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Alert Notice */}
          <div
            className={`p-3 rounded-2xl flex items-start gap-2 text-xs border ${
              isDarkMode
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Hộp lưu mẫu sẽ được tự động kích hoạt bộ đếm ngược 24 giờ. Nghiêm cấm mở nắp hoặc hủy mẫu trước 24 giờ
              nếu chưa có chỉ đạo của Ban Giám Hiệu.
            </span>
          </div>

          {/* Submit Controls */}
          <div
            className={`flex items-center justify-end gap-3 pt-3 border-t ${
              isDarkMode ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isDarkMode
                  ? 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận & Niêm Phong Hộp Mẫu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
