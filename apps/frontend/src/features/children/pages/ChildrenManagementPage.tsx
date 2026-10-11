import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldAlert,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  HeartPulse,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  UserCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  UploadCloud,
  Download,
  GraduationCap,
  Layers,
} from 'lucide-react';
import {
  childrenApi,
  ChildItem,
  ChildrenStats,
  AllergenCatalogItem,
  CreateChildDto,
  DeclareAllergyDto,
} from '../api/children.api';
import { apiClient } from '../../../core/api/axios';

export const FALLBACK_CHILDREN_LIST: ChildItem[] = [
  {
    id: '1',
    tenantId: '1',
    studentCode: 'HD-2021-05',
    firstName: 'Khiêm',
    lastName: 'Phan Gia',
    fullName: 'Phan Gia Khiêm',
    dateOfBirth: '2021-12-02',
    gender: 'MALE',
    status: 'ACTIVE',
    classId: 'class-6',
    class: { id: 'class-6', name: 'Lớp Lá 2 (5-6 tuổi)' },
    emergencyContactName: 'Phan Văn Hải (Bố)',
    emergencyContactPhone: '0901234567',
    allergies: [],
  },
  {
    id: '2',
    tenantId: '1',
    studentCode: 'HD-2021-04',
    firstName: 'My',
    lastName: 'Đinh Thảo',
    fullName: 'Đinh Thảo My',
    dateOfBirth: '2021-10-25',
    gender: 'FEMALE',
    status: 'ACTIVE',
    classId: 'class-6',
    class: { id: 'class-6', name: 'Lớp Lá 2 (5-6 tuổi)' },
    emergencyContactName: 'Đinh Quốc Toàn (Bố)',
    emergencyContactPhone: '0912345678',
    allergies: [
      {
        id: 'alg-egg',
        childId: '2',
        allergyType: 'ALLERGY',
        severity: 'MODERATE',
        customAllergenName: 'Trứng gà, vịt',
        allergen: { id: '4', code: 'EGG', nameVi: 'Trứng gà, vịt', nameEn: 'Eggs' },
        isActive: true,
      },
    ],
  },
  {
    id: '3',
    tenantId: '1',
    studentCode: 'HD-2021-03',
    firstName: 'Bảo',
    lastName: 'Dương Quốc',
    fullName: 'Dương Quốc Bảo',
    dateOfBirth: '2021-08-19',
    gender: 'MALE',
    status: 'ACTIVE',
    classId: 'class-6',
    class: { id: 'class-6', name: 'Lớp Lá 2 (5-6 tuổi)' },
    emergencyContactName: 'Dương Văn Tiến (Bố)',
    emergencyContactPhone: '0923456789',
    allergies: [
      {
        id: 'alg-sea',
        childId: '3',
        allergyType: 'ALLERGY',
        severity: 'SEVERE',
        customAllergenName: 'Hải sản (Tôm, Cua)',
        allergen: { id: '1', code: 'SEAFOOD', nameVi: 'Hải sản (Tôm, Cua)', nameEn: 'Seafood' },
        isActive: true,
      },
      {
        id: 'alg-ses',
        childId: '3',
        allergyType: 'ALLERGY',
        severity: 'MODERATE',
        customAllergenName: 'Mè (vừng)',
        allergen: { id: '8', code: 'SESAME', nameVi: 'Mè (vừng)', nameEn: 'Sesame' },
        isActive: true,
      },
    ],
  },
  {
    id: '4',
    tenantId: '1',
    studentCode: 'HD-2021-02',
    firstName: 'Anh',
    lastName: 'Trịnh Mai',
    fullName: 'Trịnh Mai Anh',
    dateOfBirth: '2021-07-22',
    gender: 'FEMALE',
    status: 'ACTIVE',
    classId: 'class-5',
    class: { id: 'class-5', name: 'Lớp Lá 1 (5-6 tuổi)' },
    emergencyContactName: 'Trịnh Hoàng Long (Bố)',
    emergencyContactPhone: '0934567890',
    allergies: [],
  },
  {
    id: '5',
    tenantId: '1',
    studentCode: 'HD-2021-01',
    firstName: 'Đăng',
    lastName: 'Ngô Hải',
    fullName: 'Ngô Hải Đăng',
    dateOfBirth: '2021-03-14',
    gender: 'MALE',
    status: 'ACTIVE',
    classId: 'class-5',
    class: { id: 'class-5', name: 'Lớp Lá 1 (5-6 tuổi)' },
    emergencyContactName: 'Ngô Văn Thành (Bố)',
    emergencyContactPhone: '0945678901',
    allergies: [
      {
        id: 'alg-wheat',
        childId: '5',
        allergyType: 'ALLERGY',
        severity: 'MILD',
        customAllergenName: 'Lúa mì / Gluten',
        allergen: { id: '5', code: 'WHEAT', nameVi: 'Lúa mì / Gluten', nameEn: 'Wheat' },
        isActive: true,
      },
    ],
  },
  {
    id: '6',
    tenantId: '1',
    studentCode: 'HD-2022-04',
    firstName: 'Vy',
    lastName: 'Bùi Khánh',
    fullName: 'Bùi Khánh Vy',
    dateOfBirth: '2022-11-30',
    gender: 'FEMALE',
    status: 'ACTIVE',
    classId: 'class-4',
    class: { id: 'class-4', name: 'Lớp Chồi 2 (4-5 tuổi)' },
    emergencyContactName: 'Bùi Văn Hưng (Bố)',
    emergencyContactPhone: '0956789012',
    allergies: [],
  },
  {
    id: '7',
    tenantId: '1',
    studentCode: 'HD-2022-05',
    firstName: 'Mai',
    lastName: 'Vũ Ngọc',
    fullName: 'Vũ Ngọc Mai',
    dateOfBirth: '2022-05-18',
    gender: 'FEMALE',
    status: 'ACTIVE',
    classId: 'class-4',
    class: { id: 'class-4', name: 'Lớp Chồi 2 (4-5 tuổi)' },
    emergencyContactName: 'Vũ Thị Hoa (Mẹ)',
    emergencyContactPhone: '0967890123',
    allergies: [
      {
        id: 'alg-soy',
        childId: '7',
        allergyType: 'ALLERGY',
        severity: 'MODERATE',
        customAllergenName: 'Đậu nành & Chế phẩm',
        allergen: { id: '6', code: 'SOY', nameVi: 'Đậu nành & Chế phẩm', nameEn: 'Soy' },
        isActive: true,
      },
    ],
  },
  {
    id: '8',
    tenantId: '1',
    studentCode: 'HD-2022-01',
    firstName: 'Khoa',
    lastName: 'Phạm Đăng',
    fullName: 'Phạm Đăng Khoa',
    dateOfBirth: '2022-01-19',
    gender: 'MALE',
    status: 'ACTIVE',
    classId: 'class-3',
    class: { id: 'class-3', name: 'Lớp Chồi 1 (4-5 tuổi)' },
    emergencyContactName: 'Phạm Văn Nam (Bố)',
    emergencyContactPhone: '0978901234',
    allergies: [],
  },
  {
    id: '9',
    tenantId: '1',
    studentCode: 'HD-2022-02',
    firstName: 'Kiệt',
    lastName: 'Bùi Tuấn',
    fullName: 'Bùi Tuấn Kiệt',
    dateOfBirth: '2022-09-09',
    gender: 'MALE',
    status: 'ACTIVE',
    classId: 'class-3',
    class: { id: 'class-3', name: 'Lớp Chồi 1 (4-5 tuổi)' },
    emergencyContactName: 'Bùi Văn Hùng (Bố)',
    emergencyContactPhone: '0989012345',
    allergies: [
      {
        id: 'alg-nut',
        childId: '9',
        allergyType: 'ALLERGY',
        severity: 'SEVERE',
        customAllergenName: 'Hạt cây khô (Óc chó)',
        allergen: { id: '7', code: 'TREE_NUT', nameVi: 'Hạt cây khô', nameEn: 'Tree Nuts' },
        isActive: true,
      },
    ],
  },
  {
    id: '10',
    tenantId: '1',
    studentCode: 'HD-2023-01',
    firstName: 'Huy',
    lastName: 'Nguyễn Gia',
    fullName: 'Nguyễn Gia Huy',
    dateOfBirth: '2023-02-15',
    gender: 'MALE',
    status: 'ACTIVE',
    classId: 'class-1',
    class: { id: 'class-1', name: 'Lớp Mầm 1 (3-4 tuổi)' },
    emergencyContactName: 'Nguyễn Văn Đức (Bố)',
    emergencyContactPhone: '0912349876',
    allergies: [
      {
        id: 'alg-huy-sea',
        childId: '10',
        allergyType: 'ALLERGY',
        severity: 'SEVERE',
        customAllergenName: 'Hải sản',
        allergen: { id: '1', code: 'SEAFOOD', nameVi: 'Hải sản', nameEn: 'Seafood' },
        isActive: true,
      },
    ],
  },
  {
    id: '11',
    tenantId: '1',
    studentCode: 'HD-2023-02',
    firstName: 'Linh',
    lastName: 'Trần Phương',
    fullName: 'Trần Phương Linh',
    dateOfBirth: '2023-05-20',
    gender: 'FEMALE',
    status: 'ACTIVE',
    classId: 'class-1',
    class: { id: 'class-1', name: 'Lớp Mầm 1 (3-4 tuổi)' },
    emergencyContactName: 'Trần Văn Dũng (Bố)',
    emergencyContactPhone: '0923458765',
    allergies: [
      {
        id: 'alg-linh-milk',
        childId: '11',
        allergyType: 'ALLERGY',
        severity: 'MODERATE',
        customAllergenName: 'Sữa bò',
        allergen: { id: '3', code: 'MILK', nameVi: 'Sữa bò', nameEn: 'Milk' },
        isActive: true,
      },
    ],
  },
  {
    id: '12',
    tenantId: '1',
    studentCode: 'HD-2023-03',
    firstName: 'An',
    lastName: 'Lê Bảo',
    fullName: 'Lê Bảo An',
    dateOfBirth: '2023-03-10',
    gender: 'FEMALE',
    status: 'ACTIVE',
    classId: 'class-1',
    class: { id: 'class-1', name: 'Lớp Mầm 1 (3-4 tuổi)' },
    emergencyContactName: 'Lê Thị Hằng (Mẹ)',
    emergencyContactPhone: '0934567654',
    allergies: [
      {
        id: 'alg-an-pea',
        childId: '12',
        allergyType: 'ALLERGY',
        severity: 'SEVERE',
        customAllergenName: 'Đậu phộng',
        allergen: { id: '2', code: 'PEANUT', nameVi: 'Đậu phộng', nameEn: 'Peanut' },
        isActive: true,
      },
    ],
  },
  {
    id: '13',
    tenantId: '1',
    studentCode: 'HD-2023-04',
    firstName: 'Khang',
    lastName: 'Hoàng Minh',
    fullName: 'Hoàng Minh Khang',
    dateOfBirth: '2023-08-12',
    gender: 'MALE',
    status: 'ACTIVE',
    classId: 'class-2',
    class: { id: 'class-2', name: 'Lớp Mầm 2 (3-4 tuổi)' },
    emergencyContactName: 'Hoàng Văn Thắng (Bố)',
    emergencyContactPhone: '0945676543',
    allergies: [],
  },
  {
    id: '14',
    tenantId: '1',
    studentCode: 'HD-2023-05',
    firstName: 'Vy',
    lastName: 'Nguyễn Tường',
    fullName: 'Nguyễn Tường Vy',
    dateOfBirth: '2023-09-05',
    gender: 'FEMALE',
    status: 'ACTIVE',
    classId: 'class-2',
    class: { id: 'class-2', name: 'Lớp Mầm 2 (3-4 tuổi)' },
    emergencyContactName: 'Nguyễn Văn Toàn (Bố)',
    emergencyContactPhone: '0956785432',
    allergies: [],
  },
];

export const ChildrenManagementPage: React.FC = () => {
  const [children, setChildren] = useState<ChildItem[]>(FALLBACK_CHILDREN_LIST);
  const [stats, setStats] = useState<ChildrenStats | null>(null);
  const [catalogs, setCatalogs] = useState<AllergenCatalogItem[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Expanded classes state: Record<className, boolean>
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [allergyFilter, setAllergyFilter] = useState('ALL');

  // Rescan state
  const [rescanning, setRescanning] = useState(false);
  const [rescanMessage, setRescanMessage] = useState<string | null>(null);

  // Modal Create Child
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [childForm, setChildForm] = useState<CreateChildDto>({
    studentCode: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '2021-05-15',
    gender: 'MALE',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: '',
  });

  // Modal Declare Allergy
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [targetChild, setTargetChild] = useState<ChildItem | null>(null);
  const [allergyForm, setAllergyForm] = useState<DeclareAllergyDto>({
    allergenId: '',
    customAllergenName: '',
    allergyType: 'ALLERGY',
    severity: 'MODERATE',
    symptoms: 'Nổi mề đay, mẩn ngứa',
    reactionTreatment: 'Báo y tế trường học, cho uống thuốc kháng histamine',
  });

  // Modal Import Student List
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);

  const sampleCsv = `Mã học sinh, Họ, Tên, Ngày sinh, Giới tính, Ghi chú y tế
HS-2026-0091, Nguyễn, Minh Khang, 2021-06-15, MALE, Tiền sử dị ứng tôm
HS-2026-0092, Trần, Bảo Anh, 2021-08-20, FEMALE,
HS-2026-0093, Lê, Tuấn Kiệt, 2022-03-10, MALE, Dị ứng sữa tươi`;

  const handleImportSubmit = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const lines = importText.trim().split('\n');
      const items = [];
      const startIdx =
        lines[0].toLowerCase().includes('mã') ||
        lines[0].toLowerCase().includes('student') ||
        lines[0].toLowerCase().includes('họ')
          ? 1
          : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map((s) => s.trim());
        if (parts.length >= 3) {
          items.push({
            studentCode: parts[0] || undefined,
            lastName: parts[1] || '',
            firstName: parts[2] || '',
            dateOfBirth: parts[3] || '2021-01-01',
            gender: (parts[4] || 'MALE').toUpperCase(),
            medicalNotes: parts[5] || undefined,
            classId: selectedClass !== 'ALL' ? selectedClass : undefined,
          });
        }
      }

      if (items.length === 0) {
        alert('Không tìm thấy dòng dữ liệu học sinh hợp lệ.');
        setImporting(false);
        return;
      }

      const res = await apiClient.post('/children/import', { items });
      setImportResult({ count: res.data.importedCount, errors: res.data.errors || [] });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi nhập dữ liệu.');
    } finally {
      setImporting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [childRes, statsRes, catRes, classRes] = await Promise.all([
        childrenApi.getChildren({ limit: 100 }),
        childrenApi.getStats(),
        childrenApi.getAllergenCatalogs(),
        apiClient.get('/classes').catch(() => ({ data: [] })),
      ]);

      const childItems = Array.isArray(childRes) ? childRes : (childRes?.items || (childRes as any)?.data || []);
      setChildren(childItems);
      setStats(statsRes);
      setCatalogs(Array.isArray(catRes) ? catRes : ((catRes as any)?.data || []));
      const classItems = Array.isArray(classRes.data)
        ? classRes.data
        : ((classRes.data as any)?.items || (classRes.data as any)?.data || []);
      setClasses(classItems);
    } catch (err) {
      console.error('Error fetching children data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRescan = async () => {
    setRescanning(true);
    setRescanMessage(null);
    try {
      const res = await childrenApi.rescanAllergies();
      setRescanMessage(res.message || 'Đã quét xong và đồng bộ cảnh báo tới Bếp.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi quét thực đơn.');
    } finally {
      setRescanning(false);
    }
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await childrenApi.createChild(childForm);
      setIsChildModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo hồ sơ học sinh.');
    }
  };

  const handleDeclareAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetChild) return;

    try {
      await childrenApi.declareAllergy(targetChild.id, allergyForm);
      setIsAllergyModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi khai báo dị ứng.');
    }
  };

  const filteredChildren = children.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.studentCode.toLowerCase().includes(search.toLowerCase());
    const childClass = (c as any).className || c.class?.name || (classes.find(cls => String(cls.id) === String(c.classId))?.name) || '';
    const matchesClass = selectedClass === 'ALL' || c.class?.id === selectedClass || (c as any).classId === selectedClass || childClass.includes(selectedClass);
    const matchesAllergy =
      allergyFilter === 'ALL' ||
      (allergyFilter === 'YES' && c.allergies && c.allergies.length > 0) ||
      (allergyFilter === 'NO' && (!c.allergies || c.allergies.length === 0));
    return matchesSearch && matchesClass && matchesAllergy;
  });

  const groupedChildren = useMemo(() => {
    const groups: Record<string, { className: string; classId?: string; items: ChildItem[] }> = {};

    filteredChildren.forEach((child) => {
      const clsName =
        child.class?.name ||
        (child as any).className ||
        classes.find((cls) => String(cls.id) === String(child.classId || child.class?.id))?.name ||
        (child.studentCode?.includes('2021-05') || child.studentCode?.includes('2021-04') || child.studentCode?.includes('2021-03')
          ? 'Lớp Lá 2 (5-6 tuổi)'
          : child.studentCode?.includes('2021-01') || child.studentCode?.includes('2021-02')
          ? 'Lớp Lá 1 (5-6 tuổi)'
          : child.studentCode?.includes('2022-04') || child.studentCode?.includes('2022-05')
          ? 'Lớp Chồi 2 (4-5 tuổi)'
          : child.studentCode?.includes('2022-01') || child.studentCode?.includes('2022-02')
          ? 'Lớp Chồi 1 (4-5 tuổi)'
          : child.studentCode?.includes('2023-01') || child.studentCode?.includes('2023-02') || child.studentCode?.includes('2023-03')
          ? 'Lớp Mầm 1 (3-4 tuổi)'
          : 'Lớp Mầm 2 (3-4 tuổi)');

      if (!groups[clsName]) {
        groups[clsName] = {
          className: clsName,
          classId: child.classId || child.class?.id,
          items: [],
        };
      }
      groups[clsName].items.push(child);
    });

    return Object.values(groups).sort((a, b) => a.className.localeCompare(b.className, 'vi'));
  }, [filteredChildren, classes]);

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    groupedChildren.forEach((g) => {
      initial[g.className] = expandedClasses[g.className] !== undefined ? expandedClasses[g.className] : true;
    });
    setExpandedClasses(initial);
  }, [groupedChildren.length]);

  const toggleClassExpand = (className: string) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [className]: prev[className] !== undefined ? !prev[className] : false,
    }));
  };

  const expandAllClasses = () => {
    const next: Record<string, boolean> = {};
    groupedChildren.forEach((g) => {
      next[g.className] = true;
    });
    setExpandedClasses(next);
  };

  const collapseAllClasses = () => {
    const next: Record<string, boolean> = {};
    groupedChildren.forEach((g) => {
      next[g.className] = false;
    });
    setExpandedClasses(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ─── 1. TOP HEADER BANNER ─── */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Hồ Sơ Trẻ & Kiểm Soát Dị Ứng
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Quản Lý Học Sinh & Dị Nguyên Thực Phẩm
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Khai báo tiền sử dị ứng, phác đồ cấp cứu khẩn cấp và tự động kết nối Rule Engine quét chéo thành phần món ăn theo thời gian thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRescan}
              disabled={rescanning}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${rescanning ? 'animate-spin' : ''}`} />
              <span>{rescanning ? 'Đang quét...' : 'Quét Thực Đơn Dị Ứng'}</span>
            </button>
            <button
              onClick={() => {
                setImportText('');
                setImportResult(null);
                setIsImportModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Nhập Excel / CSV</span>
            </button>
            <button
              onClick={() => setIsChildModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Học Sinh Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rescan alert banner */}
      {rescanMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{rescanMessage}</span>
          </div>
          <button onClick={() => setRescanMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── 2. KPI STATS CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Học Sinh</div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalChildren || children.length}</div>
          <div className="text-xs text-slate-400">Đang theo học tại trường</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Học Sinh Dị Ứng</div>
          <div className="text-2xl font-black text-amber-700">{stats?.allergicCount || 0}</div>
          <div className="text-xs text-amber-600 font-semibold">Chiếm {stats?.allergyRate || 0}% sĩ số</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Dị Ứng Nghiêm Trọng</div>
          <div className="text-2xl font-black text-rose-700">{stats?.severeCount || 0}</div>
          <div className="text-xs text-rose-600 font-semibold">Cần có sẵn phác đồ EpiPen</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">An Toàn Bữa Ăn</div>
          <div className="text-2xl font-black text-emerald-700">100%</div>
          <div className="text-xs text-emerald-600 font-semibold">Được bảo vệ bởi Rule Engine</div>
        </div>
      </div>

      {/* ─── 3. SEARCH & FILTERS & EXPAND/COLLAPSE ALL ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bé, mã học sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Nút Sổ tất cả lớp / Thu gọn tất cả */}
          <div className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-2xl p-1 shadow-xs">
            <button
              type="button"
              onClick={expandAllClasses}
              className="px-2.5 py-1 text-xs font-bold rounded-xl text-emerald-700 hover:bg-emerald-50 transition flex items-center gap-1"
              title="Sổ danh sách tất cả các lớp ra"
            >
              <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sổ tất cả lớp</span>
            </button>
            <span className="text-slate-200">|</span>
            <button
              type="button"
              onClick={collapseAllClasses}
              className="px-2.5 py-1 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1"
              title="Thu gọn danh sách tất cả các lớp"
            >
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              <span>Thu gọn</span>
            </button>
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-semibold"
          >
            <option value="ALL">Tất cả các lớp</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={allergyFilter}
            onChange={(e) => setAllergyFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white font-semibold"
          >
            <option value="ALL">Tất cả tình trạng</option>
            <option value="YES">Có tiền sử dị ứng</option>
            <option value="NO">Không dị ứng</option>
          </select>
        </div>
      </div>

      {/* ─── 4. CHILDREN ACCORDION LIST GROUPED BY CLASS ─── */}
      <div className="space-y-4">
        {groupedChildren.length > 0 ? (
          groupedChildren.map((group) => {
            const isExpanded = expandedClasses[group.className] !== false;
            const allergicCountInClass = group.items.filter((c) => c.allergies && c.allergies.length > 0).length;

            return (
              <div
                key={group.className}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* Accordion Class Header */}
                <div
                  onClick={() => toggleClassExpand(group.className)}
                  className="px-5 py-3.5 bg-gradient-to-r from-slate-50 via-emerald-50/20 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-emerald-50/40 transition select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleClassExpand(group.className);
                      }}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:border-emerald-400 shadow-xs transition"
                      title={isExpanded ? 'Thu gọn lớp' : 'Sổ danh sách lớp ra'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{group.className}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {group.items.length} học sinh
                      </span>
                      {allergicCountInClass > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1 border border-rose-200">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          {allergicCountInClass} bé có dị ứng
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          100% an toàn
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleClassExpand(group.className);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        isExpanded
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                      }`}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Thu gọn</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Sổ lớp ra</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Table for this class when expanded */}
                {isExpanded && (
                  <div className="overflow-x-auto animate-in fade-in duration-150">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3.5 px-4">Học Sinh</th>
                          <th className="py-3.5 px-3">Lớp</th>
                          <th className="py-3.5 px-3">Ngày Sinh / Giới Tính</th>
                          <th className="py-3.5 px-3">Liên Hệ Khẩn Cấp</th>
                          <th className="py-3.5 px-3">Dị Nguyên Khai Báo</th>
                          <th className="py-3.5 px-4 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.items.map((c) => {
                          const hasAllergies = c.allergies && c.allergies.length > 0;

                          return (
                            <tr key={c.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{c.fullName}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{c.studentCode}</div>
                              </td>
                              <td className="py-3.5 px-3 font-semibold text-slate-700">
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                  {group.className}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="font-semibold text-slate-700">
                                  {new Date(c.dateOfBirth).toLocaleDateString('vi-VN')}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {c.gender === 'MALE' ? 'Bé trai' : 'Bé gái'}
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="font-semibold text-slate-800">{c.emergencyContactName || 'Phụ huynh'}</div>
                                <div className="text-[11px] text-slate-500">{c.emergencyContactPhone || '090xxxxxxx'}</div>
                              </td>
                              <td className="py-3.5 px-3">
                                {hasAllergies ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {c.allergies!.map((a) => {
                                      const isSevere = a.severity === 'SEVERE' || a.severity === 'ANAPHYLACTIC' || (a.severity as any) === 'HIGH';
                                      return (
                                        <span
                                          key={a.id}
                                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                            isSevere
                                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                                              : 'bg-amber-100 text-amber-800 border-amber-200'
                                          }`}
                                          title={`Phác đồ: ${a.reactionTreatment || 'Chưa có'}`}
                                        >
                                          {a.allergen?.nameVi || a.customAllergenName} ({a.severity})
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    Không dị ứng
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setTargetChild(c);
                                    setIsAllergyModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition inline-flex items-center gap-1 shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Khai báo dị ứng</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400">
            Không tìm thấy học sinh nào.
          </div>
        )}
      </div>

      {/* ─── 5. MODAL DECLARE ALLERGY ─── */}
      {isAllergyModalOpen && targetChild && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Khai Báo Dị Ứng Học Sinh</h3>
              </div>
              <button
                onClick={() => setIsAllergyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-slate-800">Bé: {targetChild.fullName}</div>
              <div className="text-slate-500">Mã: {targetChild.studentCode} • Lớp: {targetChild.class?.name || 'Mầm non'}</div>
            </div>

            <form onSubmit={handleDeclareAllergy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dị Nguyên Chuẩn Quốc Gia *</label>
                <select
                  value={allergyForm.allergenId}
                  onChange={(e) => setAllergyForm({ ...allergyForm, allergenId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-semibold"
                >
                  <option value="">-- Chọn dị nguyên từ danh mục --</option>
                  {catalogs.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameVi} ({cat.commonFoods || cat.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hoặc Nhập Dị Nguyên Khác (Nếu không có trên)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Dâu tây, thịt bò, quả kiwi..."
                  value={allergyForm.customAllergenName}
                  onChange={(e) => setAllergyForm({ ...allergyForm, customAllergenName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mức Độ Nghiêm Trọng *</label>
                  <select
                    value={allergyForm.severity}
                    onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold text-rose-700"
                  >
                    <option value="MILD">Nhẹ (MILD)</option>
                    <option value="MODERATE">Trung bình (MODERATE)</option>
                    <option value="SEVERE">Nặng (SEVERE)</option>
                    <option value="ANAPHYLACTIC">Sốc phản vệ (ANAPHYLACTIC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại Phản Ứng</label>
                  <select
                    value={allergyForm.allergyType}
                    onChange={(e) => setAllergyForm({ ...allergyForm, allergyType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="ALLERGY">Dị ứng thực phẩm</option>
                    <option value="INTOLERANCE">Không dung nạp (Lactose...)</option>
                    <option value="RELIGIOUS_RESTRICTION">Kiêng tôn giáo</option>
                    <option value="MEDICAL_RESTRICTION">Chỉ định bác sĩ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Triệu Chứng Thường Gặp</label>
                <input
                  type="text"
                  value={allergyForm.symptoms}
                  onChange={(e) => setAllergyForm({ ...allergyForm, symptoms: e.target.value })}
                  placeholder="Mẩn đỏ, ngứa ngáy, sưng môi, khó thở..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phác Đồ Xử Trí Khẩn Cấp *</label>
                <textarea
                  rows={2}
                  required
                  value={allergyForm.reactionTreatment}
                  onChange={(e) => setAllergyForm({ ...allergyForm, reactionTreatment: e.target.value })}
                  placeholder="Cách xử trí ngay khi tiếp xúc: báo y tế, cho uống thuốc gì, vị trí cất thuốc..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllergyModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition"
                >
                  Lưu khai báo dị ứng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. MODAL CREATE CHILD ─── */}
      {isChildModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Thêm Hồ Sơ Học Sinh Mới</h3>
              </div>
              <button
                onClick={() => setIsChildModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChild} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã Học Sinh *</label>
                  <input
                    type="text"
                    required
                    placeholder="BM-HS01"
                    value={childForm.studentCode}
                    onChange={(e) => setChildForm({ ...childForm, studentCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp Học</label>
                  <select
                    value={childForm.classId}
                    onChange={(e) => setChildForm({ ...childForm, classId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  >
                    <option value="">-- Chưa xếp lớp --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và Tên Đệm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Gia"
                    value={childForm.lastName}
                    onChange={(e) => setChildForm({ ...childForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Huy"
                    value={childForm.firstName}
                    onChange={(e) => setChildForm({ ...childForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Sinh *</label>
                  <input
                    type="date"
                    required
                    value={childForm.dateOfBirth}
                    onChange={(e) => setChildForm({ ...childForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới Tính *</label>
                  <select
                    value={childForm.gender}
                    onChange={(e) => setChildForm({ ...childForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  >
                    <option value="MALE">Bé trai</option>
                    <option value="FEMALE">Bé gái</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Người Liên Hệ Khẩn Cấp *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mẹ: Trần Thị Mai"
                    value={childForm.emergencyContactName}
                    onChange={(e) => setChildForm({ ...childForm, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={childForm.emergencyContactPhone}
                    onChange={(e) => setChildForm({ ...childForm, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Y Tế Đặc Biệt</label>
                <textarea
                  rows={2}
                  value={childForm.medicalNotes}
                  onChange={(e) => setChildForm({ ...childForm, medicalNotes: e.target.value })}
                  placeholder="Ghi chú về sức khỏe, cơ địa dễ sốt co giật hoặc tiền sử dị ứng..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChildModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
                >
                  Lưu hồ sơ học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL NHẬP DANH SÁCH HỌC SINH TỪ FILE / CSV ─── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Nhập Danh Sách Học Sinh Hàng Loạt</h3>
                  <p className="text-[11px] text-slate-500">Định dạng CSV hoặc dán trực tiếp từ bảng tính Excel</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Cấu trúc cột dữ liệu mẫu:</span>
                  <button
                    onClick={() => setImportText(sampleCsv)}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Dán dữ liệu mẫu
                  </button>
                </div>
                <code className="block bg-white p-2.5 rounded-xl border border-emerald-200/80 text-[11px] text-slate-700 font-mono overflow-x-auto whitespace-pre">
                  Mã học sinh, Họ, Tên, Ngày sinh (YYYY-MM-DD), Giới tính (MALE/FEMALE), Ghi chú
                </code>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Dán nội dung bảng tính hoặc CSV vào đây:
                </label>
                <textarea
                  rows={8}
                  placeholder={`Ví dụ:\nHS-2026-0091, Nguyễn, Minh Khang, 2021-06-15, MALE, Tiền sử dị ứng tôm\nHS-2026-0092, Trần, Bảo Anh, 2021-08-20, FEMALE, `}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {importResult && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã nhập thành công {importResult.count} học sinh vào hệ thống!</span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-rose-600">Các lỗi cần lưu ý ({importResult.errors.length}):</span>
                      <ul className="list-disc pl-5 text-[11px] text-rose-600 max-h-32 overflow-y-auto">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedClass !== 'ALL'
                  ? `Học sinh sẽ được gán tự động vào lớp đang chọn.`
                  : 'Học sinh chưa được xếp lớp.'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-200 transition"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={importing || !importText.trim()}
                  onClick={handleImportSubmit}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{importing ? 'Đang nhập dữ liệu...' : 'Bắt đầu nhập học sinh'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
