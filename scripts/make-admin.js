import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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

async function makeUserAdmin() {
  const targetEmail = 'uu@naver.com';

  console.log(`🔧 ${targetEmail} 계정을 관리자로 전환 중...`);

  try {
    // users 컬렉션에서 해당 이메일 찾기
    console.log('👥 사용자 검색 중...');
    const usersSnapshot = await getDocs(collection(db, 'users'));

    let targetUserId = null;
    let userData = null;

    for (const docSnapshot of usersSnapshot.docs) {
      const data = docSnapshot.data();
      if (data.email === targetEmail) {
        targetUserId = docSnapshot.id;
        userData = data;
        break;
      }
    }

    if (targetUserId && userData) {
      console.log(`✅ 사용자 찾음: ${targetUserId}`);
      console.log('📋 현재 사용자 정보:');
      console.log(`   - 이름: ${userData.name}`);
      console.log(`   - 이메일: ${userData.email}`);
      console.log(`   - 현재 권한: ${userData.role || '없음'}`);

      // 관리자로 업데이트
      const adminUpdate = {
        role: 'admin',
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'users', targetUserId), adminUpdate);

      console.log('✅ 관리자 권한 부여 완료!');
      console.log('');
      console.log('🎉 관리자 계정 생성 성공!');
      console.log('📋 관리자 정보:');
      console.log(`   - 이메일: ${targetEmail}`);
      console.log(`   - 권한: admin`);
      console.log(`   - UID: ${targetUserId}`);

    } else {
      console.log('❌ 해당 이메일의 사용자를 찾을 수 없습니다.');
      console.log('');
      console.log('💡 확인사항:');
      console.log('1. 해당 이메일로 회원가입이 완료되었는지 확인');
      console.log('2. 이메일 인증이 완료되었는지 확인');
      console.log('3. 로그인 후 대시보드에 한 번 접속해서 Firestore에 사용자 문서가 생성되었는지 확인');
      console.log('');
      console.log('🔍 현재 등록된 사용자 목록:');

      if (usersSnapshot.size === 0) {
        console.log('   - 등록된 사용자가 없습니다.');
      } else {
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`   - ${data.email} (${data.name || '이름없음'})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ 관리자 전환 실패:', error);

    if (error.code === 'permission-denied') {
      console.log('');
      console.log('🔧 권한 문제 발생');
      console.log('Firebase Console에서 수동으로 설정해주세요:');
      console.log('');
      console.log('1. Firebase Console > Firestore Database');
      console.log('2. users 컬렉션에서 해당 사용자 문서 찾기');
      console.log(`3. ${targetEmail}에 해당하는 문서 편집`);
      console.log('4. role 필드를 "admin"으로 변경');
      console.log('5. 저장');
    }
  }
}

makeUserAdmin()
  .then(() => {
    console.log('');
    console.log('🌐 테스트 방법:');
    console.log('1. 브라우저에서 http://localhost:5174 접속');
    console.log('2. 관리자 탭에서 uu@naver.com으로 로그인');
    console.log('3. 또는 일반 로그인 후 관리자 메뉴 확인');
    console.log('');
    console.log('✅ 스크립트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실패:', error);
    process.exit(1);
  });