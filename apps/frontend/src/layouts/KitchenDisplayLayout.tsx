import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  RotateCcw,
  Volume2,
  VolumeX,
  Calendar,
  WifiOff,
  Sun,
  Moon,
  ShieldCheck,
  Thermometer,
  Layers,
  Sparkles,
} from 'lucide-react';
import { attendanceApi } from '../features/attendance/api/attendanceApi';
import { getKitchenSocket } from '../core/socket';
import { Link } from 'react-router-dom';
import { KdsLivePortionsTab } from '../features/kitchen/components/KdsLivePortionsTab';
import { FoodSafetyInspectionTab } from '../features/kitchen/components/FoodSafetyInspectionTab';
import { SampleRetentionFridgeTab } from '../features/kitchen/components/SampleRetentionFridgeTab';
import { OneWayKitchenMenuTab } from '../features/kitchen/components/OneWayKitchenMenuTab';

type KitchenTabType = 'kds_live' | 'inspections' | 'sample_retention' | 'oneway_kitchen';

export const KitchenDisplayLayout: React.FC = () => {
  // Theme state: Default is LIGHT (Sáng, sạch sẽ, chuẩn KidMeal)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<KitchenTabType>('kds_live');

  // Clock state
  const [time, setTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  // Real data state
  const [summary, setSummary] = useState({
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
  const [classes, setClasses] = useState<any[]>([]);
  const [allergyAlerts, setAllergyAlerts] = useState<any[]>([]);
  const [todayMenu, setTodayMenu] = useState<any[]>([]);
  const [rawIngredients, setRawIngredients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
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
        if (data.date && data.date !== currentDate) {
          setCurrentDate(data.date);
        }
        if (data.summary) setSummary(data.summary);
        if (data.classes) setClasses(Array.isArray(data.classes) ? data.classes : []);
        if (data.allergyAlerts) setAllergyAlerts(Array.isArray(data.allergyAlerts) ? data.allergyAlerts : []);
        if (data.todayMenu) setTodayMenu(data.todayMenu);
        if (data.rawIngredients) setRawIngredients(Array.isArray(data.rawIngredients) ? data.rawIngredients : []);
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
            cls.classId === payload.classId ? { ...cls, kitchenStatus: payload.status } : cls,
          ),
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
    const newLog = {
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
        prev.map((c) => (c.classId === classId ? { ...c, kitchenStatus: status } : c)),
      );

      await attendanceApi.updateKitchenStatus({
        classId,
        status,
        actorName: (() => {
          try {
            return JSON.parse(localStorage.getItem('auth_user') || '{}').full_name || 'Bếp viên phụ trách';
          } catch {
            return 'Bếp viên phụ trách';
          }
        })(),
      });
      playChime(false);
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái bếp:', err);
      loadKdsData();
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode
          ? 'bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950'
          : 'bg-[#f8fafc] text-slate-800 selection:bg-amber-100 selection:text-amber-900'
      }`}
    >
      {/* 1. TOP HEADER: KDS CONTROL ROOM */}
      <header
        className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 transition-colors ${
          isDarkMode
            ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl'
            : 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white p-3 rounded-2xl font-black shadow-lg shadow-amber-500/25 flex items-center justify-center">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1
                className={`text-xl md:text-2xl font-black tracking-tight uppercase ${
                  isDarkMode ? 'text-amber-400' : 'text-slate-900'
                }`}
              >
                PHÂN HỆ BẾP BÁN TRÚ (KDS)
              </h1>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide border ${
                  isConnected
                    ? isDarkMode
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isDarkMode
                    ? 'bg-red-950/80 text-red-400 border-red-500/40'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
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
                    <span>MẤT KẾT NỐI</span>
                  </>
                )}
              </div>
            </div>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              MN Sao Mai — Bếp Trung Tâm • Định lượng tức thời • Sổ kiểm thực 3 bước • Lưu mẫu 24h
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick links to other modules */}
          <div
            className={`hidden xl:flex items-center gap-1.5 p-1 rounded-2xl border text-xs font-semibold ${
              isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/80 border-slate-200'
            }`}
          >
            <Link
              to="/attendance"
              className={`px-3 py-1.5 rounded-xl transition ${
                isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              📋 Điểm Danh GV
            </Link>
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-xl transition ${
                isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              🏫 Cổng BGH
            </Link>
            <Link
              to="/meal-portions"
              className={`px-3 py-1.5 rounded-xl transition ${
                isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white'
              }`}
            >
              ⚖️ Kế Hoạch Định Lượng
            </Link>
          </div>

          {/* Theme Toggle Button (Sáng / Tối) */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition active:scale-95 ${
              isDarkMode
                ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
            }`}
            title={isDarkMode ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Bếp Tối'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Chế độ Sáng' : 'Giao diện Tối'}</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition ${
              soundEnabled
                ? isDarkMode
                  ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : isDarkMode
                ? 'bg-slate-800/50 text-slate-500 border-slate-800'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
          >
            {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
          </button>

          {/* Refresh button */}
          <button
            onClick={loadKdsData}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition active:scale-95 ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
            }`}
            title="Đồng bộ lại dữ liệu"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
            <span>Làm Mới</span>
          </button>

          {/* Date Indicator */}
          <div
            className={`flex items-center gap-2 border px-3.5 py-2 rounded-xl text-xs font-semibold ${
              isDarkMode
                ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                : 'bg-white border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>{currentDate}</span>
          </div>

          {/* Digital Clock */}
          <div
            className={`text-2xl md:text-3xl font-black px-4 py-1.5 rounded-xl border font-mono tracking-tight shadow-inner ${
              isDarkMode
                ? 'text-amber-300 bg-slate-900 border-amber-500/30'
                : 'text-amber-700 bg-amber-50/90 border-amber-200'
            }`}
          >
            {time}
          </div>
        </div>
      </header>

      {/* 2. MAIN SUB-NAVIGATION TABS BAR */}
      <nav
        className={`px-6 py-2.5 sticky top-[77px] z-30 backdrop-blur-md flex items-center justify-between gap-4 overflow-x-auto transition-colors ${
          isDarkMode
            ? 'bg-slate-900/90 border-b border-slate-800'
            : 'bg-white/90 border-b border-slate-200/90 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Tab 1: KDS Live */}
          <button
            onClick={() => setActiveTab('kds_live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'kds_live'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>1. Báo Suất Ăn & KDS Trực Tiếp</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'kds_live'
                  ? 'bg-amber-900/40 text-amber-100'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {summary.totalLunchPortions} suất
            </span>
          </button>

          {/* Tab 2: Sổ kiểm thực 3 bước */}
          <button
            onClick={() => setActiveTab('inspections')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'inspections'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. Sổ Kiểm Thực 3 Bước (QĐ 1246)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'inspections'
                  ? 'bg-emerald-900/40 text-emerald-100'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Chuẩn BYT
            </span>
          </button>

          {/* Tab 3: Lưu mẫu thức ăn 24h */}
          <button
            onClick={() => setActiveTab('sample_retention')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'sample_retention'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            <span>3. Tủ Lưu Mẫu Thức Ăn 24H (0 - 5°C)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'sample_retention'
                  ? 'bg-teal-900/40 text-teal-100'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              3.4°C
            </span>
          </button>

          {/* Tab 4: Thực đơn & Định lượng kho */}
          <button
            onClick={() => setActiveTab('oneway_kitchen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'oneway_kitchen'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Thực Đơn & Định Lượng Xuất Kho</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'oneway_kitchen'
                  ? 'bg-orange-900/40 text-orange-100'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Bếp 1 Chiều
            </span>
          </button>
        </div>

        {/* Allergy Alert Indicator */}
        {allergyAlerts.length > 0 && (
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border animate-pulse ${
              isDarkMode
                ? 'bg-red-950/80 border-red-500/50 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <span>🚨 {allergyAlerts.length} KHAY ĂN DỊ ỨNG CẦN CÁCH LY</span>
          </div>
        )}
      </nav>

      {/* 3. ACTIVE TAB MAIN VIEW */}
      <main className="flex-1 px-6 py-6 max-w-[1600px] mx-auto w-full">
        {activeTab === 'kds_live' && (
          <KdsLivePortionsTab
            summary={summary}
            classes={classes}
            allergyAlerts={allergyAlerts}
            todayMenu={todayMenu}
            liveLogs={liveLogs}
            recentFlashClassId={recentFlashClassId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGrade={selectedGrade}
            setSelectedGrade={setSelectedGrade}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            onUpdateStatus={handleUpdateStatus}
            currentDate={currentDate}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'inspections' && (
          <FoodSafetyInspectionTab todayDishes={todayMenu} isDarkMode={isDarkMode} />
        )}

        {activeTab === 'sample_retention' && (
          <SampleRetentionFridgeTab todayDishes={todayMenu} isDarkMode={isDarkMode} />
        )}

        {activeTab === 'oneway_kitchen' && (
          <OneWayKitchenMenuTab
            todayMenu={todayMenu}
            totalLunchPortions={summary.totalLunchPortions}
            totalSnackPortions={summary.totalSnackPortions}
            rawIngredients={rawIngredients}
            isDarkMode={isDarkMode}
          />
        )}
      </main>
    </div>
  );
};
