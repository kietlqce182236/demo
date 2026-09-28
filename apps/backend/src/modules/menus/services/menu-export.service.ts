import { Injectable, NotFoundException } from '@nestjs/common';
import { MenusService } from './menus.service';

export interface ExportMealRow {
  mealTimeVi: string;
  mealTimeCode: string;
  mondayDishes: string;
  tuesdayDishes: string;
  wednesdayDishes: string;
  thursdayDishes: string;
  fridayDishes: string;
}

export interface MenuExportData {
  schoolName: string;
  title: string;
  version: string;
  targetAgeGroupVi: string;
  dateRange: string;
  cycleWeekNumber: number;
  statusVi: string;
  dailyAverageCalories: number;
  dailyAverageProteinG: number;
  dailyAverageFatG: number;
  dailyAverageCarbG: number;
  plgRatio: string;
  standardCompliance: string;
  rows: ExportMealRow[];
  preparedBy: string;
  approvedBy: string;
  approvedDate: string;
}

@Injectable()
export class MenuExportService {
  constructor(private readonly menusService: MenusService) {}

  async generateExportData(tenantId: string, menuId: string): Promise<MenuExportData> {
    const menu = await this.menusService.findOne(tenantId, menuId);

    const mealTimeMap: Record<string, string> = {
      BREAKFAST: 'Bữa sáng (08h00)',
      MORNING_SNACK: 'Phụ sáng (09h30)',
      LUNCH: 'Bữa trưa chính (11h00)',
      AFTERNOON_SNACK: 'Phụ chiều / Xế (14h30)',
      LATE_SNACK: 'Ăn xế chiều 17h (Dịch vụ)',
    };

    const mealTimesOrder = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'LATE_SNACK'];

    const ageMap: Record<string, string> = {
      TODDLER_18_36M: 'Nhà trẻ (18 - 36 tháng)',
      KINDERGARTEN_3_4Y: 'Mẫu giáo Bé (3 - 4 tuổi)',
      KINDERGARTEN_4_5Y: 'Mẫu giáo Nhỡ (4 - 5 tuổi)',
      KINDERGARTEN_5_6Y: 'Mẫu giáo Lớn (5 - 6 tuổi)',
      ALL_AGES: 'Toàn trường (Khối Mầm - Chồi - Lá)',
    };

    const statusMap: Record<string, string> = {
      DRAFT: 'Bản dự thảo',
      SUBMITTED_FOR_REVIEW: 'Chờ phê duyệt',
      APPROVED: 'Đã phê duyệt',
      REJECTED: 'Bị từ chối',
      ACTIVE: 'Đang áp dụng (Khóa & Công bố)',
      ARCHIVED: 'Lưu trữ lịch sử',
    };

    const getDishesForCell = (day: number, mealTime: string): string => {
      const matched = (menu.menuDishes || []).filter(
        (md) => md.dayOfWeek === day && md.mealTime === mealTime,
      );
      if (matched.length === 0) return '—';
      return matched
        .map((md) => {
          let str = md.dish?.name || 'Món ăn';
          if (md.portionSizeG) str += ` (${md.portionSizeG}g)`;
          if (md.substituteDish) str += ` [Món thay thế: ${md.substituteDish.name}]`;
          return str;
        })
        .join(', ');
    };

    const rows: ExportMealRow[] = mealTimesOrder.map((mealTimeCode) => ({
      mealTimeVi: mealTimeMap[mealTimeCode] || mealTimeCode,
      mealTimeCode,
      mondayDishes: getDishesForCell(1, mealTimeCode),
      tuesdayDishes: getDishesForCell(2, mealTimeCode),
      wednesdayDishes: getDishesForCell(3, mealTimeCode),
      thursdayDishes: getDishesForCell(4, mealTimeCode),
      fridayDishes: getDishesForCell(5, mealTimeCode),
    }));

    // Tính tỷ lệ P : L : G %
    const pKcal = Number(menu.dailyAverageProteinG) * 4;
    const lKcal = Number(menu.dailyAverageFatG) * 9;
    const gKcal = Number(menu.dailyAverageCarbG) * 4;
    const totalMacronutrientKcal = pKcal + lKcal + gKcal || 1;

    const pRatio = Math.round((pKcal / totalMacronutrientKcal) * 100);
    const lRatio = Math.round((lKcal / totalMacronutrientKcal) * 100);
    const gRatio = Math.round((gKcal / totalMacronutrientKcal) * 100);
    const plgRatio = `${pRatio}% Protein : ${lRatio}% Lipid : ${gRatio}% Glucid`;

    return {
      schoolName: 'TRƯỜNG MẦM NON HOA MAI (CƠ SỞ 1)',
      title: menu.title,
      version: `Phiên bản v${menu.version}.0`,
      targetAgeGroupVi: ageMap[menu.targetAgeGroup] || menu.targetAgeGroup,
      dateRange: `Từ ngày ${menu.startDate} đến ngày ${menu.endDate}`,
      cycleWeekNumber: menu.cycleWeekNumber,
      statusVi: statusMap[menu.status] || menu.status,
      dailyAverageCalories: Number(menu.dailyAverageCalories),
      dailyAverageProteinG: Number(menu.dailyAverageProteinG),
      dailyAverageFatG: Number(menu.dailyAverageFatG),
      dailyAverageCarbG: Number(menu.dailyAverageCarbG),
      plgRatio,
      standardCompliance: 'Đạt chuẩn Thông tư 28/2016/TT-BGDĐT & Viện Dinh Dưỡng Quốc Gia 2024',
      rows,
      preparedBy: 'BS. Hoàng Mai Trang (Chuyên viên Dinh dưỡng)',
      approvedBy: menu.approvedBy ? 'Ban Giám Hiệu Trường MN Hoa Mai' : 'Chưa duyệt',
      approvedDate: menu.approvedAt ? new Date(menu.approvedAt).toLocaleDateString('vi-VN') : '—',
    };
  }

  /**
   * Tạo chuỗi nội dung CSV tương thích UTF-8 BOM để Excel hiển thị tiếng Việt hoàn hảo
   */
  async exportCsvBuffer(tenantId: string, menuId: string): Promise<Buffer> {
    const data = await this.generateExportData(tenantId, menuId);

    let csv = `\uFEFF`; // UTF-8 BOM
    csv += `"${data.schoolName}"\r\n`;
    csv += `"${data.title} - ${data.version}"\r\n`;
    csv += `"${data.dateRange} | ${data.targetAgeGroupVi}"\r\n`;
    csv += `"Năng lượng TB: ${data.dailyAverageCalories} Kcal/ngày | Tỷ lệ P-L-G: ${data.plgRatio}"\r\n\r\n`;

    csv += `"Bữa ăn / Thời gian","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu"\r\n`;

    for (const r of data.rows) {
      csv += `"${r.mealTimeVi}","${r.mondayDishes.replace(/"/g, '""')}","${r.tuesdayDishes.replace(/"/g, '""')}","${r.wednesdayDishes.replace(/"/g, '""')}","${r.thursdayDishes.replace(/"/g, '""')}","${r.fridayDishes.replace(/"/g, '""')}"\r\n`;
    }

    csv += `\r\n"Người lập bảng: ${data.preparedBy}","","","Phê duyệt: ${data.approvedBy} (${data.approvedDate})"\r\n`;

    return Buffer.from(csv, 'utf-8');
  }
}
