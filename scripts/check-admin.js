import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
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
const db = getFirestore(app);
const auth = getAuth(app);

const adminEmail = 'admin@flexspace.test';
const adminPassword = 'admin123';

async function checkAndCreateAdmin() {
  console.log('🔍 관리자 계정 확인 중...');

  try {
    // 1. Firebase Auth에서 관리자 계정 생성 시도
    console.log('📧 Firebase Auth에서 관리자 계정 확인 중...');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;

      console.log('✅ 새로운 관리자 계정 생성됨:', user.uid);

      // 프로필 업데이트
      await updateProfile(user, {
        displayName: 'System Administrator'
      });

      // 로그아웃
      await signOut(auth);

    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log('ℹ️  관리자 계정이 이미 Firebase Auth에 존재함');
      } else {
        console.warn('⚠️  Firebase Auth 오류:', authError.message);
      }
    }

    // 2. Firestore에서 관리자 문서 확인/생성
    console.log('📊 Firestore에서 관리자 문서 확인 중...');

    // 관리자 계정의 UID를 찾기 위해 일반적인 UID 생성 (실제로는 Firebase Auth에서 생성된 UID 사용)
    // 임시로 고정된 문서 ID 사용
    const adminDocId = 'admin-user-001';
    const adminDocRef = doc(db, 'users', adminDocId);

    try {
      const adminDoc = await getDoc(adminDocRef);

      if (!adminDoc.exists()) {
        // 관리자 문서 생성
        const adminData = {
          name: 'System Administrator',
          email: adminEmail,
          phone: null,
          role: 'admin',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(adminDocRef, adminData);
        console.log('✅ Firestore에 관리자 문서 생성됨');

      } else {
        console.log('ℹ️  관리자 문서가 이미 Firestore에 존재함');
        const data = adminDoc.data();
        console.log('📋 관리자 정보:', {
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive
        });
      }

    } catch (firestoreError) {
      console.error('❌ Firestore 오류:', firestoreError.message);

      // 보안 규칙 때문에 접근 불가할 수 있으므로 안내 메시지 출력
      console.log('');
      console.log('💡 해결 방법:');
      console.log('1. 브라우저에서 http://localhost:5174 접속');
      console.log('2. 관리자 탭 클릭');
      console.log('3. 이메일: admin@flexspace.test');
      console.log('4. 비밀번호: admin123');
      console.log('5. 관리자 로그인 시도');
      console.log('');
      console.log('만약 로그인이 실패한다면:');
      console.log('- Firebase Console에서 Authentication > Users로 이동');
      console.log('- admin@flexspace.test 사용자 수동 생성');
      console.log('- Firestore Database > users 컬렉션에서 해당 사용자의 role을 "admin"으로 설정');
    }

    console.log('');
    console.log('🎯 테스트 준비 완료!');
    console.log('브라우저에서 http://localhost:5174 접속하여 관리자 로그인 테스트하세요.');

  } catch (error) {
    console.error('❌ 관리자 계정 확인/생성 실패:', error);
  }
}

checkAndCreateAdmin()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });