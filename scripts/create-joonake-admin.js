// joonake@naver.com 관리자 계정 생성 스크립트
require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp, getDoc } = require('firebase/firestore');

// Firebase 설정 (환경변수에서 가져오기)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBvlPy3BOyrRCokGAHkzuX6IoVZNjWTU-0",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "flexspaceprowin.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "flexspaceprowin",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "flexspaceprowin.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "545144229496",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:545144229496:web:a833b961cf4b8a7ce9678d"
};

// joonake 관리자 계정 정보
const JOONAKE_ADMIN = {
  email: "joonake@naver.com",
  password: "96441956",
  name: "준악 관리자",
  phone: "010-0000-0000"
};

async function createJoonakeAdmin() {
  try {
    // Firebase 초기화
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('joonake 관리자 계정 생성/확인 중...');
    console.log(`이메일: ${JOONAKE_ADMIN.email}`);

    let userId = null;

    try {
      // 사용자 생성 시도
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        JOONAKE_ADMIN.email,
        JOONAKE_ADMIN.password
      );
      userId = userCredential.user.uid;
      console.log('Firebase Auth 사용자 생성 완료:', userId);
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log('계정이 이미 존재합니다. Firestore 데이터만 업데이트합니다.');
        // 기존 사용자 정보를 가져오기 위해 다시 로그인 시도
        try {
          const { signInWithEmailAndPassword } = require('firebase/auth');
          const cred = await signInWithEmailAndPassword(auth, JOONAKE_ADMIN.email, JOONAKE_ADMIN.password);
          userId = cred.user.uid;
          console.log('기존 사용자 확인 완료:', userId);
        } catch (signInError) {
          console.error('기존 계정 로그인 실패:', signInError.message);
          return;
        }
      } else {
        throw authError;
      }
    }

    if (!userId) {
      console.error('사용자 ID를 가져올 수 없습니다.');
      return;
    }

    // Firestore에서 기존 데이터 확인
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('기존 사용자 데이터:', userData);

      if (userData.role === 'admin') {
        console.log('✅ 이미 관리자 권한을 가지고 있습니다.');
        return;
      }
    }

    // Firestore에 관리자 정보 저장/업데이트
    await setDoc(userRef, {
      name: JOONAKE_ADMIN.name,
      email: JOONAKE_ADMIN.email,
      phone: JOONAKE_ADMIN.phone,
      role: 'admin', // 관리자 권한 설정
      isActive: true,
      createdAt: userSnap.exists() ? userSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('Firestore에 관리자 정보 저장/업데이트 완료');

    // 업데이트된 데이터 확인
    const updatedSnap = await getDoc(userRef);
    const updatedData = updatedSnap.data();
    console.log('업데이트된 사용자 데이터:', updatedData);

    console.log('✅ joonake 관리자 계정 설정이 완료되었습니다!');

    console.log('\n📋 로그인 정보:');
    console.log(`이메일: ${JOONAKE_ADMIN.email}`);
    console.log(`비밀번호: ${JOONAKE_ADMIN.password}`);
    console.log(`권한: admin`);

  } catch (error) {
    console.error('❌ joonake 관리자 설정 실패:', error.message);
    console.error('Error details:', error);
  }
}

// 스크립트 실행
createJoonakeAdmin();

module.exports = { JOONAKE_ADMIN };