import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api/axios';
import { X, Save, AlertTriangle, UploadCloud } from 'lucide-react';

interface FoodModalProps {
  isOpen: boolean;
  mode: 'create' | 'view' | 'edit';
  foodId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const FoodModal: React.FC<FoodModalProps> = ({
  isOpen,
  mode,
  foodId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    energyKcal: 0,
    proteinG: 0,
    fatG: 0,
    carbG: 0,
    calciumMg: 0,
    ironMg: 0,
    zincMg: 0,
    defaultUnit: 'gram',
    allergens: [] as string[],
    imageUrl: '',
    supplier: '',
    description: '',
    status: 'ACTIVE',
  });
  const [allergenInput, setAllergenInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        setFormData({
          code: '',
          name: '',
          category: 'MEAT_POULTRY',
          energyKcal: 0,
          proteinG: 0,
          fatG: 0,
          carbG: 0,
          calciumMg: 0,
          ironMg: 0,
          zincMg: 0,
          defaultUnit: 'gram',
          allergens: [],
          imageUrl: '',
          supplier: '',
          description: '',
          status: 'ACTIVE',
        });
        setAllergenInput('');
      } else if (foodId) {
        fetchFoodDetails(foodId);
      }
    }
  }, [isOpen, mode, foodId]);

  const fetchFoodDetails = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/foods/${id}`);
      setFormData({
        code: res.data.code,
        name: res.data.name,
        category: res.data.category,
        energyKcal: Number(res.data.energyKcal) || 0,
        proteinG: Number(res.data.proteinG) || 0,
        fatG: Number(res.data.fatG) || 0,
        carbG: Number(res.data.carbG) || 0,
        calciumMg: Number(res.data.calciumMg) || 0,
        ironMg: Number(res.data.ironMg) || 0,
        zincMg: Number(res.data.zincMg) || 0,
        defaultUnit: res.data.defaultUnit || 'gram',
        allergens: res.data.allergens || [],
        imageUrl: res.data.imageUrl || '',
        supplier: res.data.supplier || '',
        description: res.data.description || '',
        status: res.data.status || 'ACTIVE',
      });
      setAllergenInput(res.data.allergens?.join(', ') || '');
    } catch (error) {
      console.error('Error fetching food details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['energyKcal', 'proteinG', 'fatG', 'carbG', 'calciumMg', 'ironMg', 'zincMg'].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        allergens: allergenInput ? allergenInput.split(',').map((a) => a.trim()).filter(Boolean) : [],
        imageUrl: formData.imageUrl,
        supplier: formData.supplier,
        description: formData.description,
        status: formData.status,
      };

      if (mode === 'create') {
        await apiClient.post('/foods', payload);
      } else if (mode === 'edit' && foodId) {
        await apiClient.put(`/foods/${foodId}`, payload);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving food:', error);
      alert('Đã xảy ra lỗi khi lưu nguyên liệu!');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {mode === 'create' ? 'Thêm nguyên liệu mới' : mode === 'edit' ? 'Cập nhật nguyên liệu' : 'Chi tiết nguyên liệu'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && mode !== 'create' ? (
            <div className="flex justify-center items-center py-20 text-slate-500">Đang tải dữ liệu...</div>
          ) : (
            <form id="food-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã nguyên liệu *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    readOnly={isReadOnly}
                    value={formData.code}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-xl border ${isReadOnly ? 'bg-slate-100 border-transparent text-slate-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                    placeholder="VD: NL-HEO-012"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên nguyên liệu *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    readOnly={isReadOnly}
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-xl border ${isReadOnly ? 'bg-slate-100 border-transparent text-slate-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                    placeholder="VD: Thịt nạc dăm heo tươi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn cung cấp / NSX</label>
                  <input
                    type="text"
                    name="supplier"
                    readOnly={isReadOnly}
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-xl border ${isReadOnly ? 'bg-slate-100 border-transparent text-slate-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                    placeholder="VD: Cty Thực phẩm Vissan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái lưu hành</label>
                  <select
                    name="status"
                    disabled={isReadOnly}
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-xl border ${isReadOnly ? 'bg-slate-100 border-transparent text-slate-600 appearance-none' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                  >
                    <option value="ACTIVE">Đang sử dụng thực đơn</option>
                    <option value="INACTIVE">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm thực phẩm *</label>
                  <select
                    name="category"
                    required
                    disabled={isReadOnly}
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-xl border ${isReadOnly ? 'bg-slate-100 border-transparent text-slate-600 appearance-none' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                  >
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị tính *</label>
                  <select
                    name="defaultUnit"
                    required
                    disabled={isReadOnly}
                    value={formData.defaultUnit}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-xl border ${isReadOnly ? 'bg-slate-100 border-transparent text-slate-600 appearance-none' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                  >
                    <option value="gram">Gam (g) - Khuyến nghị</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="ml">Millilit (ml)</option>
                    <option value="l">Lít (l)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Thành phần dinh dưỡng chính (trên 100g ăn được)</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Năng lượng (kcal)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="energyKcal"
                      readOnly={isReadOnly}
                      value={formData.energyKcal}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-slate-200/50 border-transparent text-slate-600 font-bold' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Đạm (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="proteinG"
                      readOnly={isReadOnly}
                      value={formData.proteinG}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-slate-200/50 border-transparent text-slate-600 font-bold' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Béo (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="fatG"
                      readOnly={isReadOnly}
                      value={formData.fatG}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-slate-200/50 border-transparent text-slate-600 font-bold' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Carb (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="carbG"
                      readOnly={isReadOnly}
                      value={formData.carbG}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-slate-200/50 border-transparent text-slate-600 font-bold' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                    />
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-sm mb-4 mt-2">Vi chất khoáng bổ trợ</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Canxi (mg)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="calciumMg"
                      readOnly={isReadOnly}
                      value={formData.calciumMg}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-slate-200/50 border-transparent text-slate-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Sắt (mg)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="ironMg"
                      readOnly={isReadOnly}
                      value={formData.ironMg}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-slate-200/50 border-transparent text-slate-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Kẽm (mg)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="zincMg"
                      readOnly={isReadOnly}
                      value={formData.zincMg}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isReadOnly ? 'bg-slate-200/50 border-transparent text-slate-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Cảnh báo dị ứng (Phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  readOnly={isReadOnly}
                  value={allergenInput}
                  onChange={(e) => setAllergenInput(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border ${isReadOnly ? 'bg-slate-100 border-transparent text-slate-600' : 'border-slate-200 focus:ring-2 focus:ring-red-500'} outline-none`}
                  placeholder="VD: Sữa bò, Đậu phộng..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  Hình ảnh thực tế
                </label>
                {formData.imageUrl ? (
                   <div className="relative inline-block border border-slate-200 rounded-xl p-2 bg-slate-50 mt-1">
                     <img src={`http://localhost:3000${formData.imageUrl}`} alt="Food preview" className="h-24 object-contain rounded-lg" />
                     {!isReadOnly && (
                       <button 
                         type="button" 
                         onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                         className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-200 text-slate-400 hover:text-red-500 transition"
                       >
                         <X className="w-4 h-4" />
                       </button>
                     )}
                   </div>
                 ) : !isReadOnly ? (
                   <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center hover:bg-slate-100 transition relative mt-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={async (e) => {
                          if (!e.target.files || e.target.files.length === 0) return;
                          const file = e.target.files[0];
                          const formDataObj = new FormData();
                          formDataObj.append('file', file);
                          try {
                            setUploadingImage(true);
                            const res = await apiClient.post('/foods/upload', formDataObj, { headers: { 'Content-Type': 'multipart/form-data' } });
                            setFormData(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
                          } catch (error) {
                            alert('Tải ảnh lên thất bại!');
                          } finally {
                            setUploadingImage(false);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploadingImage}
                      />
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 mb-2 text-slate-500">
                        {uploadingImage ? (
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UploadCloud className="w-4 h-4" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-600 mb-0.5">{uploadingImage ? 'Đang tải ảnh lên...' : 'Tải ảnh lên'}</p>
                   </div>
                 ) : (
                   <p className="text-sm text-slate-400 italic">Không có hình ảnh</p>
                 )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mô tả quy cách / Yêu cầu thêm
                </label>
                <textarea
                  name="description"
                  readOnly={isReadOnly}
                  value={formData.description}
                  onChange={(e) => handleInputChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
                  rows={3}
                  className={`w-full px-4 py-2 rounded-xl border ${isReadOnly ? 'bg-slate-100 border-transparent text-slate-600' : 'border-slate-200 focus:ring-2 focus:ring-emerald-500'} outline-none resize-none`}
                  placeholder="VD: Thịt phải cắt miếng vừa ăn cho trẻ..."
                />
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Đóng
          </button>
          {!isReadOnly && (
            <button
              type="submit"
              form="food-form"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
