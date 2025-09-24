# 관리자 로그인 디버깅 가이드

## 현재 상황
- 개발 서버: http://localhost:5174 (실행 중)
- Firebase Auth에 `admin@flexspace.test` 계정 존재 확인됨
- Firestore 보안 규칙으로 인해 직접 문서 확인 불가

## 관리자 로그인 테스트 절차

### 1. 브라우저에서 수동 테스트
1. http://localhost:5174 접속
2. **관리자** 탭 클릭
3. 이메일: `admin@flexspace.test`
4. 비밀번호: `admin123`
5. **관리자 로그인** 버튼 클릭

### 2. 가능한 오류 상황 및 해결방법

#### A. 이메일 인증 관련 오류
- **증상**: "이메일 인증이 필요합니다" 메시지
- **해결**: 코드에서 테스트 계정은 이메일 인증을 건너뛰도록 되어 있음
  ```javascript
  const isTestAccount = email === 'admin@flexspace.test' || ...
  ```

#### B. 권한 오류
- **증상**: "관리자 권한이 없습니다. 현재 권한: 없음" 메시지
- **원인**: Firestore에 사용자 문서가 없거나 role이 'admin'이 아님
- **해결**:

**방법 1: Firebase Console에서 수동 설정**
1. Firebase Console > Authentication > Users
2. admin@flexspace.test 사용자 찾기
3. UID 복사
4. Firestore Database > users 컬렉션
5. 해당 UID로 문서 생성/수정:
   ```json
   {
     "name": "System Administrator",
     "email": "admin@flexspace.test",
     "role": "admin",
     "isActive": true,
     "phone": null
   }
   ```

#### C. Firebase Connection 오류
- **증상**: "네트워크 연결을 확인해주세요" 메시지
- **해결**: Firebase 프로젝트 설정 확인

#### D. 콘솔 오류 확인
브라우저 개발자도구 > Console 탭에서 오류 메시지 확인:
- `Admin login - User data:` 로그 확인
- `firestoreExists: false` → Firestore에 사용자 문서 없음
- `role: undefined` → role 필드 없음

### 3. 대안 테스트 계정
다른 테스트 계정도 시도해보세요:
- `flexadmin@test.com` / `admin123`
- `joonake@naver.com` / `적절한 비밀번호`

### 4. 브라우저 캐시 정리
문제가 지속되면:
1. 브라우저 개발자도구 > Application > Storage > Clear storage
2. 페이지 새로고침

## 성공 시 확인사항
로그인 성공 후 다음을 확인하세요:
1. ✅ **운영 관리** 메뉴 보임
2. ✅ **수강생/팀 직접 등록** 섹션에서 새로운 필드들 확인:
   - 신청자 이름
   - 대관 목적
   - 시설 선택
   - 분류 (훈련/수업/행사)
3. ✅ **체육관 대관** 메뉴에서 **시설 선택** 필드 추가 확인

## 로그인 실패 시
콘솔에서 오류 메시지를 복사해서 알려주세요. 추가 디버깅을 도와드리겠습니다.