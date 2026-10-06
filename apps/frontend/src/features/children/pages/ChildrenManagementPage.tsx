import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  HeartPulse,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  UploadCloud,
  Download,
} from 'lucide-react';
import {
  childrenApi,
  ChildItem,
  ChildrenStats,
  AllergenCatalogItem,
  CreateChildDto,
  DeclareAllergyDto,
} from '../api/children.api';
import { apiClient } from '../../../core/api/axios';

export const ChildrenManagementPage: React.FC = () => {
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [stats, setStats] = useState<ChildrenStats | null>(null);
  const [catalogs, setCatalogs] = useState<AllergenCatalogItem[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [allergyFilter, setAllergyFilter] = useState('ALL');

  // Rescan state
  const [rescanning, setRescanning] = useState(false);
  const [rescanMessage, setRescanMessage] = useState<string | null>(null);

  // Modal Create Child
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [childForm, setChildForm] = useState<CreateChildDto>({
    studentCode: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '2021-05-15',
    gender: 'MALE',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: '',
  });

  // Modal Declare Allergy
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [targetChild, setTargetChild] = useState<ChildItem | null>(null);
  const [allergyForm, setAllergyForm] = useState<DeclareAllergyDto>({
    allergenId: '',
    customAllergenName: '',
    allergyType: 'ALLERGY',
    severity: 'MODERATE',
    symptoms: 'Nổi mề đay, mẩn ngứa',
    reactionTreatment: 'Báo y tế trường học, cho uống thuốc kháng histamine',
  });

  // Modal Import Student List
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);

  const sampleCsv = `Mã học sinh, Họ, Tên, Ngày sinh, Giới tính, Ghi chú y tế
HS-2026-0091, Nguyễn, Minh Khang, 2021-06-15, MALE, Tiền sử dị ứng tôm
HS-2026-0092, Trần, Bảo Anh, 2021-08-20, FEMALE,
HS-2026-0093, Lê, Tuấn Kiệt, 2022-03-10, MALE, Dị ứng sữa tươi`;

  const handleImportSubmit = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const lines = importText.trim().split('\n');
      const items = [];
      const startIdx =
        lines[0].toLowerCase().includes('mã') ||
        lines[0].toLowerCase().includes('student') ||
        lines[0].toLowerCase().includes('họ')
          ? 1
          : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map((s) => s.trim());
        if (parts.length >= 3) {
          items.push({
            studentCode: parts[0] || undefined,
            lastName: parts[1] || '',
            firstName: parts[2] || '',
            dateOfBirth: parts[3] || '2021-01-01',
            gender: (parts[4] || 'MALE').toUpperCase(),
            medicalNotes: parts[5] || undefined,
            classId: selectedClass !== 'ALL' ? selectedClass : undefined,
          });
        }
      }

      if (items.length === 0) {
        alert('Không tìm thấy dòng dữ liệu học sinh hợp lệ.');
        setImporting(false);
        return;
      }

      const res = await apiClient.post('/children/import', { items });
      setImportResult({ count: res.data.importedCount, errors: res.data.errors || [] });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi nhập dữ liệu.');
    } finally {
      setImporting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [childRes, statsRes, catRes, classRes] = await Promise.all([
        childrenApi.getChildren({ limit: 100 }),
        childrenApi.getStats(),
        childrenApi.getAllergenCatalogs(),
        apiClient.get('/classes').catch(() => ({ data: { items: [] } })),
      ]);

      setChildren(childRes.items || []);
      setStats(statsRes);
      setCatalogs(catRes || []);
      setClasses(classRes.data?.items || []);
    } catch (err) {
      console.error('Error fetching children data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRescan = async () => {
    setRescanning(true);
    setRescanMessage(null);
    try {
      const res = await childrenApi.rescanAllergies();
      setRescanMessage(res.message || 'Đã quét xong và đồng bộ cảnh báo tới Bếp.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi quét thực đơn.');
    } finally {
      setRescanning(false);
    }
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await childrenApi.createChild(childForm);
      setIsChildModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo hồ sơ học sinh.');
    }
  };

  const handleDeclareAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetChild) return;

    try {
      await childrenApi.declareAllergy(targetChild.id, allergyForm);
      setIsAllergyModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi khai báo dị ứng.');
    }
  };

  const filteredChildren = children.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.studentCode.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || c.class?.id === selectedClass;
    const matchesAllergy =
      allergyFilter === 'ALL' ||
      (allergyFilter === 'YES' && c.allergies && c.allergies.length > 0) ||
      (allergyFilter === 'NO' && (!c.allergies || c.allergies.length === 0));
    return matchesSearch && matchesClass && matchesAllergy;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ─── 1. TOP HEADER BANNER ─── */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Hồ Sơ Trẻ & Kiểm Soát Dị Ứng
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Quản Lý Học Sinh & Dị Nguyên Thực Phẩm
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Khai báo tiền sử dị ứng, phác đồ cấp cứu khẩn cấp và tự động kết nối Rule Engine quét chéo thành phần món ăn theo thời gian thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRescan}
              disabled={rescanning}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${rescanning ? 'animate-spin' : ''}`} />
              <span>{rescanning ? 'Đang quét...' : 'Quét Thực Đơn Dị Ứng'}</span>
            </button>
            <button
              onClick={() => {
                setImportText('');
                setImportResult(null);
                setIsImportModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Nhập Excel / CSV</span>
            </button>
            <button
              onClick={() => setIsChildModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Học Sinh Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rescan alert banner */}
      {rescanMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{rescanMessage}</span>
          </div>
          <button onClick={() => setRescanMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── 2. KPI STATS CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Học Sinh</div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalChildren || children.length}</div>
          <div className="text-xs text-slate-400">Đang theo học tại trường</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Học Sinh Dị Ứng</div>
          <div className="text-2xl font-black text-amber-700">{stats?.allergicCount || 0}</div>
          <div className="text-xs text-amber-600 font-semibold">Chiếm {stats?.allergyRate || 0}% sĩ số</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Dị Ứng Nghiêm Trọng</div>
          <div className="text-2xl font-black text-rose-700">{stats?.severeCount || 0}</div>
          <div className="text-xs text-rose-600 font-semibold">Cần có sẵn phác đồ EpiPen</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">An Toàn Bữa Ăn</div>
          <div className="text-2xl font-black text-emerald-700">100%</div>
          <div className="text-xs text-emerald-600 font-semibold">Được bảo vệ bởi Rule Engine</div>
        </div>
      </div>

      {/* ─── 3. SEARCH & FILTERS ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bé, mã học sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-semibold"
          >
            <option value="ALL">Tất cả các lớp</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={allergyFilter}
            onChange={(e) => setAllergyFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-semibold"
          >
            <option value="ALL">Tất cả tình trạng</option>
            <option value="YES">Có tiền sử dị ứng</option>
            <option value="NO">Không dị ứng</option>
          </select>
        </div>
      </div>

      {/* ─── 4. CHILDREN TABLE ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Học Sinh</th>
                <th className="py-3.5 px-3">Lớp</th>
                <th className="py-3.5 px-3">Ngày Sinh / Giới Tính</th>
                <th className="py-3.5 px-3">Liên Hệ Khẩn Cấp</th>
                <th className="py-3.5 px-3">Dị Nguyên Khai Báo</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChildren.length > 0 ? (
                filteredChildren.map((c) => {
                  const hasAllergies = c.allergies && c.allergies.length > 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.studentCode}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        {c.class?.name || 'Chưa xếp lớp'}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-700">
                          {new Date(c.dateOfBirth).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.gender === 'MALE' ? 'Bé trai' : 'Bé gái'}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{c.emergencyContactName}</div>
                        <div className="text-[11px] text-slate-500">{c.emergencyContactPhone}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        {hasAllergies ? (
                          <div className="flex flex-wrap gap-1.5">
                            {c.allergies!.map((a) => {
                              const isSevere = a.severity === 'SEVERE' || a.severity === 'ANAPHYLACTIC';
                              return (
                                <span
                                  key={a.id}
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                    isSevere
                                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                                      : 'bg-amber-100 text-amber-800 border-amber-200'
                                  }`}
                                  title={`Phác đồ: ${a.reactionTreatment || 'Chưa có'}`}
                                >
                                  {a.allergen?.nameVi || a.customAllergenName} ({a.severity})
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Không dị ứng
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setTargetChild(c);
                            setIsAllergyModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Khai báo dị ứng</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy học sinh nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. MODAL DECLARE ALLERGY ─── */}
      {isAllergyModalOpen && targetChild && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Khai Báo Dị Ứng Học Sinh</h3>
              </div>
              <button
                onClick={() => setIsAllergyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-slate-800">Bé: {targetChild.fullName}</div>
              <div className="text-slate-500">Mã: {targetChild.studentCode} • Lớp: {targetChild.class?.name || 'Mầm non'}</div>
            </div>

            <form onSubmit={handleDeclareAllergy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dị Nguyên Chuẩn Quốc Gia *</label>
                <select
                  value={allergyForm.allergenId}
                  onChange={(e) => setAllergyForm({ ...allergyForm, allergenId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                >
                  <option value="">-- Chọn dị nguyên từ danh mục --</option>
                  {catalogs.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameVi} ({cat.commonFoods || cat.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hoặc Nhập Dị Nguyên Khác (Nếu không có trên)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Dâu tây, thịt bò, quả kiwi..."
                  value={allergyForm.customAllergenName}
                  onChange={(e) => setAllergyForm({ ...allergyForm, customAllergenName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mức Độ Nghiêm Trọng *</label>
                  <select
                    value={allergyForm.severity}
                    onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold text-rose-700"
                  >
                    <option value="MILD">Nhẹ (MILD)</option>
                    <option value="MODERATE">Trung bình (MODERATE)</option>
                    <option value="SEVERE">Nặng (SEVERE)</option>
                    <option value="ANAPHYLACTIC">Sốc phản vệ (ANAPHYLACTIC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại Phản Ứng</label>
                  <select
                    value={allergyForm.allergyType}
                    onChange={(e) => setAllergyForm({ ...allergyForm, allergyType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="ALLERGY">Dị ứng thực phẩm</option>
                    <option value="INTOLERANCE">Không dung nạp (Lactose...)</option>
                    <option value="RELIGIOUS_RESTRICTION">Kiêng tôn giáo</option>
                    <option value="MEDICAL_RESTRICTION">Chỉ định bác sĩ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Triệu Chứng Thường Gặp</label>
                <input
                  type="text"
                  value={allergyForm.symptoms}
                  onChange={(e) => setAllergyForm({ ...allergyForm, symptoms: e.target.value })}
                  placeholder="Mẩn đỏ, ngứa ngáy, sưng môi, khó thở..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phác Đồ Xử Trí Khẩn Cấp *</label>
                <textarea
                  rows={2}
                  required
                  value={allergyForm.reactionTreatment}
                  onChange={(e) => setAllergyForm({ ...allergyForm, reactionTreatment: e.target.value })}
                  placeholder="Cách xử trí ngay khi tiếp xúc: báo y tế, cho uống thuốc gì, vị trí cất thuốc..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllergyModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition"
                >
                  Lưu khai báo dị ứng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. MODAL CREATE CHILD ─── */}
      {isChildModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Thêm Hồ Sơ Học Sinh Mới</h3>
              </div>
              <button
                onClick={() => setIsChildModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChild} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã Học Sinh *</label>
                  <input
                    type="text"
                    required
                    placeholder="BM-HS01"
                    value={childForm.studentCode}
                    onChange={(e) => setChildForm({ ...childForm, studentCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp Học</label>
                  <select
                    value={childForm.classId}
                    onChange={(e) => setChildForm({ ...childForm, classId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  >
                    <option value="">-- Chưa xếp lớp --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và Tên Đệm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Gia"
                    value={childForm.lastName}
                    onChange={(e) => setChildForm({ ...childForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Huy"
                    value={childForm.firstName}
                    onChange={(e) => setChildForm({ ...childForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Sinh *</label>
                  <input
                    type="date"
                    required
                    value={childForm.dateOfBirth}
                    onChange={(e) => setChildForm({ ...childForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới Tính *</label>
                  <select
                    value={childForm.gender}
                    onChange={(e) => setChildForm({ ...childForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  >
                    <option value="MALE">Bé trai</option>
                    <option value="FEMALE">Bé gái</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Người Liên Hệ Khẩn Cấp *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mẹ: Trần Thị Mai"
                    value={childForm.emergencyContactName}
                    onChange={(e) => setChildForm({ ...childForm, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={childForm.emergencyContactPhone}
                    onChange={(e) => setChildForm({ ...childForm, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Y Tế Đặc Biệt</label>
                <textarea
                  rows={2}
                  value={childForm.medicalNotes}
                  onChange={(e) => setChildForm({ ...childForm, medicalNotes: e.target.value })}
                  placeholder="Ghi chú về sức khỏe, cơ địa dễ sốt co giật hoặc tiền sử dị ứng..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChildModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
                >
                  Lưu hồ sơ học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL NHẬP DANH SÁCH HỌC SINH TỪ FILE / CSV ─── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Nhập Danh Sách Học Sinh Hàng Loạt</h3>
                  <p className="text-[11px] text-slate-500">Định dạng CSV hoặc dán trực tiếp từ bảng tính Excel</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Cấu trúc cột dữ liệu mẫu:</span>
                  <button
                    onClick={() => setImportText(sampleCsv)}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Dán dữ liệu mẫu
                  </button>
                </div>
                <code className="block bg-white p-2.5 rounded-xl border border-emerald-200/80 text-[11px] text-slate-700 font-mono overflow-x-auto whitespace-pre">
                  Mã học sinh, Họ, Tên, Ngày sinh (YYYY-MM-DD), Giới tính (MALE/FEMALE), Ghi chú
                </code>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Dán nội dung bảng tính hoặc CSV vào đây:
                </label>
                <textarea
                  rows={8}
                  placeholder={`Ví dụ:\nHS-2026-0091, Nguyễn, Minh Khang, 2021-06-15, MALE, Tiền sử dị ứng tôm\nHS-2026-0092, Trần, Bảo Anh, 2021-08-20, FEMALE, `}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {importResult && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã nhập thành công {importResult.count} học sinh vào hệ thống!</span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-rose-600">Các lỗi cần lưu ý ({importResult.errors.length}):</span>
                      <ul className="list-disc pl-5 text-[11px] text-rose-600 max-h-32 overflow-y-auto">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedClass !== 'ALL'
                  ? `Học sinh sẽ được gán tự động vào lớp đang chọn.`
                  : 'Học sinh chưa được xếp lớp.'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-200 transition"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={importing || !importText.trim()}
                  onClick={handleImportSubmit}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{importing ? 'Đang nhập dữ liệu...' : 'Bắt đầu nhập học sinh'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
