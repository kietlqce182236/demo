import { apiClient } from '../../../core/api/axios';

export interface DashboardSummary {
  todayAttendance: {
    totalStudents: number;
    presentLunch: number;
    presentSnack: number;
    absentCount: number;
    specialDietCount: number;
  };
  currentMenu: {
    id: string | null;
    title: string;
    targetAgeGroup: string;
    dailyAverageCalories: number;
    ratioPLG: string;
    complianceStatus: string;
  };
  growthStatistics: {
    totalEvaluated: number;
    normalPercent: number;
    stuntedPercent: number;
    underweightPercent: number;
    overweightPercent: number;
  };
  allergenAlerts: {
    allergicChildrenCount: number;
    openConflictsCount: number;
    recentAlerts: Array<{
      id: string;
      childName: string;
      className: string;
      dishName: string;
      allergen: string;
      severity: string;
    }>;
  };
  snackServiceRevenue: {
    totalRegistrations: number;
    totalRevenueVnd: number;
    vnpaySuccessfulTransactions: number;
  };
  foodSafetyStatus: {
    step1Done: boolean;
    step2Done: boolean;
    step3Done: boolean;
    samplesInRetentionCount: number;
    storageTempAvg: number;
  };
}

export const dashboardApi = {
  getExecutiveSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },
};
