# FlexSpace Pro 개발을 위한 체계적 프롬프트 디자인

## 📋 문서 정보

- **프로젝트명**: FlexSpace Pro - 체육관 통합 관리 시스템
- **문서 유형**: AI 개발을 위한 프롬프트 디자인 가이드
- **버전**: v1.0
- **작성일**: 2025년 1월
- **목적**: 중복 없는 체계적 개발을 위한 단계별 프롬프트 체인

---

## 🎯 프롬프트 디자인 원칙

### 핵심 원칙
1. **체인 연결성**: 각 프롬프트는 이전 단계의 결과물을 명확히 참조
2. **중복 방지**: 기존 코드 확인 후 새로운 기능만 개발
3. **단계별 검증**: 각 단계마다 빌드/테스트 확인 필수
4. **명확한 범위**: 각 프롬프트는 하나의 명확한 목표만 가짐
5. **상태 유지**: 프롬프트 간 컨텍스트와 진행 상황 명시

---

## 🏗️ 개발 단계별 프롬프트 체인

### Phase 1: 프로젝트 초기 설정 및 기반 구조

#### 1.1 프로젝트 초기화 프롬프트
```
작업 범위: React + TypeScript + Vite + Firebase 프로젝트 초기 설정

다음 작업을 순서대로 수행해주세요:

1. 현재 디렉토리 구조 확인 (ls 명령어 사용)
2. package.json이 존재하면 기존 의존성 확인, 없으면 새로 생성
3. 다음 기술 스택으로 프로젝트 설정:
   - React 18.2.0+
   - TypeScript 5.0+
   - Vite 5.0+
   - Tailwind CSS 3.3+
   - Firebase 10.0+
   - Lucide React 0.400+

4. 필수 의존성 설치:
```bash
npm create vite@latest . -- --template react-ts
npm install firebase tailwindcss lucide-react
npm install -D @types/node eslint prettier
```

5. Tailwind CSS 설정 (tailwind.config.js, src/index.css)
6. 기본 디렉토리 구조 생성:
   - src/components/
   - src/hooks/
   - src/types/
   - src/utils/

결과물: 프로젝트가 npm run dev로 실행 가능한 상태
검증: npm run build가 성공적으로 완료되는지 확인
다음 단계: Firebase 설정 및 인증 구현
```

#### 1.2 Firebase 설정 프롬프트
```
작업 범위: Firebase 설정 및 기본 구성

전제 조건: 이전 단계에서 생성된 React 프로젝트 존재 확인

수행 작업:
1. 기존 firebase.ts 파일 존재 여부 확인
2. 없으면 src/firebase.ts 생성, 다음 내용 포함:
   - Firebase 앱 초기화
   - Authentication 설정
   - Firestore 설정
   - Storage 설정 (향후 확장용)

3. 환경변수 설정 안내:
   - .env.local 파일 생성 가이드
   - Firebase 프로젝트 설정값 placeholder

4. Firebase Security Rules 기본 설정:
   - 읽기: 인증된 사용자만
   - 쓰기: 사용자 본인 데이터만

파일 생성:
- src/firebase.ts
- .env.local.example
- firestore.rules (기본 보안 규칙)

검증: Firebase 연결 테스트 코드 실행
다음 단계: 타입 정의 및 기본 인터페이스 생성
```

#### 1.3 타입 시스템 구축 프롬프트
```
작업 범위: TypeScript 타입 정의 및 인터페이스 구축

전제 조건: Firebase 설정 완료 확인

수행 작업:
1. 기존 types.ts 파일 확인 후 없으면 생성
2. 다음 타입들을 정의 (중복 방지 위해 기존 타입 먼저 확인):

필수 타입 정의:
```typescript
// 사용자 관련
export type UserRole = 'user' | 'admin'
export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: UserRole
  isActive?: boolean
  photoURL?: string
}

// 대관 관련
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
export type BookingCategory = 'class' | 'event' | 'club' | 'personal'

// 프로그램 관련
export type ProgramLevel = 'beginner' | 'intermediate' | 'advanced'
export type ProgramCategory = 'yoga' | 'pilates' | 'fitness' | 'dance' | 'badminton' | 'pickleball'

// 네비게이션
export type ActiveTab = 'dashboard' | 'booking' | 'program' | 'admin' | 'userManagement' | 'facilities'
```

3. Firebase 컬렉션 상수 정의
4. 유틸리티 타입 추가 (CreateBookingData 등)

검증: TypeScript 컴파일 오류 없음 확인 (npm run build)
다음 단계: 인증 시스템 구현
```

### Phase 2: 인증 시스템 및 기본 네비게이션

#### 2.1 인증 Hook 구현 프롬프트
```
작업 범위: Firebase Authentication을 활용한 사용자 인증 Hook 구현

전제 조건:
- Firebase 설정 완료
- types.ts에 User 인터페이스 정의됨

수행 작업:
1. hooks/use-auth.ts 파일 존재 여부 확인
2. 기존 파일이 있으면 내용 검토 후 누락된 기능만 추가
3. 새로 생성하거나 업데이트할 기능:

필수 기능:
- 현재 사용자 상태 관리
- Google 로그인/로그아웃
- 이메일/비밀번호 로그인
- 사용자 역할(role) 확인
- 로딩 상태 관리
- 에러 처리

Hook 인터페이스:
```typescript
interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
  isAuthenticated: boolean
}
```

4. Firebase Auth 상태 변화 리스너 구현
5. Firestore에서 사용자 추가 정보 조회 로직

검증:
- TypeScript 오류 없음
- Firebase 연결 테스트
다음 단계: 로그인 컴포넌트 구현
```

#### 2.2 로그인 폼 컴포넌트 프롬프트
```
작업 범위: 사용자 로그인/회원가입 UI 컴포넌트 구현

전제 조건:
- use-auth.ts Hook 구현 완료
- Tailwind CSS 설정 완료

수행 작업:
1. components/LoginForm.tsx 파일 확인
2. 기존 컴포넌트가 있으면 기능 검토 후 부족한 부분만 추가
3. 구현할 UI 요소:

필수 UI 컴포넌트:
- 이메일/비밀번호 입력 폼
- Google 로그인 버튼
- 회원가입/로그인 모드 전환
- 에러 메시지 표시
- 로딩 상태 표시
- 이메일 인증 안내

디자인 요구사항:
- Tailwind CSS 클래스 사용
- 모바일 반응형 디자인
- Lucide React 아이콘 활용
- 깔끔하고 직관적인 UI

4. 폼 유효성 검사 구현
5. 에러 처리 및 사용자 피드백

기능 요구사항:
- use-auth Hook과 연동
- 성공 시 자동 페이지 이동
- 실패 시 명확한 에러 메시지

검증: 로그인/로그아웃 기능 정상 작동
다음 단계: 메인 네비게이션 구현
```

#### 2.3 네비게이션 컴포넌트 프롬프트
```
작업 범위: 메인 네비게이션 및 레이아웃 컴포넌트 구현

전제 조건:
- 로그인 시스템 구현 완료
- 사용자 역할 구분 가능

수행 작업:
1. components/Navigation.tsx 파일 확인
2. 기존 네비게이션이 있으면 기능 점검 후 누락 기능만 추가
3. 구현할 네비게이션 요소:

메뉴 구조:
- 대시보드 (모든 사용자)
- 체육관 대관 (모든 사용자)
- 프로그램 (모든 사용자)
- 운영 관리 (관리자만)
- 회원 관리 (관리자만)
- 사용자 프로필 드롭다운

4. 역할별 메뉴 표시 로직:
```typescript
const menuItems = [
  { id: 'dashboard', label: '대시보드', icon: Home, show: true },
  { id: 'booking', label: '체육관 대관', icon: Calendar, show: true },
  { id: 'program', label: '프로그램', icon: BookOpen, show: true },
  { id: 'admin', label: '운영 관리', icon: Settings, show: isAdmin },
  { id: 'userManagement', label: '회원 관리', icon: Users, show: isAdmin }
]
```

5. 반응형 디자인:
- 데스크톱: 수평 네비게이션
- 모바일: 햄버거 메뉴

6. 활성 탭 표시 및 상태 관리

검증:
- 역할별 메뉴 표시 정확성
- 반응형 동작 확인
다음 단계: 메인 App 컴포넌트 통합
```

### Phase 3: 메인 애플리케이션 구조 및 대시보드

#### 3.1 메인 App 컴포넌트 구현 프롬프트
```
작업 범위: 전체 애플리케이션 구조 및 라우팅 로직 구현

전제 조건:
- 인증 시스템 완료
- 네비게이션 컴포넌트 완료
- 모든 필수 타입 정의 완료

수행 작업:
1. App.tsx 파일 확인 및 기존 코드 분석
2. 중복 없이 다음 기능 구현:

핵심 앱 구조:
```typescript
function App() {
  const { user, loading, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')

  // 로딩 중 처리
  // 비인증 사용자 처리 (LoginForm 표시)
  // 인증된 사용자 메인 앱 표시
}
```

3. 조건부 렌더링 로직:
- 로딩 중: 로딩 스피너
- 비로그인: LoginForm 컴포넌트
- 로그인 완료: 메인 애플리케이션

4. 탭 기반 페이지 전환 시스템
5. 전역 상태 관리 (useState 기반)

주의사항:
- 기존 App.tsx 내용 확인 후 중복 코드 방지
- 컴포넌트 import 순서 정리
- 불필요한 리렌더링 방지

검증:
- 로그인 플로우 완전 동작
- 탭 전환 정상 작동
다음 단계: 대시보드 컴포넌트 구현
```

#### 3.2 대시보드 컴포넌트 프롬프트
```
작업 범위: 사용자/관리자 대시보드 UI 및 기능 구현

전제 조건:
- App.tsx에서 대시보드 호출 가능
- 사용자 역할 구분 완료
- Firebase 데이터 연동 준비

수행 작업:
1. components/Dashboard.tsx 파일 확인
2. 기존 대시보드 컴포넌트 기능 분석 후 누락 기능만 추가
3. 구현할 대시보드 요소:

일반 사용자 대시보드:
- 개인 통계 카드 (나의 대관, 나의 프로그램)
- 최근 대관 신청 목록 (최대 3개)
- 나의 프로그램 신청 현황 (최대 3개)
- 개인 일정 캘린더

관리자 대시보드:
- 운영 통계 카드 4개:
  * 대기중인 대관 신청
  * 대기중인 프로그램 신청
  * 운영중인 프로그램
  * 총 이용자 수
- 전체 최근 대관 신청
- 전체 프로그램 신청 현황
- 전체 일정 캘린더

4. 데이터 Props 인터페이스:
```typescript
interface DashboardProps {
  currentUser: User
  bookings: Booking[]
  applications: ProgramApplication[]
  programs: Program[]
  setActiveTab: (tab: ActiveTab) => void
}
```

5. 상태 배지 컴포넌트 구현
6. D-Day 계산 로직
7. "전체 보기" 버튼으로 해당 섹션 이동

주의사항:
- 기존 Dashboard 컴포넌트 내용 보존
- 중복 UI 코드 방지
- 성능 최적화 (useMemo 활용)

검증: 대시보드 렌더링 및 데이터 표시 정상
다음 단계: 캘린더 컴포넌트 구현
```

### Phase 4: 핵심 기능 컴포넌트 구현

#### 4.1 대시보드 캘린더 컴포넌트 프롬프트
```
작업 범위: 대시보드용 캘린더 컴포넌트 구현

전제 조건:
- Dashboard 컴포넌트에서 캘린더 호출됨
- 대관 및 프로그램 데이터 구조 확정

수행 작업:
1. components/DashboardCalendar.tsx 파일 확인
2. 기존 캘린더 기능 분석 후 누락 기능만 구현
3. 필수 캘린더 기능:

캘린더 뷰 옵션:
- 월 뷰 (기본)
- 주 뷰
- 일 뷰
- 뷰 전환 버튼

데이터 표시:
- 대관 일정 (색상: 파란색)
- 프로그램 일정 (색상: 보라색)
- 일정 중복 시 겹침 표시
- 오늘 날짜 하이라이트

4. Props 인터페이스:
```typescript
interface DashboardCalendarProps {
  bookings: Booking[]
  programs: Program[]
  view: 'month' | 'week' | 'day'
  setView: (view: 'month' | 'week' | 'day') => void
}
```

5. 날짜 계산 유틸리티:
- 월/주/일 범위 계산
- 반복 일정 처리 (recurrenceRule)
- 프로그램 스케줄 매핑

6. 반응형 디자인:
- 모바일: 간소화된 뷰
- 데스크톱: 상세 정보 표시

주의사항:
- 기존 DashboardCalendar 코드 중복 방지
- 날짜 라이브러리 없이 순수 JavaScript 사용
- 성능 고려 (대량 데이터 처리)

검증: 캘린더 뷰 전환 및 일정 표시 정상
다음 단계: 체육관 대관 섹션 구현
```

#### 4.2 체육관 대관 컴포넌트 프롬프트
```
작업 범위: 체육관 대관 관리 전체 기능 구현

전제 조건:
- 대관 관련 타입 정의 완료
- 사용자 인증 시스템 완료
- Firestore 연동 준비

수행 작업:
1. components/BookingSection.tsx 파일 확인
2. 기존 대관 기능 분석 후 누락 기능만 추가
3. 구현할 주요 기능:

뷰 전환 시스템:
- 목록 뷰 / 캘린더 뷰 토글
- 뷰별 최적화된 UI

목록 뷰 기능:
- 진행중인 대관 / 완료된 대관 구분
- 상태별 필터링
- 대관 상세 정보 카드

캘린더 뷰 기능:
- 월별 캘린더 표시
- 대관 상태별 색상 구분
- 날짜 클릭 시 해당 일의 대관 현황

4. 신규 대관 신청 폼:
```typescript
interface BookingFormData {
  facilityId: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  purpose: string
  organization?: string
  category: BookingCategory
  numberOfParticipants: number
  recurrenceRule?: { days: number[] }
}
```

5. 대관 상태 관리:
- 상태 배지 표시
- 관리자 메모 표시 (해당되는 경우)
- 거절 사유 표시

주의사항:
- 기존 BookingSection 코드 보존
- 중복 폼 컴포넌트 방지
- 데이터 유효성 검사

검증:
- 뷰 전환 정상 동작
- 신규 대관 신청 가능
다음 단계: 프로그램 섹션 구현
```

#### 4.3 프로그램 섹션 컴포넌트 프롬프트
```
작업 범위: 프로그램 관리 및 신청 전체 기능 구현

전제 조건:
- 프로그램 관련 타입 정의 완료
- 프로그램 신청 데이터 구조 확정

수행 작업:
1. components/ProgramSection.tsx 파일 확인
2. 기존 프로그램 기능 분석 후 누락 기능만 추가
3. 구현할 핵심 기능:

검색 및 필터링:
- 프로그램명 검색
- 카테고리 필터 (요가, 필라테스, 피트니스, 댄스, 배드민턴, 피클볼)
- 요일 필터
- 시간대 필터
- 레벨 필터 (초급, 중급, 고급)

프로그램 카드 UI:
- 프로그램 기본 정보 (제목, 강사, 설명)
- 일정 정보 (요일, 시간, 기간)
- 등록 정보 (현재 등록자/정원, 수강료)
- D-Day 표시 (시작까지 남은 일수)
- 상태 표시 (모집중, 진행중, 종료)

4. 프로그램 신청 로직:
```typescript
const handleApply = async (programId: string) => {
  // 중복 신청 확인
  // 정원 확인
  // 신청 처리
  // 성공/실패 피드백
}
```

5. 프로그램 상태 계산:
- 모집중 (시작 전): D-Day 표시
- 진행중 (시작~종료): "진행중" 표시
- 종료 (종료 후): "종료" 표시

6. 반응형 그리드 레이아웃:
- 모바일: 1열
- 태블릿: 2열
- 데스크톱: 3열

주의사항:
- 기존 ProgramSection 코드 중복 방지
- 필터링 성능 최적화
- 사용자 피드백 명확성

검증:
- 필터링 정상 동작
- 프로그램 신청 가능
다음 단계: 관리자 기능 구현
```

### Phase 5: 관리자 전용 기능

#### 5.1 관리자 운영 관리 컴포넌트 프롬프트
```
작업 범위: 관리자 운영 관리 (AdminSection) 전체 기능 구현

전제 조건:
- 관리자 권한 확인 시스템 완료
- 대관/프로그램 신청 데이터 구조 확정

수행 작업:
1. components/AdminSection.tsx 파일 확인
2. 기존 관리자 기능 분석 후 누락 기능만 추가
3. 구현할 관리 기능:

직접 등록 시스템:
a) 수강생 직접 등록 폼:
- 프로그램 선택 드롭다운
- 수강생 정보 입력 (이름, 이메일, 전화번호)
- 특이사항 메모
- 등록 처리 및 정원 자동 업데이트

b) 팀 직접 등록 폼:
- 시설 선택
- 팀 정보 입력 (팀명, 대표자, 인원)
- 대관 일정 설정
- 등록 완료 처리

4. 대기중인 신청 관리:
- 대관 신청 승인/거절 인터페이스
- 프로그램 신청 승인/거절 인터페이스
- 거절 시 사유 입력 필수
- 일괄 처리 기능

5. 통계 대시보드:
```typescript
interface AdminStats {
  pendingBookings: number
  pendingApplications: number
  activePrograms: number
  totalUsers: number
}
```

6. 신청 상세 정보 모달:
- 신청자 정보 상세 보기
- 신청 내역 전체 확인
- 승인/거절 처리 버튼

주의사항:
- 기존 AdminSection 코드 보존
- 관리자 권한 재확인
- 데이터 무결성 보장

검증:
- 직접 등록 정상 동작
- 신청 승인/거절 처리 완료
다음 단계: 회원 관리 기능 구현
```

#### 5.2 회원 관리 컴포넌트 프롬프트
```
작업 범위: 관리자용 회원 관리 시스템 구현

전제 조건:
- 사용자 데이터 구조 확정
- 관리자 권한 시스템 완료

수행 작업:
1. components/UserManagement.tsx 파일 확인
2. 기존 회원 관리 기능 확인 후 누락 기능만 추가
3. 구현할 회원 관리 기능:

회원 목록 관리:
- 전체 회원 목록 표시
- 검색 기능 (이름, 이메일)
- 역할별 필터링 (일반회원, 관리자)
- 활성 상태별 필터링

회원 정보 관리:
```typescript
interface UserManagementProps {
  users: User[]
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>
  onToggleUserStatus: (userId: string, isActive: boolean) => Promise<void>
  onChangeUserRole: (userId: string, role: UserRole) => Promise<void>
}
```

4. 회원 액션:
- 역할 변경 (일반회원 ↔ 관리자)
- 계정 활성화/비활성화
- 회원 상세 정보 보기
- 회원 활동 이력 확인

5. 회원 통계:
- 총 회원 수
- 신규 가입자 (최근 30일)
- 활성 회원 비율
- 관리자 수

6. 보안 고려사항:
- 최고 관리자는 역할 변경 불가
- 본인 계정 비활성화 방지
- 민감한 정보 마스킹

주의사항:
- 기존 UserManagement 코드 중복 방지
- 데이터 변경 시 확인 모달
- 실수 방지 안전장치

검증:
- 회원 정보 수정 정상 동작
- 권한 변경 안전성 확인
다음 단계: Firestore 연동 Hook 구현
```

### Phase 6: 데이터 연동 및 실시간 업데이트

#### 6.1 Firestore 연동 Hook 프롬프트
```
작업 범위: Firebase Firestore 데이터 연동 커스텀 Hook 구현

전제 조건:
- Firebase 설정 완료
- 모든 데이터 타입 정의 완료
- 컬렉션 구조 확정

수행 작업:
1. hooks/use-firestore.ts 파일 확인
2. 기존 Firestore Hook 분석 후 누락 기능만 추가
3. 구현할 데이터 연동 기능:

실시간 데이터 구독:
```typescript
export const useFirestore = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [applications, setApplications] = useState<ProgramApplication[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 실시간 리스너 설정
  // CRUD 함수들
  // 에러 처리
}
```

4. CRUD 함수 구현:
- createBooking(data: CreateBookingData)
- updateBookingStatus(id: string, status: BookingStatus)
- createProgram(data: Omit<Program, 'id'>)
- applyToProgram(programId: string, userId: string)
- updateApplicationStatus(id: string, status: ApplicationStatus)

5. 실시간 업데이트:
- onSnapshot을 사용한 실시간 데이터 구독
- 컴포넌트 언마운트 시 리스너 정리
- 에러 발생 시 재연결 로직

6. 데이터 캐싱 및 최적화:
- 중복 요청 방지
- 로컬 상태 관리
- 오프라인 지원 준비

주의사항:
- 기존 use-firestore 코드 보존
- 메모리 누수 방지 (cleanup)
- 권한 에러 처리

검증:
- 실시간 데이터 업데이트 동작
- CRUD 작업 정상 처리
다음 단계: 전체 앱 데이터 연동
```

#### 6.2 앱 전체 데이터 통합 프롬프트
```
작업 범위: App.tsx에서 모든 컴포넌트와 데이터 연동 완성

전제 조건:
- 모든 컴포넌트 구현 완료
- use-firestore Hook 구현 완료
- use-auth Hook 구현 완료

수행 작업:
1. App.tsx 파일의 현재 상태 확인
2. 기존 데이터 연동 코드 분석 후 누락 부분만 추가
3. 전체 데이터 플로우 연결:

앱 레벨 상태 관리:
```typescript
function App() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const {
    bookings,
    programs,
    applications,
    users,
    loading: dataLoading,
    ...crudFunctions
  } = useFirestore()

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')

  // 전체 로딩 상태 계산
  const isLoading = authLoading || dataLoading
}
```

4. 컴포넌트별 Props 전달:
- Dashboard: 사용자별 필터링된 데이터
- BookingSection: 대관 CRUD 함수 연결
- ProgramSection: 프로그램 신청 함수 연결
- AdminSection: 관리자 전용 데이터 및 함수
- UserManagement: 회원 관리 함수 연결

5. 권한별 데이터 필터링:
- 일반 사용자: 본인 관련 데이터만
- 관리자: 전체 데이터 접근

6. 에러 및 로딩 상태 처리:
- 전역 로딩 스피너
- 에러 메시지 표시
- 재시도 기능

주의사항:
- 기존 App.tsx 로직 보존
- 불필요한 리렌더링 방지 (useMemo, useCallback)
- 메모리 효율성 고려

검증:
- 모든 기능 정상 동작
- 실시간 업데이트 확인
- 권한별 데이터 접근 확인
다음 단계: 유틸리티 함수 구현
```

### Phase 7: 유틸리티 및 최적화

#### 7.1 유틸리티 함수 구현 프롬프트
```
작업 범위: 공통 유틸리티 함수 및 헬퍼 함수 구현

전제 조건:
- 모든 주요 컴포넌트 구현 완료
- 타입 시스템 완성

수행 작업:
1. utils.ts 파일 확인 및 기존 함수 분석
2. 중복 방지를 위해 누락된 유틸리티 함수만 추가
3. 구현할 유틸리티 함수:

날짜 처리 함수:
```typescript
export const formatDate = (date: string | Date): string
export const isDateInRange = (date: Date, start: Date, end: Date): boolean
export const getDayOfWeek = (date: Date): number
export const calculateDDay = (targetDate: string): number
export const getWeekDates = (date: Date): Date[]
export const getMonthDates = (date: Date): Date[]
```

데이터 변환 함수:
```typescript
export const filterBookingsByUser = (bookings: Booking[], userId: string): Booking[]
export const filterBookingsByStatus = (bookings: Booking[], status: BookingStatus): Booking[]
export const sortBookingsByDate = (bookings: Booking[]): Booking[]
export const groupBookingsByDate = (bookings: Booking[]): Record<string, Booking[]>
```

검증 함수:
```typescript
export const isValidEmail = (email: string): boolean
export const isValidPhone = (phone: string): boolean
export const isTimeSlotAvailable = (
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string
): boolean
```

4. 상수 정의:
- 요일 배열 (weekDays)
- 카테고리 매핑
- 상태 색상 매핑
- 기본 설정값

주의사항:
- 기존 utils.ts 내용 보존
- 순수 함수로 구현
- 타입 안전성 보장

검증:
- 모든 유틸리티 함수 테스트
- TypeScript 컴파일 성공
다음 단계: 성능 최적화
```

#### 7.2 성능 최적화 프롬프트
```
작업 범위: React 성능 최적화 및 메모이제이션 적용

전제 조건:
- 모든 기능 구현 완료
- 앱 정상 동작 확인

수행 작업:
1. 각 컴포넌트 파일들의 성능 이슈 분석
2. 기존 최적화 코드 확인 후 추가 최적화만 적용
3. 적용할 최적화 기법:

React.memo 적용:
- StatusBadge 컴포넌트
- 개별 카드 컴포넌트들
- 반복 렌더링되는 컴포넌트들

useMemo 최적화:
```typescript
// Dashboard 컴포넌트
const myBookings = useMemo(() =>
  bookings.filter(b => b.userId === currentUser.id)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
  [bookings, currentUser.id]
)

const pendingApplications = useMemo(() =>
  applications.filter(a => a.status === 'pending'),
  [applications]
)
```

useCallback 최적화:
- 이벤트 핸들러 함수들
- 자식 컴포넌트로 전달되는 함수들
- API 호출 함수들

4. 지연 로딩 구현:
- DashboardCalendar 컴포넌트 lazy loading
- 큰 이미지들 lazy loading
- 무거운 계산 로직 지연 실행

5. 불필요한 리렌더링 방지:
- 객체/배열 props 안정화
- 조건부 렌더링 최적화
- 상태 업데이트 최소화

주의사항:
- 기존 최적화 코드 중복 방지
- 과도한 최적화로 인한 코드 복잡성 방지
- 실제 성능 측정 기반 최적화

검증:
- React DevTools로 렌더링 성능 확인
- 메모리 사용량 모니터링
다음 단계: 최종 빌드 및 테스트
```

### Phase 8: 최종 검증 및 배포 준비

#### 8.1 최종 빌드 및 오류 수정 프롬프트
```
작업 범위: 프로덕션 빌드 준비 및 모든 오류 수정

전제 조건:
- 모든 기능 구현 완료
- 성능 최적화 적용 완료

수행 작업:
1. 현재 프로젝트 상태 종합 점검
2. 빌드 및 린트 검사 실행:

필수 검증 단계:
```bash
# TypeScript 컴파일 검사
npm run build

# ESLint 코드 품질 검사
npm run lint

# 개발 서버 실행 테스트
npm run dev
```

3. 발견된 오류들 체계적 수정:
- TypeScript 타입 오류
- ESLint 경고 및 오류
- 런타임 오류
- 콘솔 경고 메시지

4. 코드 정리 작업:
- 사용하지 않는 import 제거
- 사용하지 않는 변수 정리
- 주석 처리된 코드 제거
- console.log 제거

5. 최종 기능 테스트:
- 로그인/로그아웃 플로우
- 모든 CRUD 작업
- 권한별 접근 제어
- 반응형 디자인

6. 브라우저 호환성 확인:
- Chrome, Firefox, Safari, Edge
- 모바일 브라우저 테스트

주의사항:
- 기능 손상 없이 오류만 수정
- 코드 정리 중 실수로 필요한 코드 삭제 방지
- 테스트 데이터로 모든 시나리오 확인

검증:
- npm run build 성공
- npm run lint 경고 없음
- 모든 기능 정상 동작
다음 단계: 배포 가이드 작성
```

#### 8.2 배포 가이드 및 문서화 프롬프트
```
작업 범위: Firebase 배포 가이드 및 운영 문서 작성

전제 조건:
- 프로덕션 빌드 성공
- 모든 오류 수정 완료

수행 작업:
1. 기존 README.md 확인 및 업데이트
2. 배포 관련 문서가 없으면 새로 작성
3. 배포 가이드 문서 작성:

Firebase 프로젝트 설정:
```markdown
## Firebase 프로젝트 설정

1. Firebase Console에서 새 프로젝트 생성
2. Authentication 활성화 (Google, Email/Password)
3. Firestore Database 생성
4. Storage 활성화 (향후 확장용)
5. Hosting 활성화
```

환경 변수 설정:
```markdown
## 환경 변수 설정

.env.local 파일 생성:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 상세 보안 규칙 제공
  }
}
```

5. 배포 명령어:
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init hosting

# 빌드 및 배포
npm run build
firebase deploy
```

6. 운영 체크리스트:
- 관리자 계정 생성
- 기본 시설 데이터 등록
- 보안 규칙 적용 확인
- 도메인 연결 (선택사항)

주의사항:
- 실제 배포 전 스테이징 환경 테스트
- 보안 키 노출 방지
- 백업 및 복구 계획 수립

최종 결과물:
- 완전히 작동하는 웹 애플리케이션
- 프로덕션 배포 가능한 상태
- 운영 가이드 문서 완비
```

---

## 🎯 프롬프트 실행 가이드

### 실행 순서
1. **순차적 실행**: 각 프롬프트를 순서대로 실행
2. **검증 필수**: 각 단계마다 검증 단계 반드시 수행
3. **오류 발생 시**: 해당 단계 재실행 전 문제 원인 분석
4. **코드 확인**: 기존 코드 존재 여부 항상 먼저 확인

### 주의사항
- **중복 방지**: 매 프롬프트마다 기존 코드 확인 필수
- **점진적 개발**: 한 번에 너무 많은 기능 구현 금지
- **테스트 우선**: 기능 구현 후 즉시 테스트
- **백업**: 중요 단계마다 코드 백업 권장

### 성공 기준
- ✅ TypeScript 컴파일 오류 없음
- ✅ ESLint 경고 최소화
- ✅ 모든 기능 정상 동작
- ✅ 반응형 디자인 적용
- ✅ Firebase 연동 완료
- ✅ 프로덕션 빌드 성공

이 프롬프트 디자인을 따라 실행하면, FlexSpace Pro 프로젝트를 처음부터 완성까지 체계적이고 오류 없이 개발할 수 있습니다.