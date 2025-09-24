# FlexSpace Pro 개발 가이드라인

## 페이지간 연계 오류 방지 가이드

### 1. 사용자별 데이터 필터링 규칙

#### ✅ 올바른 방법
```typescript
// 항상 currentUser.id로 사용자별 데이터 필터링
const myBookings = useMemo(() =>
  bookings.filter(b => b.userId === currentUser.id),
  [bookings, currentUser.id]
)

const myApplications = useMemo(() =>
  applications.filter(a => a.userId === currentUser.id),
  [applications, currentUser.id]
)
```

#### ❌ 피해야 할 방법
```typescript
// 전체 데이터를 그대로 표시 (보안 위험)
const myBookings = bookings // 모든 사용자 데이터 노출
```

### 2. Firebase Timestamp 처리 규칙

#### ✅ 올바른 방법
```typescript
// Firebase Timestamp 객체 안전 처리
const sortedApplications = applications.sort((a, b) => {
  const aDate = a.appliedAt?.toDate ? a.appliedAt.toDate() : new Date(a.appliedAt || 0)
  const bDate = b.appliedAt?.toDate ? b.appliedAt.toDate() : new Date(b.appliedAt || 0)
  return bDate.getTime() - aDate.getTime()
})

// 날짜 표시 시
const displayDate = (timestamp) => {
  return (timestamp?.toDate ? timestamp.toDate() : new Date(timestamp || 0)).toLocaleDateString()
}
```

#### ❌ 피해야 할 방법
```typescript
// Firebase Timestamp 체크 없이 직접 사용
new Date(appliedAt).getTime() // appliedAt이 Timestamp 객체일 경우 오류
appliedAt.toLocaleDateString() // toDate() 변환 없이 직접 사용 시 오류
```

### 3. Lazy Loading 성능 최적화 규칙

#### 핵심 컴포넌트는 직접 Import
```typescript
// 자주 사용되고 즉시 렌더링이 필요한 컴포넌트
import Dashboard from '@/components/Dashboard'
import Navigation from '@/components/Navigation'
```

#### 선택적 컴포넌트만 Lazy Loading
```typescript
// 조건부로 사용되거나 큰 컴포넌트만 lazy loading
const AdminSection = lazy(() => import('@/components/AdminSection'))
const UserManagement = lazy(() => import('@/components/UserManagement'))
```

### 4. 실시간 데이터 업데이트 패턴

#### 옵티미스틱 업데이트 패턴
```typescript
const handleAction = useCallback(async (id: string, action: string) => {
  // 1. 즉시 로컬 상태 업데이트 (사용자 경험 개선)
  setData(prev => prev.map(item =>
    item.id === id ? { ...item, status: newStatus } : item
  ))

  // 2. 사용자에게 즉시 피드백
  showNotification('작업이 완료되었습니다.', 'success')

  // 3. 백그라운드에서 서버 동기화 (실패해도 UI는 이미 업데이트됨)
  try {
    await updateServerData(id, action)
  } catch (error) {
    console.warn('서버 동기화 실패 (로컬 상태는 이미 업데이트됨):', error)
  }
}, [setData, showNotification])
```

### 5. 상태 관리 체크리스트

#### 컴포넌트 개발 시 확인사항
- [ ] **사용자 필터링**: 현재 사용자의 데이터만 표시하는가?
- [ ] **권한 분기**: 관리자/일반사용자 권한에 따른 데이터 분리가 되어있는가?
- [ ] **날짜 처리**: Firebase Timestamp 객체를 안전하게 처리하는가?
- [ ] **로딩 상태**: 데이터 로딩 중 적절한 fallback이 있는가?
- [ ] **에러 처리**: 네트워크 오류 시 사용자 경험이 깨지지 않는가?

#### 데이터 흐름 체크리스트
- [ ] **Props 전달**: 필요한 데이터가 올바르게 전달되는가?
- [ ] **의존성 배열**: useMemo, useCallback의 deps가 정확한가?
- [ ] **상태 동기화**: 여러 컴포넌트에서 같은 데이터를 참조할 때 일관성이 유지되는가?

### 6. 컴포넌트별 주의사항

#### Dashboard.tsx
- `myBookings`, `myApplications` 필터링 필수
- Firebase Timestamp 정렬 처리 필요
- lazy loading으로 인한 깜빡임 방지

#### BookingSection.tsx
- 사용자별 대관 목록 필터링 (`b.userId === currentUser.id`)
- 승인된 대관이 적절한 탭에 표시되는지 확인

#### AdminSection.tsx
- 관리자 액션 후 옵티미스틱 업데이트 적용
- 서버 동기화 실패 시에도 UI 상태 유지

### 7. 디버깅 가이드

#### 자주 발생하는 문제들
1. **빈 목록 표시**: 사용자 필터링이 누락되었는지 확인
2. **날짜 오류**: Firebase Timestamp vs Date 객체 처리 확인
3. **깜빡임 현상**: 불필요한 lazy loading 제거
4. **상태 불일치**: 옵티미스틱 업데이트 패턴 적용 확인

#### 디버깅 코드 예시
```typescript
// 개발 중 데이터 흐름 확인용
console.log('Current User:', currentUser.id)
console.log('All Bookings:', bookings.length)
console.log('Filtered Bookings:', myBookings.length)
console.log('User Role:', currentUser.role)
```

---

## 개발 원칙

1. **사용자 데이터 보안**: 항상 currentUser.id로 필터링
2. **성능 최적화**: 핵심 컴포넌트는 즉시 로딩
3. **사용자 경험**: 옵티미스틱 업데이트로 즉시 피드백
4. **안정성**: Firebase 객체 안전 처리
5. **일관성**: 동일한 패턴과 네이밍 규칙 사용

이 가이드라인을 따라 개발하면 페이지간 연계 오류를 크게 줄일 수 있습니다.