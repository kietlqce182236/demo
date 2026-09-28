import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, ShieldAlert, Users, ChefHat } from 'lucide-react';
import {
  CoordinationNoteItem,
  CreateCoordinationNotePayload,
  UpdateCoordinationNotePayload,
} from '../types';

interface CreateEditCoordinationNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit: CoordinationNoteItem | null;
  selectedClassId: string;
  availableClasses: Array<{
    id: string;
    name: string;
    gradeLevel: string;
    totalStudents: number;
  }>;
  availableChildren: Array<{
    id: string;
    fullName: string;
    studentCode: string;
    allergy?: string;
  }>;
  onSave: (payload: CreateCoordinationNotePayload | UpdateCoordinationNotePayload, noteId?: string) => Promise<void>;
}

export const CreateEditCoordinationNoteModal: React.FC<CreateEditCoordinationNoteModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  selectedClassId,
  availableClasses,
  availableChildren,
  onSave,
}) => {
  const [classId, setClassId] = useState(selectedClassId);
  const [childId, setChildId] = useState('');
  const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealSession, setMealSession] = useState('LUNCH');
  const [noteType, setNoteType] = useState('PORTION_ADJUSTMENT');
  const [priority, setPriority] = useState('NORMAL');
  const [targetRole, setTargetRole] = useState('KITCHEN');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [kitchenResponse, setKitchenResponse] = useState('');
  const [teacherName, setTeacherName] = useState('Cô Nguyễn Lan Anh (GVCN Chồi 1)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (noteToEdit) {
      setClassId(noteToEdit.classId);
      setChildId(noteToEdit.child?.id || '');
      setMealDate(noteToEdit.mealDate);
      setMealSession(noteToEdit.mealSession);
      setNoteType(noteToEdit.noteType);
      setPriority(noteToEdit.priority);
      setTargetRole(noteToEdit.targetRole || 'KITCHEN');
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setKitchenResponse(noteToEdit.kitchenResponse || '');
      setTeacherName(noteToEdit.teacherName || 'Cô Nguyễn Lan Anh (GVCN Chồi 1)');
    } else {
      const effectiveClassId = selectedClassId || availableClasses[0]?.id || '';
      setClassId(effectiveClassId);
      setChildId('');
      setMealDate(new Date().toISOString().split('T')[0]);
      setMealSession('LUNCH');
      setNoteType('PORTION_ADJUSTMENT');
      setPriority('NORMAL');
      setTargetRole('KITCHEN');
      setTitle('');
      setContent('');
      setKitchenResponse('');
      setTeacherName('Cô Nguyễn Lan Anh (GVCN Chồi 1)');
    }
    setErrorMsg('');
  }, [noteToEdit, selectedClassId, availableClasses, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề ghi chú điều phối');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Vui lòng nhập nội dung dặn dò chi tiết');
      return;
    }

    const targetClassId = classId || selectedClassId || availableClasses[0]?.id;
    if (!targetClassId) {
      setErrorMsg('Vui lòng chọn lớp học');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      if (noteToEdit) {
        await onSave(
          {
            title: title.trim(),
            content: content.trim(),
            priority,
            noteType,
            mealSession,
            kitchenResponse: kitchenResponse.trim() || undefined,
          },
          noteToEdit.id,
        );
      } else {
        await onSave({
          classId: targetClassId,
          childId: childId && childId.trim() !== '' ? childId : undefined,
          mealDate,
          mealSession,
          noteType,
          priority,
          title: title.trim(),
          content: content.trim(),
          targetRole,
          teacherName,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu ghi chú điều phối vào cơ sở dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {noteToEdit ? 'Chỉnh sửa Ghi chú Điều phối' : 'Tạo mới Ghi chú Điều phối Suất ăn'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Đồng bộ trực tiếp giữa Giáo viên chủ nhiệm, Nhà bếp và Y tế trường học
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Class & Child selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Lớp học <span className="text-red-500">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={!!noteToEdit}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.totalStudents} trẻ)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Học sinh liên quan
              </label>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                disabled={!!noteToEdit}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="">-- Áp dụng cho toàn thể lớp học --</option>
                {availableChildren.map((kid) => (
                  <option key={kid.id} value={kid.id}>
                    {kid.fullName} ({kid.studentCode}){kid.allergy ? ` - ⚠️ ${kid.allergy}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date, Meal Session & Note Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ngày phục vụ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                disabled={!!noteToEdit}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Bữa ăn <span className="text-red-500">*</span>
              </label>
              <select
                value={mealSession}
                onChange={(e) => setMealSession(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="LUNCH">Bữa trưa chính (10:30)</option>
                <option value="BREAKFAST">Bữa sáng (07:30)</option>
                <option value="AFTERNOON_SNACK">Bữa xế chiều (14:30)</option>
                <option value="ALL_DAY">Cả ngày (Tất cả bữa)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phân loại điều phối <span className="text-red-500">*</span>
              </label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="PORTION_ADJUSTMENT">Cắt suất / Tăng giảm cơm canh</option>
                <option value="ALLERGY_WARNING">Cảnh báo dị ứng khẩn cấp</option>
                <option value="SPECIAL_DIET">Chế độ ăn riêng (Cháo mềm/Kiêng)</option>
                <option value="MEDICATION_FEEDING">Dặn dò uống thuốc & chăm sóc</option>
                <option value="KITCHEN_REQUEST">Yêu cầu phối hợp nhà bếp</option>
                <option value="PARENT_DIRECTIVE">Dặn dò từ phụ huynh</option>
              </select>
            </div>
          </div>

          {/* Row 3: Priority & Target Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mức độ ưu tiên <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('NORMAL')}
                  className={`p-2 rounded-xl font-bold border transition text-center ${
                    priority === 'NORMAL'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tiêu chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('HIGH')}
                  className={`p-2 rounded-xl font-bold border transition text-center ${
                    priority === 'HIGH'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  ⚠️ Quan trọng
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('URGENT')}
                  className={`p-2 rounded-xl font-bold border transition text-center ${
                    priority === 'URGENT'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs ring-2 ring-red-500/20'
                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  }`}
                >
                  🚨 Khẩn cấp
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nơi tiếp nhận xử lý <span className="text-red-500">*</span>
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="KITCHEN">Bếp Bán Trú & Tiếp Phẩm</option>
                <option value="HEALTH_OFFICER">Phòng Y Tế & Chuyên viên Dinh dưỡng</option>
                <option value="PRINCIPAL">Ban Giám Hiệu</option>
                <option value="PARENT">Phối hợp cùng Phụ Huynh</option>
              </select>
            </div>
          </div>

          {/* Row 4: Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tiêu đề tóm tắt <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Cắt 1 suất trưa do đón sớm / Đổi sang cháo hạt sen ấm do nhiệt miệng..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          {/* Row 5: Detailed Content */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nội dung dặn dò chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập chi tiết yêu cầu, lời dặn của phụ huynh, triệu chứng của bé hoặc yêu cầu chuẩn bị thêm dụng cụ, gia vị..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Row 6: Kitchen Response (Only when editing) */}
          {noteToEdit && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ghi chú phản hồi từ Nhà Bếp:
              </label>
              <textarea
                rows={2}
                value={kitchenResponse}
                onChange={(e) => setKitchenResponse(e.target.value)}
                placeholder="Nhập xác nhận từ bếp trưởng hoặc nhân viên tiếp phẩm..."
                className="w-full p-2.5 bg-teal-50/50 border border-teal-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>
          )}

          {/* Teacher Signature */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Giáo viên ký gửi
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu vào DB...' : noteToEdit ? 'Lưu thay đổi' : 'Gửi ghi chú ngay'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
