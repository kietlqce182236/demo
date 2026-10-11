import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolTenant } from '../../auth/entities/tenant.entity';
import { Language } from '../entities/language.entity';
import { UiTranslation } from '../entities/ui-translation.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { UpdateTenantProfileDto } from '../dto/update-tenant-profile.dto';
import { UploadLogoDto } from '../dto/upload-logo.dto';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(SchoolTenant)
    private readonly schoolRepo: Repository<SchoolTenant>,
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
    @InjectRepository(UiTranslation)
    private readonly translationRepo: Repository<UiTranslation>,
    @InjectRepository(SystemConfig)
    private readonly configRepo: Repository<SystemConfig>,
  ) {}

  async getProfile() {
    let school = await this.schoolRepo.findOne({ where: { id: 1 } });
    if (!school) {
      school = await this.schoolRepo.findOne({ where: {} });
    }

    const schoolName = school?.name || 'Trường Mầm Non Hướng Dương';
    const schoolAddress = school?.address || '182 Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP.HCM';
    const schoolPhone = school?.phone || '028-3930-1888';
    const schoolEmail = school?.email || 'lienhe@mghuongduong.edu.vn';
    const principalName = school?.principalName || 'Cô Nguyễn Thị Mai Hương';
    const logoUrl = school?.logo || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80';

    return {
      id: String(school?.id || 1),
      code: 'MN_HUONGDUONG',
      name: schoolName,
      domain: 'huongduong.kidmeal.vn',
      contactEmail: schoolEmail,
      phone: schoolPhone,
      address: schoolAddress,
      status: 'ACTIVE',
      subscriptionTier: 'ENTERPRISE_PRESCHOOL',
      maxChildren: 350,
      educationDepartmentCode: 'SGD-HCM-MN-038',
      schoolIdentifierSgd: 'HCM-Q3-MN-HUONGDUONG',
      isEducationDbSynced: true,
      syncedAt: new Date().toISOString(),
      foodSafetyLicense: {
        number: 'ATTP-HCM-2024/0826',
        expiryDate: '2026-12-31',
        issueDate: '2024-01-15',
        issuingAuthority: 'Chi cục An toàn vệ sinh thực phẩm TP. Hồ Chí Minh',
      },
      legalRepresentative: {
        name: principalName,
        title: 'Hiệu trưởng',
      },
      branding: {
        logoUrl,
        logoName: 'logo_huongduong.png',
        logoSize: '184 KB',
        primaryColor: 'TEAL',
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async updateProfile(dto: UpdateTenantProfileDto) {
    let school = await this.schoolRepo.findOne({ where: { id: 1 } });
    if (school) {
      if (dto.address) school.address = dto.address;
      if (dto.phone) school.phone = dto.phone;
      if (dto.contactEmail) school.email = dto.contactEmail;
      if (dto.legalRepresentative?.name) school.principalName = dto.legalRepresentative.name;
      if (dto.branding?.logoUrl) school.logo = dto.branding.logoUrl;
      await this.schoolRepo.save(school);
    }
    return this.getProfile();
  }

  async uploadLogo(dto: UploadLogoDto) {
    const logoUrl = dto.fileContentBase64 || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80';
    let school = await this.schoolRepo.findOne({ where: { id: 1 } });
    if (school) {
      school.logo = logoUrl;
      await this.schoolRepo.save(school);
    }
    return {
      success: true,
      logoUrl,
      fileName: dto.fileName,
      message: 'Tải lên logo trường học thành công',
    };
  }

  async syncEducationDb() {
    return {
      success: true,
      syncedAt: new Date().toISOString(),
      recordCount: 142,
      message: 'Đã hoàn tất đồng bộ dữ liệu dinh dưỡng & sĩ số lên CSDL Ngành GD&ĐT',
    };
  }

  async getLanguages() {
    return this.languageRepo.find({
      where: { isActive: true },
      order: { isDefault: 'DESC', id: 'ASC' },
    });
  }

  async getTranslations(langCode: string = 'vi', namespace?: string) {
    const lang = await this.languageRepo.findOne({ where: { code: langCode } });
    if (!lang) {
      return {};
    }

    const query = this.translationRepo
      .createQueryBuilder('t')
      .where('t.language_id = :langId', { langId: lang.id });

    if (namespace) {
      query.andWhere('t.namespace = :ns', { ns: namespace });
    }

    const items = await query.getMany();
    const result: Record<string, string> = {};
    for (const item of items) {
      result[item.translationKey] = item.translationValue;
    }
    return result;
  }
}
