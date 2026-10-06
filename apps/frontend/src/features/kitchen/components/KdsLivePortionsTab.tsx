import React, { useMemo } from 'react';
import {
  ChefHat,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Users,
  UtensilsCrossed,
  Radio,
  Flame,
  Truck,
  Search,
} from 'lucide-react';

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

interface KdsLivePortionsTabProps {
  summary: KdsSummary;
  classes: KdsClassItem[];
  allergyAlerts: AllergyAlertItem[];
  todayMenu: TodayMenuItem[];
  liveLogs: LiveLogEvent[];
  recentFlashClassId: string | null;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedGrade: string;
  setSelectedGrade: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  onUpdateStatus: (classId: string, status: 'PREPARING' | 'COMPLETED') => void;
  isDarkMode?: boolean;
}

export const KdsLivePortionsTab: React.FC<KdsLivePortionsTabProps> = ({
  summary,
  classes,
  allergyAlerts,
  todayMenu,
  liveLogs,
  recentFlashClassId,
  searchQuery,
  setSearchQuery,
  selectedGrade,
  setSelectedGrade,
  selectedStatus,
  setSelectedStatus,
  onUpdateStatus,
  isDarkMode = false,
}) => {
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
    <div className="space-y-6">
      {/* 1. TOP METRIC STATS (KPI REALTIME) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Tổng Suất Ăn Trưa */}
        <div
          className={`border rounded-3xl p-5 shadow-sm transition ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200/90 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>TỔNG SUẤT TRƯA CHÍNH</span>
            <span
              className={`p-2 rounded-xl ${
                isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {summary.totalLunchPortions}
            </span>
            <span className="text-sm font-bold text-emerald-600">suất chốt</span>
          </div>
          <div
            className={`mt-3 pt-2.5 border-t flex justify-between text-xs ${
              isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
            }`}
          >
            <span>
              Cơm mềm: <strong className={isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}>{summary.kindergartenPortions}</strong>
            </span>
            <span>
              Cháo/Xay: <strong className={isDarkMode ? 'text-amber-300' : 'text-amber-700'}>{summary.toddlerPortions}</strong>
            </span>
          </div>
        </div>

        {/* Card 2: Bữa Phụ Xế */}
        <div
          className={`border rounded-3xl p-5 shadow-sm transition ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200/90 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>BỮA PHỤ XẾ (14:30)</span>
            <span
              className={`p-2 rounded-xl ${
                isDarkMode ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'
              }`}
            >
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-black text-sky-600">{summary.totalSnackPortions}</span>
            <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              phần ăn xế
            </span>
          </div>
          <p
            className={`mt-3 pt-2.5 border-t text-xs truncate ${
              isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
            }`}
          >
            Sữa chua hữu cơ & Sữa hạt dinh dưỡng
          </p>
        </div>

        {/* Card 3: Học Sinh Vắng Bữa */}
        <div
          className={`border rounded-3xl p-5 shadow-sm transition ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200/90 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>HỌC SINH NGHỈ HÔM NAY</span>
            <span
              className={`p-2 rounded-xl ${
                isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'
              }`}
            >
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-black text-rose-600">{summary.absentCount}</span>
            <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              trẻ vắng
            </span>
          </div>
          <p
            className={`mt-3 pt-2.5 border-t text-xs font-semibold truncate ${
              isDarkMode ? 'border-slate-800/80 text-emerald-400' : 'border-slate-100 text-emerald-700'
            }`}
          >
            ✓ Đã trừ khỏi định lượng kho
          </p>
        </div>

        {/* Card 4: Tiến Độ Chốt Báo Bếp */}
        <div
          className={`border rounded-3xl p-5 shadow-sm transition ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800'
              : 'bg-white border-slate-200/90 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>TIẾN ĐỘ BÁO BẾP</span>
            <span
              className={`p-2 rounded-xl ${
                isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-600">
              {summary.lockedClasses}/{summary.totalClasses}
            </span>
            <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              lớp đã chốt
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div className={`w-full rounded-full h-2 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${summary.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 5: Suất Dị Ứng Riêng Biệt */}
        <div
          className={`border rounded-3xl p-5 shadow-sm transition ${
            isDarkMode
              ? 'bg-gradient-to-br from-red-950/40 to-slate-900 border-red-500/40'
              : 'bg-white border-rose-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className={isDarkMode ? 'text-red-300' : 'text-rose-700'}>CẢNH BÁO DỊ ỨNG</span>
            <span
              className={`p-2 rounded-xl animate-pulse ${
                isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-black text-rose-600">{allergyAlerts.length}</span>
            <span className="text-sm font-bold text-rose-600">khay cách ly</span>
          </div>
          <p
            className={`mt-3 pt-2.5 border-t text-xs font-semibold truncate ${
              isDarkMode ? 'border-red-900/50 text-red-300' : 'border-rose-100 text-rose-600'
            }`}
          >
            Bắt buộc dán tem kiểm soát đỏ
          </p>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: LIVE ALLERGY ALERTS & TODAY MENU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Urgent Allergy Alerts Card (Span 7) */}
        <div
          className={`lg:col-span-7 border rounded-3xl p-6 shadow-sm flex flex-col justify-between ${
            isDarkMode
              ? 'bg-slate-900/80 border-red-500/40'
              : 'bg-white border-rose-200'
          }`}
        >
          <div>
            <div className={`flex items-center justify-between border-b pb-3 mb-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertOctagon className="w-5 h-5 animate-pulse text-rose-600" />
                <h3 className="text-base font-black tracking-tight uppercase">
                  DANH SÁCH DỊ ỨNG & SUẤT ĂN CÁCH LY HÔM NAY ({allergyAlerts.length})
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  isDarkMode
                    ? 'bg-red-950 text-red-300 border-red-500/30'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                Hồ Sơ Y Tế Trẻ
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {allergyAlerts.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">
                  ✓ Hôm nay không có cảnh báo dị ứng phát sinh đặc biệt
                </div>
              ) : (
                allergyAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      alert.badgeColor === 'RED'
                        ? isDarkMode
                          ? 'bg-red-950/50 border-red-500/60'
                          : 'bg-rose-50/70 border-rose-200'
                        : isDarkMode
                        ? 'bg-amber-950/40 border-amber-500/50'
                        : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {alert.childName}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                            isDarkMode
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-white text-slate-700 border-slate-200 shadow-2xs'
                          }`}
                        >
                          {alert.className}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-3 py-0.5 rounded-full font-black tracking-wider uppercase ${
                          alert.badgeColor === 'RED'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-1.5 text-xs">
                      <div className={isDarkMode ? 'text-red-200' : 'text-slate-700 font-medium'}>
                        <strong className={isDarkMode ? 'text-slate-400' : 'text-rose-700'}>
                          Yêu cầu kiêng khem:
                        </strong>{' '}
                        {alert.allergen}
                      </div>
                      <div
                        className={`p-2.5 rounded-xl mt-1 border ${
                          isDarkMode
                            ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        <strong>👨‍🍳 Suất Bếp Chuẩn Bị Thay Thế:</strong> {alert.replacementMeal}
                      </div>
                      {alert.dosingNotes && (
                        <div className={`italic text-[11px] truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Ghi chú: {alert.dosingNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className={`pt-3 border-t text-center text-xs italic ${
              isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
            }`}
          >
            * Bếp trưởng bắt buộc kiểm tra tem nhãn suất ăn riêng trước khi chuyển khay lên lớp học
          </div>
        </div>

        {/* Right: Today's Menu & Live Event Log (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Menu Today Card */}
          <div
            className={`border rounded-3xl p-5 shadow-sm ${
              isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 mb-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2 text-amber-600">
                <UtensilsCrossed className="w-5 h-5" />
                <h3 className={`text-base font-black tracking-tight uppercase ${isDarkMode ? 'text-amber-400' : 'text-slate-900'}`}>
                  THỰC ĐƠN TRƯA CHÍNH
                </h3>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  isDarkMode
                    ? 'bg-slate-800 text-amber-300 border-slate-700'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                Bếp Một Chiều
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {todayMenu.map((dish) => (
                <div
                  key={dish.id}
                  className={`p-2.5 rounded-xl border transition ${
                    isDarkMode
                      ? 'bg-slate-800/70 border-slate-700/60 hover:border-slate-600'
                      : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider block text-amber-600">
                    {dish.type === 'MAIN_COURSE' ? 'MÓN MẶN' : dish.type === 'SOUP' ? 'MÓN CANH' : 'MÓN PHỤ'}
                  </span>
                  <div className={`font-bold text-xs mt-0.5 line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {dish.name}
                  </div>
                  <div className={`flex items-center justify-between text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>{dish.portionSize}</span>
                    <span className="text-emerald-600 font-bold">{dish.calories}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time WebSocket Event Log */}
          <div
            className={`border rounded-3xl p-4 shadow-sm flex-1 flex flex-col ${
              isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-2 mb-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>DÒNG SỰ KIỆN LIVE (WEBSOCKET)</span>
              </div>
              <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Channel: /kitchen
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-40 pr-1 flex-1 font-mono text-xs">
              {liveLogs.length === 0 ? (
                <div className="text-slate-400 text-center py-4 text-[11px]">
                  Đang lắng nghe sự kiện từ giáo viên trên lớp...
                </div>
              ) : (
                liveLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-xl border flex items-start gap-2 text-[11px] leading-relaxed ${
                      isDarkMode
                        ? 'bg-slate-950/70 border-slate-800/80 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>[{log.time}]</span>
                    <span
                      className={`font-black shrink-0 ${
                        log.type === 'SYNC'
                          ? 'text-emerald-600'
                          : log.type === 'ALERT'
                          ? 'text-rose-600'
                          : log.type === 'CONNECTED'
                          ? 'text-teal-600'
                          : 'text-amber-600'
                      }`}
                    >
                      [{log.type}]
                    </span>
                    <span className="break-words">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. REAL-TIME CLASS PORTIONS MATRIX (BẢNG ĐIỀU PHỐI KHẨU PHẦN TỪNG LỚP) */}
      <div
        className={`border rounded-3xl p-6 shadow-sm ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        {/* Matrix Header & Filters */}
        <div
          className={`flex flex-wrap items-center justify-between gap-4 border-b pb-5 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div>
            <h3
              className={`text-lg md:text-xl font-black flex items-center gap-2.5 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              <ChefHat className="w-6 h-6 text-amber-500" />
              <span>BẢNG ĐIỀU PHỐI KHẨU PHẦN TỪNG LỚP ({filteredClasses.length} LỚP)</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
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
                className={`border text-xs rounded-xl pl-9 pr-3 py-2 w-48 focus:outline-none transition ${
                  isDarkMode
                    ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                }`}
              />
            </div>

            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className={`border text-xs rounded-xl px-3 py-2 focus:outline-none font-semibold transition ${
                isDarkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-400'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
              }`}
            >
              <option value="ALL">Tất cả Khối Lớp</option>
              <option value="TODDLER">Khối Nhà Trẻ (Cháo/Xay)</option>
              <option value="KINDERGARTEN">Khối Mẫu Giáo (Cơm mềm)</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`border text-xs rounded-xl px-3 py-2 focus:outline-none font-semibold transition ${
                isDarkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white focus:border-amber-400'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
              }`}
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
                className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                  isFlashing
                    ? 'border-emerald-500 ring-4 ring-emerald-400/40 scale-[1.02] shadow-xl'
                    : item.kitchenStatus === 'COMPLETED'
                    ? isDarkMode
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-emerald-200 bg-emerald-50/40'
                    : item.kitchenStatus === 'PREPARING'
                    ? isDarkMode
                      ? 'border-amber-500/50 bg-amber-950/10'
                      : 'border-amber-200 bg-amber-50/40'
                    : isDarkMode
                    ? 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    : 'border-slate-200/90 bg-white hover:border-amber-300 hover:shadow-md'
                }`}
              >
                {/* Card Header: Class name & Room */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {item.className}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isDarkMode
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.roomNumber}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        GV: <strong className={isDarkMode ? 'text-slate-300' : 'text-slate-800'}>{item.teacherName}</strong>
                      </p>
                    </div>

                    {/* Lock Status Badge */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        item.isLocked
                          ? isDarkMode
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isDarkMode
                          ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.isLocked ? '✓ ĐÃ CHỐT' : '⏳ CHỜ CHỐT'}
                    </span>
                  </div>

                  {/* Meal Diet Group */}
                  <div
                    className={`mt-3 inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      isDarkMode
                        ? 'text-amber-300 bg-amber-950/40 border-amber-500/30'
                        : 'text-amber-800 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {item.gradeLevelLabel}
                  </div>

                  {/* Portions Count Numbers */}
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div
                      className={`p-2 rounded-xl border ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <span className={`text-[10px] font-bold block uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        BỮA TRƯA
                      </span>
                      <span className="text-xl font-black text-emerald-600">{item.lunchCount}</span>
                      <span className="text-[10px] text-slate-400 block">suất</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <span className={`text-[10px] font-bold block uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        BỮA XẾ
                      </span>
                      <span className="text-xl font-black text-sky-600">{item.snackCount}</span>
                      <span className="text-[10px] text-slate-400 block">phần</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <span className={`text-[10px] font-bold block uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        VẮNG MẶT
                      </span>
                      <span className="text-xl font-black text-rose-600">{item.absentCount}</span>
                      <span className="text-[10px] text-slate-400 block">trẻ</span>
                    </div>
                  </div>
                </div>

                {/* Kitchen Actions & Preparation Status */}
                <div className={`mt-5 pt-3.5 border-t ${isDarkMode ? 'border-slate-800/80' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <span className={isDarkMode ? 'text-slate-400 font-semibold' : 'text-slate-500 font-medium'}>
                      Trạng thái Bếp:
                    </span>
                    <span
                      className={`font-black uppercase tracking-wider text-[11px] ${
                        item.kitchenStatus === 'COMPLETED'
                          ? 'text-emerald-600'
                          : item.kitchenStatus === 'PREPARING'
                          ? 'text-amber-600'
                          : isDarkMode
                          ? 'text-slate-400'
                          : 'text-slate-500'
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
                      onClick={() => onUpdateStatus(item.classId, 'PREPARING')}
                      disabled={item.kitchenStatus === 'PREPARING' || item.kitchenStatus === 'COMPLETED'}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-black text-xs transition active:scale-95 ${
                        item.kitchenStatus === 'PREPARING'
                          ? isDarkMode
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                            : 'bg-amber-100 text-amber-800 border border-amber-200 cursor-default'
                          : isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Chia Khay</span>
                    </button>

                    <button
                      onClick={() => onUpdateStatus(item.classId, 'COMPLETED')}
                      disabled={item.kitchenStatus === 'COMPLETED'}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-black text-xs transition active:scale-95 ${
                        item.kitchenStatus === 'COMPLETED'
                          ? isDarkMode
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20'
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
    </div>
  );
};
