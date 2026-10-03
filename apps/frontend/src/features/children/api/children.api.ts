import { apiClient } from '../../../core/api/axios';

export interface AllergenCatalogItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  commonFoods?: string;
  description?: string;
}

export interface ChildAllergyItem {
  id: string;
  childId: string;
  allergenId?: string;
  customAllergenName?: string;
  allergen?: AllergenCatalogItem;
  allergyType: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLACTIC';
  symptoms?: string;
  reactionTreatment?: string;
  diagnosedDate?: string;
  isActive: boolean;
}

export interface ChildItem {
  id: string;
  tenantId: string;
  classId?: string;
  class?: {
    id: string;
    name: string;
  };
  parentId?: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  status: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes?: string;
  allergies?: ChildAllergyItem[];
}

export interface ChildrenStats {
  totalChildren: number;
  allergicCount: number;
  severeCount: number;
  allergyRate: number;
}

export interface CreateChildDto {
  classId?: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes?: string;
}

export interface DeclareAllergyDto {
  allergenId?: string;
  customAllergenName?: string;
  allergyType?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLACTIC';
  symptoms?: string;
  reactionTreatment?: string;
  diagnosedDate?: string;
}

export const childrenApi = {
  getChildren: async (params?: {
    search?: string;
    classId?: string;
    hasAllergy?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<{ items: ChildItem[]; total: number }>('/children', {
      params,
    });
    return res.data;
  },

  getStats: async (): Promise<ChildrenStats> => {
    const res = await apiClient.get<ChildrenStats>('/children/stats');
    return res.data;
  },

  getAllergenCatalogs: async (): Promise<AllergenCatalogItem[]> => {
    const res = await apiClient.get<AllergenCatalogItem[]>('/children/allergen-catalogs');
    return res.data;
  },

  createChild: async (dto: CreateChildDto): Promise<ChildItem> => {
    const res = await apiClient.post<ChildItem>('/children', dto);
    return res.data;
  },

  declareAllergy: async (childId: string, dto: DeclareAllergyDto): Promise<ChildAllergyItem> => {
    const res = await apiClient.post<ChildAllergyItem>(`/children/${childId}/allergies`, dto);
    return res.data;
  },

  rescanAllergies: async (): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string }>('/children/rescan-allergies');
    return res.data;
  },
};
