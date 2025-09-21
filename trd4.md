# FlexSpace Pro - 체육관 대관 시스템 TRD v4.0

## 1. 기술 스택

### 1.1 프론트엔드
- **프레임워크**: React 19 (TypeScript)
- **상태 관리**: React Context API
- **스타일링**: Tailwind CSS + clsx + tailwind-merge
- **아이콘**: Lucide React
- **빌드 도구**: Vite
- **테스트**: Jest, React Testing Library

### 1.2 백엔드
- **인프라**: Firebase
  - Authentication: 사용자 인증
  - Firestore: 실시간 데이터베이스
  - Cloud Functions: 서버리스 함수
  - Hosting: 정적 웹 호스팅
  - Storage: 파일 저장소

### 1.3 개발 도구
- **버전 관리**: Git, GitHub
- **코드 품질**: ESLint, Prettier
- **지속적 통합/배포**: GitHub Actions
- **모니터링**: Firebase Performance Monitoring

---

## 2. 시스템 아키텍처

### 2.1 전체 아키텍처
```
[React SPA] → [Firebase Hosting]
    ↓
[Firebase SDK] → [Firebase Auth]
    ↓
[Firestore] ←→ [Cloud Functions]
    ↓
[이메일/SMS 서비스]  [푸시 알림]
```

### 2.2 컴포넌트 구조
```
src/
├── components/     # 재사용 가능한 UI 컴포넌트
├── hooks/         # 커스텀 React 훅
├── pages/         # 페이지 컴포넌트
├── services/      # API 서비스 레이어
├── store/         # 전역 상태 관리
├── types/         # TypeScript 타입 정의
└── utils/         # 유틸리티 함수
```

---

## 3. 데이터베이스 설계

### 3.1 Firestore 컬렉션

#### 3.1.1 사용자 (users)
```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  email: string;                  // 이메일
  displayName: string;            // 표시 이름
  photoURL?: string;              // 프로필 사진 URL
  role: 'user' | 'admin';         // 사용자 역할
  createdAt: Timestamp;           // 생성 일시
  updatedAt: Timestamp;           // 수정 일시
}
```

#### 3.1.2 시설 (facilities)
```typescript
interface Facility {
  id: string;                     // 시설 ID
  name: string;                   // 시설명
  description: string;            // 시설 설명
  capacity: number;               // 수용 인원
  location: string;               // 위치
  images: string[];               // 이미지 URL 배열
  isActive: boolean;              // 활성화 여부
  operatingHours: {
    [day: string]: {              // 요일 (0: 일요일 ~ 6: 토요일)
      open: string;               // 개장 시간 (HH:MM)
      close: string;              // 종료 시간 (HH:MM)
      isOpen: boolean;            // 영업 여부
    };
  };
}
```

#### 3.1.3 예약 (reservations)
```typescript
interface Reservation {
  id: string;                     // 예약 ID
  userId: string;                 // 예약자 UID
  facilityId: string;             // 시설 ID
  facilityName: string;           // 시설명 (denormalized)
  userName: string;               // 예약자명 (denormalized)
  userEmail: string;              // 예약자 이메일 (denormalized)
  startTime: Timestamp;           // 시작 시간
  endTime: Timestamp;             // 종료 시간
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  purpose: string;                // 사용 목적
  participants: number;           // 참여 인원
  createdAt: Timestamp;           // 생성 일시
  updatedAt: Timestamp;           // 수정 일시
}
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

### 8.4 부하 테스트 (k6)
- 동시 사용자 테스트
- API 성능 테스트
- 부하 상황에서의 안정성 테스트
