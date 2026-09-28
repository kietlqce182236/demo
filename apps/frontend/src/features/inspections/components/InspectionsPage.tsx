import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, CheckCircle, Clock, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { apiClient } from '@/core/api/axios';

export const InspectionsPage = () => {
  const [records, setRecords] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    mealDate: new Date().toISOString().split('T')[0],
    mealTime: 'Trưa chính (10:30)',
    step1Passed: true,
    step2Passed: true,
    step2KitchenPassed: true,
    step3Passed: true,
    step1Note: '',
    step2Note: '',
    step3Note: '',
    step1Photo: null as File | null,
    step2Photo: null as File | null,
    step3Photo: null as File | null,
  });
  
  const [dishes, setDishes] = useState([
    { id: '10000000-0000-0000-0000-000000000001', name: 'Thịt bò tươi phi lê', qty: '' },
    { id: '10000000-0000-0000-0000-000000000002', name: 'Rau cải ngọt & Cà rốt hữu cơ', qty: '' },
    { id: '10000000-0000-0000-0000-000000000003', name: 'Gạo tẻ thơm ST25', qty: '' },
  ]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await apiClient.get('/inspections/samples');
      const data = res.data;
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch records', error);
    }
  };

  const openNewModal = () => {
    setActiveRecordId(null);
    setCurrentStep(1);
    setForm({...form, step1Passed: true, step1Note: '', step1Photo: null});
    setIsModalVisible(true);
  };

  const openContinueStep = (record: any, step: number) => {
    setActiveRecordId(record.id);
    setCurrentStep(step);
    if (step === 2) setForm({...form, step2Passed: true, step2Note: '', step2Photo: null});
    if (step === 3) {
      setForm({...form, step3Passed: true, step3Note: '', step3Photo: null});
      setDishes(dishes.map(d => ({...d, qty: ''})));
    }
    setIsModalVisible(true);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleStep1Submit = async () => {
    try {
      let photoBase64 = undefined;
      if (form.step1Photo) {
        photoBase64 = await convertFileToBase64(form.step1Photo);
      }
      await apiClient.post('/inspections/step1', {
        mealDate: form.mealDate,
        mealTime: form.mealTime,
        note: form.step1Note,
        photoBase64
      });
      alert('Đã lưu dữ liệu Bước 1 thành công! Bạn có thể làm tiếp Bước 2 sau.');
      setIsModalVisible(false);
      fetchRecords();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStep2Submit = async () => {
    try {
      let photoBase64 = undefined;
      if (form.step2Photo) {
        photoBase64 = await convertFileToBase64(form.step2Photo);
      }
      await apiClient.patch(`/inspections/${activeRecordId}/step2`, {
        note: form.step2Note,
        photoBase64
      });
      alert('Đã lưu dữ liệu Bước 2 thành công! Bạn có thể làm tiếp Bước 3 sau.');
      setIsModalVisible(false);
      fetchRecords();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStep3Submit = async (e: any) => {
    e.preventDefault();
    try {
      let photoBase64 = undefined;
      if (form.step3Photo) {
        photoBase64 = await convertFileToBase64(form.step3Photo);
      }
      const payload = {
        note: form.step3Note,
        photoBase64,
        items: dishes.map(d => ({
          dishId: d.id,
          dishName: d.name,
          quantityGrams: Number(d.qty)
        }))
      };

      await apiClient.patch(`/inspections/${activeRecordId}/step3`, payload);
      alert('Đã lưu mẫu và hoàn tất toàn bộ Biên bản thành công!');
      setIsModalVisible(false);
      fetchRecords();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" /> Sổ Kiểm Thực Ba Bước Điện Tử
          </h2>
          <p className="text-sm text-slate-500 mt-1">Quy chuẩn Bộ Y Tế - QĐ 1246/QĐ-BYT • Niên khóa 2026 - 2027</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition">
            <FileText className="w-4 h-4" /> Xuất sổ (PDF/Excel)
          </button>
          <button 
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Lập biên bản kiểm thực mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full"><FileText className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Tổng biên bản</p><p className="text-2xl font-bold text-slate-800">{records.length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><CheckCircle className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Hoàn tất</p><p className="text-2xl font-bold text-slate-800">{records.filter((r: any) => r.status === 'Hoàn tất').length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-full"><Clock className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Chưa hoàn tất</p><p className="text-2xl font-bold text-slate-800">{records.filter((r: any) => r.status === 'Chưa hoàn tất').length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full"><AlertTriangle className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Có cảnh báo</p><p className="text-2xl font-bold text-slate-800">{records.filter((r: any) => r.status === 'Có cảnh báo').length}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="px-4 py-3">Mã biên bản</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Ca ăn</th>
              <th className="px-4 py-3">Người thực hiện</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-center w-32">Thao tác</th>
              <th className="px-4 py-3 text-center w-24">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record: any) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{record.code}</td>
                <td className="px-4 py-3">{record.mealDate}</td>
                <td className="px-4 py-3">{record.mealTime}</td>
                <td className="px-4 py-3">{record.performerName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    record.status === 'Hoàn tất' ? 'bg-emerald-100 text-emerald-700' :
                    record.status === 'Chưa hoàn tất' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {record.status === 'Hoàn tất' ? (
                    <span className="text-slate-400 italic text-xs">Đã xong</span>
                  ) : record.step2Status === 'Đạt chuẩn' ? (
                    <button onClick={() => openContinueStep(record, 3)} className="px-3 py-1 bg-amber-500 text-white rounded font-medium hover:bg-amber-600 shadow-sm text-xs w-full">Làm tiếp B.3</button>
                  ) : (
                    <button onClick={() => openContinueStep(record, 2)} className="px-3 py-1 bg-amber-500 text-white rounded font-medium hover:bg-amber-600 shadow-sm text-xs w-full">Làm tiếp B.2</button>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => navigate(`/inspections/${record.id}`)} className="text-blue-600 font-medium hover:underline whitespace-nowrap">Xem chi tiết</button>
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-500">Chưa có biên bản nào</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalVisible && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[95vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">Lập Biên Bản Kiểm Thực 3 Bước</h3>
              <button onClick={() => setIsModalVisible(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
            </div>
            
            {/* Wizard Progress */}
            <div className="flex bg-slate-50 border-b border-slate-200 px-6 py-3 gap-2 shrink-0">
               <div className={`flex-1 text-center text-xs font-bold py-1.5 rounded-full transition-colors ${currentStep === 1 ? 'bg-emerald-100 text-emerald-700' : currentStep > 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>Bước 1: Tiếp nhận</div>
               <div className={`flex-1 text-center text-xs font-bold py-1.5 rounded-full transition-colors ${currentStep === 2 ? 'bg-emerald-100 text-emerald-700' : currentStep > 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>Bước 2: Chế biến</div>
               <div className={`flex-1 text-center text-xs font-bold py-1.5 rounded-full transition-colors ${currentStep === 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>Bước 3: Lưu mẫu</div>
            </div>

            <form onSubmit={handleStep3Submit} className="p-6 overflow-y-auto">
              {currentStep === 1 && (
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày kiểm thực</label>
                    <input type="date" required value={form.mealDate} onChange={e => setForm({...form, mealDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Ca ăn</label>
                    <select required value={form.mealTime} onChange={e => setForm({...form, mealTime: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option value="Bữa sáng (07:15)">Bữa sáng (07:15)</option>
                      <option value="Trưa chính (10:30)">Trưa chính (10:30)</option>
                      <option value="Bữa xế chiều (14:30)">Bữa xế chiều (14:30)</option>
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                   <h4 className="font-semibold text-emerald-700 mb-3 border-b pb-2">BƯỚC 1: Giao nhận & Cảm quan nguyên liệu</h4>
                   
                   <div className="space-y-4 mb-6">
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Danh sách nguyên liệu (Từ thực đơn trưa nay)</p>
                        <ul className="text-sm text-slate-600 list-disc list-inside mb-3 space-y-1">
                          <li>Thịt bò tươi phi lê (3.5 kg)</li>
                          <li>Rau cải ngọt (2.0 kg)</li>
                          <li>Gạo tẻ thơm ST25 (10.0 kg)</li>
                        </ul>
                        <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-lg border border-emerald-200 shadow-sm">
                          <input type="checkbox" checked={form.step1Passed} onChange={e => setForm({...form, step1Passed: e.target.checked})} className="w-5 h-5 accent-emerald-600" />
                          <span className="font-bold text-emerald-700">Xác nhận: 100% Đạt / Tươi sống</span>
                        </label>
                     </div>

                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hình ảnh hóa đơn / Thực phẩm tươi</label>
                        {form.step1Photo ? (
                          <div className="relative mb-4 w-48 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <img src={URL.createObjectURL(form.step1Photo)} alt="Preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setForm({...form, step1Photo: null})} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-600">&times;</button>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-emerald-400 transition cursor-pointer mb-4">
                            <Plus className="w-8 h-8 mb-2 text-slate-400" />
                            <span className="text-sm font-medium">Bấm để tải ảnh lên (JPG, PNG)</span>
                            <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={e => e.target.files && setForm({...form, step1Photo: e.target.files[0]})} />
                          </label>
                        )}
                     </div>
                     
                     <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-2">Ghi chú thêm (Nếu có)</label>
                       <textarea 
                         rows={2} 
                         value={form.step1Note}
                         onChange={e => setForm({...form, step1Note: e.target.value})}
                         placeholder="VD: Thay thế rau cải bằng rau muống do nhà cung cấp hết hàng..." 
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                       ></textarea>
                     </div>
                   </div>

                   <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                     <button type="button" onClick={() => setIsModalVisible(false)} className="px-5 py-2 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Hủy</button>
                     <button type="button" onClick={handleStep1Submit} disabled={!form.step1Passed} className="px-5 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm flex items-center gap-2">Xác nhận Bước 1 (Lưu & Đóng) <CheckCircle className="w-4 h-4"/></button>
                   </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                   <h4 className="font-semibold text-emerald-700 mb-3 border-b pb-2">BƯỚC 2: Kiểm tra trong quá trình chế biến</h4>
                   
                   <div className="space-y-4 mb-6">
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-lg border border-emerald-200 shadow-sm">
                          <input type="checkbox" checked={form.step2Passed} onChange={e => setForm({...form, step2Passed: e.target.checked})} className="w-5 h-5 accent-emerald-600" />
                          <span className="font-bold text-emerald-700">Xác nhận: Vệ sinh dụng cụ đạt chuẩn</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-lg border border-emerald-200 shadow-sm">
                          <input type="checkbox" checked={form.step2KitchenPassed} onChange={e => setForm({...form, step2KitchenPassed: e.target.checked})} className="w-5 h-5 accent-emerald-600" />
                          <span className="font-bold text-emerald-700">Xác nhận: Khu vực chế biến gọn gàng, sạch sẽ</span>
                        </label>
                     </div>

                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hình ảnh khu vực bếp đang nấu</label>
                        {form.step2Photo ? (
                          <div className="relative mb-4 w-48 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <img src={URL.createObjectURL(form.step2Photo)} alt="Preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setForm({...form, step2Photo: null})} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-600">&times;</button>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-emerald-400 transition cursor-pointer mb-4">
                            <Plus className="w-8 h-8 mb-2 text-slate-400" />
                            <span className="text-sm font-medium">Bấm để tải ảnh lên (JPG, PNG)</span>
                            <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={e => e.target.files && setForm({...form, step2Photo: e.target.files[0]})} />
                          </label>
                        )}
                     </div>
                     
                     <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-2">Ghi chú thêm (Nếu có)</label>
                       <textarea 
                         rows={2} 
                         value={form.step2Note}
                         onChange={e => setForm({...form, step2Note: e.target.value})}
                         placeholder="VD: Đã khử trùng toàn bộ dao thớt bằng nước sôi trước khi thái thịt..." 
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                       ></textarea>
                     </div>
                   </div>

                   <div className="flex justify-end pt-4 border-t border-slate-200 gap-3">
                     <button type="button" onClick={() => setIsModalVisible(false)} className="px-5 py-2 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Hủy</button>
                     <button type="button" onClick={handleStep2Submit} disabled={!form.step2Passed || !form.step2KitchenPassed} className="px-5 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm flex items-center gap-2">Xác nhận Bước 2 (Lưu & Đóng) <CheckCircle className="w-4 h-4"/></button>
                   </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="font-semibold text-emerald-700 mb-3 border-b pb-2">BƯỚC 3: Cảm quan món chín & Lưu mẫu</h4>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-2">Nhận xét cảm quan món chín</label>
                       <textarea 
                         rows={2} 
                         value={form.step3Note}
                         onChange={e => setForm({...form, step3Note: e.target.value})}
                         placeholder="VD: Mùi vị thơm ngon, thịt mềm, màu sắc bắt mắt..." 
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                       ></textarea>
                    </div>
                    
                    <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-lg border border-emerald-200 shadow-sm">
                      <input type="checkbox" checked={form.step3Passed} onChange={e => setForm({...form, step3Passed: e.target.checked})} className="w-5 h-5 accent-emerald-600" />
                      <span className="font-bold text-emerald-700">Xác nhận: Dụng cụ chia thức ăn sạch sẽ</span>
                    </label>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Định lượng lưu mẫu (gram)</label>
                      <div className="space-y-2">
                        {dishes.map((d, index) => (
                          <div key={d.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="font-medium text-slate-700">{d.name}</span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" required min="100" value={d.qty} 
                                onChange={e => {
                                  const newDishes = [...dishes];
                                  newDishes[index].qty = e.target.value;
                                  setDishes(newDishes);
                                }} 
                                placeholder="150" 
                                className="w-24 px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                              />
                              <span className="text-sm text-slate-500 font-medium">gram</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hình ảnh khay thức ăn đã chia tươm tất</label>
                        {form.step3Photo ? (
                          <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <img src={URL.createObjectURL(form.step3Photo)} alt="Preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setForm({...form, step3Photo: null})} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-600">&times;</button>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-emerald-400 transition cursor-pointer">
                            <Plus className="w-6 h-6 mb-1 text-slate-400" />
                            <span className="text-sm font-medium">Tải ảnh lên</span>
                            <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={e => e.target.files && setForm({...form, step3Photo: e.target.files[0]})} />
                          </label>
                        )}
                     </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-200 gap-3">
                     <button type="button" onClick={() => setIsModalVisible(false)} className="px-5 py-2 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Hủy</button>
                     <button type="submit" disabled={!form.step3Passed} className="px-5 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition">Xác nhận Bước 3 (Hoàn tất)</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
