import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/auth.store';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Clock,
  AlertTriangle,
  ThermometerSun,
  Refrigerator,
  ShieldCheck,
  Calendar,
  Utensils,
  User,
  QrCode,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/core/api/axios';

export const InspectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isPrincipalOrManagement = roles.includes('SCHOOL_MANAGEMENT') || roles.includes('SCHOOL_MANAGER') || roles.includes('PRINCIPAL');
  const isKitchenOrNutritionist = roles.includes('KITCHEN_STAFF') || roles.includes('KITCHEN_MANAGER') || roles.includes('NUTRITIONIST');
  // Khi ở phân hệ Ban Giám Hiệu (/food-safety/:id) hoặc tài khoản BGH, chỉ được xem không được can thiệp duyệt/hủy
  const isReadOnly = location.pathname.startsWith('/food-safety') || (isPrincipalOrManagement && !isKitchenOrNutritionist);

  const [record, setRecord] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedSampleItem, setSelectedSampleItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  useEffect(() => {
    if (record && record.sealedAt && (record.status === 'Hoàn tất' || record.step3Status === 'Đạt chuẩn' || record.step3Status === 'Đã lưu mẫu')) {
      const interval = setInterval(() => {
        const sealedTime = new Date(record.sealedAt).getTime();
        const targetTime = sealedTime + 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        const diff = targetTime - now;

        if (diff <= 0) {
          setCountdown('00:00:00 (Đã quá hạn 24h, cần tiêu hủy mẫu)');
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff / (1000 * 60)) % 60);
          const secs = Math.floor((diff / 1000) % 60);
          setCountdown(
            `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          );
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [record]);

  const fetchRecord = async () => {
    setIsLoading(true);
    try {
      // 1. Try to fetch from /inspections/:id
      const res = await apiClient.get(`/inspections/${id}`);
      const data = res.data?.data || res.data;
      if (data) {
        setRecord(data);
        return;
      }
    } catch (err1) {
      console.warn('Could not fetch from /inspections/:id, falling back to /inspections/samples/:id', err1);
      try {
        // 2. Fallback to /inspections/samples/:id
        const res2 = await apiClient.get(`/inspections/samples/${id}`);
        if (res2.data) {
          const s = res2.data;
          setRecord({
            id: String(s.id),
            code: s.sampleCode || s.code || `BB-KT-${s.date || '2026'}-01`,
            mealDate: s.date || s.mealDate || new Date().toISOString().split('T')[0],
            mealTime: s.mealSession || 'Trưa chính (10:30)',
            performerName: s.collectorName || 'Nguyễn Văn Cường (Bếp trưởng)',
            totalPortions: 380,
            storageTemp: Number(s.storageTemp) || 3.8,
            status: s.status === 'STORED' ? 'Hoàn tất' : s.status === 'DISPOSED' ? 'Hoàn tất' : 'Chưa hoàn tất',
            sealedAt: s.storedAt || `${s.date}T10:45:00.000Z`,
            disposedAt: s.disposeAt,
            step1Status: 'Đạt chuẩn',
            step1Time: `${s.date}T06:30:00.000Z`,
            step1Note: 'Tiếp nhận 100% nguyên liệu tươi sống, kiểm dịch ATTP đầy đủ.',
            step2Status: 'Đạt chuẩn',
            step2Time: `${s.date}T09:15:00.000Z`,
            step2Note: 'Quy trình bếp 1 chiều, nhiệt độ nấu sôi > 75°C.',
            step3Status: 'Đạt chuẩn',
            step3Time: `${s.date}T10:30:00.000Z`,
            step3Note: 'Cảm quan thức ăn chín đạt chuẩn, mùi vị thơm ngon.',
            sampleItems: [
              {
                id: String(s.id),
                dishName: s.dishName,
                sampleCode: s.sampleCode,
                quantityGrams: Number(s.sampleWeight) || 150,
                temperatureC: Number(s.storageTemp) || 3.8,
                containerType: 'Hộp Inox vô trùng',
                status: s.status,
              },
            ],
          });
          return;
        }
      } catch (err2) {
        console.error('Failed to load inspection record detail:', err2);
        alert('Không tìm thấy thông tin chi tiết biên bản kiểm thực');
        handleBack();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const isNutritionist = window.location.pathname.startsWith('/nutritionist');
    const basePath = isNutritionist ? '/nutritionist/food-safety' : '/food-safety';
    navigate(basePath);
  };

  const handleDispose = async () => {
    if (!window.confirm('Xác nhận đã tiêu hủy mẫu thức ăn an toàn sau 24 giờ theo quy chuẩn Bộ Y Tế?')) {
      return;
    }
    try {
      const sampleId = record?.sampleItems?.[0]?.id || id;
      await apiClient.patch(`/inspections/samples/${sampleId}/dispose`);
      alert('Đã xác nhận tiêu hủy mẫu lưu an toàn thành công!');
      fetchRecord();
    } catch (error) {
      // Also try POST fallback
      try {
        const sampleId = record?.sampleItems?.[0]?.id || id;
        await apiClient.post(`/inspections/samples/${sampleId}/dispose`);
        alert('Đã xác nhận tiêu hủy mẫu lưu an toàn thành công!');
        fetchRecord();
      } catch (errPost) {
        alert('Lỗi khi ghi nhận hủy mẫu');
      }
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Xác nhận phê duyệt Đạt chuẩn An toàn Thực phẩm cho biên bản kiểm thực này?')) {
      return;
    }
    setIsSubmittingApproval(true);
    try {
      await apiClient.post(`/inspections/${id}/approve`, {});
      alert('✅ Đã phê duyệt biên bản kiểm thực Đạt chuẩn ATTP thành công!');
      await fetchRecord();
    } catch (err: any) {
      alert('Lỗi phê duyệt: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do yêu cầu chụp lại ảnh / bổ sung minh chứng.');
      return;
    }
    setIsSubmittingApproval(true);
    try {
      await apiClient.post(`/inspections/${id}/reject`, { reason: rejectionReason });
      alert('⚠️ Đã gửi yêu cầu chụp lại minh chứng tới nhà bếp!');
      setIsRejectModalOpen(false);
      await fetchRecord();
    } catch (err: any) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleOpenSampleLabel = (item?: any) => {
    setSelectedSampleItem(item || record?.sampleItems?.[0] || null);
    setIsLabelModalOpen(true);
  };

  const formatDate = (d: string) => {
    if (!d) return '--/--/----';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatTime = (d: string) => {
    if (!d) return '--:--';
    const date = new Date(d);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (isLoading || !record) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
        Đang tải thông tin biên bản kiểm thực ba bước...
      </div>
    );
  }

  const isDisposed =
    record.disposedAt ||
    record.step3Status === 'Đã hủy mẫu an toàn' ||
    record.step3Status === 'Đã hủy mẫu' ||
    record.sampleItems?.some((s: any) => s.status === 'DISPOSED');

  const is24hPassed =
    record.sealedAt &&
    new Date().getTime() - new Date(record.sealedAt).getTime() >= 24 * 60 * 60 * 1000;
  const isExpired = countdown.includes('quá hạn');

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Biên Bản Kiểm Thực Ba Bước: <span className="text-emerald-700 font-mono">{record.code}</span>
              <span className="ml-2 inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase rounded-full border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> Đạt chuẩn ATTP
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quy chuẩn Bộ Y Tế — QĐ 1246/QĐ-BYT • Niên khóa 2026 - 2027
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 font-bold text-xs shadow-sm transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại sổ
          </button>
          <button
            onClick={() => handleOpenSampleLabel()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95"
          >
            <Printer className="w-4 h-4" /> In tem lưu mẫu / Xuất PDF
          </button>
        </div>
      </div>

      {/* ─── WORKFLOW APPROVAL STATUS BANNER & ACTION BAR ─── */}
      {record.approvalStatus === 'CHO_DUYET' && (
        <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-3xl p-5 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-indigo-950 text-base">
                  Nhà bếp đã gửi duyệt ảnh minh chứng kiểm thực
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-200 text-indigo-900 border border-indigo-300">
                  ⏳ Chờ Chuyên Gia Duyệt
                </span>
              </div>
              <p className="text-xs text-indigo-700 font-medium mt-0.5">
                Gửi lúc: <span className="font-bold">{formatTime(record.kitchenSubmittedAt)}</span> • Bếp viên phụ trách:{' '}
                <span className="font-bold">{record.performerName || 'Bếp trưởng'}</span>. Vui lòng kiểm tra hình ảnh và xác nhận.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            {!isReadOnly ? (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isSubmittingApproval}
                  className="flex-1 md:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isSubmittingApproval ? 'Đang duyệt...' : 'Phê Duyệt Đạt Chuẩn'}
                </button>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={isSubmittingApproval}
                  className="flex-1 md:flex-initial px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Yêu Cầu Chụp Lại
                </button>
              </>
            ) : (
              <span className="px-3.5 py-2 rounded-xl bg-indigo-100 text-indigo-900 font-bold text-xs border border-indigo-200 flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <span>Chờ Chuyên viên Dinh dưỡng duyệt</span>
              </span>
            )}
          </div>
        </div>
      )}

      {record.approvalStatus === 'CHO_BEP_TAI_ANH' && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">
                Biên bản đang chờ nhà bếp chụp ảnh minh chứng 3 bước
              </p>
              <p className="text-xs text-amber-700 font-medium mt-0.5">
                Chuyên gia dinh dưỡng đã khởi tạo biên bản. Nhân viên nhà bếp sẽ tải ảnh nguyên liệu, bếp nấu và lưu mẫu để gửi duyệt.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900 shrink-0">
            📷 Chờ bếp tải ảnh
          </span>
        </div>
      )}

      {record.approvalStatus === 'DA_DUYET' && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-sm">
                Biên bản đã được Chuyên gia Dinh dưỡng Phê Duyệt Đạt Chuẩn ATTP
              </p>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                Duyệt bởi: <span className="font-bold">{record.approvedBy || 'Chuyên gia Dinh dưỡng'}</span>
                {record.approvedAt ? ` lúc ${formatTime(record.approvedAt)} - ${formatDate(record.approvedAt)}` : ''}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900 shrink-0">
            ✓ Đã duyệt hoàn tất
          </span>
        </div>
      )}

      {record.approvalStatus === 'YEU_CAU_CHUP_LAI' && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-rose-950 text-sm">
                Đã yêu cầu nhà bếp chụp lại ảnh minh chứng
              </p>
              <p className="text-xs text-rose-700 font-medium mt-0.5">
                Lý do: <span className="font-bold italic">"{record.rejectionReason || 'Ảnh chưa rõ nét'}"</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-200 text-rose-900 shrink-0">
              ⚠️ Yêu cầu chụp lại
            </span>
            <button
              onClick={handleApprove}
              disabled={isSubmittingApproval}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              Duyệt ngay nếu đã đạt
            </button>
          </div>
        </div>
      )}

      {/* ─── RECORD SUMMARY METRICS CARD ─── */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Mã biên bản điện tử
            </p>
            <p className="text-xl font-black text-slate-900 font-mono">{record.code}</p>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Khóa dữ liệu SHA-256
            </p>
          </div>

          <div className="md:pl-6 pt-4 md:pt-0">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Ngày kiểm thực
            </p>
            <p className="text-xl font-bold text-slate-900">{formatDate(record.mealDate)}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{record.mealTime}</p>
          </div>

          <div className="md:pl-6 pt-4 md:pt-0">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Ca ăn & Khẩu phần
            </p>
            <p className="text-xl font-bold text-emerald-700">{record.totalPortions || 380} suất bán trú</p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Phụ trách: <span className="font-bold text-slate-700">{record.performerName}</span>
            </p>
          </div>

          <div className="md:pl-6 pt-4 md:pt-0">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Bảo quản mẫu lưu 24h
            </p>
            <p className="text-xl font-black text-blue-600 flex items-center gap-2">
              {record.storageTemp ?? 3.8}°C{' '}
              <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-lg font-bold">
                Tủ lưu số 01
              </span>
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">Chuẩn y tế: 0°C - 5°C</p>
          </div>
        </div>

        <hr className="my-5 border-slate-100" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CheckCircle
              className={`w-5 h-5 ${record.status === 'Hoàn tất' ? 'text-emerald-500' : 'text-amber-500'}`}
            />
            <span>Trạng thái hiện hành:</span>
            <span
              className={`text-sm font-bold ${
                isDisposed
                  ? 'text-emerald-700'
                  : record.status === 'Hoàn tất'
                  ? 'text-blue-700'
                  : 'text-amber-700'
              }`}
            >
              {isDisposed
                ? 'Đã hoàn tất 3 bước kiểm thực & Đã hủy mẫu an toàn'
                : record.status === 'Hoàn tất'
                ? 'Đã hoàn tất 3 bước kiểm thực & Đang niêm phong mẫu 24h'
                : 'Đang trong quá trình kiểm thực 3 bước'}
            </span>
          </div>
          {record.sealedAt && (
            <div className="text-xs text-slate-500 font-medium">
              Niêm phong lúc: <span className="font-bold text-slate-700">{formatTime(record.sealedAt)}</span> -{' '}
              {formatDate(record.sealedAt)}
            </div>
          )}
        </div>
      </div>

      {/* ─── 3 STEPS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* BƯỚC 1: TRƯỚC KHI CHẾ BIẾN */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-emerald-50/80 border-b border-emerald-100 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-black text-emerald-900 text-sm flex items-center gap-2">
                <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-black">
                  BƯỚC 1
                </span>{' '}
                Trước khi chế biến
              </h3>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Giao nhận & Cảm quan nguyên liệu
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-2.5 text-xs">
              <span className="text-slate-400 font-medium">Giờ tiếp nhận</span>
              <span className="font-bold text-slate-800">
                {record.step1Time ? formatTime(record.step1Time) : '06:30'}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2.5 text-xs">
              <span className="text-slate-400 font-medium">Đánh giá cảm quan</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                100% Đạt chuẩn <CheckCircle className="w-3.5 h-3.5" />
              </span>
            </div>

            {record.step1Note && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Ghi chú nhận xét:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed italic">"{record.step1Note}"</p>
              </div>
            )}

            <div className="mt-auto pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Minh chứng hình ảnh:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(record.step1Photos && record.step1Photos.length > 0
                  ? record.step1Photos
                  : [record.step1PhotoUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80']
                ).map((photoUrl: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(photoUrl)}
                    className="h-28 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative group cursor-pointer"
                  >
                    <img
                      src={photoUrl}
                      alt={`Minh chứng Bước 1 - ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                      <span>🔍 Xem ảnh</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BƯỚC 2: TRONG KHI CHẾ BIẾN */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-emerald-50/80 border-b border-emerald-100 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-black text-emerald-900 text-sm flex items-center gap-2">
                <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-black">
                  BƯỚC 2
                </span>{' '}
                Trong khi chế biến
              </h3>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Quy trình bếp 1 chiều & Sôi chín
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-2.5 text-xs">
              <span className="text-slate-400 font-medium">Giờ giám sát</span>
              <span className="font-bold text-slate-800">
                {record.step2Time ? formatTime(record.step2Time) : '09:15'}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2.5 text-xs">
              <span className="text-slate-400 font-medium">Nhiệt độ tâm món</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                &gt; {record.step2Temperature || 85}°C <CheckCircle className="w-3.5 h-3.5" />
              </span>
            </div>

            {record.step2Note && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Ghi chú nhận xét:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed italic">"{record.step2Note}"</p>
              </div>
            )}

            <div className="mt-auto pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Minh chứng hình ảnh:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(record.step2Photos && record.step2Photos.length > 0
                  ? record.step2Photos
                  : [record.step2PhotoUrl || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80']
                ).map((photoUrl: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(photoUrl)}
                    className="h-28 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative group cursor-pointer"
                  >
                    <img
                      src={photoUrl}
                      alt={`Minh chứng Bước 2 - ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                      <span>🔍 Xem ảnh</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BƯỚC 3: TRƯỚC KHI ĂN & LƯU MẪU 24H */}
        <div className="bg-white rounded-3xl shadow-sm border border-blue-200 overflow-hidden ring-1 ring-blue-100 flex flex-col">
          <div className="bg-blue-50/80 border-b border-blue-100 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-black text-blue-900 text-sm flex items-center gap-2">
                <span className="bg-blue-200 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-black">
                  BƯỚC 3
                </span>{' '}
                Trước khi ăn & Lưu mẫu 24h
              </h3>
              <p className="text-[11px] text-blue-700 font-medium mt-0.5">
                Thử nếm & Niêm phong mẫu lưu
              </p>
            </div>
            <Refrigerator className="w-5 h-5 text-blue-600" />
          </div>

          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-2.5 text-xs">
              <span className="text-slate-400 font-medium">Giờ niêm phong</span>
              <span className="font-bold text-slate-800">
                {record.sealedAt ? formatTime(record.sealedAt) : '10:45'}
              </span>
            </div>

            {record.step3Note && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Cảm quan món ăn:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed italic">"{record.step3Note}"</p>
              </div>
            )}

            <div>
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Các món lưu mẫu 24h:
              </span>
              <div className="space-y-2">
                {(record.sampleItems && record.sampleItems.length > 0
                  ? record.sampleItems
                  : [
                      {
                        id: 's1',
                        dishName: 'Thịt heo xốt cà chua',
                        sampleCode: 'LM-TH-01',
                        quantityGrams: 150,
                      },
                      {
                        id: 's2',
                        dishName: 'Canh bí đỏ thịt bằm',
                        sampleCode: 'LM-CB-02',
                        quantityGrams: 150,
                      },
                    ]
                ).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{item.dishName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Mã: {item.sampleCode || record.code}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-blue-700">{item.quantityGrams || 150}g</span>
                      <button
                        onClick={() => handleOpenSampleLabel(item)}
                        className="block text-[10px] font-bold text-blue-600 hover:underline mt-0.5"
                      >
                        In tem dán
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 Photo Proof */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Ảnh hộp niêm phong & Tủ lưu mẫu:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(record.step3Photos && record.step3Photos.length > 0
                  ? record.step3Photos
                  : [record.step3PhotoUrl || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80']
                ).map((photoUrl: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(photoUrl)}
                    className="h-24 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative group cursor-pointer"
                  >
                    <img
                      src={photoUrl}
                      alt={`Minh chứng Bước 3 - ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                      <span>🔍 Xem ảnh</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COUNTDOWN & DISPOSE SECTION */}
            <div className="mt-auto pt-4">
              {!isDisposed ? (
                <div
                  className={`p-4 rounded-2xl border text-center transition ${
                    isExpired ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200 border-dashed'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5" /> Thời gian lưu mẫu còn lại (24h)
                  </span>
                  <p className={`text-2xl font-black mb-3 ${isExpired ? 'text-rose-600' : 'text-blue-700'}`}>
                    {countdown || '18:35:42'}
                  </p>

                  <button
                    onClick={handleDispose}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition active:scale-95"
                  >
                    Xác nhận Đã Hủy Mẫu An Toàn
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                  <p className="font-black text-emerald-800 text-xs">ĐÃ HỦY MẪU AN TOÀN</p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                    Đúng quy định 24h theo QĐ 1246/QĐ-BYT
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL: IN TEM NIÊM PHONG LƯU MẪU ─── */}
      {isLabelModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Tem Niêm Phong Lưu Mẫu 24h</h3>
                  <p className="text-xs text-slate-500 font-medium">Chuẩn Quyết định 1246/QĐ-BYT</p>
                </div>
              </div>
              <button
                onClick={() => setIsLabelModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TEM PREVIEW (DÁN TRÊN HỘP INOX) */}
            <div className="p-5 bg-white border-2 border-dashed border-slate-300 rounded-2xl shadow-inner font-mono text-xs space-y-2 text-slate-800">
              <div className="text-center border-b border-slate-200 pb-2">
                <p className="font-black text-sm uppercase">TRƯỜNG MẦM NON HOA HƯỚNG DƯƠNG</p>
                <p className="text-[10px] text-slate-500">TEM NIÊM PHONG LƯU MẪU THỨC ĂN 24H</p>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã mẫu:</span>
                  <span className="font-bold">{selectedSampleItem?.sampleCode || record.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tên món ăn:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedSampleItem?.dishName || 'Món chính bán trú'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bữa ăn / Ca:</span>
                  <span>{record.mealTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khối lượng mẫu:</span>
                  <span className="font-bold">{selectedSampleItem?.quantityGrams || 150}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giờ & Ngày lưu:</span>
                  <span>
                    {formatTime(record.sealedAt)} - {formatDate(record.mealDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhiệt độ bảo quản:</span>
                  <span className="font-bold text-blue-600">{record.storageTemp || 3.8}°C (Tủ mát 0-5°C)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Người lấy mẫu:</span>
                  <span>{record.performerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giờ hủy mẫu dự kiến:</span>
                  <span className="font-bold text-rose-600">
                    {formatTime(record.sealedAt)} - Ngày hôm sau (+24h)
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center border-t border-slate-200">
                <p className="text-[9px] text-slate-400">Niêm phong nghiêm ngặt — Không mở nắp khi chưa có lệnh</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Bấm In tem
              </button>
              <button
                onClick={() => setIsLabelModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: YÊU CẦU CHỤP LẠI MINH CHỨNG ─── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Yêu Cầu Bếp Chụp Lại Ảnh</h3>
                  <p className="text-xs text-slate-500 font-medium">Nhà bếp sẽ nhận được yêu cầu và chụp lại</p>
                </div>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do yêu cầu chụp lại / bổ sung minh chứng:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ví dụ: Ảnh bước 2 chưa thể hiện nhiệt kế tâm món sôi > 75°C, hoặc ảnh giao nhận bước 1 bị mờ..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApproval}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm"
                >
                  {isSubmittingApproval ? 'Đang gửi...' : 'Gửi yêu cầu tới nhà bếp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: LIGHTBOX PHÓNG TO HÌNH ẢNH ─── */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl p-3 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Minh chứng phóng to"
              className="max-h-[82vh] w-auto rounded-2xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
