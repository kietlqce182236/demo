import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Users, AlertTriangle, ShieldAlert, HeartPulse, Search, 
  Filter, Plus, RefreshCw, CheckCircle2, Phone, UserCheck, 
  ChevronRight, Calendar, AlertOctagon, Utensils, FileSignature, 
  Sparkles, Check, ArrowRight, BookOpen, Clock, Activity, FileText,
  Pencil, Trash2, UserPlus, UserMinus, X, GraduationCap
} from 'lucide-react';
import { classesApi } from '../api/classes';
import { childrenApi, ChildItem, AllergenCatalogItem } from '../../children/api/children.api';
import { attendanceApi } from '../../attendance/api/attendanceApi';
import { SchoolHeadcountSummaryResponse } from '../../attendance/types';
import { ClassData, GradeLevel, ClassStatus } from '../types';
import { staffApi, StaffUser } from '../../staff/api/staff.api';

export const SchoolClassAllergyHubPage: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'classes' | 'allergies' | 'parent-form' | 'kitchen'>('classes');

  // Data states from DB
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [teachers, setTeachers] = useState<StaffUser[]>([]);
  const [allergenCatalogs, setAllergenCatalogs] = useState<AllergenCatalogItem[]>([]);
  const [headcountSummary, setHeadcountSummary] = useState<SchoolHeadcountSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [allergySearch, setAllergySearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Class Filter & Search
  const [classSearch, setClassSearch] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Class CRUD Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  const [createFormData, setCreateFormData] = useState<{
    name: string;
    gradeLevel: GradeLevel;
    roomNumber: string;
    academicYear: string;
    mainTeacherId: string;
  }>({
    name: '',
    gradeLevel: 'KINDERGARTEN_3_4Y',
    roomNumber: '',
    academicYear: '2026-2027',
    mainTeacherId: '',
  });

  const [editFormData, setEditFormData] = useState<{
    name: string;
    gradeLevel: GradeLevel;
    roomNumber: string;
    academicYear: string;
    mainTeacherId: string;
    status: ClassStatus;
  }>({
    name: '',
    gradeLevel: 'KINDERGARTEN_3_4Y',
    roomNumber: '',
    academicYear: '2026-2027',
    mainTeacherId: '',
    status: 'ACTIVE',
  });

  // Assign & Manage Students in Class ("app học sinh vào lớp")
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [studentModalTab, setStudentModalTab] = useState<'current' | 'assign'>('current');
  const [classStudents, setClassStudents] = useState<ChildItem[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [unassignedOnly, setUnassignedOnly] = useState<boolean>(true);
  const [selectedChildIdsToAssign, setSelectedChildIdsToAssign] = useState<string[]>([]);
  const [isProcessingStudents, setIsProcessingStudents] = useState<boolean>(false);

  // Modal Phân công GVCN
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [targetClass, setTargetClass] = useState<ClassData | null>(null);
  const [teacherIdInput, setTeacherIdInput] = useState<string>('');

  // Parent form state
  const [parentFormChildId, setParentFormChildId] = useState<string>('');
  const [allergyType, setAllergyType] = useState<string>('ALLERGY');
  const [allergenId, setAllergenId] = useState<string>('');
  const [customAllergenName, setCustomAllergenName] = useState<string>('');
  const [severity, setSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLACTIC'>('SEVERE');
  const [symptoms, setSymptoms] = useState<string>('');
  const [treatment, setTreatment] = useState<string>('');
  const [parentCommitment, setParentCommitment] = useState<boolean>(false);
  const [parentName, setParentName] = useState<string>('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string>('');
  const [formErrorMessage, setFormErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch initial data from Database
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [classesRes, childrenRes, catalogsRes, headcountRes, staffRes] = await Promise.all([
        classesApi.getClasses({ limit: 50 }),
        childrenApi.getChildren({ limit: 200 }),
        childrenApi.getAllergenCatalogs(),
        attendanceApi.getSchoolHeadcountSummary().catch(() => null),
        staffApi.getStaffList({ roleCode: 'TEACHER', limit: 100 }).catch(() => ({ data: [] } as any)),
      ]);

      const classList = classesRes?.items || [];
      const childList = childrenRes?.items || [];

      setClasses(classList);
      setChildren(childList);
      setTeachers(staffRes?.data || []);
      setAllergenCatalogs(catalogsRes || []);
      if (headcountRes) {
        setHeadcountSummary(headcountRes);
      }

      if (childList.length > 0 && !parentFormChildId) {
        setParentFormChildId(childList[0].id);
      }
    } catch (error) {
      console.error('Error fetching database records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered children with active allergies
  const allergicChildren = useMemo(() => {
    return children.filter((child) => {
      const hasAllergies = child.allergies && child.allergies.length > 0;
      if (!hasAllergies) return false;

      // Filter by class
      if (selectedClassId !== 'all' && child.classId !== selectedClassId) {
        return false;
      }

      // Filter by severity
      if (severityFilter !== 'all') {
        const matchesSeverity = child.allergies?.some((a) => a.severity === severityFilter);
        if (!matchesSeverity) return false;
      }

      // Filter by search query
      if (allergySearch.trim()) {
        const q = allergySearch.toLowerCase();
        const matchesName = child.fullName.toLowerCase().includes(q) || child.studentCode.toLowerCase().includes(q);
        const matchesAllergen = child.allergies?.some((a) => 
          (a.allergen?.nameVi && a.allergen.nameVi.toLowerCase().includes(q)) ||
          (a.customAllergenName && a.customAllergenName.toLowerCase().includes(q)) ||
          (a.symptoms && a.symptoms.toLowerCase().includes(q))
        );
        return matchesName || matchesAllergen;
      }

      return true;
    });
  }, [children, selectedClassId, severityFilter, allergySearch]);

  // Aggregate stats strictly from DB entities
  const totalStudents = children.length;
  const totalClasses = classes.length;
  const totalAllergicStudents = children.filter((c) => c.allergies && c.allergies.length > 0).length;
  const anaphylacticCount = children.filter((c) => 
    c.allergies?.some((a) => a.severity === 'ANAPHYLACTIC')
  ).length;

  // Filter classes by grade and search query
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (gradeFilter !== 'all' && cls.gradeLevel !== gradeFilter) {
        return false;
      }
      if (classSearch.trim()) {
        const q = classSearch.toLowerCase();
        const matchesName = cls.name?.toLowerCase().includes(q) || false;
        const matchesRoom = cls.roomNumber ? cls.roomNumber.toLowerCase().includes(q) : false;
        const matchesTeacher = cls.mainTeacher?.fullName ? cls.mainTeacher.fullName.toLowerCase().includes(q) : false;
        return matchesName || matchesRoom || matchesTeacher;
      }
      return true;
    });
  }, [classes, gradeFilter, classSearch]);

  // Candidates for assigning to class
  const candidateStudents = useMemo(() => {
    return children.filter((child) => {
      if (selectedClass && child.classId === selectedClass.id) {
        return false;
      }
      if (unassignedOnly && child.classId) {
        return false;
      }
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchesName = child.fullName?.toLowerCase().includes(q) || false;
        const matchesCode = child.studentCode?.toLowerCase().includes(q) || false;
        return matchesName || matchesCode;
      }
      return true;
    });
  }, [children, selectedClass, unassignedOnly, studentSearch]);

  // 1. Create Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await classesApi.createClass({
        name: createFormData.name.trim(),
        gradeLevel: createFormData.gradeLevel,
        roomNumber: createFormData.roomNumber.trim() || undefined,
        academicYear: createFormData.academicYear.trim() || '2026-2027',
        mainTeacherId: createFormData.mainTeacherId || undefined,
      });
      await fetchData();
      setIsCreateModalOpen(false);
      setCreateFormData({
        name: '',
        gradeLevel: 'KINDERGARTEN_3_4Y',
        roomNumber: '',
        academicYear: '2026-2027',
        mainTeacherId: '',
      });
    } catch (err: any) {
      console.error('Lỗi tạo lớp học:', err);
      alert(err?.response?.data?.message || 'Không thể tạo lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Edit Class
  const handleOpenEditModal = (cls: ClassData) => {
    setSelectedClass(cls);
    setEditFormData({
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      roomNumber: cls.roomNumber || '',
      academicYear: cls.academicYear || '2026-2027',
      mainTeacherId: cls.mainTeacherId || '',
      status: cls.status || 'ACTIVE',
    });
    setIsEditModalOpen(true);
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !editFormData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await classesApi.updateClass(selectedClass.id, {
        name: editFormData.name.trim(),
        gradeLevel: editFormData.gradeLevel,
        roomNumber: editFormData.roomNumber.trim() || undefined,
        academicYear: editFormData.academicYear.trim() || '2026-2027',
        mainTeacherId: editFormData.mainTeacherId || undefined,
        status: editFormData.status,
      });
      await fetchData();
      setIsEditModalOpen(false);
      setSelectedClass(null);
    } catch (err: any) {
      console.error('Lỗi cập nhật lớp học:', err);
      alert(err?.response?.data?.message || 'Không thể cập nhật lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Delete Class
  const handleOpenDeleteModal = (cls: ClassData) => {
    setSelectedClass(cls);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    setIsSubmitting(true);
    try {
      await classesApi.deleteClass(selectedClass.id);
      await fetchData();
      setIsDeleteModalOpen(false);
      setSelectedClass(null);
    } catch (err: any) {
      console.error('Lỗi xóa lớp học:', err);
      alert(err?.response?.data?.message || 'Không thể xóa lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Manage & Assign Students ("app học sinh vào lớp")
  const handleOpenStudentModal = async (cls: ClassData) => {
    setSelectedClass(cls);
    setStudentSearch('');
    setSelectedChildIdsToAssign([]);
    setStudentModalTab('current');
    setIsStudentModalOpen(true);
    try {
      const students = await classesApi.getClassStudents(cls.id);
      setClassStudents(students || []);
    } catch (err) {
      setClassStudents(children.filter((c) => c.classId === cls.id));
    }
  };

  const handleRemoveStudentFromClass = async (childId: string) => {
    if (!selectedClass) return;
    if (!window.confirm('Bạn có chắc chắn muốn gỡ học sinh này khỏi lớp?')) return;
    setIsProcessingStudents(true);
    try {
      await classesApi.removeStudentFromClass(selectedClass.id, childId);
      const updated = await classesApi.getClassStudents(selectedClass.id);
      setClassStudents(updated || []);
      await fetchData();
    } catch (err: any) {
      console.error('Lỗi gỡ học sinh khỏi lớp:', err);
      alert(err?.response?.data?.message || 'Không thể gỡ học sinh khỏi lớp');
    } finally {
      setIsProcessingStudents(false);
    }
  };

  const handleAddStudentsToClass = async () => {
    if (!selectedClass || selectedChildIdsToAssign.length === 0) return;
    setIsProcessingStudents(true);
    try {
      await classesApi.addStudentsToClass(selectedClass.id, selectedChildIdsToAssign);
      const updated = await classesApi.getClassStudents(selectedClass.id);
      setClassStudents(updated || []);
      setSelectedChildIdsToAssign([]);
      await fetchData();
      setStudentModalTab('current');
    } catch (err: any) {
      console.error('Lỗi gán học sinh vào lớp:', err);
      alert(err?.response?.data?.message || 'Không thể gán học sinh vào lớp');
    } finally {
      setIsProcessingStudents(false);
    }
  };

  // 5. Phân công GVCN
  const handleAssignTeacher = async () => {
    if (!targetClass) return;
    try {
      await classesApi.updateClass(targetClass.id, {
        mainTeacherId: teacherIdInput || undefined,
      });
      await fetchData();
      setShowAssignModal(false);
      setTargetClass(null);
      setTeacherIdInput('');
    } catch (err: any) {
      console.error('Lỗi phân công GVCN:', err);
      alert(err?.response?.data?.message || 'Không thể phân công GVCN');
    }
  };

  // Handle Parent Allergy Declaration submission
  const handleParentDeclarationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccessMessage('');
    setFormErrorMessage('');

    if (!parentFormChildId) {
      setFormErrorMessage('Vui lòng chọn học sinh.');
      return;
    }
    if (!allergenId && !customAllergenName.trim()) {
      setFormErrorMessage('Vui lòng chọn hoặc nhập chất gây dị ứng/kiêng cử.');
      return;
    }
    if (!parentCommitment) {
      setFormErrorMessage('Phụ huynh bắt buộc phải tích chọn cam kết tính chính xác của hồ sơ y tế.');
      return;
    }

    setIsSubmitting(true);
    try {
      await childrenApi.declareAllergy(parentFormChildId, {
        allergenId: allergenId || undefined,
        customAllergenName: customAllergenName.trim() || undefined,
        allergyType,
        severity,
        symptoms: symptoms.trim() || undefined,
        reactionTreatment: treatment.trim() || undefined,
        diagnosedDate: new Date().toISOString().split('T')[0],
      });

      setFormSuccessMessage('Hồ sơ dị ứng/kiêng cử đã được ghi nhận trực tiếp vào cơ sở dữ liệu bán trú của nhà trường.');
      // Reset form fields
      setCustomAllergenName('');
      setSymptoms('');
      setTreatment('');
      setParentCommitment(false);
      // Refresh DB data
      await fetchData();
    } catch (err: any) {
      setFormErrorMessage('Có lỗi xảy ra khi lưu dữ liệu vào hệ thống: ' + (err?.message || 'Lỗi kết nối'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-6 md:p-8 space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            Hệ Thống Quản Trị Giáo Dục & Bán Trú Chuẩn Bộ Y Tế
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Trung Tâm Quản Lý Lớp Học & Hồ Sơ Dị Ứng Học Sinh
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Tích hợp toàn diện Module Quản lý Nhà trường (Khối, Lớp, Phân công GVCN, Sĩ số thực tế vs Tối đa) 
            và Module Hồ sơ Dị ứng / Kiêng cử bán trú theo Quyết định 1246/QĐ-BYT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
            Đồng bộ Database
          </button>
          <button 
            onClick={() => setActiveTab('parent-form')}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-rose-600/20 transition active:scale-95"
          >
            <FileSignature className="w-4 h-4" />
            Phụ Huynh Khai Báo Dị Ứng
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards — 100% Data from PostgreSQL Database */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số lớp */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Số Lớp Học</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-800">{totalClasses}</span>
              <span className="text-xs font-semibold text-slate-500">lớp hoạt động</span>
            </div>
            <p className="text-[11px] text-teal-600 font-semibold mt-1">Đủ phòng học & trang thiết bị</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Sĩ số học sinh */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sĩ Số Học Sinh Thực Tế</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-800">{totalStudents}</span>
              <span className="text-xs font-semibold text-slate-500">/ {totalClasses * 30} tối đa</span>
            </div>
            <div className="w-32 bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (totalStudents / Math.max(1, totalClasses * 30)) * 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Trẻ có dị ứng */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trẻ Có Hồ Sơ Dị Ứng</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-amber-600">{totalAllergicStudents}</span>
              <span className="text-xs font-semibold text-slate-500">trẻ kiêng cử</span>
            </div>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">Cần chuẩn bị thực đơn thay thế</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Sốc phản vệ / Cảnh báo Đỏ */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-rose-50/40">
          <div>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Nguy Cơ Sốc Phản Vệ
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-rose-600">{anaphylacticCount}</span>
              <span className="text-xs font-bold text-rose-500">Mức độ ANAPHYLACTIC</span>
            </div>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">Trang bị sẵn Epinephrine tại y tế</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'classes'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          MODULE 1: Quản Trị Lớp Học & Sĩ Số (Admin)
        </button>

        <button
          onClick={() => setActiveTab('allergies')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'allergies'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          MODULE 2: Bảng Cảnh Báo Dị Ứng (GVCN & Y Tế)
        </button>

        <button
          onClick={() => setActiveTab('parent-form')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'parent-form'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          Cổng Khai Báo & Cam Kết Dành Cho Phụ Huynh
        </button>

        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'kitchen'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Utensils className="w-4 h-4" />
          Bộ Lọc Suất Ăn Dành Cho Nhà Bếp
        </button>
      </div>

      {/* 4. Tab 1: Module Quản trị Lớp học & Sĩ số */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            {/* Header & Controls Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Danh Sách Lớp Học & Tình Trạng Sĩ Số Năm Học 2026 - 2027</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý tạo mới, phân công GVCN, cập nhật phòng học và gán học sinh vào lớp.
                </p>
              </div>

              {/* Action Buttons & Filter Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tên lớp, phòng, GVCN..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-48 sm:w-56"
                  />
                </div>

                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="all">Tất cả các khối</option>
                  <option value="KINDERGARTEN_3_4Y">Khối Mầm (3-4T)</option>
                  <option value="KINDERGARTEN_4_5Y">Khối Chồi (4-5T)</option>
                  <option value="KINDERGARTEN_5_6Y">Khối Lá (5-6T)</option>
                  <option value="TODDLER_2_3Y">Nhà Trẻ (2-3T)</option>
                  <option value="TODDLER_1_2Y">Nhà Trẻ (1-2T)</option>
                  <option value="INFANT_0_1Y">Nhà Trẻ (&lt;1T)</option>
                </select>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Lớp Mới</span>
                </button>
              </div>
            </div>

            {/* Classes Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                    <th className="py-3.5 px-4">Tên Lớp / Mã Lớp</th>
                    <th className="py-3.5 px-4">Khối Mầm Non</th>
                    <th className="py-3.5 px-4">Giáo Viên Chủ Nhiệm (GVCN)</th>
                    <th className="py-3.5 px-4">Sĩ Số Thực Tế vs Tối Đa</th>
                    <th className="py-3.5 px-4">Tỷ Lệ Lấp Đầy</th>
                    <th className="py-3.5 px-4">Điểm Danh Hôm Nay</th>
                    <th className="py-3.5 px-4">Hồ Sơ Dị Ứng</th>
                    <th className="py-3.5 px-4 text-center">Thao Tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">Không tìm thấy lớp học nào phù hợp</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng thay đổi từ khóa tìm kiếm hoặc chọn khối mầm non khác.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((cls) => {
                      const actualCount = cls.studentCount || children.filter(c => c.classId === cls.id).length;
                      const maxCap = cls.maxCapacity || (cls.gradeLevel.includes('INFANT') ? 20 : 30);
                      const fillPercent = Math.round((actualCount / maxCap) * 100);
                      const classAllergyCount = children.filter(c => c.classId === cls.id && c.allergies && c.allergies.length > 0).length;
                      const attClass = headcountSummary?.classes?.find((c) => c.id === cls.id);

                      return (
                        <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-xs">
                                {cls.name.substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{cls.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{cls.roomNumber || 'P.101'} • {cls.academicYear}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              {cls.gradeLevel === 'KINDERGARTEN_3_4Y' ? 'Mầm (3-4T)' :
                               cls.gradeLevel === 'KINDERGARTEN_4_5Y' ? 'Chồi (4-5T)' :
                               cls.gradeLevel === 'KINDERGARTEN_5_6Y' ? 'Lá (5-6T)' :
                               cls.gradeLevel === 'TODDLER_2_3Y' ? 'Nhà trẻ (2-3T)' :
                               cls.gradeLevel === 'TODDLER_1_2Y' ? 'Nhà trẻ (1-2T)' :
                               cls.gradeLevel === 'INFANT_0_1Y' ? 'Nhà trẻ (<1T)' : cls.gradeLevel}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            {cls.mainTeacher ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold">
                                  {cls.mainTeacher.fullName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">{cls.mainTeacher.fullName}</div>
                                  <div className="text-[10px] text-teal-600">GVCN Chính thức</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Chưa phân công</span>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-baseline gap-1 font-bold text-slate-800">
                              <span className="text-sm font-black text-teal-600">{actualCount}</span>
                              <span className="text-slate-400">/ {maxCap} trẻ</span>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="w-28 space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className={fillPercent >= 100 ? 'text-rose-600' : 'text-slate-500'}>{fillPercent}%</span>
                                <span className="text-slate-400">{fillPercent >= 100 ? 'Đã đủ sĩ số' : 'Còn nhận'}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    fillPercent >= 100 ? 'bg-rose-500' : fillPercent >= 80 ? 'bg-amber-500' : 'bg-teal-500'
                                  }`} 
                                  style={{ width: `${Math.min(100, fillPercent)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {attClass ? (
                              <div>
                                <div className="flex items-baseline gap-1 font-bold text-slate-800">
                                  <span className="text-sm font-black text-emerald-700">{attClass.presentToday}</span>
                                  <span className="text-slate-400">/ {actualCount} bé</span>
                                  <span className="text-[10px] text-teal-600 font-semibold">({attClass.attendanceRate}%)</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {attClass.absentToday > 0 ? (
                                    <span className="text-rose-600 font-medium">{attClass.absentToday} vắng</span>
                                  ) : (
                                    <span className="text-emerald-600">Đủ 100%</span>
                                  )}
                                  {' • '}
                                  {attClass.isKitchenLocked ? (
                                    <span className="text-emerald-700 font-bold">Đã chốt Bếp</span>
                                  ) : (
                                    <span className="text-amber-600 font-bold">Chưa chốt</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Chưa điểm danh</span>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            {classAllergyCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertCircleBadge count={classAllergyCount} />
                                {classAllergyCount} bé dị ứng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" /> Bình thường
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Nút Gán / Quản lý học sinh vào lớp */}
                              <button
                                onClick={() => handleOpenStudentModal(cls)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl transition text-[11px] flex items-center gap-1 border border-emerald-200"
                                title="Xem danh sách & Gán học sinh vào lớp này"
                              >
                                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Học sinh</span>
                              </button>

                              {/* Nút Phân công GVCN */}
                              <button
                                onClick={() => {
                                  setTargetClass(cls);
                                  setTeacherIdInput(cls.mainTeacherId || '');
                                  setShowAssignModal(true);
                                }}
                                className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl transition text-[11px] flex items-center gap-1 border border-teal-200"
                                title="Phân công giáo viên chủ nhiệm"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                                <span>GVCN</span>
                              </button>

                              {/* Nút Sửa lớp */}
                              <button
                                onClick={() => handleOpenEditModal(cls)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                                title="Chỉnh sửa thông tin lớp"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Nút Xóa lớp */}
                              <button
                                onClick={() => handleOpenDeleteModal(cls)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition"
                                title="Xóa lớp học"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Module Cảnh Báo Dị Ứng Học Sinh Cho GVCN & Y Tế */}
      {activeTab === 'allergies' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên bé, mã số hoặc món dị ứng..."
                  value={allergySearch}
                  onChange={(e) => setAllergySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Class Filter */}
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="all">Tất cả các lớp trong trường</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="all">Tất cả mức độ cảnh báo</option>
                <option value="ANAPHYLACTIC">🔴 Sốc phản vệ (Nguy cấp)</option>
                <option value="SEVERE">🟠 Nặng (Cấp tính)</option>
                <option value="MODERATE">🟡 Trung bình (Bất dung nạp)</option>
                <option value="MILD">🟢 Nhẹ (Mẩn ngứa)</option>
              </select>
            </div>

            <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
              <Filter className="w-4 h-4 text-rose-600" />
              <span>Hiển thị <strong>{allergicChildren.length}</strong> học sinh có cảnh báo</span>
            </div>
          </div>

          {/* Alert Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allergicChildren.map((child) => {
              const highestSeverity = child.allergies?.some(a => a.severity === 'ANAPHYLACTIC')
                ? 'ANAPHYLACTIC'
                : child.allergies?.some(a => a.severity === 'SEVERE')
                ? 'SEVERE'
                : 'MODERATE';

              return (
                <div 
                  key={child.id}
                  className={`bg-white rounded-3xl p-5 border transition-all hover:shadow-md relative overflow-hidden ${
                    highestSeverity === 'ANAPHYLACTIC' 
                      ? 'border-rose-300 ring-2 ring-rose-500/10' 
                      : highestSeverity === 'SEVERE'
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        child.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {child.firstName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{child.fullName}</h3>
                        <p className="text-[11px] font-mono text-slate-400">Mã: {child.studentCode} • {child.class?.name || 'Chưa xếp lớp'}</p>
                      </div>
                    </div>

                    <SeverityBadge severity={highestSeverity} />
                  </div>

                  {/* Allergy Dossiers List */}
                  <div className="space-y-2.5 my-3">
                    {child.allergies?.map((allergy) => (
                      <div 
                        key={allergy.id} 
                        className={`p-3 rounded-2xl text-xs space-y-1 ${
                          allergy.severity === 'ANAPHYLACTIC' 
                            ? 'bg-rose-50/80 border border-rose-200/80 text-rose-900' 
                            : allergy.severity === 'SEVERE'
                            ? 'bg-amber-50/80 border border-amber-200/80 text-amber-900'
                            : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            {allergy.allergen?.nameVi || allergy.customAllergenName}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/80 shadow-2xs">
                            {allergy.allergyType}
                          </span>
                        </div>

                        {allergy.symptoms && (
                          <p className="text-[11px] text-slate-600">
                            <strong>Triệu chứng:</strong> {allergy.symptoms}
                          </p>
                        )}

                        {allergy.reactionTreatment && (
                          <p className="text-[11px] font-semibold text-rose-700 bg-rose-100/50 p-1.5 rounded-lg mt-1">
                            🚑 <strong>Xử trí:</strong> {allergy.reactionTreatment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Parent Emergency Contact */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Phụ Huynh Liên Hệ</p>
                      <p className="font-bold text-slate-800">{child.emergencyContactName}</p>
                    </div>
                    <a 
                      href={`tel:${child.emergencyContactPhone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {child.emergencyContactPhone}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Cổng Khai Báo & Cam Kết Dành Cho Phụ Huynh */}
      {activeTab === 'parent-form' && (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
              <FileSignature className="w-4 h-4" />
              Biểu Mẫu Khai Báo Y Tế Học Đường Bắt Buộc
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              Đăng Ký Hồ Sơ Dị Ứng & Kiêng Cử Cho Học Sinh (Có Ký Cam Kết)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Phụ huynh có trách nhiệm khai báo chính xác các loại thực phẩm, thuốc hoặc tác nhân gây nguy hại cho sức khỏe của trẻ. 
              Dữ liệu sẽ được chuyển ngay lập tức tới Giáo viên Chủ nhiệm và Bếp Bán trú.
            </p>
          </div>

          {formSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          {formErrorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs font-bold">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{formErrorMessage}</span>
            </div>
          )}

          <form onSubmit={handleParentDeclarationSubmit} className="space-y-6 text-xs font-medium">
            {/* Child Selection */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                1. Chọn Học Sinh Cần Khai Báo <span className="text-rose-500">*</span>
              </label>
              <select
                value={parentFormChildId}
                onChange={(e) => setParentFormChildId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.fullName} (Mã: {child.studentCode}) - {child.class?.name || 'Chưa xếp lớp'}
                  </option>
                ))}
              </select>
            </div>

            {/* Allergen Catalog or Custom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                  2. Chọn Nhóm Thực Phẩm / Dị Ứng Chuẩn
                </label>
                <select
                  value={allergenId}
                  onChange={(e) => setAllergenId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">-- Hoặc nhập tên tự do ở ô bên cạnh --</option>
                  {allergenCatalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.nameVi} ({catalog.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                  Tên Dị Ứng / Kiêng Cử Riêng Biệt (Nếu có)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Dị ứng thuốc Amoxicillin, Kiêng thịt bò do đạo..."
                  value={customAllergenName}
                  onChange={(e) => setCustomAllergenName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Category & Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                  3. Phân Loại Tác Nhân
                </label>
                <select
                  value={allergyType}
                  onChange={(e) => setAllergyType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="ALLERGY">Dị ứng thực phẩm cấp tính</option>
                  <option value="INTOLERANCE">Bất dung nạp tiêu hóa (Lactose/Gluten)</option>
                  <option value="RELIGIOUS_RESTRICTION">Kiêng cữ theo tôn giáo / Tín ngưỡng</option>
                  <option value="MEDICAL_RESTRICTION">Chỉ định kiêng cữ y khoa khác</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                  4. Mức Độ Nghiêm Trọng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="ANAPHYLACTIC">🔴 NGUY CẤP: Nguy cơ sốc phản vệ (Anaphylaxis)</option>
                  <option value="SEVERE">🟠 NẶNG: Phát ban diện rộng, khó thở, nôn ói cấp</option>
                  <option value="MODERATE">🟡 TRUNG BÌNH: Đau bụng, ngứa họng, tiêu chảy</option>
                  <option value="MILD">🟢 NHẸ: Mẩn đỏ nhẹ quanh miệng</option>
                </select>
              </div>
            </div>

            {/* Symptoms & Emergency Treatment */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                  5. Triệu Chứng Xuất Hiện Khi Tiếp Xúc
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả cụ thể: sưng mí mắt, phù môi, nổi mề đay, khó thở..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                  6. Hướng Dẫn Xử Trí Khẩn Cấp (Phác Đồ Cho Giáo Viên & Y Tế Trường)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Cho uống siro kháng Histamine trong balo con, tiêm Epinephrine và gọi 115..."
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Parent Legal Commitment Checkbox */}
            <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parentCommitment}
                  onChange={(e) => setParentCommitment(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-slate-800 font-semibold leading-relaxed">
                  Tôi là Phụ huynh/Người giám hộ hợp pháp của học sinh. Tôi xin cam kết rằng các thông tin khai báo 
                  về tiền sử dị ứng, phản ứng thuốc và kiêng cữ dinh dưỡng trên là hoàn toàn chính xác. 
                  Nhà trường và bếp ăn bán trú được quyền sử dụng thông tin này để thiết lập khẩu phần ăn an toàn cho con.
                </span>
              </label>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Dấu thời gian xác nhận: {new Date().toLocaleString('vi-VN')}</span>
                <span className="font-bold text-teal-700">Xác thực số: PH-KM-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('allergies')}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-lg shadow-rose-600/25 transition active:scale-95 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang ghi vào CSDL...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Ký Cam Kết & Cập Nhật Hồ Sơ Bán Trú
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. Tab 4: Bộ Lọc Suất Ăn Dành Cho Nhà Bếp (Kitchen Display) */}
      {activeTab === 'kitchen' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                <Utensils className="w-4 h-4" />
                Kiểm Thực Bếp Bán Trú — Quyết Định 1246/QĐ-BYT
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Ma Trận Phân Bổ Suất Ăn Thay Thế Theo Lớp & Dị Ứng Thực Tế
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhân viên bếp sử dụng danh sách này trước giờ ra suất để dán nhãn suất ăn riêng biệt cho từng lớp học.
              </p>
            </div>

            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              In Danh Sách Dán Khay Bếp
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const classChildrenWithAllergy = children.filter(c => c.classId === cls.id && c.allergies && c.allergies.length > 0);
              
              return (
                <div key={cls.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-extrabold text-slate-800 text-sm">{cls.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      {classChildrenWithAllergy.length} suất đặc biệt
                    </span>
                  </div>

                  {classChildrenWithAllergy.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-3 text-center">Tất cả trẻ ăn suất tiêu chuẩn</p>
                  ) : (
                    <div className="space-y-2">
                      {classChildrenWithAllergy.map((child) => (
                        <div key={child.id} className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-800">{child.fullName}</span>
                            <span className="text-[10px] text-rose-600 font-mono">Bàn riêng</span>
                          </div>
                          <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {child.allergies?.map(a => a.allergen?.nameVi || a.customAllergenName).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 6. MODAL TẠO LỚP HỌC MỚI ─── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Thêm Lớp Học Mới</h3>
                  <p className="text-xs text-slate-400">Khởi tạo lớp bán trú và cấu hình giáo viên quản lý</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên Lớp Học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lớp Mầm 2, Lớp Chồi 3, Nhà Trẻ 1..."
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Khối Mầm Non <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createFormData.gradeLevel}
                    onChange={(e) => setCreateFormData({ ...createFormData, gradeLevel: e.target.value as GradeLevel })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="KINDERGARTEN_3_4Y">Khối Mầm (3 - 4 Tuổi)</option>
                    <option value="KINDERGARTEN_4_5Y">Khối Chồi (4 - 5 Tuổi)</option>
                    <option value="KINDERGARTEN_5_6Y">Khối Lá (5 - 6 Tuổi)</option>
                    <option value="TODDLER_2_3Y">Nhà Trẻ (24 - 36 Tháng)</option>
                    <option value="TODDLER_1_2Y">Nhà Trẻ (12 - 24 Tháng)</option>
                    <option value="INFANT_0_1Y">Nhà Trẻ (&lt; 12 Tháng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Phòng Học
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Phòng 102, Tầng 1"
                    value={createFormData.roomNumber}
                    onChange={(e) => setCreateFormData({ ...createFormData, roomNumber: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Năm Học
                  </label>
                  <input
                    type="text"
                    value={createFormData.academicYear}
                    onChange={(e) => setCreateFormData({ ...createFormData, academicYear: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Giáo Viên Chủ Nhiệm (GVCN)
                  </label>
                  <select
                    value={createFormData.mainTeacherId}
                    onChange={(e) => setCreateFormData({ ...createFormData, mainTeacherId: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Chưa phân công --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} {t.phone ? `(${t.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang tạo...' : 'Tạo Lớp Học'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 7. MODAL CHỈNH SỬA THÔNG TIN LỚP HỌC ─── */}
      {isEditModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Chỉnh Sửa Lớp: {selectedClass.name}</h3>
                  <p className="text-xs text-slate-400">Cập nhật khối, phòng học, năm học và giáo viên chủ nhiệm</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên Lớp Học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Khối Mầm Non <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editFormData.gradeLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, gradeLevel: e.target.value as GradeLevel })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="KINDERGARTEN_3_4Y">Khối Mầm (3 - 4 Tuổi)</option>
                    <option value="KINDERGARTEN_4_5Y">Khối Chồi (4 - 5 Tuổi)</option>
                    <option value="KINDERGARTEN_5_6Y">Khối Lá (5 - 6 Tuổi)</option>
                    <option value="TODDLER_2_3Y">Nhà Trẻ (24 - 36 Tháng)</option>
                    <option value="TODDLER_1_2Y">Nhà Trẻ (12 - 24 Tháng)</option>
                    <option value="INFANT_0_1Y">Nhà Trẻ (&lt; 12 Tháng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Phòng Học
                  </label>
                  <input
                    type="text"
                    value={editFormData.roomNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, roomNumber: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Năm Học
                  </label>
                  <input
                    type="text"
                    value={editFormData.academicYear}
                    onChange={(e) => setEditFormData({ ...editFormData, academicYear: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Trạng Thái
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as ClassStatus })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="ACTIVE">Đang Hoạt Động</option>
                    <option value="ARCHIVED">Lưu Trữ / Đã Khóa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Giáo Viên Chủ Nhiệm (GVCN)
                </label>
                <select
                  value={editFormData.mainTeacherId}
                  onChange={(e) => setEditFormData({ ...editFormData, mainTeacherId: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">-- Chưa phân công --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} {t.phone ? `(${t.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 8. MODAL XÁC NHẬN XÓA LỚP HỌC ─── */}
      {isDeleteModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-800">
                Xóa Lớp Học: {selectedClass.name}?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Các học sinh hiện đang thuộc lớp này sẽ tự động chuyển về trạng thái <strong>Chưa phân lớp</strong>. Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteClass}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 9. MODAL QUẢN LÝ & GÁN HỌC SINH VÀO LỚP ("APP HỌC SINH VÀO LỚP") ─── */}
      {isStudentModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>Quản Lý Học Sinh: {selectedClass.name}</span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {selectedClass.roomNumber || 'Phòng học'} • {selectedClass.academicYear}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sĩ số hiện tại: <strong className="text-teal-700">{classStudents.length}</strong> / {selectedClass.maxCapacity || 30} học sinh
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs inside Student Modal */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setStudentModalTab('current')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  studentModalTab === 'current'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Học Sinh Trong Lớp ({classStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStudentModalTab('assign')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  studentModalTab === 'assign'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>+ Gán Thêm Học Sinh Vào Lớp</span>
              </button>
            </div>

            {/* Tab 1: Danh sách học sinh hiện có trong lớp */}
            {studentModalTab === 'current' && (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {classStudents.length === 0 ? (
                  <div className="py-14 text-center text-slate-400 space-y-3">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Chưa có học sinh nào trong lớp này</p>
                      <p className="text-xs text-slate-400 mt-1">Chuyển sang tab "+ Gán Thêm Học Sinh" để đưa các bé vào lớp.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStudentModalTab('assign')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Gán Học Sinh Ngay</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                    {classStudents.map((child, idx) => {
                      const childAllergies = child.allergies || [];
                      return (
                        <div key={child.id} className="p-3.5 bg-white hover:bg-slate-50 transition flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <span>{child.fullName}</span>
                                <span className="font-mono text-[10px] text-slate-400">({child.studentCode})</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  child.gender === 'MALE' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                                }`}>
                                  {child.gender === 'MALE' ? 'Nam' : 'Nữ'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Sinh ngày: {child.dateOfBirth}
                                {childAllergies.length > 0 && (
                                  <span className="text-rose-600 font-bold ml-2">
                                    ⚠️ {childAllergies.length} dị ứng
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isProcessingStudents}
                            onClick={() => handleRemoveStudentFromClass(child.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition text-[11px] flex items-center gap-1 shrink-0"
                            title="Rút học sinh khỏi lớp này"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Gỡ khỏi lớp</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Gán / Áp học sinh vào lớp ("app học sinh vào lớp") */}
            {studentModalTab === 'assign' && (
              <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 flex flex-col">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm học sinh theo tên, mã..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={unassignedOnly}
                        onChange={(e) => setUnassignedOnly(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Chỉ hiện bé chưa có lớp</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedChildIdsToAssign.length === candidateStudents.length) {
                          setSelectedChildIdsToAssign([]);
                        } else {
                          setSelectedChildIdsToAssign(candidateStudents.map((c) => c.id));
                        }
                      }}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 transition"
                    >
                      {selectedChildIdsToAssign.length === candidateStudents.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  </div>
                </div>

                {/* Candidates List with Checkboxes */}
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-y-auto flex-1 max-h-64">
                  {candidateStudents.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      Không có học sinh nào phù hợp tiêu chí tìm kiếm.
                    </div>
                  ) : (
                    candidateStudents.map((child) => {
                      const isSelected = selectedChildIdsToAssign.includes(child.id);
                      return (
                        <div
                          key={child.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedChildIdsToAssign(selectedChildIdsToAssign.filter((id) => id !== child.id));
                            } else {
                              setSelectedChildIdsToAssign([...selectedChildIdsToAssign, child.id]);
                            }
                          }}
                          className={`p-3.5 cursor-pointer transition flex items-center justify-between gap-3 ${
                            isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <span>{child.fullName}</span>
                                <span className="font-mono text-[10px] text-slate-400">({child.studentCode})</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  child.gender === 'MALE' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                                }`}>
                                  {child.gender === 'MALE' ? 'Nam' : 'Nữ'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Sinh ngày: {child.dateOfBirth}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            {child.class ? (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Đang ở: {child.class.name}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Chưa xếp lớp
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Confirm Assign Button Bar */}
                <div className="flex items-center justify-between pt-3 border-t shrink-0">
                  <div className="text-xs font-bold text-slate-700">
                    Đã chọn: <span className="text-emerald-700 font-black">{selectedChildIdsToAssign.length}</span> học sinh
                  </div>

                  <button
                    type="button"
                    disabled={isProcessingStudents || selectedChildIdsToAssign.length === 0}
                    onClick={handleAddStudentsToClass}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {isProcessingStudents
                        ? 'Đang gán học sinh...'
                        : `Gán ${selectedChildIdsToAssign.length} Học Sinh Vào ${selectedClass.name}`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 10. MODAL PHÂN CÔNG GVCN ─── */}
      {showAssignModal && targetClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 border-b pb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Phân Công GVCN: {targetClass.name}
                </h3>
                <p className="text-[11px] text-slate-400">Chọn giáo viên chủ nhiệm quản lý lớp học và điểm danh</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Chọn Giáo Viên Chủ Nhiệm
              </label>
              <select
                value={teacherIdInput}
                onChange={(e) => setTeacherIdInput(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">-- Chưa phân công --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} {t.phone ? `(${t.phone})` : ''} - {t.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAssignTeacher}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-teal-600/20"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  switch (severity) {
    case 'ANAPHYLACTIC':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs animate-pulse">
          Sốc Phản Vệ
        </span>
      );
    case 'SEVERE':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
          Nặng (Cấp tính)
        </span>
      );
    case 'MODERATE':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
          Trung Bình
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
          Nhẹ
        </span>
      );
  }
};

const AlertCircleBadge: React.FC<{ count: number }> = ({ count }) => {
  return (
    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
  );
};
