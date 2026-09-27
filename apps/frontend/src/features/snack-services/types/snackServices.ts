export interface SnackServiceItem {
  id: string;
  name: string;
  description: string;
  serviceType: string;
  billingCycle: string;
  pricePerUnit: number;
  monthlyEstimatedPrice: number;
  appliedGrade: string;
  registrationPeriod: string;
  appliedMonth: string;
  registeredCount: number;
  targetCount: number;
  percentage: number;
  progressNote: string;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
  statusLabel: string;
  badges: string[];
  isActive: boolean;
}

export interface SnackServicesSummary {
  activeBatches: {
    total: number;
    open: number;
    upcoming: number;
    closed: number;
  };
  studentParticipation: {
    registered: number;
    total: number;
    percentage: number;
    remaining: number;
  };
  revenue: {
    expectedMonthly: number;
    collected: number;
    collectedPercentage: number;
  };
  satisfaction: {
    ratePercent: number;
    ratingScore: number;
    totalReviews: number;
  };
}

export interface SnackServicesResponse {
  success: boolean;
  summary: SnackServicesSummary;
  totalCount: number;
  data: SnackServiceItem[];
}

// UC56 Types
export interface SnackServiceListItem {
  id: string;
  name: string;
  serviceType: string;
  pricePerUnit: number;
}

export interface SnackServiceListResponse {
  success: boolean;
  data: SnackServiceListItem[];
}

export interface CreateSnackServicePeriodDto {
  snackServiceId: string;
  periodCode: string;
  appliedGrades: string[];
  isWholeSchool: boolean;
  registrationStart: string;
  registrationEnd: string;
  serviceMonths: string[];
  pricePerUnitPerDay: number;
  autoRefundEnabled: boolean;
  capacityMode: 'UNLIMITED' | 'LIMITED';
  kitchenCapacity?: number;
  totalQuota?: number;
  quotaPerGrade?: Record<string, number>;
  autoCloseEnabled: boolean;
  autoCloseThresholdPercent?: number;
  nutritionNotes?: string;
  status: 'DRAFT' | 'ACTIVE';
}

export interface CreatePeriodResponse {
  success: boolean;
  message: string;
  data: any;
}
