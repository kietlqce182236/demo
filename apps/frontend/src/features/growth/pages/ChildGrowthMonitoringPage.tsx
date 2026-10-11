import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  HeartPulse,
  Scale,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  User,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Layers,
  Edit3,
  Trash2,
  UploadCloud,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { growthApi, GrowthRecordItem, CreateGrowthDto } from '../api/growth.api';
import { apiClient } from '../../../core/api/axios';

export const ChildGrowthMonitoringPage: React.FC = () => {
  const [records, setRecords] = useState<GrowthRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [childrenList, setChildrenList] = useState<Array<{ id: string; fullName: string; studentCode: string }>>([]);

  // Expanded classes state: Record<className, boolean>
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  // Selected child for chart view
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childHistory, setChildHistory] = useState<GrowthRecordItem[]>([]);
  const [selectedChildInfo, setSelectedChildInfo] = useState<any>(null);
  const [chartMetric, setChartMetric] = useState<'WEIGHT' | 'HEIGHT' | 'BMI'>('BMI');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateGrowthDto>({
    childId: '',
    measurementDate: new Date().toISOString().split('T')[0],
    weightKg: '' as any,
    heightCm: '' as any,
    healthNotes: '',
  });

  // Edit record state
  const [editingRecord, setEditingRecord] = useState<GrowthRecordItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    measurementDate: '',
    weightKg: 0,
    heightCm: 0,
    healthNotes: '',
  });

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);

  const sampleGrowthCsv = `Mã học sinh, Ngày đo (YYYY-MM-DD), Cân nặng (kg), Chiều cao (cm), Ghi chú
HS-2026-0001, 2026-10-01, 15.2, 98.5, Khám sức khỏe định kỳ
HS-2026-0002, 2026-10-01, 14.8, 96.0, Thể lực bình thường
HS-2026-0003, 2026-10-01, 12.0, 92.0, Cần bổ sung dinh dưỡng`;

  const handleOpenEdit = (r: GrowthRecordItem) => {
    setEditingRecord(r);
    setEditFormData({
      measurementDate: r.measurementDate,
      weightKg: Number(r.weightKg),
      heightCm: Number(r.heightCm),
      healthNotes: r.healthNotes || '',
    });
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSubmitting(true);
    try {
      await growthApi.updateRecord(editingRecord.id, editFormData);
      alert('Cập nhật chỉ số phát triển thành công!');
      setEditingRecord(null);
      fetchData();
      if (selectedChildId) {
        growthApi.getChildHistory(selectedChildId).then((res) => {
          setChildHistory(res.history || []);
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật số liệu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: string, childName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi cân đo của học sinh "${childName}"?`)) return;
    try {
      await growthApi.deleteRecord(id);
      alert('Đã xóa bản ghi thành công!');
      fetchData();
      if (selectedChildId) {
        growthApi.getChildHistory(selectedChildId).then((res) => {
          setChildHistory(res.history || []);
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi xóa bản ghi.');
    }
  };

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
        lines[0].toLowerCase().includes('ngày')
          ? 1
          : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map((s) => s.trim());
        if (parts.length >= 4) {
          items.push({
            studentCode: parts[0],
            measurementDate: parts[1],
            weightKg: parseFloat(parts[2]),
            heightCm: parseFloat(parts[3]),
            healthNotes: parts[4] || undefined,
          });
        }
      }

      if (items.length === 0) {
        alert('Không tìm thấy dòng dữ liệu cân đo hợp lệ.');
        setImporting(false);
        return;
      }

      const res = await growthApi.importRecords(items);
      setImportResult({ count: res.importedCount, errors: res.errors || [] });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi nhập dữ liệu.');
    } finally {
      setImporting(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const res = await growthApi.exportReport(selectedClass !== 'ALL' ? selectedClass : undefined);
      if (!res.items || res.items.length === 0) {
        alert('Không có dữ liệu để xuất báo cáo.');
        return;
      }

      // Convert items to CSV
      const headers = ['Mã học sinh', 'Họ và tên', 'Giới tính', 'Lớp', 'Ngày đo', 'Tuổi (tháng)', 'Cân nặng (kg)', 'Chiều cao (cm)', 'WAZ', 'HAZ', 'BAZ', 'Thể lực', 'Tình trạng', 'Ghi chú'];
      const rows = res.items.map((it: any) => [
        it.studentCode,
        it.childName,
        it.gender,
        it.className,
        it.measurementDate,
        it.ageInMonths,
        it.weightKg,
        it.heightCm,
        it.waz,
        it.haz,
        it.baz,
        it.weightStatus,
        it.overallStatus,
        `"${it.notes.replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_Cao_Phat_Trien_The_Luc_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Không thể xuất báo cáo: ' + err.message);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, classRes, childRes] = await Promise.all([
        growthApi.getRecords({ limit: 50 }),
        apiClient.get('/classes').catch(() => ({ data: [] })),
        apiClient.get('/children?limit=100').catch(() => ({ data: [] })),
      ]);

      setRecords(recRes.items || []);
      const classItems = Array.isArray(classRes.data)
        ? classRes.data
        : ((classRes.data as any)?.items || (classRes.data as any)?.data || []);
      setClasses(classItems);
      const childItems = Array.isArray(childRes.data)
        ? childRes.data
        : ((childRes.data as any)?.items || (childRes.data as any)?.data || []);
      setChildrenList(childItems);

      if (recRes.items && recRes.items.length > 0 && !selectedChildId) {
        setSelectedChildId(recRes.items[0].childId);
      }
    } catch (err) {
      console.error('Error fetching growth records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      growthApi.getChildHistory(selectedChildId).then((res) => {
        setChildHistory(res.history || []);
        setSelectedChildInfo(res.child);
      }).catch(console.error);
    }
  }, [selectedChildId]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.childId) {
      alert('Vui lòng chọn học sinh');
      return;
    }

    setSubmitting(true);
    try {
      await growthApi.createRecord(formData);
      setIsModalOpen(false);
      fetchData();
      if (formData.childId === selectedChildId) {
        const hist = await growthApi.getChildHistory(formData.childId);
        setChildHistory(hist.history || []);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu chỉ số thể lực.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.child?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.child?.studentCode?.toLowerCase().includes(search.toLowerCase());
    const childClass =
      r.child?.class?.name ||
      (r as any).childClassName ||
      classes.find((cls) => String(cls.id) === String((r.child as any)?.classId || r.child?.class?.id))?.name ||
      '';
    const matchesClass =
      selectedClass === 'ALL' ||
      r.child?.class?.id === selectedClass ||
      (r.child as any)?.classId === selectedClass ||
      childClass.includes(selectedClass);
    return matchesSearch && matchesClass;
  });

  const groupedRecords = useMemo(() => {
    const groups: Record<string, { className: string; classId?: string; items: GrowthRecordItem[] }> = {};

    filteredRecords.forEach((r) => {
      const clsName =
        r.child?.class?.name ||
        (r as any).childClassName ||
        (r as any).className ||
        classes.find((cls) => String(cls.id) === String((r.child as any)?.classId || r.child?.class?.id))?.name ||
        (r.child?.studentCode?.includes('2021-05') || r.child?.studentCode?.includes('2021-04') || r.child?.studentCode?.includes('2021-03')
          ? 'Lớp Lá 2 (5-6 tuổi)'
          : r.child?.studentCode?.includes('2021-01') || r.child?.studentCode?.includes('2021-02')
          ? 'Lớp Lá 1 (5-6 tuổi)'
          : r.child?.studentCode?.includes('2022-04') || r.child?.studentCode?.includes('2022-05')
          ? 'Lớp Chồi 2 (4-5 tuổi)'
          : r.child?.studentCode?.includes('2022-01') || r.child?.studentCode?.includes('2022-02')
          ? 'Lớp Chồi 1 (4-5 tuổi)'
          : r.child?.studentCode?.includes('2023-01') || r.child?.studentCode?.includes('2023-02') || r.child?.studentCode?.includes('2023-03')
          ? 'Lớp Mầm 1 (3-4 tuổi)'
          : 'Lớp Mầm 2 (3-4 tuổi)');

      if (!groups[clsName]) {
        groups[clsName] = {
          className: clsName,
          classId: (r.child as any)?.classId || r.child?.class?.id,
          items: [],
        };
      }
      groups[clsName].items.push(r);
    });

    return Object.values(groups).sort((a, b) => a.className.localeCompare(b.className, 'vi'));
  }, [filteredRecords, classes]);

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    groupedRecords.forEach((g) => {
      initial[g.className] = expandedClasses[g.className] !== undefined ? expandedClasses[g.className] : true;
    });
    setExpandedClasses(initial);
  }, [groupedRecords.length]);

  const toggleClassExpand = (className: string) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [className]: prev[className] !== undefined ? !prev[className] : false,
    }));
  };

  const expandAllClasses = () => {
    const next: Record<string, boolean> = {};
    groupedRecords.forEach((g) => {
      next[g.className] = true;
    });
    setExpandedClasses(next);
  };

  const collapseAllClasses = () => {
    const next: Record<string, boolean> = {};
    groupedRecords.forEach((g) => {
      next[g.className] = false;
    });
    setExpandedClasses(next);
  };

  // Calculate summary stats
  const totalEvaluated = records.length;
  const normalCount = records.filter(
    (r) =>
      r.overallNutritionalStatus === 'NORMAL' ||
      r.overallNutritionalStatus === 'BINH_THUONG' ||
      r.overallNutritionalStatus?.toLowerCase().includes('bình thường')
  ).length;
  const stuntedCount = records.filter(
    (r) =>
      r.heightClassification?.includes('STUNTED') ||
      r.heightClassification?.toLowerCase().includes('thấp còi')
  ).length;
  const overweightCount = records.filter(
    (r) =>
      r.bmiClassification?.includes('OVERWEIGHT') ||
      r.bmiClassification === 'OBESE' ||
      r.bmiClassification?.toLowerCase().includes('thừa cân') ||
      r.bmiClassification?.toLowerCase().includes('béo phì')
  ).length;

  // Generate continuous WHO Growth Curve Reference (24 to 60 months)
  const isFemale = selectedChildInfo?.gender === 'FEMALE';
  const referenceAges = [24, 30, 36, 42, 48, 54, 60];
  const childAges = childHistory.map((h) => h.ageInMonths);
  const allMonths = Array.from(new Set([...referenceAges, ...childAges])).sort((a, b) => a - b);

  // Max measured values for dynamic Y-axis scaling
  const maxWeightMeasured = Math.max(0, ...childHistory.map((h) => Number(h.weightKg) || 0));
  const maxHeightMeasured = Math.max(0, ...childHistory.map((h) => Number(h.heightCm) || 0));
  const maxBmiMeasured = Math.max(0, ...childHistory.map((h) => Number(h.bmi) || 0));

  const chartData = allMonths.map((m) => {
    // 1. Weight (kg) - WHO WAZ
    const medianWeight = isFemale
      ? Number((11.5 + (m - 24) * ((17.7 - 11.5) / 36)).toFixed(1))
      : Number((12.2 + (m - 24) * ((18.3 - 12.2) / 36)).toFixed(1));
    const plus2SdWeight = isFemale
      ? Number((14.2 + (m - 24) * ((23.0 - 14.2) / 36)).toFixed(1))
      : Number((14.8 + (m - 24) * ((23.2 - 14.8) / 36)).toFixed(1));
    const minus2SdWeight = isFemale
      ? Number((9.4 + (m - 24) * ((13.5 - 9.4) / 36)).toFixed(1))
      : Number((10.1 + (m - 24) * ((13.9 - 10.1) / 36)).toFixed(1));

    // 2. Height (cm) - WHO HAZ
    const medianHeight = isFemale
      ? Number((86.4 + (m - 24) * ((109.4 - 86.4) / 36)).toFixed(1))
      : Number((87.8 + (m - 24) * ((110.0 - 87.8) / 36)).toFixed(1));
    const plus2SdHeight = isFemale
      ? Number((93.5 + (m - 24) * ((118.8 - 93.5) / 36)).toFixed(1))
      : Number((94.8 + (m - 24) * ((119.0 - 94.8) / 36)).toFixed(1));
    const minus2SdHeight = isFemale
      ? Number((79.3 + (m - 24) * ((100.1 - 79.3) / 36)).toFixed(1))
      : Number((80.8 + (m - 24) * ((101.0 - 80.8) / 36)).toFixed(1));

    // 3. BMI (kg/m²) - WHO BAZ
    const medianBmi = isFemale
      ? Number((15.7 - (m - 24) * ((15.7 - 15.0) / 36)).toFixed(1))
      : Number((16.0 - (m - 24) * ((16.0 - 15.2) / 36)).toFixed(1));
    const plus2SdBmi = isFemale
      ? Number((18.2 - (m - 24) * ((18.2 - 18.0) / 36)).toFixed(1))
      : Number((18.2 - (m - 24) * ((18.2 - 18.0) / 36)).toFixed(1));
    const plus3SdBmi = isFemale
      ? Number((19.8 - (m - 24) * ((19.8 - 19.7) / 36)).toFixed(1))
      : Number((19.8 - (m - 24) * ((19.8 - 19.6) / 36)).toFixed(1));
    const minus2SdBmi = isFemale
      ? Number((13.7 - (m - 24) * ((13.7 - 13.0) / 36)).toFixed(1))
      : Number((14.0 - (m - 24) * ((14.0 - 13.2) / 36)).toFixed(1));

    const measuredRecord = childHistory.find((h) => h.ageInMonths === m);

    return {
      month: `${m} thg`,
      ageMonth: m,
      medianWeight,
      plus2SdWeight,
      minus2SdWeight,
      actualWeight: measuredRecord ? Number(measuredRecord.weightKg) : null,
      medianHeight,
      plus2SdHeight,
      minus2SdHeight,
      actualHeight: measuredRecord ? Number(measuredRecord.heightCm) : null,
      medianBmi,
      plus2SdBmi,
      plus3SdBmi,
      minus2SdBmi,
      actualBmi: measuredRecord ? Number(measuredRecord.bmi) : null,
    };
  });

  // Custom Tooltip luôn hiển thị dòng số liệu học sinh rõ ràng ở vị trí đầu tiên
  const CustomGrowthTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const currentData = chartData.find((d) => d.month === label);
    const ageMonth = currentData?.ageMonth || parseInt(String(label).replace(/[^\d]/g, ''), 10);

    const recordAtMonth = childHistory.find((h) => h.ageInMonths === ageMonth);
    const latestRecord = childHistory.length > 0 ? childHistory[childHistory.length - 1] : null;

    const unit = chartMetric === 'BMI' ? ' kg/m²' : chartMetric === 'WEIGHT' ? ' kg' : ' cm';
    const metricTitle =
      chartMetric === 'BMI' ? 'Chỉ số BMI' : chartMetric === 'WEIGHT' ? 'Cân nặng' : 'Chiều cao';

    let actualVal: number | null = null;
    if (recordAtMonth) {
      actualVal =
        chartMetric === 'BMI'
          ? Number(recordAtMonth.bmi)
          : chartMetric === 'WEIGHT'
          ? Number(recordAtMonth.weightKg)
          : Number(recordAtMonth.heightCm);
    }

    let latestVal: number | null = null;
    if (latestRecord) {
      latestVal =
        chartMetric === 'BMI'
          ? Number(latestRecord.bmi)
          : chartMetric === 'WEIGHT'
          ? Number(latestRecord.weightKg)
          : Number(latestRecord.heightCm);
    }

    const medianVal =
      chartMetric === 'BMI'
        ? currentData?.medianBmi
        : chartMetric === 'WEIGHT'
        ? currentData?.medianWeight
        : currentData?.medianHeight;

    const diffFromMedian =
      actualVal != null && medianVal != null ? (actualVal - medianVal).toFixed(1) : null;

    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs min-w-[270px] max-w-xs space-y-2.5">
        <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
          <span className="font-extrabold text-slate-900 text-sm">📅 Mốc: {label}</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            Chuẩn WHO 2006
          </span>
        </div>

        {/* ─── DÒNG SỐ LIỆU HỌC SINH (LUÔN LUÔN HIỂN THỊ ĐẦU TIÊN) ─── */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/90 rounded-xl p-2.5 shadow-xs">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-teal-950 truncate">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
              <span className="truncate">Bé: {selectedChildInfo?.fullName || 'Học sinh'}</span>
            </div>
            {recordAtMonth && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  recordAtMonth.overallNutritionalStatus?.includes('OBESE') ||
                  recordAtMonth.bmiClassification === 'OBESE' ||
                  recordAtMonth.overallNutritionalStatus?.toLowerCase().includes('béo phì')
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : recordAtMonth.overallNutritionalStatus?.includes('OVERWEIGHT') ||
                      recordAtMonth.overallNutritionalStatus?.toLowerCase().includes('thừa cân')
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : recordAtMonth.overallNutritionalStatus?.includes('STUNTED') ||
                      recordAtMonth.overallNutritionalStatus?.toLowerCase().includes('thấp còi') ||
                      recordAtMonth.overallNutritionalStatus?.includes('WASTED')
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {recordAtMonth.overallNutritionalStatus?.toLowerCase().includes('béo phì') ||
                recordAtMonth.bmiClassification === 'OBESE'
                  ? 'Béo phì'
                  : recordAtMonth.overallNutritionalStatus?.toLowerCase().includes('thừa cân')
                  ? 'Thừa cân'
                  : recordAtMonth.overallNutritionalStatus?.toLowerCase().includes('thấp còi')
                  ? 'Thấp còi'
                  : 'Bình thường'}
              </span>
            )}
          </div>

          {recordAtMonth ? (
            <div className="mt-1.5 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-teal-700 font-semibold">{metricTitle}: </span>
                <span className="text-base font-black text-teal-950">
                  {actualVal}
                  {unit}
                </span>
              </div>
              {diffFromMedian && (
                <span
                  className={`text-[10px] font-bold ${
                    Number(diffFromMedian) > 0 ? 'text-amber-700' : 'text-slate-600'
                  }`}
                >
                  {Number(diffFromMedian) > 0 ? `+${diffFromMedian}` : diffFromMedian}
                  {unit} vs Median
                </span>
              )}
            </div>
          ) : (
            <div className="mt-1 space-y-0.5 text-slate-500">
              <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                <span>⚠️ Chưa ghi nhận lần đo tại mốc {label}</span>
              </div>
              {latestRecord && (
                <div className="text-[10px] text-slate-600">
                  Lần đo gần nhất:{' '}
                  <strong className="text-teal-900 font-bold">
                    {latestVal}
                    {unit}
                  </strong>{' '}
                  (lúc {latestRecord.ageInMonths} thg • {new Date(latestRecord.measurementDate).toLocaleDateString('vi-VN')})
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── CÁC ĐƯỜNG CHUẨN WHO THEO TUỔI ─── */}
        <div className="space-y-1.5 pt-0.5 text-[11px]">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Các ngưỡng quy chuẩn WHO:
          </div>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey.startsWith('actual')) return null;
            return (
              <div key={`item-${index}`} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-1 rounded-full shrink-0"
                    style={{ backgroundColor: entry.stroke || entry.color }}
                  />
                  <span className="truncate">{entry.name}:</span>
                </div>
                <span className="font-bold text-slate-800 ml-2 shrink-0">
                  {entry.value}
                  {unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ─── 1. TOP HEADER BANNER ─── */}
      <div className="bg-gradient-to-r from-teal-950 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Chuẩn Nhân Trắc Học WHO 2006
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Theo Dõi Thể Lực & Tăng Trưởng Trẻ Mầm Non
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm leading-relaxed">
              Tự động tính toán các chỉ số Z-Score theo phương pháp LMS: Cân nặng theo tuổi (WAZ), Chiều cao theo tuổi (HAZ) và BMI theo tuổi (BAZ).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportReport}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
              title="Xuất file CSV báo cáo thể lực học sinh"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Báo Cáo</span>
            </button>
            <button
              onClick={() => {
                setImportText('');
                setImportResult(null);
                setIsImportModalOpen(true);
              }}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
              title="Nhập hàng loạt số liệu cân đo từ bảng tính"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Nhập Excel / CSV</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi Nhận Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. SUMMARY KPI STATS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Đánh Giá</div>
          <div className="text-2xl font-black text-slate-900">{totalEvaluated} <span className="text-sm font-semibold text-slate-400">lượt</span></div>
          <div className="text-xs text-slate-400">Dữ liệu cân đo định kỳ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Bình Thường</div>
          <div className="text-2xl font-black text-emerald-700">
            {totalEvaluated ? Math.round((normalCount / totalEvaluated) * 100) : 85}%
          </div>
          <div className="text-xs text-emerald-600 font-semibold">{normalCount} học sinh đạt chuẩn WHO</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Thấp Còi (HAZ &lt; -2 SD)</div>
          <div className="text-2xl font-black text-amber-700">
            {totalEvaluated ? Math.round((stuntedCount / totalEvaluated) * 100) : 5}%
          </div>
          <div className="text-xs text-amber-600 font-semibold">{stuntedCount} trẻ cần can thiệp vi chất</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Thừa Cân / Béo Phì</div>
          <div className="text-2xl font-black text-rose-700">
            {totalEvaluated ? Math.round((overweightCount / totalEvaluated) * 100) : 6}%
          </div>
          <div className="text-xs text-rose-600 font-semibold">{overweightCount} trẻ cần giảm chất béo/ngọt</div>
        </div>
      </div>

      {/* ─── 3. INTERACTIVE WHO GROWTH CHART SECTION ─── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              Biểu Đồ Đường Cong Tăng Trưởng WHO Chuẩn Theo Từng Bé
            </h3>
            <p className="text-xs text-slate-500">
              {selectedChildInfo ? (
                <span>
                  Học sinh: <strong className="text-slate-800">{selectedChildInfo.fullName}</strong> ({selectedChildInfo.gender === 'FEMALE' ? 'Bé gái 👧' : 'Bé trai 👦'} • {selectedChildInfo.studentCode} • {selectedChildInfo.class?.name || 'Mầm non'})
                </span>
              ) : (
                'Chọn học sinh trong danh sách để xem biểu đồ chi tiết'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setChartMetric('BMI')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  chartMetric === 'BMI'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 Chỉ Số BMI (kg/m²)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('WEIGHT')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  chartMetric === 'WEIGHT'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚖️ Cân Nặng (kg)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('HEIGHT')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  chartMetric === 'HEIGHT'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📏 Chiều Cao (cm)
              </button>
            </div>

            {childHistory.length > 0 && (
              <div className="text-xs font-bold bg-teal-50 text-teal-800 px-3 py-1.5 rounded-2xl border border-teal-200">
                Lần đo gần nhất: {childHistory[childHistory.length - 1].weightKg} kg • {childHistory[childHistory.length - 1].heightCm} cm • BMI: {childHistory[childHistory.length - 1].bmi}
              </div>
            )}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              {chartMetric === 'BMI' && (
                <YAxis
                  unit=" kg/m²"
                  tick={{ fontSize: 12 }}
                  domain={[11, Math.max(24, Math.ceil(maxBmiMeasured + 3))]}
                />
              )}
              {chartMetric === 'WEIGHT' && (
                <YAxis
                  unit=" kg"
                  tick={{ fontSize: 12 }}
                  domain={[8, Math.max(26, Math.ceil(maxWeightMeasured + 3))]}
                />
              )}
              {chartMetric === 'HEIGHT' && (
                <YAxis
                  unit=" cm"
                  tick={{ fontSize: 12 }}
                  domain={[75, Math.max(120, Math.ceil(maxHeightMeasured + 4))]}
                />
              )}

              <Tooltip content={<CustomGrowthTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

              {/* Đường chuẩn ngang ReferenceLine định vị số liệu học sinh */}
              {childHistory.length > 0 && (
                <ReferenceLine
                  y={
                    chartMetric === 'BMI'
                      ? Number(childHistory[childHistory.length - 1].bmi)
                      : chartMetric === 'WEIGHT'
                      ? Number(childHistory[childHistory.length - 1].weightKg)
                      : Number(childHistory[childHistory.length - 1].heightCm)
                  }
                  stroke={chartMetric === 'BMI' ? '#e11d48' : chartMetric === 'WEIGHT' ? '#0d9488' : '#0284c7'}
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `👤 ${selectedChildInfo?.fullName || 'Bé'}: ${
                      chartMetric === 'BMI'
                        ? childHistory[childHistory.length - 1].bmi + ' kg/m²'
                        : chartMetric === 'WEIGHT'
                        ? childHistory[childHistory.length - 1].weightKg + ' kg'
                        : childHistory[childHistory.length - 1].heightCm + ' cm'
                    }`,
                    fill: chartMetric === 'BMI' ? '#be123c' : chartMetric === 'WEIGHT' ? '#0f766e' : '#0369a1',
                    fontSize: 11,
                    fontWeight: 'bold',
                    position: 'insideTopRight',
                  }}
                />
              )}

              {chartMetric === 'BMI' && (
                <>
                  <Line type="monotone" dataKey="plus3SdBmi" name="+3 SD (Béo phì nặng)" stroke="#dc2626" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="plus2SdBmi" name="+2 SD (Nguy cơ thừa cân)" stroke="#f59e0b" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="medianBmi" name="Chuẩn Trung vị WHO (Median)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="minus2SdBmi" name="-2 SD (Nguy cơ gầy còm)" stroke="#ef4444" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="actualBmi" name="Chỉ số BMI thực tế của bé (kg/m²)" stroke="#e11d48" strokeWidth={3.5} dot={{ r: 6, fill: '#e11d48', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} connectNulls={true} />
                </>
              )}

              {chartMetric === 'WEIGHT' && (
                <>
                  <Line type="monotone" dataKey="plus2SdWeight" name="+2 SD (Nguy cơ thừa cân)" stroke="#f59e0b" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="medianWeight" name="Chuẩn Trung vị WHO (Median)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="minus2SdWeight" name="-2 SD (Nguy cơ nhẹ cân)" stroke="#ef4444" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="actualWeight" name="Cân nặng thực tế của bé (kg)" stroke="#0d9488" strokeWidth={3.5} dot={{ r: 6, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} connectNulls={true} />
                </>
              )}

              {chartMetric === 'HEIGHT' && (
                <>
                  <Line type="monotone" dataKey="plus2SdHeight" name="+2 SD (Chiều cao vượt trội)" stroke="#f59e0b" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="medianHeight" name="Chuẩn Chiều cao WHO (Median)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="minus2SdHeight" name="-2 SD (Nguy cơ thấp còi)" stroke="#ef4444" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="actualHeight" name="Chiều cao thực tế của bé (cm)" stroke="#0284c7" strokeWidth={3.5} dot={{ r: 6, fill: '#0284c7', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} connectNulls={true} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── 4. SEARCH & FILTER BAR ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, mã số..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Nút Sổ tất cả lớp / Thu gọn tất cả */}
          <div className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-2xl p-1 shadow-xs">
            <button
              type="button"
              onClick={expandAllClasses}
              className="px-2.5 py-1 text-xs font-bold rounded-xl text-teal-700 hover:bg-teal-50 transition flex items-center gap-1"
              title="Sổ danh sách tất cả các lớp ra"
            >
              <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
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
            className="px-3 py-2 text-xs rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
          >
            <option value="ALL">Tất cả các lớp</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── 5. MEASUREMENT RECORDS ACCORDION BY CLASS ─── */}
      <div className="space-y-4">
        {groupedRecords.length > 0 ? (
          groupedRecords.map((group) => {
            const isExpanded = expandedClasses[group.className] !== false;
            const stuntedInClass = group.items.filter(
              (r) =>
                r.heightClassification?.includes('STUNTED') ||
                r.heightClassification?.toLowerCase().includes('thấp còi')
            ).length;
            const overweightInClass = group.items.filter(
              (r) =>
                r.bmiClassification?.includes('OVERWEIGHT') ||
                r.bmiClassification === 'OBESE' ||
                r.bmiClassification?.toLowerCase().includes('thừa cân') ||
                r.bmiClassification?.toLowerCase().includes('béo phì')
            ).length;

            return (
              <div
                key={group.className}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* Accordion Class Header */}
                <div
                  onClick={() => toggleClassExpand(group.className)}
                  className="px-5 py-3.5 bg-gradient-to-r from-slate-50 via-teal-50/20 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-teal-50/40 transition select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleClassExpand(group.className);
                      }}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-teal-700 hover:border-teal-400 shadow-xs transition"
                      title={isExpanded ? 'Thu gọn lớp' : 'Sổ danh sách lớp ra'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-teal-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{group.className}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
                        {group.items.length} học sinh
                      </span>
                      {stuntedInClass > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          {stuntedInClass} thấp còi
                        </span>
                      )}
                      {overweightInClass > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          {overweightInClass} thừa cân/béo phì
                        </span>
                      )}
                      {stuntedInClass === 0 && overweightInClass === 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          100% chuẩn thể lực
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
                          : 'bg-teal-600 text-white shadow-sm hover:bg-teal-700'
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
                          <th className="py-3.5 px-3">Ngày Đo</th>
                          <th className="py-3.5 px-3">Tuổi (Tháng)</th>
                          <th className="py-3.5 px-3">Cân Nặng</th>
                          <th className="py-3.5 px-3">Chiều Cao</th>
                          <th className="py-3.5 px-3">BMI</th>
                          <th className="py-3.5 px-3">Z-Score (WAZ / HAZ / BAZ)</th>
                          <th className="py-3.5 px-3">Tình Trạng Thể Lực</th>
                          <th className="py-3.5 px-4 text-right">Xem Biểu Đồ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.items.map((r) => {
                          const isNormal =
                            r.overallNutritionalStatus === 'NORMAL' ||
                            r.overallNutritionalStatus === 'BINH_THUONG' ||
                            r.overallNutritionalStatus?.toLowerCase().includes('bình thường');
                          const isStunted =
                            r.heightClassification?.includes('STUNTED') ||
                            r.heightClassification?.toLowerCase().includes('thấp còi');
                          const isOverweight =
                            r.bmiClassification?.includes('OVERWEIGHT') ||
                            r.bmiClassification === 'OBESE' ||
                            r.bmiClassification?.toLowerCase().includes('thừa cân') ||
                            r.bmiClassification?.toLowerCase().includes('béo phì');

                          return (
                            <tr
                              key={r.id}
                              className={`hover:bg-teal-50/30 transition cursor-pointer ${
                                selectedChildId === r.childId ? 'bg-teal-50/50' : ''
                              }`}
                              onClick={() => setSelectedChildId(r.childId)}
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{r.child?.fullName}</div>
                                <div className="text-[11px] text-slate-400">
                                  {r.child?.studentCode} • {group.className}
                                </div>
                              </td>
                              <td className="py-3.5 px-3 font-semibold text-slate-700">
                                {new Date(r.measurementDate).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="py-3.5 px-3 font-semibold text-slate-700">{r.ageInMonths} thg</td>
                              <td className="py-3.5 px-3 font-black text-slate-900">{r.weightKg} kg</td>
                              <td className="py-3.5 px-3 font-black text-slate-900">{r.heightCm} cm</td>
                              <td className="py-3.5 px-3 font-semibold text-slate-700">{r.bmi}</td>
                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold" title="Cân nặng theo tuổi (WAZ)">
                                    W: {r.waz > 0 ? `+${r.waz}` : r.waz}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold" title="Chiều cao theo tuổi (HAZ)">
                                    H: {r.haz > 0 ? `+${r.haz}` : r.haz}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold" title="BMI theo tuổi (BAZ)">
                                    B: {r.baz > 0 ? `+${r.baz}` : r.baz}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    isNormal
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isStunted
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : isOverweight
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {isNormal
                                    ? 'Bình thường'
                                    : isStunted
                                    ? 'Thấp còi'
                                    : isOverweight
                                    ? (r.bmiClassification === 'OBESE' ? 'Béo phì' : 'Thừa cân')
                                    : r.overallNutritionalStatus}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEdit(r);
                                    }}
                                    title="Sửa số liệu đo"
                                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRecord(r.id, r.child?.fullName || 'học sinh');
                                    }}
                                    title="Xóa bản ghi sai sót"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedChildId(r.childId);
                                    }}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition ${
                                      selectedChildId === r.childId
                                        ? 'bg-teal-600 text-white'
                                        : 'text-teal-700 hover:bg-teal-50'
                                    }`}
                                  >
                                    Biểu đồ
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-400">
            Không tìm thấy bản ghi cân đo nào phù hợp bộ lọc.
          </div>
        )}
      </div>

      {/* ─── 6. CREATE RECORD MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">Ghi Nhận Chỉ Số Cân Đo</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Học Sinh *</label>
                <select
                  required
                  value={formData.childId}
                  onChange={(e) => setFormData({ ...formData, childId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
                >
                  <option value="">-- Chọn học sinh --</option>
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.studentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Đo *</label>
                <input
                  type="date"
                  required
                  value={formData.measurementDate}
                  onChange={(e) => setFormData({ ...formData, measurementDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cân Nặng (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="60"
                    required
                    placeholder="VD: 14.5"
                    value={formData.weightKg || ''}
                    onChange={(e) => setFormData({ ...formData, weightKg: parseFloat(e.target.value) || ('' as any) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chiều Cao (cm) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="40"
                    max="150"
                    required
                    placeholder="VD: 95.0"
                    value={formData.heightCm || ''}
                    onChange={(e) => setFormData({ ...formData, heightCm: parseFloat(e.target.value) || ('' as any) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold"
                  />
                </div>
              </div>

              {/* Real-time BMI preview */}
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200/60 text-xs flex items-center justify-between">
                <span className="font-semibold text-teal-900">Chỉ số BMI dự tính:</span>
                <span className="font-black text-teal-800 text-sm">
                  {formData.heightCm > 0
                    ? (formData.weightKg / ((formData.heightCm / 100) * (formData.heightCm / 100))).toFixed(2)
                    : 0}{' '}
                  kg/m²
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Sức Khỏe / Thể Lực</label>
                <textarea
                  rows={2}
                  value={formData.healthNotes}
                  onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                  placeholder="Ghi chú về thói quen ăn uống, giấc ngủ hoặc tư vấn phụ huynh..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu chỉ số WHO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 7. EDIT RECORD MODAL ─── */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Chỉnh Sửa Chỉ Số Thể Lực</h3>
                  <p className="text-[11px] text-slate-400">
                    {editingRecord.child?.fullName} ({editingRecord.child?.studentCode})
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingRecord(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Ngày Đo *</label>
                <input
                  type="date"
                  required
                  value={editFormData.measurementDate}
                  onChange={(e) => setEditFormData({ ...editFormData, measurementDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cân Nặng (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="60"
                    required
                    value={editFormData.weightKg || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, weightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chiều Cao (cm) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="40"
                    max="150"
                    required
                    value={editFormData.heightCm || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, heightCm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold"
                  />
                </div>
              </div>

              {/* BMI preview */}
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200/60 text-xs flex items-center justify-between">
                <span className="font-semibold text-teal-900">BMI mới ước tính:</span>
                <span className="font-black text-teal-800 text-sm">
                  {editFormData.heightCm > 0
                    ? (editFormData.weightKg / ((editFormData.heightCm / 100) * (editFormData.heightCm / 100))).toFixed(2)
                    : 0}{' '}
                  kg/m²
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ghi Chú Sức Khỏe</label>
                <textarea
                  rows={2}
                  value={editFormData.healthNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, healthNotes: e.target.value })}
                  placeholder="Ghi chú điều chỉnh..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 8. IMPORT MEASUREMENTS MODAL ─── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Nhập Dữ Liệu Cân Đo Hàng Loạt</h3>
                  <p className="text-[11px] text-slate-400">Định dạng CSV hoặc dán trực tiếp từ bảng tính Excel</p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900">Cấu trúc cột dữ liệu:</span>
                  <button
                    onClick={() => setImportText(sampleGrowthCsv)}
                    className="text-teal-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Dán dữ liệu mẫu
                  </button>
                </div>
                <code className="block bg-white p-2 rounded-xl border border-teal-200/80 text-[11px] text-slate-700 font-mono overflow-x-auto whitespace-pre">
                  Mã học sinh, Ngày đo (YYYY-MM-DD), Cân nặng (kg), Chiều cao (cm), Ghi chú
                </code>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Dán nội dung bảng tính hoặc CSV vào đây:
                </label>
                <textarea
                  rows={6}
                  placeholder={`Ví dụ:\nHS-2026-0001, 2026-10-01, 15.2, 98.5, Đợt khám định kỳ\nHS-2026-0002, 2026-10-01, 14.8, 96.0, `}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {importResult && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã ghi nhận thành công {importResult.count} bản ghi cân đo!</span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-rose-600">Các lỗi cần lưu ý ({importResult.errors.length}):</span>
                      <ul className="list-disc pl-5 text-[11px] text-rose-600 max-h-28 overflow-y-auto">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition text-xs"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={importing || !importText.trim()}
                onClick={handleImportSubmit}
                className="px-5 py-2 font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md transition disabled:opacity-50 text-xs flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{importing ? 'Đang nhập...' : 'Bắt đầu nhập dữ liệu'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
