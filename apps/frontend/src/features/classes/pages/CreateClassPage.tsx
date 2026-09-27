import React, { useEffect } from 'react';
import { ClassForm } from '../components/ClassForm';
import { ClassesPage } from './ClassesPage';
import { useNavigate } from 'react-router-dom';

export const CreateClassPage = () => {
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
      {/* Nền ở dưới: Giữ lại trang danh sách lớp học */}
      <ClassesPage />

      {/* Drawer Overlay */}
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop (Dark area) */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
          onClick={() => navigate('/classes')}
        ></div>

        {/* Sliding Drawer Container */}
        <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto border-l border-slate-200">
          <div className="p-8">
            <ClassForm isEdit={false} />
          </div>
        </div>
      </div>
    </>
  );
};
