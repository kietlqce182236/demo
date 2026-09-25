import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Phone,
} from 'lucide-react';
import {
  forgotPasswordApi,
  verifyResetOtpApi,
  resetPasswordApi,
} from '../../../core/api/auth.api';

type Step = 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation & step
  const [step, setStep] = useState<Step>('EMAIL');

  // Form states
  const [email, setEmail] = useState('');
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
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Handle countdown interval
  React.useEffect(() => {
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
    return score;
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50/40 via-white to-amber-50/30">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Link to="/login" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md">
              <span className="text-white font-black text-sm leading-none">Kid<br />Meal</span>
            </div>
            <span className="text-sm font-semibold text-slate-600">Bán trú yêu thương</span>
          </Link>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Máy chủ vận hành ổn định</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-700">Hotline: 1900 6826</span>
          </div>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 relative overflow-hidden">
        {/* Floating emoji decorations */}
        <div className="login-emoji login-emoji-1">🔑</div>
        <div className="login-emoji login-emoji-2">🟡</div>
        <div className="login-emoji login-emoji-3">❤️</div>
        <div className="login-emoji login-emoji-4">🛡️</div>

        <div className="w-full max-w-lg relative z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/10 border border-white/80 p-8 sm:p-10">
            {/* Header Badge */}
            <div className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                <KeyRound className="w-3.5 h-3.5" /> Khôi phục mật khẩu tài khoản
              </span>
            </div>

            <h1 className="text-center text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              Quên mật khẩu? 🔐
            </h1>
            <p className="text-center text-xs sm:text-sm text-slate-500 mb-6">
              Xác thực qua mã OTP Email để đặt lại mật khẩu mới cho tài khoản KidMeal của bạn.
            </p>

            {/* Stepper Dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span
                className={`h-1.5 rounded-full transition-all ${
                  step === 'EMAIL' ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200'
                }`}
              />
              <span
                className={`h-1.5 rounded-full transition-all ${
                  step === 'OTP' ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200'
                }`}
              />
              <span
                className={`h-1.5 rounded-full transition-all ${
                  step === 'NEW_PASSWORD' ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200'
                }`}
              />
              <span
                className={`h-1.5 rounded-full transition-all ${
                  step === 'SUCCESS' ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200'
                }`}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 font-medium flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Info message */}
            {infoMessage && !error && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 font-medium flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* ─── STEP 1: NHẬP EMAIL ──────────────────────────────────────── */}
            {step === 'EMAIL' && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Địa chỉ Email đăng ký của bạn
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hieutruong@saomai.edu.vn"
                      required
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Đang gửi mã OTP...</span>
                    </>
                  ) : (
                    'Gửi mã xác thực OTP 🚀'
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-xs text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Quay lại màn hình đăng nhập
                  </Link>
                </div>
              </form>
            )}

            {/* ─── STEP 2: NHẬP OTP ────────────────────────────────────────── */}
            {step === 'OTP' && (
              <div className="space-y-6">
                <div className="text-center">
                  <span className="inline-block p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-2">
                    <Shield className="w-7 h-7" />
                  </span>
                  <h4 className="text-sm font-bold text-slate-800">Nhập mã xác thực OTP</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Mã OTP 6 chữ số đã được gửi đến: <br />
                    <strong className="text-slate-800 font-semibold">{email}</strong>
                  </p>
                </div>

                {/* 6 OTP Boxes */}
                <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
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
                      className="w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none transition"
                    />
                  ))}
                </div>

                {/* Resend & Change email */}
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
                      <RefreshCw className="w-3.5 h-3.5" />
                      Gửi lại mã OTP
                    </button>
                  ) : (
                    <span className="text-slate-400">
                      Gửi lại mã sau <strong className="text-emerald-600 font-semibold">{countdown}s</strong>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otpValues.join('').length !== 6}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : (
                    'Xác nhận mã OTP'
                  )}
                </button>
              </div>
            )}

            {/* ─── STEP 3: MẬT KHẨU MỚI ────────────────────────────────────── */}
            {step === 'NEW_PASSWORD' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
                      required
                      minLength={8}
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength */}
                  {newPassword && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Độ mạnh mật khẩu:</span>
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
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
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Đang lưu mật khẩu...</span>
                      </>
                    ) : (
                      'Cập nhật mật khẩu mới ✨'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ─── STEP 4: HOÀN TẤT THÀNH CÔNG ─────────────────────────────── */}
            {step === 'SUCCESS' && (
              <div className="text-center py-6 space-y-5">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Đặt lại mật khẩu thành công! 🎉
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                    Mật khẩu tài khoản <strong className="text-slate-800">{email}</strong> đã được cập nhật an toàn.
                    Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-500/25 transition active:scale-[0.98]"
                >
                  Đăng nhập ngay bây giờ
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 bg-white/80 backdrop-blur-sm border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <p>© 2024 KidMeal - Hệ sinh thái Bán trú Dinh dưỡng Học đường Mầm non. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-600 transition-colors">Hướng dẫn bảo mật</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Điều khoản sử dụng</a>
        </div>
      </footer>
    </div>
  );
};
