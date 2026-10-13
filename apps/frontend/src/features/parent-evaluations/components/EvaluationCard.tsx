import React, { useState } from 'react';
import {
  Star,
  CornerDownRight,
  Send,
  Edit3,
  MessageCircle,
  Share2,
  Heart,
  ChevronUp,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { ParentEvaluationItem } from '../types';

interface EvaluationCardProps {
  item: ParentEvaluationItem;
  onRespond: (
    id: string,
    content: string,
    pushNotification: boolean,
  ) => Promise<void>;
  onPhotoClick?: (photo: { url: string; caption: string }) => void;
}

export const EvaluationCard: React.FC<EvaluationCardProps> = ({
  item,
  onRespond,
  onPhotoClick,
}) => {
  // State for response editing / drafting
  const [isResponding, setIsResponding] = useState<boolean>(
    item.isDrafting || item.status === 'PENDING' && item.displayOrder === 1,
  );
  const [responseText, setResponseText] = useState<string>(
    item.responseContent || '',
  );
  const [pushNotification, setPushNotification] = useState<boolean>(
    item.pushNotificationSent ?? true,
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Avatar Initials & Color
  const getAvatarInfo = (name?: string) => {
    if (!name) return { initials: 'PH', bg: 'bg-teal-600' };
    const parts = name.trim().split(' ').filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();

    const colors = ['bg-teal-600', 'bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-emerald-600'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bg = colors[hash % colors.length];

    return { initials, bg };
  };

  const avatar = getAvatarInfo(item.parentNameCustom);

  // Quick Reply suggestions
  const quickSuggestions = [
    {
      label: '+ Cảm ơn phụ huynh đã đóng góp',
      text: 'Kính gửi gia đình, Ban Giám Hiệu nhà trường xin chân thành cảm ơn ý kiến đóng góp quý báu của Quý Phụ huynh.',
    },
    {
      label: '+ Đã nhắc nhở tổ bếp điều chỉnh vị cay',
      text: 'BGH đã trao đổi trực tiếp với Bếp trưởng: tổ bếp đã lập tức điều chỉnh gia vị trong món canh để đảm bảo độ thanh mát tuyệt đối cho các con.',
    },
    {
      label: '+ Kiểm tra lại khẩu phần hôm nay',
      text: 'Bộ phận dinh dưỡng đã kiểm tra lại định lượng và nhiệt độ phục vụ để các bé luôn có bữa ăn đạt chuẩn nhất.',
    },
  ];

  const handleAppendSuggestion = (suggestionText: string) => {
    if (!responseText) {
      setResponseText(suggestionText);
    } else {
      setResponseText((prev) => `${prev} ${suggestionText}`);
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) return;
    setIsSubmitting(true);
    try {
      await onRespond(item.id, responseText.trim(), pushNotification);
      setIsResponding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Star Rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-200 fill-slate-100'
            }`}
          />
        ))}
        <span className="ml-1 text-xs font-bold text-slate-700">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow p-5 space-y-4">
      {/* Top Header: Avatar + Names + Time + Status Badge + Stars */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full ${avatar.bg} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs`}
          >
            {avatar.initials}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-900">
                {item.parentNameCustom || 'Phụ huynh'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {item.childNameCustom} ({item.classNameCustom})
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{item.feedbackTimeLabel || item.feedbackDate}</span>
            </p>
          </div>
        </div>

        {/* Status Badge & Stars */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5">
          {item.status === 'PENDING' ? (
            <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px] rounded-md tracking-tight">
              Chưa phản hồi
            </span>
          ) : item.status === 'RESOLVED' ? (
            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] rounded-md tracking-tight">
              Đã cảm ơn
            </span>
          ) : (
            <span className="px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 font-bold text-[11px] rounded-md tracking-tight">
              Đã phản hồi
            </span>
          )}

          <div className="pt-0.5">{renderStars(item.rating)}</div>
        </div>
      </div>

      {/* Meal Badge Tag */}
      {item.mealTitle && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-medium max-w-full truncate">
          <span>{item.mealTitle}</span>
        </div>
      )}

      {/* Content Text */}
      <p className="text-xs leading-relaxed text-slate-700">
        "{item.content}"
      </p>

      {/* Attached Photos (If any) */}
      {item.photoDetails && item.photoDetails.length > 0 && (
        <div className="flex items-center gap-3 pt-1">
          {item.photoDetails.map((ph, idx) => (
            <div
              key={idx}
              onClick={() => onPhotoClick && onPhotoClick(ph)}
              className="group relative cursor-pointer rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition"
            >
              <img
                src={ph.url}
                alt={ph.caption}
                className="w-20 h-20 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 backdrop-blur-xs text-[10px] text-white text-center py-0.5 truncate px-1 font-medium">
                {ph.caption}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Likes / Staff Heart Info */}
      {item.likesInfo && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span className="text-[11px] font-medium">{item.likesInfo}</span>
          </div>
          <button className="text-[11px] text-teal-700 hover:underline font-semibold">
            Xem chi tiết sổ ăn
          </button>
        </div>
      )}

      {/* INLINE RESPONSE BOX (RESPOND TO PARENT EVALUATIONS) */}
      {isResponding ? (
        <div className="mt-3 p-4 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-3 animate-fadeIn">
          {/* Response Box Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-teal-900">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span>
                {item.responseHeader ||
                  `Phản hồi chính thức từ Ban Giám Hiệu ${localStorage.getItem('school_name') || 'Trường Mẫu Giáo Hướng Dương'}`}
              </span>
            </div>
            <span className="text-teal-700 font-semibold text-[11px]">
              Hiệu trưởng Nguyễn Thu Thủy
            </span>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              GỢI Ý PHẢN HỒI NHANH:
            </span>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {quickSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAppendSuggestion(sug.text)}
                  className="px-2.5 py-1 bg-white hover:bg-teal-100/70 border border-teal-200/90 text-teal-800 rounded-lg text-[11px] font-medium transition active:scale-98"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <textarea
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Nhập nội dung phản hồi chính thức từ BGH gửi tới phụ huynh..."
              className="w-full p-3 bg-white border border-teal-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition leading-relaxed"
            />
          </div>

          {/* Push notification toggle */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              id={`push-${item.id}`}
              checked={pushNotification}
              onChange={(e) => setPushNotification(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer"
            />
            <label
              htmlFor={`push-${item.id}`}
              className="text-[11px] cursor-pointer font-medium text-slate-700"
            >
              Gửi thông báo đẩy (Push notification) tức thì qua App KidMeal Connect của Phụ huynh
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setIsResponding(false)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/60 transition"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Thu gọn</span>
            </button>

            <button
              onClick={handleSubmitResponse}
              disabled={isSubmitting || !responseText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm shadow-teal-600/30 transition active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi cho Phụ huynh'}
              </span>
            </button>
          </div>
        </div>
      ) : item.status !== 'PENDING' && item.responseContent ? (
        /* ALREADY RESPONDED DISPLAY */
        <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CornerDownRight className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {item.responseHeader ||
                  `BGH ${localStorage.getItem('school_name') || 'Trường Mẫu Giáo Hướng Dương'}`}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {item.respondedAt
                ? `Đã gửi: ${new Date(item.respondedAt).toLocaleDateString('vi-VN')}`
                : 'Đã gửi: Hôm qua, 17:10'}
            </span>
          </div>

          <p className="text-xs text-slate-700 pl-5 leading-relaxed">
            "{item.responseContent}"
          </p>

          <div className="flex items-center justify-end gap-3 pt-1 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setIsResponding(true)}
              className="flex items-center gap-1 text-teal-700 hover:text-teal-800 hover:underline"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa phản hồi</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsResponding(true)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Phản hồi thêm</span>
            </button>
          </div>
        </div>
      ) : (
        /* PENDING ACTIONS ROW */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsResponding(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-98"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>Phản hồi phụ huynh</span>
            </button>

            <button
              onClick={() => alert('Đã chuyển tiếp thông tin ghi nhận cho Tổ Bếp!')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition active:scale-98"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Chuyển tổ bếp ghi nhận</span>
            </button>
          </div>

          {item.priorityNote && (
            <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
              <span>{item.priorityNote}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
