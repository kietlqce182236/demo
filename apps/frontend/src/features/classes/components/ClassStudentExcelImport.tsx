import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Users,
  UserPlus,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { childrenApi } from '../../children/api/children.api';

export interface ParsedStudentRow {
  studentCode?: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  isValid: boolean;
  validationError?: string;
}

interface ClassStudentExcelImportProps {
  classId: string;
  className: string;
  onImportSuccess: (count: number) => void;
  onCancel?: () => void;
}

export const ClassStudentExcelImport: React.FC<ClassStudentExcelImportProps> = ({
  classId,
  className,
  onImportSuccess,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  // 1. Tải về file mẫu Excel chuẩn
  const handleDownloadTemplate = () => {
    const headers = [
      'STT',
      'Mã học sinh (Tùy chọn)',
      'Họ và tên (*)',
      'Giới tính (Nam/Nữ) (*)',
      'Ngày sinh (YYYY-MM-DD hoặc DD/MM/YYYY) (*)',
      'Họ tên phụ huynh',
      'Số điện thoại phụ huynh',
      'Ghi chú y tế / Dị ứng',
    ];

    const sampleData = [
      [1, 'BM-HS51', 'Nguyễn Hoàng Khang', 'Nam', '2021-04-12', 'Nguyễn Văn Tuấn', '0901234567', 'Dị ứng sữa bò'],
      [2, 'BM-HS52', 'Trần Thảo Linh', 'Nữ', '2021-08-20', 'Trần Thị Thu', '0912345678', 'Bình thường'],
      [3, '', 'Lê Minh Quân', 'Nam', '2021-02-15', 'Lê Quốc Việt', '0987654321', 'Kiêng đậu phộng'],
      [4, '', 'Vũ Khánh An', 'Nữ', '2021-11-05', 'Vũ Văn Hùng', '0933221100', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

    // Căn chỉnh độ rộng các cột
    ws['!cols'] = [
      { wch: 6 },  // STT
      { wch: 22 }, // Mã HS
      { wch: 25 }, // Họ tên
      { wch: 20 }, // Giới tính
      { wch: 30 }, // Ngày sinh
      { wch: 25 }, // Phụ huynh
      { wch: 22 }, // SĐT
      { wch: 28 }, // Ghi chú
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Hoc_Sinh');

    const cleanClassName = className.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    XLSX.writeFile(wb, `Mau_Nhap_Hoc_Sinh_${cleanClassName}.xlsx`);
  };

  // 2. Phân tích nội dung file Excel khi người dùng chọn
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);
    setSuccessResult(null);
    setIsParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];

      if (!ws) {
        throw new Error('File Excel rỗng hoặc không có sheet hợp lệ.');
      }

      // Đọc bảng dạng mảng 2 chiều (mảng các hàng)
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (data.length < 2) {
        throw new Error('File Excel cần có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu học sinh.');
      }

      // Tìm dòng tiêu đề (Header row)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(5, data.length); i++) {
        const rowText = (data[i] || []).join(' ').toLowerCase();
        if (
          rowText.includes('tên') ||
          rowText.includes('name') ||
          rowText.includes('học sinh') ||
          rowText.includes('họ')
        ) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = (data[headerRowIndex] || []).map((h: any) =>
        String(h || '').trim().toLowerCase(),
      );

      // Xác định vị trí từng cột linh hoạt
      const colIndex = {
        code: headers.findIndex((h) => h.includes('mã') || h.includes('code')),
        name: headers.findIndex(
          (h) => h.includes('họ và tên') || h.includes('họ tên') || h.includes('tên') || h.includes('name'),
        ),
        gender: headers.findIndex((h) => h.includes('giới') || h.includes('gender') || h.includes('phái')),
        dob: headers.findIndex((h) => h.includes('sinh') || h.includes('dob') || h.includes('birth')),
        parent: headers.findIndex((h) => h.includes('phụ huynh') || h.includes('giám hộ') || h.includes('parent')),
        phone: headers.findIndex((h) => h.includes('sđt') || h.includes('thoại') || h.includes('phone')),
        notes: headers.findIndex((h) => h.includes('ghi chú') || h.includes('dị ứng') || h.includes('note')),
      };

      if (colIndex.name === -1) {
        throw new Error('Không tìm thấy cột Họ và tên học sinh trong file. Vui lòng kiểm tra lại file mẫu.');
      }

      const rows: ParsedStudentRow[] = [];

      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const rawName = String(row[colIndex.name] || '').trim();
        if (!rawName) continue; // Bỏ qua dòng trống tên

        const rawCode = colIndex.code !== -1 ? String(row[colIndex.code] || '').trim() : '';
        const rawGender = colIndex.gender !== -1 ? String(row[colIndex.gender] || '').trim().toLowerCase() : '';
        const rawDob = colIndex.dob !== -1 ? String(row[colIndex.dob] || '').trim() : '';
        const rawParent = colIndex.parent !== -1 ? String(row[colIndex.parent] || '').trim() : '';
        const rawPhone = colIndex.phone !== -1 ? String(row[colIndex.phone] || '').trim() : '';
        const rawNotes = colIndex.notes !== -1 ? String(row[colIndex.notes] || '').trim() : '';

        // Chuẩn hóa Giới tính
        let gender: 'MALE' | 'FEMALE' = 'MALE';
        if (rawGender.includes('nữ') || rawGender.includes('nu') || rawGender.includes('f') || rawGender.includes('gái')) {
          gender = 'FEMALE';
        }

        // Chuẩn hóa Ngày sinh
        let dateOfBirth = '2021-01-01';
        if (rawDob) {
          // Xử lý số ngày của Excel (Excel serial date)
          if (!isNaN(Number(rawDob)) && Number(rawDob) > 30000 && Number(rawDob) < 60000) {
            const excelDate = new Date((Number(rawDob) - (25567 + 2)) * 86400 * 1000);
            dateOfBirth = excelDate.toISOString().split('T')[0];
          } else if (rawDob.includes('/')) {
            const parts = rawDob.split('/');
            if (parts.length === 3) {
              if (parts[2].length === 4) {
                dateOfBirth = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              } else if (parts[0].length === 4) {
                dateOfBirth = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              }
            }
          } else if (rawDob.includes('-')) {
            const parts = rawDob.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
              dateOfBirth = rawDob;
            }
          }
        }

        rows.push({
          studentCode: rawCode || undefined,
          fullName: rawName,
          gender,
          dateOfBirth,
          emergencyContactName: rawParent || 'Phụ huynh',
          emergencyContactPhone: rawPhone || '0901234567',
          medicalNotes: rawNotes || undefined,
          isValid: true,
        });
      }

      if (rows.length === 0) {
        throw new Error('Không đọc được dòng dữ liệu học sinh hợp lệ nào từ file.');
      }

      setParsedRows(rows);
    } catch (err: any) {
      console.error('Lỗi phân tích Excel:', err);
      setErrorMessage(err.message || 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng.');
    } finally {
      setIsParsing(false);
    }
  };

  // 3. Tải nhanh dữ liệu demo test từ file mẫu
  const handleLoadDemoData = () => {
    setFileName('Danh_sach_hoc_sinh_test.xlsx');
    setErrorMessage(null);
    setSuccessResult(null);
    setParsedRows([
      { studentCode: 'BM-HS101', fullName: 'Nguyễn Hoàng Khang', gender: 'MALE', dateOfBirth: '2021-04-12', emergencyContactName: 'Nguyễn Văn Tuấn', emergencyContactPhone: '0901234567', medicalNotes: 'Dị ứng đạm sữa bò (CMPA)', isValid: true },
      { studentCode: 'BM-HS102', fullName: 'Trần Thảo Linh', gender: 'FEMALE', dateOfBirth: '2021-08-20', emergencyContactName: 'Trần Thị Thu', emergencyContactPhone: '0912345678', medicalNotes: 'Bình thường', isValid: true },
      { studentCode: 'BM-HS103', fullName: 'Lê Minh Quân', gender: 'MALE', dateOfBirth: '2021-02-15', emergencyContactName: 'Lê Quốc Việt', emergencyContactPhone: '0987654321', medicalNotes: 'Dị ứng hải sản giáp xác (Tôm, Cua)', isValid: true },
      { studentCode: 'BM-HS104', fullName: 'Vũ Khánh An', gender: 'FEMALE', dateOfBirth: '2021-11-05', emergencyContactName: 'Vũ Văn Hùng', emergencyContactPhone: '0933221100', medicalNotes: 'Bình thường', isValid: true },
      { studentCode: 'BM-HS105', fullName: 'Phạm Gia Huy', gender: 'MALE', dateOfBirth: '2021-06-18', emergencyContactName: 'Phạm Văn Nam', emergencyContactPhone: '0908889999', medicalNotes: 'Kiêng đậu phộng', isValid: true },
      { studentCode: undefined, fullName: 'Đặng Ngọc Mai', gender: 'FEMALE', dateOfBirth: '2021-09-30', emergencyContactName: 'Đặng Thị Lan', emergencyContactPhone: '0919998888', medicalNotes: 'Bình thường (Hệ thống tự cấp mã)', isValid: true },
      { studentCode: undefined, fullName: 'Bùi Quốc Bảo', gender: 'MALE', dateOfBirth: '2021-03-25', emergencyContactName: 'Bùi Văn Hậu', emergencyContactPhone: '0922334455', medicalNotes: 'Dị ứng trứng gà', isValid: true },
      { studentCode: 'BM-HS108', fullName: 'Hoàng Yến Nhi', gender: 'FEMALE', dateOfBirth: '2021-05-14', emergencyContactName: 'Hoàng Minh Trí', emergencyContactPhone: '0944556677', medicalNotes: 'Bình thường', isValid: true },
      { studentCode: 'BM-HS109', fullName: 'Đỗ Tuấn Kiệt', gender: 'MALE', dateOfBirth: '2021-10-08', emergencyContactName: 'Đỗ Quang Dũng', emergencyContactPhone: '0977889900', medicalNotes: 'Không dung nạp Lactose', isValid: true },
      { studentCode: undefined, fullName: 'Lý Thiên Ân', gender: 'MALE', dateOfBirth: '2021-12-24', emergencyContactName: 'Lý Văn Hải', emergencyContactPhone: '0966778899', medicalNotes: 'Bình thường', isValid: true },
    ]);
  };

  // 4. Xóa một dòng khỏi danh sách xem trước
  const handleRemoveRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  // 5. Gửi danh sách học sinh lên Backend để lưu và gán vào lớp
  const handleSubmitImport = async () => {
    if (parsedRows.length === 0) {
      setErrorMessage('Chưa có học sinh nào trong danh sách nhập.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessResult(null);

    try {
      const itemsToImport = parsedRows.map((r) => ({
        studentCode: r.studentCode,
        fullName: r.fullName,
        gender: r.gender,
        dateOfBirth: r.dateOfBirth,
        classId, // Gán trực tiếp vào lớp học hiện tại
        emergencyContactName: r.emergencyContactName,
        emergencyContactPhone: r.emergencyContactPhone,
        medicalNotes: r.medicalNotes,
      }));

      const res = await childrenApi.importChildren(itemsToImport);

      if (res && res.success) {
        setSuccessResult(`✓ Đã nhập thành công ${res.importedCount} học sinh vào lớp ${className}!`);
        setTimeout(() => {
          onImportSuccess(res.importedCount);
        }, 1200);
      } else {
        throw new Error(res?.message || 'Có lỗi xảy ra khi nhập dữ liệu.');
      }
    } catch (err: any) {
      console.error('Lỗi khi import học sinh:', err);
      setErrorMessage(
        err?.response?.data?.message || err.message || 'Không thể nhập danh sách học sinh vào lớp.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 overflow-y-auto flex-1 pr-1 flex flex-col animate-in fade-in">
      {/* 1. Hướng dẫn & Nút tải mẫu */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4.5 rounded-2xl border border-emerald-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-emerald-950 flex items-center gap-1.5">
              <span>Nhập Danh Sách Học Sinh Cho {className}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                Excel .xlsx / .csv
              </span>
            </h4>
            <p className="text-xs text-emerald-800/80 mt-0.5 leading-relaxed">
              Tải mẫu Excel, điền thông tin học sinh và tải lên để tự động tạo hồ sơ & gán trực tiếp vào lớp này.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Tải File Mẫu (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleLoadDemoData}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 shadow-emerald-600/20"
            title="Nạp ngay 10 học sinh mẫu từ file test để kiểm tra nhanh"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Nạp Dữ Liệu Test (10 bé)</span>
          </button>
        </div>
      </div>

      {/* 2. Khu vực Kéo thả & Chọn file */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5 ${
          fileName
            ? 'border-emerald-400 bg-emerald-50/40'
            : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
          <Upload className="w-6 h-6 animate-bounce" />
        </div>

        <div>
          <p className="font-bold text-xs text-slate-800">
            {fileName ? (
              <span className="text-emerald-700 font-black flex items-center justify-center gap-1">
                <FileCheck className="w-4 h-4" /> {fileName}
              </span>
            ) : (
              'Kéo thả hoặc nhấn để chọn file Excel học sinh (.xlsx, .xls, .csv)'
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Hỗ trợ tự động phân tách Họ & Tên, chuẩn hóa giới tính và định dạng ngày sinh
          </p>
        </div>
      </div>

      {/* 3. Hiển thị thông báo Lỗi hoặc Thành công */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successResult && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successResult}</span>
        </div>
      )}

      {/* 4. Xem trước dữ liệu (Preview Table) */}
      {parsedRows.length > 0 && (
        <div className="space-y-2.5 flex-1 flex flex-col">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-black text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Xem trước: <strong className="text-emerald-700">{parsedRows.length}</strong> học sinh sẽ được nhập vào lớp
            </span>
            <span className="text-[11px] text-slate-400">Kiểm tra thông tin trước khi xác nhận</span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100 shadow-inner">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-black sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Mã HS</th>
                  <th className="py-2.5 px-3">Họ và Tên</th>
                  <th className="py-2.5 px-3">Giới tính</th>
                  <th className="py-2.5 px-3">Ngày sinh</th>
                  <th className="py-2.5 px-3">Phụ huynh & SĐT</th>
                  <th className="py-2.5 px-3 text-center w-12">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                      {row.studentCode || <span className="text-slate-300 italic">Tự sinh</span>}
                    </td>
                    <td className="py-2 px-3 font-black text-slate-900">{row.fullName}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          row.gender === 'MALE' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {row.gender === 'MALE' ? 'Nam' : 'Nữ'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{row.dateOfBirth}</td>
                    <td className="py-2 px-3 text-slate-600">
                      <span>{row.emergencyContactName}</span>
                      {row.emergencyContactPhone && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {row.emergencyContactPhone}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Bỏ dòng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Nút Xác nhận nhập */}
      {parsedRows.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t shrink-0">
          <button
            type="button"
            onClick={() => {
              setParsedRows([]);
              setFileName(null);
            }}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
          >
            Hủy danh sách
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitImport}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang xử lý & lưu hồ sơ...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Xác Nhận Nhập {parsedRows.length} Học Sinh Vào {className}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
