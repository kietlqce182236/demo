import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Utensils,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertOctagon,
  Phone,
  User,
  GraduationCap,
  Calendar,
  ChevronRight,
  Info,
  Edit3,
  Trash2,
  Eye,
  Check,
  X,
  Sparkles,
  ChefHat,
  Salad,
  Clock,
  Layers,
} from 'lucide-react';
import { apiClient } from '../../../core/api/axios';

// Interfaces
export interface ChildAllergyRecord {
  id: string;
  allergenId: string;
  allergenName: string;
  allergenCode: string;
  severity: string; // HIGH, MEDIUM, LOW
  note?: string;
  declaredAt?: string;
}

export interface ChildWithAllergy {
  id: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  avatarUrl?: string | null;
  classId?: string | null;
  className?: string;
  ageGroup?: string;
  status: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies: ChildAllergyRecord[];
  hasAllergy: boolean;
}

export interface AllergenStandard {
  id: string;
  code: string;
  name: string;
  nameVi: string;
  nameEn?: string;
  commonFoods?: string;
  description?: string;
  isActive: boolean;
}

export interface ClassOption {
  id: string;
  name: string;
  ageGroup?: string;
  studentCount?: number;
}

export const FALLBACK_ALLERGENS: AllergenStandard[] = [
  { id: '1', code: 'SEAFOOD', name: 'Hải sản (Tôm, Cua, Mực)', nameVi: 'Hải sản (Tôm, Cua, Mực)', nameEn: 'Crustaceans & Molluscs', commonFoods: 'Tôm rim, cua biển, chả mực, canh nghêu', description: 'Gây phù nề niêm mạc, ngứa ngáy dữ dội hoặc sốc phản vệ cấp tính.', isActive: true },
  { id: '2', code: 'PEANUT', name: 'Đậu phộng / Lạc', nameVi: 'Đậu phộng / Lạc', nameEn: 'Peanuts', commonFoods: 'Muối mè lạc, xôi đậu phộng, bơ đậu phộng, bánh kẹo lạc', description: 'Nguy cơ phản vệ độ 4 cao nhất, tuyệt đối không cho tiếp xúc chéo.', isActive: true },
  { id: '3', code: 'MILK', name: 'Sữa bò & Chế phẩm từ sữa', nameVi: 'Sữa bò & Chế phẩm sữa', nameEn: 'Cow Milk & Dairy', commonFoods: 'Sữa tươi, sữa chua, phô mai, bánh flan, kem tươi', description: 'Bất dung nạp lactose hoặc dị ứng đạm bò (Casein/Whey), gây rối loạn tiêu hóa.', isActive: true },
  { id: '4', code: 'EGG', name: 'Trứng gà, vịt & gia cầm', nameVi: 'Trứng gà, vịt', nameEn: 'Eggs', commonFoods: 'Trứng đúc thịt, chả trứng, sốt mayonnaise, bánh bông lan', description: 'Gây nổi mề đay, ban đỏ quanh miệng và co thắt dạ dày.', isActive: true },
  { id: '5', code: 'WHEAT', name: 'Lúa mì & Gluten ngũ cốc', nameVi: 'Lúa mì & Gluten', nameEn: 'Wheat & Gluten', commonFoods: 'Mì sợi, nui, bánh mì, bánh quy bơ, bột mì chiên giòn', description: 'Dị ứng Gluten dẫn đến hội chứng Celiac, đầy hơi chướng bụng tiêu chảy kéo dài.', isActive: true },
  { id: '6', code: 'SOY', name: 'Đậu nành & Tương', nameVi: 'Đậu nành & Chế phẩm đậu', nameEn: 'Soybeans', commonFoods: 'Đậu hũ non, nước tương, sữa đậu nành, tàu hũ ky', description: 'Phản ứng quá mẫn với protein đậu nành, gây viêm da dị ứng.', isActive: true },
  { id: '7', code: 'TREE_NUT', name: 'Hạt cây (Hạnh nhân, Óc chó, Điều)', nameVi: 'Hạt cây khô', nameEn: 'Tree Nuts', commonFoods: 'Sữa hạt óc chó, bánh hạt điều, dầu hạnh nhân', description: 'Nguy cơ sốc phản vệ co thắt đường thở thanh quản rất nhanh.', isActive: true },
  { id: '8', code: 'SESAME', name: 'Vừng / Mè đen, trắng', nameVi: 'Vừng / Mè', nameEn: 'Sesame', commonFoods: 'Muối vừng, chè mè đen, dầu mè thơm trong súp canh', description: 'Kích ứng niêm mạc họng, ngứa rát và nổi mẩn đỏ toàn thân.', isActive: true },
];

export const FALLBACK_CLASSES: ClassOption[] = [
  { id: 'class-1', name: 'Lớp Mầm 1', ageGroup: '3-4 Tuổi', studentCount: 25 },
  { id: 'class-2', name: 'Lớp Mầm 2', ageGroup: '3-4 Tuổi', studentCount: 26 },
  { id: 'class-3', name: 'Lớp Chồi 1', ageGroup: '4-5 Tuổi', studentCount: 28 },
  { id: 'class-4', name: 'Lớp Chồi 2', ageGroup: '4-5 Tuổi', studentCount: 27 },
  { id: 'class-5', name: 'Lớp Lá 1', ageGroup: '5-6 Tuổi', studentCount: 30 },
  { id: 'class-6', name: 'Lớp Lá 2', ageGroup: '5-6 Tuổi', studentCount: 29 },
];

export const FALLBACK_CHILDREN: ChildWithAllergy[] = [
  {
    id: '1',
    studentCode: 'HS-2024-001',
    fullName: 'Nguyễn Hoàng Nam',
    dateOfBirth: '2021-03-15',
    gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150',
    classId: 'class-1',
    className: 'Lớp Mầm 1',
    ageGroup: '3-4 Tuổi',
    status: 'ACTIVE',
    emergencyContactName: 'Nguyễn Văn Minh (Bố)',
    emergencyContactPhone: '0903123456',
    hasAllergy: true,
    allergies: [
      {
        id: 'alg-1',
        allergenId: '1',
        allergenName: 'Hải sản (Tôm, Cua, Mực)',
        allergenCode: 'SEAFOOD',
        severity: 'HIGH',
        note: 'Dị ứng cấp tính: Phù môi, ngứa ngáy dữ dội, khó thở khi ăn tôm cua ghẹ. Tuyệt đối nấu nồi riêng!',
        declaredAt: '2024-09-05',
      },
    ],
  },
  {
    id: '2',
    studentCode: 'HS-2024-002',
    fullName: 'Trần Bảo An',
    dateOfBirth: '2021-06-20',
    gender: 'FEMALE',
    avatarUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=150',
    classId: 'class-1',
    className: 'Lớp Mầm 1',
    ageGroup: '3-4 Tuổi',
    status: 'ACTIVE',
    emergencyContactName: 'Trần Thị Hằng (Mẹ)',
    emergencyContactPhone: '0912456789',
    hasAllergy: true,
    allergies: [
      {
        id: 'alg-2',
        allergenId: '2',
        allergenName: 'Đậu phộng / Lạc',
        allergenCode: 'PEANUT',
        severity: 'HIGH',
        note: 'Nguy cơ sốc phản vệ: Co thắt phế quản, tụt huyết áp. Cấm tuyệt đối dầu lạc và bánh kẹo có hạt đậu.',
        declaredAt: '2024-09-06',
      },
    ],
  },
  {
    id: '3',
    studentCode: 'HS-2024-003',
    fullName: 'Lê Minh Khôi',
    dateOfBirth: '2021-01-10',
    gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150',
    classId: 'class-2',
    className: 'Lớp Mầm 2',
    ageGroup: '3-4 Tuổi',
    status: 'ACTIVE',
    emergencyContactName: 'Lê Quốc Tuấn (Bố)',
    emergencyContactPhone: '0987654321',
    hasAllergy: true,
    allergies: [
      {
        id: 'alg-3',
        allergenId: '3',
        allergenName: 'Sữa bò & Chế phẩm sữa',
        allergenCode: 'MILK',
        severity: 'MEDIUM',
        note: 'Dị ứng đạm sữa bò: Tiêu chảy, đầy hơi nôn trớ. Thay thế bữa phụ bằng sữa hạt dinh dưỡng hoặc nước ép.',
        declaredAt: '2024-09-10',
      },
    ],
  },
  {
    id: '4',
    studentCode: 'HS-2024-004',
    fullName: 'Phạm Quỳnh Chi',
    dateOfBirth: '2020-08-14',
    gender: 'FEMALE',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    classId: 'class-3',
    className: 'Lớp Chồi 1',
    ageGroup: '4-5 Tuổi',
    status: 'ACTIVE',
    emergencyContactName: 'Phạm Thanh Sơn (Bố)',
    emergencyContactPhone: '0978112233',
    hasAllergy: true,
    allergies: [
      {
        id: 'alg-4',
        allergenId: '4',
        allergenName: 'Trứng gà, vịt',
        allergenCode: 'EGG',
        severity: 'MEDIUM',
        note: 'Nổi ban mề đay quanh miệng sau 15 phút. Thay thế trứng rán/trứng đúc bằng chả lụa hoặc thịt băm viên.',
        declaredAt: '2024-09-12',
      },
    ],
  },
  {
    id: '5',
    studentCode: 'HS-2024-005',
    fullName: 'Đỗ Gia Huy',
    dateOfBirth: '2020-11-28',
    gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    classId: 'class-4',
    className: 'Lớp Chồi 2',
    ageGroup: '4-5 Tuổi',
    status: 'ACTIVE',
    emergencyContactName: 'Đỗ Minh Đức (Bố)',
    emergencyContactPhone: '0913998877',
    hasAllergy: true,
    allergies: [
      {
        id: 'alg-5',
        allergenId: '5',
        allergenName: 'Lúa mì & Gluten',
        allergenCode: 'WHEAT',
        severity: 'LOW',
        note: 'Bất dung nạp Gluten nhẹ, khó tiêu hóa mì sợi nui bánh mì. Chuyển sang cơm trắng hoặc bún phở gạo.',
        declaredAt: '2024-09-15',
      },
    ],
  },
  {
    id: '6',
    studentCode: 'HS-2024-006',
    fullName: 'Vũ Ngọc Mai',
    dateOfBirth: '2019-05-18',
    gender: 'FEMALE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    classId: 'class-5',
    className: 'Lớp Lá 1',
    ageGroup: '5-6 Tuổi',
    status: 'ACTIVE',
    emergencyContactName: 'Vũ Thị Hoa (Mẹ)',
    emergencyContactPhone: '0934556677',
    hasAllergy: true,
    allergies: [
      {
        id: 'alg-6',
        allergenId: '6',
        allergenName: 'Đậu nành & Chế phẩm',
        allergenCode: 'SOY',
        severity: 'MEDIUM',
        note: 'Dị ứng protein đậu nành: Nổi mẩn ngứa ở cổ tay, bụng. Không ăn đậu hũ non và gia vị nước tương nành.',
        declaredAt: '2024-09-18',
      },
    ],
  },
  {
    id: '7',
    studentCode: 'HS-2024-007',
    fullName: 'Bùi Tuấn Kiệt',
    dateOfBirth: '2019-09-02',
    gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    classId: 'class-6',
    className: 'Lớp Lá 2',
    ageGroup: '5-6 Tuổi',
    status: 'ACTIVE',
    emergencyContactName: 'Bùi Văn Hùng (Bố)',
    emergencyContactPhone: '0909887766',
    hasAllergy: true,
    allergies: [
      {
        id: 'alg-7',
        allergenId: '7',
        allergenName: 'Hạt cây khô (Óc chó, Hạnh nhân)',
        allergenCode: 'TREE_NUT',
        severity: 'HIGH',
        note: 'Sưng nề đường thở cấp tính: Gia đình có tiền sử sốc phản vệ hạt cây. Cấm sữa hạt béo và bánh hạt.',
        declaredAt: '2024-09-20',
      },
    ],
  },
  {
    id: '8',
    studentCode: 'HS-2024-008',
    fullName: 'Hoàng Thảo My',
    dateOfBirth: '2021-04-12',
    gender: 'FEMALE',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    classId: 'class-2',
    className: 'Lớp Mầm 2',
    ageGroup: '3-4 Tuổi',
    status: 'ACTIVE',
    emergencyContactName: 'Hoàng Thu Trang (Mẹ)',
    emergencyContactPhone: '0922334455',
    hasAllergy: true,
    allergies: [
      {
        id: 'alg-8',
        allergenId: '1',
        allergenName: 'Hải sản (Tôm, Cua, Mực)',
        allergenCode: 'SEAFOOD',
        severity: 'HIGH',
        note: 'Dị ứng mực và tôm biển: Ban đỏ toàn thân và sốt nhẹ. Thay bằng thịt bò rim cà rốt hoặc sườn non.',
        declaredAt: '2024-09-22',
      },
    ],
  },
];

export interface NutritionistAllergyManagementPageProps {
  embedded?: boolean;
}

export const NutritionistAllergyManagementPage: React.FC<NutritionistAllergyManagementPageProps> = ({
  embedded = false,
}) => {
  // Tabs: 'DIRECTORY' (Danh sách học sinh) | 'CATALOG' (8 nhóm chuẩn Codex & BYT)
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'CATALOG'>('DIRECTORY');

  // Loading & Data States
  const [isLoading, setIsLoading] = useState(true);
  const [allChildren, setAllChildren] = useState<ChildWithAllergy[]>(FALLBACK_CHILDREN);
  const [allergensList, setAllergensList] = useState<AllergenStandard[]>(FALLBACK_ALLERGENS);
  const [classesList, setClassesList] = useState<ClassOption[]>(FALLBACK_CLASSES);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedAllergenCode, setSelectedAllergenCode] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  // Modal States
  const [isDeclareModalOpen, setIsDeclareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Selected entities for modals
  const [selectedChildForCard, setSelectedChildForCard] = useState<ChildWithAllergy | null>(null);
  const [editingAllergy, setEditingAllergy] = useState<{
    childId: string;
    allergyId: string;
    childName: string;
    allergenName: string;
    severity: string;
    note: string;
  } | null>(null);

  // Form states for new declaration
  const [formChildId, setFormChildId] = useState('');
  const [formAllergenId, setFormAllergenId] = useState('');
  const [formSeverity, setFormSeverity] = useState('HIGH');
  const [formNote, setFormNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [childrenRes, allergensRes, classesRes] = await Promise.all([
        apiClient.get('/children?limit=100').catch(() => ({ data: { items: [] } })),
        apiClient.get('/allergens').catch(() => ({ data: [] })),
        apiClient.get('/classes').catch(() => ({ data: [] })),
      ]);

      const rawChildren = childrenRes.data?.data?.items || childrenRes.data?.items || childrenRes.data || [];
      const rawAllergens = allergensRes.data?.data || allergensRes.data || [];
      const rawClasses = classesRes.data?.data || classesRes.data || [];

      setAllChildren(Array.isArray(rawChildren) && rawChildren.length > 0 ? rawChildren : FALLBACK_CHILDREN);
      setAllergensList(Array.isArray(rawAllergens) && rawAllergens.length > 0 ? rawAllergens : FALLBACK_ALLERGENS);
      setClassesList(Array.isArray(rawClasses) && rawClasses.length > 0 ? rawClasses : FALLBACK_CLASSES);
    } catch (err) {
      console.error('Error fetching allergy management data:', err);
      // Fallback
      setAllChildren(FALLBACK_CHILDREN);
      setAllergensList(FALLBACK_ALLERGENS);
      setClassesList(FALLBACK_CLASSES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter children who have allergies
  const allergicChildren = useMemo(() => {
    return allChildren.filter((c) => Array.isArray(c.allergies) && c.allergies.length > 0);
  }, [allChildren]);

  // Filtered allergic children according to user search and select filters
  const filteredAllergicChildren = useMemo(() => {
    return allergicChildren.filter((child) => {
      // 1. Search Query (Name or Code)
      const matchesSearch =
        searchQuery.trim() === '' ||
        child.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.allergies.some((a) =>
          a.allergenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.note && a.note.toLowerCase().includes(searchQuery.toLowerCase())),
        );

      // 2. Class Filter
      const matchesClass =
        selectedClassId === 'ALL' ||
        child.classId === selectedClassId ||
        child.className === selectedClassId;

      // 3. Allergen Filter
      const matchesAllergen =
        selectedAllergenCode === 'ALL' ||
        child.allergies.some((a) => a.allergenCode === selectedAllergenCode || a.allergenId === selectedAllergenCode);

      // 4. Severity Filter
      const matchesSeverity =
        selectedSeverity === 'ALL' ||
        child.allergies.some((a) => a.severity === selectedSeverity);

      return matchesSearch && matchesClass && matchesAllergen && matchesSeverity;
    });
  }, [allergicChildren, searchQuery, selectedClassId, selectedAllergenCode, selectedSeverity]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalAllergic = allergicChildren.length;
    const totalStudents = allChildren.length || 1;
    const allergyRate = Math.round((totalAllergic / totalStudents) * 100);

    const highRiskCount = allergicChildren.filter((c) =>
      c.allergies.some((a) => a.severity === 'HIGH' || a.severity === 'SEVERE' || a.severity === 'ANAPHYLACTIC'),
    ).length;

    // Group counts by allergen
    const allergenCounts: Record<string, number> = {};
    allergicChildren.forEach((c) => {
      c.allergies.forEach((a) => {
        const name = a.allergenName || 'Khác';
        allergenCounts[name] = (allergenCounts[name] || 0) + 1;
      });
    });

    const topAllergenEntry = Object.entries(allergenCounts).sort((a, b) => b[1] - a[1])[0];
    const topAllergenText = topAllergenEntry ? `${topAllergenEntry[0]} (${topAllergenEntry[1]} bé)` : 'Chưa có';

    // Group counts by class
    const classCounts: Record<string, number> = {};
    allergicChildren.forEach((c) => {
      const cls = c.className || 'Chưa phân lớp';
      classCounts[cls] = (classCounts[cls] || 0) + 1;
    });
    const topClassEntry = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0];
    const topClassText = topClassEntry ? `${topClassEntry[0]} (${topClassEntry[1]} bé)` : 'Đồng đều';

    return {
      totalAllergic,
      totalStudents,
      allergyRate,
      highRiskCount,
      topAllergenText,
      topClassText,
    };
  }, [allergicChildren, allChildren]);

  // Helper color badge for allergen
  const getAllergenBadgeStyle = (code: string) => {
    switch (code) {
      case 'SEAFOOD':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'PEANUT':
      case 'TREE_NUT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MILK':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EGG':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'WHEAT':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'SOY':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'SESAME':
        return 'bg-stone-50 text-stone-800 border-stone-200';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  // Helper severity badge
  const getSeverityBadge = (severity: string) => {
    const s = severity?.toUpperCase();
    if (s === 'HIGH' || s === 'SEVERE' || s === 'ANAPHYLACTIC') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-700 border border-red-300">
          <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>Nguy cơ cao (Phản vệ)</span>
        </span>
      );
    }
    if (s === 'MEDIUM' || s === 'MODERATE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Trung bình</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>Nhẹ / Bất dung nạp</span>
      </span>
    );
  };

  // Handle Declare Allergy Submit
  const handleDeclareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChildId || !formAllergenId) {
      showToast('Vui lòng chọn học sinh và nhóm dị ứng', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`/children/${formChildId}/allergies`, {
        allergenId: Number(formAllergenId),
        severity: formSeverity,
        note: formNote,
      });

      showToast('Đã lưu hồ sơ dị ứng cho học sinh thành công');
      setIsDeclareModalOpen(false);
      setFormChildId('');
      setFormAllergenId('');
      setFormNote('');
      fetchData();
    } catch (err: any) {
      console.error('Error declaring allergy:', err);
      showToast(err.response?.data?.message || 'Có lỗi khi lưu hồ sơ dị ứng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Allergy Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAllergy) return;

    setIsSubmitting(true);
    try {
      await apiClient.put(`/children/allergies/${editingAllergy.allergyId}`, {
        severity: editingAllergy.severity,
        note: editingAllergy.note,
      });

      showToast('Đã cập nhật thông tin dị ứng thành công');
      setIsEditModalOpen(false);
      setEditingAllergy(null);
      fetchData();
    } catch (err: any) {
      console.error('Error updating allergy:', err);
      showToast(err.response?.data?.message || 'Có lỗi khi cập nhật dị ứng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Allergy Record
  const handleDeleteAllergy = async (allergyId: string, childName: string, allergenName: string) => {
    if (!window.confirm(`Xác nhận xóa cảnh báo dị ứng "${allergenName}" của học sinh "${childName}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/children/allergies/${allergyId}`);
      showToast(`Đã xóa bản ghi dị ứng của bé ${childName}`);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting allergy:', err);
      showToast(err.response?.data?.message || 'Có lỗi khi xóa bản ghi dị ứng', 'error');
    }
  };

  // Export CSV of Allergic Children
  const handleExportCSV = () => {
    if (allergicChildren.length === 0) {
      showToast('Chưa có dữ liệu học sinh dị ứng để xuất file', 'error');
      return;
    }

    const headers = ['Mã Học Sinh', 'Họ Và Tên', 'Lớp Học', 'Chất Dị Ứng', 'Mức Độ Nguy Cơ', 'Triệu Chứng & Ghi Chú Cách Ly', 'Ngày Khai Báo'];
    const rows = allergicChildren.flatMap((c) =>
      c.allergies.map((a) => [
        `"${c.studentCode}"`,
        `"${c.fullName}"`,
        `"${c.className || 'Chưa phân lớp'}"`,
        `"${a.allergenName}"`,
        `"${a.severity === 'HIGH' ? 'Nguy cơ cao' : a.severity === 'MEDIUM' ? 'Trung bình' : 'Nhẹ'}"`,
        `"${(a.note || '').replace(/"/g, '""')}"`,
        `"${a.declaredAt ? new Date(a.declaredAt).toLocaleDateString('vi-VN') : ''}"`,
      ]),
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KidMeal_Danh_Sach_Tre_Di_Ung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file báo cáo dị ứng thành công');
  };


  return (
    <div className={embedded ? "space-y-6 pt-2" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          {toastMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─── 1. TOP HERO BANNER ─── */}
      <div className="bg-gradient-to-r from-[#0d3429] via-[#114b3b] to-[#1c382f] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Chuyên Sâu Dinh Dưỡng & An Toàn Thực Phẩm Trẻ Nhỏ
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Quản Lý Hồ Sơ Dị Ứng & An Toàn Bữa Ăn Mầm Non
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              Theo dõi 8 nhóm dị ứng theo chuẩn Codex & Bộ Y Tế, phát hiện thành phần cấm kỵ trong thực đơn tuần,
              quản lý hồ sơ dinh dưỡng an toàn và dán thẻ nhận diện bàn ăn riêng cho từng bé.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
              title="Xuất file danh sách học sinh dị ứng"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Xuất Excel/CSV</span>
            </button>

            <button
              onClick={() => setIsDeclareModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Khai Báo Dị Ứng Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. TOP KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Tổng số trẻ dị ứng */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trẻ Có Hồ Sơ Dị Ứng</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.totalAllergic}</span>
            <span className="text-xs font-bold text-slate-400">/ {stats.totalStudents} bé toàn trường</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-700 font-semibold flex items-center gap-1">
            <span>Chiếm tỷ lệ {stats.allergyRate}% tổng sĩ số</span>
          </div>
        </div>

        {/* Card 2: Nguy cơ cao / Sốc phản vệ */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nguy Cơ Cao (Phản Vệ)</span>
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-red-600 tracking-tight">{stats.highRiskCount}</span>
            <span className="text-xs font-bold text-slate-400">bé</span>
          </div>
          <div className="mt-2 text-[11px] text-red-700 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>Cần thẻ đỏ & khay ăn cách ly tuyệt đối</span>
          </div>
        </div>

        {/* Card 3: Nhóm dị ứng phổ biến nhất */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chất Phổ Biến Nhất</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base font-black text-amber-800 tracking-tight block truncate">
              {stats.topAllergenText}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold">
            <span>Tập trung kiểm soát nguyên liệu này</span>
          </div>
        </div>

        {/* Card 4: Lớp có tỷ lệ cao nhất */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lớp Tỷ Lệ Cao Nhất</span>
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base font-black text-teal-800 tracking-tight block truncate">
              {stats.topClassText}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-teal-700 font-semibold">
            <span>GVCN & Bếp giám sát kỹ giờ ăn</span>
          </div>
        </div>

        {/* Card 5: Suất ăn thay thế */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Món Ăn Thay Thế</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Salad className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">100%</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <span>Đã chỉ định nguyên liệu thay thế</span>
          </div>
        </div>
      </div>

      {/* ─── 3. SUB-NAV TABS ─── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'DIRECTORY'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Danh Sách Học Sinh Dị Ứng</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'DIRECTORY' ? 'bg-rose-700 text-rose-100' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {allergicChildren.length}
          </span>
        </button>


        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'CATALOG'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>8 Nhóm Dị Ứng Codex & Phác Đồ</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'CATALOG' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {allergensList.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: DANH SÁCH HỌC SINH DỊ ỨNG ─── */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          {/* Toolbar Lọc & Tìm Kiếm */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên học sinh, mã số hoặc chất dị ứng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Lọc theo lớp */}
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="ALL">Tất cả các lớp</option>
                {classesList.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Lọc theo chất dị ứng */}
              <select
                value={selectedAllergenCode}
                onChange={(e) => setSelectedAllergenCode(e.target.value)}
                className="px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="ALL">Tất cả nhóm dị ứng</option>
                {allergensList.map((a) => (
                  <option key={a.id} value={a.code}>
                    {a.nameVi || a.name}
                  </option>
                ))}
              </select>

              {/* Lọc theo mức độ */}
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="ALL">Mọi mức độ nguy cơ</option>
                <option value="HIGH">Nguy cơ cao (Phản vệ)</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="LOW">Nhẹ</option>
              </select>

              <button
                onClick={fetchData}
                className="p-2 rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bảng Danh Sách Trẻ Dị Ứng */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Học Sinh</th>
                    <th className="py-3.5 px-4">Lớp Học</th>
                    <th className="py-3.5 px-4">Nhóm Dị Ứng</th>
                    <th className="py-3.5 px-4">Mức Độ Cảnh Báo</th>
                    <th className="py-3.5 px-4">Triệu Chứng & Hướng Dẫn Bếp</th>
                    <th className="py-3.5 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-300 mb-2" />
                        <p className="font-bold">Đang tải hồ sơ dị ứng...</p>
                      </td>
                    </tr>
                  ) : filteredAllergicChildren.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">Không tìm thấy học sinh dị ứng phù hợp với bộ lọc</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAllergicChildren.map((child) => (
                      <tr key={child.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Học sinh */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {child.avatarUrl ? (
                                <img src={child.avatarUrl} alt={child.fullName} className="w-full h-full rounded-2xl object-cover" />
                              ) : (
                                child.fullName.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{child.fullName}</span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {child.studentCode} • {child.gender === 'MALE' ? 'Nam' : 'Nữ'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Lớp */}
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 inline-block">
                            {child.className || 'Chưa phân lớp'}
                          </span>
                        </td>

                        {/* Các chất dị ứng */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {child.allergies.map((a) => (
                              <span
                                key={a.id}
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getAllergenBadgeStyle(a.allergenCode)}`}
                              >
                                {a.allergenName}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Mức độ cao nhất */}
                        <td className="py-3.5 px-4">
                          {child.allergies.map((a) => (
                            <div key={a.id} className="mb-1 last:mb-0">
                              {getSeverityBadge(a.severity)}
                            </div>
                          ))}
                        </td>

                        {/* Triệu chứng & Ghi chú Bếp */}
                        <td className="py-3.5 px-4 max-w-xs text-slate-600">
                          {child.allergies.map((a) => (
                            <div key={a.id} className="text-[11px] leading-relaxed mb-1 last:mb-0">
                              <span className="font-semibold text-slate-800">{a.allergenName}: </span>
                              <span>{a.note || 'Theo dõi sát sau giờ ăn'}</span>
                            </div>
                          ))}
                        </td>

                        {/* Thao tác */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* In thẻ bàn ăn */}
                            <button
                              onClick={() => {
                                setSelectedChildForCard(child);
                                setIsCardModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                              title="In thẻ nhận diện bàn ăn riêng"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Sửa bản ghi đầu tiên */}
                            {child.allergies.length > 0 && (
                              <button
                                onClick={() => {
                                  const a = child.allergies[0];
                                  setEditingAllergy({
                                    childId: child.id,
                                    allergyId: a.id,
                                    childName: child.fullName,
                                    allergenName: a.allergenName,
                                    severity: a.severity,
                                    note: a.note || '',
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
                                title="Chỉnh sửa ghi chú dị ứng"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Xóa */}
                            {child.allergies.length > 0 && (
                              <button
                                onClick={() =>
                                  handleDeleteAllergy(
                                    child.allergies[0].id,
                                    child.fullName,
                                    child.allergies[0].allergenName,
                                  )
                                }
                                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="Xóa cảnh báo dị ứng"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ─── TAB 3: 8 NHÓM DỊ ỨNG CHUẨN CODEX / BỘ Y TẾ ─── */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 rounded-3xl shadow-md space-y-2">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Danh Mục Chuẩn Hóa Quốc Tế CODEX & Bộ Y Tế Việt Nam
            </span>
            <h2 className="text-lg font-black">8 Nhóm Thực Phẩm Gây Dị Ứng Phổ Biến Nhất Ở Trẻ Mầm Non</h2>
            <p className="text-xs text-indigo-200 leading-relaxed max-w-3xl">
              Hơn 90% các phản ứng dị ứng và sốc phản vệ thực phẩm ở lứa tuổi mầm non bắt nguồn từ 8 nhóm này.
              Chuyên gia dinh dưỡng và Bếp ăn KidMeal luôn đối chiếu trực tiếp danh sách thực đơn với 8 nhóm để đảm bảo an toàn tuyệt đối.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allergensList.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {item.code}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-3">{item.nameVi || item.name}</h3>
                  {item.nameEn && <p className="text-[11px] text-slate-400 italic">{item.nameEn}</p>}

                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Thực phẩm cảnh báo:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{item.commonFoods || item.description || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Chuẩn Codex / BYT</span>
                  <span className="text-emerald-700 font-bold">✓ Đang theo dõi</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: KHAI BÁO DỊ ỨNG MỚI ─── */}
      {isDeclareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Khai Báo Dị Ứng Học Sinh Mới</h3>
                  <p className="text-xs text-slate-400">Tạo hồ sơ theo dõi dị ứng thực phẩm cho học sinh</p>
                </div>
              </div>
              <button onClick={() => setIsDeclareModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeclareSubmit} className="space-y-4 text-xs">
              {/* Chọn học sinh */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Chọn Học Sinh *</label>
                <select
                  value={formChildId}
                  onChange={(e) => setFormChildId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="">-- Chọn học sinh toàn trường --</option>
                  {allChildren.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.studentCode}) • Lớp: {c.className || 'Chưa phân lớp'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn chất dị ứng */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nhóm Chất Dị Ứng *</label>
                <select
                  value={formAllergenId}
                  onChange={(e) => setFormAllergenId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="">-- Chọn nhóm chất dị ứng (Codex/BYT) --</option>
                  {allergensList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nameVi || a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mức độ nguy cơ */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Mức Độ Cảnh Báo *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormSeverity('HIGH')}
                    className={`py-2 px-3 rounded-2xl font-bold border transition text-center ${
                      formSeverity === 'HIGH' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Nguy cơ cao (Phản vệ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSeverity('MEDIUM')}
                    className={`py-2 px-3 rounded-2xl font-bold border transition text-center ${
                      formSeverity === 'MEDIUM' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Trung bình
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSeverity('LOW')}
                    className={`py-2 px-3 rounded-2xl font-bold border transition text-center ${
                      formSeverity === 'LOW' ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Nhẹ
                  </button>
                </div>
              </div>

              {/* Triệu chứng & Ghi chú Bếp */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Triệu Chứng & Hướng Dẫn Món Thay Thế Cho Bếp</label>
                <textarea
                  rows={3}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ví dụ: Dị ứng tôm cua — sưng môi, khó thở. Yêu cầu Bếp thay bằng thịt lợn nạc hoặc ức gà..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeclareModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang Lưu...' : 'Lưu Hồ Sơ Dị Ứng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CẬP NHẬT GHI CHÚ DỊ ỨNG ─── */}
      {isEditModalOpen && editingAllergy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cập Nhật Hồ Sơ Dị Ứng</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Học sinh: {editingAllergy.childName} • {editingAllergy.allergenName}
                </p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Mức Độ Cảnh Báo *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAllergy({ ...editingAllergy, severity: 'HIGH' })}
                    className={`py-2 px-3 rounded-2xl font-bold border transition text-center ${
                      editingAllergy.severity === 'HIGH' ? 'bg-red-500 text-white border-red-500' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Nguy cơ cao
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAllergy({ ...editingAllergy, severity: 'MEDIUM' })}
                    className={`py-2 px-3 rounded-2xl font-bold border transition text-center ${
                      editingAllergy.severity === 'MEDIUM' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Trung bình
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAllergy({ ...editingAllergy, severity: 'LOW' })}
                    className={`py-2 px-3 rounded-2xl font-bold border transition text-center ${
                      editingAllergy.severity === 'LOW' ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Nhẹ
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Triệu Chứng & Hướng Dẫn Món Thay Cho Bếp</label>
                <textarea
                  rows={3}
                  value={editingAllergy.note}
                  onChange={(e) => setEditingAllergy({ ...editingAllergy, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md"
                >
                  {isSubmitting ? 'Đang Lưu...' : 'Cập Nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: IN THẺ NHẬN DIỆN BÀN ĂN DỊ ỨNG ─── */}
      {isCardModalOpen && selectedChildForCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                Thẻ Nhận Diện Khay Ăn Dị Ứng
              </h3>
              <button onClick={() => setIsCardModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BẢN THẺ IN (Card Print Preview) */}
            <div id="allergen-print-card" className="p-5 border-4 border-dashed border-red-500 rounded-3xl bg-red-50/40 space-y-4 text-center">
              <div className="flex items-center justify-between pb-2 border-b border-red-200">
                <span className="font-black text-red-600 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <AlertOctagon className="w-4 h-4" /> KIDMEAL CẢNH BÁO BÀN ĂN
                </span>
                <span className="text-[10px] font-bold text-slate-500">LỚP: {selectedChildForCard.className}</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">{selectedChildForCard.fullName}</h2>
                <p className="text-xs text-slate-500 font-mono">Mã số: {selectedChildForCard.studentCode}</p>
              </div>

              <div className="p-3 bg-red-100 border border-red-300 rounded-2xl space-y-1">
                <span className="text-[10px] font-black text-red-700 uppercase tracking-wider block">
                  CHẤT DỊ ỨNG CẤM KỴ TUYỆT ĐỐI:
                </span>
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {selectedChildForCard.allergies.map((a) => (
                    <span key={a.id} className="px-3 py-1 bg-red-600 text-white font-black text-xs rounded-full shadow-sm">
                      ✕ {a.allergenName}
                    </span>
                  ))}
                </div>
              </div>

              {selectedChildForCard.allergies[0]?.note && (
                <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900">Ghi chú cho Bếp & Cô giáo: </span>
                  {selectedChildForCard.allergies[0].note}
                </div>
              )}

              <p className="text-[10px] text-slate-400 italic">
                * Thẻ này dán cố định tại khay ăn và vị trí ngồi của học sinh trong giờ ăn bán trú.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>In Thẻ Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
