import { Injectable } from '@nestjs/common';
import { MenusService } from './menus.service';

@Injectable()
export class MenuExportService {
  constructor(private readonly menusService: MenusService) {}

  async exportExcel(menuId: number) {
    const menu = await this.menusService.findOne(menuId);
    return {
      success: true,
      menuTitle: menu.title,
      downloadUrl: `/api/v1/menus/${menuId}/export/excel/file`,
    };
  }

  async exportPdf(menuId: number) {
    const menu = await this.menusService.findOne(menuId);
    return {
      success: true,
      menuTitle: menu.title,
      downloadUrl: `/api/v1/menus/${menuId}/export/pdf/file`,
    };
  }
}
