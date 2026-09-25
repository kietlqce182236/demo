import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building,
  Phone,
  Mail,
  QrCode,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { userProfileApi, UserProfile, TwoFactorSetupResponse } from '../../../core/api/user-profile.api';
import { useAuthStore } from '../../../core/stores/auth.store';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { user: authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states - Profile
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Form states - Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form states - 2FA
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setMessage(null);
      setTwoFactorSetup(null);
      setTotpCode('');
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await userProfileApi.getMyProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setPhone(data.phone || '');
    } catch {
      // Fallback từ auth store nếu API chưa sẵn sàng
      if (authUser) {
        setProfile({
          id: authUser.id,
          email: authUser.email,
          fullName: authUser.fullName,
          phone: '(028) 3829 4999',
          avatarUrl: '',
          status: 'ACTIVE',
          twoFactorEnabled: false,
          roles: authUser.roles.map((r, i) => ({ id: `r-${i}`, code: r, name: r })),
          tenantId: authUser.tenantId || null,
          tenant: {
            id: authUser.tenantId || 'saomai-01',
            code: 'MN_SAOMAI',
            name: 'Trường Mầm Non Sao Mai',
            phone: '(028) 3829 4999',
            address: '128 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
            contactEmail: 'saomai@nutribud.vn',
          },
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
        setFullName(authUser.fullName || '');
        setPhone('(028) 3829 4999');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await userProfileApi.updateMyProfile({ fullName, phone });
      setProfile(updated);
      setMessage({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công!' });
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ cá nhân.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp!' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 8 ký tự!' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await userProfileApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setMessage({ type: 'success', text: res.message || 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Mật khẩu hiện tại không chính xác.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStart2FA = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await userProfileApi.setup2FA();
      setTwoFactorSetup(res);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể khởi tạo mã QR 2FA.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đúng 6 chữ số mã xác thực OTP!' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await userProfileApi.enable2FA(totpCode);
      setRecoveryCodes(res.recoveryCodes || []);
      setProfile((prev) => (prev ? { ...prev, twoFactorEnabled: true } : null));
      setMessage({ type: 'success', text: res.message });
      setTwoFactorSetup(null);
      setTotpCode('');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Mã xác thực OTP không đúng.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    const code = prompt('Nhập mã OTP 6 số hiện tại để xác nhận tắt 2FA:');
    if (!code) return;

    setSaving(true);
    setMessage(null);
    try {
      await userProfileApi.disable2FA(code);
      setProfile((prev) => (prev ? { ...prev, twoFactorEnabled: false } : null));
      setMessage({ type: 'success', text: 'Đã tắt xác thực 2 bước thành công!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Mã OTP không hợp lệ để tắt 2FA.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (code: string) => {
    switch (code) {
      case 'PRINCIPAL':
      case 'SUPER_ADMIN':
        return { label: 'Ban Giám Hiệu / Hiệu Trưởng', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'NUTRITIONIST':
        return { label: 'Chuyên Viên Dinh Dưỡng', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'KITCHEN_MANAGER':
      case 'KITCHEN_STAFF':
        return { label: 'Bếp Trưởng / Nhân Viên Bếp', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'TEACHER':
        return { label: 'Giáo Viên Chủ Nhiệm', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'PARENT':
        return { label: 'Phụ Huynh Học Sinh', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: code, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'TT'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{profile?.fullName || 'Hồ sơ người dùng'}</h3>
                {profile?.twoFactorEnabled && (
                  <span className="bg-emerald-400/20 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3" /> 2FA Bật
                  </span>
                )}
              </div>
              <p className="text-teal-100 text-xs mt-0.5">{profile?.email || authUser?.email}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile?.roles?.map((r) => {
                  const badge = getRoleBadge(r.code);
                  return (
                    <span
                      key={r.id || r.code}
                      className="text-[11px] font-medium bg-white/20 text-white px-2 py-0.5 rounded-md"
                    >
                      {badge.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-3 gap-2">
          <button
            onClick={() => { setActiveTab('profile'); setMessage(null); }}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'profile'
                ? 'border-teal-600 text-teal-700 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-4 h-4" /> Thông tin cá nhân
          </button>
          <button
            onClick={() => { setActiveTab('password'); setMessage(null); }}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'password'
                ? 'border-teal-600 text-teal-700 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Đổi mật khẩu
          </button>
          <button
            onClick={() => { setActiveTab('security'); setMessage(null); }}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'security'
                ? 'border-teal-600 text-teal-700 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Bảo mật 2 lớp (2FA)
          </button>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className="px-6 pt-4">
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-xs">Đang tải hồ sơ người dùng...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: THÔNG TIN CÁ NHÂN */}
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                        placeholder="Nguyễn Thu Thủy"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Email đăng nhập (Cố định)
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={profile?.email || ''}
                          disabled
                          className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Số điện thoại liên hệ
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                          placeholder="(028) 3829 4999"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Cơ sở trường mầm non
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profile?.tenant?.name || 'Trường Mầm Non Sao Mai'}
                          disabled
                          className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                        />
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>

                  {/* Địa chỉ trường học */}
                  {profile?.tenant?.address && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                      <Building className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">Địa chỉ cơ sở:</span>{' '}
                        {profile.tenant.address}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: ĐỔI MẬT KHẨU */}
              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Mật khẩu mới (tối thiểu 8 ký tự)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="••••••••"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="••••••••"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    💡 Mẹo bảo mật: Sử dụng kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt để tài khoản an toàn hơn.
                  </p>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: BẢO MẬT 2 LỚP (2FA) */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  {/* Trạng thái 2FA */}
                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          profile?.twoFactorEnabled
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {profile?.twoFactorEnabled ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : (
                          <ShieldAlert className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          {profile?.twoFactorEnabled
                            ? 'Xác thực 2 bước (2FA) đang BẬT'
                            : 'Xác thực 2 bước (2FA) chưa được bật'}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Bảo vệ tài khoản bằng mã OTP 6 số qua Google Authenticator hoặc Authy
                        </p>
                      </div>
                    </div>
                    {profile?.twoFactorEnabled ? (
                      <button
                        onClick={handleDisable2FA}
                        disabled={saving}
                        className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                      >
                        Tắt 2FA
                      </button>
                    ) : (
                      !twoFactorSetup && (
                        <button
                          onClick={handleStart2FA}
                          disabled={saving}
                          className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
                        >
                          <QrCode className="w-4 h-4" /> Thiết lập 2FA
                        </button>
                      )
                    )}
                  </div>

                  {/* Flow Setup 2FA: Hiện QR Code */}
                  {twoFactorSetup && !profile?.twoFactorEnabled && (
                    <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-4">
                      <div className="flex items-start gap-4">
                        {twoFactorSetup.qrCodeDataUrl ? (
                          <img
                            src={twoFactorSetup.qrCodeDataUrl}
                            alt="2FA QR Code"
                            className="w-32 h-32 rounded-xl border border-teal-300 bg-white p-1 shadow-sm"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-white rounded-xl border flex items-center justify-center">
                            <QrCode className="w-12 h-12 text-slate-300" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <h5 className="text-xs font-bold text-teal-900">
                            Bước 1: Quét mã QR bằng ứng dụng Authenticator
                          </h5>
                          <p className="text-[11px] text-teal-700 leading-relaxed">
                            Mở Google Authenticator, Authy hoặc Microsoft Authenticator trên điện thoại, chọn Quét mã QR.
                          </p>
                          <div className="text-[11px] text-slate-600">
                            Hoặc nhập secret key thủ công:
                            <div className="flex items-center gap-2 mt-1">
                              <code className="bg-white px-2.5 py-1 rounded-md border text-[11px] font-mono text-teal-900">
                                {twoFactorSetup.secret}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(twoFactorSetup.secret);
                                  setCopiedSecret(true);
                                  setTimeout(() => setCopiedSecret(false), 2000);
                                }}
                                className="text-slate-500 hover:text-teal-700 p-1 text-xs"
                              >
                                {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleEnable2FA} className="border-t border-teal-200/60 pt-3 flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold text-teal-900 mb-1">
                            Bước 2: Nhập mã OTP 6 số hiển thị trên app điện thoại:
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="Ví dụ: 123456"
                            className="w-full text-center tracking-widest font-mono text-base font-bold py-2 rounded-xl border border-teal-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div className="self-end">
                          <button
                            type="submit"
                            disabled={saving || totpCode.length !== 6}
                            className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-md transition"
                          >
                            Xác nhận kích hoạt
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Hiển thị Recovery Codes sau khi kích hoạt */}
                  {recoveryCodes.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Lưu trữ 8 mã khôi phục (Recovery Codes)
                      </div>
                      <p className="text-[11px] text-amber-700">
                        Nếu bạn mất điện thoại hoặc không mở được ứng dụng Authenticator, bạn có thể dùng một trong các mã này để đăng nhập:
                      </p>
                      <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                        {recoveryCodes.map((c, i) => (
                          <div key={i} className="bg-white border border-amber-300 py-1 text-center rounded font-semibold text-slate-800">
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
