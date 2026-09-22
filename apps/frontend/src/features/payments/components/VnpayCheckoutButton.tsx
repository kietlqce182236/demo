import React, { useState } from 'react';
import { apiClient } from '@/core/api/axios';
import { CreditCard, Loader2 } from 'lucide-react';

interface VnpayCheckoutButtonProps {
  invoiceId: string;
  amount: number;
  orderInfo: string;
}

export const VnpayCheckoutButton: React.FC<VnpayCheckoutButtonProps> = ({
  invoiceId,
  amount,
  orderInfo,
}) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.post('/payments/create-url', {
        invoiceId,
        amount,
        orderInfo,
      });

      if (data.paymentUrl) {
        // Chuyển hướng sang cổng thanh toán VNPAY Sandbox
        window.location.href = data.paymentUrl;
      }
    } catch (err) {
      alert('Lỗi tạo phiên thanh toán VNPAY');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <CreditCard className="w-5 h-5" />
      )}
      Thanh toán VNPAY QR ({amount.toLocaleString('vi-VN')} đ)
    </button>
  );
};
