import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  Mail,
  Phone,
  Lock,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ChefHat,
  GraduationCap,
  HeartPulse,
  Apple,
  AlertCircle,
} from 'lucide-react';
import { StaffUser, StaffRole, CreateStaffPayload, UpdateStaffPayload } from '../api/staff.api';

interface StaffDrawerProps {
  isOpen: boolean;
  staff: StaffUser | null; // null = CREATE mode, not null = EDIT mode
  availableRoles: StaffRole[];
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateStaffPayload | UpdateStaffPayload, staffId?: string) => Promise<void>;
}

export const StaffDrawer: React.FC<StaffDrawerProps> = ({
  isOpen,
  staff,
  availableRoles,
  isLoading,
  onClose,
  onSubmit,
}) => {
  const isEditMode = Boolean(staff);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('TEACHER');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [password, setPassword] = useState('Password123@');
  const [copiedPass, setCopiedPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset / Populate form khi drawer mở hoặc thay đổi staff
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (staff) {
        // Edit mode
        setFullName(staff.fullName || '');
        setEmail(staff.email || '');
        setPhone(staff.phone || '');
        const role = staff.roles?.[0]?.code || 'TEACHER';
        setSelectedRoleCode(role);
        setStatus(staff.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');
        setPassword(''); // Trong edit mode, để trống nếu không đổi
      } else {
        // Create mode
        setFullName('');
        setEmail('');
        setPhone('');
        setSelectedRoleCode('TEACHER');
        setStatus('ACTIVE');
        setPassword(generateSecurePassword());
      }
    }
  }, [isOpen, staff]);

  // Sinh mật khẩu ngẫu nhiên an toàn
  function generateSecurePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '@2026';
  }

  const handleGenerateNewPassword = () => {
    const newPass = generateSecurePassword();
    setPassword(newPass);
    setCopiedPass(false);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  // Chọn 1 vai trò chuyên môn (Single Selection)
  const handleSelectRole = (code: string) => {
    setSelectedRoleCode(code);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên nhân sự.');
      return;
    }

    if (!isEditMode && !email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email công việc.');
      return;
    }

    if (!selectedRoleCode) {
      setErrorMessage('Vui lòng chọn vai trò chuyên môn.');
      return;
    }

    const derivedStaffType = (() => {
      switch (selectedRoleCode) {
        case 'TEACHER':
          return 'TEACHER';
        case 'KITCHEN_STAFF':
        case 'KITCHEN_MANAGER':
          return 'KITCHEN';
        case 'NUTRITIONIST':
        case 'MEDICAL_STAFF':
          return 'SPECIALIST';
        case 'SCHOOL_MANAGER':
        case 'PRINCIPAL':
        default:
          return 'MANAGEMENT';
      }
    })();

    try {
      if (isEditMode && staff) {
        const updatePayload: UpdateStaffPayload = {
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          roleCode: selectedRoleCode,
          roleCodes: [selectedRoleCode],
          staffType: derivedStaffType,
          status,
          newPassword: password.trim() ? password.trim() : undefined,
        };
        await onSubmit(updatePayload, staff.id);
      } else {
        const createPayload: CreateStaffPayload = {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          roleCode: selectedRoleCode,
          roleCodes: [selectedRoleCode],
          staffType: derivedStaffType,
          status,
          password: password.trim() || 'Password123@',
        };
        await onSubmit(createPayload);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu thông tin nhân sự.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  // Mapping biểu tượng và màu sắc vai trò
  const getRoleBadgeConfig = (code: string) => {
    switch (code) {
      case 'PRINCIPAL':
        return {
          icon: ShieldCheck,
          label: 'Ban Giám Hiệu',
          color: 'border-amber-500 bg-amber-50 text-amber-800',
          desc: 'Quản trị toàn trường, phê duyệt thực đơn & tài chính',
        };
      case 'NUTRITIONIST':
        return {
          icon: Apple,
          label: 'Chuyên Viên Dinh Dưỡng',
          color: 'border-teal-500 bg-teal-50 text-teal-800',
          desc: 'Xây dựng thực đơn, cân đối P:L:G theo chuẩn Bộ GD&ĐT',
        };
      case 'KITCHEN_MANAGER':
        return {
          icon: ChefHat,
          label: 'Bếp Trưởng / Quản Lý Bếp',
          color: 'border-orange-500 bg-orange-50 text-orange-800',
          desc: 'Tiếp nhận nguyên liệu, kiểm thực 3 bước, lưu mẫu 24h',
        };
      case 'TEACHER':
        return {
          icon: GraduationCap,
          label: 'Giáo Viên Chủ Nhiệm',
          color: 'border-blue-500 bg-blue-50 text-blue-800',
          desc: 'Điểm danh suất ăn, báo cáo mức độ ăn của trẻ trên tablet',
        };
      case 'MEDICAL_STAFF':
        return {
          icon: HeartPulse,
          label: 'Cán Bộ Y Tế Học Đường',
          color: 'border-rose-500 bg-rose-50 text-rose-800',
          desc: 'Theo dõi dị ứng khẩn cấp, biểu đồ WHO và vệ sinh',
        };
      default:
        return {
          icon: UserCheck,
          label: code,
          color: 'border-slate-300 bg-slate-50 text-slate-700',
          desc: 'Nhân sự hỗ trợ trường học',
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 1. NỀN MỜ PHÍA SAU (Backdrop Blur) */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* 2. POPUP BÊN PHẢI (Right Slide-Over Drawer) */}
      <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 flex items-center justify-center shadow-inner">
              {isEditMode ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {isEditMode ? 'Chỉnh Sửa Thông Tin Nhân Sự' : 'Thêm Nhân Sự Mới'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {isEditMode
                  ? 'Cập nhật vai trò chuyên môn và quyền hạn nhân viên'
                  : 'Tạo tài khoản và phân quyền chức năng trong cơ sở mầm non'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body (Scrollable Form) */}
        <form id="staff-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Phần 1: Thông tin cơ bản */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thông Tin Định Danh
            </h3>

            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ và tên nhân sự <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Cô Nguyễn Thị Hoa / Bếp Trưởng Trần Văn Nam"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>

            {/* Email công việc */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email công việc <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  disabled={isEditMode}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="giaovien@saomai.edu.vn"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition ${
                    isEditMode
                      ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                  }`}
                />
              </div>
              {isEditMode && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Email là mã định danh đăng nhập không thể thay đổi.
                </p>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Số điện thoại liên lạc
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0903111222"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Phần 2: Vai trò chuyên môn */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Vai Trò Chuyên Môn <span className="text-red-500">*</span>
              </h3>
              <span className="text-[11px] text-teal-600 font-semibold">
                Chọn 1 chức danh chính
              </span>
            </div>

            <div className="space-y-2">
              {availableRoles
                .filter((role) => role.code !== 'PARENT' && role.code !== 'SUPER_ADMIN')
                .map((role) => {
                  const config = getRoleBadgeConfig(role.code);
                  const Icon = config.icon;
                  const isSelected = selectedRoleCode === role.code;

                  return (
                    <div
                      key={role.code}
                      onClick={() => handleSelectRole(role.code)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? `${config.color} shadow-xs font-semibold ring-2 ring-teal-500/20`
                          : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white shadow-xs' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{role.name}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {config.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Phần 3: Trạng thái & Mật khẩu */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Trạng Thái & Thiết Lập Mật Khẩu
            </h3>

            {/* Trạng thái hoạt động */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Trạng thái tài khoản
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('ACTIVE')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    status === 'ACTIVE'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Đang hoạt động
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('INACTIVE')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    status === 'INACTIVE'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Tạm khóa tài khoản
                </button>
              </div>
            </div>

            {/* Mật khẩu khởi tạo / Đặt lại mật khẩu */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isEditMode ? 'Đặt lại mật khẩu mới (Tùy chọn)' : 'Mật khẩu khởi tạo'}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateNewPassword}
                  className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" /> Sinh ngẫu nhiên
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditMode ? 'Để trống nếu không muốn đổi mật khẩu' : 'Nhập mật khẩu...'}
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
                {password && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition"
                  >
                    {copiedPass ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isEditMode
                  ? 'Nếu không cần thay đổi mật khẩu của nhân viên, hãy để trống trường này.'
                  : 'Bạn có thể sao chép mật khẩu này gửi cho giáo viên/nhân viên đăng nhập lần đầu.'}
              </p>
            </div>
          </div>
        </form>

        {/* Drawer Footer (Sticky Bottom) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="staff-drawer-form"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/25 transition flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditMode ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
