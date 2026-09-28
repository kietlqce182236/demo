import React, { useState } from 'react';
import { Utensils, Calendar, Star, Send, ShieldCheck, Heart, Scale, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { ChildProfile, TodayMealData } from '../types';

interface QuickMealEvaluationFormProps {
  child: ChildProfile;
  todayMeal: TodayMealData;
  onSubmit: (data: {
    rating: number;
    content: string;
    isDrafting: boolean;
    attributes: {
      taste: string;
      allergy: string;
      portion: string;
    };
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const QuickMealEvaluationForm: React.FC<QuickMealEvaluationFormProps> = ({
  child,
  todayMeal,
  onSubmit,
  isSubmitting,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [tastePreference, setTastePreference] = useState<string>('Rất thích (Ăn hết 95%)');
  const [allergySafe, setAllergySafe] = useState<string>('100% Không tôm cua');
  const [portionFit, setPortionFit] = useState<string>('Vừa vặn thể trạng');
  const [message, setMessage] = useState<string>(
    'Hôm nay bé về khen sườn rim rất mềm và ngon miệng, bé đòi ăn thêm canh cải. Cảm ơn các cô và các chú đầu bếp rất nhiều ạ!'
  );
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5:
        return 'Rất Tuyệt Vời (5/5)';
      case 4:
        return 'Hài Lòng (4/5)';
      case 3:
        return 'Bình Thường (3/5)';
      case 2:
        return 'Chưa Hài Lòng (2/5)';
      case 1:
        return 'Cần Cải Thiện (1/5)';
      default:
        return 'Rất Tuyệt Vời (5/5)';
    }
  };

  const handleSubmit = async (isDrafting: boolean) => {
    try {
      await onSubmit({
        rating,
        content: message,
        isDrafting,
        attributes: {
          taste: tastePreference,
          allergy: allergySafe,
          portion: portionFit,
        },
      });
      setShowSuccessToast(
        isDrafting
          ? 'Đã lưu bản nháp đánh giá vào hệ thống!'
          : 'Đã gửi đánh giá bữa ăn thành công đến Giáo viên & Tổ bếp!'
      );
      setTimeout(() => setShowSuccessToast(null), 4000);
    } catch (err: any) {
      alert('Lỗi gửi đánh giá: ' + (err.message || 'Vui lòng thử lại'));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Đánh giá nhanh bữa ăn hôm nay
              </h2>
              <p className="text-xs text-slate-500">
                {child.name || 'Bé Nguyễn Bảo Nam'} • {child.className || 'Lớp Thỏ Trắng'}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 text-slate-700 rounded-full text-xs font-semibold shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{todayMeal.dateLabel || 'Trưa Thứ Ba, 29/10/2024'}</span>
          </div>
        </div>

        {/* Meal Preview & Menu Box */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/90 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
            {/* Meal Photo with Overlay */}
            <div className="sm:col-span-5 relative rounded-lg overflow-hidden group shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80"
                alt="Khay ăn trưa thực tế của trẻ"
                className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium rounded-md shadow-xs">
                {todayMeal.timeLabel || 'Khay ăn thực tế lúc 10:45'}
              </div>
            </div>

            {/* Menu Items */}
            <div className="sm:col-span-7 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-teal-800 font-bold uppercase tracking-wider text-[11px]">
                <span>📋</span>
                <span>{todayMeal.session || 'THỰC ĐƠN BỮA TRƯA'}</span>
              </div>

              <div className="space-y-1 text-slate-700 font-medium">
                <p className="flex items-baseline gap-1">
                  <span className="text-teal-600 font-bold">•</span>
                  <span className="font-semibold text-slate-900">Món mặn:</span>
                  <span>Sườn non ram mặn đậm đà</span>
                </p>
                <p className="flex items-baseline gap-1">
                  <span className="text-teal-600 font-bold">•</span>
                  <span className="font-semibold text-slate-900">Món canh:</span>
                  <span>Canh cải ngọt nấu thịt thăn bằm</span>
                </p>
                <p className="flex items-baseline gap-1">
                  <span className="text-teal-600 font-bold">•</span>
                  <span className="font-semibold text-slate-900">Tinh bột:</span>
                  <span>Cơm trắng dẻo thơm ST25</span>
                </p>
                <p className="flex items-baseline gap-1">
                  <span className="text-teal-600 font-bold">•</span>
                  <span className="font-semibold text-slate-900">Tráng miệng:</span>
                  <span>Chuối tiêu chín tự nhiên</span>
                </p>
              </div>

              {/* Allergy Control Tag */}
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kiểm soát dị ứng:</span>
                  <strong className="text-emerald-900">Tem Đỏ (Không tôm cua biển)</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">
              Mức độ hài lòng chung của con:
            </span>
            <span className="text-xs font-bold text-teal-700">
              {getRatingLabel(hoverRating || rating)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (hoverRating || rating);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-110 active:scale-95 transition cursor-pointer"
                  title={`${star} sao`}
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      active
                        ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                        : 'text-slate-300 hover:text-amber-200'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Quick Attribute Pill Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {/* Tag 1: Khẩu vị & Sức ăn */}
          <div
            onClick={() =>
              setTastePreference(
                tastePreference === 'Rất thích (Ăn hết 95%)'
                  ? 'Ăn vừa đủ (70-80%)'
                  : 'Rất thích (Ăn hết 95%)'
              )
            }
            className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-50 text-teal-900 cursor-pointer transition select-none flex flex-col justify-between"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 mb-1">
              <Heart className="w-3.5 h-3.5 fill-teal-600 text-teal-600" />
              <span>Khẩu vị & Sức ăn</span>
            </div>
            <p className="text-xs font-bold text-slate-800">{tastePreference}</p>
          </div>

          {/* Tag 2: An toàn dị ứng */}
          <div
            onClick={() =>
              setAllergySafe(
                allergySafe === '100% Không tôm cua'
                  ? 'Được kiểm tra trước bữa'
                  : '100% Không tôm cua'
              )
            }
            className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-900 cursor-pointer transition select-none flex flex-col justify-between"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>An toàn dị ứng</span>
            </div>
            <p className="text-xs font-bold text-slate-800">{allergySafe}</p>
          </div>

          {/* Tag 3: Định lượng khẩu phần */}
          <div
            onClick={() =>
              setPortionFit(
                portionFit === 'Vừa vặn thể trạng'
                  ? 'Cần tăng thêm cơm'
                  : 'Vừa vặn thể trạng'
              )
            }
            className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-50 text-sky-900 cursor-pointer transition select-none flex flex-col justify-between"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 mb-1">
              <Scale className="w-3.5 h-3.5 text-sky-600" />
              <span>Định lượng khẩu phần</span>
            </div>
            <p className="text-xs font-bold text-slate-800">{portionFit}</p>
          </div>
        </div>

        {/* Message for Teachers & Kitchen */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-800">
              Lời nhắn gửi Cô giáo chủ nhiệm & Tổ bếp:
            </label>
            <span className="text-[11px] text-slate-400">
              {message.length}/300 ký tự
            </span>
          </div>

          <textarea
            rows={3}
            maxLength={300}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập cảm nhận của bé hoặc dặn dò tổ bếp..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none text-slate-800 font-medium"
          />
        </div>

        {/* Success Toast Notification */}
        {showSuccessToast && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{showSuccessToast}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit(true)}
          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
        >
          Lưu nháp
        </button>

        <button
          type="button"
          disabled={isSubmitting || !message.trim()}
          onClick={() => handleSubmit(false)}
          className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 shadow-sm rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá bữa ăn hôm nay'}</span>
        </button>
      </div>
    </div>
  );
};
