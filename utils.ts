// lib/utils.ts (정상화)
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Timestamp } from 'firebase/firestore'

// 클래스 병합 유틸리티
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 전화번호 표시 포맷
export const formatPhoneNumberForDisplay = (phone?: string): string => {
  if (!phone) return '정보 없음'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.startsWith('02') && cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
  }
  return phone
}

// 전화번호 입력 시 자동 포맷팅 (실시간 입력용)
export const formatPhoneNumberForInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
}

// Firebase Timestamp → 문자열 포맷
export const formatFirebaseTimestamp = (
  timestamp: Timestamp | null | undefined,
  format: 'date' | 'datetime' | 'time' = 'datetime'
): string => {
  if (!timestamp) return '정보 없음'
  const date = timestamp.toDate()
  switch (format) {
    case 'date':
      return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
    case 'time':
      return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(date)
    case 'datetime':
    default:
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
  }
}

// Date → Timestamp
export const dateToTimestamp = (date: Date): Timestamp => Timestamp.fromDate(date)

// HH:MM → 분
export const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

// 분 → HH:MM
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Firebase 오류 코드 번역
export const translateFirebaseError = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': '미가입자입니다. 회원가입을 해주세요.',
    'auth/wrong-password': '비밀번호가 일치하지 않습니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password': '비밀번호가 너무 간단합니다. 6자 이상 입력해주세요.',
    'auth/invalid-email': '올바른 이메일 형식이 아닙니다.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 잘못되었습니다. 미가입자는 회원가입을 먼저 해주세요.',
    'auth/invalid-login-credentials': '로그인 정보가 잘못되었습니다. 미가입자는 회원가입을 먼저 해주세요.',
    'auth/too-many-requests': '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하거나 브라우저 캐시를 삭제해 주세요.',
    'firestore/permission-denied': '접근 권한이 없습니다.',
    'firestore/unavailable': '서비스가 일시적으로 사용 불가합니다.',
    'firestore/deadline-exceeded': '요청 시간이 초과되었습니다.',
    'storage/unauthorized': '파일 업로드 권한이 없습니다.',
    'storage/object-not-found': '파일을 찾을 수 없습니다.',
    'storage/quota-exceeded': '저장소 용량이 초과되었습니다.',
    'functions/permission-denied': '함수 실행 권한이 없습니다.',
    'functions/unavailable': '서버 함수가 일시적으로 사용 불가합니다.',
  }
  return errorMessages[errorCode] || '로그인에 실패했습니다. 이메일/비밀번호를 확인하거나 회원가입을 먼저 진행해주세요.'
}


// 예약 상태 번역
export const translateBookingStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '대기',
    approved: '승인',
    rejected: '거절',
    cancelled: '취소',
    completed: '완료',
  }
  return statusMap[status] || status
}

// 프로그램 레벨 번역
export const translateProgramLevel = (level: string): string => {
  const levelMap: Record<string, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
  }
  return levelMap[level] || level
}

// 통화 포맷
export const formatCurrency = (amount: number): string => {
  if (amount === 0) return '무료'
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
}

// 요일 배열 포맷
export const formatScheduleDays = (days: number[]): string => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return days.sort((a, b) => a - b).map((d) => dayNames[d]).join(', ')
}

// 말줄임
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 파일 크기 포맷
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 이메일 형식 검사
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 한국 전화번호 형식 검사
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '')
  // 휴대폰(11자리) 또는 지역번호 유선전화(8-10자리)
  return /^01[0-9]{9}$|^0[2-9][0-9]{7,8}$/.test(cleaned)
}

// 디바운스
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

// 배열 청크 분할
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

// 환경변수 필수 체크
export const requireEnv = (name: string): string => {
  const isServer = typeof window === 'undefined'
  const value = isServer ? process.env[name] : process.env[name]
  if (!value) {
    const msg = `환경변수 누락: ${name}`
    if (isServer) throw new Error(msg)
    console.error(msg)
    return ''
  }
  return value
}

export const getFirebaseErrorMessage = (error: any): string => {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const errorCodeMatch = rawMessage.match(/auth\/([\w-]+)/);
  if (errorCodeMatch && errorCodeMatch[0]) {
    return translateFirebaseError(errorCodeMatch[0]);
  }
  return translateFirebaseError(rawMessage);
};