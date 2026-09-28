import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertTriangle, Plus, Trash2, UploadCloud, RefreshCw } from 'lucide-react';
import { apiClient } from '@/core/api/axios';

interface DishModalProps {
  isOpen: boolean;
  mode: 'create' | 'view' | 'edit';
  dishId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DishModal: React.FC<DishModalProps> = ({ isOpen, mode, dishId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [foods, setFoods] = useState<any[]>([]); // For ingredient search

  const [formData, setFormData] = useState({
    name: '',
    dishType: 'MAIN_COURSE',
    targetAgeGroup: 'KINDERGARTEN_3_5Y',
    photoUrl: '',
    cookingInstructions: '',
    presentationNotes: '',
    isActive: true,
    recipeItems: [] as any[],
  });

  const [nutritionTotals, setNutritionTotals] = useState({
    totalCalories: 0,
    totalProteinG: 0,
    totalFatG: 0,
    totalCarbG: 0,
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        setFormData({
          name: '',
          dishType: 'MAIN_COURSE',
          targetAgeGroup: 'KINDERGARTEN_3_5Y',
          photoUrl: '',
          cookingInstructions: '',
          presentationNotes: '',
          isActive: true,
          recipeItems: [],
        });
        setNutritionTotals({ totalCalories: 0, totalProteinG: 0, totalFatG: 0, totalCarbG: 0 });
      } else if (dishId) {
        fetchDish();
      }
      fetchFoods();
    }
  }, [isOpen, mode, dishId]);

  const fetchDish = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/dishes/${dishId}`);
      const data = res.data;
      setFormData({
        name: data.name,
        dishType: data.dishType || 'MAIN_COURSE',
        targetAgeGroup: data.targetAgeGroup || 'KINDERGARTEN_3_5Y',
        photoUrl: data.photoUrl || '',
        cookingInstructions: data.cookingInstructions || '',
        presentationNotes: data.presentationNotes || '',
        isActive: data.isActive,
        recipeItems: data.recipeItems || [],
      });
      setNutritionTotals({
        totalCalories: Number(data.totalCalories) || 0,
        totalProteinG: Number(data.totalProteinG) || 0,
        totalFatG: Number(data.totalFatG) || 0,
        totalCarbG: Number(data.totalCarbG) || 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoods = async () => {
    try {
      // Fetch some common foods for the dropdown (in real app, this should be searchable)
      const res = await apiClient.get('/foods', { params: { limit: 100 } });
      setFoods(res.data.items);
    } catch (error) {
      console.error(error);
    }
  };

  const calculateDynamicNutrition = (items: any[]) => {
    let calories = 0;
    let protein = 0;
    let fat = 0;
    let carb = 0;

    items.forEach(item => {
      const food = item.food || foods.find(f => f.id === item.foodId);
      if (food) {
        const ratio = (item.netWeightPerPortionG || 0) / 100;
        calories += (food.energyKcal || 0) * ratio;
        protein += (food.proteinG || 0) * ratio;
        fat += (food.fatG || 0) * ratio;
        carb += (food.carbG || 0) * ratio;
      }
    });

    setNutritionTotals({
      totalCalories: calories,
      totalProteinG: protein,
      totalFatG: fat,
      totalCarbG: carb,
    });
  };

  const handleRecipeItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.recipeItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If food changes, attach food object for calculation
    if (field === 'foodId') {
      updatedItems[index].food = foods.find(f => f.id === value);
    }

    setFormData(prev => ({ ...prev, recipeItems: updatedItems }));
    calculateDynamicNutrition(updatedItems);
  };

  const addRecipeItem = () => {
    setFormData(prev => ({
      ...prev,
      recipeItems: [...prev.recipeItems, { foodId: '', netWeightPerPortionG: 0, shrinkageRatio: 0 }]
    }));
  };

  const removeRecipeItem = (index: number) => {
    const updatedItems = formData.recipeItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, recipeItems: updatedItems }));
    calculateDynamicNutrition(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        recipeItems: formData.recipeItems.filter(ri => ri.foodId && ri.netWeightPerPortionG > 0).map(ri => ({
          foodId: ri.foodId,
          netWeightPerPortionG: Number(ri.netWeightPerPortionG),
          grossWeightPerPortionG: Number(ri.grossWeightPerPortionG || ri.netWeightPerPortionG),
          shrinkageRatio: Number(ri.shrinkageRatio || 0)
        }))
      };

      if (mode === 'edit' && dishId) {
        await apiClient.put(`/dishes/${dishId}`, payload);
      } else {
        await apiClient.post('/dishes', payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    
    try {
      setUploadingImage(true);
      const res = await apiClient.post('/dishes/upload', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, photoUrl: res.data.imageUrl }));
    } catch (error) {
      console.error(error);
      alert('Tải ảnh lên thất bại!');
    } finally {
      setUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="w-[800px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full inline-block mb-1">
              CHUẨN VN-RDA 2024
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {mode === 'view' ? 'Chi tiết món ăn' : mode === 'edit' ? 'Chỉnh sửa món ăn & Công thức' : 'Thêm mới món ăn'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
          {loading ? (
            <div className="text-center py-10">Đang tải...</div>
          ) : (
            <form id="dish-form" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Ảnh món ăn */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <label className="block text-sm font-bold text-slate-700 mb-3">Hình ảnh minh họa</label>
                {formData.photoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 h-48 w-full">
                    <img src={`http://localhost:3000${formData.photoUrl}`} alt="Dish" className="w-full h-full object-cover" />
                    {mode !== 'view' && (
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full shadow-sm hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : mode !== 'view' ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl h-48 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition relative">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploadingImage} />
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-600">{uploadingImage ? 'Đang tải...' : 'Tải ảnh món ăn lên'}</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl h-48 flex items-center justify-center bg-slate-50 text-slate-400">
                    Chưa có hình ảnh
                  </div>
                )}
              </div>

              {/* Thông tin cơ bản */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">01</div>
                  <h3 className="font-bold text-slate-800">Thông tin món ăn</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tên món ăn học đường *</label>
                    <input 
                      required disabled={mode === 'view'}
                      type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none text-sm font-medium"
                      placeholder="VD: Cháo thịt bò rau củ"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Loại bữa ăn</label>
                    <select 
                      disabled={mode === 'view'} value={formData.dishType} onChange={e => setFormData(prev => ({ ...prev, dishType: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                    >
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
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Khối tuổi áp dụng</label>
                    <select 
                      disabled={mode === 'view'} value={formData.targetAgeGroup} onChange={e => setFormData(prev => ({ ...prev, targetAgeGroup: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                    >
                      <option value="TODDLER_18_36M">Nhà trẻ (18 - 36 tháng)</option>
                      <option value="KINDERGARTEN_3_5Y">Mẫu giáo (3 - 5 tuổi)</option>
                      <option value="ALL_AGES">Toàn trường</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả cảm quan & dinh dưỡng</label>
                    <textarea 
                      disabled={mode === 'view'} value={formData.presentationNotes} onChange={e => setFormData(prev => ({ ...prev, presentationNotes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Chỉ số dinh dưỡng (Preview) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-4 right-5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Tự động tính toán
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">02</div>
                  <h3 className="font-bold text-slate-800">Tổng giá trị dinh dưỡng (1 suất ăn chuẩn)</h3>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-[#fff9ea] rounded-xl p-3 border border-[#fdebb4] text-center">
                    <div className="text-[10px] font-bold text-[#b58013] mb-1">NĂNG LƯỢNG</div>
                    <div className="text-xl font-black text-slate-800">{Math.round(nutritionTotals.totalCalories)}</div>
                    <div className="text-[10px] text-[#b58013]">kcal / suất</div>
                  </div>
                  <div className="bg-[#f0f7ff] rounded-xl p-3 border border-[#cbe1ff] text-center">
                    <div className="text-[10px] font-bold text-[#2a68c0] mb-1">ĐẠM / PROTEIN</div>
                    <div className="text-xl font-black text-slate-800">{nutritionTotals.totalProteinG.toFixed(1)}</div>
                    <div className="text-[10px] text-[#2a68c0]">gam ({nutritionTotals.totalCalories ? Math.round((nutritionTotals.totalProteinG * 4 / nutritionTotals.totalCalories) * 100) : 0}%)</div>
                  </div>
                  <div className="bg-[#fff0f3] rounded-xl p-3 border border-[#ffcfd8] text-center">
                    <div className="text-[10px] font-bold text-[#c93051] mb-1">BÉO / LIPID</div>
                    <div className="text-xl font-black text-slate-800">{nutritionTotals.totalFatG.toFixed(1)}</div>
                    <div className="text-[10px] text-[#c93051]">gam ({nutritionTotals.totalCalories ? Math.round((nutritionTotals.totalFatG * 9 / nutritionTotals.totalCalories) * 100) : 0}%)</div>
                  </div>
                  <div className="bg-[#f2fcf7] rounded-xl p-3 border border-[#c4ebd6] text-center">
                    <div className="text-[10px] font-bold text-[#1e814a] mb-1">BỘT / CARB</div>
                    <div className="text-xl font-black text-slate-800">{nutritionTotals.totalCarbG.toFixed(1)}</div>
                    <div className="text-[10px] text-[#1e814a]">gam ({nutritionTotals.totalCalories ? Math.round((nutritionTotals.totalCarbG * 4 / nutritionTotals.totalCalories) * 100) : 0}%)</div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-3 italic text-center">
                  * Định lượng tính trên 1 suất ăn chuẩn trẻ mẫu giáo theo tiêu chuẩn Viện Dinh Dưỡng Quốc Gia (Tỷ lệ P:L:C cân đối: 15-20% : 25-30% : 50-60%)
                </p>
              </div>

              {/* Công thức & Nguyên liệu */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">03</div>
                    <h3 className="font-bold text-slate-800">Công thức & Định lượng nguyên liệu</h3>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">{formData.recipeItems.length} nguyên liệu</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="px-3 py-2">Nguyên liệu</th>
                        <th className="px-3 py-2 text-center w-28">Định lượng (g)</th>
                        <th className="px-2 py-2 text-center">Kcal</th>
                        <th className="px-2 py-2 text-center">Protein</th>
                        <th className="px-2 py-2 text-center">Lipid</th>
                        <th className="px-2 py-2 text-center">Carb</th>
                        <th className="px-2 py-2 text-center">Dị ứng</th>
                        {mode !== 'view' && <th className="px-2 py-2 text-center w-10"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.recipeItems.map((item, idx) => {
                        const food = item.food || foods.find(f => f.id === item.foodId);
                        const ratio = (item.netWeightPerPortionG || 0) / 100;
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2">
                              {mode === 'view' ? (
                                <span className="font-bold text-slate-700">{food?.name || 'Nguyên liệu'}</span>
                              ) : (
                                <select 
                                  value={item.foodId} 
                                  onChange={e => handleRecipeItemChange(idx, 'foodId', e.target.value)}
                                  className="w-full bg-transparent border-b border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700 py-1"
                                >
                                  <option value="">-- Chọn --</option>
                                  {foods.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {mode === 'view' ? (
                                <span className="font-bold">{item.netWeightPerPortionG} g</span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="number" step="0.1" value={item.netWeightPerPortionG || ''} 
                                    onChange={e => handleRecipeItemChange(idx, 'netWeightPerPortionG', Number(e.target.value))}
                                    className="w-16 bg-slate-100 border border-slate-200 rounded px-1 py-1 text-center font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                  <span className="text-slate-400">g</span>
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center text-slate-500">{food ? Math.round(food.energyKcal * ratio) : '-'}</td>
                            <td className="px-2 py-2 text-center text-slate-500">{food ? (food.proteinG * ratio).toFixed(1) : '-'}</td>
                            <td className="px-2 py-2 text-center text-slate-500">{food ? (food.fatG * ratio).toFixed(1) : '-'}</td>
                            <td className="px-2 py-2 text-center text-slate-500">{food ? (food.carbG * ratio).toFixed(1) : '-'}</td>
                            <td className="px-2 py-2 text-center">
                               {food?.allergens?.length > 0 ? (
                                 <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1 py-0.5 rounded">Có</span>
                               ) : (
                                 <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 py-0.5 rounded">An toàn</span>
                               )}
                            </td>
                            {mode !== 'view' && (
                              <td className="px-2 py-2 text-center">
                                <button type="button" onClick={() => removeRecipeItem(idx)} className="text-slate-400 hover:text-red-500">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {formData.recipeItems.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-3 py-6 text-center text-slate-400 italic">
                            Chưa có nguyên liệu nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {mode !== 'view' && (
                    <button 
                      type="button" 
                      onClick={addRecipeItem}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-emerald-600 flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm nguyên liệu từ kho chuẩn
                    </button>
                  )}
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 px-6 py-4 bg-white flex justify-end gap-3">
          {mode === 'view' ? (
            <>
              <button onClick={onClose} className="px-6 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition">Đóng</button>
              {/* Note: User must change mode to 'edit' from the list, or we could add a button here */}
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition">Hủy bỏ</button>
              <button 
                type="submit" form="dish-form" disabled={saving}
                className="px-8 py-2 rounded-xl text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
