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
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
export type BookingCategory = 'class' | 'event' | 'club' | 'personal'

export interface Booking {
  id: string
  userId?: string
  userName?: string
  facilityId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  purpose: string
  organization?: string
  category: BookingCategory
  status: BookingStatus
  rejectionReason?: string
  recurrenceRule?: { days: number[] }
  createdAt?: any
  updatedAt?: any
}

export type ProgramLevel = 'beginner' | 'intermediate' | 'advanced'
export type ProgramCategory = 'yoga' | 'pilates' | 'fitness' | 'dance' | 'badminton' | 'pickleball'

export interface Program {
  id: string
  title: string
  description: string
  instructor?: string
  capacity: number
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
}

export interface Facility {
  id: string
  name: string
  bufferMinutes?: number
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

