// 강한 비밀번호로 테스트 사용자 계정 생성 스크립트
require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// 테스트용 사용자 계정 정보 (더 강한 비밀번호)
const TEST_USER_ACCOUNT = {
  email: "kun6@naver.com",
  password: "964419Kun!", // 더 강한 비밀번호로 변경
  name: "테스트 사용자",
  phone: null
};

async function createTestUserWithStrongPassword() {
  try {
    console.log('Firebase 프로덕션 서버에 연결 중...');
    console.log('Project ID:', firebaseConfig.projectId);

    // Firebase 초기화
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('✅ 프로덕션 Firebase에 연결됨');
    console.log('\n테스트 사용자 계정 생성 중...');
    console.log(`이메일: ${TEST_USER_ACCOUNT.email}`);
    console.log(`새 비밀번호: ${TEST_USER_ACCOUNT.password}`);

    try {
      // 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        TEST_USER_ACCOUNT.email,
        TEST_USER_ACCOUNT.password
      );

      const user = userCredential.user;
      console.log('✅ Firebase Auth 사용자 생성 완료:', user.uid);

      // 프로필 업데이트
      await updateProfile(user, {
        displayName: TEST_USER_ACCOUNT.name
      });

      // Firestore에 사용자 정보 저장
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name: TEST_USER_ACCOUNT.name,
        email: TEST_USER_ACCOUNT.email,
        phone: TEST_USER_ACCOUNT.phone,
        role: 'user',
        isActive: true,
        adminCreated: true, // 이메일 인증 우회용
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Firestore에 사용자 정보 저장 완료');
      console.log('✅ 프로덕션 서버에 테스트 사용자 계정 생성 완료!');

    } catch (createError) {
      if (createError.code === 'auth/email-already-in-use') {
        console.log('💡 이미 존재하는 계정입니다. 비밀번호 업데이트를 시도합니다...');

        // 기존 계정의 경우, 관리자를 통해 비밀번호를 재설정해야 함
        console.log('⚠️  기존 계정의 비밀번호를 변경하려면 다음 방법 중 하나를 사용하세요:');
        console.log('1. Firebase Console에서 직접 비밀번호 재설정');
        console.log('2. 비밀번호 재설정 이메일 발송');
        console.log('3. 새로운 이메일 주소 사용');

        return;
      } else {
        throw createError;
      }
    }

    console.log('\n📋 로그인 정보:');
    console.log(`이메일: ${TEST_USER_ACCOUNT.email}`);
    console.log(`비밀번호: ${TEST_USER_ACCOUNT.password}`);
    console.log('🔑 이메일 인증 없이 바로 로그인할 수 있습니다.');
    console.log('🌐 프로덕션 웹사이트에서 로그인 가능합니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('에러 코드:', error.code);

    if (error.code === 'auth/weak-password') {
      console.log('💡 비밀번호가 너무 약합니다. 6자 이상의 더 강한 비밀번호를 사용하세요.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 이메일 형식이 올바르지 않습니다.');
    } else if (error.code === 'auth/operation-not-allowed') {
      console.log('💡 이메일/비밀번호 인증이 Firebase에서 비활성화되어 있습니다.');
    }
  }
}

async function createAlternativeTestUser() {
  console.log('\n대안: 새로운 이메일로 테스트 계정 생성...');

  const ALTERNATIVE_ACCOUNT = {
    email: "testuser964419@gmail.com", // 새로운 이메일
    password: "964419Kun!",
    name: "테스트 사용자 대안",
    phone: null
  };

  try {
    const app = initializeApp(firebaseConfig, 'alternative');
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log(`대안 이메일: ${ALTERNATIVE_ACCOUNT.email}`);
    console.log(`비밀번호: ${ALTERNATIVE_ACCOUNT.password}`);

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ALTERNATIVE_ACCOUNT.email,
      ALTERNATIVE_ACCOUNT.password
    );

    const user = userCredential.user;
    console.log('✅ 대안 계정 생성 완료:', user.uid);

    await updateProfile(user, {
      displayName: ALTERNATIVE_ACCOUNT.name
    });

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      name: ALTERNATIVE_ACCOUNT.name,
      email: ALTERNATIVE_ACCOUNT.email,
      phone: ALTERNATIVE_ACCOUNT.phone,
      role: 'user',
      isActive: true,
      adminCreated: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ 대안 계정 Firestore 저장 완료');
    console.log('\n📋 대안 로그인 정보:');
    console.log(`이메일: ${ALTERNATIVE_ACCOUNT.email}`);
    console.log(`비밀번호: ${ALTERNATIVE_ACCOUNT.password}`);

  } catch (altError) {
    console.error('❌ 대안 계정 생성도 실패:', altError.message);
  }
}

// 스크립트 실행
async function main() {
  await createTestUserWithStrongPassword();
  await createAlternativeTestUser();
}

main();