export type MealOption = 'ALL_DAY' | 'LUNCH_ONLY' | 'SNACK_ONLY' | 'ABSENT';

export interface ChildAttendanceItem {
  id: string;
  studentCode: string;
  fullName: string;
  gender: string;
  genderAgeText: string;
  avatarUrl?: string;
  mealOption: MealOption;
  dietBadge: {
    type: 'ALLERGY' | 'INTOLERANCE' | 'SPECIAL_CARE' | 'STANDARD' | 'ABSENT_CANCEL';
    title: string;
    description?: string;
    severity?: string;
  };
  parentNote?: string;
  kitchenStatus: 'SYNCED' | 'PENDING' | 'CANCELLED';
  checkinSource: string;
  isAbsent: boolean;
}

export interface AttendanceResponse {
  classInfo: {
    id: string;
    name: string;
    gradeLevel: string;
    roomNumber?: string;
    totalStudents: number;
    academicYear: string;
  };
  summary: {
    totalClassStudents: number;
    officialRatioPercent: number;
    registeredToday: number;
    registeredRatioPercent: number;
    absentCount: number;
    absentPermitted: number;
    absentUnpermitted: number;
    dietSpecialCount: number;
    dietSpecialSummary: string;
  };
  kitchenConnection: {
    deadline: string;
    headChef: string;
    station: string;
    standardPortions: number;
    customTrays: number;
    snackUnits: number;
    isLocked: boolean;
    lockedAt?: string;
    lastSyncTime: string;
    recordedBy: string;
    cutoffTime: string;
  };
  todayMenu: {
    week: number;
    lunchTime: string;
    lunchItems: string[];
    snackTime: string;
    snackItems: string[];
    estimatedCalories: number;
  };
  children: ChildAttendanceItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

export interface ClassItem {
  id: string;
  name: string;
  gradeLevel: string;
  roomNumber?: string;
  totalStudents: number;
  academicYear: string;
}
