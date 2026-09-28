import React from 'react';
import { useForm } from 'react-hook-form';
import { ClassData } from '../types';
import { useCreateClass, useUpdateClass } from '../hooks/useClasses';
import { useNavigate } from 'react-router-dom';
import { Store, X, CheckCircle2, ChevronDown, DoorOpen, Contact, ShieldCheck } from 'lucide-react';

interface ClassFormProps {
  initialData?: Partial<ClassData>;
  isEdit?: boolean;
}

export const ClassForm: React.FC<ClassFormProps> = ({ initialData, isEdit }) => {
  const navigate = useNavigate();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();

  const { register, handleSubmit, formState: { errors } } = useForm<Partial<ClassData>>({
    defaultValues: initialData || {
      status: 'ACTIVE',
      academicYear: '2024-2025'
    }
  });

  const onSubmit = (data: Partial<ClassData>) => {
    // Chỉ chọn đúng các trường mà Backend cho phép (dựa theo DTO)
    // để tránh lỗi 400 Bad Request do forbidNonWhitelisted
    const payload: Partial<ClassData> = {
      name: data.name,
      gradeLevel: data.gradeLevel,
      academicYear: data.academicYear,
    };

    if (data.roomNumber && data.roomNumber.trim() !== '') {
      payload.roomNumber = data.roomNumber;
    }

    if (data.mainTeacherId && data.mainTeacherId.trim() !== '') {
      payload.mainTeacherId = data.mainTeacherId;
    }

    // Chỉ gửi status khi Edit (vì CreateClassDto không có status)
    if (isEdit && data.status) {
      payload.status = data.status;
    }

    if (isEdit && initialData?.id) {
      updateMutation.mutate({ id: initialData.id, payload }, {
        onSuccess: () => navigate('/classes')
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => navigate('/classes')
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="pb-10">
      {/* Header Modal-like */}
      <div className="flex items-start justify-between mb-8 bg-white p-6 rounded-[1.5rem] border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-slate-800">
                {isEdit ? 'Cập Nhật Lớp Học' : 'Tạo Lớp Học Mới'}
              </h2>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                Niên khóa 2024 - 2025
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              {isEdit ? 'Cập nhật thông tin lớp học và điều chỉnh phân công nhân sự.' : 'Thêm lớp học vào năm học 2024 - 2025 và phân công giáo viên chủ nhiệm & chăm sóc bán trú.'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/classes')}
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1 */}
        <section>
          <div className="flex items-center gap-3 mb-4 pl-2">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-700/20">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-800">Thông tin Lớp học cơ bản</h3>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Tên lớp học <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  {...register('name', { required: 'Tên lớp là bắt buộc' })}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium shadow-sm"
                  placeholder="VD: Thỏ Trắng 2"
                />
                <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-2 ml-1">
                Gợi ý: Đặt tên thân thiện theo loài hoa, con vật hoặc đồ vật ngộ nghĩnh cho bé.
              </p>
              {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Năm học <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('academicYear', { required: 'Năm học là bắt buộc' })}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium shadow-sm"
                  placeholder="2024-2025"
                />
                {errors.academicYear && <p className="text-red-500 text-xs mt-1 font-bold">{errors.academicYear.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Khối tuổi / Nhóm tuổi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register('gradeLevel', { required: 'Vui lòng chọn khối' })}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium shadow-sm appearance-none pr-10 cursor-pointer"
                  >
                    <option value="">-- Chọn Khối --</option>
                    <option value="INFANT_0_1Y">Nhà trẻ (0 - 1 tuổi)</option>
                    <option value="TODDLER_1_2Y">Nhà trẻ (1 - 2 tuổi)</option>
                    <option value="TODDLER_2_3Y">Nhà trẻ (2 - 3 tuổi)</option>
                    <option value="KINDERGARTEN_3_4Y">Khối Mầm (3 - 4 tuổi)</option>
                    <option value="KINDERGARTEN_4_5Y">Khối Chồi (4 - 5 tuổi)</option>
                    <option value="KINDERGARTEN_5_6Y">Khối Lá (5 - 6 tuổi)</option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.gradeLevel && <p className="text-red-500 text-xs mt-1 font-bold">{errors.gradeLevel.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sĩ số dự kiến tiếp nhận</label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue={25}
                    className="w-full pl-5 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium shadow-sm"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Bé</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Giới hạn tối đa (Chuẩn BGD)</label>
                <div className="relative">
                  <input
                    type="number"
                    readOnly
                    value={30}
                    className="w-full pl-5 pr-16 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl focus:outline-none text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Bé / lớp</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phòng học / Cơ sở vật chất</label>
              <div className="relative">
                <input
                  {...register('roomNumber')}
                  className="w-full pl-5 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium shadow-sm"
                  placeholder="Phòng P.202 - Tầng 2 Khu B (Trang bị máy lạnh, máy khử khuẩn bát đĩa)"
                />
                <DoorOpen className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <div className="flex items-center justify-between mb-4 pl-2">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-700/20">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-800">Phân công Giáo viên & Nhân sự</h3>
            </div>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[11px] font-bold">
              1 Xung đột cần giải quyết
            </span>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Giáo viên Phụ trách / Chủ nhiệm</label>
              <div className="relative">
                <select 
                  {...register('mainTeacherId')}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium shadow-sm appearance-none pr-12 cursor-pointer"
                >
                  <option value="">-- Chưa phân công --</option>
                  <option value="10000000-0000-0000-0000-000000000004">Cô Phạm Thùy Chi - GVCN (Đang rảnh lịch)</option>
                  <option value="10000000-0000-0000-0000-000000000005">Cô Hoàng Bích Ngọc - GVCN</option>
                  <option value="10000000-0000-0000-0000-000000000006">Cô Vũ Tuyết Mai - GVCN</option>
                </select>
                <Contact className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Cô Bảo mẫu / Chăm sóc bán trú & dinh dưỡng</label>
              <div className="relative">
                <select className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium shadow-sm appearance-none pr-12 cursor-pointer">
                  <option>Cô Lê Thị Bích - Cấp dưỡng 2 & Bảo mẫu (Đạt chuẩn VSATTP BỘ Y TẾ)</option>
                </select>
                <ShieldCheck className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 font-bold mt-2 ml-1">
                Nhân sự này chịu trách nhiệm nhận suất ăn, kiểm tra độ ấm và lưu mẫu thức ăn tại lớp.
              </p>
            </div>
            
            {isEdit && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Trạng thái lớp</label>
                <select
                  {...register('status')}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium shadow-sm appearance-none cursor-pointer"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="ARCHIVED">Lưu trữ</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Footer actions */}
        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/classes')}
            className="px-8 py-3.5 rounded-full border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-3.5 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 transition disabled:opacity-70 flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              'Lưu Lớp Học'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
