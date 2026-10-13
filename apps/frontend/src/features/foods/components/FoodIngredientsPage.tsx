import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiClient } from '@/core/api/axios';
import { useAuthStore } from '@/core/stores/auth.store';
import {
  Search,
  Plus,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  PenSquare,
  Layers,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Trash2,
  Apple,
  Clock,
  Sparkles,
  Flame,
  Lock,
} from 'lucide-react';
import { FoodModal } from './FoodModal';

interface Food {
  id: string;
  code: string;
  name: string;
  category: string;
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  calciumMg?: number;
  ironMg?: number;
  zincMg?: number;
  defaultUnit?: string;
  allergens?: string[];
  imageUrl?: string;
  status?: string;
  updatedAt?: string;
}

interface Stats {
  totalIngredients: number;
  allergenCount: number;
  categoryCount: number;
  updatedThisWeekCount: number;
}

export const FoodIngredientsPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isPrincipalOrManagement = roles.includes('SCHOOL_MANAGEMENT') || roles.includes('SCHOOL_MANAGER') || roles.includes('PRINCIPAL');
  const isNutritionist = roles.includes('NUTRITIONIST');
  // Khi ở phân hệ Ban Giám Hiệu (/inventory) hoặc tài khoản BGH, chỉ được xem không được thêm/sửa/xóa
  const isReadOnly = location.pathname.startsWith('/inventory') || (isPrincipalOrManagement && !isNutritionist);

  const [foods, setFoods] = useState<Food[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [allergenFilter, setAllergenFilter] = useState('');
  const [nutritionFilter, setNutritionFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [total, setTotal] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/foods', {
        params: {
          search: searchTerm || undefined,
          category: categoryFilter || undefined,
          allergen: allergenFilter || undefined,
          page,
          limit,
        },
      });
      const rawItems = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const normalizedFoods = rawItems.map((f: any) => ({
        ...f,
        id: String(f.id),
        code: f.code || `NL-${f.id}`,
        name: f.name || 'Nguyên liệu',
        category: typeof f.category === 'object' && f.category !== null ? (f.category.name || f.category.code || 'Khác') : (f.categoryName || f.category || 'Khác'),
        energyKcal: Number(f.energyKcal ?? f.energyKcal100g ?? 0),
        proteinG: Number(f.proteinG ?? 0),
        fatG: Number(f.fatG ?? 0),
        carbG: Number(f.carbG ?? 0),
        defaultUnit: f.unit || f.defaultUnit || 'g',
        allergens: Array.isArray(f.allergens)
          ? f.allergens.map((a: any) => typeof a === 'object' && a !== null ? (a.name || a.allergenName || String(a.id)) : String(a))
          : [],
      }));
      setFoods(normalizedFoods);
      setTotal(res.data?.total || normalizedFoods.length);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/foods/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [page, limit, searchTerm, categoryFilter, allergenFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setAllergenFilter('');
    setNutritionFilter('');
    setPage(1);
  };

  const handleDeleteFood = async (food: Food) => {
    if (window.confirm(`Bạn có chắc muốn xóa nguyên liệu "${food.name}" khỏi danh mục?`)) {
      try {
        await apiClient.delete(`/foods/${food.id}`);
        await fetchFoods();
        await fetchStats();
      } catch (err: any) {
        alert('Không thể xóa nguyên liệu: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const getCategoryBadge = (category: any) => {
    const code = (typeof category === 'object' && category !== null ? (category.code || category.name) : category) || '';
    const name = (typeof category === 'object' && category !== null ? (category.name || category.code) : category) || '';
    const str = `${code} ${name}`.toUpperCase();

    if (str.includes('MEAT') || str.includes('THỊT')) {
      return <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Thịt & Gia cầm</span>;
    }
    if (str.includes('SEAFOOD') || str.includes('THỦY HẢI SẢN') || str.includes('HẢI SẢN') || str.includes('CÁ') || str.includes('TÔM')) {
      return <span className="bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Thủy hải sản</span>;
    }
    if (str.includes('EGG') || str.includes('TRỨNG')) {
      return <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Trứng</span>;
    }
    if (str.includes('DAIRY') || str.includes('SỮA')) {
      return <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Sữa & Chế phẩm</span>;
    }
    if (str.includes('CEREAL') || str.includes('GRAIN') || str.includes('NGŨ CỐC') || str.includes('GẠO')) {
      return <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Ngũ cốc & Gạo</span>;
    }
    if (str.includes('FAT') || str.includes('OIL') || str.includes('DẦU') || str.includes('MỠ')) {
      return <span className="bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Dầu & Chất béo</span>;
    }
    if (str.includes('NUT') || str.includes('SEED') || str.includes('HẠT') || str.includes('ĐẬU')) {
      return <span className="bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Hạt & Đậu đỗ</span>;
    }
    if (str.includes('VEGETABLE') || str.includes('RAU')) {
      return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Rau củ tươi</span>;
    }
    if (str.includes('FRUIT') || str.includes('TRÁI CÂY') || str.includes('QUẢ')) {
      return <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Trái cây</span>;
    }
    if (str.includes('SPICE') || str.includes('CONDIMENT') || str.includes('GIA VỊ')) {
      return <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Gia vị mầm non</span>;
    }
    if (str.includes('BEVERAGE') || str.includes('DRINK') || str.includes('ĐỒ UỐNG') || str.includes('NƯỚC')) {
      return <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold">Đồ uống</span>;
    }
    return <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-[10px] font-bold">{String(name || code || 'Khác')}</span>;
  };

  const getFoodEmoji = (category: any) => {
    const code = (typeof category === 'object' && category !== null ? (category.code || category.name) : category) || '';
    const name = (typeof category === 'object' && category !== null ? (category.name || category.code) : category) || '';
    const str = `${code} ${name}`.toUpperCase();

    if (str.includes('MEAT') || str.includes('THỊT')) return '🥩';
    if (str.includes('DAIRY') || str.includes('SỮA')) return '🥛';
    if (str.includes('SEAFOOD') || str.includes('HẢI SẢN') || str.includes('CÁ') || str.includes('TÔM')) return '🦐';
    if (str.includes('CEREAL') || str.includes('NGŨ CỐC') || str.includes('GẠO')) return '🍚';
    if (str.includes('EGG') || str.includes('TRỨNG')) return '🥚';
    if (str.includes('NUT') || str.includes('HẠT') || str.includes('ĐẬU')) return '🥜';
    if (str.includes('VEGETABLE') || str.includes('RAU')) return '🥬';
    if (str.includes('FRUIT') || str.includes('TRÁI CÂY') || str.includes('QUẢ')) return '🍎';
    if (str.includes('FAT') || str.includes('OIL') || str.includes('DẦU') || str.includes('MỠ')) return '🧈';
    if (str.includes('BEVERAGE') || str.includes('ĐỒ UỐNG')) return '🧃';
    return '🍲';
  };

  // Optional local nutrition filter
  const displayedFoods = foods.filter((f) => {
    if (nutritionFilter === 'HIGH_PROTEIN') return Number(f.proteinG) >= 15;
    if (nutritionFilter === 'HIGH_CARB') return Number(f.carbG) >= 40;
    if (nutritionFilter === 'HIGH_CALORIES') return Number(f.energyKcal) >= 250;
    return true;
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="bg-slate-50/70 min-h-screen pb-12 font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Danh Mục Nguyên Liệu Thực Phẩm
              </h1>
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase">
                Dinh dưỡng Mầm non
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Chuẩn VN-RDA 2024 (Viện Dinh Dưỡng Quốc Gia)
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed max-w-3xl">
              Tra cứu giá trị năng lượng Kcal, Đạm, Béo, Đường và vi chất trên 100g ăn được; giám sát dị nguyên và quản lý định mức công thức chế biến.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {isReadOnly ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Quyền Ban Giám Hiệu: Giám sát kho & dinh dưỡng (Chỉ xem)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedFoodId(null);
                  setModalMode('create');
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm nguyên liệu mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 mt-6 max-w-7xl mx-auto space-y-6">
        {/* Stats KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng nguyên liệu */}
          <div className="bg-emerald-50/60 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                Tổng nguyên liệu kho
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center shadow-2xs">
                <Apple className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-3xl font-black text-slate-900">{stats?.totalIngredients || total}</span>
              <span className="text-xs font-bold text-slate-500 ml-1.5">thực phẩm</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Đang lưu hành trong kho định mức
            </p>
          </div>

          {/* Card 2: Dị nguyên */}
          <div className="bg-rose-50/60 bg-gradient-to-br from-rose-50 via-amber-50/40 to-white rounded-2xl p-5 border border-rose-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-rose-800 text-[11px] font-black uppercase tracking-wider">
                Có cảnh báo dị ứng
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-700 flex items-center justify-center shadow-2xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-3xl font-black text-slate-900">{stats?.allergenCount || 0}</span>
              <span className="text-xs font-bold text-slate-500 ml-1.5">loại dị nguyên</span>
            </div>
            <p className="text-[11px] text-rose-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Cần rà soát dị ứng học sinh khi lên thực đơn
            </p>
          </div>

          {/* Card 3: Nhóm thực phẩm */}
          <div className="bg-blue-50/60 bg-gradient-to-br from-blue-50 via-sky-50/40 to-white rounded-2xl p-5 border border-blue-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 text-[11px] font-black uppercase tracking-wider">
                Phân loại nhóm thực phẩm
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-700 flex items-center justify-center shadow-2xs">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-3xl font-black text-slate-900">{stats?.categoryCount || 12}</span>
              <span className="text-xs font-bold text-slate-500 ml-1.5">nhóm dinh dưỡng</span>
            </div>
            <p className="text-[11px] text-blue-700 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Theo danh mục Viện Dinh Dưỡng Quốc Gia
            </p>
          </div>

          {/* Card 4: Kiểm định */}
          <div className="bg-purple-50/60 bg-gradient-to-br from-purple-50 via-indigo-50/30 to-white rounded-2xl p-5 border border-purple-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-purple-800 text-[11px] font-black uppercase tracking-wider">
                Kiểm định chất lượng
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-700 flex items-center justify-center shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-3xl font-black text-slate-900">{stats?.updatedThisWeekCount || total}</span>
              <span className="text-xs font-bold text-slate-500 ml-1.5">đã chuẩn hóa</span>
            </div>
            <p className="text-[11px] text-purple-700 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Đạt chuẩn 3 bước an toàn vệ sinh dịch tễ
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nguyên liệu theo tên hoặc mã (thịt heo, gạo tẻ, cá hồi, sữa bò, bí đỏ...)"
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/60"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Nhóm thực phẩm */}
              <div>
                <select
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả các nhóm (12 nhóm)</option>
                  <option value="MEAT_POULTRY">Thịt & Gia cầm</option>
                  <option value="SEAFOOD">Thủy hải sản</option>
                  <option value="EGGS">Trứng các loại</option>
                  <option value="DAIRY">Sữa & Chế phẩm sữa</option>
                  <option value="CEREAL_GRAINS">Ngũ cốc & Tinh bột</option>
                  <option value="VEGETABLES">Rau củ tươi</option>
                  <option value="FRUITS">Trái cây tươi</option>
                  <option value="NUTS_SEEDS">Hạt & Đậu đỗ</option>
                  <option value="FATS_OILS">Dầu & Chất béo</option>
                  <option value="SPICES_CONDIMENTS">Gia vị mầm non</option>
                  <option value="BEVERAGES">Đồ uống dinh dưỡng</option>
                </select>
              </div>

              {/* Cảnh báo dị ứng */}
              <div>
                <select
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={allergenFilter}
                  onChange={(e) => {
                    setAllergenFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả trạng thái dị ứng</option>
                  <option value="SAFE">An toàn (Không có dị nguyên)</option>
                  <option value="WARNING">Có nguy cơ dị ứng</option>
                </select>
              </div>

              {/* Tiêu chí nổi bật */}
              <div>
                <select
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={nutritionFilter}
                  onChange={(e) => setNutritionFilter(e.target.value)}
                >
                  <option value="">Tất cả chỉ số dinh dưỡng</option>
                  <option value="HIGH_PROTEIN">Giàu Đạm (P ≥ 15g)</option>
                  <option value="HIGH_CARB">Giàu Tinh bột (G ≥ 40g)</option>
                  <option value="HIGH_CALORIES">Năng lượng cao (≥ 250 kcal)</option>
                </select>
              </div>
            </div>

            {/* Clear button */}
            {(searchTerm || categoryFilter || allergenFilter || nutritionFilter) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition whitespace-nowrap self-end md:self-auto cursor-pointer"
              >
                ⟳ Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Ingredients Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2 font-black text-slate-800 text-xs sm:text-sm">
              <ListOrdered className="w-4 h-4 text-emerald-600" />
              <span>Bảng Thành Phần Dinh Dưỡng Thực Phẩm (Tính trên 100g ăn được)</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Hệ quy chiếu: Bảng thành phần thực phẩm Việt Nam (Bộ Y Tế / Viện Dinh Dưỡng)
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-4 min-w-[200px]">Tên nguyên liệu</th>
                  <th className="py-3 px-3 text-center">Phân nhóm</th>
                  <th className="py-3 px-3 text-center">Năng lượng</th>
                  <th className="py-3 px-3 text-center">Đạm (P)</th>
                  <th className="py-3 px-3 text-center">Béo (L)</th>
                  <th className="py-3 px-3 text-center">Carb (G)</th>
                  <th className="py-3 px-4 text-center">Kiểm soát dị nguyên</th>
                  <th className="py-3 px-3 text-center">Đơn vị</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                      <span>Đang tải danh mục nguyên liệu...</span>
                    </td>
                  </tr>
                ) : displayedFoods.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-500">
                      <Apple className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">Không tìm thấy nguyên liệu nào phù hợp.</p>
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="mt-2 text-xs text-emerald-600 hover:underline font-bold"
                      >
                        Bấm vào đây để xóa bộ lọc
                      </button>
                    </td>
                  </tr>
                ) : (
                  displayedFoods.map((food, idx) => {
                    const stt = (page - 1) * limit + idx + 1;
                    const hasAllergens = food.allergens && food.allergens.length > 0;

                    return (
                      <tr key={food.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-center text-slate-400 font-bold">{stt}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                              {getFoodEmoji(food.category)}
                            </div>
                            <div className="truncate max-w-[240px]">
                              <p className="font-black text-slate-900 text-xs truncate" title={food.name}>
                                {food.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                                Mã: {food.code}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {getCategoryBadge(food.category)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-black text-emerald-800 text-xs">
                          {Number(food.energyKcal).toFixed(1)}{' '}
                          <span className="text-[10px] font-normal text-slate-400">kcal</span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-700">
                          {Number(food.proteinG).toFixed(1)}g
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-700">
                          {Number(food.fatG).toFixed(1)}g
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-700">
                          {Number(food.carbG).toFixed(1)}g
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {hasAllergens ? (
                            <span
                              className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                              title={food.allergens?.map((a: any) => typeof a === 'object' && a !== null ? a.name : String(a)).join(', ')}
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                              {typeof food.allergens?.[0] === 'object' && food.allergens[0] !== null ? (food.allergens[0] as any)?.name : String(food.allergens?.[0] || 'Dị ứng')}
                              {food.allergens && food.allergens.length > 1 ? ` (+${food.allergens.length - 1})` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                              An toàn
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-slate-500 font-semibold text-[11px]">
                          {food.defaultUnit || 'gram'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFoodId(food.id);
                                setModalMode('view');
                                setIsModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Xem chi tiết</span>
                            </button>
                            {!isReadOnly && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedFoodId(food.id);
                                    setModalMode('edit');
                                    setIsModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                                  title="Chỉnh sửa"
                                >
                                  <PenSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFood(food)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Xóa nguyên liệu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

          {/* Pagination Bar */}
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs">
            <div className="text-slate-500 font-medium">
              Hiển thị <strong className="text-slate-800">{Math.min((page - 1) * limit + 1, total)}</strong> -{' '}
              <strong className="text-slate-800">{Math.min(page * limit, total)}</strong> trong tổng số{' '}
              <strong className="text-slate-900">{total}</strong> nguyên liệu
            </div>

            <div className="flex items-center gap-3">
              {/* Limit selector */}
              <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                <span>Số dòng/trang:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value={8}>8 dòng</option>
                  <option value={12}>12 dòng</option>
                  <option value={24}>24 dòng</option>
                  <option value={48}>48 dòng</option>
                </select>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-bold text-slate-800 text-xs">
                  Trang {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FoodModal
        isOpen={isModalOpen}
        mode={isReadOnly ? 'view' : modalMode}
        foodId={selectedFoodId}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchFoods();
          fetchStats();
        }}
      />
    </div>
  );
};
