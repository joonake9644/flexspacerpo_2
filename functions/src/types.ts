import { firestore } from 'firebase-admin';

// 앱에서 사용하는 간단한 사용자 타입 (컴포넌트 사용 패턴에 맞춤)
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  password?: string; // UserManagement에서 신규 사용자 생성 시 임시로 사용
  grade?: string;
  // 선택: 필요 시 메타 정보
  isActive?: boolean;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
  notificationSettings?: { // Added
    email: boolean;
    webPush: boolean;
    reservationConfirm: boolean;
    statusUpdate: boolean;
  };
  pushSubscription?: { // Added
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

// 회원가입 시 사용하는 타입
export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// 로그인 정보
export interface LoginCredentials {
  email: string;
  password: string;
}

// Firestore Booking 문서
export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string; // Added
  facilityId: string; // 예약된 시설 ID
  // UI에서 문자열(YYYY-MM-DD)로 사용
  startDate: string;
  endDate: string;
  recurrenceRule?: {
    days: number[]; // 0=일요일, 1=월요일, ...
  };
  startTime: string; // "HH:MM"
  endTime: string;
  purpose: string;
  organization?: string;
  numberOfParticipants: number; // 참여 인원
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  category: 'personal' | 'club' | 'event' | 'class';
  rejectionReason?: string;
  createdAt: firestore.FieldValue;
}

// Booking 생성 시 사용하는 타입
export interface CreateBookingData {
  facilityId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  recurrenceRule?: {
    days: number[];
  };
  startTime: string;
  endTime: string;
  purpose: string;
  organization?: string;
  numberOfParticipants: number; // 참여 인원
  category: 'personal' | 'club' | 'event' | 'class';
}

// 시설 정보
export interface Facility {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  bufferMinutes: number; // 예약 전후 정리 시간 (분)
  type: 'gym' | 'court' | 'field' | 'pool' | 'room';
  amenities: string[];
  location: string;
  isActive: boolean;
}

// 프로그램 정보
export interface Program {
  id: string;
  title: string;
  description: string;
  instructor: string;
  capacity: number;
  enrolled: number;
  scheduleDays: number[]; // 0=일요일, 1=월요일, ...
  startTime: string;
  endTime: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'yoga' | 'pilates' | 'fitness' | 'dance' | 'badminton' | 'pickleball' | 'swimming' | 'other';
  fee: number;
}

// 프로그램 생성 시 사용하는 타입
export interface CreateProgramData {
  title: string;
  description: string;
  instructor: string;
  capacity: number;
  scheduleDays: number[];
  startTime: string;
  endTime: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  fee: number;
  prerequisites?: string[];
  materials?: string[];
  tags?: string[];
}

// 프로그램 신청
export interface ProgramApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  programId: string;
  programTitle: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'waitlisted';
  appliedAt: any; // YYYY-MM-DD 또는 ISO string
  rejectionReason?: string;
}

export interface CreateProgramApplicationData {
    programId: string;
}

// 알림 정보
export interface Notification {
  id: string;
  userId: string;
  type: 'booking_approved' | 'booking_rejected' | 'program_approved' | 'program_rejected' | 'reminder' | 'announcement';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

// 시스템 설정
export interface SystemConfig {
  id: string;
  maxAdvanceBookingDays: number;
  maxBookingHours: number;
  operatingHours: {
    start: string;
    end: string;
  };
  maintenanceMode: boolean;
  announcements: string[];
}

// UI 관련 타입들
export type ActiveTab = 'dashboard' | 'booking' | 'program' | 'admin' | 'userManagement' | 'facilities' | 'reports';

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export type ProgramStatus = 'open' | 'full' | 'cancelled' | 'completed';

export type UserRole = 'user' | 'admin' | 'staff';

// Firebase 에러 타입
export interface FirebaseError {
  code: string;
  message: string;
  name: string;
}

// 통계 데이터 타입
export interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  totalPrograms: number;
  activePrograms: number;
  totalUsers: number;
  facilityUtilization: number;
}

// 필터링 옵션
export interface BookingFilters {
  status?: BookingStatus[];
  category?: string[];
  facility?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ProgramFilters {
  status?: ProgramStatus[];
  category?: string[];
  level?: string[];
  instructor?: string[];
  fee?: {
    min: number;
    max: number;
  };
}

// 페이지네이션
export interface PaginationOptions {
  limit: number;
  offset?: number;
  lastDoc?: any; // Firestore DocumentSnapshot
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UpdateBookingData {
  bookingId: string;
  startDate?: string;
  endDate?: string;
  recurrenceRule?: {
    days: number[];
  };
  startTime?: string;
  endTime?: string;
  purpose?: string;
  organization?: string;
  numberOfParticipants?: number;
  category?: 'personal' | 'club' | 'event' | 'class';
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'; // Admin might change status
}

// Firestore 컬렉션 경로들
export const COLLECTIONS = {
  USERS: 'users',
  BOOKINGS: 'bookings',
  PROGRAMS: 'programs',
  APPLICATIONS: 'program_applications',
  FACILITIES: 'facilities',
  NOTIFICATIONS: 'notifications',
  SYSTEM_CONFIG: 'system_config'
} as const;
