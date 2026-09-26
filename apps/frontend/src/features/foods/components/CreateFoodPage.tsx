import React, { useState } from 'react';
import { apiClient } from '@/core/api/axios';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  Image as ImageIcon,
  UploadCloud,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CreateFoodPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAllergyMonitored, setIsAllergyMonitored] = useState(true);

  const [formData, setFormData] = useState({
    code: `NL-2025-AUTO${Math.floor(Math.random() * 9000) + 1000}`,
    name: '',
    category: 'MEAT_POULTRY',
    defaultUnit: 'gram',
    supplier: '', // UI only
    description: '', // UI only
    energyKcal: 0,
    proteinG: 0,
    fatG: 0,
    carbG: 0,
    calciumMg: 0,
    ironMg: 0,
    zincMg: 0,
    allergens: [] as string[],
    imageUrl: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const ALLERGEN_OPTIONS = [
    'Sữa & Chế phẩm sữa bò',
    'Trứng gia cầm (Lòng trắng, đỏ)',
    'Đậu phộng (Lạc) & Dầu lạc',
    'Hải sản giáp xác (tôm, cua, mực)',
    'Gluten (Bột mì, lúa mạch)',
    'Đậu nành & Chế phẩm đậu tương',
    'Hạt cây (óc chó, hạnh nhân)',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['energyKcal', 'proteinG', 'fatG', 'carbG', 'calciumMg', 'ironMg', 'zincMg'].includes(name) 
        ? Number(value) 
        : value
    }));
  };

  const toggleAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    
    try {
      setUploadingImage(true);
      const res = await apiClient.post('/foods/upload', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Tải ảnh lên thất bại!');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        defaultUnit: formData.defaultUnit,
        energyKcal: formData.energyKcal,
        proteinG: formData.proteinG,
        fatG: formData.fatG,
        carbG: formData.carbG,
        calciumMg: formData.calciumMg,
        ironMg: formData.ironMg,
        zincMg: formData.zincMg,
        allergens: isAllergyMonitored ? formData.allergens : [],
        imageUrl: formData.imageUrl,
        supplier: formData.supplier,
        description: formData.description,
        status: 'ACTIVE',
      };
      await apiClient.post('/foods', payload);
      navigate('/ingredients');
    } catch (error) {
      console.error('Error creating food:', error);
      alert('Có lỗi xảy ra khi tạo nguyên liệu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => navigate('/ingredients')}
             className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition"
           >
             <ArrowLeft className="w-5 h-5 text-slate-600" />
           </button>
           <div>
              <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                 <span>Trang chủ</span> / <span>Quản lý nguyên liệu</span> / <span className="font-medium text-slate-700">Thêm mới nguyên liệu</span>
              </div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 Thêm mới nguyên liệu thực phẩm
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                 Khai báo định lượng dinh dưỡng và ghi nhận rủi ro dị ứng học đường phục vụ xây dựng thực đơn mầm non chuẩn Viện Dinh Dưỡng.
              </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => navigate('/ingredients')}
             className="px-4 py-2 border border-slate-200 bg-white text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition"
           >
              Quay lại danh sách
           </button>
           <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
             <ShieldCheck className="w-3.5 h-3.5" /> Quy chuẩn VN-RDA 2024
           </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8 px-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden border-t-4 border-t-emerald-500 p-8 space-y-10 relative">
          
          {/* 01 Thông tin cơ bản */}
          <section>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center">01</div>
                <div>
                   <h2 className="text-lg font-bold text-slate-800">Thông tin cơ bản</h2>
                   <p className="text-xs text-slate-500">Định danh chuẩn lý và phân nhóm thực phẩm theo chuẩn quản lý bếp ăn bán trú</p>
                </div>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                Mã tham chiếu: <span className="font-bold text-blue-600">{formData.code}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tên nguyên liệu thực phẩm *</label>
                <div className="relative">
                   <input 
                     required
                     type="text"
                     name="name"
                     value={formData.name}
                     onChange={handleInputChange}
                     placeholder="Ví dụ: Thịt nạc dăm heo tươi"
                     className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-sm font-medium text-slate-800"
                   />
                   <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Nhập tên gọi thông dụng chuẩn theo bảm kiểm thực 3 bước.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nhóm thực phẩm *</label>
                <select 
                  required
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-medium text-slate-800"
                >
                  <option value="MEAT_POULTRY">Nhóm giàu chất đạm (Thịt, cá, trứng, đậu đỗ)</option>
                  <option value="SEAFOOD">Thủy hải sản</option>
                  <option value="EGGS">Trứng</option>
                  <option value="DAIRY">Sữa & Chế phẩm</option>
                  <option value="CEREAL_GRAINS">Ngũ cốc & Tinh bột</option>
                  <option value="VEGETABLES">Rau củ</option>
                  <option value="FRUITS">Trái cây</option>
                  <option value="FATS_OILS">Chất béo & Dầu</option>
                  <option value="NUTS_SEEDS">Hạt & Đậu</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1.5">Dùng để phân bổ tỷ lệ cơ cấu bữa ăn theo quy định dinh dưỡng.</p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Đơn vị tính chuẩn *</label>
                <select 
                  required
                  name="defaultUnit"
                  value={formData.defaultUnit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-medium text-slate-800"
                >
                  <option value="gram">Gam (g) - Khuyến nghị cho chế biến</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="ml">Millilit (ml)</option>
                  <option value="l">Lit (l)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1.5">Đơn vị chuẩn hóa để chiết xuất định lượng.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nguồn cung cấp / Tiêu chuẩn an toàn</label>
                <input 
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  placeholder="VietGAP - Hợp tác xã thực phẩm sạch Hà Nội"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-medium text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">Lưu vết chứng từ phục vụ thanh tra vệ sinh an toàn thực phẩm (Chi cục ATVSTP).</p>
              </div>
              
              <div className="col-span-2">
                 <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả & Quy cách tiếp nhận thực phẩm tươi sống</label>
                 <textarea 
                   name="description"
                   value={formData.description}
                   onChange={handleInputChange}
                   rows={3}
                   placeholder="Thịt nạc dăm heo tươi mềm dẻo, có dính các vân mỡ mỏng không khô xơ khi xào hoặc nấu canh cho trẻ mẫu giáo. Giao hàng lúc 6h30 sáng hằng ngày kèm hóa đơn nguồn gốc."
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-medium text-slate-800 resize-none"
                 />
              </div>

              {/* Hình ảnh */}
              <div className="col-span-2">
                 <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                   Hình ảnh thực tế <span className="text-xs font-normal text-slate-400">(Tùy chọn)</span>
                 </label>
                 
                 {formData.imageUrl ? (
                   <div className="relative inline-block border border-slate-200 rounded-xl p-2 bg-slate-50">
                     <img src={`http://localhost:3000${formData.imageUrl}`} alt="Food preview" className="h-32 object-contain rounded-lg" />
                     <button 
                       type="button" 
                       onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                       className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-200 text-slate-400 hover:text-red-500 transition"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 ) : (
                   <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center hover:bg-slate-100 transition relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploadingImage}
                      />
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 mb-3 text-slate-500">
                        {uploadingImage ? (
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-600 mb-1">{uploadingImage ? 'Đang tải ảnh lên...' : 'Nhấp hoặc kéo thả ảnh vào đây'}</p>
                      <p className="text-xs text-slate-400">Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB)</p>
                   </div>
                 )}
              </div>
            </div>
          </section>

          {/* 02 Giá trị dinh dưỡng */}
          <section>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center">02</div>
                <div>
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     Giá trị dinh dưỡng trên 100g ăn được 
                     <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded uppercase border border-green-200">Edible Portion</span>
                   </h2>
                   <p className="text-xs text-slate-500">Căn cứ theo Bảng thành phần thực phẩm Việt Nam (Viện Dinh Dưỡng Quốc gia ban hành)</p>
                </div>
              </div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                 <ShieldCheck className="w-4 h-4" /> Tự động cân bằng tỷ lệ P : L : C
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-4">
               {/* Năng lượng */}
               <div className="bg-[#fff9ea] rounded-xl p-4 border border-[#fdebb4]">
                  <div className="text-xs font-bold text-[#b58013] mb-2">NĂNG LƯỢNG</div>
                  <div className="relative">
                    <input 
                      type="number"
                      name="energyKcal"
                      value={formData.energyKcal || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white px-3 py-2 text-xl font-black text-slate-800 rounded-lg border border-[#fce392] outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#d2a33f]">kcal</span>
                  </div>
                  <div className="text-[10px] text-[#b58013]/70 mt-2 flex justify-between">
                     <span>Khuyến nghị trẻ 3-5:</span>
                     <span className="font-bold">600-750 kcal/ngày</span>
                  </div>
               </div>
               
               {/* Protein */}
               <div className="bg-[#f0f7ff] rounded-xl p-4 border border-[#cbe1ff]">
                  <div className="text-xs font-bold text-[#2a68c0] mb-2 flex justify-between">
                     PROTEIN / ĐẠM
                     <span className="bg-blue-100 p-0.5 rounded"><ShieldCheck className="w-3 h-3 text-blue-600" /></span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number"
                      name="proteinG"
                      step="0.1"
                      value={formData.proteinG || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white px-3 py-2 text-xl font-black text-slate-800 rounded-lg border border-[#a2c8ff] outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6297e5]">g</span>
                  </div>
                  <div className="text-[10px] text-[#2a68c0]/70 mt-2 flex justify-between">
                     <span>Tỷ lệ cơ cấu chuẩn:</span>
                     <span className="font-bold">13-20%</span>
                  </div>
               </div>
               
               {/* Lipid */}
               <div className="bg-[#fff0f3] rounded-xl p-4 border border-[#ffcfd8]">
                  <div className="text-xs font-bold text-[#c93051] mb-2 flex justify-between">
                     LIPID / CHẤT BÉO
                     <span className="bg-pink-100 p-0.5 rounded"><AlertTriangle className="w-3 h-3 text-pink-600" /></span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number"
                      name="fatG"
                      step="0.1"
                      value={formData.fatG || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white px-3 py-2 text-xl font-black text-slate-800 rounded-lg border border-[#ffb2c1] outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#e16983]">g</span>
                  </div>
                  <div className="text-[10px] text-[#c93051]/70 mt-2 flex justify-between">
                     <span>Tỷ lệ cơ cấu chuẩn:</span>
                     <span className="font-bold">25-35%</span>
                  </div>
               </div>
               
               {/* Carb */}
               <div className="bg-[#f2fcf7] rounded-xl p-4 border border-[#c4ebd6]">
                  <div className="text-xs font-bold text-[#1e814a] mb-2 flex justify-between">
                     CARBOHYDRATE / TINH BỘT
                     <span className="bg-emerald-100 p-0.5 rounded"><ShieldCheck className="w-3 h-3 text-emerald-600" /></span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number"
                      name="carbG"
                      step="0.1"
                      value={formData.carbG || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white px-3 py-2 text-xl font-black text-slate-800 rounded-lg border border-[#9fdcb9] outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#44ad73]">g</span>
                  </div>
                  <div className="text-[10px] text-[#1e814a]/70 mt-2 flex justify-between">
                     <span>Tỷ lệ cơ cấu chuẩn:</span>
                     <span className="font-bold">50-60%</span>
                  </div>
               </div>
            </div>
            
            {/* Vi chất */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between">
               <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Vi chất khoáng bổ trợ <span className="text-xs text-slate-400 font-normal">(Tùy chọn nhập):</span>
               </div>
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-slate-500">Canxi (Ca):</span>
                     <div className="relative w-20">
                       <input 
                         type="number" step="0.1" name="calciumMg" value={formData.calciumMg || ''} onChange={handleInputChange}
                         className="w-full bg-white px-2 py-1 text-sm font-bold text-slate-800 rounded border border-slate-200 outline-none text-right pr-6" 
                       />
                       <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">mg</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-slate-500">Sắt (Fe):</span>
                     <div className="relative w-20">
                       <input 
                         type="number" step="0.1" name="ironMg" value={formData.ironMg || ''} onChange={handleInputChange}
                         className="w-full bg-white px-2 py-1 text-sm font-bold text-slate-800 rounded border border-slate-200 outline-none text-right pr-6" 
                       />
                       <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">mg</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-slate-500">Kẽm (Zn):</span>
                     <div className="relative w-20">
                       <input 
                         type="number" step="0.1" name="zincMg" value={formData.zincMg || ''} onChange={handleInputChange}
                         className="w-full bg-white px-2 py-1 text-sm font-bold text-slate-800 rounded border border-slate-200 outline-none text-right pr-6" 
                       />
                       <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">mg</span>
                     </div>
                  </div>
               </div>
            </div>
          </section>

          {/* 03 Thông tin rủi ro dị ứng */}
          <section>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center">03</div>
                <div>
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     Thông tin rủi ro dị ứng học đường <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">!</span>
                   </h2>
                   <p className="text-xs text-slate-500">Khai báo nhóm dị nguyên để hệ thống tự động khóa món ăn khi lên thực đơn cho trẻ có mẫn cảm</p>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${isAllergyMonitored ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex gap-3 items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAllergyMonitored ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                     <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className={`font-bold ${isAllergyMonitored ? 'text-red-700' : 'text-slate-700'}`}>Có nguy cơ gây phản ứng dị ứng cho trẻ</h3>
                     <p className={`text-xs ${isAllergyMonitored ? 'text-red-600/80' : 'text-slate-500'}`}>Kích hoạt cơ chế rà soát tiền sử bệnh lý tự động từ hồ sơ y tế học sinh NutriEngine.</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${isAllergyMonitored ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {isAllergyMonitored ? 'Đang kích hoạt giám sát xung đột thực đơn' : 'Không giám sát dị ứng'}
                  </span>
                  {/* Custom Toggle */}
                  <div 
                    onClick={() => setIsAllergyMonitored(!isAllergyMonitored)}
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${isAllergyMonitored ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isAllergyMonitored ? 'left-7' : 'left-1'}`} />
                  </div>
               </div>
            </div>
            
            {isAllergyMonitored && (
              <div className="mt-6 border border-slate-100 rounded-xl p-6 bg-white shadow-sm">
                 <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                   Chọn các nhóm dị nguyên có trong nguyên liệu này: 
                   <span className="text-xs font-normal text-slate-400 italic">Nhấp chọn / Bỏ chọn trực tiếp</span>
                 </p>
                 <div className="flex flex-wrap gap-2">
                    {ALLERGEN_OPTIONS.map((allergen) => {
                       const isSelected = formData.allergens.includes(allergen);
                       return (
                         <button
                           key={allergen}
                           type="button"
                           onClick={() => toggleAllergen(allergen)}
                           className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                             isSelected 
                              ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                           }`}
                         >
                           {isSelected && <span className="text-red-500 text-[10px]">✓</span>}
                           {allergen}
                         </button>
                       );
                    })}
                 </div>
                 <p className="text-xs text-blue-500 mt-4 flex items-center gap-1.5">
                   <Info className="w-3.5 h-3.5" /> Hệ thống NutriEngine sẽ tự động kích hoạt cảnh báo đỏ khi món ăn chứa nguyên liệu này xuất hiện trong thực đơn của học sinh có khai báo hồ sơ dị ứng tương ứng.
                 </p>
              </div>
            )}
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mt-6 flex gap-3">
               <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
               <div>
                  <h4 className="font-bold text-blue-900 text-sm">NutriKid chỉ quản lý thông tin dinh dưỡng, không quản lý tồn kho nguyên liệu.</h4>
                  <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                    Dữ liệu khai báo tại biểu mẫu này phục vụ tính toán định lượng calo, cân đối tỷ lệ P:L:C, giám sát vi chất và rà soát dị nguyên cho học sinh toàn trường. Các nghiệp vụ xuất nhập kho, kiểm kê tài chính thực phẩm được xử lý trên hệ thống Kế toán Bán trú liên kết.
                  </p>
               </div>
            </div>
          </section>

          {/* Footer actions */}
          <div className="border-t border-slate-200 pt-6 mt-8 flex items-center justify-between">
             <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
               <ShieldCheck className="w-3 h-3" />
               Dữ liệu khai báo được bảo vệ và lưu trữ theo tiêu chuẩn bảo mật y tế học đường.
             </div>
             <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => navigate('/ingredients')}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
                >
                  Hủy thao tác
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Lưu nguyên liệu
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};
