import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Shield, Phone } from 'lucide-react';
import { useAuthStore } from '../../../core/stores/auth.store';
import {
  fetchTenants,
  loginApi,
  LoginResponse,
} from '../../../core/api/auth.api';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, setTenantId, isAuthenticated, selectedTenantId, user } = useAuthStore();

  const getPortalPath = (roles?: any[]): string => {
    if (!roles || roles.length === 0) return '/dashboard';
    const roleStrings = roles.map((r: any) =>
      typeof r === 'string' ? r.toUpperCase() : (r?.code || r?.name || '').toUpperCase()
    );
    if (roleStrings.includes('KITCHEN_STAFF') || roleStrings.includes('KITCHEN_MANAGER')) return '/kitchen';
    if (roleStrings.includes('NUTRITIONIST')) return '/nutritionist/menus';
    if (roleStrings.includes('TEACHER')) return '/tablet';
    if (
      roleStrings.includes('SCHOOL_MANAGEMENT') ||
      roleStrings.includes('SCHOOL_MANAGER') ||
      roleStrings.includes('PRINCIPAL') ||
      roleStrings.includes('SUPER_ADMIN')
    ) {
      return '/dashboard';
    }
    if (roleStrings.includes('PARENT')) return '/child-menu-consumption';
    return '/dashboard';
  };

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2Fa, setShow2Fa] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect nếu đã login
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getPortalPath(user?.roles), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Tự động gán tenant ngầm khi mount (Mặc định: Trường MN Hướng Dương)
  useEffect(() => {
    if (isAuthenticated) return;
    let cancelled = false;
    fetchTenants()
      .then((data) => {
        if (!cancelled && data.length > 0) {
          const defaultTenant = data[0];
          setTenantId(String(defaultTenant.id));
        }
      })
      .catch(() => {
        setTenantId('1');
      });
    return () => { cancelled = true; };
  }, [setTenantId, isAuthenticated]);

  // Xử lý đăng nhập
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const rawResult = await loginApi({
        email,
        password,
        ...(show2Fa && twoFactorCode ? { twoFactorCode } : {}),
      });

      const payload: any = (rawResult as any)?.data || rawResult;

      // Check if 2FA is required
      if (payload && 'require2Fa' in payload && payload.require2Fa) {
        setShow2Fa(true);
        setLoading(false);
        return;
      }

      const loginResult = payload as LoginResponse;
      if (!loginResult || !loginResult.user || !loginResult.accessToken) {
        throw new Error('Dữ liệu người dùng phản hồi không hợp lệ.');
      }

      const rawRoles = loginResult.user.roles || [];
      const normalizedRoles = Array.isArray(rawRoles)
        ? rawRoles.map((r: any) => (typeof r === 'string' ? r : r?.code || r?.name))
        : [];

      const sanitizedUser = {
        ...loginResult.user,
        roles: normalizedRoles,
        tenantId: String(loginResult.user.tenantId || '1'),
      };

      setAuth(sanitizedUser, loginResult.accessToken, loginResult.refreshToken || loginResult.accessToken);
      // Điều hướng chuyên biệt theo Role
      navigate(getPortalPath(normalizedRoles), { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.';
      setError(typeof message === 'string' ? message : message[0]);
    } finally {
      setLoading(false);
    }
  }, [email, password, twoFactorCode, show2Fa, setAuth, navigate]);

  return (
    <div className="login-page min-h-screen flex flex-col">
      {/* ─── Header Bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-slate-100 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-sm leading-none">Kid<br/>Meal</span>
          </div>
          <span className="text-sm font-semibold text-slate-600">Bán trú yêu thương</span>
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

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 login-bg relative overflow-hidden">
        {/* Floating emoji decorations */}
        <div className="login-emoji login-emoji-1">❗</div>
        <div className="login-emoji login-emoji-2">🟡</div>
        <div className="login-emoji login-emoji-3">❤️</div>
        <div className="login-emoji login-emoji-4">✏️</div>

        {/* Login Card */}
        <div className="w-full max-w-lg relative z-10">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/5 border border-white/60 px-8 py-10 sm:px-10">
            {/* Badge Bán trú */}
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                🏫 Hệ thống Quản trị Bán trú Mầm non KidMeal
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-center text-3xl font-black text-slate-900 mb-2">
              Chào mừng trở lại! 👋
            </h1>
            <p className="text-center text-sm text-slate-500 mb-8">
              Đăng nhập để quản lý thực đơn, dinh dưỡng và sĩ số học sinh.
            </p>

            {/* Error Alert */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tên đăng nhập hoặc Email / SĐT
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hieutruong@saomai.edu.vn"
                    autoComplete="email"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    minLength={6}
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* 2FA Code (conditional) */}
              {show2Fa && (
                <div className="animate-fadeIn">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mã xác thực 2FA
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      id="login-2fa"
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Nhập 6 chữ số từ app Authenticator"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={6}
                      className="w-full pl-11 pr-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all duration-200 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  'Đăng nhập vào KidMeal 🎉'
                )}
              </button>
            </form>

            {/* Quick Demo Role Logins */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 mb-2.5 text-center flex items-center justify-center gap-1.5">
                <span>⚡</span> Đăng nhập nhanh kiểm tra phân quyền (Demo):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setEmail('bep@huongduong.edu.vn'); setPassword('123456'); }}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100/80 text-amber-900 font-semibold text-left transition flex flex-col gap-0.5 group"
                >
                  <span className="font-bold flex items-center gap-1 text-amber-800 group-hover:text-amber-900">
                    👨‍🍳 Cán bộ Bếp
                  </span>
                  <span className="text-[10px] text-amber-600 font-mono truncate">bep@huongduong.edu.vn</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('giaovien.mam1@huongduong.edu.vn'); setPassword('123456'); }}
                  className="p-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100/80 text-teal-900 font-semibold text-left transition flex flex-col gap-0.5 group"
                >
                  <span className="font-bold flex items-center gap-1 text-teal-800 group-hover:text-teal-900">
                    👩‍🏫 Giáo viên
                  </span>
                  <span className="text-[10px] text-teal-600 font-mono truncate">giaovien.mam1@huong...</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('dinhduong@huongduong.edu.vn'); setPassword('123456'); }}
                  className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 font-semibold text-left transition flex flex-col gap-0.5 group"
                >
                  <span className="font-bold flex items-center gap-1 text-emerald-800 group-hover:text-emerald-900">
                    🥗 Dinh dưỡng
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono truncate">dinhduong@huong...</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('hieutruong@huongduong.edu.vn'); setPassword('123456'); }}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100/80 text-blue-900 font-semibold text-left transition flex flex-col gap-0.5 group"
                >
                  <span className="font-bold flex items-center gap-1 text-blue-800 group-hover:text-blue-900">
                    🏫 Ban Giám Hiệu
                  </span>
                  <span className="text-[10px] text-blue-600 font-mono truncate">hieutruong@huong...</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('phuhuynh.huy@gmail.com'); setPassword('123456'); }}
                  className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100/80 text-purple-900 font-semibold text-left transition flex flex-col gap-0.5 group"
                >
                  <span className="font-bold flex items-center gap-1 text-purple-800 group-hover:text-purple-900">
                    👨‍👩‍👧 Phụ huynh
                  </span>
                  <span className="text-[10px] text-purple-600 font-mono truncate">phuhuynh.huy@gm...</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('hieupho@huongduong.edu.vn'); setPassword('123456'); }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-900 font-semibold text-left transition flex flex-col gap-0.5 group"
                >
                  <span className="font-bold flex items-center gap-1 text-slate-800 group-hover:text-slate-900">
                    👨‍💼 Hiệu Phó
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono truncate">hieupho@huong...</span>
                </button>
              </div>
            </div>

            {/* Security badge */}
            <div className="mt-8 text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                Bảo mật mã hóa SSL 256-bit • Dành riêng cho cán bộ, giáo viên & phụ huynh mầm non
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Quên & Đặt lại mật khẩu (OTP Email) */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        initialEmail={email}
        onSuccessLogin={(resetEmail) => {
          setEmail(resetEmail);
          setShowForgotPassword(false);
        }}
      />

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-6 py-4 bg-white/80 backdrop-blur-sm border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 relative z-10">
        <p>© 2024 KidMeal - Hệ sinh thái Bán trú Dinh dưỡng Học đường Mầm non. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-600 transition-colors">Hướng dẫn bảo mật</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Điều khoản sử dụng</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Trung tâm trợ giúp</a>
        </div>
      </footer>
    </div>
  );
};
