export type GradeLevel =
  | 'INFANT_0_1Y'
  | 'TODDLER_1_2Y'
  | 'TODDLER_2_3Y'
  | 'KINDERGARTEN_3_4Y'
  | 'KINDERGARTEN_4_5Y'
  | 'KINDERGARTEN_5_6Y';

export type ClassStatus = 'ACTIVE' | 'ARCHIVED';

export interface ClassData {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
  academicYear: string;
  roomNumber?: string;
  mainTeacherId?: string;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
  mainTeacher?: {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
  studentCount?: number;
  allergicCount?: number;
  maxCapacity?: number;
}

export interface ClassFilters {
  search?: string;
  gradeLevel?: GradeLevel | '';
  status?: ClassStatus | '';
  academicYear?: string;
  page?: number;
  limit?: number;
}
