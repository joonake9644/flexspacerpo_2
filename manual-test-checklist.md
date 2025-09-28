# 🔍 수동 테스트 체크리스트

## 현재 상황
- ✅ 개발 서버 실행 중: http://localhost:5173
- ❌ Firebase 권한 이슈 확인됨
- ✅ 코드 통합 완료
- ✅ Slack/EmailJS 설정 완료

## 🎯 즉시 확인할 수 있는 것들

### 1. 웹사이트 기본 동작 ✅
```
브라우저에서 http://localhost:5173 접속
→ 로그인 페이지가 정상적으로 표시됨
→ React 앱이 정상적으로 로드됨
```

### 2. Firebase 연결 상태 확인
```
브라우저 개발자 도구(F12) → Console 확인
→ "Missing or insufficient permissions" 오류 확인됨
→ 이는 Firestore 보안 규칙 때문일 가능성
```

### 3. 환경변수 로드 확인 ✅
```
Console에서 "Firebase Config Debug" 로그 확인됨
→ 환경변수들이 정상적으로 로드됨
```

## 🔧 해결해야 할 문제들

### A. Firebase 보안 규칙 문제
**증상**: "Missing or insufficient permissions"
**원인**: Firestore 보안 규칙이 너무 제한적
**해결방법**:
1. Firebase Console → Firestore → Rules 확인
2. 테스트용으로 임시 규칙 완화 필요

### B. 현재 로그인된 사용자 상태
**확인됨**: `uu@naver.com` (관리자) 자동 로그인됨
**문제**: 테스트용 사용자가 아님

## 📋 다음 단계 권장사항

### 즉시 실행 가능한 테스트
1. **현재 관리자로 로그인된 상태에서**:
   - 관리자 탭 → 대관 관리 확인
   - 기존 대관 데이터가 있다면 승인/거부 테스트

2. **Slack 연결 테스트**:
   ```bash
   node test-slack.js
   ```
   - 302 응답 문제 해결 (Webhook URL 확인)

3. **EmailJS 연결 테스트**:
   - 브라우저 Console에서 직접 테스트:
   ```javascript
   emailjs.send('service_9ctjyxp', 'template_1c7i9wc', {
     to_name: 'Test User',
     user_email: 'test@example.com',
     message: 'Test message'
   })
   ```

## 🎯 성공 지표

### 최소 성공 기준
1. ✅ 웹사이트 정상 로드
2. ❓ Firebase 데이터 접근 (권한 이슈 해결 필요)
3. ❓ Slack 메시지 전송 (URL 완성 필요)
4. ❓ EmailJS 이메일 전송 (테스트 필요)

### 완전 성공 기준
1. 사용자 대관 신청 → Slack 관리자 알림
2. 관리자 승인 → Slack + EmailJS 알림
3. 실제 이메일 수신 확인
4. 모든 오류 없이 완전 플로우 동작

## 🚨 현재 상태 요약

**좋은 소식 🎉**:
- 개발 완료
- 서버 정상 작동
- 코드 통합 성공
- 환경변수 로드 성공

**해결 필요 🔧**:
- Firebase 보안 규칙 조정
- Slack Webhook URL 완성
- 실제 사용자 계정으로 테스트

**추천 다음 액션**:
1. Firebase Console에서 보안 규칙 확인
2. Slack Webhook URL 완성
3. 실제 테스트 진행