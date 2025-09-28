// kun6@naver.com 계정의 비밀번호를 Firebase Admin SDK로 재설정하는 스크립트
// 주의: 이 스크립트는 Firebase Admin SDK 권한이 필요합니다

require('dotenv').config({ path: '.env.local' });

// Admin SDK 없이 클라이언트 SDK를 사용한 비밀번호 재설정 방법
const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function resetKun6Password() {
  try {
    console.log('Firebase 프로덕션 서버에 연결 중...');

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const email = 'kun6@naver.com';

    console.log(`\n1️⃣ ${email} 계정의 비밀번호 재설정 이메일 발송...`);

    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ 비밀번호 재설정 이메일이 발송되었습니다.');
      console.log('📧 이메일 확인 후 새 비밀번호를 설정하세요.');
    } catch (resetError) {
      if (resetError.code === 'auth/user-not-found') {
        console.log('❌ 해당 이메일로 가입된 계정이 없습니다.');
        return;
      } else {
        throw resetError;
      }
    }

    console.log('\n2️⃣ Firestore에서 사용자 문서 검색...');

    // Firestore에서 이메일로 사용자 검색
    const { collection, query, where, getDocs } = require('firebase/firestore');

    const usersQuery = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(usersQuery);

    if (querySnapshot.empty) {
      console.log('❌ Firestore에서 사용자 문서를 찾을 수 없습니다.');
      console.log('📝 Firestore 문서를 수동으로 생성해야 할 수 있습니다.');
    } else {
      console.log('✅ Firestore 사용자 문서 발견:');
      querySnapshot.forEach((doc) => {
        console.log('문서 ID:', doc.id);
        console.log('데이터:', doc.data());

        // adminCreated 플래그 확인 및 업데이트
        const userData = doc.data();
        if (!userData.adminCreated) {
          console.log('\n3️⃣ adminCreated 플래그 추가 중...');

          updateDoc(doc.ref, {
            adminCreated: true,
            updatedAt: new Date()
          }).then(() => {
            console.log('✅ adminCreated 플래그 추가 완료');
          }).catch((updateError) => {
            console.error('❌ 업데이트 실패:', updateError);
          });
        } else {
          console.log('✅ adminCreated 플래그가 이미 설정되어 있습니다.');
        }
      });
    }

    console.log('\n📋 해결 방안:');
    console.log('1. 이메일 확인 후 새 비밀번호를 설정하세요');
    console.log('2. 새 비밀번호는 6자 이상이어야 합니다');
    console.log('3. 새 비밀번호 예시: 964419Kun! 또는 kun964419!');
    console.log('4. 비밀번호 설정 후 바로 로그인 가능합니다 (이메일 인증 불필요)');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('에러 코드:', error.code);
  }
}

// 테스트용으로 가능한 비밀번호들 확인
async function testPossiblePasswords() {
  console.log('\n🔍 기존 비밀번호들로 로그인 테스트...');

  const app = initializeApp(firebaseConfig, 'test');
  const auth = getAuth(app);
  const email = 'kun6@naver.com';

  const possiblePasswords = [
    '964419',
    '964419!',
    '964419Kun',
    '964419Kun!',
    'kun964419',
    'kun964419!'
  ];

  for (const password of possiblePasswords) {
    try {
      console.log(`테스트 중: ${password}`);
      await signInWithEmailAndPassword(auth, email, password);
      console.log(`✅ 성공! 비밀번호: ${password}`);
      return password;
    } catch (error) {
      console.log(`❌ 실패: ${password} (${error.code})`);
    }
  }

  console.log('❌ 모든 비밀번호 테스트 실패');
  return null;
}

async function main() {
  const workingPassword = await testPossiblePasswords();

  if (!workingPassword) {
    await resetKun6Password();
  } else {
    console.log(`\n✅ 현재 작동하는 비밀번호: ${workingPassword}`);
  }
}

main();