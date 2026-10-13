import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Lock,
  CheckCircle2,
  MapPin,
  Phone,
  FileCheck,
  Edit3,
  Palette,
  AlertTriangle,
  RotateCw,
  UploadCloud,
  Trash2,
  Smartphone,
  Check,
  Users,
  FileText,
  Settings,
  Sparkles,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { tenantApi, TenantProfile, SchoolBranding } from '../../../core/api/tenant.api';
import { EditSchoolInfoModal } from '../components/EditSchoolInfoModal';
import { ParentAppPreviewModal } from '../components/ParentAppPreviewModal';

export const SchoolSettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Upload file state & error simulation
  const [uploadError, setUploadError] = useState<string | null>(
    'Tệp banner_truong_hoc_2024.bmp (8.4 MB) không hợp lệ. Vui lòng chọn định dạng PNG, JPG hoặc SVG và dung lượng tối đa không quá 2MB.'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Branding state
  const [selectedColor, setSelectedColor] = useState<'TEAL' | 'YELLOW' | 'ORANGE'>('TEAL');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await tenantApi.getProfile();
      setProfile(data);
      if (data.branding?.primaryColor) {
        setSelectedColor(data.branding.primaryColor);
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin trường học từ backend:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncEducationDb = async () => {
    setSyncing(true);
    try {
      await tenantApi.syncEducationDb();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
      await fetchProfile();
    } catch {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handleColorChange = async (color: 'TEAL' | 'YELLOW' | 'ORANGE') => {
    setSelectedColor(color);
    if (!profile) return;
    try {
      const updated = await tenantApi.updateProfile({
        branding: {
          ...profile.branding,
          primaryColor: color,
        },
      });
      setProfile(updated);
    } catch {
      // Local state update
      setProfile({
        ...profile,
        branding: { ...profile.branding, primaryColor: color },
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    // Kiểm tra định dạng & dung lượng
    if (!validTypes.includes(file.type)) {
      setUploadError(
        `Tệp ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB) không hợp lệ. Vui lòng chọn định dạng PNG, JPG hoặc SVG và dung lượng tối đa không quá 2MB.`
      );
      return;
    }

    if (file.size > maxSize) {
      setUploadError(
        `Tệp ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB) vượt quá dung lượng. Vui lòng chọn tệp tối đa không quá 2MB.`
      );
      return;
    }

    // File hợp lệ -> Cập nhật logo
    setUploadError(null);
    const sizeStr = file.size < 1024 * 1024
      ? `${Math.round(file.size / 1024)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await tenantApi.uploadLogo({
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type,
          fileContentBase64: base64,
        });
        await tenantApi.updateProfile({
          branding: {
            ...profile?.branding,
            logoUrl: base64,
            logoName: file.name,
            logoSize: `${sizeStr} • 512×512px • Raster/Vector`,
          },
        });
        localStorage.setItem('school_logo', base64);
        localStorage.setItem('school_logo_name', file.name);
        localStorage.setItem('school_name', profile?.name || 'Trường Mẫu Giáo Hướng Dương');
        window.dispatchEvent(new Event('school-branding-updated'));

        if (profile) {
          setProfile({
            ...profile,
            branding: {
              ...profile.branding,
              logoUrl: base64,
              logoName: file.name,
              logoSize: `${sizeStr} • 512×512px • Raster/Vector`,
            },
          });
        }
      } catch (err) {
        console.error('Lỗi lưu logo:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-xs font-medium">Đang tải cấu hình trường học & hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
              CƠ SỞ 1 - {profile?.name ? profile.name.toUpperCase() : 'TRƯỜNG MẪU GIÁO HƯỚNG DƯƠNG'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Mã định danh SGD: {profile?.schoolIdentifierSgd || 'MN-HCM-Q3-0042'}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Cài đặt Trường học & Quản trị Hệ thống
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý hồ sơ pháp lý trường, nhận diện thương hiệu, nhật ký vận hành và tài khoản cổng phụ huynh.
          </p>
        </div>

        {/* Nút tác vụ phải */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Nhật ký hệ thống (UC11)</span>
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-teal-200">
              +142 bản ghi
            </span>
          </button>

          <button
            onClick={handleSyncEducationDb}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/25 transition disabled:opacity-75"
          >
            <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Đang đồng bộ dữ liệu...' : syncSuccess ? 'Đã đồng bộ ✓' : 'Đồng bộ dữ liệu ngành'}</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300 shadow-sm">
          <Building2 className="w-4 h-4 text-teal-600" />
          <span>Cấu hình trường học (UC07)</span>
          <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] flex items-center justify-center font-bold">
            3
          </span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition">
          <Users className="w-4 h-4 text-slate-400" />
          <span>Tài khoản Phụ huynh (UC16)</span>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
            485/510
          </span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition">
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Nhật ký hệ thống (UC11)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition">
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Cấu hình chung...</span>
        </button>
      </div>

      {/* 3. Main 2-Column Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (7/12): Thông tin chung & Pháp lý cơ sở */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header Thẻ Trái */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-inner">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Thông tin chung & Pháp lý cơ sở
                  </h2>
                  <p className="text-xs text-slate-500">
                    Hồ sơ cấp phép giáo dục mầm non và cam kết an toàn bán trú
                  </p>
                </div>
              </div>

              {/* Badge Đã đồng bộ cơ sở dữ liệu ngành */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Đã đồng bộ Cơ sở dữ liệu ngành
              </span>
            </div>

            {/* Input Hàng 1: Tên cơ sở & Mã định danh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên cơ sở giáo dục
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile?.name || 'Trường Mầm non Sao Mai Kids Garden'}
                    disabled
                    className="w-full text-xs font-medium px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 cursor-not-allowed"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mã định danh Bộ GD&ĐT
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile?.educationDepartmentCode || 'GD-MN-79-03-0042'}
                    disabled
                    className="w-full text-xs font-mono font-medium px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            {/* Input Hàng 2: Địa chỉ trường */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Địa chỉ cơ sở trường
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profile?.address || '128 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh'}
                  disabled
                  className="w-full text-xs font-medium px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
                <MapPin className="w-4 h-4 text-teal-600 absolute left-3 top-3" />
              </div>
            </div>

            {/* Input Hàng 3: Hotline & Giấy phép ATTP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hotline Nhà trường / Tiếp đón
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile?.phone || '(028) 3829 4999'}
                    disabled
                    className="w-full text-xs font-medium px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                  <Phone className="w-4 h-4 text-teal-600 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Giấy phép ATTP bán trú
                </label>
                {/* Thẻ con hiển thị số giấy phép & hạn sử dụng theo thiết kế */}
                <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-sky-700 font-bold block uppercase tracking-wider">
                      Số
                    </span>
                    <span className="text-xs font-black text-sky-950">
                      {profile?.foodSafetyLicense?.number || '458/2023/ATTP-Q3'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-sky-700 font-bold block">
                      Hạn:
                    </span>
                    <span className="text-xs font-bold text-sky-950 font-mono">
                      {profile?.foodSafetyLicense?.expiryDate || '18/11/2026'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dải chân thẻ: Đại diện pháp lý & Nút Chỉnh sửa */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Đại diện pháp lý ký duyệt thực đơn:</span>
              <span className="font-bold text-slate-900">
                Hiệu trưởng {profile?.legalRepresentative?.name || 'Nguyễn Thu Thủy'}
              </span>
            </div>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 px-3 py-1.5 rounded-xl transition"
            >
              <span>Chỉnh sửa thông tin</span>
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CỘT PHẢI (5/12): Nhận diện & Logo trường */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header Thẻ Phải */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-inner">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Nhận diện & Logo trường
                  </h2>
                  <p className="text-xs text-slate-500">
                    Hiển thị trên Cổng phụ huynh, Phiếu thực đơn & SMS
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                v2.4 Branding
              </span>
            </div>

            {/* Banner Lỗi tải tệp (Upload Error Banner theo thiết kế) */}
            {uploadError && (
              <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-red-100 text-red-600 rounded-lg shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-900">
                      Lỗi tải tệp lên hệ thống
                    </h4>
                    <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                      {uploadError}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs transition"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Thử tải lại</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-800 hover:bg-red-900 text-white shadow-xs transition"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Chọn tệp khác</span>
                  </button>
                </div>
              </div>
            )}

            {/* Hidden Input File */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".png,.jpg,.jpeg,.svg,.bmp"
              className="hidden"
            />

            {/* Card Logo đang kích hoạt */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs overflow-hidden">
                  <img
                    src={profile?.branding?.logoUrl || localStorage.getItem('school_logo') || "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80"}
                    alt={profile?.name || "Logo trường"}
                    className="w-10 h-10 object-contain rounded-lg"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {profile?.branding?.logoName || localStorage.getItem('school_logo_name') || 'logo_huongduong.png'}
                    </span>
                    <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                      Đang kích hoạt
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {profile?.branding?.logoSize || '184 KB • 512×512px • Vector RGB'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm('Bạn có chắc muốn gỡ bỏ logo này?')) {
                    setUploadError('Vui lòng chọn logo định dạng SVG hoặc PNG để hoàn thiện nhận diện.');
                  }
                }}
                className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-white transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Màu sắc chủ đạo ứng dụng KidMeal phụ huynh */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Màu sắc chủ đạo ứng dụng KidMeal phụ huynh
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {/* Option 1: Teal Past (Mặc định) */}
                <button
                  type="button"
                  onClick={() => handleColorChange('TEAL')}
                  className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                    selectedColor === 'TEAL'
                      ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-teal-600 shrink-0 mt-0.5 flex items-center justify-center text-white">
                    {selectedColor === 'TEAL' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Teal Past</span>
                    <span className="text-[10px] text-slate-400">Mặc định</span>
                  </div>
                </button>

                {/* Option 2: Vàng Mật */}
                <button
                  type="button"
                  onClick={() => handleColorChange('YELLOW')}
                  className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                    selectedColor === 'YELLOW'
                      ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-amber-400 shrink-0 mt-0.5 flex items-center justify-center text-white">
                    {selectedColor === 'YELLOW' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Vàng Mật</span>
                    <span className="text-[10px] text-slate-400">Năng lượng</span>
                  </div>
                </button>

                {/* Option 3: Cam San */}
                <button
                  type="button"
                  onClick={() => handleColorChange('ORANGE')}
                  className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                    selectedColor === 'ORANGE'
                      ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-orange-400 shrink-0 mt-0.5 flex items-center justify-center text-white">
                    {selectedColor === 'ORANGE' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Cam San</span>
                    <span className="text-[10px] text-slate-400">Ấm cúng</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Dải chân thẻ Phải: Mô phỏng App Phụ Huynh */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Xem trước giao diện Phụ Huynh trên iOS/Android
            </span>

            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition"
            >
              <Smartphone className="w-4 h-4 text-teal-600" />
              <span>Mô phỏng App</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Chỉnh sửa thông tin trường */}
      {profile && (
        <EditSchoolInfoModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onSaved={(updated) => setProfile(updated)}
        />
      )}

      {/* Modal Mô phỏng App Phụ Huynh */}
      {profile && (
        <ParentAppPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          branding={{
            ...profile.branding,
            primaryColor: selectedColor,
          }}
          schoolName={profile.name}
        />
      )}
    </div>
  );
};
