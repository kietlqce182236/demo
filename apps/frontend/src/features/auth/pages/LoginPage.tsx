import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronDown, Building2, Mail, Lock, Shield, Phone } from 'lucide-react';
import { useAuthStore, TenantInfo } from '../../../core/stores/auth.store';
import {
  fetchTenants,
  loginApi,
  quickLoginApi,
  LoginResponse,
  TwoFaRequiredResponse,
} from '../../../core/api/auth.api';

// ─── Sub-Components ────────────────────────────────────────────────────────────

/** Dropdown chọn cơ sở trường mầm non */
const TenantSelector: React.FC<{
  tenants: TenantInfo[];
  selectedId: string | null;
  onSelect: (tenant: TenantInfo) => void;
}> = ({ tenants, selectedId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const selected = tenants.find((t) => t.id === selectedId);

  return (
    <div className="relative">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        Cơ sở Trường Mầm non
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200"
      >
        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">
            {selected?.name || 'Chọn trường mầm non...'}
          </p>
          {selected && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Mã trường: {selected.code}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-48 overflow-auto">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              onClick={() => { onSelect(tenant); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-emerald-50 transition-colors ${
                tenant.id === selectedId ? 'bg-emerald-50' : ''
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{tenant.name}</p>
                <p className="text-[10px] text-slate-400">{tenant.code}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Login Page ───────────────────────────────────────────────────────────

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, setTenantId, isAuthenticated, selectedTenantId } = useAuthStore();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2Fa, setShow2Fa] = useState(false);

  // Tenants
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect nếu đã login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Load tenants 1 lần khi mount
  useEffect(() => {
    let cancelled = false;
    fetchTenants()
      .then((data) => {
        if (!cancelled) {
          setTenants(data);
          // Auto-select tenant đầu tiên nếu chưa chọn
          if (!selectedTenantId && data.length > 0) {
            setTenantId(data[0].id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Không thể tải danh sách trường. Vui lòng thử lại.');
        }
      })
      .finally(() => {
        if (!cancelled) setTenantsLoading(false);
      });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Xử lý đăng nhập
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginApi({
        email,
        password,
        ...(show2Fa && twoFactorCode ? { twoFactorCode } : {}),
      });

      // Check if 2FA is required
      if ('require2Fa' in result) {
        setShow2Fa(true);
        setLoading(false);
        return;
      }

      const loginResult = result as LoginResponse;
      setAuth(loginResult.user, loginResult.accessToken, loginResult.refreshToken);
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(typeof message === 'string' ? message : message[0]);
    } finally {
      setLoading(false);
    }
  }, [email, password, twoFactorCode, show2Fa, setAuth, navigate]);

  // Quick login (dev-only)
  const handleQuickLogin = useCallback(async (roleCode: string) => {
    if (!selectedTenantId) {
      setError('Vui lòng chọn trường trước');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await quickLoginApi({ roleCode, tenantId: selectedTenantId });
      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Quick login thất bại');
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId, setAuth, navigate]);

  // ─── Render ────────────────────────────────────────────────────────────────────

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
            <span className="font-semibold text-slate-700">Hotline: 1900 6886</span>
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
            {/* Badge Multi-Tenant */}
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                🏫 Hệ thống Bán trú Mầm non Multi-Tenant
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
              {/* Tenant Selector */}
              {!tenantsLoading && (
                <TenantSelector
                  tenants={tenants}
                  selectedId={selectedTenantId}
                  onSelect={(t) => setTenantId(t.id)}
                />
              )}
              {tenantsLoading && (
                <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
              )}

              {/* Email Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tên đăng nhập hoặc Email / SDT
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="covananh@kidmeal.edu.vn"
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
                <button type="button" className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading || !selectedTenantId}
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

            {/* ─── Quick Login ────────────────────────────────────────── */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Đăng nhập nhanh theo vai trò:
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { role: 'NUTRITIONIST', label: '👩‍🍳HP Nuôi dưỡng', color: 'emerald' },
                  { role: 'KITCHEN_MANAGER', label: '🍳Bếp trưởng', color: 'amber' },
                  { role: 'TEACHER', label: '👩‍🏫Giáo viên CN', color: 'sky' },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(item.role)}
                    className="flex-1 min-w-[120px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Security badge */}
            <div className="mt-6 text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                Bảo mật mã hóa SSL 256-bit • Dành riêng cho cán bộ & GV mầm non
              </p>
            </div>
          </div>
        </div>
      </main>

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
