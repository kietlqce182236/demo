import { apiClient } from './axios';

export interface FoodSafetyLicense {
  number: string;
  expiryDate: string;
  issueDate?: string;
  issuingAuthority?: string;
}

export interface LegalRepresentative {
  name: string;
  title: string;
}

export interface SchoolBranding {
  logoUrl: string;
  logoName: string;
  logoSize: string;
  primaryColor: 'TEAL' | 'YELLOW' | 'ORANGE';
}

export interface TenantProfile {
  id: string;
  code: string;
  name: string;
  domain?: string;
  contactEmail: string;
  phone: string;
  address: string;
  status: string;
  subscriptionTier: string;
  maxChildren: number;
  educationDepartmentCode: string;
  schoolIdentifierSgd: string;
  isEducationDbSynced: boolean;
  syncedAt: string;
  foodSafetyLicense: FoodSafetyLicense;
  legalRepresentative: LegalRepresentative;
  branding: SchoolBranding;
  updatedAt?: string;
}

export interface UpdateTenantProfileInput {
  address?: string;
  phone?: string;
  contactEmail?: string;
  educationDepartmentCode?: string;
  schoolIdentifierSgd?: string;
  foodSafetyLicense?: Partial<FoodSafetyLicense>;
  legalRepresentative?: Partial<LegalRepresentative>;
  branding?: Partial<SchoolBranding>;
}

export interface UploadLogoInput {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  fileContentBase64?: string;
}

export const tenantApi = {
  /**
   * Lấy cấu hình trường mầm non & pháp lý ATTP
   */
  getProfile: async (): Promise<TenantProfile> => {
    const res = await apiClient.get<any>('/tenant/profile');
    return res.data?.data || res.data;
  },

  /**
   * Cập nhật thông tin trường mầm non
   */
  updateProfile: async (data: UpdateTenantProfileInput): Promise<TenantProfile> => {
    const res = await apiClient.patch<any>('/tenant/profile', data);
    return res.data?.data || res.data;
  },

  /**
   * Tải lên Logo trường học (kiểm soát định dạng & dung lượng tối đa 2MB)
   */
  uploadLogo: async (data: UploadLogoInput) => {
    const res = await apiClient.post<any>('/tenant/upload-logo', data);
    return res.data?.data || res.data;
  },

  /**
   * Đồng bộ dữ liệu với Cơ sở dữ liệu ngành của Bộ GD&ĐT
   */
  syncEducationDb: async () => {
    const res = await apiClient.post<any>('/tenant/sync-education-db');
    return res.data?.data || res.data;
  },
};
