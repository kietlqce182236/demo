import React, { useEffect } from 'react';
import { ClassForm } from '../components/ClassForm';
import { useParams, useNavigate } from 'react-router-dom';
import { useClass } from '../hooks/useClasses';
import { ClassesPage } from './ClassesPage';

export const EditClassPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useClass(id as string);
  const navigate = useNavigate();

  // Prevent scrolling on body when drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      <ClassesPage />

      {/* Drawer Overlay */}
      <div className="fixed inset-0 z-50 flex justify-end">
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
          onClick={() => navigate('/classes')}
        ></div>

        <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto border-l border-slate-200">
          <div className="p-8">
            {isLoading ? (
              <div className="p-20 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-medium">Đang tải dữ liệu lớp học...</p>
              </div>
            ) : (
              <ClassForm isEdit={true} initialData={data} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
