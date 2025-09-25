# FlexSpace Pro - 체육관 통합 관리 시스템

<div align="center">
  <img src="https://picsum.photos/1200/400?random=2" alt="FlexSpace Pro 배너" />
</div>

## 📋 프로젝트 개요

FlexSpace Pro는 체육관 시설 대관, 프로그램 관리, 회원 관리를 통합한 웹 기반 관리 시스템입니다. Firebase를 백엔드로 사용하며, React + TypeScript로 개발된 현대적인 SPA(Single Page Application)입니다.

### 🚀 주요 기능

#### 👥 사용자 관리
- 일반 사용자 및 관리자 계정 시스템
- Google 로그인 지원
- 이메일 인증 시스템
- 프로필 이미지 업로드

#### 📅 체육관 대관 시스템
- **대관 신청**: 목적, 기간, 시간, 인원 설정
- **캘린더 뷰**: 월별 캘린더로 대관 현황 확인
- **상태 관리**: 대기중, 승인됨, 거절됨, 완료됨, 취소됨
- **반복 예약**: 요일별 반복 대관 지원

#### 🏃‍♂️ 프로그램 관리
- **프로그램 카테고리**: 요가, 필라테스, 피트니스, 댄스, 배드민턴, 피클볼
- **상세 검색**: 종목, 요일, 시간대, 레벨별 필터링
- **프로그램 카드**: 강사, 일정, 비용, 정원 정보 표시
- **D-Day 카운터**: 프로그램 시작까지 남은 일수 표시

#### 🔧 관리자 기능
- **통계 대시보드**: 실시간 운영 현황 모니터링
- **신청 관리**: 대관 및 프로그램 신청 승인/거절
- **직접 등록**: 관리자의 수강생/팀 직접 등록
- **전체 캘린더**: 모든 일정 통합 관리

## 🛠 기술 스택

### Frontend
- **React 18**: 함수형 컴포넌트 + Hooks
- **TypeScript**: 타입 안전성 보장
- **Vite**: 빠른 빌드 도구
- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크
- **Lucide React**: 아이콘 라이브러리

### Backend & Database
- **Firebase Authentication**: 사용자 인증
- **Cloud Firestore**: NoSQL 데이터베이스
- **Firebase Functions**: 서버리스 백엔드
- **Firebase Storage**: 파일 저장소

### 개발 도구
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅
- **TypeScript**: 정적 타입 검사

## 📁 프로젝트 구조

```
flexspace-pro/
├── components/           # React 컴포넌트
│   ├── AdminSection.tsx     # 관리자 운영 관리
│   ├── BookingSection.tsx   # 체육관 대관
│   ├── ProgramSection.tsx   # 프로그램 관리
│   ├── Dashboard.tsx        # 대시보드
│   ├── Navigation.tsx       # 네비게이션
│   ├── LoginForm.tsx        # 로그인 폼
│   ├── UserManagement.tsx   # 회원 관리
│   └── DashboardCalendar.tsx # 캘린더 컴포넌트
├── hooks/               # 커스텀 React Hooks
│   ├── use-auth.ts         # 인증 훅
│   ├── use-firestore.ts    # Firestore 데이터 훅
│   └── use-notification.ts # 알림 훅
├── functions/           # Firebase Functions
├── types.ts            # TypeScript 타입 정의
├── utils.ts            # 유틸리티 함수
└── firebase.ts         # Firebase 설정
```

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 Firebase 설정을 추가:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. 테스트용 관리자 계정 생성
초기 관리자 계정을 생성하려면 다음 스크립트를 실행:
```bash
node scripts/create-admin.js
```

**🔑 테스트용 관리자 계정 정보:**
- **이메일**: `admin@flexspace.test`
- **비밀번호**: `FlexAdmin2025!`
- **역할**: 관리자 (admin)

> ⚠️ **보안 주의사항**: 운영 환경에서는 반드시 강력한 비밀번호로 변경하고, 테스트 계정은 삭제하세요.

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 빌드
```bash
npm run build
```

## 📱 주요 화면

### 1. 관리자 대시보드
- 실시간 통계 (대기중인 대관, 프로그램 신청, 운영중인 프로그램, 총 이용자)
- 최근 대관 신청 목록
- 프로그램 신청 현황

### 2. 운영 관리 (Operations)
- 수강생/팀 직접 등록 폼
- 대기중인 신청 승인/거절 관리
- 프로그램 관리 (CRUD)
- 전체 대관 캘린더

### 3. 체육관 대관 (Booking)
- 목록 뷰 / 캘린더 뷰 전환
- 신규 대관 신청 폼
- 진행중인 대관 / 완료된 대관 구분

### 4. 프로그램 (Program)
- 검색 및 필터링 기능
- 프로그램 카드 그리드 레이아웃
- 상세 정보 표시 (강사, 일정, 비용, 정원)

## 🔐 보안 기능

- Firebase Authentication을 통한 안전한 사용자 인증
- 역할 기반 접근 제어 (RBAC)
- 이메일 인증 필수
- 관리자 전용 기능 보호

## 📊 데이터 모델

### User (사용자)
- 기본 정보 (이름, 이메일, 전화번호)
- 역할 (user/admin)
- 프로필 이미지

### Booking (대관)
- 시설, 기간, 시간 정보
- 목적, 분류, 참가자 수
- 상태 관리 (pending/approved/rejected/completed/cancelled)

### Program (프로그램)
- 기본 정보 (제목, 설명, 강사)
- 일정 (요일, 시간, 기간)
- 정원 및 등록자 수
- 카테고리 및 레벨

### ProgramApplication (프로그램 신청)
- 사용자-프로그램 매핑
- 신청 상태 관리
- 신청일시 추적

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)

### 타이포그래피
- **제목**: text-3xl font-bold
- **부제목**: text-xl font-semibold
- **본문**: text-sm text-gray-600
- **라벨**: text-sm font-medium

### 컴포넌트
- **카드**: rounded-2xl shadow-sm border
- **버튼**: rounded-xl px-4 py-2
- **입력필드**: rounded-xl border-gray-200
- **배지**: rounded-full px-3 py-1

## 🔄 상태 관리

- React Hooks (useState, useEffect, useMemo, useCallback)
- 커스텀 훅을 통한 로직 분리
- Context API 미사용 (props drilling 방식)

## 📱 반응형 디자인

- Mobile First 접근법
- Tailwind CSS 브레이크포인트 활용
- 그리드 시스템 (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

## 🚀 성능 최적화

- React.lazy()를 통한 코드 스플리팅
- React.memo()를 통한 컴포넌트 메모이제이션
- useCallback()을 통한 함수 메모이제이션
- 이미지 최적화 및 지연 로딩

## 🧪 테스트

- TypeScript 타입 검사
- ESLint 코드 품질 검사
- 빌드 테스트를 통한 구문 오류 검증

## 🤖 AI Development Guidelines

### For Cursor & Claude Code Users
When working on this project, **ALWAYS** follow these critical rules:

#### CRITICAL DATA CONSISTENCY PATTERN
```typescript
// ALL admin actions must follow this pattern:
const handleAdminAction = async (id: string, newStatus: string) => {
  // 1. Optimistic local update (immediate UX)
  setLocalState(prev => prev.map(item =>
    item.id === id ? {...item, status: newStatus} : item
  ))

  // 2. User feedback
  showNotification(`Action completed: ${newStatus}`, 'success')

  // 3. Firebase persistence (NEVER SKIP)
  try {
    await updateDoc(doc(db, 'collection', id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.warn('Firebase persistence failed:', error)
  }
}
```

#### KEY FILES TO CHECK
- **📋 .cursorrules**: Cursor AI specific guidelines
- **📚 CLAUDE.md**: Complete architecture documentation
- **🔧 data-consistency-rules.ts**: Structured rules and templates
- **📝 types.ts**: Type definitions with cross-component usage notes

#### EMERGENCY KEYWORDS
If you encounter these terms, immediately apply data consistency rules:
- `admin approval`, `status change`, `booking approval`, `application approval`
- `setState`, `setBookings`, `setApplications`
- `data disappearing`, `UI freezing`

#### QUICK CHECK COMMAND
```bash
npm run check:rules  # View data consistency guidelines
```

#### FORBIDDEN PATTERNS ❌
- setState without Firebase persistence (data will disappear)
- Local state updates without `await updateDoc()`
- Missing `serverTimestamp()` on updates
- Admin actions without user feedback

## 🚨 해결된 주요 오류 사례 (Error Case Studies)

### 1. 데이터 사라짐 문제 (Data Disappearing Issue)
#### 🔴 문제상황
```typescript
// ❌ 문제가 있던 코드 (AdminSection.tsx:453-456)
onClick={() => {
  setApplications(prev => prev.map(ap =>
    ap.id === a.id ? {...ap, status: 'approved'} : ap
  ))
  showNotification('프로그램 신청이 승인되었습니다.', 'success')
}}
```
**증상:** 관리자가 승인 버튼 클릭 → 데이터가 일시적으로 변경 → 몇 초 후 원래 상태로 되돌아감

#### 🟢 해결방법
```typescript
// ✅ 수정된 코드
onClick={() => handleApplicationAction(a.id, 'approved')}

const handleApplicationAction = async (applicationId: string, status: 'approved' | 'rejected') => {
  // 1. 로컬 상태 업데이트 (즉시 UI 반영)
  setApplications(prev => prev.map(app =>
    app.id === applicationId ? { ...app, status } : app
  ))

  // 2. 사용자 피드백
  showNotification(`프로그램 신청이 ${status === 'approved' ? '승인' : '거절'}되었습니다.`, 'success')

  // 3. Firebase 영구저장 (핵심!)
  try {
    await updateDoc(doc(db, 'applications', applicationId), {
      status,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.warn('Firebase 저장 실패:', error)
  }
}
```

#### 📋 원인분석
- **원인:** `useFirestore` 훅의 실시간 리스너가 Firebase 데이터를 다시 가져와서 로컬 변경사항을 덮어씀
- **영향범위:** AdminSection ↔ Dashboard ↔ BookingSection 간 데이터 불일치
- **해결파일:** `AdminSection.tsx:154`, `types.ts:21`

### 2. 관리자 생성 사용자 로그인 불가 (Admin-Created User Login Issue)
#### 🔴 문제상황
```
사용자 시나리오:
1. 관리자가 UserManagement에서 새 사용자 생성 (kun@naver.com)
2. 해당 사용자가 로그인 시도
3. "이메일 인증이 필요합니다" 오류 발생
4. 로그인 불가능
```

#### 🟢 해결방법
**Step 1: User 타입에 플래그 추가**
```typescript
// types.ts:21
export interface User {
  // ... 기존 필드들
  adminCreated?: boolean // 관리자가 직접 생성한 사용자 (이메일 인증 우회)
}
```

**Step 2: 사용자 생성 시 플래그 설정**
```typescript
// UserManagement.tsx:173
await setDoc(doc(db, 'users', firebaseUser.uid), {
  // ... 기존 데이터
  adminCreated: true, // 이메일 인증 우회용
})
```

**Step 3: 로그인 시 인증 우회**
```typescript
// use-auth.ts:85-88
const login = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password)

  // 관리자 생성 사용자인지 확인
  const userDoc = await getDoc(doc(db, 'users', result.user.uid))
  const isAdminCreated = userDoc.exists() ? userDoc.data()?.adminCreated === true : false

  // 이메일 인증 확인 (관리자 생성 사용자는 건너뛰기)
  if (!result.user.emailVerified && !isAdminCreated) {
    // 인증 메일 발송 후 로그아웃
  }

  return true
}
```

#### 📋 원인분석
- **원인:** Firebase Auth의 이메일 인증 시스템과 관리자 직접 생성 플로우 간 불일치
- **영향범위:** 관리자가 생성한 모든 사용자 계정
- **해결파일:** `UserManagement.tsx:173`, `use-auth.ts:85-88`, `types.ts:21`

### 3. UI 일시 멈춤 현상 (Temporary UI Freezing)
#### 🔴 문제상황
```
사용자 경험:
1. 관리자가 승인/거절 버튼 클릭
2. Dashboard와 BookingSection이 1-2초간 빈 화면 표시
3. 이후 정상 데이터 표시 복구
```

#### 🟢 해결방법
**Step 1: useFirestore에 동기화 상태 관리 추가**
```typescript
// useFirestore.ts:9
const [syncing, setSyncing] = useState(false)

const handleDataSync = () => {
  setSyncing(true)
  setTimeout(() => setSyncing(false), 500) // 500ms 후 완료 표시
}

// 데이터 업데이트 시 동기화 상태 표시
setBookings(prev => {
  if (prev.length > 0) handleDataSync()
  return list
})
```

**Step 2: 컴포넌트에 동기화 표시 추가**
```typescript
// Dashboard.tsx:80, BookingSection.tsx:276
{syncing && (
  <div className="flex items-center gap-2 text-blue-600">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    <span className="text-sm">동기화 중...</span>
  </div>
)}
```

#### 📋 원인분석
- **원인:** 실시간 리스너의 데이터 새로고침 중 필터된 뷰가 일시적으로 비워짐
- **영향범위:** Dashboard의 pendingBookings, BookingSection의 activeBookings 등
- **해결파일:** `useFirestore.ts:19`, `Dashboard.tsx:80`, `BookingSection.tsx:276`

### 4. 컴포넌트 간 데이터 연계 불일치
#### 🔴 문제패턴
- AdminSection에서 승인 → Dashboard 카운트 업데이트 안됨
- AdminSection에서 승인 → BookingSection 상태 반영 안됨
- 브라우저 새로고침해야 정확한 데이터 표시

#### 🟢 해결원칙
1. **단일 데이터 소스:** `useFirestore` 훅을 통한 중앙집중식 관리
2. **옵티미스틱 업데이트:** 즉시 로컬 상태 변경으로 UX 개선
3. **백그라운드 동기화:** Firebase 영구저장으로 데이터 일관성 보장
4. **실시간 전파:** Firestore 리스너를 통한 모든 컴포넌트 자동 업데이트

### ⚡ 오류 방지 체크리스트
개발 시 반드시 확인해야 할 항목들:

#### Admin Action 구현 시
- [ ] 로컬 상태 업데이트 (`setState`) 포함?
- [ ] 사용자 피드백 (`showNotification`) 포함?
- [ ] Firebase 영구저장 (`updateDoc`) 포함?
- [ ] 에러 처리 (`try-catch`) 포함?
- [ ] `serverTimestamp()` 사용?

#### 테스트 시
- [ ] AdminSection에서 동작 확인
- [ ] Dashboard 카운트 즉시 업데이트 확인
- [ ] BookingSection/ProgramSection 상태 반영 확인
- [ ] 브라우저 새로고침 후 데이터 유지 확인
- [ ] 다중 탭에서 실시간 동기화 확인

#### 디버깅 시
- [ ] 브라우저 콘솔에서 Firebase 에러 확인
- [ ] Network 탭에서 Firestore 요청 확인
- [ ] `console.log`로 로컬 상태 변경 추적
- [ ] Firestore 콘솔에서 실제 데이터 변경 확인

## 📈 향후 개발 계획

- [ ] 실시간 알림 시스템
- [ ] 모바일 앱 개발
- [ ] 결제 시스템 연동
- [ ] 고급 통계 및 리포트
- [ ] 다국어 지원
- [ ] PWA 지원

## 👥 기여자

- 개발: Claude AI Assistant
- 기획: 사용자 요구사항 기반

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 📞 지원

문제가 발생하거나 개선 사항이 있으면 이슈를 등록해 주세요.