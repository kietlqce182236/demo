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
  Eye,
  EyeOff,
  Download,
  Smartphone,
  Lock,
  RefreshCw,
} from 'lucide-react';
import {
  userProfileApi,
  UserProfile,
  TwoFactorSetupResponse,
} from '../../../core/api/user-profile.api';
import { useAuthStore } from '../../../core/stores/auth.store';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
  defaultTab?: 'profile' | 'password' | 'security';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  defaultTab = 'profile',
}) => {
  const { user: authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security'>(defaultTab);
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states - 2FA Setup
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedAllCodes, setCopiedAllCodes] = useState(false);

  // Form states - 2FA Disable Modal/Card
  const [showDisable2FAConfirm, setShowDisable2FAConfirm] = useState(false);
  const [disableTotpCode, setDisableTotpCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      loadProfile();
      setMessage(null);
      setTwoFactorSetup(null);
      setTotpCode('');
      setShowDisable2FAConfirm(false);
      setDisableTotpCode('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, defaultTab]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await userProfileApi.getMyProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setPhone(data.phone || '');
    } catch {
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
            id: authUser.tenantId || 'huongduong-01',
            code: 'MG_HUONGDUONG',
            name: localStorage.getItem('school_name') || 'Trường Mẫu Giáo Hướng Dương',
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

  // Password Strength Calculation (0 - 4)
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(newPassword);

  const getStrengthMeta = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return { label: 'Rất yếu', color: 'bg-red-500', text: 'text-red-500' };
      case 2:
        return { label: 'Yếu', color: 'bg-amber-500', text: 'text-amber-500' };
      case 3:
        return { label: 'Tốt', color: 'bg-teal-500', text: 'text-teal-500' };
      case 4:
        return { label: 'Rất mạnh', color: 'bg-emerald-500', text: 'text-emerald-500' };
      default:
        return { label: '', color: 'bg-slate-200', text: 'text-slate-400' };
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp!' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 8 ký tự!' });
      return;
    }
    if (newPassword === currentPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải khác mật khẩu hiện tại!' });
      return;
    }

    setSaving(true);
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
        text: err?.response?.data?.message || 'Không thể khởi tạo cấu hình 2FA.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đủ 6 chữ số mã xác thực từ app Authenticator!' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await userProfileApi.enable2FA(totpCode);
      setRecoveryCodes(res.recoveryCodes || []);
      setProfile((prev) => (prev ? { ...prev, twoFactorEnabled: true } : null));
      setMessage({ type: 'success', text: res.message || 'Kích hoạt xác thực 2 bước (2FA) thành công!' });
      setTwoFactorSetup(null);
      setTotpCode('');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Mã xác thực OTP không chính xác hoặc đã hết hạn.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableTotpCode || disableTotpCode.length !== 6) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đủ 6 chữ số OTP từ Google Authenticator để tắt 2FA.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await userProfileApi.disable2FA(disableTotpCode);
      setProfile((prev) => (prev ? { ...prev, twoFactorEnabled: false } : null));
      setMessage({ type: 'success', text: 'Đã tắt xác thực 2 bước (2FA) thành công!' });
      setShowDisable2FAConfirm(false);
      setDisableTotpCode('');
      setRecoveryCodes([]);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Mã OTP không hợp lệ để tắt 2FA.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadRecoveryCodes = () => {
    if (recoveryCodes.length === 0) return;
    const content = `KIDMEAL - 8 MÃ KHÔI PHỤC BẢO MẬT 2FA (RECOVERY CODES)
Tài khoản: ${profile?.email || authUser?.email}
Ngày tạo: ${new Date().toLocaleString('vi-VN')}
--------------------------------------------------
${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}
--------------------------------------------------
Lưu ý: Mỗi mã chỉ có giá trị sử dụng 01 lần duy nhất khi bạn mất quyền truy cập ứng dụng Google Authenticator.`;

    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `kidmeal-recovery-codes-${profile?.email || 'user'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getRoleBadge = (code: string) => {
    switch (code) {
      case 'PRINCIPAL':
      case 'SUPER_ADMIN':
        return { label: 'Ban Giám Hiệu / Hiệu Trưởng', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'NUTRITIONIST':
        return { label: 'Chuyên viên Dinh dưỡng', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'TEACHER':
        return { label: 'Giáo viên Chủ nhiệm', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'KITCHEN_MANAGER':
        return { label: 'Bếp trưởng Bán trú', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'PARENT':
        return { label: 'Phụ huynh học sinh', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { label: code, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Background */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 px-6 pt-6 pb-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-xl border border-white/30 shadow-inner">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'TT'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{profile?.fullName || 'Hồ sơ người dùng'}</h3>
                {profile?.twoFactorEnabled ? (
                  <span className="bg-emerald-400/20 text-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" /> 2FA ĐANG BẬT
                  </span>
                ) : (
                  <span className="bg-amber-400/20 text-amber-200 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1 font-bold">
                    <ShieldAlert className="w-3 h-3 text-amber-300" /> 2FA CHƯA BẬT
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
                      className="text-[11px] font-medium bg-white/20 text-white px-2.5 py-0.5 rounded-md backdrop-blur-sm"
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
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3 gap-2 shrink-0">
          <button
            onClick={() => { setActiveTab('profile'); setMessage(null); }}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'profile'
                ? 'border-teal-600 text-teal-800 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Thông tin cá nhân
          </button>
          <button
            onClick={() => { setActiveTab('password'); setMessage(null); }}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'password'
                ? 'border-teal-600 text-teal-800 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Đổi mật khẩu
          </button>
          <button
            onClick={() => { setActiveTab('security'); setMessage(null); }}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-t-xl transition border-b-2 ${
              activeTab === 'security'
                ? 'border-teal-600 text-teal-800 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Xác thực 2 bước (2FA)
          </button>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className="px-6 pt-4 shrink-0">
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium ${
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
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-xs font-medium">Đang tải thông tin tài khoản...</p>
            </div>
          ) : (
            <>
              {/* ─── TAB 1: THÔNG TIN CÁ NHÂN ──────────────────────────────── */}
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email đăng nhập (Cố định)
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={profile?.email || ''}
                          disabled
                          className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Cơ sở trường mầm non
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profile?.tenant?.name || localStorage.getItem('school_name') || 'Trường Mẫu Giáo Hướng Dương'}
                          disabled
                          className="w-full text-xs px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                        />
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
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

                  <div className="pt-3 flex justify-end gap-3">
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
                      className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              )}

              {/* ─── TAB 2: ĐỔI MẬT KHẨU CÁ NHÂN ─────────────────────────── */}
              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Mật khẩu hiện tại */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Nhập mật khẩu bạn đang sử dụng"
                        className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Mật khẩu mới & Xác nhận mật khẩu mới */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mật khẩu mới (Tối thiểu 8 ký tự)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                          placeholder="Mật khẩu mới an toàn"
                          className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password strength meter */}
                      {newPassword && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Độ mạnh:</span>
                            <span className={`font-bold ${getStrengthMeta(strengthScore).text}`}>
                              {getStrengthMeta(strengthScore).label}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 h-1.5">
                            {[1, 2, 3, 4].map((lvl) => (
                              <div
                                key={lvl}
                                className={`rounded-full transition-all duration-300 ${
                                  strengthScore >= lvl
                                    ? getStrengthMeta(strengthScore).color
                                    : 'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-[11px] text-red-500 mt-1">Mật khẩu xác nhận chưa khớp</p>
                      )}
                    </div>
                  </div>

                  {/* Checklist bảo mật */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-700">Yêu cầu tiêu chuẩn an toàn:</p>
                    <div className="grid grid-cols-2 gap-1 text-slate-500">
                      <span className={newPassword.length >= 8 ? 'text-emerald-600 font-semibold' : ''}>
                        • Tối thiểu 8 ký tự
                      </span>
                      <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-semibold' : ''}>
                        • Có ít nhất 1 chữ hoa (A-Z)
                      </span>
                      <span className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-semibold' : ''}>
                        • Có ít nhất 1 chữ số (0-9)
                      </span>
                      <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600 font-semibold' : ''}>
                        • Ký tự đặc biệt (@, #, $, ...)
                      </span>
                    </div>
                  </div>

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
                      disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
                      className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Cập nhật mật khẩu mới
                    </button>
                  </div>
                </form>
              )}

              {/* ─── TAB 3: BẢO MẬT 2 LỚP (2FA TOTP) VỚI GG AUTH ──────────── */}
              {activeTab === 'security' && (
                <div className="space-y-5">
                  {/* Trạng thái 2FA */}
                  <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                          profile?.twoFactorEnabled
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {profile?.twoFactorEnabled ? (
                          <ShieldCheck className="w-6 h-6" />
                        ) : (
                          <ShieldAlert className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {profile?.twoFactorEnabled
                              ? 'Xác thực 2 yếu tố (2FA) đang BẬT'
                              : 'Xác thực 2 yếu tố (2FA) chưa được bật'}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-600 flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-teal-600" /> Google Authenticator
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tăng cường bảo mật bằng mã số OTP 6 chữ số thay đổi mỗi 30 giây trên ứng dụng điện thoại.
                        </p>
                      </div>
                    </div>

                    {profile?.twoFactorEnabled ? (
                      <button
                        onClick={() => setShowDisable2FAConfirm(true)}
                        disabled={saving}
                        className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition"
                      >
                        Tắt 2FA
                      </button>
                    ) : (
                      !twoFactorSetup && (
                        <button
                          onClick={handleStart2FA}
                          disabled={saving}
                          className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
                        >
                          <QrCode className="w-4 h-4" /> Bắt đầu cài đặt 2FA
                        </button>
                      )
                    )}
                  </div>

                  {/* Form xác nhận tắt 2FA chuyên nghiệp (thay thế window.prompt) */}
                  {showDisable2FAConfirm && profile?.twoFactorEnabled && (
                    <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 text-red-800 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        Xác nhận tắt bảo mật 2 lớp
                      </div>
                      <p className="text-[11px] text-red-700">
                        Vui lòng nhập mã OTP 6 số hiện tại từ ứng dụng Google Authenticator trên điện thoại để xác thực quyền tắt 2FA:
                      </p>
                      <form onSubmit={handleConfirmDisable2FA} className="flex items-center gap-3">
                        <input
                          type="text"
                          maxLength={6}
                          value={disableTotpCode}
                          onChange={(e) => setDisableTotpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ví dụ: 123456"
                          autoFocus
                          className="w-44 text-center font-mono text-sm font-bold tracking-widest px-3 py-2 rounded-xl border border-red-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                        <button
                          type="submit"
                          disabled={saving || disableTotpCode.length !== 6}
                          className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition"
                        >
                          Xác nhận tắt
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDisable2FAConfirm(false);
                            setDisableTotpCode('');
                          }}
                          className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                          Hủy
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Flow Setup 2FA: Quét mã QR */}
                  {twoFactorSetup && !profile?.twoFactorEnabled && (
                    <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-4 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        {twoFactorSetup.qrCodeDataUrl ? (
                          <div className="bg-white p-2 rounded-2xl border-2 border-teal-200 shadow-sm shrink-0">
                            <img
                              src={twoFactorSetup.qrCodeDataUrl}
                              alt="Google Authenticator QR Code"
                              className="w-36 h-36 rounded-xl"
                            />
                            <p className="text-[10px] text-center text-slate-400 mt-1 font-semibold">
                              Quét bằng Google Auth
                            </p>
                          </div>
                        ) : (
                          <div className="w-36 h-36 bg-white rounded-2xl border flex items-center justify-center shrink-0">
                            <QrCode className="w-12 h-12 text-slate-300" />
                          </div>
                        )}

                        <div className="flex-1 space-y-2.5">
                          <h5 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                            <Smartphone className="w-4 h-4 text-teal-600" />
                            Bước 1: Mở ứng dụng Google Authenticator
                          </h5>
                          <p className="text-[11px] text-teal-800 leading-relaxed">
                            Mở ứng dụng <strong>Google Authenticator</strong> (hoặc Authy) trên điện thoại của bạn, 
                            nhấn dấu <strong className="text-teal-900">(+)</strong> và chọn <strong>Quét mã QR</strong>.
                          </p>

                          <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-teal-200">
                            <span className="font-semibold text-teal-900 block mb-1">
                              Không quét được mã? Nhập khóa thủ công:
                            </span>
                            <div className="flex items-center gap-2">
                              <code className="bg-slate-100 px-2 py-1 rounded text-[11px] font-mono font-bold text-teal-900 tracking-wider">
                                {twoFactorSetup.secret}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(twoFactorSetup.secret);
                                  setCopiedSecret(true);
                                  setTimeout(() => setCopiedSecret(false), 2000);
                                }}
                                className="text-teal-700 hover:text-teal-900 p-1 text-xs flex items-center gap-1"
                              >
                                {copiedSecret ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Đã chép
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Copy className="w-3.5 h-3.5" /> Sao chép
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bước 2: Nhập OTP kích hoạt */}
                      <form onSubmit={handleEnable2FA} className="border-t border-teal-200 pt-4 flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex-1 w-full">
                          <label className="block text-[11px] font-bold text-teal-950 mb-1">
                            Bước 2: Nhập mã số 6 chữ số từ app Google Authenticator:
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="ví dụ: 549321"
                            className="w-full text-center tracking-widest font-mono text-lg font-black py-2 rounded-xl border-2 border-teal-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div className="sm:self-end w-full sm:w-auto">
                          <button
                            type="submit"
                            disabled={saving || totpCode.length !== 6}
                            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1.5"
                          >
                            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                            Xác nhận & Kích hoạt 2FA 🚀
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Hiển thị 8 Recovery Codes sau khi kích hoạt thành công */}
                  {recoveryCodes.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Lưu trữ 8 mã khôi phục dự phòng (Recovery Codes)
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(recoveryCodes.join('\n'));
                              setCopiedAllCodes(true);
                              setTimeout(() => setCopiedAllCodes(false), 2000);
                            }}
                            className="text-[11px] font-bold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-300 hover:bg-amber-100 transition flex items-center gap-1"
                          >
                            {copiedAllCodes ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            {copiedAllCodes ? 'Đã sao chép!' : 'Chép tất cả'}
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadRecoveryCodes}
                            className="text-[11px] font-bold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-300 hover:bg-amber-100 transition flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Tải về (.txt)
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Hãy lưu trữ các mã này ở nơi an toàn. Mỗi mã chỉ dùng được 01 lần duy nhất để đăng nhập trong trường hợp bạn không mở được ứng dụng Google Authenticator.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                        {recoveryCodes.map((code, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-amber-300 py-1.5 text-center rounded-xl font-bold text-slate-800 shadow-2xs"
                          >
                            {code}
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
