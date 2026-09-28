import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChefHat,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Flame,
  Truck,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Users,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Radio,
  Check,
  Timer,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { attendanceApi } from '../features/attendance/api/attendanceApi';
import { getKitchenSocket } from '../core/socket';
import { Link } from 'react-router-dom';

interface KdsSummary {
  totalLunchPortions: number;
  totalSnackPortions: number;
  toddlerPortions: number;
  kindergartenPortions: number;
  absentCount: number;
  specialTraysCount: number;
  lockedClasses: number;
  totalClasses: number;
  completionPercentage: number;
}

interface KdsClassItem {
  classId: string;
  className: string;
  gradeLevel: string;
  gradeLevelLabel: string;
  roomNumber: string;
  totalStudents: number;
  lunchCount: number;
  snackCount: number;
  absentCount: number;
  specialCount: number;
  isLocked: boolean;
  kitchenStatus: 'SYNCED' | 'PREPARING' | 'COMPLETED';
  teacherName: string;
}

interface AllergyAlertItem {
  id: string;
  childName: string;
  className: string;
  severity: string;
  badgeColor: 'RED' | 'ORANGE';
  allergen: string;
  replacementMeal: string;
  dosingNotes: string;
  isResolved: boolean;
}

interface TodayMenuItem {
  id: string;
  name: string;
  type: string;
  portionSize: string;
  calories: string;
}

interface LiveLogEvent {
  id: string;
  time: string;
  type: 'SYNC' | 'ALERT' | 'STATUS' | 'CONNECTED';
  message: string;
}

export const KitchenDisplayLayout: React.FC = () => {
  // Clock state
  const [time, setTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const [currentDate, setCurrentDate] = useState('2026-09-26');

  // Real data state
  const [summary, setSummary] = useState<KdsSummary>({
    totalLunchPortions: 0,
    totalSnackPortions: 0,
    toddlerPortions: 0,
    kindergartenPortions: 0,
    absentCount: 0,
    specialTraysCount: 0,
    lockedClasses: 0,
    totalClasses: 0,
    completionPercentage: 0,
  });
  const [classes, setClasses] = useState<KdsClassItem[]>([]);
  const [allergyAlerts, setAllergyAlerts] = useState<AllergyAlertItem[]>([]);
  const [todayMenu, setTodayMenu] = useState<TodayMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveLogs, setLiveLogs] = useState<LiveLogEvent[]>([]);
  const [recentFlashClassId, setRecentFlashClassId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Audio effect using Web Audio API
  const playChime = (isAlert = false) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isAlert) {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      }

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('vi-VN')), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real KDS Data from PostgreSQL Backend
  const loadKdsData = async () => {
    try {
      setIsLoading(true);
      const data = await attendanceApi.getKitchenKdsData(currentDate);
      if (data) {
        if (data.summary) setSummary(data.summary);
        if (data.classes) setClasses(data.classes);
        if (data.allergyAlerts) setAllergyAlerts(data.allergyAlerts);
        if (data.todayMenu) setTodayMenu(data.todayMenu);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu KDS:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKdsData();
  }, [currentDate]);

  // WebSocket Connection & Real-time Event Listeners
  useEffect(() => {
    const socket = getKitchenSocket();

    const handleConnect = () => {
      setIsConnected(true);
      addLog('CONNECTED', 'Đã kết nối thành công tới WebSocket Bếp Bán Trú (/kitchen)');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      addLog('ALERT', 'Mất kết nối WebSocket. Đang tự động kết nối lại...');
    };

    const handlePortionsSynced = (payload: any) => {
      console.log('⚡ [WebSocket MEAL_PORTIONS_SYNCED]:', payload);
      playChime(false);
      const msg = payload.message || `Lớp ${payload.className || 'Mầm non'} vừa cập nhật số lượng suất ăn!`;
      addLog('SYNC', msg);

      if (payload.classId) {
        setRecentFlashClassId(payload.classId);
        setTimeout(() => setRecentFlashClassId(null), 3000);
      }

      // Automatically reload metrics and matrix from real DB
      loadKdsData();
    };

    const handleAllergyAlert = (payload: any) => {
      console.log('🚨 [WebSocket ALLERGY_ALERT]:', payload);
      playChime(true);
      const msg = payload.message || `Cảnh báo dị ứng khẩn cấp: ${payload.childName} (${payload.className})!`;
      addLog('ALERT', msg);
      loadKdsData();
    };

    const handleKitchenStatus = (payload: any) => {
      console.log('👨‍🍳 [WebSocket KITCHEN_PORTIONS_ACKNOWLEDGED]:', payload);
      const msg = payload.message || `Bếp đã cập nhật trạng thái chuẩn bị suất ăn`;
      addLog('STATUS', msg);

      if (payload.classId && payload.status) {
        setClasses((prev) =>
          prev.map((cls) =>
            cls.classId === payload.classId ? { ...cls, kitchenStatus: payload.status } : cls
          )
        );
      }
    };

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('MEAL_PORTIONS_SYNCED', handlePortionsSynced);
    socket.on('ALLERGY_ALERT', handleAllergyAlert);
    socket.on('KITCHEN_PORTIONS_ACKNOWLEDGED', handleKitchenStatus);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('MEAL_PORTIONS_SYNCED', handlePortionsSynced);
      socket.off('ALLERGY_ALERT', handleAllergyAlert);
      socket.off('KITCHEN_PORTIONS_ACKNOWLEDGED', handleKitchenStatus);
    };
  }, []);

  const addLog = (type: 'SYNC' | 'ALERT' | 'STATUS' | 'CONNECTED', message: string) => {
    const newLog: LiveLogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString('vi-VN'),
      type,
      message,
    };
    setLiveLogs((prev) => [newLog, ...prev.slice(0, 19)]);
  };

  // Kitchen Staff Action: Update preparation status
  const handleUpdateStatus = async (classId: string, status: 'PREPARING' | 'COMPLETED') => {
    try {
      // Optimistic update
      setClasses((prev) =>
        prev.map((c) => (c.classId === classId ? { ...c, kitchenStatus: status } : c))
      );

      await attendanceApi.updateKitchenStatus({
        classId,
        status,
        actorName: 'Bếp trưởng Đỗ Văn Bếp',
      });
      playChime(false);
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái bếp:', err);
      loadKdsData();
    }
  };

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teacherName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchGrade =
        selectedGrade === 'ALL' ||
        (selectedGrade === 'TODDLER' && c.gradeLevel.includes('TODDLER')) ||
        (selectedGrade === 'KINDERGARTEN' && !c.gradeLevel.includes('TODDLER'));

      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'LOCKED' && c.isLocked) ||
        (selectedStatus === 'UNLOCKED' && !c.isLocked) ||
        (selectedStatus === 'PREPARING' && c.kitchenStatus === 'PREPARING') ||
        (selectedStatus === 'COMPLETED' && c.kitchenStatus === 'COMPLETED');

      return matchSearch && matchGrade && matchStatus;
    });
  }, [classes, searchQuery, selectedGrade, selectedStatus]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. TOP HEADER: KDS CONTROL ROOM */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 p-3 rounded-2xl font-black shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black tracking-wider text-amber-400 uppercase">
                KITCHEN DISPLAY SYSTEM (KDS)
              </h1>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide border ${
                  isConnected
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                    : 'bg-red-950/80 text-red-400 border-red-500/40'
                }`}
              >
                {isConnected ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span>WEBSOCKET LIVE</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>DISCONNECTED</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Khu Vực Bếp Bán Trú Trung Tâm • Đồng bộ định lượng suất ăn tức thời với Giáo viên
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Quick links to other modules */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 text-xs font-semibold">
            <Link
              to="/attendance"
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              📋 Điểm Danh GV
            </Link>
            <Link
              to="/coordination-notes"
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              🔔 Điều Phối Dị Ứng
            </Link>
            <Link
              to="/meal-portions"
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              ⚖️ Định Lượng (UC56)
            </Link>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition ${
              soundEnabled
                ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-800/50 text-slate-500 border-slate-800'
            }`}
            title={soundEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Refresh button */}
          <button
            onClick={loadKdsData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold transition active:scale-95"
            title="Đồng bộ lại dữ liệu"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Làm Mới</span>
          </button>

          {/* Date Indicator */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>{currentDate}</span>
          </div>

          {/* Big Clock */}
          <div className="text-2xl md:text-3xl font-black text-amber-300 bg-slate-900 px-4 py-1.5 rounded-xl border border-amber-500/30 shadow-inner font-mono">
            {time}
          </div>
        </div>
      </header>

      {/* 2. TOP METRIC STATS (KPI REALTIME) */}
      <section className="px-6 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Tổng Suất Ăn Trưa */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>TỔNG SUẤT TRƯA CHÍNH</span>
              <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <UtensilsCrossed className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{summary.totalLunchPortions}</span>
              <span className="text-sm font-bold text-emerald-400">suất chốt</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex justify-between text-xs">
              <span className="text-slate-400">Cơm mềm: <strong className="text-emerald-300">{summary.kindergartenPortions}</strong></span>
              <span className="text-slate-400">Cháo/Xay: <strong className="text-amber-300">{summary.toddlerPortions}</strong></span>
            </div>
          </div>

          {/* Card 2: Bữa Phụ Xế */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>BỮA PHỤ XẾ (14:30)</span>
              <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-sky-400">{summary.totalSnackPortions}</span>
              <span className="text-sm font-bold text-slate-400">phần ăn xế</span>
            </div>
            <p className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 truncate">
              Sữa chua hữu cơ & Sữa hạt dinh dưỡng
            </p>
          </div>

          {/* Card 3: Học Sinh Vắng Bữa */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>HỌC SINH NGHỈ HÔM NAY</span>
              <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-rose-400">{summary.absentCount}</span>
              <span className="text-sm font-bold text-slate-400">trẻ vắng</span>
            </div>
            <p className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-emerald-400 font-medium">
              ✓ Đã trừ khỏi định lượng thực phẩm kho
            </p>
          </div>

          {/* Card 4: Tiến Độ Chốt Báo Bếp */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>TIẾN ĐỘ BÁO BẾP</span>
              <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-400">
                {summary.lockedClasses}/{summary.totalClasses}
              </span>
              <span className="text-sm font-bold text-slate-400">lớp đã khóa</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${summary.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 5: Suất Dị Ứng Riêng Biệt */}
          <div className="bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/40 rounded-2xl p-4 shadow-lg hover:border-red-500/60 transition">
            <div className="flex items-center justify-between text-red-300 text-xs font-bold uppercase tracking-wider">
              <span>CẢNH BÁO DỊ ỨNG</span>
              <span className="p-1.5 bg-red-500/20 text-red-400 rounded-lg animate-pulse">
                <AlertOctagon className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-red-400">{allergyAlerts.length}</span>
              <span className="text-sm font-bold text-red-300">khay cách ly</span>
            </div>
            <p className="mt-3 pt-2.5 border-t border-red-900/50 text-xs text-red-300 font-semibold truncate">
              Bắt buộc dán tem kiểm soát trước khi giao
            </p>
          </div>
        </div>
      </section>

      {/* 3. MIDDLE SECTION: LIVE ALLERGY ALERTS & TODAY MENU */}
      <section className="px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Urgent Allergy Alerts Card (Span 7) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-red-500/40 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertOctagon className="w-5 h-5 animate-pulse text-red-400" />
                <h2 className="text-base font-black tracking-wide uppercase">
                  DANH SÁCH DỊ ỨNG & SUẤT ĂN CÁCH LY HÔM NAY ({allergyAlerts.length})
                </h2>
              </div>
              <span className="text-xs font-bold bg-red-950 text-red-300 border border-red-500/30 px-3 py-1 rounded-full">
                Dữ liệu thực từ Sổ Điều Phối
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {allergyAlerts.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  ✓ Hôm nay không có cảnh báo dị ứng phát sinh đặc biệt
                </div>
              ) : (
                allergyAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      alert.badgeColor === 'RED'
                        ? 'bg-red-950/50 border-red-500/60 shadow-md shadow-red-950/50'
                        : 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-950/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">{alert.childName}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {alert.className}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-3 py-0.5 rounded-full font-black tracking-wider uppercase ${
                          alert.badgeColor === 'RED'
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-1.5 text-xs">
                      <div className="text-red-200">
                        <strong className="text-slate-400">Yêu cầu GV:</strong> {alert.allergen}
                      </div>
                      <div className="text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 p-2.5 rounded-xl mt-1">
                        <strong className="text-emerald-400">👨‍🍳 Suất Bếp Chuẩn Bị Thay Thế:</strong>{' '}
                        {alert.replacementMeal}
                      </div>
                      {alert.dosingNotes && (
                        <div className="text-slate-400 italic text-[11px] truncate">
                          Ghi chú: {alert.dosingNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400 italic">
            * Bếp trưởng bắt buộc kiểm tra tem nhãn suất ăn riêng trước khi chuyển khay lên lớp học
          </div>
        </div>

        {/* Right: Today's Menu & Live Event Log (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Menu Today Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <UtensilsCrossed className="w-5 h-5" />
                <h2 className="text-base font-black tracking-wide uppercase">THỰC ĐƠN TRƯA CHÍNH</h2>
              </div>
              <span className="text-xs bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                Bếp Một Chiều
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {todayMenu.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-slate-800/70 border border-slate-700/60 p-2.5 rounded-xl hover:border-slate-600 transition"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider block text-amber-400">
                    {dish.type === 'MAIN_COURSE' ? 'MÓN MẶN' : dish.type === 'SOUP' ? 'MÓN CANH' : 'MÓN PHỤ'}
                  </span>
                  <div className="font-bold text-white text-xs mt-0.5 line-clamp-1">{dish.name}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{dish.portionSize}</span>
                    <span className="text-emerald-400 font-semibold">{dish.calories}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time WebSocket Event Log */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-2xl flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-300 tracking-wider">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>DÒNG SỰ KIỆN LIVE (WEBSOCKET)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Channel: /kitchen</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-40 pr-1 flex-1 font-mono text-xs">
              {liveLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-4 text-[11px]">
                  Đang lắng nghe sự kiện từ giáo viên trên lớp...
                </div>
              ) : (
                liveLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-2 text-[11px] leading-relaxed"
                  >
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span
                      className={`font-black shrink-0 ${
                        log.type === 'SYNC'
                          ? 'text-emerald-400'
                          : log.type === 'ALERT'
                          ? 'text-red-400'
                          : log.type === 'CONNECTED'
                          ? 'text-teal-400'
                          : 'text-amber-400'
                      }`}
                    >
                      [{log.type}]
                    </span>
                    <span className="text-slate-300 break-words">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. REAL-TIME CLASS PORTIONS MATRIX (BẢNG ĐIỀU PHỐI KHẨU PHẦN TỪNG LỚP) */}
      <section className="px-6 py-6 flex-1">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          {/* Matrix Header & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2.5">
                <ChefHat className="w-6 h-6 text-amber-400" />
                <span>BẢNG ĐIỀU PHỐI KHẨU PHẦN TỪNG LỚP ({filteredClasses.length} LỚP)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dữ liệu 100% thời gian thực từ cơ sở dữ liệu bán trú • Cập nhật tự động khi Giáo viên điểm danh
              </p>
            </div>

            {/* Controls & Filter Pills */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên lớp, phòng, GV..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800/80 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-3 py-2 w-48 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* Grade Filter */}
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 transition font-semibold"
              >
                <option value="ALL">Tất cả Khối Lớp</option>
                <option value="TODDLER">Khối Nhà Trẻ (Cháo/Xay)</option>
                <option value="KINDERGARTEN">Khối Mẫu Giáo (Cơm mềm)</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 transition font-semibold"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="LOCKED">Đã khóa báo bếp</option>
                <option value="UNLOCKED">Chưa khóa sổ</option>
                <option value="PREPARING">Bếp đang chia suất</option>
                <option value="COMPLETED">Đã xuất khay lên lớp</option>
              </select>
            </div>
          </div>

          {/* Matrix Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {filteredClasses.map((item) => {
              const isFlashing = recentFlashClassId === item.classId;

              return (
                <div
                  key={item.classId}
                  className={`bg-slate-950/70 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                    isFlashing
                      ? 'border-emerald-400 ring-4 ring-emerald-500/40 scale-[1.02] shadow-2xl shadow-emerald-500/30'
                      : item.kitchenStatus === 'COMPLETED'
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : item.kitchenStatus === 'PREPARING'
                      ? 'border-amber-500/50 bg-amber-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header: Class name & Room */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-white tracking-wide">{item.className}</h3>
                          <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                            {item.roomNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          GV: <strong className="text-slate-300">{item.teacherName}</strong>
                        </p>
                      </div>

                      {/* Lock Status Badge */}
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          item.isLocked
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-950 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {item.isLocked ? '✓ ĐÃ CHỐT' : '⏳ CHỜ CHỐT'}
                      </span>
                    </div>

                    {/* Meal Diet Group */}
                    <div className="mt-3 inline-block text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                      {item.gradeLevelLabel}
                    </div>

                    {/* Portions Count Numbers */}
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">BỮA TRƯA</span>
                        <span className="text-xl font-black text-emerald-400">{item.lunchCount}</span>
                        <span className="text-[10px] text-slate-500 block">suất</span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">BỮA XẾ</span>
                        <span className="text-xl font-black text-sky-400">{item.snackCount}</span>
                        <span className="text-[10px] text-slate-500 block">phần</span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">VẮNG MẶT</span>
                        <span className="text-xl font-black text-rose-400">{item.absentCount}</span>
                        <span className="text-[10px] text-slate-500 block">trẻ</span>
                      </div>
                    </div>
                  </div>

                  {/* Kitchen Actions & Preparation Status */}
                  <div className="mt-5 pt-3.5 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <span className="text-slate-400 font-semibold">Trạng thái Bếp:</span>
                      <span
                        className={`font-black uppercase tracking-wider text-[11px] ${
                          item.kitchenStatus === 'COMPLETED'
                            ? 'text-emerald-400'
                            : item.kitchenStatus === 'PREPARING'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.kitchenStatus === 'COMPLETED'
                          ? '✓ ĐÃ XUẤT LÊN LỚP'
                          : item.kitchenStatus === 'PREPARING'
                          ? '🔥 ĐANG CHIA SUẤT'
                          : '⏱ CHỜ TIẾP NHẬN'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(item.classId, 'PREPARING')}
                        disabled={item.kitchenStatus === 'PREPARING' || item.kitchenStatus === 'COMPLETED'}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-black text-xs transition active:scale-95 ${
                          item.kitchenStatus === 'PREPARING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Chia Khay</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(item.classId, 'COMPLETED')}
                        disabled={item.kitchenStatus === 'COMPLETED'}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-black text-xs transition active:scale-95 ${
                          item.kitchenStatus === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Xuất Khay</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
