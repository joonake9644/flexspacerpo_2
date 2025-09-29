// 강화된 보안 시스템 종합 테스트
console.log('🔐 강화된 보안 시스템 테스트 시작');

// 브라우저에서 실행할 종합 테스트 코드
const comprehensiveTest = `
console.log('🔐 강화된 보안 시스템 종합 테스트');
console.log('=====================================');

// 1. Firebase 초기화 및 연결 상태 확인
console.log('\\n📋 1단계: Firebase 연결 상태 확인');
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase가 로드되지 않았습니다');
} else {
  console.log('✅ Firebase 초기화 완료');
  console.log('📊 앱 상태:', {
    name: firebase.app().name,
    options: firebase.app().options.projectId
  });
}

// 2. 인증 상태 및 Custom Claims 확인
console.log('\\n🔑 2단계: 인증 상태 및 Custom Claims 확인');
const auth = firebase.auth();
const currentUser = auth.currentUser;

if (currentUser) {
  console.log('✅ 사용자 인증됨:', {
    email: currentUser.email,
    uid: currentUser.uid,
    emailVerified: currentUser.emailVerified
  });

  // Custom Claims 확인
  currentUser.getIdTokenResult().then(idTokenResult => {
    console.log('🎫 ID Token Claims:', {
      role: idTokenResult.claims.role,
      admin: idTokenResult.claims.admin,
      email: idTokenResult.claims.email,
      autoGranted: idTokenResult.claims.autoGranted,
      updatedAt: idTokenResult.claims.updatedAt
    });

    // 관리자 권한 확인
    const isAdmin = idTokenResult.claims.role === 'admin' ||
                   idTokenResult.claims.admin === true ||
                   ['admin@flexspace.test', 'kan@naver.com', 'joonake@naver.com', 'uu@naver.com', 'kun6@naver.com'].includes(currentUser.email);

    console.log('👨‍💼 관리자 권한:', isAdmin ? '✅ 관리자' : '👤 일반 사용자');
  }).catch(error => {
    console.error('❌ Token Claims 확인 실패:', error);
  });
} else {
  console.log('⚠️ 로그인 필요');
}

// 3. Firestore 데이터 접근 테스트
console.log('\\n📊 3단계: Firestore 데이터 접근 테스트');
const db = firebase.firestore();

// 컬렉션별 접근 테스트
const collections = ['users', 'bookings', 'programs', 'program_applications', 'facilities'];

collections.forEach(collectionName => {
  console.log(\`\\n📂 \${collectionName} 컬렉션 테스트 중...\`);

  db.collection(collectionName).limit(1).get()
    .then(snapshot => {
      console.log(\`✅ \${collectionName} 접근 성공: \${snapshot.size}개 문서\`);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        console.log(\`📄 샘플 데이터 (ID: \${doc.id}):\`, {
          keys: Object.keys(data),
          hasUserId: 'userId' in data,
          hasUserEmail: 'userEmail' in data
        });
      }
    })
    .catch(error => {
      console.error(\`❌ \${collectionName} 접근 실패:\`, {
        code: error.code,
        message: error.message
      });
    });
});

// 4. 사용자별 데이터 필터링 테스트
setTimeout(() => {
  if (currentUser) {
    console.log('\\n🔍 4단계: 사용자별 데이터 필터링 테스트');
    const userId = currentUser.uid;
    const userEmail = currentUser.email;

    console.log('📊 필터링 기준:', { userId, userEmail });

    // 내 대관 신청 조회
    db.collection('bookings')
      .where('userId', '==', userId)
      .get()
      .then(snapshot => {
        console.log(\`✅ 내 대관 필터링 성공: \${snapshot.size}개\`);
        snapshot.forEach(doc => {
          const data = doc.data();
          console.log('📋 대관 정보:', {
            id: doc.id,
            status: data.status,
            facilityId: data.facilityId,
            purpose: data.purpose
          });
        });
      })
      .catch(error => {
        console.error('❌ 대관 필터링 실패:', error.code);
      });

    // 내 프로그램 신청 조회
    db.collection('program_applications')
      .where('userId', '==', userId)
      .get()
      .then(snapshot => {
        console.log(\`✅ 내 프로그램 신청 필터링 성공: \${snapshot.size}개\`);
        snapshot.forEach(doc => {
          const data = doc.data();
          console.log('📝 신청 정보:', {
            id: doc.id,
            status: data.status,
            programId: data.programId
          });
        });
      })
      .catch(error => {
        console.error('❌ 프로그램 신청 필터링 실패:', error.code);
      });
  }
}, 3000);

// 5. 실시간 동기화 테스트
setTimeout(() => {
  console.log('\\n🔄 5단계: 실시간 동기화 테스트');

  // 대관 데이터 실시간 리스너
  const unsubscribeBookings = db.collection('bookings').limit(3).onSnapshot(
    snapshot => {
      console.log('📡 대관 데이터 실시간 업데이트:', {
        size: snapshot.size,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        fromCache: snapshot.metadata.fromCache
      });
    },
    error => {
      console.error('❌ 대관 실시간 리스너 오류:', error.code);
    }
  );

  // 프로그램 데이터 실시간 리스너
  const unsubscribePrograms = db.collection('programs').limit(3).onSnapshot(
    snapshot => {
      console.log('📡 프로그램 데이터 실시간 업데이트:', {
        size: snapshot.size,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        fromCache: snapshot.metadata.fromCache
      });
    },
    error => {
      console.error('❌ 프로그램 실시간 리스너 오류:', error.code);
    }
  );

  // 10초 후 리스너 정리
  setTimeout(() => {
    unsubscribeBookings();
    unsubscribePrograms();
    console.log('🧹 실시간 리스너 정리 완료');
  }, 10000);
}, 5000);

console.log('\\n🎯 테스트 요약');
console.log('- 1단계: Firebase 연결 확인');
console.log('- 2단계: Custom Claims 기반 인증');
console.log('- 3단계: 강화된 보안 규칙 데이터 접근');
console.log('- 4단계: 사용자별 데이터 필터링');
console.log('- 5단계: 실시간 동기화 안정성');
console.log('\\n✨ 모든 테스트가 정상 완료되면 강화된 보안 시스템이 성공적으로 구현된 것입니다!');
`;

console.log('📋 브라우저에서 다음 단계를 수행하세요:');
console.log('1. http://localhost:5173 페이지 열기');
console.log('2. 로그인 (관리자 또는 일반 사용자)');
console.log('3. F12 → Console 탭 열기');
console.log('4. 아래 테스트 코드를 붙여넣고 실행:');
console.log('\n' + comprehensiveTest);

console.log('\n🔍 확인해야 할 주요 사항:');
console.log('✅ Custom Claims 기반 관리자 권한 작동');
console.log('✅ 강화된 보안 규칙에서 데이터 접근 가능');
console.log('✅ 사용자별 데이터 필터링 정상 작동');
console.log('✅ 실시간 동기화 오류 없음');
console.log('✅ 기존 대관/프로그램 데이터와 사용자 연결 확인');

console.log('\n🚀 성공 기준:');
console.log('- 모든 컬렉션 접근 성공 (❌ 없음)');
console.log('- Custom Claims 정상 표시');
console.log('- 사용자별 필터링 데이터 정상 조회');
console.log('- 실시간 업데이트 오류 없음');