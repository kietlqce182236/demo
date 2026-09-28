import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Lock,
  Shield,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import {
  forgotPasswordApi,
  verifyResetOtpApi,
  resetPasswordApi,
} from '../../../core/api/auth.api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (email: string) => void;
  initialEmail?: string;
}

type Step = 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  initialEmail = '',
}) => {
  // Navigation & step
  const [step, setStep] = useState<Step>('EMAIL');

  // Form states
  const [email, setEmail] = useState(initialEmail);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Countdown timer for OTP resend (60 seconds)
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Refs for 6 OTP input boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setStep('EMAIL');
      setEmail(initialEmail || '');
      setOtpValues(['', '', '', '', '', '']);
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setInfoMessage('');
      setCountdown(60);
      setCanResend(false);
    }
  }, [isOpen, initialEmail]);

  // Handle countdown interval
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  // ─── Step 1: Request OTP via Email ──────────────────────────────────────────
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordApi({ email: cleanEmail });
      setInfoMessage(res.message || 'Mã xác thực OTP đã được gửi đến email của bạn.');
      setStep('OTP');
      setCountdown(60);
      setCanResend(false);
      // Focus first OTP box on next tick
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.';
      setError(typeof msg === 'string' ? msg : msg[0]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    // Auto move to next input if filled
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otpValues];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtpValues(newOtp);

    const nextIndex = Math.min(pasteData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số của mã xác thực OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetOtpApi({
        email: email.trim(),
        otp: fullOtp,
      });

      setResetToken(res.resetToken);
      setInfoMessage('Mã OTP xác thực chính xác. Hãy thiết lập mật khẩu mới.');
      setStep('NEW_PASSWORD');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
      setError(typeof msg === 'string' ? msg : msg[0]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Reset Password ─────────────────────────────────────────────────
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const strengthScore = getPasswordStrength(newPassword);

  const getStrengthLabel = (score: number) => {
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi({
        resetToken,
        newPassword,
        confirmPassword,
      });

      setStep('SUCCESS');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
      setError(typeof msg === 'string' ? msg : msg[0]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Top Header Background */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 pt-6 pb-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Khôi phục mật khẩu</h3>
              <p className="text-xs text-emerald-100">Hệ thống Quản trị Bán trú KidMeal</p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span
              className={`h-1.5 rounded-full transition-all ${
                step === 'EMAIL' ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all ${
                step === 'OTP' ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all ${
                step === 'NEW_PASSWORD' ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all ${
                step === 'SUCCESS' ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Message */}
          {infoMessage && !error && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* ─── STEP 1: NHẬP EMAIL ────────────────────────────────────────── */}
          {step === 'EMAIL' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="text-center sm:text-left mb-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nhập địa chỉ email tài khoản KidMeal của bạn. Chúng tôi sẽ gửi mã OTP gồm 6 chữ số để xác thực việc đổi mật khẩu.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Địa chỉ Email đăng ký
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ví dụ: hieutruong@saomai.edu.vn"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang gửi mã OTP...</span>
                    </>
                  ) : (
                    'Gửi mã xác thực OTP 🚀'
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại màn hình đăng nhập
                </button>
              </div>
            </form>
          )}

          {/* ─── STEP 2: NHẬP OTP 6 SỐ ────────────────────────────────────── */}
          {step === 'OTP' && (
            <div className="space-y-5">
              <div className="text-center">
                <span className="inline-block p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl mb-2">
                  <Shield className="w-6 h-6" />
                </span>
                <h4 className="text-sm font-bold text-slate-800">Nhập mã xác thực OTP</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Mã OTP 6 chữ số đã được gửi đến: <br />
                  <strong className="text-slate-700 font-semibold">{email}</strong>
                </p>
              </div>

              {/* 6 Digit OTP inputs */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                {otpValues.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none transition"
                  />
                ))}
              </div>

              {/* Resend OTP & Countdown */}
              <div className="flex items-center justify-between text-xs px-1">
                <button
                  type="button"
                  onClick={() => setStep('EMAIL')}
                  className="text-slate-500 hover:text-slate-700 transition"
                >
                  Đổi email khác
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    disabled={loading}
                    className="text-emerald-600 font-bold hover:underline transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Gửi lại mã OTP
                  </button>
                ) : (
                  <span className="text-slate-400">
                    Gửi lại mã sau <strong className="text-emerald-600 font-semibold">{countdown}s</strong>
                  </span>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otpValues.join('').length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : (
                    'Xác nhận mã OTP'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: MẬT KHẨU MỚI ──────────────────────────────────────── */}
          {step === 'NEW_PASSWORD' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center sm:text-left mb-1">
                <h4 className="text-sm font-bold text-slate-800">Thiết lập mật khẩu mới</h4>
                <p className="text-xs text-slate-500">
                  Mật khẩu cần đảm bảo độ bảo mật để bảo vệ thông tin học sinh và trường học.
                </p>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ít nhất 8 ký tự"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Độ mạnh:</span>
                      <span className={`font-bold ${getStrengthLabel(strengthScore).text}`}>
                        {getStrengthLabel(strengthScore).label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`rounded-full transition-all duration-300 ${
                            strengthScore >= level
                              ? getStrengthLabel(strengthScore).color
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1">Mật khẩu xác nhận chưa khớp</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang lưu mật khẩu mới...</span>
                    </>
                  ) : (
                    'Cập nhật mật khẩu mới ✨'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ─── STEP 4: HOÀN TẤT THÀNH CÔNG ─────────────────────────────────── */}
          {step === 'SUCCESS' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Đặt lại mật khẩu thành công! 🎉
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Mật khẩu tài khoản <strong className="text-slate-700">{email}</strong> đã được cập nhật thành công.
                  Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSuccessLogin) onSuccessLogin(email);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
                >
                  Đăng nhập ngay bây giờ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
