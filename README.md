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