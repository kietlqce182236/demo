import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/core/api/axios';
import {
  Search,
  Filter,
  Printer,
  Plus,
  Ring,
  AlertTriangle,
  Layers,
  Clock,
  RefreshCw,
  Eye,
  PenSquare,
  ShieldCheck,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ListOrdered
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
  allergens?: string[];
  imageUrl?: string;
  status?: string;
  updatedAt: string;
}

interface Stats {
  totalIngredients: number;
  allergenCount: number;
  categoryCount: number;
  updatedThisWeekCount: number;
}

export const FoodIngredientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState<Food[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [allergenFilter, setAllergenFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
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
          search: searchTerm,
          category: categoryFilter,
          allergen: allergenFilter,
          page,
          limit,
        },
      });
      setFoods(res.data.items);
      setTotal(res.data.total);
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
  }, [page, searchTerm, categoryFilter, allergenFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // reset to page 1 on search
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'MEAT_POULTRY':
      case 'SEAFOOD':
      case 'EGGS':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Giàu đạm</span>;
      case 'DAIRY':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Sữa & Chế phẩm</span>;
      case 'CEREAL_GRAINS':
        return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">Giàu tinh bột</span>;
      case 'FATS_OILS':
      case 'NUTS_SEEDS':
        return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Giàu béo</span>;
      case 'VEGETABLES':
      case 'FRUITS':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Rau củ quả</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{category || 'Chưa phân loại'}</span>;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">Danh mục nguyên liệu thực phẩm</h1>
              <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Dinh dưỡng Mầm non
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Tra cứu giá trị dinh dưỡng trên 100g ăn được, giám sát dị nguyên và quản lý định mức công thức chế biến chuẩn lứa tuổi mẫu giáo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Chuẩn VN-RDA 2024
              <span className="text-xs text-slate-400 block ml-1">Viện Dinh Dưỡng Quốc Gia</span>
            </div>
            <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              <FileSpreadsheet className="w-4 h-4" /> Xuất file Excel/PDF
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 mt-6">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nguyên liệu (ví dụ: thịt heo, sữa bò, bí đỏ, hạt sen...)"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              <Filter className="w-4 h-4" /> Bộ lọc nâng cao
            </button>
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              <Printer className="w-4 h-4" /> In danh mục
            </button>
            <button 
              onClick={() => {
                navigate('/ingredients/create');
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm nguyên liệu
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 text-emerald-100">
              <RefreshCw className="w-20 h-20 opacity-20 transform rotate-12" />
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Tổng nguyên liệu kho</p>
            <h3 className="text-3xl font-black text-slate-800 my-1">{stats?.totalIngredients || 0}</h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2">
              <ShieldCheck className="w-3 h-3" /> {stats?.totalIngredients || 0} nguyên liệu đang lưu hành
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-red-50 text-red-500 px-2 py-1 rounded font-bold text-xs">
              20.4%
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Có cảnh báo dị ứng</p>
            <h3 className="text-3xl font-black text-slate-800 my-1">{stats?.allergenCount || 0}</h3>
            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-2">
              <AlertTriangle className="w-3 h-3" /> Cần rà soát khi lên thực đơn
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-4 right-4 bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold text-[10px]">
              VN-RDA
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Phân loại nhóm thực phẩm</p>
            <h3 className="text-3xl font-black text-slate-800 my-1">{stats?.categoryCount || 0} <span className="text-lg font-bold text-slate-400">nhóm</span></h3>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-2">
              <Layers className="w-3 h-3" /> Theo phân loại Viện Dinh Dưỡng
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-4 right-4 text-indigo-100">
                <Clock className="w-20 h-20 opacity-20 transform -rotate-12" />
             </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Cập nhật kiểm định</p>
            <h3 className="text-3xl font-black text-slate-800 my-1">{stats?.updatedThisWeekCount || 0}</h3>
            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-2">
              <RefreshCw className="w-3 h-3" /> Nguyên liệu mới cập nhật tuần này
            </p>
          </div>
        </div>

        {/* Filters Box */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-end gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nhóm thực phẩm</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả các nhóm ({stats?.categoryCount || 8})</option>
              <option value="MEAT_POULTRY">Thịt & Gia cầm</option>
              <option value="SEAFOOD">Thủy hải sản</option>
              <option value="EGGS">Trứng</option>
              <option value="DAIRY">Sữa & Chế phẩm</option>
              <option value="CEREAL_GRAINS">Ngũ cốc & Tinh bột</option>
              <option value="VEGETABLES">Rau củ</option>
              <option value="FRUITS">Trái cây</option>
              <option value="FATS_OILS">Chất béo & Dầu</option>
              <option value="NUTS_SEEDS">Hạt & Đậu</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Dinh dưỡng nổi bật</label>
             <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none">
                <option>Tất cả chỉ số</option>
                <option>Giàu Protein</option>
                <option>Giàu Canxi</option>
                <option>Giàu Chất Xơ</option>
             </select>
          </div>
          <div className="flex-1">
             <label className="block text-xs font-medium text-slate-500 mb-1">Cảnh báo dị ứng</label>
             <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                value={allergenFilter}
                onChange={(e) => {
                  setAllergenFilter(e.target.value);
                  setPage(1);
                }}
             >
                <option value="">Tất cả trạng thái dị nguyên</option>
                <option value="WARNING">Có nguy cơ</option>
                <option value="SAFE">An toàn</option>
             </select>
          </div>
          <div className="flex-1">
             <label className="block text-xs font-medium text-slate-500 mb-1">Trạng thái lưu hành</label>
             <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none">
                <option>Đang sử dụng thực đơn</option>
                <option>Tạm ngưng</option>
             </select>
          </div>
          <button 
            onClick={() => {
              setCategoryFilter('');
              setAllergenFilter('');
              setSearchTerm('');
              setPage(1);
            }}
            className="text-slate-500 text-sm font-medium px-4 py-2 hover:bg-slate-100 rounded-lg transition whitespace-nowrap"
          >
            ⟳ Xóa bộ lọc
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <ListOrdered className="w-4 h-4 text-emerald-600" />
              Danh sách thành phần định mức (100g ăn được)
            </div>
            <div className="text-xs text-slate-500">
              Hệ quy chiếu: Bảng thành phần thực phẩm Việt Nam (Bộ Y Tế)
            </div>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Tên nguyên liệu</th>
                  <th className="px-3 py-3 text-center">Nhóm</th>
                  <th className="px-3 py-3 text-center">Năng lượng</th>
                  <th className="px-3 py-3 text-center">Đạm (P)</th>
                  <th className="px-3 py-3 text-center">Béo (L)</th>
                  <th className="px-3 py-3 text-center">Carb (C)</th>
                  <th className="px-4 py-3 text-center">Dị ứng</th>
                  <th className="px-3 py-3 text-center">Trạng thái</th>
                  <th className="px-3 py-3 text-center">Ngày cập nhật</th>
                  <th className="px-3 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : foods.length === 0 ? (
                   <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-500">
                      Không tìm thấy nguyên liệu nào phù hợp.
                    </td>
                  </tr>
                ) : foods.map((food) => (
                  <tr key={food.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex items-center gap-3">
                        {food.imageUrl ? (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={`http://localhost:3000${food.imageUrl}`} alt={food.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                             {/* Placeholder emoji based on category */}
                             {food.category === 'MEAT_POULTRY' ? '🥩' :
                              food.category === 'DAIRY' ? '🥛' :
                              food.category === 'SEAFOOD' ? '🦐' :
                              food.category === 'CEREAL_GRAINS' ? '🍚' :
                              food.category === 'EGGS' ? '🥚' :
                              food.category === 'NUTS_SEEDS' ? '🥜' :
                              food.category === 'VEGETABLES' ? '🥬' :
                              food.category === 'FRUITS' ? '🍎' : '🍲'}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-slate-800 truncate" title={food.name}>{food.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            Mã: {food.code} | 100g
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {getCategoryBadge(food.category)}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="font-black text-slate-800 text-base">{Number(food.energyKcal).toString()}</span>
                      <span className="text-[10px] text-slate-500 ml-1">kcal</span>
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-slate-600 whitespace-nowrap">
                      {Number(food.proteinG).toFixed(1)}<span className="text-[10px] text-slate-400">g</span>
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-slate-600 whitespace-nowrap">
                      {Number(food.fatG).toFixed(1)}<span className="text-[10px] text-slate-400">g</span>
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-slate-600 whitespace-nowrap">
                      {Number(food.carbG).toFixed(1)}<span className="text-[10px] text-slate-400">g</span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {food.allergens && food.allergens.length > 0 ? (
                        <div className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {food.allergens[0]} {food.allergens.length > 1 ? `(+${food.allergens.length - 1})` : ''}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          An toàn
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        (!food.status || food.status === 'ACTIVE') 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {(!food.status || food.status === 'ACTIVE') ? 'Đang sử dụng' : 'Ngưng sử dụng'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                       <p className="text-[11px] font-medium text-slate-700">
                         {food.updatedAt ? new Date(food.updatedAt).toLocaleDateString('en-GB') : 'N/A'}
                       </p>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => {
                            setSelectedFoodId(food.id);
                            setModalMode('view');
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedFoodId(food.id);
                            setModalMode('edit');
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Chỉnh sửa"
                        >
                          <PenSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white text-sm">
             <div className="text-slate-500">
                Hiển thị {Math.min((page - 1) * limit + 1, total)} - {Math.min(page * limit, total)} trong tổng số {total} nguyên liệu
             </div>
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-slate-600">
                 Hiển thị: 
                 <select className="bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none text-xs">
                   <option>8 dòng/trang</option>
                 </select>
               </div>
               <div className="flex items-center gap-1">
                 <button 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-50"
                 >
                   <ChevronLeft className="w-4 h-4" />
                 </button>
                 {[...Array(Math.ceil(total / limit))].map((_, i) => {
                   const p = i + 1;
                   if (p === 1 || p === Math.ceil(total / limit) || (p >= page - 1 && p <= page + 1)) {
                     return (
                        <button 
                          key={p} 
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-colors ${page === p ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          {p}
                        </button>
                     );
                   }
                   if (p === page - 2 || p === page + 2) {
                     return <span key={p} className="text-slate-400">...</span>;
                   }
                   return null;
                 })}
                 <button 
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage(page + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-50"
                 >
                   <ChevronRight className="w-4 h-4" />
                 </button>
               </div>
             </div>
          </div>
        </div>
        
        {/* Footers / Tips */}
        <div className="grid grid-cols-3 gap-4 mt-6">
           <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <div className="mt-0.5">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 text-sm">Tỷ lệ năng lượng khuyến nghị</h4>
                <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                  Trẻ mẫu giáo (3-5 tuổi): Đạm 13-20% | Béo 25-35% | Bột đường 52-60% tổng năng lượng khẩu phần ngày.
                </p>
              </div>
           </div>
           
           <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 flex gap-3">
              <div className="mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-red-900 text-sm">Quy tắc loại trừ dị nguyên</h4>
                <p className="text-xs text-red-700/80 mt-1 leading-relaxed">
                  Hệ thống cảnh báo tự động khi thành phần có chứa chất dị nguyên (như đậu phộng, hải sản, v.v.).
                </p>
              </div>
           </div>
           
           <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex gap-3">
              <div className="mt-0.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">Kiểm định ba bước học đường</h4>
                <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
                  Nguyên liệu tuân thủ quy trình kiểm thực 3 bước và lưu mẫu 24h theo quy định của Bộ Y Tế.
                </p>
              </div>
           </div>
        </div>

      </div>

      <FoodModal 
        isOpen={isModalOpen}
        mode={modalMode}
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
