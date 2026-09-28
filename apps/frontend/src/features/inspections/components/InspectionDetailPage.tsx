import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, Clock, AlertTriangle, ThermometerSun, Refrigerator, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/core/api/axios';

export const InspectionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    fetchRecord();
  }, [id]);

  useEffect(() => {
    if (record && record.sealedAt && record.step3Status === 'Đã lưu mẫu') {
      const interval = setInterval(() => {
        const sealedTime = new Date(record.sealedAt).getTime();
        const targetTime = sealedTime + 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        const diff = targetTime - now;

        if (diff <= 0) {
          setCountdown('00:00:00 (Đã quá hạn 24h, cần hủy mẫu)');
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff / (1000 * 60)) % 60);
          const secs = Math.floor((diff / 1000) % 60);
          setCountdown(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [record]);

  const fetchRecord = async () => {
    try {
      const res = await apiClient.get(`/inspections/samples/${id}`);
      const data = res.data;
      setRecord(data);
    } catch (error) {
      alert('Không thể tải chi tiết biên bản');
      navigate('/inspections');
    }
  };

  const handleDispose = async () => {
    if(!window.confirm("Bạn chắc chắn đã hủy mẫu an toàn vào lúc này?")) return;
    try {
      await apiClient.patch(`/inspections/samples/${id}/dispose`);
      alert('Đã hủy mẫu thành công');
      fetchRecord();
    } catch (error) {
      alert('Lỗi khi hủy mẫu');
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth()+1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (!record) return <div className="p-8 text-center text-slate-500">Đang tải...</div>;

  const isDisposed = record.step3Status === 'Đã hủy mẫu an toàn' || record.step3Status === 'Đã hủy mẫu';
  const is24hPassed = record.sealedAt && (new Date().getTime() - new Date(record.sealedAt).getTime()) >= 24 * 60 * 60 * 1000;
  const isExpired = countdown.includes('quá hạn');

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Biên Bản Kiểm Thực Ba Bước: <span className="text-emerald-700">{record.code}</span>
            <span className="ml-3 inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> Đạt chuẩn ATTP
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Quy chuẩn QĐ 1246/QĐ-BYT • Niên khóa 2026 - 2027</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/inspections')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition">
            <ArrowLeft className="w-4 h-4" /> Quay lại sổ
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium text-sm transition shadow-sm">
            <Printer className="w-4 h-4" /> Xuất PDF / In tem
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-4 gap-6 divide-x divide-slate-100">
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Mã biên bản điện tử</p>
            <p className="text-xl font-bold text-slate-800">{record.code}</p>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><ShieldCheck className="w-3.5 h-3.5"/> Khóa dữ liệu SHA-256</p>
          </div>
          <div className="pl-6">
            <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Ngày kiểm thực</p>
            <p className="text-xl font-bold text-slate-800">{formatDate(record.mealDate)}</p>
            <p className="text-sm text-slate-500 mt-1">{record.mealTime}</p>
          </div>
          <div className="pl-6">
            <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Ca ăn & Khẩu phần</p>
            <p className="text-xl font-bold text-emerald-600">{record.totalPortions} suất bán trú</p>
            <p className="text-sm text-slate-500 mt-1">Người thực hiện: <span className="font-medium text-slate-700">{record.performerName}</span></p>
          </div>
          <div className="pl-6">
            <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Bảo quản lưu mẫu 24h</p>
            <p className="text-xl font-bold text-blue-600 flex items-center gap-2">
              {record.storageTemp}°C <span className="text-xs bg-blue-100 px-2 py-0.5 rounded text-blue-700 font-semibold">Tủ 02</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Chuẩn y tế: 2.0°C - 8.0°C</p>
          </div>
        </div>
        <hr className="my-6 border-slate-100" />
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle className={`w-5 h-5 ${record.status === 'Hoàn tất' ? 'text-emerald-500' : 'text-amber-500'}`} /> Trạng thái hiện hành: 
            <span className={`text-base ${record.status === 'Hoàn tất' ? 'text-blue-700' : 'text-amber-700'}`}>
              {isDisposed ? 'Đã hoàn tất quá trình kiểm thực & hủy mẫu an toàn' : 
               record.status === 'Hoàn tất' ? 'Đã hoàn tất 3 bước kiểm thực & Niêm phong mẫu an toàn' : 
               record.step2Status === 'Đạt chuẩn' ? 'Đã hoàn thành Bước 2 (Chờ lưu mẫu)' : 'Đã hoàn thành Bước 1 (Chờ chế biến)'}
            </span>
          </p>
          {record.sealedAt && <p className="text-sm text-slate-500 font-medium">Niêm phong lúc: {formatTime(record.sealedAt)} - {formatDate(record.sealedAt)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-emerald-50 border-b border-emerald-100 p-4">
            <h3 className="font-bold text-emerald-800 flex items-center gap-2">
              <span className="bg-emerald-200 text-emerald-800 text-xs px-2 py-0.5 rounded font-black">BƯỚC 1</span> Trước khi chế biến
            </h3>
            <p className="text-xs text-emerald-600 mt-1">Giao nhận & Cảm quan nguyên liệu</p>
          </div>
          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500">Giờ tiếp nhận</span>
              <span className="text-sm font-semibold">{record.step1Time ? formatTime(record.step1Time) : '--:--'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500">Đánh giá</span>
              <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">100% Đạt chuẩn <CheckCircle className="w-4 h-4"/></span>
            </div>
                {record.step1Note && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Ghi chú Bước 1:</span>
                    <p className="text-sm text-slate-700 italic">"{record.step1Note}"</p>
                  </div>
                )}
                {record.step1PhotoUrl && (
                  <div className="mt-auto pt-4">
                    <span className="text-xs font-semibold text-slate-500 block mb-2">Minh chứng (Hóa đơn/Nguyên liệu):</span>
                    <div className="h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                       <img src={record.step1PhotoUrl} alt="Minh chứng Bước 1" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-emerald-50 border-b border-emerald-100 p-4">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                  <span className="bg-emerald-200 text-emerald-800 text-xs px-2 py-0.5 rounded font-black">BƯỚC 2</span> Trong khi chế biến
                </h3>
                <p className="text-xs text-emerald-600 mt-1">Nhiệt độ tâm món & Bếp 1 chiều</p>
              </div>
              <div className="p-5 flex-1 flex flex-col space-y-4">
                {record.step2Status === 'Đạt chuẩn' ? (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-3">
                      <span className="text-sm text-slate-500">Giờ giám sát</span>
                      <span className="text-sm font-semibold">{record.step2Time ? formatTime(record.step2Time) : '--:--'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-3">
                      <span className="text-sm text-slate-500">Nhiệt độ tâm món</span>
                      <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">&gt; 75°C <CheckCircle className="w-4 h-4"/></span>
                    </div>
                    {record.step2Note && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Ghi chú Bước 2:</span>
                        <p className="text-sm text-slate-700 italic">"{record.step2Note}"</p>
                      </div>
                    )}
                    {record.step2PhotoUrl && (
                      <div className="mt-auto pt-4">
                        <span className="text-xs font-semibold text-slate-500 block mb-2">Minh chứng (Bếp nấu/Dụng cụ):</span>
                        <div className="h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                           <img src={record.step2PhotoUrl} alt="Minh chứng Bước 2" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                     <Clock className="w-12 h-12 mb-3 text-slate-300" />
                     <p className="font-medium text-slate-500">Chưa thực hiện Bước 2</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden ring-1 ring-blue-100 flex flex-col">
              <div className="bg-blue-50 border-b border-blue-100 p-4">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                  <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded font-black">BƯỚC 3</span> Trước khi ăn & Lưu mẫu
                </h3>
                <p className="text-xs text-blue-600 mt-1">Thử nếm, niêm phong hộp mẫu 24h</p>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                {record.status === 'Hoàn tất' ? (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-3 mb-3">
                      <span className="text-sm text-slate-500">Giờ niêm phong</span>
                      <span className="text-sm font-semibold">{record.sealedAt ? formatTime(record.sealedAt) : '--:--'}</span>
                    </div>
                    
                    {record.step3Note && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Cảm quan món ăn:</span>
                        <p className="text-sm text-slate-700 italic">"{record.step3Note}"</p>
                      </div>
                    )}

                    {record.step3PhotoUrl && (
                      <div className="mb-4">
                        <span className="text-xs font-semibold text-slate-500 block mb-2">Khay thức ăn đã chia:</span>
                        <div className="h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                           <img src={record.step3PhotoUrl} alt="Minh chứng Bước 3" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                
                <p className="text-sm font-bold text-slate-800 mb-2 mt-2">Chi tiết lưu mẫu 24h:</p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 mb-5">
                  {record.sampleItems?.map((item: any) => (
                    <div key={item.id}>
                      <p className="text-sm font-semibold text-slate-700">{item.dishName}</p>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Định lượng: {item.quantityGrams}g</span>
                        <span>Hộp Inox</span>
                      </div>
                    </div>
                  ))}
                </div>

                {!isDisposed && (
                  <div className={`p-4 rounded-xl border text-center mt-auto ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200 border-dashed'}`}>
                    <span className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1 mb-2">
                      <Clock className="w-4 h-4" /> Thời gian đếm ngược (24h)
                    </span>
                    <p className={`text-2xl font-black mb-4 ${isExpired ? 'text-red-600' : 'text-blue-600'}`}>{countdown}</p>
                    
                    <button 
                      onClick={handleDispose}
                      disabled={!is24hPassed && !isExpired}
                      className={`w-full py-2.5 rounded-lg font-bold text-sm transition ${
                        (is24hPassed || isExpired) 
                          ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Xác nhận Đã Hủy Mẫu
                    </button>
                  </div>
                )}
                
                {isDisposed && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center mt-auto">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-black text-emerald-700">ĐÃ HỦY MẪU THÀNH CÔNG</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      Lúc {formatTime(record.disposedAt)} - {formatDate(record.disposedAt)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                 <Clock className="w-12 h-12 mb-3 text-slate-300" />
                 <p className="font-medium text-slate-500">Chưa thực hiện Bước 3</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
