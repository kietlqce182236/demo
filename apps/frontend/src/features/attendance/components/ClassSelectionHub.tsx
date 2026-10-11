import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  UtensilsCrossed,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Sparkles,
  ArrowRight,
  Search,
  School,
  Coffee,
  Check,
} from 'lucide-react';
import { SchoolHeadcountSummaryResponse, SchoolHeadcountClassItem } from '../types';

interface ClassSelectionHubProps {
  summaryData: SchoolHeadcountSummaryResponse | null;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSelectClass: (classId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ClassSelectionHub: React.FC<ClassSelectionHubProps> = ({
  summaryData,
  selectedDate,
  onDateChange,
  onSelectClass,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Format date to Vietnamese display
  const formatDisplayDate = (dStr: string) => {
    try {
      const date = new Date(dStr);
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[date.getDay()];
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dayName} ${dd}/${mm}/${yyyy}`;
    } catch {
      return dStr;
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const classes = Array.isArray(summaryData?.classes) ? summaryData.classes : [];
  const overview = summaryData?.overview;

  const filteredClasses = classes.filter((cls) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cls.name.toLowerCase().includes(q) ||
      (cls.gradeName && cls.gradeName.toLowerCase().includes(q)) ||
      (cls.homeroomTeacher && cls.homeroomTeacher.toLowerCase().includes(q)) ||
      (cls.roomNumber && cls.roomNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumb */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="hover:text-teal-700 cursor-pointer flex items-center gap-1">
            <span>🏠</span> Trang chủ
          </span>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="hover:text-teal-700 cursor-pointer">Bán trú mầm non</span>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-teal-700 font-bold">Danh sách lớp học điểm danh</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Điểm danh suất ăn Bán trú - Chọn Lớp Quản lý
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 rounded-full border border-teal-200/80 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                Chọn lớp để vào điểm danh
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Giáo viên chọn lớp mình phụ trách để tiến hành điểm danh học sinh có mặt/vắng, ghi chú dặn dò phụ huynh và chốt suất ăn gửi xuống Bếp trung tâm.
            </p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-xs shrink-0">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition"
              title="Ngày trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 text-xs font-bold text-slate-800">
              <CalendarIcon className="w-4 h-4 text-teal-600" />
              <span>{formatDisplayDate(selectedDate)}</span>
            </div>
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition"
              title="Ngày kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Số lớp học */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lớp học bán trú</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-900">{overview?.totalClasses || classes.length}</span>
              <span className="text-xs font-bold text-slate-500">lớp</span>
            </div>
            <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Hoạt động trong ngày</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600">
            <School className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Tổng sĩ số học sinh */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng học sinh</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-900">{overview?.totalStudents || 0}</span>
              <span className="text-xs font-bold text-slate-500">trẻ</span>
            </div>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
              {overview?.boysCount || 0} nam • {overview?.girlsCount || 0} nữ
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Có mặt ăn hôm nay */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đăng ký ăn hôm nay</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-700">{overview?.presentToday || 0}</span>
              <span className="text-xs font-bold text-slate-500">/ {overview?.totalStudents || 0} bé</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Tỷ lệ: {overview?.attendanceRate || 0}%
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Tiến độ gửi Bếp */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tiến độ gửi Bếp (08:45)</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-amber-700">{overview?.classesLockedCount || 0}</span>
              <span className="text-xs font-bold text-slate-500">/ {overview?.totalClasses || classes.length} lớp</span>
            </div>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
              {(overview?.classesLockedCount || 0) === (overview?.totalClasses || classes.length)
                ? 'Đã chốt xong toàn trường'
                : 'Đang tiếp nhận điểm danh'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex-1 min-w-[260px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên lớp (Mầm 1, Chồi 1...), phòng, GVCN..."
            className="w-full bg-slate-50 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white shadow-xs transition text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredClasses.length}</strong> lớp mầm non
        </div>
      </div>

      {/* 4. Class Cards Grid */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold text-slate-700">Đang tải danh sách lớp học và tình trạng điểm danh...</p>
        </div>
      ) : error || (!summaryData && !isLoading) ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-900">Không thể tải dữ liệu từ máy chủ</p>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-md mx-auto">
            {error || 'Máy chủ backend đang phản hồi chậm hoặc tạm gián đoạn. Vui lòng bấm thử lại để kết nối lại.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              🔄 Thử tải lại dữ liệu
            </button>
          )}
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Không tìm thấy lớp học phù hợp với từ khóa</p>
          <p className="text-xs text-slate-400 mt-1">Vui lòng thử lại với tên lớp hoặc số phòng khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const isLocked = cls.isKitchenLocked;
            const registeredPercent = cls.enrolled > 0 ? Math.round((cls.presentToday / cls.enrolled) * 100) : 0;

            return (
              <div
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className="group bg-white rounded-3xl border border-slate-200/90 hover:border-teal-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                {/* Card Top Banner */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition-transform shrink-0">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-teal-700 transition">
                          {cls.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {cls.gradeName || 'Khối mầm non'} • {cls.roomNumber || 'Phòng học chuẩn'}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        isLocked
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isLocked ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                        }`}
                      ></span>
                      {isLocked ? 'Đã gửi Bếp' : 'Chờ điểm danh'}
                    </span>
                  </div>

                  {/* Teacher in charge */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 font-medium">
                    <span className="text-slate-400">GVCN:</span>
                    <strong className="text-slate-800">{cls.homeroomTeacher || 'Cô phụ trách lớp'}</strong>
                  </div>

                  {/* Mini Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Sĩ số</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{cls.enrolled} bé</p>
                    </div>

                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/80">
                      <p className="text-[10px] text-emerald-700 font-bold uppercase">Ăn hôm nay</p>
                      <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                        {cls.presentToday}{' '}
                        <span className="text-[10px] font-bold text-emerald-600">({registeredPercent}%)</span>
                      </p>
                    </div>

                    <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-100/80">
                      <p className="text-[10px] text-rose-700 font-bold uppercase">Ăn kiêng/Dị ứng</p>
                      <p className="text-base font-extrabold text-rose-700 mt-0.5">{cls.allergicCount} bé</p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between group-hover:bg-teal-50/50 transition">
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-teal-700 transition flex items-center gap-1">
                    Bấm để mở danh sách học sinh
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClass(cls.id);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition"
                  >
                    <span>Vào Điểm Danh</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
