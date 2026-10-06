import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Edit3,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  GraduationCap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
} from 'lucide-react';
import {
  parentsApi,
  ParentUser,
  ParentStats,
  CreateParentPayload,
  UpdateParentPayload,
} from '../api/parents.api';
import { apiClient } from '../../../core/api/axios';

export const ParentManagementPage: React.FC = () => {
  const [parents, setParents] = useState<ParentUser[]>([]);
  const [stats, setStats] = useState<ParentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Children list for linking
  const [availableChildren, setAvailableChildren] = useState<
    Array<{ id: string; fullName: string; studentCode: string; className?: string }>
  >([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<ParentUser | null>(null);
  const [deletingParent, setDeletingParent] = useState<ParentUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formSelectedChildIds, setFormSelectedChildIds] = useState<string[]>([]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchParents = async () => {
    setLoading(true);
    try {
      const [parentData, statData] = await Promise.all([
        parentsApi.getParents({
          search: search.trim() || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          includeDeleted,
          page: currentPage,
          limit: pageSize,
        }),
        parentsApi.getStats(),
      ]);

      setParents(parentData.data || []);
      setTotalCount(parentData.meta.total || 0);
      setTotalPages(parentData.meta.totalPages || 1);
      setStats(statData);
    } catch (err) {
      console.error('Lỗi khi tải danh sách phụ huynh:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const res = await apiClient.get('/children?limit=200');
      const items = res.data?.items || [];
      setAvailableChildren(
        items.map((c: any) => ({
          id: c.id,
          fullName: c.fullName,
          studentCode: c.studentCode,
          className: c.class?.name || 'Chưa xếp lớp',
        }))
      );
    } catch (err) {
      console.error('Lỗi khi tải danh sách học sinh:', err);
    }
  };

  useEffect(() => {
    fetchParents();
  }, [currentPage, selectedStatus, includeDeleted]);

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchParents();
  };

  const openCreateModal = () => {
    setFormEmail('');
    setFormFullName('');
    setFormPhone('');
    setFormPassword('');
    setFormStatus('ACTIVE');
    setFormSelectedChildIds([]);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (parent: ParentUser) => {
    setEditingParent(parent);
    setFormEmail(parent.email);
    setFormFullName(parent.fullName);
    setFormPhone(parent.phone || '');
    setFormPassword('');
    setFormStatus(parent.status);
    setFormSelectedChildIds(parent.children.map((c) => c.id));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim() || !formFullName.trim()) {
      showToast('error', 'Vui lòng nhập đầy đủ email và họ tên phụ huynh.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateParentPayload = {
        email: formEmail.trim(),
        fullName: formFullName.trim(),
        phone: formPhone.trim() || undefined,
        password: formPassword.trim() || undefined,
        status: formStatus,
        childIds: formSelectedChildIds,
      };
      await parentsApi.createParent(payload);
      showToast('success', 'Tạo tài khoản phụ huynh thành công!');
      setIsCreateModalOpen(false);
      fetchParents();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;

    setSubmitting(true);
    try {
      const payload: UpdateParentPayload = {
        fullName: formFullName.trim(),
        phone: formPhone.trim() || undefined,
        status: formStatus,
        newPassword: formPassword.trim() || undefined,
        childIds: formSelectedChildIds,
      };
      await parentsApi.updateParent(editingParent.id, payload);
      showToast('success', 'Cập nhật tài khoản phụ huynh thành công!');
      setEditingParent(null);
      fetchParents();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingParent) return;
    setSubmitting(true);
    try {
      await parentsApi.deleteParent(deletingParent.id);
      showToast('success', 'Đã xóa tài khoản phụ huynh và hủy liên kết.');
      setDeletingParent(null);
      fetchParents();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Có lỗi xảy ra khi xóa.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await parentsApi.restoreParent(id);
      showToast('success', 'Khôi phục tài khoản phụ huynh thành công!');
      fetchParents();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Không thể khôi phục tài khoản.');
    }
  };

  const toggleChildSelection = (childId: string) => {
    setFormSelectedChildIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span className="text-teal-600 font-semibold">Quản trị người dùng</span>
            <span>›</span>
            <span className="text-slate-700 font-bold">Tài khoản Phụ huynh</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Tài Khoản Phụ Huynh
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý danh sách, cấp tài khoản, thiết lập trạng thái và liên kết phụ huynh với hồ sơ học sinh mầm non.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchParents}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            Làm mới
          </button>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            Tạo tài khoản phụ huynh
          </button>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng phụ huynh</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats?.totalParents || totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang hoạt động</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{stats?.activeParents || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã liên kết học sinh</p>
            <p className="text-2xl font-black text-blue-700 mt-0.5">{stats?.parentsWithChildren || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tạm dừng / Đã xóa</p>
            <p className="text-2xl font-black text-slate-700 mt-0.5">{stats?.inactiveOrDeleted || 0}</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên phụ huynh, email, số điện thoại hoặc tên học sinh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2.5 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm dừng</option>
              <option value="BLOCKED">Bị khóa</option>
              <option value="DELETED">Đã xóa mềm</option>
            </select>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => {
                  setIncludeDeleted(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              Bao gồm đã xóa
            </label>

            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Tìm kiếm
            </button>
          </div>
        </form>
      </div>

      {/* 4. Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="px-4 py-3.5">Phụ huynh</th>
                <th className="px-4 py-3.5">Email & Điện thoại</th>
                <th className="px-4 py-3.5">Học sinh liên kết</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Ngày đăng ký</th>
                <th className="px-4 py-3.5 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Đang tải danh sách phụ huynh...</p>
                  </td>
                </tr>
              ) : parents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Không tìm thấy tài khoản phụ huynh nào</p>
                    <p className="text-[11px] mt-0.5">Nhấn "Tạo tài khoản phụ huynh" để bắt đầu thiết lập.</p>
                  </td>
                </tr>
              ) : (
                parents.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-black flex items-center justify-center text-sm shadow-inner shrink-0">
                          {p.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{p.fullName}</div>
                          {p.twoFactorEnabled && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                              <ShieldCheck className="w-3 h-3" /> Đã bật 2FA
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {p.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {p.phone || 'Chưa cập nhật'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.children && p.children.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {p.children.map((c) => (
                            <span
                              key={c.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold"
                            >
                              <GraduationCap className="w-3 h-3 text-teal-600" />
                              {c.fullName} ({c.className})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa liên kết học sinh</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {p.isDeleted ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          ĐÃ XÓA
                        </span>
                      ) : p.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          HOẠT ĐỘNG
                        </span>
                      ) : p.status === 'INACTIVE' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          TẠM DỪNG
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          {p.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {p.isDeleted ? (
                          <button
                            onClick={() => handleRestore(p.id)}
                            title="Khôi phục tài khoản"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditModal(p)}
                              title="Chỉnh sửa tài khoản"
                              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingParent(p)}
                              title="Xóa tài khoản"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Hiển thị <span className="font-bold">{parents.length}</span> / {totalCount} phụ huynh (Trang {currentPage}/{totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold px-2">{currentPage}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Create / Edit Modal */}
      {(isCreateModalOpen || editingParent) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  {editingParent ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingParent ? 'Cập nhật tài khoản Phụ huynh' : 'Tạo mới tài khoản Phụ huynh'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingParent(null);
                }}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={editingParent ? handleEditSubmit : handleCreateSubmit}
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Họ và tên phụ huynh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Email đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingParent}
                    placeholder="phuhuynh@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {editingParent ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu (mặc định: Parent@123)'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingParent ? '••••••••' : 'Nhập mật khẩu hoặc để trống'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Trạng thái tài khoản</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
                    <option value="BLOCKED">Khóa (BLOCKED)</option>
                  </select>
                </div>
              </div>

              {/* Children Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Liên kết học sinh (Con em)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Chọn các bé thuộc quyền giám hộ của phụ huynh này để đồng bộ thực đơn và thông báo:
                </p>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-2.5 bg-slate-50 space-y-1.5">
                  {availableChildren.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Chưa có danh sách học sinh</p>
                  ) : (
                    availableChildren.map((c) => {
                      const isSelected = formSelectedChildIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleChildSelection(c.id)}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition select-none ${
                            isSelected
                              ? 'bg-teal-100/70 border border-teal-300 font-bold text-teal-900'
                              : 'bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-teal-600 pointer-events-none"
                            />
                            <span>
                              {c.fullName} ({c.studentCode})
                            </span>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-600 font-normal">
                            {c.className}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
                {formSelectedChildIds.length > 0 && (
                  <p className="text-[11px] text-teal-700 font-semibold mt-1">
                    Đã chọn {formSelectedChildIds.length} học sinh liên kết.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingParent(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingParent ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Soft Delete Modal */}
      {deletingParent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Xác nhận xóa tài khoản phụ huynh</h3>
              <p className="text-slate-500 text-xs">
                Bạn có chắc chắn muốn xóa tài khoản của phụ huynh{' '}
                <span className="font-bold text-slate-900">{deletingParent.fullName}</span> ({deletingParent.email})?
              </p>
              <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-xl mt-2">
                Hành động này sẽ xóa mềm tài khoản và tự động hủy liên kết các học sinh đang gắn với phụ huynh này.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingParent(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/20 transition disabled:opacity-50"
              >
                {submitting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
