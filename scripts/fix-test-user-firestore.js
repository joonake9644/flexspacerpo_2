// 테스트 사용자의 Firestore 문서 확인 및 수정 스크립트
require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// 테스트용 사용자 계정 정보
const TEST_USER_ACCOUNT = {
  email: "kun6@naver.com",
  password: "964419",
  name: "테스트 사용자",
  phone: null
};

async function fixTestUserFirestore() {
  try {
    console.log('Firebase 프로덕션 서버에 연결 중...');
    console.log('Project ID:', firebaseConfig.projectId);

    // Firebase 초기화
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('\n1️⃣ 테스트 계정으로 로그인 시도...');
    console.log(`이메일: ${TEST_USER_ACCOUNT.email}`);

    // 테스트 계정으로 로그인 시도
    const userCredential = await signInWithEmailAndPassword(
      auth,
      TEST_USER_ACCOUNT.email,
      TEST_USER_ACCOUNT.password
    );

    const user = userCredential.user;
    console.log('✅ 로그인 성공!');
    console.log('사용자 UID:', user.uid);
    console.log('이메일 인증 상태:', user.emailVerified);

    console.log('\n2️⃣ Firestore 사용자 문서 확인...');

    // Firestore에서 사용자 문서 확인
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      console.log('✅ Firestore 사용자 문서 존재함');
      console.log('기존 데이터:', userDoc.data());
    } else {
      console.log('❌ Firestore 사용자 문서가 없음 - 새로 생성');
    }

    console.log('\n3️⃣ 사용자 문서 업데이트/생성...');

    // Firestore에 올바른 사용자 정보 저장
    await setDoc(userRef, {
      name: TEST_USER_ACCOUNT.name,
      email: TEST_USER_ACCOUNT.email,
      phone: TEST_USER_ACCOUNT.phone,
      role: 'user', // 일반 사용자 권한
      isActive: true,
      adminCreated: true, // 관리자가 생성한 사용자 표시 (이메일 인증 우회용)
      createdAt: userDoc.exists() ? userDoc.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true }); // merge: true로 기존 데이터 유지하면서 업데이트

    console.log('✅ Firestore 사용자 문서 업데이트 완료');

    console.log('\n4️⃣ 업데이트된 데이터 확인...');
    const updatedDoc = await getDoc(userRef);
    console.log('업데이트된 데이터:', updatedDoc.data());

    console.log('\n5️⃣ 이메일로 사용자 검색 테스트...');
    const usersQuery = query(collection(db, 'users'), where('email', '==', TEST_USER_ACCOUNT.email));
    const querySnapshot = await getDocs(usersQuery);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        console.log('✅ 이메일 검색 성공:', doc.id, '=>', doc.data());
      });
    } else {
      console.log('❌ 이메일로 사용자를 찾을 수 없음');
    }

    // 로그아웃
    await signOut(auth);
    console.log('\n✅ 수정 완료 및 로그아웃됨');

    console.log('\n📋 결과 요약:');
    console.log(`이메일: ${TEST_USER_ACCOUNT.email}`);
    console.log(`비밀번호: ${TEST_USER_ACCOUNT.password}`);
    console.log('🔑 이메일 인증 없이 바로 로그인할 수 있습니다.');
    console.log('🌐 프로덕션 웹사이트에서 로그인 가능합니다.');
    console.log('📝 Firestore 사용자 문서가 올바르게 설정되었습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('에러 코드:', error.code);

    if (error.code === 'auth/user-not-found') {
      console.log('💡 사용자가 존재하지 않습니다. create-test-user-production.js를 먼저 실행하세요.');
    } else if (error.code === 'auth/wrong-password') {
      console.log('💡 비밀번호가 틀렸습니다.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 이메일 형식이 올바르지 않습니다.');
    } else if (error.code === 'auth/user-disabled') {
      console.log('💡 사용자 계정이 비활성화되었습니다.');
    } else {
      console.log('💡 네트워크 연결이나 Firebase 설정을 확인해주세요.');
    }
  }
}

// 스크립트 실행
fixTestUserFirestore();