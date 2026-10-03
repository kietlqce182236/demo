import React, { useState } from 'react';
import { Megaphone, Upload, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';
import { ChildProfile } from '../types';

interface SchoolProposalFormProps {
  child: ChildProfile;
  onSubmit: (data: {
    category: string;
    title: string;
    content: string;
    isAnonymous: boolean;
    photos?: string[];
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const SchoolProposalForm: React.FC<SchoolProposalFormProps> = ({
  child,
  onSubmit,
  isSubmitting,
}) => {
  const [category, setCategory] = useState<string>('Đề xuất món mới bé yêu thích');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setPhotos([uploadEvent.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await onSubmit({
        category,
        title,
        content,
        isAnonymous,
        photos,
      });
      setShowSuccessToast('Góp ý của bạn đã được gửi thành công đến Ban Giám Hiệu & Bác sĩ Dinh dưỡng!');
      setTimeout(() => setShowSuccessToast(null), 4000);
    } catch (err: any) {
      alert('Lỗi gửi góp ý: ' + (err.message || 'Vui lòng thử lại'));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Đề xuất & Góp ý Nhà trường
            </h2>
            <p className="text-xs text-slate-500">
              Ban Giám Hiệu & Bác Sĩ Dinh dưỡng tiếp nhận
            </p>
          </div>
        </div>

        {/* Chủ đề đóng góp */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Chủ đề đóng góp:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition font-medium text-slate-800 cursor-pointer"
          >
            <option value="Đề xuất món mới bé yêu thích">Đề xuất món mới bé yêu thích</option>
            <option value="Chất lượng & độ tươi nguyên liệu">Chất lượng & độ tươi nguyên liệu</option>
            <option value="Khẩu phần & thời gian ăn">Khẩu phần & thời gian ăn</option>
            <option value="Dị ứng & an toàn thực phẩm">Dị ứng & an toàn thực phẩm</option>
            <option value="Ý kiến khác">Ý kiến khác</option>
          </select>
        </div>

        {/* Tiêu đề ý kiến */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Tiêu đề ý kiến:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tóm tắt ý kiến đóng góp..."
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition font-medium text-slate-800"
          />
        </div>

        {/* Nội dung đề xuất cụ thể */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Nội dung đề xuất cụ thể:
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Mô tả chi tiết mong muốn hoặc đề xuất món ăn cho bé..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none font-medium text-slate-800 leading-relaxed"
          />
        </div>

        {/* Hình ảnh hoặc tài liệu đính kèm */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Hình ảnh hoặc tài liệu đính kèm (nếu có):
          </label>
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-[11px]">
                {uploadedFileName
                  ? `Đã chọn: ${uploadedFileName}`
                  : 'Tải lên hình ảnh minh họa (tối đa 3 ảnh, 5MB)'}
              </span>
            </div>
            <label className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition shadow-2xs">
              <span>Chọn tệp</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Checkbox ẩn danh */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="anonymousFeedback"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 border-slate-300 cursor-pointer"
          />
          <label
            htmlFor="anonymousFeedback"
            className="text-[11px] text-slate-600 leading-tight cursor-pointer select-none"
          >
            <span className="font-semibold text-slate-800">Góp ý ẩn danh:</span> Tên phụ huynh và tên bé sẽ được giấu kín khi công khai trên bảng tin Ban Đại diện Phụ huynh. (BGH vẫn xác thực tài khoản để xử lý nội bộ).
          </label>
        </div>

        {/* BGH & Doctor Notice Box */}
        <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-teal-900 text-xs flex items-start gap-2.5 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium text-teal-900">
            Bác sĩ Dinh dưỡng & Ban Giám Hiệu cam kết tiếp nhận và phản hồi chính thức trong vòng 24 giờ làm việc qua thông báo ứng dụng.
          </p>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{showSuccessToast}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 active:scale-98 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Góp Ý Đến Ban Giám Hiệu'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
