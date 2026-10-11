import React, { useState } from 'react';
import { useClasses } from '../hooks/useClasses';
import { ClassFilters } from '../types';
import { 
  Search, Plus, Download, SlidersHorizontal, RotateCw, 
  Building, Contact, ShieldCheck, Eye, Edit, AlertCircle, Utensils,
  CheckCircle2, Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClassList = () => {
  const [filters, setFilters] = useState<ClassFilters>({
    page: 1,
    limit: 10,
    search: '',
    gradeLevel: '',
    status: '',
  });

  const { data, isLoading, isError, refetch } = useClasses(filters);
  const classItems = Array.isArray(data) ? data : (data?.items || []);

  const handleFilterChange = (key: keyof ClassFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({ page: 1, limit: 10, search: '', gradeLevel: '', status: '' });
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 font-medium">
            <Building2 className="w-4 h-4" />
            <span>Bán trú KidMeal</span>
            <span className="text-slate-300">/</span>
            <span className="text-emerald-600">Quản lý lớp học</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-3">
            Quản trị Lớp <br /> học & Điểm <br /> danh Suất ăn
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Theo dõi chỉ số sĩ số, độ tuổi, định mức suất ăn bán trú và giáo viên chủ nhiệm / bảo mẫu phụ trách các khối mầm non năm học 2024 - 2025.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-full shadow-sm hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Xuất danh sách Excel
          </button>
          <Link
            to="/classes/create"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-full shadow-lg shadow-emerald-500/30 active:scale-95 transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Tạo lớp mới
          </Link>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số lớp học</span>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-black text-slate-800">18</span>
            <span className="text-lg font-bold text-slate-500">lớp</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>3 Nhà trẻ • 5 Mầm • 5 Chồi • 5 Lá</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">+2 lớp mới</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Học sinh bán trú</span>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
              <Contact className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-5xl font-black text-slate-800">485</span>
            <span className="text-lg font-bold text-slate-400">/ 510</span>
          </div>
          <div className="mt-auto">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden mr-3">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95.1%' }}></div>
              </div>
              <span className="text-emerald-600">95.1%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chuẩn an toàn bán trú</span>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-black text-emerald-500">18/18</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>100% đạt kiểm thực 3 bước</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Định biên giáo viên</span>
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center">
              <Contact className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-black text-slate-800">54</span>
            <span className="text-lg font-bold text-slate-500">NV</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>36 GVCN • 18 Bảo mẫu</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Đủ biên chế</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/50 backdrop-blur-sm p-3 rounded-full border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên lớp, mã lớp hoặc tên giáo viên..."
            className="w-full pl-11 pr-4 py-3 bg-slate-100/50 border-none rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="px-5 py-3 bg-slate-100/50 border-none rounded-full text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
            value={filters.gradeLevel}
            onChange={(e) => handleFilterChange('gradeLevel', e.target.value)}
          >
            <option value="">Tất cả độ tuổi</option>
            <option value="INFANT_0_1Y">Nhà trẻ (0-1 tuổi)</option>
            <option value="TODDLER_1_2Y">Nhà trẻ (1-2 tuổi)</option>
            <option value="TODDLER_2_3Y">Nhà trẻ (2-3 tuổi)</option>
            <option value="KINDERGARTEN_3_4Y">Mầm (3-4 tuổi)</option>
            <option value="KINDERGARTEN_4_5Y">Chồi (4-5 tuổi)</option>
            <option value="KINDERGARTEN_5_6Y">Lá (5-6 tuổi)</option>
          </select>
          <select
            className="px-5 py-3 bg-slate-100/50 border-none rounded-full text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
          <button className="w-11 h-11 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button onClick={resetFilters} className="w-11 h-11 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium">Đang tải dữ liệu lớp học...</p>
          </div>
        ) : isError ? (
          <div className="p-20 text-center text-red-500 font-medium bg-red-50">Có lỗi xảy ra khi tải dữ liệu!</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-5 pl-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Tên lớp & Mã lớp</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Độ tuổi / Khối</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Sĩ số & Bán trú</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Trạng thái</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Phụ trách (GVCN / Bảo mẫu)</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Đặc thù suất ăn</th>
                <th className="p-5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {classItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                      <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Không tìm thấy lớp học</h3>
                    <p className="text-slate-500 text-sm">Hãy thử điều chỉnh lại bộ lọc tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                classItems.map((item: any, index: number) => {
                  const isMushroom = index % 2 === 0;
                  const isChhoi = item.gradeLevel?.includes('4_5Y');
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-5 pl-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${isMushroom ? 'bg-blue-100' : 'bg-amber-100'}`}>
                            {isMushroom ? '🐰' : '🐿️'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-base mb-0.5">{item.name}</h4>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                              <span>Mã: <strong className="text-slate-700">{item.id ? item.id.substring(0, 4).toUpperCase() : 'LOP'}24</strong></span>
                              <span>• {item.roomNumber || 'Chưa xếp phòng'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isChhoi ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {isChhoi ? 'Chồi (4 - 5 tuổi)' : 'Mầm (3 - 4 tuổi)'}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-800">28 / 30 <span className="text-xs font-bold text-slate-500 font-medium">bé</span></span>
                            <span className="text-[10px] font-bold text-emerald-600">93%</span>
                          </div>
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '93%' }}></div>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-slate-500">
                            <Utensils className="w-3 h-3 text-emerald-600" />
                            <span>28/28 suất trưa</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${item.status === 'ACTIVE' ? 'bg-emerald-200/50 text-emerald-700' : 'bg-amber-200/50 text-amber-700'}`}>
                          {item.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã đủ sĩ số'}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">
                              <img src={`https://ui-avatars.com/api/?name=${item.mainTeacher?.fullName || 'GV'}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 leading-tight">
                              {item.mainTeacher?.fullName || 'Chưa phân công'} <br />
                              <span className="text-[10px] text-emerald-600 font-semibold">(GVCN - Ext 101)</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">
                              <img src={`https://ui-avatars.com/api/?name=Bao+Mau&background=random`} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-sm font-semibold text-slate-600 leading-tight">
                              Cô Ngọc Tuyết <br />
                              <span className="text-[10px] text-slate-400 font-medium">(Bảo mẫu)</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        {isMushroom ? (
                          <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="leading-tight">3 trẻ dị ứng đạm <br />sữa bò & tôm</span>
                          </div>
                        ) : (
                          <div className="bg-slate-100 text-slate-500 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-400" />
                            <span>Không có <br/> dị ứng</span>
                          </div>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/classes/${item.id}`} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link to={`/classes/${item.id}/edit`} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition">
                            <Edit className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
