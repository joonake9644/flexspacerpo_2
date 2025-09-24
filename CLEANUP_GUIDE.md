# 🧹 사용자 데이터 완전 삭제 가이드

Firebase Console에서 수동으로 모든 데이터를 삭제해야 합니다.

## 📱 Firebase Console 접속
1. https://console.firebase.google.com 접속
2. 프로젝트 선택: **flexspaceprowin**

## 🔥 1단계: Firestore 데이터 삭제

### Firebase Console > Firestore Database > 데이터 탭

다음 컬렉션들을 **완전히 삭제**:

#### ✅ users 컬렉션
- 모든 사용자 문서 삭제
- 관리자 계정 포함 모든 사용자 데이터

#### ✅ bookings 컬렉션
- 모든 대관 신청 데이터 삭제

#### ✅ programApplications 컬렉션
- 모든 프로그램 신청 데이터 삭제

#### ✅ programs 컬렉션
- 모든 프로그램 데이터 삭제

#### 🔒 보존할 컬렉션
- **facilities** (시설 정보는 유지)

### 컬렉션 삭제 방법
1. 컬렉션 이름 클릭
2. 모든 문서 선택 (Ctrl+A 또는 체크박스)
3. 삭제 버튼 클릭
4. 확인

## 👥 2단계: Authentication 사용자 삭제

### Firebase Console > Authentication > Users

다음 계정들을 **모두 삭제**:
- ✅ admin@flexspace.test
- ✅ flexadmin@test.com
- ✅ testadmin@flexspace.com
- ✅ 기타 모든 테스트 사용자들

### 사용자 삭제 방법
1. Users 탭에서 사용자 목록 확인
2. 각 사용자 행의 **...** 메뉴 클릭
3. **Delete user** 선택
4. 확인

## 🎯 3단계: 삭제 완료 확인

### 확인사항
- ✅ Firestore > users 컬렉션 비어있음
- ✅ Firestore > bookings 컬렉션 비어있음
- ✅ Firestore > programApplications 컬렉션 비어있음
- ✅ Firestore > programs 컬렉션 비어있음
- ✅ Authentication > Users 목록 비어있음
- ✅ facilities 컬렉션은 유지됨

## 🚀 4단계: 새로운 테스트 시작

데이터 삭제 완료 후:

1. **브라우저에서 http://localhost:5174 접속**
2. **회원가입** 탭에서 새 계정 생성
3. **회원가입 완료 후 저에게 알려주세요**
4. **제가 해당 계정을 관리자로 승격**해드리겠습니다

### 회원가입 시 권장 정보
```
이름: 테스트 관리자
이메일: your-email@example.com (실제 사용하는 이메일)
비밀번호: 기억할 수 있는 비밀번호
전화번호: (선택사항)
```

## 💡 참고사항

- 개발 서버가 **http://localhost:5174**에서 실행 중
- 시설(facilities) 데이터는 보존되어 테스트에 계속 사용 가능
- 새로 가입한 계정의 이메일을 알려주시면 관리자로 승격해드림
- 이메일 인증 오류는 이미 수정되었으므로 정상 작동할 것

---

**Firebase Console에서 위의 1-2단계 완료 후 알려주세요!**