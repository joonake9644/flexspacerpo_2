// 테스트용 사용자 계정 생성 스크립트
require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase 설정 (환경변수에서 가져오기)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBvlPy3BOyrRCokGAHkzuX6IoVZNjWTU-0",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "flexspaceprowin.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "flexspaceprowin",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "flexspaceprowin.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "545144229496",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:545144229496:web:a833b961cf4b8a7ce9678d"
};

// 테스트용 사용자 계정 정보
const TEST_USER_ACCOUNT = {
  email: "kun6@naver.com",
  password: "964419",
  name: "테스트 사용자",
  phone: null
};

async function createTestUserAccount() {
  try {
    // Firebase 초기화
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

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
    console.log('✅ 테스트 사용자 계정 생성이 완료되었습니다!');

    console.log('\n📋 로그인 정보:');
    console.log(`이메일: ${TEST_USER_ACCOUNT.email}`);
    console.log(`비밀번호: ${TEST_USER_ACCOUNT.password}`);
    console.log('이메일 인증 없이 바로 로그인할 수 있습니다.');

  } catch (error) {
    console.error('❌ 테스트 사용자 계정 생성 실패:', error.message);

    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 해당 이메일로 계정이 이미 존재합니다.');
      console.log('기존 계정 정보:');
      console.log(`이메일: ${TEST_USER_ACCOUNT.email}`);
      console.log(`비밀번호: ${TEST_USER_ACCOUNT.password}`);
    }
  }
}

// 스크립트 실행
createTestUserAccount();

module.exports = { TEST_USER_ACCOUNT };