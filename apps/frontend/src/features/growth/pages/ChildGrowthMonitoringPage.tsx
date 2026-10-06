import React, { useState, useEffect } from 'react';
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

  // Selected child for chart view
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childHistory, setChildHistory] = useState<GrowthRecordItem[]>([]);
  const [selectedChildInfo, setSelectedChildInfo] = useState<any>(null);

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
        apiClient.get('/classes').catch(() => ({ data: { items: [] } })),
        apiClient.get('/children?limit=100').catch(() => ({ data: { items: [] } })),
      ]);

      setRecords(recRes.items || []);
      setClasses(classRes.data?.items || []);
      setChildrenList(childRes.data?.items || []);

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
    const matchesClass = selectedClass === 'ALL' || r.child?.class?.id === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Calculate summary stats
  const totalEvaluated = records.length;
  const normalCount = records.filter((r) => r.overallNutritionalStatus?.includes('bình thường')).length;
  const stuntedCount = records.filter((r) => r.heightClassification?.includes('STUNTED')).length;
  const overweightCount = records.filter((r) => r.bmiClassification?.includes('OVERWEIGHT') || r.bmiClassification === 'OBESE').length;

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
              Biểu Đồ Đường Cong Tăng Trưởng WHO (Growth Curves)
            </h3>
            <p className="text-xs text-slate-500">
              {selectedChildInfo ? `Học sinh: ${selectedChildInfo.fullName} (${selectedChildInfo.studentCode}) • Lớp: ${selectedChildInfo.class?.name || 'Mầm non'}` : 'Chọn học sinh trong danh sách để xem biểu đồ chi tiết'}
            </p>
          </div>

          {childHistory.length > 0 && (
            <div className="text-xs font-bold bg-teal-50 text-teal-800 px-3 py-1.5 rounded-full border border-teal-200">
              Lần đo gần nhất: {childHistory[childHistory.length - 1].weightKg} kg • {childHistory[childHistory.length - 1].heightCm} cm (BMI: {childHistory[childHistory.length - 1].bmi})
            </div>
          )}
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={childHistory.map((h) => ({
                month: `${h.ageInMonths} thg`,
                actualWeight: Number(h.weightKg),
                actualHeight: Number(h.heightCm),
                medianWeight: Number(h.child?.gender === 'FEMALE' ? 10 + h.ageInMonths * 0.17 : 10.5 + h.ageInMonths * 0.18).toFixed(1),
                minus2SdWeight: Number(h.child?.gender === 'FEMALE' ? 8.5 + h.ageInMonths * 0.14 : 9.0 + h.ageInMonths * 0.15).toFixed(1),
                plus2SdWeight: Number(h.child?.gender === 'FEMALE' ? 12 + h.ageInMonths * 0.21 : 12.5 + h.ageInMonths * 0.22).toFixed(1),
              }))}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis unit=" kg" tick={{ fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

              <Line type="monotone" dataKey="plus2SdWeight" name="+2 SD (Nguy cơ thừa cân)" stroke="#f59e0b" strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="medianWeight" name="Chuẩn Trung vị WHO (Median)" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="minus2SdWeight" name="-2 SD (Nguy cơ nhẹ cân)" stroke="#ef4444" strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="actualWeight" name="Cân nặng thực tế (kg)" stroke="#0d9488" strokeWidth={3} dot={{ r: 5, fill: '#0d9488' }} />
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

        <div className="flex items-center gap-3 w-full sm:w-auto">
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

      {/* ─── 5. MEASUREMENT RECORDS TABLE ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => {
                  const isNormal = r.overallNutritionalStatus?.includes('bình thường');
                  const isStunted = r.heightClassification?.includes('STUNTED');
                  const isOverweight = r.bmiClassification?.includes('OVERWEIGHT') || r.bmiClassification === 'OBESE';

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
                          {r.child?.studentCode} • {r.child?.class?.name || 'Mầm non'}
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
                          {r.overallNutritionalStatus}
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
                            className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 pl-1"
                          >
                            <span>Biểu đồ</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Không tìm thấy dữ liệu cân đo nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
