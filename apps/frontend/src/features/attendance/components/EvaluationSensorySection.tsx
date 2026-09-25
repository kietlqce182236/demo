import React, { useState, useEffect } from 'react';
import {
  Utensils,
  MessageSquare,
  Star,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Send,
  Sparkles,
} from 'lucide-react';

interface EvaluationSensorySectionProps {
  sensory: {
    softnessScore: number;
    temperatureScore: number;
    excitementScore: number;
    foodSafetyChecked: boolean;
    chefFeedback: string;
    headChefName: string;
    isLocked: boolean;
    lockedAt?: string;
    status: string;
  };
  onUpdateSensory: (data: {
    softnessScore?: number;
    temperatureScore?: number;
    excitementScore?: number;
    chefFeedback?: string;
  }) => Promise<void>;
  onLockAndComplete: (chefFeedback: string) => Promise<void>;
}

export const EvaluationSensorySection: React.FC<EvaluationSensorySectionProps> = ({
  sensory,
  onUpdateSensory,
  onLockAndComplete,
}) => {
  const [softness, setSoftness] = useState(sensory?.softnessScore ?? 5);
  const [temperature, setTemperature] = useState(sensory?.temperatureScore ?? 4);
  const [excitement, setExcitement] = useState(sensory?.excitementScore ?? 5);
  const [feedback, setFeedback] = useState(sensory?.chefFeedback || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    if (sensory) {
      setSoftness(sensory.softnessScore ?? 5);
      setTemperature(sensory.temperatureScore ?? 4);
      setExcitement(sensory.excitementScore ?? 5);
      setFeedback(sensory.chefFeedback || '');
    }
  }, [sensory]);

  const handleStarClick = async (type: 'softness' | 'temperature' | 'excitement', score: number) => {
    if (sensory?.isLocked) return;

    if (type === 'softness') {
      setSoftness(score);
      await onUpdateSensory({ softnessScore: score });
    } else if (type === 'temperature') {
      setTemperature(score);
      await onUpdateSensory({ temperatureScore: score });
    } else if (type === 'excitement') {
      setExcitement(score);
      await onUpdateSensory({ excitementScore: score });
    }
  };

  const handleFeedbackBlur = async () => {
    if (sensory.isLocked) return;
    if (feedback !== sensory.chefFeedback) {
      await onUpdateSensory({ chefFeedback: feedback });
    }
  };

  const handleLockClick = async () => {
    setIsLocking(true);
    try {
      await onLockAndComplete(feedback);
    } finally {
      setIsLocking(false);
    }
  };

  const renderStars = (
    currentScore: number,
    type: 'softness' | 'temperature' | 'excitement',
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={sensory.isLocked}
            onClick={() => handleStarClick(type, star)}
            className={`transition ${
              sensory.isLocked ? 'cursor-default' : 'hover:scale-110 cursor-pointer'
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                star <= currentScore
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6 py-4 max-w-[1440px] mx-auto">
      {/* Left Card: Cảm quan món ăn hôm nay của trẻ */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Utensils className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Cảm quan món ăn hôm nay của trẻ
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-4">
            Cô giáo đánh giá nhanh để Nhà bếp điều chỉnh độ mặn, mềm và nhiệt độ cho các bữa kế tiếp.
          </p>

          {/* Rating Rows */}
          <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Độ mềm & Kích thước thức ăn:
              </span>
              {renderStars(softness, 'softness')}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Nhiệt độ khi chia phần (Ấm vừa):
              </span>
              {renderStars(temperature, 'temperature')}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Độ hào hứng của trẻ với món:
              </span>
              {renderStars(excitement, 'excitement')}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-teal-700">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Đã kiểm thực 3 bước theo quy chuẩn VSATTP mầm non</span>
        </div>
      </div>

      {/* Right Card: Góp ý trực tiếp gửi Bếp trưởng */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Góp ý trực tiếp gửi Bếp trưởng
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Bếp trưởng: {sensory.headChefName || 'Cô Phạm Lan'}
            </span>
          </div>

          {/* Feedback Textarea */}
          <div className="mt-2">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onBlur={handleFeedbackBlur}
              disabled={sensory.isLocked}
              rows={3}
              placeholder="Nhập nhận xét về món ăn hôm nay của các con..."
              className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Khóa đánh giá lúc 12:00 để chuyển giao ca Bếp dọn dẹp</span>
          </div>

          <button
            onClick={handleLockClick}
            disabled={sensory.isLocked || isLocking}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition shadow-xs ${
              sensory.isLocked
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                : 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white shadow-teal-700/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {sensory.isLocked
                ? 'Đã khóa đánh giá bữa trưa'
                : isLocking
                ? 'Đang khóa...'
                : 'Hoàn thành & Khóa đánh giá bữa trưa'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
