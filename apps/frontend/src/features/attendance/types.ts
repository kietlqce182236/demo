export type MealOption = 'ALL_DAY' | 'LUNCH_ONLY' | 'SNACK_ONLY' | 'ABSENT';
export type PortionType = 'ALL' | 'HALF' | 'NONE';

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

// UC62 Types: Đánh giá mức độ ăn của trẻ sau bữa
export interface MealEvaluationItem {
  id: string;
  studentCode: string;
  fullName: string;
  firstName: string;
  gender: string;
  genderAgeText: string;
  avatarLetter: string;
  menuBadge: {
    label: string;
    type: 'standard' | 'allergy' | 'special' | 'intolerance' | 'absent';
  };
  menuDetail: string;
  portionConsumed: PortionType;
  consumptionPercentage: number;
  waterIntake: string;
  teacherNote: string;
  sendState: {
    status: 'SENT' | 'PENDING' | 'URGENT_PARENT';
    label: string;
  };
  isAbsent: boolean;
  attendanceId?: string;
}

export interface MealEvaluationResponse {
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
    totalEating: number;
    absentCount: number;
    ateAllCount: number;
    ateAllPercent: number;
    ateHalfCount: number;
    ateHalfPercent: number;
    ateLittleCount: number;
    ateLittlePercent: number;
  };
  sensoryEvaluation: {
    softnessScore: number;
    temperatureScore: number;
    excitementScore: number;
    foodSafetyChecked: boolean;
    chefFeedback: string;
    headChefName: string;
    isLocked: boolean;
    lockedAt?: string;
    status: string;
  };
  children: MealEvaluationItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

// UC63 Types: Xem lịch sử điểm danh và sức ăn
export interface AttendanceHistoryItem {
  id: string;
  attendanceId: string;
  date: string;
  dateFormatted: string;
  mealSession: string;
  child: {
    id: string;
    fullName: string;
    studentCode: string;
    classCodePrefix: string;
    gender: string;
    avatarUrl?: string;
  };
  attendanceStatus: string;
  attendanceStatusLabel: string;
  dishesServed: string[];
  dietaryBadge?: {
    text: string;
    type: 'allergy' | 'medical' | 'absent' | 'default';
  };
  portionConsumed: 'ALL' | 'HALF' | 'NONE' | 'ABSENT';
  consumptionPercentage: number | null;
  waterIntake: string;
  teacherNote: string;
  needSpecialAttention: boolean;
  teacherName: string;
  parentStatus: {
    type: 'VIEWED' | 'RESPONDED' | 'RECONCILED';
    label: string;
  };
}

export interface AttendanceHistoryResponse {
  classInfo: {
    id: string;
    name: string;
    gradeLevel: string;
    academicYear: string;
    roomNumber?: string;
    totalStudents: number;
    teachers: string[];
  };
  period: {
    startDate: string;
    endDate: string;
    weekNumber: number;
    weekLabel: string;
    displayRange: string;
  };
  summary: {
    attendanceRate: number;
    attendanceRateDiff: number;
    avgAttendanceText: string;
    allEatenRate: number;
    eatenEvaluationText: string;
    eatenTargetText: string;
    specialCareCount: number;
    specialCareTag: string;
    specialCareChildren: string[];
    specialDietCount: number;
    dietSafetyRate: number;
    dietIncidentsCount: number;
  };
  items: AttendanceHistoryItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    totalWeekMeals: number;
  };
  trends?: {
    weeklyTrend: Array<{
      week: string;
      attendanceRate: number;
      allEatenRate: number;
      targetRate: number;
    }>;
    dailyBreakdown: Array<{
      day: string;
      ateAll: number;
      ateHalf: number;
      ateLittle: number;
      absent: number;
    }>;
  };
}

export interface AttendanceHistoryQueryParams {
  classId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'week' | 'month' | 'semester' | 'custom';
  status?: string;
  search?: string;
  viewMode?: 'table' | 'by_child';
  page?: number;
  limit?: number;
}

