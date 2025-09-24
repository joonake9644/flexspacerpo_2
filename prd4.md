# PRD4 - FlexSpace Pro 제품 요구사항 문서

## 📋 프로젝트 정보

- **프로젝트명**: FlexSpace Pro
- **버전**: v4.0
- **문서 작성일**: 2025년 1월
- **담당자**: Claude AI Assistant
- **프로젝트 유형**: 체육관 통합 관리 시스템

## 🎯 제품 비전

FlexSpace Pro는 체육관 운영자와 이용자 모두에게 편리한 디지털 체험을 제공하는 통합 관리 플랫폼입니다. 시설 대관부터 프로그램 관리까지 모든 체육관 운영 업무를 하나의 시스템에서 효율적으로 처리할 수 있습니다.

## 🎯 제품 목표

### 주요 목표
1. **운영 효율성 극대화**: 수작업 업무를 디지털화하여 운영 효율성 50% 향상
2. **사용자 만족도 향상**: 직관적인 UI/UX로 사용자 만족도 90% 이상 달성
3. **실시간 운영 모니터링**: 실시간 대시보드를 통한 즉각적인 의사결정 지원
4. **확장 가능한 아키텍처**: 다중 시설 및 프랜차이즈 확장 가능한 구조

### 성공 지표 (KPI)
- 월간 활성 사용자 수 (MAU): 1,000명 이상
- 대관 신청 처리 시간: 기존 24시간 → 1시간 이내
- 프로그램 등록률: 기존 대비 30% 증가
- 시스템 가용성: 99.9% 이상

## 👥 타겟 사용자

### Primary Users (주요 사용자)
1. **체육관 관리자**
   - 일일 운영 관리 담당
   - 대관 및 프로그램 승인 권한
   - 통계 및 리포트 확인

2. **체육관 이용자**
   - 시설 대관 신청
   - 프로그램 등록 및 참여
   - 개인 일정 관리

### Secondary Users (보조 사용자)
1. **체육관 직원**
   - 일부 운영 업무 지원
   - 사용자 문의 대응

2. **프로그램 강사**
   - 수업 일정 확인
   - 수강생 관리

## 🔍 현재 상황 분석

### 문제점 (Pain Points)
1. **수작업 관리의 비효율성**
   - 종이 기반 대관 신청서
   - 전화/방문을 통한 예약만 가능
   - 중복 예약 및 스케줄 충돌 빈발

2. **정보 접근성 부족**
   - 실시간 시설 이용 현황 파악 어려움
   - 프로그램 정보 전달 한계
   - 통계 데이터 수집의 어려움

3. **사용자 불편사항**
   - 24시간 예약 불가
   - 프로그램 정보 접근 제한
   - 예약 현황 실시간 확인 불가

### 기회 요소 (Opportunities)
1. **디지털 전환 트렌드**: 코로나19 이후 비대면 서비스 선호도 증가
2. **모바일 우선 문화**: 스마트폰을 통한 서비스 이용 증가
3. **데이터 기반 운영**: 실시간 데이터를 활용한 효율적 운영 가능

## 🎨 핵심 기능 (Core Features)

### 1. 사용자 인증 및 관리
#### 기능 설명
- Firebase Authentication 기반 안전한 로그인
- 역할 기반 접근 제어 (RBAC)
- 소셜 로그인 지원 (Google)

#### 상세 요구사항
- **필수 기능**
  - 이메일/비밀번호 로그인
  - Google 소셜 로그인
  - 이메일 인증 필수
  - 비밀번호 재설정
  - 프로필 관리 (이름, 전화번호, 프로필 이미지)

- **사용자 역할**
  - `user`: 일반 사용자 (대관 신청, 프로그램 참여)
  - `admin`: 관리자 (전체 시스템 관리)

#### 검증 기준
- [ ] 이메일 인증 없이는 시스템 이용 불가
- [ ] 관리자 전용 기능은 admin 역할에서만 접근 가능
- [ ] 프로필 이미지 업로드 및 미리보기 기능

### 2. 체육관 대관 시스템
#### 기능 설명
- 체육관 시설 예약 및 승인 관리
- 캘린더 기반 시각적 일정 관리
- 반복 예약 지원

#### 상세 요구사항
- **대관 신청 기능**
  - 목적, 기간, 시간, 참가자 수 입력
  - 분류별 예약 (수업, 행사, 개인, 동아리)
  - 요일별 반복 예약 설정
  - 첨부파일 업로드 (선택사항)

- **상태 관리**
  - `pending`: 승인 대기
  - `approved`: 승인됨
  - `rejected`: 거절됨
  - `completed`: 완료됨
  - `cancelled`: 취소됨

- **캘린더 뷰**
  - 월별 캘린더 표시
  - 상태별 색상 구분
  - 일정 클릭 시 상세 정보 표시
  - 목록 뷰 / 캘린더 뷰 전환

#### 검증 기준
- [ ] 시간 충돌 시 자동 감지 및 경고
- [ ] 캘린더에서 직관적인 예약 현황 확인
- [ ] 상태 변경 시 실시간 알림

### 3. 프로그램 관리 시스템
#### 기능 설명
- 다양한 체육 프로그램 등록 및 관리
- 사용자 친화적인 검색 및 필터링
- 프로그램별 상세 정보 제공

#### 상세 요구사항
- **프로그램 정보**
  - 기본 정보: 제목, 설명, 강사명
  - 일정 정보: 시작일, 종료일, 요일, 시간
  - 참여 정보: 정원, 현재 등록자 수, 대기자 수
  - 비용 정보: 수강료 (무료/유료)
  - 레벨: 초급, 중급, 고급
  - 카테고리: 요가, 필라테스, 피트니스, 댄스, 배드민턴, 피클볼

- **검색 및 필터링**
  - 텍스트 검색 (프로그램명, 강사명)
  - 카테고리별 필터
  - 요일별 필터
  - 시간대별 필터 (오전/오후/저녁)
  - 레벨별 필터
  - 가격대별 필터

- **프로그램 카드 UI**
  - 프로그램 이미지 (옵션)
  - D-Day 카운터 (시작일까지 남은 일수)
  - 상태 배지 (모집중/진행중/종료)
  - 신청하기 버튼

#### 검증 기준
- [ ] 정원 초과 시 대기자 등록 기능
- [ ] 프로그램 시작 전까지 D-Day 카운터 표시
- [ ] 다중 조건 필터링 동시 적용 가능

### 4. 관리자 대시보드
#### 기능 설명
- 실시간 운영 현황 모니터링
- 주요 지표 시각화
- 빠른 의사결정 지원

#### 상세 요구사항
- **통계 카드**
  - 대기중인 대관 신청 수
  - 대기중인 프로그램 신청 수
  - 운영중인 프로그램 수
  - 총 등록 사용자 수

- **최근 활동**
  - 최근 대관 신청 목록 (최근 5건)
  - 최근 프로그램 신청 목록 (최근 5건)
  - 각 항목별 상태 표시

- **전체 캘린더**
  - 모든 대관 및 프로그램 일정 통합 표시
  - 월/주/일 뷰 전환
  - 필터링 (대관만/프로그램만/전체)

#### 검증 기준
- [ ] 실시간 데이터 업데이트
- [ ] 카드 클릭 시 해당 섹션으로 바로 이동
- [ ] 캘린더에서 모든 일정 통합 확인 가능

### 5. 운영 관리 (Operations)
#### 기능 설명
- 관리자 전용 운영 도구
- 신청 승인/거절 관리
- 직접 등록 기능

#### 상세 요구사항
- **신청 관리**
  - 대관 신청 승인/거절
  - 프로그램 신청 승인/거절
  - 거절 사유 입력
  - 일괄 처리 기능

- **직접 등록**
  - 관리자가 직접 수강생/팀 등록
  - 오프라인 신청자 대신 등록
  - 특별 할인/무료 등록 처리

- **프로그램 관리**
  - 프로그램 생성/수정/삭제
  - 프로그램 복사 기능
  - 일괄 수정 기능

#### 검증 기준
- [ ] 승인/거절 시 사용자에게 자동 알림
- [ ] 직접 등록 시 중복 확인
- [ ] 프로그램 템플릿 저장 및 재사용

## 🎨 사용자 인터페이스 요구사항

### 디자인 원칙
1. **직관성**: 별도 학습 없이 사용 가능한 인터페이스
2. **일관성**: 전체 시스템에서 통일된 디자인 언어
3. **반응형**: 모든 디바이스에서 최적화된 경험
4. **접근성**: 웹 접근성 가이드라인 준수

### 색상 시스템
- **Primary**: Blue (#3B82F6) - 신뢰성, 안정성
- **Secondary**: Purple (#8B5CF6) - 창의성, 혁신
- **Success**: Green (#10B981) - 성공, 승인
- **Warning**: Orange (#F59E0B) - 주의, 대기
- **Error**: Red (#EF4444) - 오류, 거절

### 타이포그래피
- **제목**: Inter font, Bold, 24px-32px
- **부제목**: Inter font, Semibold, 18px-24px
- **본문**: Inter font, Regular, 14px-16px
- **캡션**: Inter font, Regular, 12px-14px

### 컴포넌트 규격
- **카드**: 둥근 모서리 16px, 그림자 subtle
- **버튼**: 높이 44px (터치 가능), 둥근 모서리 12px
- **입력 필드**: 높이 48px, 둥근 모서리 12px
- **모달**: 최대 너비 600px, 배경 반투명

## 🔧 기술적 요구사항

### Frontend 기술 스택
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks + Custom Hooks

### Backend 기술 스택
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Functions**: Firebase Functions (Node.js)
- **Storage**: Firebase Storage
- **Hosting**: Firebase Hosting

### 성능 요구사항
- **초기 로딩 시간**: 3초 이내
- **페이지 전환**: 1초 이내
- **API 응답 시간**: 500ms 이내
- **이미지 로딩**: Progressive loading 적용

### 호환성 요구사항
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **모바일**: iOS 13+, Android 8+
- **해상도**: 320px ~ 2560px 대응

## 🔐 보안 요구사항

### 인증 및 권한
- Firebase Authentication 활용
- JWT 토큰 기반 세션 관리
- 역할 기반 접근 제어 (RBAC)
- 이메일 인증 필수

### 데이터 보안
- HTTPS 강제 사용
- 민감 정보 암호화 저장
- Firestore 보안 규칙 적용
- 입력값 검증 및 새니타이징

### 개인정보 보호
- GDPR 준수
- 개인정보 수집 최소화
- 데이터 보관 기간 설정
- 사용자 데이터 삭제 권리 보장

## 📊 데이터 모델

### Users Collection
```typescript
interface User {
  id: string                    // 사용자 고유 ID
  name: string                  // 사용자 이름
  email: string                 // 이메일 주소
  phone?: string                // 전화번호
  role: 'user' | 'admin'        // 사용자 역할
  isActive: boolean             // 계정 활성화 상태
  photoURL?: string             // 프로필 이미지 URL
  createdAt: Timestamp          // 계정 생성일
  updatedAt: Timestamp          // 최종 수정일
}
```

### Bookings Collection
```typescript
interface Booking {
  id: string                    // 대관 고유 ID
  userId: string                // 신청자 ID
  userName: string              // 신청자 이름
  userEmail: string             // 신청자 이메일
  facilityId: string            // 시설 ID
  startDate: string             // 시작일 (YYYY-MM-DD)
  endDate: string               // 종료일 (YYYY-MM-DD)
  startTime: string             // 시작 시간 (HH:MM)
  endTime: string               // 종료 시간 (HH:MM)
  purpose: string               // 대관 목적
  organization?: string         // 소속 기관
  category: BookingCategory     // 대관 분류
  numberOfParticipants: number  // 참가자 수
  status: BookingStatus         // 대관 상태
  rejectionReason?: string      // 거절 사유
  adminNotes?: string           // 관리자 메모
  recurrenceRule?: {            // 반복 규칙
    days: number[]              // 반복 요일 (0=일요일)
  }
  createdAt: Timestamp          // 신청일
  updatedAt: Timestamp          // 수정일
}
```

### Programs Collection
```typescript
interface Program {
  id: string                    // 프로그램 고유 ID
  title: string                 // 프로그램 제목
  description: string           // 프로그램 설명
  instructor: string            // 강사명
  capacity: number              // 정원
  enrolled: number              // 현재 등록자 수
  scheduleDays: number[]        // 수업 요일 (0=일요일)
  startTime: string             // 수업 시작 시간
  endTime: string               // 수업 종료 시간
  startDate: string             // 프로그램 시작일
  endDate: string               // 프로그램 종료일
  level: ProgramLevel           // 난이도
  category: ProgramCategory     // 카테고리
  fee: number                   // 수강료 (0=무료)
  imageURL?: string             // 프로그램 이미지
  createdAt: Timestamp          // 생성일
  updatedAt: Timestamp          // 수정일
}
```

### Program Applications Collection
```typescript
interface ProgramApplication {
  id: string                    // 신청 고유 ID
  programId: string             // 프로그램 ID
  userId: string                // 신청자 ID
  status: ApplicationStatus     // 신청 상태
  appliedAt: Timestamp          // 신청일
  approvedAt?: Timestamp        // 승인일
  rejectionReason?: string      // 거절 사유
  programTitle: string          // 프로그램 제목 (캐시)
  userName: string              // 신청자 이름 (캐시)
  userEmail: string             // 신청자 이메일 (캐시)
}
```

### Facilities Collection
```typescript
interface Facility {
  id: string                    // 시설 고유 ID
  name: string                  // 시설명
  description?: string          // 시설 설명
  capacity?: number             // 수용 인원
  bufferMinutes: number         // 준비/정리 시간 (분)
  isActive: boolean             // 운영 상태
  createdAt: Timestamp          // 생성일
  updatedAt: Timestamp          // 수정일
}
```

## 🚀 구현 우선순위

### Phase 1 (MVP - 최소 기능 제품)
1. 사용자 인증 시스템
2. 기본 대관 신청 기능
3. 관리자 승인/거절 기능
4. 기본 대시보드

### Phase 2 (핵심 기능 확장)
1. 프로그램 관리 시스템
2. 캘린더 뷰 구현
3. 검색 및 필터링
4. 반복 예약 기능

### Phase 3 (고도화)
1. 고급 통계 및 리포트
2. 알림 시스템
3. 모바일 최적화
4. 성능 최적화

### Phase 4 (추가 기능)
1. 결제 시스템 연동
2. 멀티 시설 지원
3. API 외부 연동
4. 고급 사용자 관리

## 📈 성공 측정 지표

### 사용성 지표
- 사용자 가입 후 첫 대관 신청까지 소요 시간: 5분 이내
- 관리자 신청 처리 시간: 평균 30분 이내
- 사용자 만족도: 4.5/5.0 이상

### 비즈니스 지표
- 월간 활성 사용자 증가율: 20% 이상
- 대관 신청 승인율: 85% 이상
- 프로그램 등록률: 전체 사용자의 60% 이상

### 기술 지표
- 시스템 가용성: 99.9% 이상
- 평균 응답 시간: 500ms 이내
- 에러율: 0.1% 이하

## 🔄 유지보수 및 업데이트

### 정기 업데이트
- 보안 패치: 월 1회
- 기능 업데이트: 분기 1회
- 대규모 업데이트: 반기 1회

### 모니터링
- 실시간 시스템 모니터링
- 사용자 피드백 수집
- 성능 지표 추적
- 오류 로그 분석

## 📚 참고 문서

- [TRD4.md](./TRD4.md) - 기술 요구사항 문서
- [UserFlow.md](./UserFlow.md) - 사용자 플로우 문서
- [Design.md](./Design.md) - 디자인 가이드라인
- [ERD.md](./ERD.md) - 데이터베이스 설계 문서
- [Developer Guidelines.md](./Developer%20Guidelines.md) - 개발 가이드라인

---

**문서 버전**: v4.0
**최종 수정일**: 2025년 1월
**승인자**: Claude AI Assistant