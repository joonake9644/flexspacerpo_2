# TRD4 - FlexSpace Pro 기술 요구사항 문서

## 📋 문서 정보

- **프로젝트명**: FlexSpace Pro
- **문서 유형**: 기술 요구사항 문서 (Technical Requirements Document)
- **버전**: v4.0
- **작성일**: 2025년 1월
- **작성자**: Claude AI Assistant

## 🛠 기술 스택

### Frontend
- **React**: 18.2.0+ (함수형 컴포넌트, Hooks)
- **TypeScript**: 5.0+ (타입 안전성)
- **Vite**: 5.0+ (빌드 도구, 개발 서버)
- **Tailwind CSS**: 3.3+ (유틸리티 CSS 프레임워크)
- **Lucide React**: 0.400+ (아이콘 라이브러리)

### Backend/Cloud
- **Firebase Authentication**: 사용자 인증 및 권한 관리
- **Cloud Firestore**: NoSQL 실시간 데이터베이스
- **Firebase Functions**: 서버리스 백엔드 (Node.js 20)
- **Firebase Storage**: 파일 및 이미지 저장소
- **Firebase Hosting**: 정적 웹 호스팅

### 개발 도구
- **Node.js**: 20.0+
- **npm**: 패키지 관리자
- **ESLint**: 코드 품질 검사 도구
- **TypeScript Compiler**: 정적 타입 검사

## 🏗️ 시스템 아키텍처

### 전체 아키텍처 개요
```
사용자 (브라우저)
    ↓ HTTPS
React SPA (Vite)
    ↓ Firebase SDK
Firebase Authentication
    ↓
Firebase Functions (Node.js)
    ↓
Cloud Firestore (NoSQL)
    ↓
Firebase Storage (파일 저장)
```

### 프로젝트 구조
```
flexspace-pro/
├── components/           # React 컴포넌트
│   ├── AdminSection.tsx     # 관리자 운영 관리
│   ├── BookingSection.tsx   # 체육관 대관
│   ├── ProgramSection.tsx   # 프로그램 관리
│   ├── Dashboard.tsx        # 대시보드
│   ├── Navigation.tsx       # 네비게이션
│   └── DashboardCalendar.tsx # 캘린더
├── hooks/               # 커스텀 React Hooks
│   ├── use-auth.ts         # 인증 관리
│   ├── use-firestore.ts    # Firestore 데이터 관리
│   └── use-notification.ts # 알림 관리
├── functions/           # Firebase Functions
├── types.ts            # TypeScript 타입 정의
├── utils.ts            # 유틸리티 함수
└── firebase.ts         # Firebase 설정
```

---

## 3. 데이터베이스 설계

### 3.1 Firestore 컬렉션

#### 3.1.1 사용자 (users)
```typescript
interface User {
  id: string;                     // 사용자 ID
  name: string;                   // 사용자명
  email: string;                  // 이메일
  phone?: string | null;          // 전화번호
  role: 'user' | 'admin';         // 사용자 역할
  isActive?: boolean;             // 활성화 여부
  photoURL?: string;              // 프로필 사진 URL
}
```

#### 3.1.2 시설 (facilities)
```typescript
interface Facility {
  id: string;                     // 시설 ID
  name: string;                   // 시설명
  bufferMinutes?: number;         // 예약 간 버퍼 시간(분)
}
```

#### 3.1.3 예약/대관 (bookings)
```typescript
interface Booking {
  id: string;                     // 예약 ID
  userId?: string;                // 예약자 ID
  userName?: string;              // 예약자명 (비정규화)
  userEmail?: string;             // 예약자 이메일 (비정규화)
  facilityId: string;             // 시설 ID
  startDate: string;              // 시작 날짜 (YYYY-MM-DD)
  endDate: string;                // 종료 날짜 (YYYY-MM-DD)
  startTime: string;              // 시작 시간 (HH:MM)
  endTime: string;                // 종료 시간 (HH:MM)
  purpose: string;                // 사용 목적
  organization?: string;          // 소속 단체
  category: 'class' | 'event' | 'club' | 'personal'; // 대관 분류
  numberOfParticipants?: number;  // 참여 인원
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'; // 상태
  rejectionReason?: string;       // 거절 사유
  adminNotes?: string;            // 관리자 메모
  recurrenceRule?: {              // 반복 규칙
    days: number[];               // 반복 요일 (0: 일요일 ~ 6: 토요일)
  };
  createdAt?: any;                // 생성 일시
  updatedAt?: any;                // 수정 일시
}
```

#### 3.1.4 프로그램 (programs)
```typescript
interface Program {
  id: string;                     // 프로그램 ID
  title: string;                  // 프로그램명
  description: string;            // 설명
  instructor?: string;            // 강사명
  capacity: number;               // 정원
  enrolled?: number;              // 현재 등록자 수
  scheduleDays: number[];         // 수업 요일 (0: 일요일 ~ 6: 토요일)
  startTime: string;              // 시작 시간 (HH:MM)
  endTime: string;                // 종료 시간 (HH:MM)
  startDate: string;              // 프로그램 시작 날짜 (YYYY-MM-DD)
  endDate: string;                // 프로그램 종료 날짜 (YYYY-MM-DD)
  level: 'beginner' | 'intermediate' | 'advanced'; // 난이도
  category: 'yoga' | 'pilates' | 'fitness' | 'dance' | 'badminton' | 'pickleball'; // 카테고리
  fee?: number;                   // 수강료
}
```

#### 3.1.5 프로그램 신청 (applications)
```typescript
interface ProgramApplication {
  id: string;                     // 신청 ID
  programId: string;              // 프로그램 ID
  userId: string;                 // 신청자 ID
  status: 'pending' | 'approved' | 'rejected'; // 신청 상태
  appliedAt?: any;                // 신청 일시
  programTitle?: string;          // 프로그램명 (비정규화)
  userName?: string;              // 신청자명 (비정규화)
  userEmail?: string;             // 신청자 이메일 (비정규화)
  rejectionReason?: string;       // 거절 사유
  updatedAt?: any;                // 수정 일시
}
```

#### 3.1.6 컬렉션 상수
```typescript
export const COLLECTIONS = {
  USERS: 'users',
  BOOKINGS: 'bookings',
  PROGRAMS: 'programs',
  APPLICATIONS: 'applications',
  FACILITIES: 'facilities',
  NOTIFICATIONS: 'notifications',
  SYSTEM_CONFIG: 'system_config',
} as const
```

---

## 4. API 명세

### 4.1 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보 조회

### 4.2 시설 API
- `GET /api/facilities` - 시설 목록 조회
- `GET /api/facilities/:id` - 시설 상세 조회
- `POST /api/facilities` - 시설 생성 (관리자용)
- `PUT /api/facilities/:id` - 시설 수정 (관리자용)
- `DELETE /api/facilities/:id` - 시설 삭제 (관리자용)

### 4.3 예약 API
- `GET /api/reservations` - 예약 목록 조회
- `GET /api/reservations/:id` - 예약 상세 조회
- `POST /api/reservations` - 예약 생성
- `PUT /api/reservations/:id` - 예약 수정
- `DELETE /api/reservations/:id` - 예약 취소
- `GET /api/reservations/availability` - 예약 가능 여부 확인

### 4.4 관리자 API
- `GET /api/admin/reservations` - 전체 예약 조회 (관리자용)
- `PUT /api/admin/reservations/:id/status` - 예약 상태 변경 (관리자용)
- `GET /api/admin/users` - 사용자 목록 조회 (관리자용)
- `PUT /api/admin/users/:id/role` - 사용자 역할 변경 (관리자용)

---

## 5. 보안 정책

### 5.1 인증 및 권한
- 모든 API 요청은 JWT 토큰으로 인증
- 역할 기반 접근 제어 (RBAC) 구현
- 민감한 작업은 추가 인증 필요

### 5.2 데이터 보호
- 개인정보는 암호화하여 저장
- 민감한 정보는 마스킹 처리
- 정기적인 보안 감사 및 취약점 점검

### 5.3 API 보안
- CORS 정책 적용
- 요청 속도 제한 (Rate Limiting)
- SQL 인젝션 방지
- XSS 방어 조치

---

## 6. 성능 최적화

### 6.1 프론트엔드
- 코드 스플리팅 적용
- 이미지 최적화 (Lazy Loading)
- 메모이제이션 활용
- 불필요한 리렌더링 방지

### 6.2 백엔드
- 데이터 캐싱 (Redis)
- 쿼리 최적화
- 배치 처리 구현
- 데이터베이스 인덱싱

### 6.3 모니터링
- 에러 로깅 (Sentry)
- 성능 모니터링 (Firebase Performance)
- 사용자 행동 분석 (Google Analytics)

---

## 7. 배포 전략

### 7.1 환경 구성
- 개발 (Development)
- 스테이징 (Staging)
- 프로덕션 (Production)

### 7.2 CI/CD 파이프라인
1. 코드 커밋 → GitHub
2. 자동 테스트 실행 (Jest)
3. 코드 품질 검사 (ESLint, Prettier)
4. 빌드 및 배포 (GitHub Actions)
5. 자동화된 테스트 (Cypress)
6. 수동 승인 (프로덕션 배포 시)
7. 배포 완료 및 모니터링

### 7.3 롤백 전략
- 블루-그린 배포 방식 채택
- 이전 버전으로의 빠른 롤백 가능
- 데이터베이스 마이그레이션 롤백 스크립트 준비

---

## 8. 테스트 전략

### 8.1 단위 테스트 (Jest)
- 컴포넌트 테스트
- 유틸리티 함수 테스트
- Redux 리듀서 테스트

### 8.2 통합 테스트 (React Testing Library)
- 컴포넌트 통합 테스트
- API 연동 테스트
- 상태 관리 테스트

### 8.3 E2E 테스트 (Cypress)
- 사용자 시나리오 테스트
- 크로스 브라우저 테스트
- 성능 테스트

### 8.4 성능 테스트
- **로딩 성능**
  - Firebase Performance Monitoring
  - Core Web Vitals 측정
  - Lighthouse 점수 모니터링

- **데이터베이스 성능**
  - Firestore 쿼리 성능 모니터링
  - 동시 사용자 처리 능력 테스트
  - 대용량 데이터 처리 테스트

### 8.5 테스트 자동화 도구
```bash
# 현재 사용 중인 커맨드
npm run dev          # 개발 서버 실행
npm run build        # 생산 빌드
npm run lint         # ESLint 코드 검사
npm run preview      # 빌드 결과 미리보기
```

---

## 9. 향후 개발 계획

### 9.1 단기 계획 (1-3개월)
- 실시간 알림 시스템 구현
- 고급 통계 대시보드 개발
- 모바일 반응형 개선
- 성능 최적화 및 모니터링 강화

### 9.2 중기 계획 (3-6개월)
- PWA (Progressive Web App) 지원
- 오프라인 기능 구현
- 다국어 지원 (i18n)
- 결제 시스템 연동

### 9.3 장기 계획 (6개월 이상)
- 네이티브 모바일 앱 개발
- AI 기반 추천 시스템
- 고급 분석 및 리포트
- 외부 시스템 연동 API

---

## 10. 개발 가이드라인

### 10.1 코딩 컨벤션
- **TypeScript 사용 필수**
- **함수형 컴포넌트와 Hooks 사용**
- **Tailwind CSS 유틸리티 클래스 활용**
- **ESLint 규칙 준수**

### 10.2 파일 구조
```
src/
├── components/     # 재사용 가능한 UI 컴포넌트
├── hooks/         # 커스텀 React Hooks
├── types.ts       # TypeScript 타입 정의
├── utils.ts       # 유틸리티 함수
├── firebase.ts    # Firebase 설정
└── App.tsx        # 메인 애플리케이션
```

### 10.3 Git 워크플로우
- **기능별 브랜치 생성**
- **Pull Request 기반 코드 리뷰**
- **커밋 메시지 컨벤션 준수**
- **자동 배포 파이프라인 활용**
