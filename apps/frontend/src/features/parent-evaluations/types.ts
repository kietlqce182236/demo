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
