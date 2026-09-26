import React, { useState } from 'react';
import {
  Coffee,
  Utensils,
  Cookie,
  Droplets,
  Heart,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MealSessionRecord } from '../types';

interface DailySessionsTimelineProps {
  sessions: MealSessionRecord[];
  onHeartReaction: (attendanceId: string) => Promise<void>;
}

export const DailySessionsTimeline: React.FC<DailySessionsTimelineProps> = ({
  sessions,
  onHeartReaction,
}) => {
  const [heartAttendanceIds, setHeartAttendanceIds] = useState<Set<string>>(new Set());

  const handleHeartClick = async (attendanceId: string) => {
    setHeartAttendanceIds((prev) => new Set(prev).add(attendanceId));
    try {
      await onHeartReaction(attendanceId);
    } catch (err) {
      console.error(err);
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'BREAKFAST':
        return <Coffee className="w-5 h-5 text-amber-600" />;
      case 'LUNCH':
        return <Utensils className="w-5 h-5 text-teal-600" />;
      case 'AFTERNOON_SNACK':
      default:
        return <Cookie className="w-5 h-5 text-purple-600" />;
    }
  };

  const getSessionBadgeColor = (type: string) => {
    switch (type) {
      case 'BREAKFAST':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'LUNCH':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'AFTERNOON_SNACK':
      default:
        return 'bg-purple-50 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Nhật ký Bữa ăn & Sức ăn Chi tiết Trong Ngày
          </h2>
          <p className="text-xs text-slate-500">
            Dữ liệu thực tế được giáo viên phụ trách lớp ghi nhận và đồng bộ trực tiếp
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((session, index) => {
          const isLunch = session.mealType === 'LUNCH';
          const hasHearted =
            heartAttendanceIds.has(session.attendanceId) ||
            session.parentStatusLabel?.includes('thả tim');

          return (
            <div
              key={session.attendanceId || index}
              className={`bg-white rounded-2xl border ${
                isLunch ? 'border-teal-200 ring-1 ring-teal-50' : 'border-slate-200'
              } p-4 sm:p-5 shadow-xs transition hover:shadow-sm`}
            >
              {/* Session Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getSessionBadgeColor(
                      session.mealType
                    )}`}
                  >
                    {getSessionIcon(session.mealType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {session.mealSession}
                      </h3>
                      {session.dietaryBadgeText && (
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            session.dietaryBadgeType === 'ALLERGY'
                              ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {session.dietaryBadgeText}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ghi nhận bởi: <strong className="text-slate-700">{session.teacherName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Đồng bộ lúc {session.sentAt}</span>
                  </span>
                </div>
              </div>

              {/* Session Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-4 items-center">
                {/* Meal Dishes */}
                <div className={`${session.photoEvidenceUrl ? 'lg:col-span-4' : 'lg:col-span-6'} space-y-1.5`}>
                  <p className="text-xs font-bold text-slate-800">Món ăn được phục vụ:</p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                    {session.dishesServed}
                  </p>
                </div>

                {/* Photo Evidence if present */}
                {session.photoEvidenceUrl && (
                  <div className="lg:col-span-3">
                    <div className="relative rounded-xl overflow-hidden group shadow-2xs border border-slate-200">
                      <img
                        src={session.photoEvidenceUrl}
                        alt="Khay ăn thực tế"
                        className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium rounded-md">
                        Khay ăn thực tế lúc {session.sentAt}
                      </div>
                    </div>
                  </div>
                )}

                {/* Real Consumption & Water metrics */}
                <div className={`${session.photoEvidenceUrl ? 'lg:col-span-5' : 'lg:col-span-6'} space-y-3`}>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Portion consumed */}
                    <div className="bg-teal-50/70 border border-teal-100 p-2.5 rounded-xl">
                      <span className="text-[11px] font-bold text-teal-800 block">Sức ăn thực tế:</span>
                      <span className="text-sm font-black text-teal-900">
                        Ăn hết {session.consumptionPercentage}% suất
                      </span>
                    </div>

                    {/* Water intake */}
                    <div className="bg-sky-50/70 border border-sky-100 p-2.5 rounded-xl">
                      <span className="text-[11px] font-bold text-sky-800 block">Lượng nước cữ này:</span>
                      <span className="text-sm font-black text-sky-900 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-sky-600" />
                        {session.waterIntake}
                      </span>
                    </div>
                  </div>

                  {/* Teacher Feedback / Observation */}
                  {session.teacherFeedback && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-xs text-slate-800 leading-relaxed flex items-start gap-2">
                      <User className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-900">Nhận xét của giáo viên: </span>
                        <span className="italic text-slate-700">“{session.teacherFeedback}”</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{hasHearted ? 'PH đã thả tim ❤️' : session.parentStatusLabel}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tap Heart Button */}
                  <button
                    type="button"
                    onClick={() => handleHeartClick(session.attendanceId)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs ${
                      hasHearted
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        hasHearted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                      }`}
                    />
                    <span>{hasHearted ? 'Đã thả tim động viên' : 'Thả tim động viên bé & cô'}</span>
                  </button>

                  {/* Quick Evaluate Button */}
                  {isLunch && (
                    <Link
                      to="/submit-evaluation"
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 text-xs shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Đánh giá bữa này</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
