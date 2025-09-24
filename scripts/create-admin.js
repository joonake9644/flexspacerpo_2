// 테스트용 관리자 계정 생성 스크립트
require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
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

// 테스트용 관리자 계정 정보 (새 계정)
const ADMIN_ACCOUNT = {
  email: "flexadmin@test.com",
  password: "AdminTest2025!",
  name: "FlexSpace Admin",
  phone: "010-9876-5432"
};

async function createAdminAccount() {
  try {
    // Firebase 초기화
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('관리자 계정 생성 중...');
    console.log(`이메일: ${ADMIN_ACCOUNT.email}`);
    console.log(`비밀번호: ${ADMIN_ACCOUNT.password}`);

    // 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_ACCOUNT.email,
      ADMIN_ACCOUNT.password
    );

    const user = userCredential.user;
    console.log('Firebase Auth 사용자 생성 완료:', user.uid);

    // Firestore에 사용자 정보 저장 (관리자 권한 설정)
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      name: ADMIN_ACCOUNT.name,
      email: ADMIN_ACCOUNT.email,
      phone: ADMIN_ACCOUNT.phone,
      role: 'admin', // 관리자 권한 설정
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 이메일 인증 전송 (선택사항)
    try {
      await sendEmailVerification(user);
      console.log('이메일 인증 메일이 전송되었습니다.');
    } catch (emailError) {
      console.log('이메일 인증 전송 실패 (선택사항):', emailError.message);
    }

    console.log('Firestore에 관리자 정보 저장 완료');
    console.log('✅ 관리자 계정 생성이 완료되었습니다!');

    console.log('\n📋 로그인 정보:');
    console.log(`이메일: ${ADMIN_ACCOUNT.email}`);
    console.log(`비밀번호: ${ADMIN_ACCOUNT.password}`);

  } catch (error) {
    console.error('❌ 관리자 계정 생성 실패:', error.message);

    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 해당 이메일로 계정이 이미 존재합니다.');
      console.log('기존 계정 정보:');
      console.log(`이메일: ${ADMIN_ACCOUNT.email}`);
      console.log(`비밀번호: ${ADMIN_ACCOUNT.password}`);
    }
  }
}

// 스크립트 실행
createAdminAccount();

module.exports = { ADMIN_ACCOUNT };