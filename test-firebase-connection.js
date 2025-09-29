// Firebase 연결 및 데이터 접근 테스트
console.log('🔧 Firebase 연결 테스트 시작...');

// 브라우저에서 실행할 테스트 코드
const testCode = `
console.log('=== Firebase 연결 테스트 시작 ===');

// 1. Firebase 초기화 상태 확인
console.log('🔍 Firebase 앱 상태:', {
  apps: firebase.apps.length,
  currentApp: firebase.app().name,
  options: firebase.app().options
});

// 2. 인증 상태 확인
const auth = firebase.auth();
console.log('🔑 인증 상태:', {
  currentUser: auth.currentUser,
  isAuthenticated: !!auth.currentUser,
  userEmail: auth.currentUser?.email,
  userId: auth.currentUser?.uid
});

// 3. Firestore 연결 확인
const db = firebase.firestore();
console.log('📊 Firestore 상태:', {
  app: db.app.name,
  settings: db._settings
});

// 4. 기존 데이터 연결 테스트
console.log('\\n📋 기존 데이터 연결 테스트 시작...');

// 사용자 데이터 테스트
console.log('👤 사용자 데이터 조회 중...');
db.collection('users').get()
  .then(snapshot => {
    console.log('✅ Users 컬렉션 접근 성공:', {
      size: snapshot.size,
      empty: snapshot.empty
    });

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('📄 사용자 문서:', {
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role
      });
    });
  })
  .catch(error => {
    console.error('❌ Users 컬렉션 접근 실패:', {
      code: error.code,
      message: error.message
    });
  });

// 대관 데이터 테스트
console.log('🏢 대관 데이터 조회 중...');
db.collection('bookings').get()
  .then(snapshot => {
    console.log('✅ Bookings 컬렉션 접근 성공:', {
      size: snapshot.size,
      empty: snapshot.empty
    });

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('📄 대관 문서:', {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        facilityId: data.facilityId,
        status: data.status
      });
    });
  })
  .catch(error => {
    console.error('❌ Bookings 컬렉션 접근 실패:', {
      code: error.code,
      message: error.message
    });
  });

// 프로그램 데이터 테스트
console.log('🏃 프로그램 데이터 조회 중...');
db.collection('programs').get()
  .then(snapshot => {
    console.log('✅ Programs 컬렉션 접근 성공:', {
      size: snapshot.size,
      empty: snapshot.empty
    });

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('📄 프로그램 문서:', {
        id: doc.id,
        name: data.name,
        instructor: data.instructor
      });
    });
  })
  .catch(error => {
    console.error('❌ Programs 컬렉션 접근 실패:', {
      code: error.code,
      message: error.message
    });
  });

// 프로그램 신청 데이터 테스트
console.log('📝 프로그램 신청 데이터 조회 중...');
db.collection('applications').get()
  .then(snapshot => {
    console.log('✅ Applications 컬렉션 접근 성공:', {
      size: snapshot.size,
      empty: snapshot.empty
    });

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('📄 신청 문서:', {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        programId: data.programId,
        status: data.status
      });
    });
  })
  .catch(error => {
    console.error('❌ Applications 컬렉션 접근 실패:', {
      code: error.code,
      message: error.message
    });
  });

// 5. 사용자별 데이터 필터링 테스트
setTimeout(() => {
  if (auth.currentUser) {
    const currentUserId = auth.currentUser.uid;
    const currentUserEmail = auth.currentUser.email;

    console.log('\\n🔍 사용자별 데이터 필터링 테스트:', {
      userId: currentUserId,
      userEmail: currentUserEmail
    });

    // 내 대관 조회
    db.collection('bookings')
      .where('userId', '==', currentUserId)
      .get()
      .then(snapshot => {
        console.log('✅ 내 대관 필터링 성공:', snapshot.size, '개');
      })
      .catch(error => {
        console.error('❌ 내 대관 필터링 실패:', error.code);
      });

    // 내 프로그램 신청 조회
    db.collection('applications')
      .where('userId', '==', currentUserId)
      .get()
      .then(snapshot => {
        console.log('✅ 내 프로그램 신청 필터링 성공:', snapshot.size, '개');
      })
      .catch(error => {
        console.error('❌ 내 프로그램 신청 필터링 실패:', error.code);
      });
  } else {
    console.log('⚠️ 로그인 후 필터링 테스트 가능');
  }
}, 2000);

console.log('\\n=== 테스트 코드 실행 완료 ===');
`;

console.log('📋 브라우저에서 다음 단계를 수행하세요:');
console.log('1. http://localhost:5173 페이지 열기');
console.log('2. 로그인 또는 기존 세션 확인');
console.log('3. F12 → Console 탭 열기');
console.log('4. 아래 코드를 붙여넣고 실행:');
console.log('\\n' + testCode);

console.log('\\n🎯 확인해야 할 주요 사항:');
console.log('- ✅ 인증 상태 정상');
console.log('- ✅ 모든 컬렉션 데이터 조회 성공');
console.log('- ✅ 사용자별 데이터 필터링 작동');
console.log('- ✅ 기존 대관/프로그램 데이터와 사용자 연결 확인');