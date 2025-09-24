import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function forceCreateAdmin() {
  console.log('🚀 새로운 관리자 계정 강제 생성...');

  // 여러 계정 시도
  const adminAccounts = [
    { email: 'admin@flexspace.test', password: 'admin123' },
    { email: 'flexadmin@test.com', password: 'admin123' },
    { email: 'testadmin@flexspace.com', password: 'admin123456' }
  ];

  for (const account of adminAccounts) {
    console.log(`\n📧 계정 생성 시도: ${account.email}`);

    try {
      // 새 관리자 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
      const user = userCredential.user;

      console.log(`✅ 계정 생성 성공! UID: ${user.uid}`);

      // 프로필 업데이트
      await updateProfile(user, {
        displayName: 'System Administrator'
      });

      try {
        // Firestore에 관리자 문서 생성
        const adminDocRef = doc(db, 'users', user.uid);
        await setDoc(adminDocRef, {
          name: 'System Administrator',
          email: account.email,
          phone: null,
          role: 'admin',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        console.log('✅ Firestore 문서 생성 완료');

      } catch (firestoreError) {
        console.warn('⚠️ Firestore 문서 생성 실패:', firestoreError.message);
        console.log('수동으로 Firebase Console에서 설정해주세요.');
      }

      // 로그아웃
      await signOut(auth);

      console.log('');
      console.log('🎉 관리자 계정 생성 완료!');
      console.log('📋 로그인 정보:');
      console.log(`   이메일: ${account.email}`);
      console.log(`   비밀번호: ${account.password}`);
      console.log(`   UID: ${user.uid}`);
      console.log('');
      console.log('🌐 테스트 방법:');
      console.log('1. 브라우저에서 http://localhost:5174 접속');
      console.log('2. 관리자 탭 클릭');
      console.log(`3. 위의 이메일/비밀번호로 로그인`);

      return; // 성공하면 종료

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️  계정이 이미 존재함: ${account.email}`);
        console.log(`   비밀번호: ${account.password} 로 로그인 시도해보세요.`);
      } else {
        console.log(`❌ 계정 생성 실패: ${error.message}`);
      }
    }
  }

  console.log('\n💡 모든 계정 생성 시도 완료');
  console.log('');
  console.log('🔧 수동 해결 방법:');
  console.log('1. Firebase Console > Authentication > Users');
  console.log('2. "Add user" 버튼 클릭');
  console.log('3. 이메일: admin@flexspace.test');
  console.log('4. 비밀번호: admin123');
  console.log('5. Firestore Database > users 컬렉션에서 해당 UID로 문서 생성');
  console.log('6. role: "admin" 필드 추가');
}

forceCreateAdmin()
  .then(() => {
    console.log('\n✅ 스크립트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실패:', error);
    process.exit(1);
  });