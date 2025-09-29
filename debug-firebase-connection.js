// Firebase 연결 상태 디버깅 스크립트
console.log('🔍 Firebase 연결 상태 디버깅 시작');

// 브라우저 콘솔에서 실행할 디버깅 코드
const debugFirebase = `
// 1. Firebase 인증 상태 확인
console.log('📋 Firebase Auth 상태:', {
  currentUser: firebase.auth().currentUser,
  authState: firebase.auth().currentUser ? 'authenticated' : 'not authenticated'
});

// 2. Firestore 연결 상태 확인
console.log('📋 Firestore 연결 상태:', firebase.firestore());

// 3. 간단한 데이터 읽기 테스트
firebase.firestore().collection('users').limit(1).get()
  .then(snapshot => {
    console.log('✅ Users 컬렉션 읽기 성공:', snapshot.size, '개 문서');
    snapshot.forEach(doc => {
      console.log('📄 문서 ID:', doc.id);
      console.log('📄 문서 데이터:', doc.data());
    });
  })
  .catch(error => {
    console.error('❌ Users 컬렉션 읽기 실패:', error);
    console.error('❌ 오류 코드:', error.code);
    console.error('❌ 오류 메시지:', error.message);
  });

// 4. 시설 데이터 읽기 테스트
firebase.firestore().collection('facilities').limit(1).get()
  .then(snapshot => {
    console.log('✅ Facilities 컬렉션 읽기 성공:', snapshot.size, '개 문서');
  })
  .catch(error => {
    console.error('❌ Facilities 컬렉션 읽기 실패:', error);
  });

// 5. 대관 데이터 읽기 테스트
firebase.firestore().collection('bookings').limit(1).get()
  .then(snapshot => {
    console.log('✅ Bookings 컬렉션 읽기 성공:', snapshot.size, '개 문서');
  })
  .catch(error => {
    console.error('❌ Bookings 컬렉션 읽기 실패:', error);
  });

// 6. 프로그램 데이터 읽기 테스트
firebase.firestore().collection('programs').limit(1).get()
  .then(snapshot => {
    console.log('✅ Programs 컬렉션 읽기 성공:', snapshot.size, '개 문서');
  })
  .catch(error => {
    console.error('❌ Programs 컬렉션 읽기 실패:', error);
  });
`;

console.log('📋 브라우저 콘솔에서 다음 코드를 실행하세요:');
console.log(debugFirebase);

console.log('\n🔧 문제 해결 단계:');
console.log('1. http://localhost:5173 접속');
console.log('2. F12 → Console 탭 열기');
console.log('3. 위의 코드를 복사해서 붙여넣기');
console.log('4. 오류 메시지 확인');