import React, { useState, useEffect } from 'react';
import { parentEvaluationApi } from './api/parentEvaluationApi';
import { ParentPortalData, SubmitEvaluationPayload } from './types';
import { ParentPortalTopNav } from './components/ParentPortalTopNav';
import { ChildInfoStrip } from './components/ChildInfoStrip';
import { HeroEvaluationHeader } from './components/HeroEvaluationHeader';
import { QuickMealEvaluationForm } from './components/QuickMealEvaluationForm';
import { SchoolProposalForm } from './components/SchoolProposalForm';
import { NutritionStandardBanner } from './components/NutritionStandardBanner';
import { SchoolFeedbackHistory } from './components/SchoolFeedbackHistory';
import { PortalFooter } from './components/PortalFooter';
import { Loader2 } from 'lucide-react';

export const SubmitMealEvaluationPage: React.FC = () => {
  const [data, setData] = useState<ParentPortalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load real database data for portal
  const loadPortalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await parentEvaluationApi.getPortalData();
      setData(res);
    } catch (err: any) {
      console.error('Error fetching portal data:', err);
      setError(err.message || 'Không thể tải dữ liệu từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  // Handle Quick Meal Evaluation submit
  const handleQuickEvaluationSubmit = async (formData: {
    rating: number;
    content: string;
    isDrafting: boolean;
    attributes: {
      taste: string;
      allergy: string;
      portion: string;
    };
  }) => {
    if (!data) return;
    const currentChild = data.child || (data as any).childProfile || {
      id: '1',
      name: 'Bé Nguyễn Bảo Nam',
      parentName: 'Chị Hoàng Yến',
      className: 'Lớp Mầm 1',
    };
    setIsSubmitting(true);
    try {
      const payload: SubmitEvaluationPayload = {
        childId: currentChild.id,
        evaluationType: 'QUICK_EVALUATION',
        rating: formData.rating,
        content: formData.content,
        isDrafting: formData.isDrafting,
        parentNameCustom: currentChild.parentName,
        childNameCustom: currentChild.name,
        classNameCustom: currentChild.className,
        attributes: formData.attributes,
        feedbackDate: new Date().toISOString().split('T')[0],
      };
      await parentEvaluationApi.submitEvaluation(payload);
      // Refresh real database data
      await loadPortalData();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle School Proposal submit
  const handleSchoolProposalSubmit = async (formData: {
    category: string;
    title: string;
    content: string;
    isAnonymous: boolean;
    photos?: string[];
  }) => {
    if (!data) return;
    const currentChild = data.child || (data as any).childProfile || {
      id: '1',
      name: 'Bé Nguyễn Bảo Nam',
      parentName: 'Chị Hoàng Yến',
      className: 'Lớp Mầm 1',
    };
    setIsSubmitting(true);
    try {
      const payload: SubmitEvaluationPayload = {
        childId: currentChild.id,
        evaluationType: 'SCHOOL_PROPOSAL',
        category: formData.category,
        title: formData.title,
        content: formData.content,
        isAnonymous: formData.isAnonymous,
        photos: formData.photos,
        parentNameCustom: currentChild.parentName,
        childNameCustom: currentChild.name,
        classNameCustom: currentChild.className,
      };
      await parentEvaluationApi.submitEvaluation(payload);
      // Refresh real database data
      await loadPortalData();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-700">
          Đang tải dữ liệu thực từ cơ sở dữ liệu KidMeal...
        </p>
        <p className="text-xs text-slate-500 mt-1">Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl max-w-md">
          <p className="text-sm font-bold text-red-800">Không thể kết nối đến máy chủ</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          <button
            onClick={loadPortalData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const child = data.child || (data as any).childProfile || {
    id: '1',
    name: 'Bé Nguyễn Bảo Nam',
    age: 4,
    className: 'Lớp Mầm 1',
    gradeLevel: 'Mẫu giáo (4–5T)',
    weight: 16.5,
    height: 104.2,
    allergyWarning: '',
    parentName: 'Chị Hoàng Yến',
    parentRole: 'Mẹ bé',
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased">
      {/* 1. Top Navigation Bar */}
      <ParentPortalTopNav child={child} />

      {/* 2. Sub-Header Child Profile & Allergy Strip */}
      <ChildInfoStrip child={child} />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 3. Hero Header with Quote & KPI Highlights */}
        <HeroEvaluationHeader stats={data.stats} />

        {/* 4. Two-Column Evaluation Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left: Quick Meal Evaluation Form */}
          <QuickMealEvaluationForm
            child={child}
            todayMeal={data.todayMeal}
            onSubmit={handleQuickEvaluationSubmit}
            isSubmitting={isSubmitting}
          />

          {/* Right: School Proposal & Feedback Form */}
          <SchoolProposalForm
            child={child}
            onSubmit={handleSchoolProposalSubmit}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* 5. Middle National Nutrition Standard Banner */}
        <NutritionStandardBanner todayMeal={data.todayMeal} />

        {/* 6. Bottom Feedback Log & Responses History */}
        <SchoolFeedbackHistory
          history={data.history}
          parentName={child.parentName}
        />
      </main>

      {/* 7. Footer */}
      <PortalFooter />
    </div>
  );
};
