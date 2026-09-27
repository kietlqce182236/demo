import React, { useEffect, useState } from 'react';
import {
  Search,
  Download,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  Calendar,
  Users,
  DollarSign,
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { fetchSnackServices } from '../api/snackServicesApi';
import { SnackServiceItem, SnackServicesSummary } from '../types/snackServices';

export const SnackServicesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<SnackServiceItem[]>([]);
  const [summary, setSummary] = useState<SnackServicesSummary | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters state
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchSnackServices(search, statusFilter, gradeFilter);
      if (res.success) {
        setServices(res.data);
        setSummary(res.summary);
        setTotalCount(res.totalCount);
      }
    } catch (err) {
      console.error('Error fetching snack services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, gradeFilter]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. Header & Breadcrumbs Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span className="text-teal-600 font-semibold">Đơn vị KidMeal</span>
            <span>›</span>
            <span>Dịch vụ bán trú</span>
            <span>›</span>
            <span className="text-slate-700 font-bold">Cấu hình gói ăn xế</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Quản lý Gói Ăn Xế Chiều & Dịch vụ Bán Trú
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
                Tạo và vận hành các gói dịch vụ dinh dưỡng ăn xế tự nguyện, theo dõi chỉ tiêu đăng ký của phụ huynh các khối lớp theo niên khóa 2024 - 2025.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition">
            <Download className="w-4 h-4 text-slate-500" />
            Xuất danh sách đăng ký Excel
          </button>
          <button className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 flex items-center gap-2 transition">
            <Plus className="w-4 h-4 stroke-[3]" />
            Tạo đợt đăng ký
          </button>
        </div>
      </div>

      {/* 2. Top 4 Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
                Đợt tháng 11 - 12
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Tổng số đợt vận hành</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {summary.activeBatches.total} <span className="text-xs font-bold text-slate-500">đợt vận hành</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
              <span className="text-emerald-600 font-bold">{summary.activeBatches.open} mở</span>,{' '}
              <span className="text-amber-600 font-bold">{summary.activeBatches.upcoming} sắp mở</span>,{' '}
              <span className="text-slate-400">{summary.activeBatches.closed} đã đóng</span>
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full">
                {summary.studentParticipation.percentage}% toàn trường
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Học sinh tham gia ăn xế</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {summary.studentParticipation.registered}{' '}
              <span className="text-xs font-bold text-slate-400">/ {summary.studentParticipation.total} trẻ</span>
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-teal-500 h-1.5 rounded-full"
                style={{ width: `${summary.studentParticipation.percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Còn {summary.studentParticipation.remaining} trẻ chưa tham gia</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full">
                +12.4% so kỳ
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Doanh thu dự kiến đợt này</p>
            <p className="text-xl font-black text-slate-900 mt-1">
              {formatVND(summary.revenue.expectedMonthly)} <span className="text-[11px] font-normal text-slate-400">/tháng</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              Đã thu: <strong className="text-slate-800">{formatVND(summary.revenue.collected)}</strong>{' '}
              <span className="text-emerald-600 font-bold">({summary.revenue.collectedPercentage}%)</span>
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full">
                Rất tốt
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Tỷ lệ hài lòng phụ huynh</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {summary.satisfaction.ratePercent}%{' '}
              <span className="text-xs font-bold text-slate-400">({summary.satisfaction.totalReviews} đánh giá)</span>
            </p>
            <div className="flex items-center gap-1 text-amber-400 mt-2">
              {'★'.repeat(5)}
              <span className="text-xs font-bold text-slate-700 ml-1">{summary.satisfaction.ratingScore} / 5.0</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Middle Banner Section (Featured Menu & Kitchen Feedback) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banner 1: Hôm nay */}
        <div className="lg:col-span-2 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3 text-xs mb-3">
              <span className="bg-teal-500/30 text-teal-200 border border-teal-400/30 px-3 py-1 rounded-full font-bold">
                Hôm nay: Thứ Năm, 25/11
              </span>
              <span className="bg-white/10 text-white/90 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 100% Nguyên liệu kiểm định
              </span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight mt-1">
              Thực đơn xế chiều ưu tiên hôm nay
            </h3>
            <p className="text-xs text-teal-100/90 mt-1 max-w-xl leading-relaxed">
              Sữa hạt Yến mạch & Bánh Tart Táo Nướng Mật Ong cung cấp năng lượng tiêu chuẩn 210 kcal/trẻ, đảm bảo không chất bảo quản và đường hóa học.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-teal-700/50 text-xs">
            <span className="bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-700/40 text-teal-200">
              ⚡ Canxi: <strong className="text-white">190mg</strong>
            </span>
            <span className="bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-700/40 text-teal-200">
              🌱 Protein thực vật: <strong className="text-white">6.2g</strong>
            </span>
            <span className="bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-700/40 text-teal-200">
              🍏 Chất xơ: <strong className="text-white">2.1g</strong>
            </span>
          </div>
        </div>

        {/* Banner 2: Phản hồi bếp */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                Phản hồi Bếp xế gần nhất
              </h4>
              <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold">Mới</span>
            </div>

            <div className="space-y-3 mt-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="text-slate-700 font-medium italic">
                  "Bé nhà mình thích nhất món bánh tart táo này, chiều nào về cũng khen nức nở..."
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Mẹ bé Anh (Lớp 2A) • 15 phút trước</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="text-slate-700 font-medium italic">
                  "Thật yên tâm vì trường tự làm sữa hạt tươi, không dùng phụ gia đóng hộp."
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Bố bé Minh Quang (Lớp 1) • 1 giờ trước</p>
              </div>
            </div>
          </div>

          <button className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
            <span>Xem 38 phản hồi tuần này</span>
            <span>›</span>
          </button>
        </div>
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên gói ăn xế, mã đợt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPEN">Đang mở</option>
            <option value="UPCOMING">Sắp mở</option>
            <option value="CLOSED">Đã đóng</option>
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">Tất cả khối</option>
            <option value="KINDERGARTEN_LARGE">Khối Mẫu giáo Lớn</option>
            <option value="TODDLER">Nhà trẻ & Mầm</option>
          </select>

          <span className="text-xs bg-teal-50 text-teal-700 px-3 py-2 rounded-xl font-bold border border-teal-100 whitespace-nowrap">
            Hiển thị: {services.length} / {totalCount} gói đợt
          </span>
        </div>
      </div>

      {/* 5. Main Snack Services Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium text-xs">
            Đang tải dữ liệu thực từ PostgreSQL database...
          </div>
        ) : services.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium text-xs">
            Không tìm thấy gói dịch vụ ăn xế phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Gói ăn xế & Mã đợt</th>
                  <th className="py-3.5 px-4 text-center">Khối lớp áp dụng</th>
                  <th className="py-3.5 px-4">Thời gian đăng ký & Áp dụng</th>
                  <th className="py-3.5 px-4">Đơn giá cơ bản</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Tiến độ đăng ký</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {services.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Gói ăn xế & mô tả */}
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          🍹
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                            {item.description}
                          </p>
                          {item.badges && item.badges.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {item.badges.map((b, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200"
                                >
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Khối lớp */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-[11px]">
                        {item.appliedGrade}
                      </span>
                    </td>

                    {/* Thời gian */}
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-800">{item.registrationPeriod}</p>
                      <p className="text-[11px] text-teal-600 font-medium mt-0.5">{item.appliedMonth}</p>
                    </td>

                    {/* Đơn giá */}
                    <td className="py-4 px-4">
                      <p className="font-black text-slate-900 text-sm">{formatVND(item.pricePerUnit)} <span className="text-[10px] font-normal text-slate-400">/ngày</span></p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatVND(item.monthlyEstimatedPrice)} (tháng 22 ngày)
                      </p>
                    </td>

                    {/* Tiến độ đăng ký */}
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-800">
                          {item.registeredCount} / {item.targetCount} trẻ
                        </span>
                        <span className="text-teal-600 font-black">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            item.percentage >= 100
                              ? 'bg-rose-500'
                              : item.percentage >= 80
                              ? 'bg-teal-500'
                              : item.percentage > 0
                              ? 'bg-sky-500'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{item.progressNote}</p>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-4 px-4 text-center">
                      {item.status === 'OPEN' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full text-[11px] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Đang mở
                        </span>
                      )}
                      {item.status === 'UPCOMING' && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-extrabold px-3 py-1 rounded-full text-[11px] border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Sắp mở
                        </span>
                      )}
                      {item.status === 'CLOSED' && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 font-extrabold px-3 py-1 rounded-full text-[11px] border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Đã đóng
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-slate-400">
                        <button className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition" title="Chỉnh sửa">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition" title="Lưu trữ">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Table Footer / Pagination */}
        <div className="px-5 py-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Hiển thị trang <strong>1</strong> / 1 trang (Hiển thị {services.length} gói dịch vụ hoạt động)
          </div>

          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-400 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Trước
            </button>
            <button className="px-3 py-1.5 bg-teal-500 text-white rounded-lg font-bold shadow-sm">
              1
            </button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-400 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1">
              Tiếp <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Bottom Safety Banner */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Quy chuẩn Dinh dưỡng & Dị ứng KidMeal An Toàn</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Tất cả nguyên liệu phục vụ gói ăn xế được kiểm định nghiêm ngặt từ khâu tiếp nhận, cảnh báo dị ứng tự động tới phụ huynh và giáo viên.
            </p>
          </div>
        </div>

        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-bold whitespace-nowrap transition border border-slate-700">
          Xem hồ sơ chứng nhận
        </button>
      </div>
    </div>
  );
};
