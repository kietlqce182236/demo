import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sparkles,
  Scale,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Salad,
  RotateCcw,
  Edit3,
  Archive,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  ChevronRight,
  Flame,
  Info,
  ChefHat,
  Filter,
  CloudDownload,
  Database,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  nutritionEngineApi,
  NutritionRule,
  AllergenCatalog,
  NutritionEngineStats,
  MenuScanResult,
  CreateNutritionRulePayload,
  UpdateNutritionRulePayload,
  CreateAllergenPayload,
  UpdateAllergenPayload,
} from '../api/nutrition-rule-engine.api';
import { NutritionRuleDrawer } from '../components/NutritionRuleDrawer';
import { AllergenDrawer } from '../components/AllergenDrawer';
import { NutritionistAllergyManagementPage } from './NutritionistAllergyManagementPage';

export const NutritionRulesPage: React.FC = () => {
  const location = useLocation();
  // Tabs: 'STANDARDS' | 'ALLERGENS' | 'SCANNER'
  const [activeTab, setActiveTab] = useState<'STANDARDS' | 'ALLERGENS' | 'SCANNER'>('STANDARDS');

  // Tự động nhận diện tab ALLERGENS khi người dùng truy cập /allergens hoặc ?tab=ALLERGENS
  useEffect(() => {
    if (location.pathname.includes('/allergens') || location.search.includes('tab=ALLERGENS')) {
      setActiveTab('ALLERGENS');
    }
  }, [location.pathname, location.search]);

  // Stats
  const [stats, setStats] = useState<NutritionEngineStats | null>(null);

  // Data lists
  const [rules, setRules] = useState<NutritionRule[]>([]);
  const [allergens, setAllergens] = useState<AllergenCatalog[]>([]);

  // Search & Filters
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleAgeFilter, setRuleAgeFilter] = useState('');
  const [includeDeletedRules, setIncludeDeletedRules] = useState(false);

  const [allergenSearch, setAllergenSearch] = useState('');
  const [includeDeletedAllergens, setIncludeDeletedAllergens] = useState(false);

  // Scanner states
  const [scanResult, setScanResult] = useState<MenuScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Drawers
  const [isRuleDrawerOpen, setIsRuleDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<NutritionRule | null>(null);

  const [isAllergenDrawerOpen, setIsAllergenDrawerOpen] = useState(false);
  const [editingAllergen, setEditingAllergen] = useState<AllergenCatalog | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Đồng Bộ Chuẩn Quốc Gia VN-RDA 2024
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Tải Stats
  const loadStats = async () => {
    try {
      const data = await nutritionEngineApi.getNutritionStats();
      setStats(data);
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
    }
  };

  // 2. Tải Quy chuẩn dinh dưỡng
  const loadRules = async () => {
    try {
      const data = await nutritionEngineApi.getNutritionRules({
        search: ruleSearch,
        targetAgeGroup: ruleAgeFilter || undefined,
        includeDeleted: includeDeletedRules,
      });
      setRules(data);
    } catch (err) {
      console.error('Lỗi khi tải quy chuẩn dinh dưỡng:', err);
    }
  };

  // 3. Tải Danh mục dị ứng
  const loadAllergens = async () => {
    try {
      const data = await nutritionEngineApi.getAllergens({
        search: allergenSearch,
        includeDeleted: includeDeletedAllergens,
      });
      setAllergens(data);
    } catch (err) {
      console.error('Lỗi khi tải danh mục dị ứng:', err);
    }
  };

  // 4. Đồng bộ Chuẩn Quốc Gia VN-RDA 2024 & TT 28
  const handleConfirmSyncRda = async () => {
    setIsSyncing(true);
    try {
      const res = await nutritionEngineApi.syncRdaStandards();
      showToast('success', res.message || 'Đã đồng bộ thành công chuẩn dinh dưỡng Quốc gia vào Database!');
      await Promise.all([loadRules(), loadStats()]);
      setIsSyncModalOpen(false);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Có lỗi khi đồng bộ quy chuẩn.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadRules();
    loadAllergens();
  }, []);

  useEffect(() => {
    loadRules();
  }, [ruleSearch, ruleAgeFilter, includeDeletedRules]);

  useEffect(() => {
    loadAllergens();
  }, [allergenSearch, includeDeletedAllergens]);

  // Submit Rule Drawer
  const handleRuleSubmit = async (
    payload: CreateNutritionRulePayload | UpdateNutritionRulePayload,
    id?: string,
  ) => {
    setIsLoading(true);
    try {
      if (id) {
        await nutritionEngineApi.updateNutritionRule(id, payload);
        showToast('success', 'Đã cập nhật quy chuẩn dinh dưỡng thành công.');
      } else {
        await nutritionEngineApi.createNutritionRule(payload as CreateNutritionRulePayload);
        showToast('success', 'Đã tạo mới quy chuẩn dinh dưỡng Thông tư 28 thành công.');
      }
      setIsRuleDrawerOpen(false);
      loadRules();
      loadStats();
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Soft delete Rule
  const handleSoftDeleteRule = async (rule: NutritionRule) => {
    if (rule.isSystemRule) {
      showToast('error', 'Không thể xóa quy chuẩn gốc quốc gia của Bộ GD&ĐT.');
      return;
    }
    if (!window.confirm(`Xác nhận chuyển quy chuẩn "${rule.name}" vào danh sách lưu trữ (xóa mềm)?`)) {
      return;
    }
    try {
      const res = await nutritionEngineApi.softDeleteNutritionRule(rule.id);
      showToast('success', res.message);
      loadRules();
      loadStats();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Không thể xóa quy chuẩn này.');
    }
  };

  // Restore Rule
  const handleRestoreRule = async (rule: NutritionRule) => {
    try {
      const res = await nutritionEngineApi.restoreNutritionRule(rule.id);
      showToast('success', res.message);
      loadRules();
      loadStats();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Không thể khôi phục quy chuẩn.');
    }
  };

  // Submit Allergen Drawer
  const handleAllergenSubmit = async (
    payload: CreateAllergenPayload | UpdateAllergenPayload,
    id?: string,
  ) => {
    setIsLoading(true);
    try {
      if (id) {
        await nutritionEngineApi.updateAllergen(id, payload);
        showToast('success', 'Đã cập nhật thông tin chất dị ứng thành công.');
      } else {
        await nutritionEngineApi.createAllergen(payload as CreateAllergenPayload);
        showToast('success', 'Đã thêm chất dị ứng mới vào danh mục kiểm tra.');
      }
      setIsAllergenDrawerOpen(false);
      loadAllergens();
      loadStats();
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Soft delete Allergen
  const handleSoftDeleteAllergen = async (allergen: AllergenCatalog) => {
    if (allergen.isSystemStandard) {
      showToast('error', 'Không thể xóa chất dị ứng chuẩn quốc tế Codex/BYT.');
      return;
    }
    if (!window.confirm(`Xác nhận xóa mềm chất dị ứng "${allergen.nameVi}"?`)) return;
    try {
      const res = await nutritionEngineApi.softDeleteAllergen(allergen.id);
      showToast('success', res.message);
      loadAllergens();
      loadStats();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Lỗi khi xóa chất dị ứng.');
    }
  };

  // Restore Allergen
  const handleRestoreAllergen = async (allergen: AllergenCatalog) => {
    try {
      const res = await nutritionEngineApi.restoreAllergen(allergen.id);
      showToast('success', res.message);
      loadAllergens();
      loadStats();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Lỗi khi khôi phục.');
    }
  };

  // Quét thực đơn tự động bằng Rule Engine
  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const result = await nutritionEngineApi.evaluateMenu({});
      setScanResult(result);
      showToast('success', 'Đã hoàn tất quét kiểm tra thực đơn tự động bằng Rule Engine.');
      loadStats();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Lỗi khi quét thực đơn.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 max-w-md ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.text}</span>
        </div>
      )}

      {/* Header Phân Hệ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              CHUYÊN VIÊN DINH DƯỠNG & BGH
            </span>
            <span className="text-xs text-slate-400">• Thông tư 28/2016/TT-BGDĐT</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Quy Chuẩn Dinh Dưỡng, Dị Ứng & Rule Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình tỷ lệ P-L-G, quản trị danh mục dị ứng và quét kiểm tra thực đơn tự động.
          </p>
        </div>

        {/* Nút Hành Động Header */}
        <div className="flex items-center gap-3">
          {/* Nút Làm Mới */}
          <button
            onClick={() => {
              loadStats();
              loadRules();
              loadAllergens();
            }}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-xs transition"
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Nút Đồng Bộ Chuẩn Quốc Gia VN-RDA 2024 (Cách 1) */}
          {activeTab === 'STANDARDS' && (
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-600/25 transition active:scale-98"
              title="Đồng bộ quy chuẩn dinh dưỡng từ Viện Dinh Dưỡng Quốc Gia (VN-RDA 2024) và Thông tư 28/2016/TT-BGDĐT"
            >
              <CloudDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Đồng Bộ Chuẩn VN-RDA 2024</span>
              <span className="sm:hidden">Đồng Bộ RDA</span>
            </button>
          )}

          {activeTab === 'STANDARDS' && (
            <button
              onClick={() => {
                setEditingRule(null);
                setIsRuleDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-teal-600/25 transition active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Tiêu Chuẩn Mới</span>
            </button>
          )}
          {activeTab === 'ALLERGENS' && (
            <button
              onClick={() => {
                setEditingAllergen(null);
                setIsAllergenDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-rose-600/25 transition active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Nhóm Chuẩn Codex</span>
            </button>
          )}
          {activeTab === 'SCANNER' && (
            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-indigo-600/25 transition active:scale-98"
            >
              {isScanning ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang Quét Rule Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Quét Kiểm Tra Tự Động</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP KPI STATISTICS CARDS (CÁC Ô THỐNG KÊ Ở PHẦN ĐẦU GIAO DIỆN)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Quy chuẩn kích hoạt */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Quy Chuẩn Áp Dụng</span>
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {stats?.activeRulesCount ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">chuẩn</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-700 font-semibold flex items-center gap-1">
            <span>Thông tư 28 & Chuẩn trường</span>
          </div>
        </div>

        {/* Card 2: Tỷ lệ tuân thủ thực đơn */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tỷ Lệ Tuân Thủ</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {stats?.complianceRatePercent ?? 96.5}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Đạt cân đối Calo & P:L:G</span>
          </div>
        </div>

        {/* Card 3: Cảnh báo dinh dưỡng */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Cảnh Báo Vi Phạm</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 tracking-tight">
              {stats?.nutritionWarningsCount ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">mục</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold">
            <span>Cần BGH xem xét điều chỉnh</span>
          </div>
        </div>

        {/* Card 4: Trẻ có hồ sơ dị ứng */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Trẻ Có Hồ Sơ Dị Ứng</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600 tracking-tight">
              {stats?.allergicChildrenCount ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">bé</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-700 font-semibold">
            <span>Theo dõi cách ly thực phẩm</span>
          </div>
        </div>

        {/* Card 5: Danh mục dị ứng đã cấu hình */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Danh Mục Dị Ứng</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Salad className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-indigo-600 tracking-tight">
              {stats?.configuredAllergensCount ?? 8}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">nhóm</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-700 font-semibold">
            <span>Codex & BYT chuẩn hóa</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THANH CHUYỂN TAB CHỨC NĂNG (SEGMENTED TAB BAR)                         */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('STANDARDS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'STANDARDS'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Tiêu Chuẩn Dinh Dưỡng (Thông tư 28)</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'STANDARDS' ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {rules.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ALLERGENS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'ALLERGENS'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Quy Tắc & Danh Mục Dị Ứng</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'ALLERGENS' ? 'bg-rose-700 text-rose-100' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {allergens.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SCANNER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'SCANNER'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Bộ Quét & Kiểm Tra Thực Đơn (Rule Engine)</span>
          {scanResult && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TIÊU CHUẨN DINH DƯỠNG (THÔNG TƯ 28)                                */}
      {/* ========================================================================= */}
      {activeTab === 'STANDARDS' && (
        <div className="space-y-4">
          {/* Toolbar Lọc & Tìm kiếm */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                placeholder="Tìm quy chuẩn theo tên hoặc nhóm tuổi..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={ruleAgeFilter}
                onChange={(e) => setRuleAgeFilter(e.target.value)}
                className="px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="">Tất cả độ tuổi</option>
                <option value="MAU_GIAO">Mẫu giáo (3 - 6 tuổi)</option>
                <option value="NHA_TRE">Nhà trẻ (12 - 36 tháng)</option>
                <option value="TODDLER_18_36M">Nhà trẻ (18 - 36 tháng)</option>
                <option value="KINDERGARTEN_3_4Y">Mẫu giáo (3 - 4 tuổi)</option>
                <option value="KINDERGARTEN_4_5Y">Mẫu giáo (4 - 5 tuổi)</option>
                <option value="KINDERGARTEN_5_6Y">Mẫu giáo (5 - 6 tuổi)</option>
                <option value="ALL_AGES">Mọi lứa tuổi</option>
              </select>

              <label className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700 transition">
                <input
                  type="checkbox"
                  checked={includeDeletedRules}
                  onChange={(e) => setIncludeDeletedRules(e.target.checked)}
                  className="w-3.5 h-3.5 text-teal-600 rounded-sm"
                />
                <span>Xem quy chuẩn đã xóa mềm</span>
              </label>
            </div>
          </div>

          {/* Bảng Danh Sách Quy Chuẩn */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Tên Quy Chuẩn</th>
                    <th className="py-3.5 px-4">Nhóm Tuổi</th>
                    <th className="py-3.5 px-4">Năng Lượng (Kcal)</th>
                    <th className="py-3.5 px-4">Cơ Cấu P : L : G (%)</th>
                    <th className="py-3.5 px-4">Vi Chất Canxi / Ca:P</th>
                    <th className="py-3.5 px-4">Phân Loại</th>
                    <th className="py-3.5 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Scale className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">Chưa tìm thấy quy chuẩn dinh dưỡng phù hợp</p>
                      </td>
                    </tr>
                  ) : (
                    rules.map((item) => {
                      const isDeleted = item.isDeleted;
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isDeleted ? 'bg-slate-50/50 opacity-70' : ''
                          }`}
                        >
                          {/* Tên */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs ${
                                  item.isSystemRule
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {item.isSystemRule ? 'BGD' : 'TRƯỜNG'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {item.name || (item as any).ruleName || `Quy chuẩn TT 28 (${item.targetAgeGroup || (item as any).ageGroup})`}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Phạm vi: {item.mealScope === 'FULL_DAY_SCHOOL' || item.mealScope === 'ALL_DAY' || item.mealScope === 'FULL_DAY' ? 'Cả ngày bán trú (100% Calo)' : item.mealScope === 'DAYBOARDING' ? 'Bán trú tại trường (50-60% Calo)' : item.mealScope}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Nhóm tuổi */}
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              {item.targetAgeGroup === 'TODDLER_18_36M' || item.targetAgeGroup === 'NHA_TRE' || (item as any).ageGroup === 'NHA_TRE'
                                ? 'Nhà trẻ (12-36 tháng)'
                                : item.targetAgeGroup === 'KINDERGARTEN_3_4Y' || item.targetAgeGroup === 'MAU_GIAO' || (item as any).ageGroup === 'MAU_GIAO'
                                ? 'Mẫu giáo (3-6 tuổi)'
                                : item.targetAgeGroup === 'ALL_AGES'
                                ? 'Mọi lứa tuổi'
                                : (item.targetAgeGroup || (item as any).ageGroup || 'Mẫu giáo (3-6 tuổi)')}
                            </span>
                          </td>

                          {/* Calo */}
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {(item.minCaloriesKcal || (item as any).minEnergyKcal || 600)} - {(item.maxCaloriesKcal || (item as any).maxEnergyKcal || 750)} Kcal
                          </td>

                          {/* P-L-G */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                              <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                P: {item.minProteinPercent ?? (item as any).minProteinPct ?? 13}-{item.maxProteinPercent ?? (item as any).maxProteinPct ?? 20}%
                              </span>
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                L: {item.minFatPercent ?? (item as any).minFatPct ?? 25}-{item.maxFatPercent ?? (item as any).maxFatPct ?? 35}%
                              </span>
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                G: {item.minCarbPercent ?? (item as any).minCarbPct ?? 52}-{item.maxCarbPercent ?? (item as any).maxCarbPct ?? 60}%
                              </span>
                            </div>
                          </td>

                          {/* Vi chất */}
                          <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                            <div>Ca: ≥ {item.minCalciumMg || 300}mg</div>
                            <div className="text-slate-400">Ca/P: {item.caPRatioMin || 1.0} - {item.caPRatioMax || 1.5}</div>
                          </td>

                          {/* Phân loại */}
                          <td className="py-3.5 px-4">
                            {isDeleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <Archive className="w-3 h-3" /> Đã xóa mềm
                              </span>
                            ) : item.isSystemRule ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <ShieldCheck className="w-3 h-3 text-amber-600" /> Chuẩn Bộ GD&ĐT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                Chuẩn của Trường
                              </span>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isDeleted ? (
                                <button
                                  onClick={() => handleRestoreRule(item)}
                                  className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center gap-1 transition"
                                  title="Khôi phục quy chuẩn"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Khôi phục</span>
                                </button>
                              ) : item.isSystemRule ? (
                                <span className="text-[11px] text-slate-400 italic px-2">Cố định</span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingRule(item);
                                      setIsRuleDrawerOpen(true);
                                    }}
                                    className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
                                    title="Chỉnh sửa quy chuẩn (Mở Popup bên phải)"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleSoftDeleteRule(item)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                    title="Chuyển vào lưu trữ (Xóa mềm)"
                                  >
                                    <Archive className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUY TẮC & QUẢN LÝ DỊ ỨNG HỌC SINH TOÀN DIỆN                        */}
      {/* ========================================================================= */}
      {activeTab === 'ALLERGENS' && (
        <div className="space-y-6">
          <NutritionistAllergyManagementPage embedded={true} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BỘ QUÉT & KIỂM TRA THỰC ĐƠN TỰ ĐỘNG (RULE ENGINE SCANNER)           */}
      {/* ========================================================================= */}
      {activeTab === 'SCANNER' && (
        <div className="space-y-6">
          {/* Banner Giới Thiệu Scanner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-teal-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Hệ Thống Kiểm Duyệt Tự Động KidMeal Rule Engine
              </span>
              <h2 className="text-xl font-black">
                Quét & Thẩm Định Thực Đơn Theo Thông Tư 28 và Hồ Sơ Dị Ứng
              </h2>
              <p className="text-xs text-indigo-200 leading-relaxed">
                Tự động rà soát vi chất, năng lượng Calo, cơ cấu P:L:G, đối chiếu trực tiếp danh sách
                nguyên liệu thực đơn với cơ sở dữ liệu trẻ dị ứng toàn trường để phát hiện nguy cơ phản vệ.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleTriggerScan}
                  disabled={isScanning}
                  className="px-5 py-2.5 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-900 font-extrabold text-xs shadow-md transition flex items-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Đang Phân Tích Thực Đơn...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Bắt Đầu Quét Thực Đơn Tuần Hiện Tại</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Kết quả sau khi quét */}
          {scanResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Bảng điểm tổng quan & Thước đo tuân thủ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Điểm số */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex items-center gap-5">
                  <div
                    className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black text-2xl shadow-inner ${
                      scanResult.overallStatus === 'PASS'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : scanResult.overallStatus === 'WARNING'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}
                  >
                    <span>{scanResult.complianceScore}</span>
                    <span className="text-[10px] font-bold text-slate-400">/ 100 ĐIỂM</span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Trạng Thái Thẩm Định:
                    </span>
                    <span
                      className={`text-lg font-black mt-0.5 inline-block ${
                        scanResult.overallStatus === 'PASS'
                          ? 'text-emerald-600'
                          : scanResult.overallStatus === 'WARNING'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {scanResult.overallStatus === 'PASS'
                        ? '✓ ĐẠT CHUẨN THÔNG TƯ 28'
                        : scanResult.overallStatus === 'WARNING'
                        ? '⚠ CẦN ĐIỀU CHỈNH'
                        : '✕ PHÁT HIỆN VI PHẠM'}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{scanResult.menuTitle}</p>
                  </div>
                </div>

                {/* Quy chuẩn đối chiếu */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Quy chuẩn áp dụng:
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-1">{scanResult.appliedRuleName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Chuẩn Calo: {scanResult.standardReference.minEnergyKcal} -{' '}
                      {scanResult.standardReference.maxEnergyKcal} Kcal/trẻ
                    </p>
                  </div>
                  <div className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100">
                    Thực tế: {scanResult.summaryNutrition.totalEnergyKcal} Kcal/suất
                  </div>
                </div>

                {/* Tóm tắt vi phạm */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Tổng số phát hiện:
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl font-black text-slate-900">
                        {scanResult.violations.length}
                      </span>
                      <span className="text-xs text-slate-400">mục lưu ý</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      {scanResult.violations.filter((v) => v.severity === 'CRITICAL').length} Nghiêm trọng
                    </span>
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      {scanResult.violations.filter((v) => v.severity === 'WARNING').length} Cảnh báo
                    </span>
                  </div>
                </div>
              </div>

              {/* Đồ thị tỷ lệ P:L:G so sánh trực quan */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-teal-600" />
                  <span>Cơ Cấu Tỷ Lệ Năng Lượng Thực Tế vs Tiêu Chuẩn Thông Tư 28</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Protein P */}
                  <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-900">Đạm (Protein - P)</span>
                      <span className="font-black text-blue-700">
                        {scanResult.summaryNutrition.proteinRatioPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(scanResult.summaryNutrition.proteinRatioPercent * 2.5, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-blue-700">
                      Chuẩn: {scanResult.standardReference.minProteinPercent}% -{' '}
                      {scanResult.standardReference.maxProteinPercent}% (Thực tế:{' '}
                      {scanResult.summaryNutrition.totalProteinG}g)
                    </p>
                  </div>

                  {/* Lipid L */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900">Béo (Lipid - L)</span>
                      <span className="font-black text-amber-700">
                        {scanResult.summaryNutrition.lipidRatioPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2.5 rounded-full"
                        style={{ width: `${Math.min(scanResult.summaryNutrition.lipidRatioPercent * 2.5, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Chuẩn: {scanResult.standardReference.minFatPercent}% -{' '}
                      {scanResult.standardReference.maxFatPercent}% (Thực tế:{' '}
                      {scanResult.summaryNutrition.totalLipidG}g)
                    </p>
                  </div>

                  {/* Glucid G */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900">Bột Đường (Glucid - G)</span>
                      <span className="font-black text-emerald-700">
                        {scanResult.summaryNutrition.glucidRatioPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(scanResult.summaryNutrition.glucidRatioPercent * 1.5, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Chuẩn: {scanResult.standardReference.minCarbPercent}% -{' '}
                      {scanResult.standardReference.maxCarbPercent}% (Thực tế:{' '}
                      {scanResult.summaryNutrition.totalGlucidG}g)
                    </p>
                  </div>
                </div>
              </div>

              {/* Danh sách các vi phạm / Cảnh báo chi tiết */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <span>Chi Tiết Xung Đột Dị Ứng & Cảnh Báo Dinh Dưỡng</span>
                  </div>
                  <span className="text-xs text-slate-400 font-normal">
                    {scanResult.violations.length} mục cần can thiệp
                  </span>
                </h3>

                <div className="space-y-3">
                  {scanResult.violations.map((violation, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex items-start gap-4 transition ${
                        violation.severity === 'CRITICAL'
                          ? 'border-red-200 bg-red-50/60'
                          : violation.severity === 'WARNING'
                          ? 'border-amber-200 bg-amber-50/60'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          violation.severity === 'CRITICAL'
                            ? 'bg-red-500 text-white'
                            : violation.severity === 'WARNING'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-400 text-white'
                        }`}
                      >
                        {violation.category === 'ALLERGEN' ? (
                          <HeartPulse className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{violation.title}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              violation.severity === 'CRITICAL'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {violation.severity === 'CRITICAL' ? 'NGUY HIỂM' : 'CẢNH BÁO'}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{violation.message}</p>
                        <div className="mt-2 text-slate-800 font-semibold bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-teal-700">Khuyến nghị giải quyết: </span>
                          {violation.recommendation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Khung Khuyến Nghị Hành Động (Actionable Recommendations) */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Kế Hoạch Khắc Phục Đề Xuất Cho Bếp & Ban Giám Hiệu</span>
                </h3>
                <ul className="space-y-2 text-xs text-emerald-900 font-medium">
                  {scanResult.actionableRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RIGHT SLIDE-OVER DRAWER (TIÊU CHUẨN DINH DƯỠNG)                         */}
      {/* ========================================================================= */}
      <NutritionRuleDrawer
        isOpen={isRuleDrawerOpen}
        rule={editingRule}
        isLoading={isLoading}
        onClose={() => setIsRuleDrawerOpen(false)}
        onSubmit={handleRuleSubmit}
      />

      {/* ========================================================================= */}
      {/* 5. RIGHT SLIDE-OVER DRAWER (DANH MỤC DỊ ỨNG)                               */}
      {/* ========================================================================= */}
      <AllergenDrawer
        isOpen={isAllergenDrawerOpen}
        allergen={editingAllergen}
        isLoading={isLoading}
        onClose={() => setIsAllergenDrawerOpen(false)}
        onSubmit={handleAllergenSubmit}
      />

      {/* ========================================================================= */}
      {/* 6. MODAL ĐỒNG BỘ QUY CHUẨN QUỐC GIA (VN-RDA 2024 & THÔNG TƯ 28)           */}
      {/* ========================================================================= */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <CloudDownload className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      Cổng Dữ Liệu Quốc Gia
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                      VN-RDA 2024.1
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Đồng Bộ Quy Chuẩn Dinh Dưỡng Mầm Non Quốc Gia
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cập nhật và đối soát số liệu từ Viện Dinh Dưỡng Quốc Gia (NIN) & Thông tư 28/2016/TT-BGDĐT (sửa đổi TT 51/2020).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                disabled={isSyncing}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Information Alert Box */}
            <div className="bg-gradient-to-r from-teal-50/70 via-emerald-50/50 to-slate-50 p-4 rounded-2xl border border-teal-200/80 space-y-2">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Nguồn Dữ Liệu Chính Thức Đã Thẩm Định Pháp Lý & Y Tế:</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 pl-6 list-disc">
                <li>
                  <strong className="text-slate-800">Thông tư 28/2016/TT-BGDĐT</strong> & <strong>Thông tư 51/2020/TT-BGDĐT</strong> — Bộ Giáo dục & Đào tạo.
                </li>
                <li>
                  <strong className="text-slate-800">Bảng Nhu cầu Dinh dưỡng Khuyến nghị (VN-RDA 2024)</strong> — Viện Dinh Dưỡng Quốc Gia, Bộ Y tế.
                </li>
                <li>
                  Hệ thống Rule Engine sẽ tự động áp dụng 4 bộ định mức này để quét kiểm tra khẩu phần ăn bán trú và cả ngày.
                </li>
              </ul>
            </div>

            {/* Standards Diff Preview Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Chi Tiết 4 Quy Chuẩn Sẽ Được Cập Nhật Vào Database:</span>
                <span className="text-[11px] text-teal-600 font-semibold normal-case">Tự động ghi đè & kích hoạt</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Mẫu giáo - Bán trú */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2 hover:border-teal-400 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">Mẫu giáo (3-6 tuổi)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                      Bán trú (50-60%)
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Năng lượng:</span>
                      <strong className="text-slate-900">615 - 726 Kcal</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cơ cấu P : L : G:</span>
                      <strong className="text-teal-700">13-20% : 25-35% : 52-60%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Canxi / Tỷ lệ Ca:P:</span>
                      <strong className="text-slate-900">≥ 180 mg • Ca:P 1 - 1.5</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vi chất & Muối:</span>
                      <span className="text-slate-700 text-[11px]">Sắt ≥ 2.5mg • Muối &lt; 350mg</span>
                    </div>
                  </div>
                </div>

                {/* 2. Mẫu giáo - Cả ngày */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2 hover:border-emerald-400 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">Mẫu giáo (3-6 tuổi)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Cả ngày (100%)
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Năng lượng:</span>
                      <strong className="text-slate-900">1230 - 1320 Kcal</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cơ cấu P : L : G:</span>
                      <strong className="text-emerald-700">13-20% : 25-35% : 52-60%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Canxi / Tỷ lệ Ca:P:</span>
                      <strong className="text-slate-900">≥ 350 mg • Ca:P 1 - 1.5</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vi chất & Muối:</span>
                      <span className="text-slate-700 text-[11px]">Sắt ≥ 4.5mg • Muối &lt; 600mg</span>
                    </div>
                  </div>
                </div>

                {/* 3. Nhà trẻ - Bán trú */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2 hover:border-amber-400 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">Nhà trẻ (12-36 tháng)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Bán trú (50-60%)
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Năng lượng:</span>
                      <strong className="text-slate-900">600 - 735 Kcal</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cơ cấu P : L : G:</span>
                      <strong className="text-amber-700">13-20% : 30-40% : 47-57%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Canxi / Tỷ lệ Ca:P:</span>
                      <strong className="text-slate-900">≥ 150 mg • Ca:P 1 - 1.5</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vi chất & Muối:</span>
                      <span className="text-slate-700 text-[11px]">Sắt ≥ 2.2mg • Muối &lt; 300mg</span>
                    </div>
                  </div>
                </div>

                {/* 4. Nhà trẻ - Cả ngày */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2 hover:border-indigo-400 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">Nhà trẻ (12-36 tháng)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      Cả ngày (100%)
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Năng lượng:</span>
                      <strong className="text-slate-900">1000 - 1100 Kcal</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cơ cấu P : L : G:</span>
                      <strong className="text-indigo-700">13-20% : 30-40% : 47-57%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Canxi / Tỷ lệ Ca:P:</span>
                      <strong className="text-slate-900">≥ 300 mg • Ca:P 1 - 1.5</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vi chất & Muối:</span>
                      <span className="text-slate-700 text-[11px]">Sắt ≥ 4.0mg • Muối &lt; 500mg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                disabled={isSyncing}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSyncRda}
                disabled={isSyncing}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-teal-600/30 transition active:scale-98 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang Đồng Bộ Vào Database...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Xác Nhận Đồng Bộ & Lưu Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

