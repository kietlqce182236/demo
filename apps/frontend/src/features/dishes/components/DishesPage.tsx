import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/core/api/axios';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  PenSquare,
  Ban,
  UtensilsCrossed,
  Coffee,
  Layers
} from 'lucide-react';
import { DishModal } from './DishModal';

interface Dish {
  id: string;
  code: string;
  name: string;
  dishType: string;
  targetAgeGroup: string;
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbG: number;
  photoUrl?: string;
  isActive: boolean;
  recipeItems?: any[];
}

interface Stats {
  totalDishes: number;
  mainDishes: number;
  sideDishes: number;
  allergenDishesCount: number;
}

export const DishesPage: React.FC = () => {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dishTypeFilter, setDishTypeFilter] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('true');
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [total, setTotal] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/dishes', {
        params: {
          search: searchTerm,
          dishType: dishTypeFilter,
          targetAgeGroup: ageGroupFilter,
          isActive: statusFilter === '' ? undefined : statusFilter === 'true',
          page,
          limit,
        },
      });
      setDishes(res.data.items);
      setTotal(res.data.total);
      setStats(res.data.stats);
    } catch (error) {
      console.error('Error fetching dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, [page, searchTerm, dishTypeFilter, ageGroupFilter, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'MAIN_COURSE':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Món mặn</span>;
      case 'SOUP':
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Món canh</span>;
      case 'SIDE_VEGETABLE':
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Rau củ</span>;
      case 'RICE_STAPLE':
        return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">Cơm/Tinh bột</span>;
      case 'PORRIDGE_NOODLE':
        return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">Cháo/Bún/Phở</span>;
      case 'DESSERT':
        return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">Tráng miệng</span>;
      case 'SNACK_AFTERNOON':
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Bữa phụ xế</span>;
      case 'DRINK':
        return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">Thức uống</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{type || 'Khác'}</span>;
    }
  };

  const checkAllergens = (dish: Dish) => {
    if (!dish.recipeItems) return false;
    for (const ri of dish.recipeItems) {
      if (ri.food?.allergens && ri.food.allergens.length > 0) return true;
    }
    return false;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">Danh mục món ăn học đường</h1>
              <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-[10px] font-bold">Thực đơn mầm non</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Quản lý định lượng calo, thành phần dưỡng chất và kiểm soát rủi ro dị ứng học đường cho trẻ 24-72 tháng tuổi theo tiêu chuẩn vệ sinh dịch tễ.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> Chuẩn VN-RDA 2024 (Viện Dinh Dưỡng Quốc Gia)
            </div>
            <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              <FileSpreadsheet className="w-4 h-4" /> Xuất thực đơn/Excel
            </button>
            <button 
              onClick={() => {
                setSelectedDishId(null);
                setModalMode('create');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm món ăn
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 mt-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-3 absolute top-4 right-4 shadow-sm">
              <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">Tổng số món ăn</p>
            <h3 className="text-4xl font-black text-slate-800 my-1">{stats?.totalDishes || 0} <span className="text-sm font-normal text-slate-500">món</span></h3>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {stats?.totalDishes || 0} món đang được phục vụ tuần này
            </p>
          </div>

          <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100 shadow-sm relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-3 absolute top-4 right-4 shadow-sm">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-red-700 text-xs font-bold uppercase tracking-wider mb-1">Chứa dị nguyên học đường</p>
            <h3 className="text-4xl font-black text-slate-800 my-1">{stats?.allergenDishesCount || 0} <span className="text-sm font-normal text-slate-500">món</span></h3>
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> {stats?.totalDishes ? Math.round((stats.allergenDishesCount / stats.totalDishes) * 100) : 0}% tỷ trọng món có lưu ý cảnh báo
            </p>
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-3 absolute top-4 right-4 shadow-sm">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">Bữa chính trưa</p>
            <h3 className="text-4xl font-black text-slate-800 my-1">{stats?.mainDishes || 0} <span className="text-sm font-normal text-slate-500">món</span></h3>
            <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-2">
              <ShieldCheck className="w-3 h-3" /> Cân đối P:L:C chuẩn VN-RDA
            </p>
          </div>

          <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100 shadow-sm relative overflow-hidden">
             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-3 absolute top-4 right-4 shadow-sm">
              <Coffee className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">Bữa phụ & Xế</p>
            <h3 className="text-4xl font-black text-slate-800 my-1">{stats?.sideDishes || 0} <span className="text-sm font-normal text-slate-500">món</span></h3>
            <p className="text-[11px] text-purple-600 font-medium flex items-center gap-1 mt-2">
              <RefreshCw className="w-3 h-3" /> Dễ tiêu hóa, giàu canxi & vitamin
            </p>
          </div>
        </div>

        {/* Filters Box */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm món ăn (ví dụ: Cháo gà hạt sen, Súp bí đỏ...)"
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border-none focus:outline-none focus:ring-0 text-sm bg-transparent"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Bữa ăn:</span>
            <select
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none w-32"
              value={dishTypeFilter}
              onChange={(e) => { setDishTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">Tất cả các bữa</option>
              <option value="MAIN_COURSE">Món mặn (Bữa chính)</option>
              <option value="SOUP">Món canh</option>
              <option value="SIDE_VEGETABLE">Rau củ xào/luộc</option>
              <option value="RICE_STAPLE">Cơm / Tinh bột</option>
              <option value="PORRIDGE_NOODLE">Cháo / Bún / Phở</option>
              <option value="DESSERT">Tráng miệng / Trái cây</option>
              <option value="SNACK_AFTERNOON">Bữa phụ xế (Bánh/Sữa)</option>
              <option value="DRINK">Thức uống bổ sung</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Khối tuổi:</span>
             <select 
               className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none w-32"
               value={ageGroupFilter}
               onChange={(e) => { setAgeGroupFilter(e.target.value); setPage(1); }}
             >
                <option value="">Tất cả lứa tuổi</option>
                <option value="24-36">Nhà trẻ (24-36T)</option>
                <option value="3-6">Mẫu giáo (3-6T)</option>
             </select>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-medium text-slate-500">Trạng thái:</span>
             <select 
               className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none w-32"
               value={statusFilter}
               onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
             >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đang phục vụ</option>
                <option value="false">Tạm ngưng</option>
             </select>
          </div>
          <button 
            onClick={() => {
              setDishTypeFilter('');
              setAgeGroupFilter('');
              setStatusFilter('true');
              setSearchTerm('');
              setPage(1);
            }}
            className="text-slate-500 text-xs font-medium px-2 py-1.5 hover:bg-slate-100 rounded-lg transition whitespace-nowrap ml-2"
          >
            ⟳ Xóa bộ lọc
          </button>
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Đang tải dữ liệu...</div>
        ) : dishes.length === 0 ? (
          <div className="text-center py-20 text-slate-500">Không tìm thấy món ăn nào.</div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {dishes.map((dish) => {
              const hasAllergens = checkAllergens(dish);
              return (
                <div key={dish.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                  {/* Image */}
                  <div className="h-40 bg-slate-100 relative group overflow-hidden">
                    {dish.photoUrl ? (
                      <img src={`http://localhost:3000${dish.photoUrl}`} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <UtensilsCrossed className="w-10 h-10 mb-2" />
                        <span className="text-xs">Chưa có ảnh</span>
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2">
                      {getTypeBadge(dish.dishType)}
                    </div>
                    
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                      {dish.code || dish.id.substring(0,8).toUpperCase()}
                    </div>
                    
                    {!dish.isActive && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                        <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">Tạm ngưng</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 text-sm mb-1 truncate" title={dish.name}>{dish.name}</h3>
                    <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1 truncate">
                       <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Mẫu giáo {dish.targetAgeGroup || '3 - 6 tuổi'}
                    </p>
                    
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Năng lượng</span>
                          <span className="text-sm font-black text-slate-800">{Math.round(dish.totalCalories)} <span className="text-[10px] font-normal text-slate-500">kcal</span></span>
                       </div>
                       <div className="flex justify-between items-center text-[11px] text-slate-600">
                          <span>Đạm: <span className="font-bold">{Number(dish.totalProteinG || 0).toFixed(1)}g</span></span>
                          <span className="text-slate-300">•</span>
                          <span>Béo: <span className="font-bold">{Number(dish.totalFatG || 0).toFixed(1)}g</span></span>
                          <span className="text-slate-300">•</span>
                          <span>Bột: <span className="font-bold">{Number(dish.totalCarbG || 0).toFixed(1)}g</span></span>
                       </div>
                    </div>
                    
                    <div className="mb-4">
                       {hasAllergens ? (
                         <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 w-full truncate">
                           <AlertTriangle className="w-3 h-3 shrink-0" /> Có nguyên liệu lưu ý dị ứng
                         </span>
                       ) : (
                         <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 w-full">
                           <ShieldCheck className="w-3 h-3 shrink-0" /> An toàn (Không dị nguyên)
                         </span>
                       )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                       <button 
                         onClick={() => {
                           setSelectedDishId(dish.id);
                           setModalMode('view');
                           setIsModalOpen(true);
                         }}
                         className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition"
                       >
                         <Eye className="w-3.5 h-3.5" /> Chi tiết
                       </button>
                       <button 
                         onClick={() => {
                           setSelectedDishId(dish.id);
                           setModalMode('edit');
                           setIsModalOpen(true);
                         }}
                         className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition"
                       >
                         <PenSquare className="w-3.5 h-3.5" /> Sửa
                       </button>
                       {dish.isActive ? (
                         <button 
                           onClick={async () => {
                             if(confirm('Bạn có chắc muốn ngưng phục vụ món này?')) {
                               await apiClient.put(`/dishes/${dish.id}`, { isActive: false });
                               fetchDishes();
                             }
                           }}
                           className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 transition"
                         >
                           <Ban className="w-3.5 h-3.5" /> Dừng
                         </button>
                       ) : (
                         <button 
                           onClick={async () => {
                             await apiClient.put(`/dishes/${dish.id}`, { isActive: true });
                             fetchDishes();
                           }}
                           className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition"
                         >
                           Kích hoạt lại
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DishModal 
        isOpen={isModalOpen}
        mode={modalMode}
        dishId={selectedDishId}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchDishes();
        }}
      />
    </div>
  );
};
