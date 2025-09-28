// 프로덕션 서버에 테스트용 사용자 계정 생성 스크립트
require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp, connectFirestoreEmulator } = require('firebase/firestore');

// Firebase 설정 (환경변수에서 가져오기)
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

async function createTestUserAccountProduction() {
  try {
    console.log('Firebase 설정 확인:');
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Auth Domain:', firebaseConfig.authDomain);

    // Firebase 초기화 (프로덕션 환경)
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // 에뮬레이터가 아닌 프로덕션 환경 확인
    if (process.env.VITE_USE_EMULATOR === 'true') {
      console.log('⚠️  에뮬레이터 모드가 활성화되어 있습니다. 프로덕션에 생성하려면 VITE_USE_EMULATOR를 false로 설정하세요.');
      return;
    }

    console.log('✅ 프로덕션 Firebase에 연결됨');
    console.log('테스트 사용자 계정 생성 중...');
    console.log(`이메일: ${TEST_USER_ACCOUNT.email}`);
    console.log(`비밀번호: ${TEST_USER_ACCOUNT.password}`);

    // 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      TEST_USER_ACCOUNT.email,
      TEST_USER_ACCOUNT.password
    );

    const user = userCredential.user;
    console.log('Firebase Auth 사용자 생성 완료:', user.uid);

    // Firestore에 사용자 정보 저장 (adminCreated 플래그 추가)
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      name: TEST_USER_ACCOUNT.name,
      email: TEST_USER_ACCOUNT.email,
      phone: TEST_USER_ACCOUNT.phone,
      role: 'user', // 일반 사용자 권한
      isActive: true,
      adminCreated: true, // 관리자가 생성한 사용자 표시 (이메일 인증 우회용)
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 테스트 계정이므로 이메일 인증 메일을 보내지 않음
    console.log('테스트 계정이므로 이메일 인증 메일을 발송하지 않습니다.');

    console.log('Firestore에 사용자 정보 저장 완료');
    console.log('✅ 프로덕션 서버에 테스트 사용자 계정 생성이 완료되었습니다!');

    console.log('\n📋 로그인 정보:');
    console.log(`이메일: ${TEST_USER_ACCOUNT.email}`);
    console.log(`비밀번호: ${TEST_USER_ACCOUNT.password}`);
    console.log('🔑 이메일 인증 없이 바로 로그인할 수 있습니다.');
    console.log('🌐 프로덕션 웹사이트에서 로그인 가능합니다.');

  } catch (error) {
    console.error('❌ 테스트 사용자 계정 생성 실패:', error.message);
    console.error('에러 코드:', error.code);

    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 해당 이메일로 계정이 이미 존재합니다.');
      console.log('기존 계정 정보:');
      console.log(`이메일: ${TEST_USER_ACCOUNT.email}`);
      console.log(`비밀번호: ${TEST_USER_ACCOUNT.password}`);
      console.log('🔑 이미 생성된 계정으로 로그인할 수 있습니다.');
    } else if (error.code === 'auth/weak-password') {
      console.log('💡 비밀번호가 너무 약합니다. 6자 이상의 더 강한 비밀번호를 사용하세요.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 이메일 형식이 올바르지 않습니다.');
    } else {
      console.log('💡 네트워크 연결이나 Firebase 설정을 확인해주세요.');
    }
  }
}

// 스크립트 실행
createTestUserAccountProduction();

module.exports = { TEST_USER_ACCOUNT };