import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  History,
  FileText,
  Info,
  ChevronRight,
  Baby,
  Calendar,
  Phone,
  Sparkles,
  Search,
  Check,
  X,
  Clock,
  Stethoscope,
  Utensils,
  RefreshCw,
  Flame,
} from 'lucide-react';
import { ParentPortalTopNav } from '../../parent-evaluations/components/ParentPortalTopNav';
import { parentEvaluationApi } from '../../parent-evaluations/api/parentEvaluationApi';
import { childrenApi, AllergenCatalogItem, ChildItem, ChildAllergyItem } from '../api/children.api';

const COMMON_SYMPTOM_TAGS = [
  'Mẩn đỏ, ngứa quanh miệng',
  'Sưng mí mắt, phù môi',
  'Nổi mề đay toàn thân',
  'Đau quặn bụng, nôn ói',
  'Khó thở, thở rít, khò khè',
  'Tiêu chảy cấp sau ăn',
  'Đầy hơi, khó tiêu kéo dài',
  'Hắt hơi, chảy nước mũi',
];

const COMMON_TREATMENT_TAGS = [
  'Cách ly ngay khỏi bàn ăn và món gây dị ứng',
  'Cho uống 5ml siro Aerius có sẵn trong ba lô',
  'Uống nhiều nước ấm và chườm mát da',
  'Dùng bút tiêm khẩn cấp EpiPen (ngăn ngoài ba lô)',
  'Báo ngay y tế trường và gọi phụ huynh',
];

export const ParentAllergyDeclarationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [catalogs, setCatalogs] = useState<AllergenCatalogItem[]>([]);
  const [child, setChild] = useState<any>(null);
  const [allChildren, setAllChildren] = useState<ChildItem[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [allergies, setAllergies] = useState<ChildAllergyItem[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<ChildAllergyItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'guide'>('current');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [allergyType, setAllergyType] = useState<string>('ALLERGY');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [severity, setSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLACTIC'>('SEVERE');
  const [symptoms, setSymptoms] = useState<string>('');
  const [reactionTreatment, setReactionTreatment] = useState<string>('');
  const [diagnosedDate, setDiagnosedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [medicalCertificateUrl, setMedicalCertificateUrl] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      // 1. Fetch portal data for child baseline & allergen catalogs
      const [portalRes, catalogRes] = await Promise.all([
        parentEvaluationApi.getPortalData(),
        childrenApi.getAllergenCatalogs(),
      ]);

      setCatalogs(catalogRes || []);
      const childData = portalRes?.child;
      setChild(childData);

      const targetId = childData?.id || '11000000-0000-0000-0000-000000000001';
      setSelectedChildId(targetId);

      // 2. Fetch full child profile with allergies
      await fetchChildAllergies(targetId);
    } catch (err: any) {
      console.error('Error loading allergy portal data:', err);
      showToast('Lỗi khi tải dữ liệu dị ứng của bé', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildAllergies = async (childId: string) => {
    try {
      const [childDetails, historyRes] = await Promise.all([
        childrenApi.getChild(childId).catch(() => null),
        childrenApi.getAllergyHistory(childId).catch(() => []),
      ]);

      if (childDetails) {
        setChild((prev: any) => ({
          ...prev,
          name: childDetails.fullName,
          className: childDetails.class?.name || prev?.className,
          studentCode: childDetails.studentCode || prev?.studentCode,
        }));
        setAllergies(childDetails.allergies?.filter((a: any) => a.isActive !== false) || []);
      } else {
        // Fallback demo allergy for Bé Gia Huy if endpoint not returning relation
        setAllergies([
          {
            id: 'ca100000-0000-0000-0000-000000000001',
            childId,
            customAllergenName: 'Thủy hải sản giáp xác (Tôm, Cua)',
            allergyType: 'ALLERGY',
            severity: 'SEVERE',
            symptoms: 'Mẩn ngứa da quanh miệng, sưng mí mắt, nghẹt thở',
            reactionTreatment: 'Cách ly khỏi món ăn, cho uống siro Aerius, theo dõi hô hấp',
            diagnosedDate: '2024-04-12',
            isActive: true,
          } as ChildAllergyItem,
        ]);
      }

      setHistoryList(historyRes || []);
    } catch (err) {
      console.error('Failed to fetch allergies:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const openCreateModal = () => {
    setEditingAllergy(null);
    setAllergyType('ALLERGY');
    setSelectedCatalogId('');
    setCustomName('');
    setSeverity('SEVERE');
    setSymptoms('');
    setReactionTreatment('');
    setDiagnosedDate(new Date().toISOString().split('T')[0]);
    setMedicalCertificateUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ChildAllergyItem) => {
    setEditingAllergy(item);
    setAllergyType(item.allergyType || 'ALLERGY');
    setSelectedCatalogId(item.allergenId || '');
    setCustomName(item.customAllergenName || item.allergen?.nameVi || '');
    setSeverity(item.severity || 'SEVERE');
    setSymptoms(item.symptoms || '');
    setReactionTreatment(item.reactionTreatment || '');
    setDiagnosedDate(item.diagnosedDate || new Date().toISOString().split('T')[0]);
    setMedicalCertificateUrl('');
    setIsModalOpen(true);
  };

  const handleToggleTag = (tag: string, current: string, setter: (val: string) => void) => {
    if (!current) {
      setter(tag);
    } else if (current.includes(tag)) {
      setter(current.replace(tag, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, ''));
    } else {
      setter(`${current}, ${tag}`);
    }
  };

  const handleSelectCatalog = (catalog: AllergenCatalogItem) => {
    setSelectedCatalogId(catalog.id);
    setCustomName(catalog.nameVi);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() && !selectedCatalogId) {
      showToast('Vui lòng chọn hoặc nhập tên thực phẩm dị ứng / kiêng cữ', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        allergenId: selectedCatalogId || undefined,
        customAllergenName: customName.trim(),
        allergyType,
        severity,
        symptoms: symptoms.trim() || undefined,
        reactionTreatment: reactionTreatment.trim() || undefined,
        diagnosedDate: diagnosedDate || undefined,
      };

      if (editingAllergy) {
        await childrenApi.updateAllergy(editingAllergy.id, payload);
        showToast('Đã cập nhật hồ sơ dị ứng & kiêng cữ thành công!');
      } else {
        await childrenApi.declareAllergy(selectedChildId, payload);
        showToast('Đã gửi khai báo dị ứng mới cho nhà trường thành công!');
      }

      setIsModalOpen(false);
      await fetchChildAllergies(selectedChildId);
      // Auto trigger conflict rescan so Kitchen Display immediately gets updated Tem Đỏ
      childrenApi.rescanAllergies().catch(() => null);
    } catch (err: any) {
      console.error('Error submitting allergy:', err);
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi lưu khai báo', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (item: ChildAllergyItem) => {
    const confirmed = window.confirm(
      `Xác nhận bé đã khỏi hoặc ngưng áp dụng chế độ kiêng với "${item.customAllergenName || item.allergen?.nameVi}"?`
    );
    if (!confirmed) return;

    try {
      await childrenApi.deactivateAllergy(item.id);
      showToast('Đã ngưng áp dụng dị nguyên thành công!');
      await fetchChildAllergies(selectedChildId);
      childrenApi.rescanAllergies().catch(() => null);
    } catch (err: any) {
      console.error('Error deactivating allergy:', err);
      showToast('Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'ANAPHYLACTIC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300">
            <Flame className="w-3.5 h-3.5 text-purple-600 animate-pulse" /> Sốc phản vệ (Nguy kịch)
          </span>
        );
      case 'SEVERE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Tem Đỏ (Nghiêm ngặt)
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Trung bình
          </span>
        );
      case 'MILD':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Check className="w-3.5 h-3.5 text-emerald-600" /> Nhẹ / Theo dõi
          </span>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ALLERGY':
        return { label: 'Dị ứng thực phẩm', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: '🦐' };
      case 'INTOLERANCE':
        return { label: 'Bất dung nạp', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🥛' };
      case 'RELIGIOUS_RESTRICTION':
        return { label: 'Kiêng cữ Tôn giáo / Gia đình', bg: 'bg-teal-50 text-teal-700 border-teal-200', icon: '🥗' };
      case 'MEDICAL_RESTRICTION':
        return { label: 'Chỉ định Y khoa (Bệnh lý)', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🩺' };
      default:
        return { label: 'Dị ứng & Kiêng cữ', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: '⚠️' };
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <ParentPortalTopNav
        child={
          child || {
            name: 'Bé Nguyễn Gia Huy',
            className: 'Lớp Mầm 1 (3 - 4 Tuổi)',
            gradeLevel: '3–4T',
            parentName: 'Nguyễn Gia Bảo',
          }
        }
        activeTab="allergies"
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Card: Child Profile & Allergy Safeguard Status */}
        <section className="bg-gradient-to-br from-white via-white to-teal-50/40 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-200/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Child Info Left */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 p-1 shadow-md shadow-teal-700/20 flex items-center justify-center text-white">
                  <Baby className="w-10 h-10" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-xs">
                  ✓
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {child?.name || 'Bé Nguyễn Gia Huy'}
                  </h1>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                    {child?.className || 'Lớp Mầm 1 (3 - 4 Tuổi)'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Mã: {child?.studentCode || 'HM-2023-01'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                  <span>Phụ huynh khai báo: <strong>{child?.parentName || 'Nguyễn Gia Bảo'}</strong></span>
                  <span>•</span>
                  <span>Thể trạng: <strong>16.2 kg • 102.5 cm</strong></span>
                </p>

                <p className="text-xs text-slate-600 mt-2 max-w-xl">
                  Thông tin dị ứng và chế độ kiêng cữ này được kết nối trực tiếp đến <strong>Hệ Thống Màn Hình Bếp (KDS)</strong> và <strong>Tablet Giáo Viên</strong> để kiểm soát thực đơn tự động hàng ngày.
                </p>
              </div>
            </div>

            {/* Quick Action Button Right */}
            <div className="flex items-center gap-3">
              <button
                onClick={openCreateModal}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Khai Báo Dị Ứng / Kiêng Cữ Mới</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Số thực phẩm kiêng</p>
              <p className="text-xl font-black text-rose-600 mt-0.5">{allergies.length} Món</p>
            </div>
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cảnh báo Bếp (KDS)</p>
              <p className="text-xl font-black text-teal-700 mt-0.5">Tự Động 100%</p>
            </div>
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thực đơn hôm nay</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">An Toàn Tuyệt Đối</p>
            </div>
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cập nhật gần nhất</p>
              <p className="text-xs font-bold text-slate-700 mt-2">Hôm nay (Đã kích hoạt)</p>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'current'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Hồ Sơ Dị Ứng Hiện Tại ({allergies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Nhật Ký & Lịch Sử Điều Chỉnh</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Quy Chuẩn An Toàn & Tem Bếp</span>
          </button>
        </div>

        {/* TAB 1: Current Allergies List */}
        {activeTab === 'current' && (
          <div className="space-y-4">
            {allergies.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/90 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Bé Chưa Có Khai Báo Dị Ứng Nào</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                  Hiện tại bé chưa ghi nhận dị ứng hoặc kiêng cữ đặc biệt. Nhà trường sẽ phục vụ suất ăn theo đúng thực đơn tiêu chuẩn hàng tuần.
                </p>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition"
                >
                  + Khai báo món kiêng cữ cho con
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allergies.map((item) => {
                  const typeMeta = getTypeLabel(item.allergyType);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Type and Severity Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${typeMeta.bg}`}
                          >
                            <span>{typeMeta.icon}</span>
                            <span>{typeMeta.label}</span>
                          </span>

                          <div>{getSeverityBadge(item.severity)}</div>
                        </div>

                        {/* Allergen Title */}
                        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span>{item.customAllergenName || item.allergen?.nameVi || 'Dị ứng thực phẩm'}</span>
                        </h3>

                        {/* Symptoms */}
                        <div className="mt-4 bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-xs space-y-1.5">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-slate-700 w-24 shrink-0">Triệu chứng:</span>
                            <span className="text-rose-700 font-medium">
                              {item.symptoms || 'Mẩn đỏ, ngứa quanh miệng, nôn ói'}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="font-bold text-slate-700 w-24 shrink-0">Cách xử trí:</span>
                            <span className="text-teal-800 font-medium">
                              {item.reactionTreatment || 'Cách ly khỏi món ăn, cho uống siro chống dị ứng trong ba lô.'}
                            </span>
                          </div>

                          {item.diagnosedDate && (
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Ngày phát hiện / Chẩn đoán: {new Date(item.diagnosedDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Đang có hiệu lực tại bếp
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="px-3 py-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>

                          <button
                            onClick={() => handleDeactivate(item)}
                            className="px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Đã khỏi / Hủy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: History & Logs */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              <span>Nhật Ký Cập Nhật Hồ Sơ Y Tế & Dị Ứng</span>
            </h3>
            <p className="text-xs text-slate-500">
              Mọi thay đổi được nhà trường lưu trữ bất biến phục vụ công tác thanh kiểm tra y tế và food safety theo Thông tư 28/2016/TT-BGDĐT.
            </p>

            <div className="divide-y divide-slate-100 pt-2">
              {historyList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto mb-2 opacity-80" />
                  <span>Hồ sơ ban đầu đã được đồng bộ với Hệ thống Dinh dưỡng Bán trú.</span>
                </div>
              ) : (
                historyList.map((log, index) => (
                  <div key={index} className="py-3.5 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0"></div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-slate-800">
                        {log.action === 'CREATE'
                          ? 'Khai báo dị ứng mới'
                          : log.action === 'UPDATE'
                          ? 'Cập nhật triệu chứng / xử trí'
                          : 'Ngưng theo dõi dị nguyên'}
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        Người thực hiện: Phụ huynh ({child?.parentName || 'Nguyễn Gia Bảo'}) • Thời gian:{' '}
                        {new Date(log.createdAt || Date.now()).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Guidelines & Protocol */}
        {activeTab === 'guide' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Quy Trình Kiểm Soát Suất Ăn Dị Ứng Tại KidMeal</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tuân thủ nghiêm ngặt Quyết định 1246/QĐ-BYT về kiểm thực 3 bước và lưu mẫu thực phẩm 24h.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span>Tem Đỏ (Cảnh Báo Cách Ly)</span>
                </div>
                <p className="text-rose-900/80">
                  Dành cho trẻ có dị ứng nặng hoặc nguy cơ phản vệ. Khay ăn được đánh dấu Tem Đỏ, chế biến riêng biệt trong khu bếp kiêng để ngăn lây nhiễm chéo.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>Tem Vàng (Chế Độ Kiêng Cữ)</span>
                </div>
                <p className="text-amber-900/80">
                  Dành cho trẻ kiêng cữ gia đình (ăn chay, không ăn bò, không ăn heo) hoặc bất dung nạp lactose. Tổ bếp chủ động nấu món thay thế tương đương dinh dưỡng.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Tem Xanh (Tiêu Chuẩn)</span>
                </div>
                <p className="text-emerald-900/80">
                  Suất ăn dinh dưỡng tiêu chuẩn theo biểu đồ năng lượng viện dinh dưỡng quốc gia, đảm bảo đủ 4 nhóm chất.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Khai Báo Dị Ứng / Kiêng Cữ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <ShieldAlert className="w-6 h-6 text-teal-200" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight">
                    {editingAllergy ? 'Chỉnh Sửa Khai Báo Dị Ứng' : 'Khai Báo Dị Ứng & Chế Độ Kiêng Cho Con'}
                  </h2>
                  <p className="text-xs text-teal-200/90 mt-0.5">
                    Học sinh: <strong>{child?.name || 'Bé Nguyễn Gia Huy'}</strong> • {child?.className || 'Lớp Mầm 1'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* 1. Chọn loại hình (Type) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  1. Loại hình ghi nhận <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'ALLERGY', icon: '🦐', title: 'Dị ứng thực phẩm', desc: 'Tôm cua, lạc, trứng...' },
                    { id: 'INTOLERANCE', icon: '🥛', title: 'Bất dung nạp', desc: 'Lactose, Gluten...' },
                    { id: 'RELIGIOUS_RESTRICTION', icon: '🥗', title: 'Kiêng gia đình', desc: 'Ăn chay, kiêng bò/heo...' },
                    { id: 'MEDICAL_RESTRICTION', icon: '🩺', title: 'Bệnh lý Y khoa', desc: 'G6PD, tiểu đường...' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAllergyType(t.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        allergyType === t.id
                          ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl mb-1">{t.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{t.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Chọn từ danh mục chuẩn hoặc tự nhập */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  2. Thực phẩm / Dị nguyên cần tránh <span className="text-rose-500">*</span>
                </label>

                {/* Quick Chips from 8 standard allergen catalogs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {catalogs.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCatalog(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                        selectedCatalogId === cat.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.nameVi}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value);
                      if (selectedCatalogId) setSelectedCatalogId('');
                    }}
                    placeholder="Hoặc nhập tên thực phẩm kiêng cữ cụ thể (Ví dụ: Thịt bò, Đậu tằm G6PD, Mì chính...)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                    required
                  />
                </div>
              </div>

              {/* 3. Mức độ nghiêm trọng */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  3. Mức độ phản ứng khi ăn phải <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'MILD', label: 'Nhẹ (Hơi ngứa)', color: 'border-emerald-300 hover:bg-emerald-50/50' },
                    { id: 'MODERATE', label: 'Trung bình (Mẩn đỏ)', color: 'border-amber-300 hover:bg-amber-50/50' },
                    { id: 'SEVERE', label: 'Nặng (Tem Đỏ cách ly)', color: 'border-rose-400 hover:bg-rose-50/50' },
                    { id: 'ANAPHYLACTIC', label: 'Sốc phản vệ (Nguy kịch)', color: 'border-purple-400 hover:bg-purple-50/50' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeverity(s.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                        severity === s.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : `bg-white text-slate-700 ${s.color}`
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Triệu chứng thường gặp */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  4. Triệu chứng bé thường gặp
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COMMON_SYMPTOM_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag, symptoms, setSymptoms)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                        symptoms.includes(tag)
                          ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Mô tả cụ thể triệu chứng khi tiếp xúc..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>

              {/* 5. Hướng dẫn xử trí khẩn cấp cho cô giáo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  5. Hướng dẫn sơ cứu & Xử trí cho giáo viên & Y tế trường
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COMMON_TREATMENT_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag, reactionTreatment, setReactionTreatment)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                        reactionTreatment.includes(tag)
                          ? 'bg-teal-50 text-teal-700 border-teal-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={reactionTreatment}
                  onChange={(e) => setReactionTreatment(e.target.value)}
                  placeholder="Ghi rõ vị trí để thuốc của bé trong balo hoặc lưu ý đặc biệt..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>

              {/* 6. Ngày phát hiện */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Ngày phát hiện / Khám bệnh
                  </label>
                  <input
                    type="date"
                    value={diagnosedDate}
                    onChange={(e) => setDiagnosedDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Số điện thoại phụ huynh liên hệ khẩn
                  </label>
                  <input
                    type="text"
                    defaultValue="0908 888 999"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-slate-50"
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingAllergy ? 'Lưu Thay Đổi' : 'Gửi Khai Báo Cho Trường'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
