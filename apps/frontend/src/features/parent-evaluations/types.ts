export interface PhotoDetail {
  url: string;
  caption: string;
}

export interface ParentEvaluationItem {
  id: string;
  tenantId: string;
  parentId: string;
  childId: string;
  feedbackDate: string;
  mealType: string;
  mealTitle?: string;
  rating: number;
  title: string;
  content: string;
  status: 'PENDING' | 'RESPONDED' | 'RESOLVED';
  statusLabel?: string;
  parentRelation: string;
  parentNameCustom?: string;
  childNameCustom?: string;
  classNameCustom?: string;
  gradeLevelCustom?: string;
  feedbackTimeLabel?: string;
  priorityNote?: string;
  likesInfo?: string;
  photos?: string[];
  photoDetails?: PhotoDetail[];
  responseContent?: string;
  responseHeader?: string;
  respondedBy?: string;
  respondedByName?: string;
  respondedAt?: string;
  pushNotificationSent: boolean;
  isDrafting: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParentEvaluationSummaryStats {
  totalCount: number;
  avgRating: number;
  positiveRate: number;
  pendingCount: number;
  respondedCount: number;
  photosCount: number;
  pendingClassesCount: number;
  avgResponseTime: string;
}

export interface ParentEvaluationResponse {
  items: ParentEvaluationItem[];
  pagination: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
  summaryStats: ParentEvaluationSummaryStats;
}

export interface ParentEvaluationQueryParams {
  search?: string;
  status?: string;
  rating?: number;
  mealType?: string;
  gradeLevel?: string;
  className?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface RespondEvaluationPayload {
  responseContent: string;
  pushNotification?: boolean;
  respondedByName?: string;
  status?: string;
  isDrafting?: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  className: string;
  gradeLevel: string;
  weight: number;
  height: number;
  allergyWarning: string;
  parentName: string;
  parentRole: string;
}

export interface MealDishItem {
  id?: string;
  name: string;
  dishType: string;
  calories?: string;
  proteinG?: string;
  fatG?: string;
  carbG?: string;
}

export interface TodayMealData {
  dateLabel: string;
  timeLabel: string;
  session: string;
  dishes: MealDishItem[];
  allergyControl: string;
  nutritionStandard: {
    title: string;
    subtitle: string;
    calories: number;
    protein: string;
    calcium: string;
    fiber: string;
  };
}

export interface PortalStatsData {
  satisfactionRating: number;
  maxRating: number;
  totalReviewsCount: number;
  responseRatePercent: number;
  responseTimeNote: string;
  responseTimeSubtitle: string;
}

export interface ParentHistoryItem {
  id: string;
  code: string;
  title: string;
  content: string;
  category: string;
  date: string;
  status: string;
  statusLabel: string;
  responseContent?: string;
  responseHeader?: string;
  respondedByName?: string;
  respondedAt?: string;
  priorityNote?: string;
  photos?: string[];
  createdAt: string;
}

export interface ParentPortalData {
  child: ChildProfile;
  todayMeal: TodayMealData;
  stats: PortalStatsData;
  history: ParentHistoryItem[];
}

export interface SubmitEvaluationPayload {
  childId?: string;
  parentId?: string;
  feedbackDate?: string;
  mealType?: string;
  evaluationType: 'QUICK_EVALUATION' | 'SCHOOL_PROPOSAL';
  rating?: number;
  title?: string;
  content: string;
  parentRelation?: string;
  parentNameCustom?: string;
  childNameCustom?: string;
  classNameCustom?: string;
  gradeLevelCustom?: string;
  category?: string;
  isAnonymous?: boolean;
  isDrafting?: boolean;
  attributes?: {
    taste?: string;
    allergy?: string;
    portion?: string;
  };
  photos?: string[];
}
