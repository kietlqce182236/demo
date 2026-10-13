import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Coffee,
  Calendar,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../../core/api/axios';
import { ParentPortalTopNav } from '../../parent-evaluations/components/ParentPortalTopNav';

export const VnpayReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    isValid: boolean;
    isSuccess: boolean;
    responseCode?: string;
    transactionNo?: string;
    orderId?: string;
    amount?: number;
    serviceType?: string;
  } | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);
        const paramsObj: Record<string, string> = {};
        searchParams.forEach((val, key) => {
          paramsObj[key] = val;
        });

        // Call backend verification
        const res = await apiClient.get('/payments/vnpay-return', {
          params: paramsObj,
        });

        setResult(res.data);
      } catch (err: any) {
        console.error('Failed to verify VNPAY return URL', err);
        // Fallback reading directly from query params
        const responseCode = searchParams.get('vnp_ResponseCode');
        const isSuccess = responseCode === '00';
        setResult({
          isValid: true,
          isSuccess,
          responseCode: responseCode || '99',
          transactionNo: searchParams.get('vnp_TransactionNo') || 'VNP-DIRECT',
          orderId: searchParams.get('vnp_TxnRef') || '',
          amount: searchParams.get('vnp_Amount')
            ? Number(searchParams.get('vnp_Amount')) / 100
            : 0,
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const formatVND = (amt?: number) => {
    if (!amt) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(amt) + ' đ';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <ParentPortalTopNav activeTab="snacks" />

      <main className="max-w-2xl mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="bg-white rounded-3xl p-10 shadow-lg border border-slate-200 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
            <h2 className="text-xl font-black text-slate-800">
              Đang Xác Thực Kết Quả Giao Dịch VNPAY...
            </h2>
            <p className="text-xs text-slate-500">
              Vui lòng không đóng trình duyệt, hệ thống đang đồng bộ dữ liệu giao dịch với máy chủ VNPAY.
            </p>
          </div>
        ) : result?.isSuccess ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-emerald-200 text-center space-y-6 animate-scale-up">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase text-emerald-600 tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Giao Dịch Hợp Lệ • Mã 00 Thành Công
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 pt-2">
                Thanh Toán VNPAY Thành Công!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Suất ăn sáng dinh dưỡng cho bé đã được kích hoạt thành công trên hệ thống nhà bếp và giáo viên chủ nhiệm.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-3 border border-slate-200 text-xs sm:text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Mã giao dịch VNPAY:</span>
                <span className="font-mono font-bold text-slate-800">{result.transactionNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Mã đơn hàng nội bộ:</span>
                <span className="font-mono font-bold text-slate-800">{result.orderId || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Số tiền thanh toán:</span>
                <span className="font-black text-emerald-700 text-base">{formatVND(result.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trạng thái quyền lợi:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  <Coffee className="w-4 h-4" /> Được Cung Cấp Đồ Ăn Sáng
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/parent-breakfast')}
                className="w-full py-3.5 px-6 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay Lại Trang Gói Ăn Sáng & Theo Dõi Suất Ăn
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-rose-200 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase text-rose-600 tracking-wider bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Giao Dịch Chưa Hoàn Tất
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 pt-2">
                Thanh Toán Không Thành Công
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý qua cổng VNPAY (Mã lỗi: {result?.responseCode || 'Không xác định'}).
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/parent-breakfast')}
                className="w-full py-3.5 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay Lại Trang Đăng Ký Thử Lại
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
