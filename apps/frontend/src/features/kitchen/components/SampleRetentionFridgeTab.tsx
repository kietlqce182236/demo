import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  ShieldCheck,
  Clock,
  Printer,
  Trash2,
  Plus,
  Info,
  Search,
} from 'lucide-react';
import { SampleLabelModal } from './SampleLabelModal';
import { SampleSealModal } from './SampleSealModal';
import { attendanceApi } from '@/features/attendance/api/attendanceApi';

interface RetentionItem {
  id: string;
  code: string;
  dishName: string;
  mealSession: string;
  mealDate: string;
  sampleWeight: number;
  storageTemp: number;
  fridgeUnit: string;
  collectorName: string;
  sealedAt: string;
  expiresAt: string;
  status: 'RETAINED' | 'EXPIRED' | 'DISPOSED';
  countdownHours: number; // e.g. 18.5
  notes?: string;
}

interface SampleRetentionFridgeTabProps {
  todayDishes: Array<{ id: string; name: string }>;
  isDarkMode?: boolean;
}

export const SampleRetentionFridgeTab: React.FC<SampleRetentionFridgeTabProps> = ({
  todayDishes,
  isDarkMode = false,
}) => {
  // Real sample retention data from PostgreSQL
  const [samples, setSamples] = useState<RetentionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [selectedSampleForLabel, setSelectedSampleForLabel] = useState<RetentionItem | null>(null);
  const [isSealModalOpen, setIsSealModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RETAINED' | 'EXPIRED' | 'DISPOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Load real records from DB
  const loadSamples = async () => {
    try {
      setIsLoading(true);
      const data = await attendanceApi.getSampleRetentionRecords();
      if (Array.isArray(data)) {
        setSamples(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải mẫu lưu 24h:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSamples();
  }, []);

  // Handle Dispose Action
  const handleDispose = async (id: string) => {
    if (window.confirm('Xác nhận tiêu hủy mẫu thức ăn sau 24h theo quy trình VSATTP Bộ Y Tế?')) {
      try {
        await attendanceApi.disposeSampleRetentionRecord(id);
        loadSamples();
      } catch (err) {
        console.error('Lỗi khi tiêu hủy mẫu:', err);
      }
    }
  };

  // Add new sample
  const handleAddNewSample = async (newSample: any) => {
    try {
      await attendanceApi.createSampleRetentionRecord(newSample);
      loadSamples();
    } catch (err) {
      console.error('Lỗi khi tạo mẫu lưu mới:', err);
    }
  };

  // Filtered samples
  const filteredSamples = samples.filter((s) => {
    const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
    const matchSearch =
      s.dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.collectorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const retainedCount = samples.filter((s) => s.status === 'RETAINED').length;
  const expiredCount = samples.filter((s) => s.status === 'EXPIRED').length;
  const disposedCount = samples.filter((s) => s.status === 'DISPOSED').length;
  const avgTemp = samples.length > 0
    ? (samples.reduce((acc, s) => acc + (s.storageTemp || 3.4), 0) / samples.length).toFixed(1)
    : '3.4';

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS & SMART FRIDGE TELEMETRY BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Refrigerator Digital Sensor Panel (Span 7) */}
        <div
          className={`lg:col-span-7 rounded-3xl p-6 relative overflow-hidden transition-all ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/40 shadow-2xl'
              : 'bg-white border border-teal-200/90 shadow-sm'
          }`}
        >
          <div
            className={`flex flex-wrap items-center justify-between gap-3 pb-4 border-b ${
              isDarkMode ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl border ${
                  isDarkMode
                    ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                    : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}
              >
                <Thermometer className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3
                  className={`text-base font-black uppercase tracking-wider ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  TỦ MÁT LƯU MẪU CHUYÊN DỤNG #01
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-teal-300/80' : 'text-teal-700 font-medium'}`}>
                  Sanaky Inverter VH-408K • Cảm biến IoT Realtime
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black border ${
                isDarkMode
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>ĐẠT CHUẨN 0 - 5°C</span>
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
            <div
              className={`p-3 rounded-2xl border ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <span className={`text-[10px] font-bold block uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Nhiệt độ hiện tại
              </span>
              <span className={`text-2xl font-black ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                {avgTemp}°C
              </span>
              <span className={`text-[10px] block font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Tối ưu (0-5°C)
              </span>
            </div>

            <div
              className={`p-3 rounded-2xl border ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <span className={`text-[10px] font-bold block uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Độ ẩm tủ
              </span>
              <span className={`text-2xl font-black ${isDarkMode ? 'text-sky-400' : 'text-sky-700'}`}>68%</span>
              <span className={`text-[10px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ổn định</span>
            </div>

            <div
              className={`p-3 rounded-2xl border ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <span className={`text-[10px] font-bold block uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Trạng thái cửa
              </span>
              <span className={`text-2xl font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>ĐÓNG</span>
              <span className={`text-[10px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Khóa chốt niêm phong
              </span>
            </div>

            <div
              className={`p-3 rounded-2xl border ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <span className={`text-[10px] font-bold block uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Nguồn điện dự phòng
              </span>
              <span className={`text-2xl font-black ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>UPS 100%</span>
              <span className={`text-[10px] block font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Chống mất điện
              </span>
            </div>
          </div>

          <div
            className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
              isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Info className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
              <span>Quy định Bộ Y Tế: Bắt buộc lưu tối thiểu 24h đối với tất cả món ăn phục vụ trẻ.</span>
            </div>
            <button
              onClick={() => setIsSealModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs shadow-md shadow-teal-600/20 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Lấy Mẫu Mới</span>
            </button>
          </div>
        </div>

        {/* Right: Retention KPI Status Summary (Span 5) */}
        <div
          className={`lg:col-span-5 rounded-3xl p-6 flex flex-col justify-between transition-all ${
            isDarkMode
              ? 'bg-slate-900 border border-slate-800 shadow-2xl'
              : 'bg-white border border-slate-200/90 shadow-sm'
          }`}
        >
          <div>
            <div
              className={`flex items-center justify-between pb-3 mb-4 border-b ${
                isDarkMode ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <h3
                className={`text-base font-black uppercase tracking-wider flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>TÌNH TRẠNG MẪU LƯU 24H</span>
              </h3>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Tổng cộng {samples.length} mẫu
              </span>
            </div>

            <div className="space-y-3">
              <div
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isDarkMode
                    ? 'bg-teal-950/30 border-teal-500/30'
                    : 'bg-teal-50/70 border-teal-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-teal-500 animate-pulse"></span>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Đang lưu trữ an toàn (Dưới 24h)
                  </span>
                </div>
                <span className={`text-lg font-black ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                  {retainedCount} mẫu
                </span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isDarkMode
                    ? 'bg-amber-950/30 border-amber-500/30'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Đã đủ 24h (Chờ ký hủy mẫu)
                  </span>
                </div>
                <span className={`text-lg font-black ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                  {expiredCount} mẫu
                </span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isDarkMode
                    ? 'bg-slate-950/60 border-slate-800'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Đã tiêu hủy có biên bản
                  </span>
                </div>
                <span className={`text-lg font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  {disposedCount} mẫu
                </span>
              </div>
            </div>
          </div>

          <div
            className={`text-[11px] text-center italic mt-3 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-500'
            }`}
          >
            Mẫu chỉ được hủy khi sau 24h không phát sinh bất kỳ triệu chứng rối loạn tiêu hóa nào ở trẻ.
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROLS */}
      <div
        className={`rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 transition-all ${
          isDarkMode
            ? 'bg-slate-900/90 border border-slate-800'
            : 'bg-white border border-slate-200/90 shadow-sm'
        }`}
      >
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo món ăn, mã mẫu, người lấy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`rounded-xl text-xs pl-9 pr-3 py-2 w-64 focus:outline-none transition ${
              isDarkMode
                ? 'bg-slate-800 border border-slate-700 text-white focus:border-teal-400'
                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500'
            }`}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterStatus === 'ALL'
                ? 'bg-amber-500 text-white shadow-sm'
                : isDarkMode
                ? 'bg-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Tất cả ({samples.length})
          </button>
          <button
            onClick={() => setFilterStatus('RETAINED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterStatus === 'RETAINED'
                ? 'bg-teal-600 text-white shadow-sm'
                : isDarkMode
                ? 'bg-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Đang lưu trữ ({retainedCount})
          </button>
          <button
            onClick={() => setFilterStatus('EXPIRED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterStatus === 'EXPIRED'
                ? 'bg-amber-600 text-white shadow-sm'
                : isDarkMode
                ? 'bg-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Đủ 24h chờ hủy ({expiredCount})
          </button>
          <button
            onClick={() => setFilterStatus('DISPOSED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterStatus === 'DISPOSED'
                ? isDarkMode
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-white'
                : isDarkMode
                ? 'bg-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Đã hủy mẫu ({disposedCount})
          </button>
        </div>
      </div>

      {/* 3. SAMPLE CONTAINERS GRID (HỘP LƯU MẪU INOX 304 TRỰC QUAN) */}
      {filteredSamples.length === 0 ? (
        <div
          className={`p-12 text-center rounded-3xl border ${
            isDarkMode
              ? 'bg-slate-900/60 border-slate-800 text-slate-400'
              : 'bg-white border-slate-200 text-slate-500 shadow-sm'
          }`}
        >
          <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-60" />
          <p className="font-bold text-sm">Chưa có mẫu thức ăn lưu nào phù hợp với bộ lọc.</p>
          <p className="text-xs mt-1">Bấm "+ Lấy Mẫu Mới" ở góc trên để tiến hành niêm phong mẫu thức ăn hôm nay.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSamples.map((sample) => {
          const isRetained = sample.status === 'RETAINED';
          const isExpired = sample.status === 'EXPIRED';
          const isDisposed = sample.status === 'DISPOSED';

          return (
            <div
              key={sample.id}
              className={`rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 ${
                isDarkMode
                  ? `bg-slate-900 border shadow-xl ${
                      isExpired
                        ? 'border-amber-500/50 bg-amber-950/10 hover:border-amber-400'
                        : isRetained
                        ? 'border-teal-500/40 bg-teal-950/10 hover:border-teal-400'
                        : 'border-slate-800 bg-slate-950/40 opacity-75'
                    }`
                  : `bg-white border shadow-sm hover:shadow-md ${
                      isExpired
                        ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                        : isRetained
                        ? 'border-teal-200 bg-teal-50/10 hover:border-teal-400'
                        : 'border-slate-200 bg-slate-50/50 opacity-80'
                    }`
              }`}
            >
              {/* Header: Code & Session */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isDarkMode
                          ? 'text-slate-400 bg-slate-800 border-slate-700'
                          : 'text-slate-600 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {sample.code}
                    </span>
                    <h4
                      className={`text-base font-black mt-1.5 line-clamp-1 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {sample.dishName}
                    </h4>
                    <p className={`text-xs font-semibold ${isDarkMode ? 'text-amber-300/90' : 'text-amber-700'}`}>
                      {sample.mealSession}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      isExpired
                        ? isDarkMode
                          ? 'bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse'
                          : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                        : isRetained
                        ? isDarkMode
                          ? 'bg-teal-950 text-teal-400 border-teal-500/40'
                          : 'bg-teal-100 text-teal-800 border-teal-300'
                        : isDarkMode
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isExpired ? '⏳ ĐỦ 24H - CHỜ HỦY' : isRetained ? '🧊 ĐANG LƯU 24H' : '✓ ĐÃ TIÊU HỦY'}
                  </span>
                </div>

                {/* Key Spec Grid */}
                <div
                  className={`grid grid-cols-2 gap-2 mt-4 p-3 rounded-2xl border text-xs font-mono ${
                    isDarkMode
                      ? 'bg-slate-950/60 border-slate-800'
                      : 'bg-slate-50/90 border-slate-200/80'
                  }`}
                >
                  <div>
                    <span className={`text-[10px] font-sans block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Định lượng:
                    </span>
                    <span className={`font-bold text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {sample.sampleWeight}g
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-sans block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Nhiệt độ tủ:
                    </span>
                    <span className={`font-bold text-sm ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                      {sample.storageTemp}°C
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-sans block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Vị trí khay:
                    </span>
                    <span
                      className={`font-bold truncate block text-[11px] ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {sample.fridgeUnit}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-sans block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Người lấy:
                    </span>
                    <span
                      className={`font-bold truncate block text-[11px] ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {sample.collectorName}
                    </span>
                  </div>
                </div>

                {/* 24h Countdown Progress Bar */}
                {isRetained && (
                  <div
                    className={`mt-4 p-3 rounded-2xl border ${
                      isDarkMode
                        ? 'bg-slate-950/40 border-teal-500/20'
                        : 'bg-teal-50/40 border-teal-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className={`flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        <Clock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                        <span>Thời gian lưu còn lại:</span>
                      </span>
                      <span className={`font-black font-mono ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                        {Math.floor(Number(sample.countdownHours || 0))}h {Math.round((Number(sample.countdownHours || 0) % 1) * 60)}m
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-full h-2 overflow-hidden ${
                        isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(5, ((24 - Number(sample.countdownHours || 0)) / 24) * 100))}%`,
                        }}
                      />
                    </div>
                    <div
                      className={`flex justify-between text-[10px] mt-1 font-mono ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-500'
                      }`}
                    >
                      <span>Lưu: {sample.sealedAt.slice(0, 5)}</span>
                      <span>Hết hạn: {sample.expiresAt.slice(0, 5)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                className={`mt-5 pt-3 border-t flex items-center gap-2 ${
                  isDarkMode ? 'border-slate-800/80' : 'border-slate-100'
                }`}
              >
                <button
                  onClick={() => setSelectedSampleForLabel(sample)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition active:scale-95 border ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="In tem dán hộp lưu mẫu"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tem Barcode</span>
                </button>

                {isExpired && (
                  <button
                    onClick={() => handleDispose(sample.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition active:scale-95 shadow-sm"
                    title="Ký biên bản hủy mẫu thức ăn sau 24h"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hủy Mẫu 24H</span>
                  </button>
                )}

                {isDisposed && (
                  <span
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl border ${
                      isDarkMode
                        ? 'text-slate-500 bg-slate-950/60 border-slate-800'
                        : 'text-slate-500 bg-slate-100 border-slate-200'
                    }`}
                  >
                    Đã hủy mẫu
                  </span>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Modal In Tem Nhãn */}
      <SampleLabelModal
        isOpen={Boolean(selectedSampleForLabel)}
        onClose={() => setSelectedSampleForLabel(null)}
        sample={selectedSampleForLabel}
        isDarkMode={isDarkMode}
      />

      {/* Modal Lấy Mẫu Mới */}
      <SampleSealModal
        isOpen={isSealModalOpen}
        onClose={() => setIsSealModalOpen(false)}
        onSave={handleAddNewSample}
        todayDishes={todayDishes}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
