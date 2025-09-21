# FlexSpace Pro 중요 소스코드

이 문서는 FlexSpace Pro 프로젝트의 핵심 소스 코드를 담고 있습니다.

---

## `C:\Users\user\Downloads\flexspace-pro (1)\App.tsx`

```tsx
// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useFirestore } from '@/hooks/use-firestore'
import { User, Booking, Program, ProgramApplication, ActiveTab } from '@/types'
import LoginForm from '@/components/LoginForm'
import Navigation from '@/components/Navigation'
import Dashboard from '@/components/Dashboard'
import BookingSection from '@/components/BookingSection'
import ProgramSection from '@/components/ProgramSection'
import AdminSection from '@/components/AdminSection'
import UserManagement from '@/components/UserManagement'

export default function Home() {
  const { user: currentUser, login, logout, signup, adminLogin } = useAuth()
  const {
    loading,
    bookings,
    setBookings,
    programs,
    setPrograms,
    applications,
    setApplications,
    users,
    setUsers,
  } = useFirestore()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')

  // Firebase 연결 완료 후 초기화
  useEffect(() => {
    if (currentUser && !loading) {
      setActiveTab('dashboard')
    }
  }, [currentUser, loading])

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      await login(email, password)
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const handleAdminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      await adminLogin(email, password)
      return true
    } catch (error) {
      console.error('Admin login failed:', error)
      return false
    }
  }
  
  const handleSignup = async (userData: Omit<User, 'id' | 'role'>): Promise<boolean> => {
    try {
      await signup(userData)
      return true
    } catch (error) {
      console.error('Signup failed:', error)
      return false
    }
  }

  const handleLogout = async () => {
    await logout()
    setActiveTab('dashboard')
  }
  
  const renderContent = () => {
    if (!currentUser) return null
    
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            currentUser={currentUser}
            bookings={bookings}
            applications={applications}
            programs={programs}
            setActiveTab={setActiveTab}
          />
        )
      case 'booking':
        return (
          <BookingSection
            currentUser={currentUser}
            bookings={bookings}
            setBookings={setBookings}
          />
        )
      case 'program':
        return (
          <ProgramSection
            currentUser={currentUser}
            programs={programs}
            setPrograms={setPrograms}
            applications={applications}
            setApplications={setApplications}
          />
        )
      case 'admin':
        return (
          <AdminSection
            bookings={bookings}
            setBookings={setBookings}
            applications={applications}
            setApplications={setApplications}
            programs={programs}
            setPrograms={setPrograms}
            users={users}
          />
        )
      case 'userManagement':
        return <UserManagement users={users} setUsers={setUsers} />
      default:
        return (
          <Dashboard
            currentUser={currentUser}
            bookings={bookings}
            applications={applications}
            programs={programs}
            setActiveTab={setActiveTab}
          />
        )
    }
  }

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 로그인하지 않은 사용자
  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} onSignup={handleSignup} onAdminLogin={handleAdminLogin} />
  }

  // 로그인한 사용자
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <main>
        {renderContent()}
      </main>
    </div>
  )
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\index.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app/globals.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\firebase.ts`

```typescript
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
}

// Avoid re-initializing in HMR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

// Emulator wiring (local only)
const useEmu = (import.meta as any).env?.VITE_USE_EMULATOR === 'true'
if (useEmu) {
  const host = ((import.meta as any).env?.VITE_EMULATOR_HOST as string) || '127.0.0.1'
  const authPort = Number(((import.meta as any).env?.VITE_EMULATOR_AUTH_PORT as string) || 9099)
  const firestorePort = Number(((import.meta as any).env?.VITE_EMULATOR_FIRESTORE_PORT as string) || 8080)
  try {
    connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true })
  } catch {}
  try {
    connectFirestoreEmulator(db, host, firestorePort)
  } catch {}
}

// Analytics is optional and only works in browsers
export const analyticsPromise = analyticsSupported().then((ok) => (ok ? getAnalytics(app) : null)).catch(() => null)

export default app
```

## `C:\Users\user\Downloads\flexspace-pro (1)\tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "types": [
      "node"
    ],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "preserve",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": false,
    "incremental": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\package.json`

```json
{
  "name": "flexspace-pro",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "firebase:emulators": "firebase emulators:start --only auth,firestore,functions,storage",
    "deploy": "vite build && firebase deploy --only hosting"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "firebase": "^10.14.0",
    "lucide-react": "^0.542.0",
    "next": "^15.1.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "tailwind-merge": "^3.3.1",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@vitejs/plugin-react": "^5.0.2",
    "autoprefixer": "^10.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "15.1.0",
    "postcss": "^8.0.0",
    "vite": "^7.1.3"
  }
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  envPrefix: 'VITE_',
})
```

## `C:\Users\user\Downloads\flexspace-pro (1)\types.ts`

```typescript
// 앱에서 사용하는 간단한 사용자 타입 (컴포넌트 사용 패턴에 맞춤)
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  password?: string; // UserManagement에서 신규 사용자 생성 시 임시로 사용
  // 선택: 필요 시 메타 정보
  isActive?: boolean;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  category: 'personal' | 'club' | 'event' | 'class';
  rejectionReason?: string;
}

// Booking 생성 시 사용하는 타입
export interface CreateBookingData {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  recurrenceRule?: {
    days: number[];
  };
  startTime: string;
  endTime: string;
  purpose: string;
  organization?: string;
  category: 'personal' | 'club' | 'event' | 'class';
}

// 시설 정보
export interface Facility {
  id: string;
  name: string;
  description?: string;
  capacity: number;
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
  appliedAt: string; // YYYY-MM-DD 또는 ISO string
  rejectionReason?: string;
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
```

## `C:\Users\user\Downloads\flexspace-pro (1)\utils.ts`

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Timestamp } from 'firebase/firestore'

// shadcn/ui를 위한 클래스명 병합 함수
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 숫자만 있는 전화번호 문자열을 표시용 서식으로 변환합니다
 * @param phone - 서식을 지정할 순수 숫자 전화번호 문자열
 * @returns 서식이 지정된 전화번호 문자열 또는 입력값이 유효하지 않은 경우 원본 문자열
 */
export const formatPhoneNumberForDisplay = (phone?: string): string => {
  if (!phone) return '정보 없음'
  const cleaned = phone.replace(/\D/g, '') // 숫자만 추출

  // 대한민국 휴대폰 번호 형식 (11자리)
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  // 서울 지역번호 포함 10자리 유선 번호
  if (cleaned.startsWith('02') && cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  // 그 외 10자리 유선 번호 (031, 032 등)
  if (cleaned.length === 10) {
     return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  // 8자리 유선번호 (구형)
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
  }
  
  return phone // 서식을 지정할 수 없는 경우 원본 반환
}

/**
 * Firebase Timestamp를 한국 로케일 형식으로 변환
 * @param timestamp - Firebase Timestamp 객체
 * @param format - 'date' | 'datetime' | 'time'
 * @returns 포맷된 날짜 문자열
 */
export const formatFirebaseTimestamp = (
  timestamp: Timestamp | null | undefined,
  format: 'date' | 'datetime' | 'time' = 'datetime'
): string => {
  if (!timestamp) return '정보 없음'
  
  const date = timestamp.toDate()
  
  switch (format) {
    case 'date':
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    case 'time':
      return new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    case 'datetime':
    default:
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
  }
}

/**
 * 일반 Date 객체를 Firebase Timestamp로 변환
 * @param date - Date 객체
 * @returns Firebase Timestamp
 */
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date)
}

/**
 * 시간 문자열(HH:MM)을 분으로 변환
 * @param timeString - "14:30" 형식의 시간 문자열
 * @returns 분 단위 숫자
 */
export const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * 분을 시간 문자열(HH:MM)로 변환
 * @param minutes - 분 단위 숫자
 * @returns "14:30" 형식의 시간 문자열
 */
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Firebase 에러 메시지를 한국어로 변환
 * @param errorCode - Firebase 에러 코드
 * @returns 한국어 에러 메시지
 */
export const translateFirebaseError = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    // Auth 에러
    'auth/user-not-found': '등록되지 않은 사용자입니다.',
    'auth/wrong-password': '비밀번호가 일치하지 않습니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password': '비밀번호가 너무 간단합니다. 6자리 이상 입력해주세요.',
    'auth/invalid-email': '올바르지 않은 이메일 형식입니다.',
    'auth/too-many-requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    
    // Firestore 에러
    'firestore/permission-denied': '접근 권한이 없습니다.',
    'firestore/unavailable': '서비스를 일시적으로 사용할 수 없습니다.',
    'firestore/deadline-exceeded': '요청 시간이 초과되었습니다.',
    
    // Storage 에러
    'storage/unauthorized': '파일 업로드 권한이 없습니다.',
    'storage/object-not-found': '파일을 찾을 수 없습니다.',
    'storage/quota-exceeded': '저장소 용량을 초과했습니다.',
    
    // Functions 에러
    'functions/permission-denied': '함수 실행 권한이 없습니다.',
    'functions/unavailable': '서버 함수를 사용할 수 없습니다.',
  }
  
  return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.'
}

/**
 * 예약 상태를 한국어로 변환
 * @param status - 예약 상태
 * @returns 한국어 상태 문자열
 */
export const translateBookingStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '승인 대기',
    'approved': '승인됨',
    'rejected': '거절됨',
    'cancelled': '취소됨',
    'completed': '완료됨'
  }
  return statusMap[status] || status
}

/**
 * 프로그램 레벨을 한국어로 변환
 * @param level - 프로그램 난이도
 * @returns 한국어 난이도 문자열
 */
export const translateProgramLevel = (level: string): string => {
  const levelMap: Record<string, string> = {
    'beginner': '초급',
    'intermediate': '중급',
    'advanced': '고급'
  }
  return levelMap[level] || level
}

/**
 * 금액을 한국 원화 형식으로 포맷
 * @param amount - 금액 (숫자)
 * @returns 포맷된 금액 문자열
 */
export const formatCurrency = (amount: number): string => {
  if (amount === 0) return '무료'
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount)
}

/**
 * 요일 배열을 한국어 문자열로 변환
 * @param days - 요일 배열 (0=일요일, 1=월요일, ...)
 * @returns 한국어 요일 문자열
 */
export const formatScheduleDays = (days: number[]): string => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return days
    .sort((a, b) => a - b)
    .map(day => dayNames[day])
    .join(', ')
}

/**
 * 텍스트를 안전하게 자르고 말줄임표 추가
 * @param text - 원본 텍스트
 * @param maxLength - 최대 길이
 * @returns 잘린 텍스트
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 * @param bytes - 바이트 크기
 * @returns 포맷된 크기 문자열
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 이메일 주소 유효성 검사
 * @param email - 검사할 이메일 주소
 * @returns 유효성 여부
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 한국 전화번호 유효성 검사
 * @param phone - 검사할 전화번호
 * @returns 유효성 여부
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '')
  // 휴대폰(11자리) 또는 유선전화(8-10자리) 검사
  return /^01[0-9]{9}$|^0[2-9][0-9]{7,8}$/.test(cleaned)
}

/**
 * 디바운스 함수 - 연속 호출 방지
 * @param func - 실행할 함수
 * @param delay - 지연 시간(ms)
 * @returns 디바운스된 함수
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

/**
 * 배열을 청크 단위로 나누기
 * @param array - 원본 배열
 * @param chunkSize - 청크 크기
 * @returns 청크 배열들
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * 환경변수 필수 체크 함수
 * @param name - 환경변수 이름
 * @returns 환경변수 값
 * @throws 환경변수가 없으면 에러
 */
export const requireEnv = (name: string): string => {
  const isServer = typeof window === 'undefined'
  let value: string | undefined

  if (isServer) {
    value = process.env[name]
  } else {
    if (name.startsWith('NEXT_PUBLIC_')) {
      value = process.env[name]
    } else {
      console.warn(`클라이언트에서 ${name} 환경변수에 접근할 수 없습니다.`)
      return ''
    }
  }

  if (!value) {
    const errorMsg = `환경변수 누락: ${name}`
    if (isServer) {
      throw new Error(errorMsg)
    } else {
      console.error(errorMsg)
      return ''
    }
  }

  return value
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\README.md`

```markdown
# Firebase 웹앱 개발 가이드

<div align="center">
  <img src="https://picsum.photos/1200/400?random=2" alt="Firebase 웹앱 개발 배너" />
</div>

## 프로젝트 개요

이 저장소는 Firebase를 백엔드로 사용하는 Next.js 웹 애플리케이션 개발을 위한 종합 가이드입니다. 모든 Firebase 기반 프로젝트에서 재사용 가능한 개발 패턴, 베스트 프랙티스, 그리고 AI 코딩 어시스턴트 활용법을 제공합니다.

### 제공하는 내용
- Firebase 서비스 통합 패턴
- TypeScript + React 개발 가이드라인
- 보안 규칙 및 성능 최적화
- AI 어시스턴트 활용 워크플로우
- 테스트 및 배포 전략

## 기술 스택

### Frontend
- **Framework**: Next.js 15 + TypeScript
- **UI Library**: shadcn/ui + TailwindCSS
- **State Management**: Zustand + @tanstack/react-query
- **Icons**: Lucide React

### Backend (Firebase)
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Functions**: Firebase Functions (Node.js)
- **Hosting**: Firebase Hosting
- **Storage**: Firebase Storage
- **Messaging**: Firebase Cloud Messaging

### Development Tools
- **AI Assistants**: Cursor AI / Windsurf / GitHub Copilot
- **Package Manager**: npm
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + Firebase Emulator Suite

## 프로젝트 구조

```
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   └── common/             # 공통 컴포넌트
│   ├── features/               # 기능별 모듈
│   │   └── [feature-name]/     # 기능별 디렉토리
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── types/
│   │       └── api.ts
│   ├── lib/
│   │   ├── firebase/           # Firebase 설정
│   │   └── utils.ts            # 유틸리티 함수
│   ├── hooks/                  # 전역 커스텀 훅
│   └── types/                  # 전역 TypeScript 타입
├── functions/                  # Firebase Functions
├── firestore.rules            # Firestore 보안 규칙
├── storage.rules              # Storage 보안 규칙
└── firebase.json              # Firebase 설정
```

## 시작하기

### Prerequisites
- Node.js 18.0 이상
- npm
- Firebase CLI
- AI 코딩 어시스턴트 (Cursor AI, Windsurf, GitHub Copilot 등)

### 1. 저장소 설정
```bash
# 새 프로젝트 생성 또는 기존 프로젝트 클론
git clone [your-repository-url]
cd [your-project-name]
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Firebase 프로젝트 설정
```bash
# Firebase CLI 설치 (글로벌)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 프로젝트 초기화
firebase init
```

### 4. 환경변수 설정
`.env.local` 파일을 생성하고 Firebase 설정을 추가하세요:

```bash
# Firebase 클라이언트 설정 (NEXT_PUBLIC_ 필수)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (서버 전용)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# 환경 설정
NEXT_PUBLIC_ENVIRONMENT=development
```

### 5. Firebase Emulator Suite 시작
```bash
# 개발용 에뮬레이터 실행
firebase emulators:start --only auth,firestore,functions,storage
```

### 6. 개발 서버 실행
```bash
# 새 터미널에서 실행
npm run dev
```

애플리케이션이 http://localhost:3000 에서 실행됩니다.

## 개발 가이드

### AI 코딩 어시스턴트 활용
이 프로젝트는 다양한 AI 코딩 어시스턴트와 함께 개발하도록 설계되었습니다.

#### 공통 설정
1. 프로젝트 루트의 개발 가이드라인 파일들:
   - `.cursorrules` (Cursor AI용)
   - `windsurf.config.json` (Windsurf용)
   - 기타 AI 어시스턴트별 설정 파일
2. Firebase 특화 개발 패턴이 미리 정의되어 있습니다
3. TypeScript + React + Firebase 베스트 프랙티스가 적용됩니다

#### 권장 개발 워크플로우 (AI 어시스턴트 공통)
1. **기능 계획** → AI와 함께 요구사항 정리
2. **컴포넌트 설계** → AI 어시스턴트로 구조 설계
3. **코드 구현** → AI 어시스턴트의 코드 제안 활용
4. **테스트 작성** → Firebase Emulator로 테스트
5. **리팩토링** → AI 어시스턴트로 코드 개선

#### AI 어시스턴트별 활용법
- **Cursor AI**: `.cursorrules` 파일 기반 컨텍스트 이해
- **Windsurf**: 프로젝트 구조와 Firebase 패턴 학습
- **GitHub Copilot**: 인라인 코드 제안 및 자동완성
- **기타**: 프로젝트 문서와 코딩 스타일 참조

### Firebase 개발 패턴

#### 기본 Firebase 설정
```typescript
// lib/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Firebase 설정
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

#### Firestore 데이터 작업
```typescript
// 데이터 읽기
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function getData(collectionName: string, filters?: any) {
  const q = query(collection(db, collectionName), ...filters);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 실시간 데이터 구독
import { onSnapshot } from 'firebase/firestore';

useEffect(() => {
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setData(data);
  });

  return unsubscribe;
}, []);
```

#### 보안 규칙 예제
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 테스트

### Firebase Emulator Suite 사용
```bash
# 테스트 실행 (에뮬레이터 자동 시작)
npm run test

# 보안 규칙 테스트
npm run test:rules
```

### 테스트 종류
- **Unit Tests**: 비즈니스 로직 테스트
- **Integration Tests**: Firebase 서비스 연동 테스트
- **Security Rules Tests**: Firestore 보안 규칙 검증

## 배포

### 스테이징 환경
```bash
# Firebase 스테이징 배포
firebase use staging
firebase deploy
```

### 프로덕션 환경
```bash
# Firebase 프로덕션 배포
firebase use production
firebase deploy --only hosting,firestore,functions
```

## 모니터링

### Firebase Console 확인 사항
- **Authentication**: 사용자 인증 현황
- **Firestore**: 데이터베이스 사용량 및 성능
- **Functions**: 클라우드 함수 실행 로그
- **Hosting**: 웹앱 배포 상태
- **Performance**: 앱 성능 메트릭

## 문제 해결

### 일반적인 이슈들
1. **Firebase 초기화 오류**
   ```bash
   firebase use --add
   ```

2. **환경변수 누락**
   - `.env.local` 파일의 모든 필수 변수 확인
   - `NEXT_PUBLIC_` 접두사 확인

3. **보안 규칙 오류**
   ```bash
   firebase firestore:rules:test --test-file=firestore-test.js
   ```

4. **Emulator 연결 실패**
   ```bash
   firebase emulators:start --only auth,firestore --reset-cache
   ```

## 기여하기

1. 이슈 생성 또는 기존 이슈 확인
2. 피처 브랜치 생성 (`git checkout -b feature/새기능`)
3. 변경사항 커밋 (`git commit -m 'feat: 새로운 기능 추가'`)
4. 브랜치 푸시 (`git push origin feature/새기능`)
5. Pull Request 생성

### 커밋 메시지 규칙
- `feat:` 새로운 기능
- `fix:` 버그 수정
- `docs:` 문서 변경
- `style:` 코드 포맷팅
- `refactor:` 리팩토링
- `test:` 테스트 추가
- `firebase:` Firebase 설정 변경

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 지원

- **버그 신고**: [GitHub Issues](../../issues)
- **기능 요청**: [GitHub Discussions](../../discussions)
- **문서**: [Wiki](../../wiki)

---

<div align="center">
  Made with Firebase & Next.js
</div>
```

## `C:\Users\user\Downloads\flexspace-pro (1)\firestore.rules`

```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 9, 30);
    }
  }
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "program_applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "programId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "appliedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "facilityId", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "facilityId", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "programs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "startDate", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\firebase.json`

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\app\globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-on-load {
  opacity: 0;
  animation-name: fadeInUp;
  animation-duration: 0.8s;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
}

.delay-200 {
  animation-delay: 0.2s;
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\app\layout.tsx`

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlexSpace Pro',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      </head>
      <body className="bg-gray-50">
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\app\page.tsx`

```tsx
'use client'

export default function Home() {
  return (
    <div className="animate-on-load">
      <h1>FlexSpace Pro</h1>
    </div>
  )
}
```

## `C:\Users\user\Downloads\flexspace-pro (1)\components\AdminSection.tsx`

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Booking, ProgramApplication, Program, User } from './types';
import { Check, X, Calendar, UserCheck, PlusCircle, Edit, Trash2, BookOpen, CreditCard, Search } from 'lucide-react';
import BookingCalendar from './BookingCalendar';

interface AdminSectionProps {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  applications: ProgramApplication[];
  setApplications: React.Dispatch<React.SetStateAction<ProgramApplication[]>>;
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  users: User[];
}

const getProgramStatus = (program: Program) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(program.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(program.endDate);
    endDate.setHours(0, 0, 0, 0);

    if (today > endDate) return { text: '종료', dDay: null };
    if (today >= startDate && today <= endDate) return { text: '진행 중', dDay: null };
    
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { text: '모집중', dDay: diffDays };
};

const expandBooking = (booking: Omit<Booking, 'id' | 'userId' | 'userName' | 'status'>): { date: string, startTime: string, endTime: string, purpose: string}[] => {
  const occurrences = [];
  const start = new Date(booking.startDate + 'T00:00:00');
  const end = new Date(booking.endDate + 'T00:00:00');
  let currentDate = new Date(start);
  while (currentDate <= end) {
    const dayMatches = !booking.recurrenceRule || booking.recurrenceRule.days.length === 0 || booking.recurrenceRule.days.includes(currentDate.getDay());
    if (dayMatches) {
      occurrences.push({ date: currentDate.toISOString().split('T')[0], startTime: booking.startTime, endTime: booking.endTime, purpose: booking.purpose });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return occurrences;
};

const AdminSection: React.FC<AdminSectionProps> = ({ bookings, setBookings, applications, setApplications, programs, setPrograms }) => {
  const [showAdminBookingForm, setShowAdminBookingForm] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, type: null as 'booking' | 'application' | null, id: null as string | null, reason: '' });
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [programToEdit, setProgramToEdit] = useState<Program | null>(null);
  const [deleteProgramModal, setDeleteProgramModal] = useState({ isOpen: false, program: null as Program | null, confirmText: '' });
  
  // States for booking list filtering
  const [bookingFilterStatus, setBookingFilterStatus] = useState<'all' | Booking['status']>('all');
  const [bookingFilterSearch, setBookingFilterSearch] = useState('');
  const [bookingFilterStartDate, setBookingFilterStartDate] = useState('');
  const [bookingFilterEndDate, setBookingFilterEndDate] = useState('');

  const initialAdminBookingState = { startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '10:00', purpose: '', organization: '', days: [] as number[], category: 'class' as Booking['category'] };
  const [newAdminBooking, setNewAdminBooking] = useState(initialAdminBookingState);
  
  const initialProgramFormState = { title: '', description: '', instructor: '', capacity: 10, scheduleDays: [] as number[], startTime: '09:00', endTime: '10:00', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], level: 'beginner' as Program['level'], category: 'yoga' as Program['category'], fee: 0 };
  const [programForm, setProgramForm] = useState(initialProgramFormState);
  
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  
  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 10) {
            const hour = String(h).padStart(2, '0');
            const minute = String(m).padStart(2, '0');
            options.push(`${hour}:${minute}`);
        }
    }
    return options;
  }, []);

  useEffect(() => {
    if (programToEdit) {
      setProgramForm({ ...programToEdit, fee: programToEdit.fee || 0 });
    } else {
      setProgramForm(initialProgramFormState);
    }
  }, [programToEdit]);

  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending'), [bookings]);
  const pendingApplications = useMemo(() => applications.filter(a => a.status === 'pending'), [applications]);

  const filteredBookings = useMemo(() => {
    return bookings
      .filter(b => bookingFilterStatus === 'all' || b.status === bookingFilterStatus)
      .filter(b => b.purpose.toLowerCase().includes(bookingFilterSearch.toLowerCase()) || b.userName.toLowerCase().includes(bookingFilterSearch.toLowerCase()))
      .filter(b => {
        if (!bookingFilterStartDate || !bookingFilterEndDate) return true;
        const bookingStart = new Date(b.startDate);
        const bookingEnd = new Date(b.endDate);
        const filterStart = new Date(bookingFilterStartDate);
        const filterEnd = new Date(bookingFilterEndDate);
        return bookingStart <= filterEnd && bookingEnd >= filterStart;
      })
      .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [bookings, bookingFilterStatus, bookingFilterSearch, bookingFilterStartDate, bookingFilterEndDate]);

  const handleBookingAction = (bookingId: string, action: 'approve' | 'reject') => {
    if (action === 'approve') setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, status: 'approved', rejectionReason: undefined } : b));
    else setRejectionModal({ isOpen: true, id: bookingId, type: 'booking', reason: '' });
  };
  const handleApplicationAction = (appId: string, action: 'approve' | 'reject') => {
    if (action === 'approve') setApplications(as => as.map(a => a.id === appId ? { ...a, status: 'approved', rejectionReason: undefined } : a));
    else setRejectionModal({ isOpen: true, id: appId, type: 'application', reason: '' });
  };
  
  const handleConfirmRejection = () => {
    if (!rejectionModal.id || !rejectionModal.type) return;
    if (rejectionModal.type === 'booking') setBookings(bs => bs.map(b => b.id === rejectionModal.id ? { ...b, status: 'rejected', rejectionReason: rejectionModal.reason } : b));
    else setApplications(as => as.map(a => a.id === rejectionModal.id ? { ...a, status: 'rejected', rejectionReason: rejectionModal.reason } : a));
    setRejectionModal({ isOpen: false, type: null, id: null, reason: '' });
  };
  
  const handleEditBookingClick = (booking: Booking) => {
    setEditingBookingId(booking.id);
    setNewAdminBooking({ startDate: booking.startDate, endDate: booking.endDate, startTime: booking.startTime, endTime: booking.endTime, purpose: booking.purpose, organization: booking.organization || '', days: booking.recurrenceRule?.days || [], category: booking.category });
    setShowAdminBookingForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleAdminBookingSubmit = () => {
    const { startDate, endDate, startTime, endTime, purpose, days, category, organization } = newAdminBooking;
    if (!startDate || !endDate || !startTime || !endTime || !purpose || !category) return alert('모든 필수 필드를 입력해주세요.');
    if (new Date(endDate) < new Date(startDate)) return alert('종료일은 시작일보다 빠를 수 없습니다.');
    const newBookingData = { startDate, endDate, startTime, endTime, purpose, organization, category, ...(days.length > 0 && { recurrenceRule: { days } }) };
    const newBookingOccurrences = expandBooking(newBookingData);
    const allExistingOccurrences = bookings.filter(b => b.status === 'approved' && b.id !== editingBookingId).flatMap(b => expandBooking(b));
    for (const newOcc of newBookingOccurrences) {
      for (const existingOcc of allExistingOccurrences) {
        if (newOcc.date === existingOcc.date && new Date(`${newOcc.date}T${newOcc.startTime}`) < new Date(`${existingOcc.date}T${existingOcc.endTime}`) && new Date(`${existingOcc.date}T${existingOcc.startTime}`) < new Date(`${newOcc.date}T${newOcc.endTime}`)) {
          alert(`시간 충돌: ${newOcc.date} ${newOcc.startTime}-${newOcc.endTime}에 이미 '${existingOcc.purpose}' 예약이 있습니다.`);
          return;
        }
      }
    }
    if (editingBookingId) {
      setBookings(bs => bs.map(b => b.id === editingBookingId ? { ...b, ...newBookingData } : b));
      alert('대관 정보가 성공적으로 수정되었습니다.');
    } else {
      const finalNewBooking: Booking = { id: `admin-${Date.now()}`, userId: 'admin', userName: '관리자 등록', status: 'approved', ...newBookingData };
      setBookings(prev => [finalNewBooking, ...prev].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
      alert('행사가 성공적으로 등록되었습니다.');
    }
    setEditingBookingId(null);
    setNewAdminBooking(initialAdminBookingState);
    setShowAdminBookingForm(false);
  };

  const handleSaveProgram = () => {
    if (!programForm.title || !programForm.instructor || programForm.scheduleDays.length === 0 || !programForm.startTime || !programForm.endTime) return alert('모든 필수 필드를 입력해주세요.');
    if (programToEdit && programForm.capacity < programToEdit.enrolled) return alert(`정원은 현재 등록된 인원(${programToEdit.enrolled}명)보다 적을 수 없습니다.`);
    if (programToEdit) {
      setPrograms(ps => ps.map(p => p.id === programToEdit.id ? { ...p, ...programForm } : p));
      alert('프로그램이 수정되었습니다.');
    } else {
      const newProgram: Program = { id: `prog-${Date.now()}`, enrolled: 0, ...programForm };
      setPrograms(prev => [newProgram, ...prev]);
      alert('새 프로그램이 개설되었습니다.');
    }
    setIsProgramModalOpen(false);
    setProgramToEdit(null);
  };
  
  const handleConfirmProgramDeletion = () => {
    if (deleteProgramModal.program && deleteProgramModal.confirmText === deleteProgramModal.program.title) {
      setPrograms(prev => prev.filter(p => p.id !== deleteProgramModal.program!.id));
      setDeleteProgramModal({ isOpen: false, program: null, confirmText: '' });
    } else {
      alert("프로그램명이 일치하지 않습니다.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900 mb-2">운영 관리</h1><p className="text-gray-600">대관 및 프로그램 신청을 관리하고, 행사를 직접 등록하세요</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><div className="flex items-center space-x-3 mb-4"><div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center"><Calendar className="w-5 h-5 text-orange-600"/></div><h3 className="text-lg font-semibold text-gray-900">대기중인 대관 신청 ({pendingBookings.length})</h3></div><div className="space-y-3 max-h-96 overflow-y-auto pr-2">{pendingBookings.length > 0 ? pendingBookings.map(b => (<div key={b.id} className="p-4 bg-gray-50 rounded-xl transition-shadow hover:shadow-md"><div><p className="font-semibold text-gray-900">{b.purpose}</p><p className="text-sm text-gray-600 mt-1"><span className="font-medium text-gray-700">{b.userName}</span>{b.organization && <><span className="mx-2 text-gray-300">|</span><span>{b.organization}</span></>}<span className="mx-2 text-gray-300">|</span><span>{b.startDate} @ {b.startTime}-{b.endTime}</span></p></div><div className="flex space-x-3 mt-4"><button onClick={() => handleBookingAction(b.id, 'approve')} className="flex-1 flex items-center justify-center space-x-1.5 bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium border border-green-200"><Check className="w-4 h-4"/><span>승인</span></button><button onClick={() => handleBookingAction(b.id, 'reject')} className="flex-1 flex items-center justify-center space-x-1.5 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium border border-red-200"><X className="w-4 h-4"/><span>거부</span></button></div></div>)) : <p className="text-gray-500 text-center py-4">대기중인 신청이 없습니다.</p>}</div></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><div className="flex items-center space-x-3 mb-4"><div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center"><UserCheck className="w-5 h-5 text-purple-600"/></div><h3 className="text-lg font-semibold text-gray-900">대기중인 프로그램 신청 ({pendingApplications.length})</h3></div><div className="space-y-3 max-h-96 overflow-y-auto pr-2">{pendingApplications.length > 0 ? pendingApplications.map(a => (<div key={a.id} className="p-4 bg-gray-50 rounded-xl transition-shadow hover:shadow-md"><div><p className="font-semibold text-gray-900">{a.programTitle}</p><p className="text-sm text-gray-600 mt-1"><span className="font-medium text-gray-700">{a.userName}</span><span className="mx-2 text-gray-300">|</span><span>신청일: {a.appliedAt}</span></p></div><div className="flex space-x-3 mt-4"><button onClick={() => handleApplicationAction(a.id, 'approve')} className="flex-1 flex items-center justify-center space-x-1.5 bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium border border-green-200"><Check className="w-4 h-4"/><span>승인</span></button><button onClick={() => handleApplicationAction(a.id, 'reject')} className="flex-1 flex items-center justify-center space-x-1.5 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium border border-red-200"><X className="w-4 h-4"/><span>거부</span></button></div></div>)) : <p className="text-gray-500 text-center py-4">대기중인 신청이 없습니다.</p>}</div></div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"><div className="flex items-center justify-between"><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><PlusCircle className="w-5 h-5 text-blue-600"/></div><h3 className="text-lg font-semibold text-gray-900">{editingBookingId ? '대관 수정' : '수업/행사 직접 등록'}</h3></div><button onClick={() => { setShowAdminBookingForm(!showAdminBookingForm); if (editingBookingId) setEditingBookingId(null); }} className="text-sm font-medium text-blue-600 hover:text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">{showAdminBookingForm ? '접기' : '양식 열기'}</button></div>{showAdminBookingForm && (<div className="mt-6 border-t border-gray-200 pt-6"><div className="space-y-4"><div><label htmlFor="admin-booking-purpose" className="block text-sm font-medium text-gray-700 mb-2">수업/행사명</label><input id="admin-booking-purpose" type="text" value={newAdminBooking.purpose} onChange={e => setNewAdminBooking({...newAdminBooking, purpose: e.target.value})} placeholder="예: 농구부 정기 연습" className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500"/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">주관 기관 (선택)</label><input type="text" value={newAdminBooking.organization} onChange={e => setNewAdminBooking({...newAdminBooking, organization: e.target.value})} placeholder="예: 총학생회" className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500"/></div><div><label className="block text-sm font-medium text-gray-700 mb-2">종류</label><select value={newAdminBooking.category} onChange={e => setNewAdminBooking({...newAdminBooking, category: e.target.value as Booking['category']})} className="w-full p-3 border border-gray-200 rounded-xl bg-white transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500"><option value="class">수업</option><option value="event">행사</option><option value="club">동아리</option><option value="personal">개인</option></select></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">시작일</label><input type="date" value={newAdminBooking.startDate} onChange={e => setNewAdminBooking({...newAdminBooking, startDate: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500"/></div><div><label className="block text-sm font-medium text-gray-700 mb-2">종료일</label><input type="date" value={newAdminBooking.endDate} onChange={e => setNewAdminBooking({...newAdminBooking, endDate: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500"/></div></div><div><label className="block text-sm font-medium text-gray-700 mb-2">반복 요일 (선택)</label><div className={`grid grid-cols-7 gap-2 ${newAdminBooking.startDate === newAdminBooking.endDate ? 'opacity-50' : ''}`}>{weekDays.map((day, index) => (<button type="button" key={index} disabled={newAdminBooking.startDate === newAdminBooking.endDate} onClick={() => setNewAdminBooking(prev => ({...prev, days: prev.days.includes(index) ? prev.days.filter(d => d !== index) : [...prev.days, index]}))} className={`p-2 rounded-lg border text-sm font-medium transition-all duration-200 ${newAdminBooking.days.includes(index) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white hover:bg-gray-100 hover:border-gray-400'}`}>{day}</button>))}</div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">시작 시간</label><select value={newAdminBooking.startTime} onChange={e => setNewAdminBooking({...newAdminBooking, startTime: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-white transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500">{timeOptions.map(time => <option key={time} value={time}>{time}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-2">종료 시간</label><select value={newAdminBooking.endTime} onChange={e => setNewAdminBooking({...newAdminBooking, endTime: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-white transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500">{timeOptions.map(time => <option key={time} value={time}>{time}</option>)}</select></div></div><div className="flex justify-end space-x-3 pt-4"><button onClick={() => {setShowAdminBookingForm(false); setEditingBookingId(null);}} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">취소</button><button onClick={handleAdminBookingSubmit} className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-colors">{editingBookingId ? '수정하기' : '등록하기'}</button></div></div>)} 
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"><div className="flex items-center justify-between mb-4"><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-purple-600"/></div><h3 className="text-lg font-semibold text-gray-900">프로그램 관리</h3></div><button onClick={() => { setProgramToEdit(null); setIsProgramModalOpen(true); }} className="flex items-center space-x-2 text-sm font-medium text-purple-600 hover:text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"><PlusCircle className="w-4 h-4"/><span>새 프로그램 개설</span></button></div><div className="space-y-3">{programs.map(p => { const status = getProgramStatus(p); return (<div key={p.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between transition-shadow hover:shadow-md"><div className="flex-1"><div className="flex items-center space-x-3"><p className="font-semibold text-gray-900">{p.title}</p>{status.dDay !== null && (<span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">D-{status.dDay}</span>)}</div><p className="text-sm text-gray-600 mt-1">{p.instructor} | {p.startDate} ~ {p.endDate} | {p.scheduleDays.sort().map(d => weekDays[d]).join(',')} | {p.fee ? `${p.fee.toLocaleString()}원` : '무료'} | {p.enrolled}/{p.capacity}</p></div><div className="flex space-x-2"><button onClick={() => {setProgramToEdit(p); setIsProgramModalOpen(true);}} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-all hover:scale-110"><Edit className="w-4 h-4"/></button><button onClick={() => setDeleteProgramModal({ isOpen: true, program: p, confirmText: '' })} className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition-all hover:scale-110"><Trash2 className="w-4 h-4"/></button></div></div>)})}</div></div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4"><div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Calendar className="w-5 h-5 text-gray-600"/></div><h3 className="text-lg font-semibold text-gray-900">전체 대관 목록 관리</h3></div>
        <div className="p-4 bg-gray-50 rounded-xl mb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-sm font-medium text-gray-700 block mb-2">상태</label><select value={bookingFilterStatus} onChange={e => setBookingFilterStatus(e.target.value as any)} className="w-full p-3 border border-gray-200 rounded-xl bg-white transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500"><option value="all">전체</option><option value="pending">대기중</option><option value="approved">승인됨</option><option value="rejected">거부됨</option><option value="completed">종료</option></select></div>
            <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 block mb-2">신청자 또는 목적으로 검색</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/><input type="search" placeholder="김대학, 농구 연습..." value={bookingFilterSearch} onChange={e => setBookingFilterSearch(e.target.value)} className="w-full p-3 pl-10 border border-gray-200 rounded-xl transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500"/></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div><label className="text-sm font-medium text-gray-700 block mb-2">기간 (시작일)</label><input type="date" value={bookingFilterStartDate} onChange={e => setBookingFilterStartDate(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500"/></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-2">기간 (종료일)</label><input type="date" value={bookingFilterEndDate} onChange={e => setBookingFilterEndDate(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-blue-400 focus:ring-2 focus:ring-blue-500"/></div>
          </div>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">{filteredBookings.map(b => (<div key={b.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between transition-shadow hover:shadow-md"><div className="flex-1"><p className="font-semibold text-gray-900">{b.purpose}</p><p className="text-sm text-gray-600 mt-1">{b.userName} | {b.startDate} {b.startTime}-{b.endTime} | <span className={`font-medium px-2 py-1 rounded-full text-xs ${b.status === 'approved' ? 'bg-green-100 text-green-800' : b.status === 'pending' ? 'bg-orange-100 text-orange-800' : b.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{b.status}</span></p></div><div className="flex space-x-2"><button onClick={() => handleEditBookingClick(b)} className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-all hover:scale-110"><Edit className="w-4 h-4"/></button><button onClick={() => {if(window.confirm('정말로 이 대관을 삭제하시겠습니까?')) setBookings(bs => bs.filter(bk => bk.id !== b.id))}} className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition-all hover:scale-110"><Trash2 className="w-4 h-4"/></button></div></div>))}</div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><div className="flex items-center space-x-3 mb-4"><div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center"><Calendar className="w-5 h-5 text-green-600"/></div><h3 className="text-lg font-semibold text-gray-900">전체 대관 캘린더</h3></div><BookingCalendar bookings={bookings} /></div>
      {rejectionModal.isOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"><h3 className="text-xl font-bold text-gray-900 mb-4">거부 사유 입력</h3><p className="text-gray-600 mb-6">거부 이유를 작성해주세요. 신청자에게 표시됩니다.</p><div><textarea value={rejectionModal.reason} onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl h-28 transition-colors hover:border-red-400 focus:ring-2 focus:ring-red-500" rows={4}/></div><div className="flex space-x-3 mt-6"><button type="button" onClick={() => setRejectionModal({ isOpen: false, type: null, id: null, reason: '' })} className="flex-1 py-3 px-4 border rounded-xl hover:bg-gray-50 transition-colors">취소</button><button onClick={handleConfirmRejection} disabled={!rejectionModal.reason.trim()} className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:bg-gray-300 transition-colors">거부 확정</button></div></div></div>)}
      {isProgramModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"><h3 className="text-xl font-bold text-gray-900 mb-6">{programToEdit ? '프로그램 수정' : '새 프로그램 개설'}</h3><div className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">프로그램명</label><input type="text" value={programForm.title} onChange={e => setProgramForm({...programForm, title: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-purple-400 focus:ring-2 focus:ring-purple-500"/></div><div><label className="block text-sm font-medium text-gray-700 mb-2">강사명</label><input type="text" value={programForm.instructor} onChange={e => setProgramForm({...programForm, instructor: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-purple-400 focus:ring-2 focus:ring-purple-500"/></div></div><div><label className="block text-sm font-medium text-gray-700 mb-2">설명</label><textarea value={programForm.description} onChange={e => setProgramForm({...programForm, description: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl h-24 transition-colors hover:border-purple-400 focus:ring-2 focus:ring-purple-500"/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">시작일</label><input type="date" value={programForm.startDate} onChange={e => setProgramForm({...programForm, startDate: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-purple-400 focus:ring-2 focus:ring-purple-500"/></div><div><label className="block text-sm font-medium text-gray-700 mb-2">종료일</label><input type="date" value={programForm.endDate} onChange={e => setProgramForm({...programForm, endDate: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-purple-400 focus:ring-2 focus:ring-purple-500"/></div></div><div><label className="block text-sm font-medium text-gray-700 mb-2">반복 요일</label><div className="grid grid-cols-7 gap-2">{weekDays.map((day, index) => (<button type="button" key={index} onClick={() => setProgramForm(prev => ({...prev, scheduleDays: prev.scheduleDays.includes(index) ? prev.scheduleDays.filter(d => d !== index) : [...prev.scheduleDays, index]}))} className={`p-2 rounded-lg border text-sm font-medium transition-all duration-200 ${programForm.scheduleDays.includes(index) ? 'bg-purple-500 text-white border-purple-500' : 'bg-white hover:bg-gray-100 hover:border-gray-400'}`}>{day}</button>))}</div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">정원</label><input type="number" value={programForm.capacity} onChange={e => setProgramForm({...programForm, capacity: parseInt(e.target.value)})} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-purple-400 focus:ring-2 focus:ring-purple-500"/></div><div><label className="block text-sm font-medium text-gray-700 mb-2">참가비</label><input type="number" value={programForm.fee} onChange={e => setProgramForm({...programForm, fee: parseInt(e.target.value)})} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-purple-400 focus:ring-2 focus:ring-purple-500"/></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">레벨</label><select value={programForm.level} onChange={e => setProgramForm({...programForm, level: e.target.value as Program['level']})} className="w-full p-3 border border-gray-200 rounded-xl bg-white transition-colors hover:border-purple-400 focus:ring-2 focus:ring-purple-500"><option value="beginner">초급</option><option value="intermediate">중급</option><option value="advanced">고급</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-2">종목</label><select value={programForm.category} onChange={e => setProgramForm({...programForm, category: e.target.value as Program['category']})} className="w-full p-3 border border-gray-200 rounded-xl bg-white transition-colors hover:border-purple-400 focus:ring-2 focus:ring-purple-500"><option value="yoga">요가</option><option value="pilates">필라테스</option><option value="fitness">피트니스</option><option value="dance">댄스</option><option value="badminton">배드민턴</option><option value="pickleball">피클볼</option></select></div></div></div><div className="flex space-x-3 mt-6"><button type="button" onClick={() => setIsProgramModalOpen(false)} className="flex-1 py-3 px-4 border rounded-xl hover:bg-gray-50 transition-colors">취소</button><button onClick={handleSaveProgram} className="flex-1 py-3 px-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors">{programToEdit ? '수정하기' : '개설하기'}</button></div></div></div>)}
      {deleteProgramModal.isOpen && deleteProgramModal.program && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"><h3 className="text-xl font-bold text-gray-900 mb-2">프로그램 삭제 확인</h3><p className="text-gray-600 mb-4">삭제를 진행하려면 프로그램명(<strong className="text-red-600">{deleteProgramModal.program.title}</strong>)을(를) 정확히 입력하세요.</p><div><input type="text" value={deleteProgramModal.confirmText} onChange={(e) => setDeleteProgramModal(prev => ({ ...prev, confirmText: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl transition-colors hover:border-red-400 focus:ring-2 focus:ring-red-500" autoComplete="off"/></div><div className="flex space-x-3 mt-6"><button type="button" onClick={() => setDeleteProgramModal({ isOpen: false, program: null, confirmText: '' })} className="flex-1 py-3 px-4 border rounded-xl hover:bg-gray-50 transition-colors">취소</button><button onClick={handleConfirmProgramDeletion} disabled={deleteProgramModal.confirmText !== deleteProgramModal.program.title} className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:bg-gray-300 transition-colors">삭제</button></div></div></div>)}
    </div>
  );
};

export default AdminSection;
````