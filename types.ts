// 전역 타입 및 컬렉션 상수 정의

export type ActiveTab =
  | 'dashboard'
  | 'booking'
  | 'program'
  | 'admin'
  | 'userManagement'
  | 'facilities'

export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: UserRole
  isActive?: boolean
  photoURL?: string
  adminCreated?: boolean // 관리자가 직접 생성한 사용자 (이메일 인증 우회)
  // IMPORTANT: All User updates must persist to Firebase AND update local state
  // Used across: UserManagement, Dashboard (user counts), AdminSection
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
export type BookingCategory = 'class' | 'event' | 'club' | 'personal'

export interface Booking {
  id: string
  userId?: string
  userName?: string
  userEmail?: string
  facilityId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  purpose: string
  organization?: string
  category: BookingCategory
  numberOfParticipants?: number
  status: BookingStatus // CRITICAL: Status changes must persist to Firebase
  rejectionReason?: string
  adminNotes?: string
  recurrenceRule?: { days: number[] }
  createdAt?: any
  updatedAt?: any
  // CROSS-COMPONENT USAGE:
  // - AdminSection: Admin approves/rejects (handleBookingAction)
  // - Dashboard: Shows pending counts and recent bookings
  // - BookingSection: User's personal booking view
  // STATUS FLOW: pending → approved/rejected → completed/cancelled
}

export type ProgramLevel = 'beginner' | 'intermediate' | 'advanced'
export type ProgramCategory = 'yoga' | 'pilates' | 'fitness' | 'dance' | 'badminton' | 'pickleball'

export interface Program {
  id: string
  title: string
  description: string
  instructor?: string
  capacity: number
  enrolled?: number
  scheduleDays: number[]
  startTime: string
  endTime: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  level: ProgramLevel
  category: ProgramCategory
  fee?: number
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface ProgramApplication {
  id: string
  programId: string
  userId: string
  status: ApplicationStatus
  appliedAt?: any
  programTitle?: string
  userName?: string
  userEmail?: string
  rejectionReason?: string
  updatedAt?: any
}

// 시설 중복 사용 정책
export interface FacilityBookingPolicy {
  allowOverlap: boolean        // 중복 허용 여부 (기본값: false - 단독사용)
  maxConcurrent?: number       // 동시 사용 가능 팀 수 (중복 허용 시에만)
  timeSlotMinutes?: number     // 시간 단위 (분, 기본값: 60분)
}

export interface Facility {
  id: string
  name: string
  type?: string                // 시설 종류 (gym, field, court 등)
  capacity?: number            // 수용 인원
  bufferMinutes?: number       // 기존 필드 유지
  bookingPolicy?: FacilityBookingPolicy  // 중복 사용 정책 (선택사항)
}

export interface CreateBookingData {
  facilityId: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  purpose: string
  category: BookingCategory
  numberOfParticipants: number
  organization?: string
}

export const COLLECTIONS = {
  USERS: 'users',
  BOOKINGS: 'bookings',
  PROGRAMS: 'programs',
  APPLICATIONS: 'applications',
  FACILITIES: 'facilities',
  NOTIFICATIONS: 'notifications',
  SYSTEM_CONFIG: 'system_config',
} as const

