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
