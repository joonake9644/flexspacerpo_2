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


## 👥 기여자

- 개발: Claude AI Assistant
- 기획: 사용자 요구사항 기반

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 📞 지원

문제가 발생하거나 개선 사항이 있으면 이슈를 등록해 주세요.
