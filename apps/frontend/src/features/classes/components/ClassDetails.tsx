import React from 'react';
import { useClass } from '../hooks/useClasses';
import { useParams, Link } from 'react-router-dom';
import { Edit, Users, MapPin, Calendar, Clock, ArrowLeft } from 'lucide-react';

export const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: classData, isLoading, isError } = useClass(id as string);

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Đang tải thông tin lớp...</div>;
  }

  if (isError || !classData) {
    return <div className="p-10 text-center text-red-500">Không thể tải thông tin lớp!</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/classes" className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-emerald-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-black text-slate-800">Chi tiết Lớp học</h2>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-8 pb-8 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-800">{classData.name}</h1>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${classData.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {classData.status === 'ACTIVE' ? 'Hoạt động' : 'Lưu trữ'}
              </span>
            </div>
            <p className="text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Năm học {classData.academicYear}
            </p>
          </div>
          <Link
            to={`/classes/${classData.id}/edit`}
            className="bg-emerald-50 text-emerald-600 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-100 transition"
          >
            <Edit className="w-4 h-4" /> Sửa thông tin
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-50 p-5 rounded-2xl">
            <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4" /> Khối Lớp
            </p>
            <p className="font-bold text-slate-800">{classData.gradeLevel}</p>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-2xl">
            <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Phòng học
            </p>
            <p className="font-bold text-slate-800">{classData.roomNumber || 'Chưa xếp phòng'}</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl md:col-span-2">
            <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Giáo viên chủ nhiệm
            </p>
            <p className="font-bold text-slate-800">{classData.mainTeacher?.fullName || 'Chưa phân công'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
