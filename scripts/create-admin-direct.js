import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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

async function createAdminAccount() {
  const adminEmail = 'admin@flexspace.test';
  const adminPassword = 'admin123';

  console.log('🔧 관리자 계정 생성 시작...');

  try {
    let adminUser = null;

    // 1. 기존 계정으로 로그인 시도
    try {
      console.log('1️⃣ 기존 관리자 계정으로 로그인 시도...');
      const loginResult = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      adminUser = loginResult.user;
      console.log('✅ 기존 관리자 계정 로그인 성공:', adminUser.uid);
    } catch (loginError) {
      if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/wrong-password') {
        // 2. 계정이 없으면 새로 생성
        try {
          console.log('2️⃣ 새 관리자 계정 생성...');
          const createResult = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
          adminUser = createResult.user;
          console.log('✅ 새 관리자 계정 생성 성공:', adminUser.uid);

          // 프로필 업데이트
          await updateProfile(adminUser, {
            displayName: 'System Administrator'
          });
          console.log('✅ 프로필 업데이트 완료');

        } catch (createError) {
          console.error('❌ 계정 생성 실패:', createError.message);
          return;
        }
      } else {
        console.error('❌ 로그인 실패:', loginError.message);
        return;
      }
    }

    if (adminUser) {
      // 3. Firestore에 관리자 문서 생성
      try {
        console.log('3️⃣ Firestore에 관리자 문서 생성/확인...');

        const adminDocRef = doc(db, 'users', adminUser.uid);
        const adminDoc = await getDoc(adminDocRef);

        const adminData = {
          name: 'System Administrator',
          email: adminEmail,
          phone: null,
          role: 'admin',
          isActive: true,
          updatedAt: serverTimestamp(),
        };

        if (!adminDoc.exists()) {
          adminData.createdAt = serverTimestamp();
          await setDoc(adminDocRef, adminData);
          console.log('✅ Firestore에 새 관리자 문서 생성됨');
        } else {
          // 기존 문서 업데이트 (role을 admin으로 확실히 설정)
          await setDoc(adminDocRef, adminData, { merge: true });
          console.log('✅ Firestore 관리자 문서 업데이트됨');
        }

        // 문서 확인
        const updatedDoc = await getDoc(adminDocRef);
        if (updatedDoc.exists()) {
          const data = updatedDoc.data();
          console.log('📋 최종 관리자 정보:');
          console.log('   - UID:', adminUser.uid);
          console.log('   - 이메일:', data.email);
          console.log('   - 이름:', data.name);
          console.log('   - 권한:', data.role);
          console.log('   - 활성상태:', data.isActive);
          console.log('   - 이메일 인증:', adminUser.emailVerified);
        }

      } catch (firestoreError) {
        console.error('❌ Firestore 오류:', firestoreError.message);
        console.log('');
        console.log('💡 수동으로 해결하세요:');
        console.log(`1. Firebase Console > Firestore Database > users 컬렉션`);
        console.log(`2. 문서 ID: ${adminUser.uid}`);
        console.log(`3. 다음 필드들 설정:`);
        console.log('   {');
        console.log('     "name": "System Administrator",');
        console.log(`     "email": "${adminEmail}",`);
        console.log('     "role": "admin",');
        console.log('     "isActive": true,');
        console.log('     "phone": null');
        console.log('   }');
      }

      // 로그아웃
      await signOut(auth);
      console.log('✅ 로그아웃 완료');
    }

    console.log('');
    console.log('🎯 관리자 계정 준비 완료!');
    console.log('테스트 정보:');
    console.log(`   이메일: ${adminEmail}`);
    console.log(`   비밀번호: ${adminPassword}`);
    console.log('   URL: http://localhost:5174');
    console.log('');
    console.log('브라우저에서 관리자 로그인을 시도해보세요.');

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error);
  }
}

createAdminAccount()
  .then(() => {
    console.log('✅ 스크립트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실패:', error);
    process.exit(1);
  });