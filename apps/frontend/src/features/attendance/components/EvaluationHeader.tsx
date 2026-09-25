import React from 'react';
import { Send, FileText, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface EvaluationHeaderProps {
  classNameTitle?: string;
  isSavingDraft?: boolean;
  isSubmitting?: boolean;
  onSaveDraft?: () => void;
  onSubmitReport?: () => void;
}

export const EvaluationHeader: React.FC<EvaluationHeaderProps> = ({
  classNameTitle = 'Lớp Mầm 1 (3-4 tuổi)',
  isSavingDraft = false,
  isSubmitting = false,
  onSaveDraft,
  onSubmitReport,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-[1440px] mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
          <span className="hover:text-slate-800 cursor-pointer transition">Trang chủ</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="hover:text-slate-800 cursor-pointer transition">Bán trú mầm non</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-teal-700 font-bold">Đánh giá mức độ ăn của trẻ sau bữa</span>
        </div>

        {/* Title and Main Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl lg:text-[26px] font-black text-slate-900 tracking-tight">
                Đánh giá mức độ ăn của trẻ sau bữa - {classNameTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/80">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                LiveSync Bếp & Phụ huynh tức thì
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>{isSavingDraft ? 'Đang lưu...' : 'Lưu nháp đánh giá'}</span>
            </button>

            <button
              onClick={onSubmitReport}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-white" />
              <span>{isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo cho Phụ huynh & Bếp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
