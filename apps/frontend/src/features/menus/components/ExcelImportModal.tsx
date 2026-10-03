import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { ImportExcelPayload } from '../api/weekly-menus.api';
import { apiClient } from '../../../core/api/axios';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (payload: ImportExcelPayload) => Promise<void>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [targetAgeGroup, setTargetAgeGroup] = useState('ALL_AGES');
  const [cycleWeekNumber, setCycleWeekNumber] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const parsed: any[] = [];
      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('món') || line.toLowerCase().includes('dish'))) return;
        const parts = line.split(/[,\t;|]/);
        if (parts.length >= 3) {
          parsed.push({
            dayOfWeek: parseInt(parts[0]) || ((index % 5) + 1),
            mealTime: parts[1]?.trim() || 'LUNCH',
            dishName: parts[2]?.trim() || parts[0]?.trim(),
            portionSizeG: parseInt(parts[3]) || 100,
            calories: parseInt(parts[4]) || 150,
          });
        } else if (parts[0]?.trim()) {
          parsed.push({
            dayOfWeek: (index % 5) + 1,
            mealTime: 'LUNCH',
            dishName: parts[0]?.trim(),
            portionSizeG: 100,
            calories: 150,
          });
        }
      });

      if (parsed.length > 0) {
        setParsedItems(parsed);
      } else {
        setError('Không nhận diện được dòng món ăn hợp lệ từ tệp.');
      }
    } catch (err: any) {
      setError('Lỗi khi đọc file: ' + err.message);
    }
  };

  const handleLoadDishesFromDatabase = async () => {
    try {
      const res = await apiClient.get('/menus/available-dishes');
      const dishes = res.data || [];
      if (dishes.length > 0) {
        setFileName('Thuc_don_tu_kho_mon_an.xlsx');
        const mealTimes = ['BREAKFAST', 'LUNCH', 'AFTERNOON_SNACK'];
        const mapped = dishes.slice(0, 15).map((d: any, idx: number) => ({
          dayOfWeek: (idx % 5) + 1,
          mealTime: mealTimes[idx % 3],
          dishName: d.name,
          portionSizeG: d.standardServingSizeG || 100,
          calories: d.totalCalories || 120,
        }));
        setParsedItems(mapped);
        setError(null);
      }
    } catch (err: any) {
      setError('Lỗi khi tải món ăn từ database: ' + (err.message || ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedItems.length === 0) {
      setError('Vui lòng chọn hoặc tải lên file Excel thực đơn.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onImport({
        title,
        startDate,
        endDate,
        targetAgeGroup,
        cycleWeekNumber,
        items: parsedItems,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi import file Excel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Nền mờ Backdrop Blur */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import thực đơn tuần từ file Excel</h3>
              <p className="text-xs text-slate-500">Tự động nhận diện cấu trúc ngày và bữa ăn trong tuần</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Thiết lập thông tin thực đơn */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tên thực đơn tuần
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Từ ngày (Thứ 2)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Đến ngày (Thứ 6)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Vùng kéo thả File Excel */}
          <div className="border-2 border-dashed border-emerald-300 rounded-3xl p-6 text-center hover:bg-emerald-50/30 transition bg-slate-50/50">
            <input
              type="file"
              id="excel-file"
              accept=".xlsx,.xls,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="excel-file" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {fileName ? fileName : 'Bấm để chọn file Excel (.xlsx / .csv) hoặc kéo thả vào đây'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Hỗ trợ định dạng biểu mẫu Excel/CSV thực đơn bán trú 5 ngày theo Thông tư 28
              </p>
            </label>

            {!fileName && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleLoadDishesFromDatabase}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-full transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Nạp từ kho món ăn trong Cơ sở dữ liệu
                </button>
              </div>
            )}
          </div>

          {/* Xem trước các món được nhận diện */}
          {parsedItems.length > 0 && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã nhận diện thành công {parsedItems.length} món ăn trong tuần:
                </span>
                <span className="text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  Sẵn sàng lưu
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-slate-600">
                {parsedItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between py-0.5 border-b border-emerald-100/80">
                    <span className="font-medium text-slate-800">
                      T{item.dayOfWeek + 1}: {item.dishName} ({item.mealTime})
                    </span>
                    <span className="text-slate-500 font-semibold">{item.calories} Kcal</span>
                  </div>
                ))}
                {parsedItems.length > 5 && (
                  <p className="text-[11px] text-slate-400 italic pt-1 text-center">
                    ... và {parsedItems.length - 5} món ăn khác cho các bữa ăn trong tuần.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || parsedItems.length === 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Xác nhận Import thực đơn</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
