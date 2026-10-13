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
  hasBreakfast?: boolean;
  breakfastPackage?: string;
  isEligibleForBreakfast?: boolean;
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

// ============================================================================
// SNACK SERVICE ROSTER TYPES
// ============================================================================

export interface SnackRosterItem {
  id: string;
  registrationId: string;
  childId: string;
  studentCode: string;
  fullName: string;
  avatarInitials: string;
  dateOfBirth: string;
  formattedDob: string;
  ageLabel: string;
  gender: string;
  classId: string;
  className: string;
  gradeLevel: string;
  blockName: string;
  classBadgeColor: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  snackDietType: string;
  snackDietBadgeText: string;
  snackDietBadgeType: string;
  kitchenNotes: string;
  isKitchenHighlight: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface SnackRosterStats {
  totalRegistered: number;
  registeredMonthLabel: string;
  paidCount: number;
  totalEligible: number;
  paidPercent: number;
  totalClasses: number;
  classListSummary: string;
  todayTotalPortions: number;
  standardPortions: number;
  specialDietPortions: number;
}

export interface SnackRosterResponse {
  stats: SnackRosterStats;
  bannerNotice: {
    timeWindow: string;
    title: string;
    content: string;
    inspectionBadge: string;
  };
  classes: Array<{
    id: string;
    name: string;
    gradeLevel: string;
    blockName: string;
  }>;
  items: SnackRosterItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  };
}

export interface SnackRosterQueryParams {
  search?: string;
  gradeLevel?: string;
  classId?: string;
  date?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

// =========================================================================
// MEAL COORDINATION NOTES (TEACHER & KITCHEN CONSOLE)
// =========================================================================

export interface CoordinationNoteItem {
  id: string;
  classId: string;
  className: string;
  child: {
    id: string;
    fullName: string;
    studentCode: string;
    avatarLetter: string;
    allergyWarning?: string;
  } | null;
  mealDate: string;
  mealSession: string;
  mealSessionLabel: string;
  noteType: string;
  noteTypeLabel: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  priorityLabel: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'PROCESSING' | 'RESOLVED' | 'CANCELLED';
  statusLabel: string;
  title: string;
  content: string;
  teacherName: string;
  targetRole: string;
  targetRoleLabel: string;
  kitchenAcknowledged: boolean;
  kitchenAcknowledgedBy?: string;
  kitchenAcknowledgedAt?: string;
  kitchenResponse?: string;
  photos: string[];
  createdAt: string;
  resolvedAt?: string;
}

export interface MealCoordinationData {
  selectedClass: {
    id: string;
    name: string;
    gradeLevel: string;
    totalStudents: number;
  };
  availableClasses: Array<{
    id: string;
    name: string;
    gradeLevel: string;
    totalStudents: number;
  }>;
  availableChildren: Array<{
    id: string;
    fullName: string;
    studentCode: string;
    allergy?: string;
  }>;
  summary: {
    totalNotes: number;
    urgentCount: number;
    highCount: number;
    pendingCount: number;
    acknowledgedCount: number;
    resolvedCount: number;
  };
  filterDate: string;
  notes: CoordinationNoteItem[];
}

export interface CoordinationQueryParams {
  date?: string;
  classId?: string;
  mealSession?: string;
  status?: string;
  priority?: string;
  noteType?: string;
  search?: string;
}

export interface CreateCoordinationNotePayload {
  classId: string;
  childId?: string;
  mealDate: string;
  mealSession: string;
  noteType: string;
  priority: string;
  title: string;
  content: string;
  targetRole?: string;
  teacherName?: string;
  photos?: string[];
}

export interface UpdateCoordinationNotePayload {
  title?: string;
  content?: string;
  priority?: string;
  noteType?: string;
  mealSession?: string;
  status?: string;
  kitchenResponse?: string;
  photos?: string[];
}

export interface SchoolHeadcountClassItem {
  id: string;
  name: string;
  gradeLevel: string;
  gradeName: string;
  roomNumber: string;
  academicYear: string;
  homeroomTeacher: string;
  enrolled: number;
  boys: number;
  girls: number;
  maxCapacity: number;
  occupancyPercent: number;
  presentToday: number;
  absentToday: number;
  absentPermitted: number;
  absentUnpermitted: number;
  attendanceRate: number;
  lunchCount: number;
  snackCount: number;
  allergicCount: number;
  isKitchenLocked: boolean;
  kitchenLockedAt?: string | null;
}

export interface SchoolHeadcountGradeItem {
  gradeLevel: string;
  gradeName: string;
  classCount: number;
  enrolled: number;
  maxCapacity: number;
  presentToday: number;
  absentToday: number;
  lunchCount: number;
  allergicCount: number;
  occupancyPercent: number;
  attendanceRate: number;
}

export interface SchoolHeadcountSummaryResponse {
  date: string;
  overview: {
    totalStudents: number;
    totalCapacity: number;
    occupancyPercent: number;
    boysCount: number;
    girlsCount: number;
    presentToday: number;
    absentToday: number;
    absentPermitted: number;
    absentUnpermitted: number;
    attendanceRate: number;
    lunchPortions: number;
    snackPortions: number;
    allergicCount: number;
    totalClasses: number;
    classesLockedCount: number;
  };
  grades: SchoolHeadcountGradeItem[];
  classes: SchoolHeadcountClassItem[];
}




