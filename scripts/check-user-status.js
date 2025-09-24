import { initializeApp } from 'firebase/app';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
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

async function checkUserStatus() {
  const checkEmail = 'joo@naver.com';

  console.log(`🔍 ${checkEmail} 계정 상태 검사 시작...`);
  console.log('');

  try {
    // 1. Firebase Authentication에서 확인
    console.log('1️⃣ Firebase Authentication 확인...');
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, checkEmail);

      if (signInMethods.length > 0) {
        console.log('🚨 Firebase Auth에 해당 이메일 존재!');
        console.log('   - 로그인 방법들:', signInMethods);
        console.log('   - 이것이 "이미 가입된 메일" 메시지의 원인일 수 있습니다');
      } else {
        console.log('✅ Firebase Auth에 해당 이메일 없음');
      }
    } catch (authError) {
      console.log('❌ Firebase Auth 확인 실패:', authError.message);
    }

    console.log('');

    // 2. Firestore users 컬렉션에서 확인
    console.log('2️⃣ Firestore users 컬렉션 확인...');
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let foundInFirestore = false;

      console.log(`📊 총 ${usersSnapshot.size}개의 사용자 문서 발견:`);

      usersSnapshot.docs.forEach((docSnapshot, index) => {
        const data = docSnapshot.data();
        console.log(`   ${index + 1}. ${data.email} (${data.name || '이름없음'}) - 권한: ${data.role || '없음'}`);

        if (data.email === checkEmail) {
          foundInFirestore = true;
          console.log('   🚨 위 사용자가 찾는 이메일과 일치!');
        }
      });

      if (!foundInFirestore) {
        console.log(`✅ Firestore에서 ${checkEmail} 없음`);
      }
    } catch (firestoreError) {
      console.log('❌ Firestore 확인 실패:', firestoreError.message);
    }

    console.log('');

    // 3. 브라우저 로컬 스토리지나 캐시 문제 가능성
    console.log('3️⃣ 기타 원인 분석...');
    console.log('');
    console.log('💡 "이미 가입된 메일" 오류의 가능한 원인들:');
    console.log('');
    console.log('A. Firebase Auth에 유령 계정 존재');
    console.log('   - Firebase Console > Authentication > Users에서 확인되지 않더라도');
    console.log('   - 내부적으로 이메일이 예약되어 있을 수 있음');
    console.log('');
    console.log('B. 이전에 가입했다가 삭제된 계정의 흔적');
    console.log('   - Firebase Auth는 삭제된 계정의 이메일을 일정 기간 보존할 수 있음');
    console.log('');
    console.log('C. 브라우저 캐시 문제');
    console.log('   - 브라우저에서 이전 가입 정보가 캐시되어 있을 수 있음');
    console.log('');
    console.log('D. Firebase 프로젝트 간 이메일 충돌');
    console.log('   - 다른 Firebase 프로젝트에서 같은 이메일을 사용 중일 수 있음');

    console.log('');
    console.log('🔧 해결 방법:');
    console.log('');
    console.log('1. 브라우저 완전 초기화:');
    console.log('   - 개발자도구 > Application > Storage > Clear storage');
    console.log('   - 브라우저 캐시 완전 삭제');
    console.log('   - 시크릿/프라이빗 브라우징 모드에서 시도');
    console.log('');
    console.log('2. 다른 이메일로 테스트:');
    console.log('   - 임시로 다른 이메일 주소 사용');
    console.log('   - 예: testuser001@gmail.com');
    console.log('');
    console.log('3. Firebase Console에서 직접 확인:');
    console.log('   - Authentication > Users에서 해당 이메일 검색');
    console.log('   - 숨겨진 계정이 있는지 확인');

  } catch (error) {
    console.error('❌ 전체 검사 실패:', error);
  }
}

checkUserStatus()
  .then(() => {
    console.log('');
    console.log('✅ 사용자 상태 검사 완료');
    console.log('');
    console.log('📱 추가 확인사항:');
    console.log('브라우저에서 회원가입 시도 시 정확한 오류 메시지를 확인해주세요.');
    console.log('개발자도구 > Console에서 더 자세한 오류 내용을 볼 수 있습니다.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });