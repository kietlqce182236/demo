import React, { useState } from 'react';
import { X, Building, Phone, Calendar, ShieldCheck, UserCheck, Loader2 } from 'lucide-react';
import { TenantProfile, tenantApi, UpdateTenantProfileInput } from '../../../core/api/tenant.api';

interface EditSchoolInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TenantProfile;
  onSaved: (updated: TenantProfile) => void;
}

export const EditSchoolInfoModal: React.FC<EditSchoolInfoModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaved,
}) => {
  const [address, setAddress] = useState(profile.address || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [contactEmail, setContactEmail] = useState(profile.contactEmail || '');
  const [licenseNumber, setLicenseNumber] = useState(profile.foodSafetyLicense?.number || '');
  const [expiryDate, setExpiryDate] = useState(profile.foodSafetyLicense?.expiryDate || '');
  const [repName, setRepName] = useState(profile.legalRepresentative?.name || '');
  const [repTitle, setRepTitle] = useState(profile.legalRepresentative?.title || 'Hiệu trưởng');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const updatePayload: UpdateTenantProfileInput = {
      address,
      phone,
      contactEmail,
      foodSafetyLicense: {
        number: licenseNumber,
        expiryDate,
      },
      legalRepresentative: {
        name: repName,
        title: repTitle,
      },
    };

    try {
      const updated = await tenantApi.updateProfile(updatePayload);
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin trường học.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Building className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Chỉnh sửa thông tin cơ sở trường</h3>
              <p className="text-xs text-teal-200">Cập nhật hồ sơ pháp lý và thông tin liên hệ nhà trường</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-teal-600" /> Địa chỉ cơ sở trường
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              placeholder="128 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" /> Hotline tiếp đón
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder="(028) 3829 4999"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email liên hệ
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder="contact@saomai.edu.vn"
              />
            </div>
          </div>

          <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
            <h4 className="text-xs font-bold text-teal-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> Giấy phép An toàn thực phẩm (ATTP)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-teal-950 mb-1">
                  Số giấy phép
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-teal-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  placeholder="458/2023/ATTP-Q3"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-teal-950 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-teal-600" /> Ngày hết hạn
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-teal-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" /> Đại diện ký duyệt thực đơn
              </label>
              <input
                type="text"
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder="Nguyễn Thu Thủy"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chức vụ pháp lý
              </label>
              <input
                type="text"
                value={repTitle}
                onChange={(e) => setRepTitle(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder="Hiệu trưởng"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Lưu thông tin pháp lý
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
