import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
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

async function clearAllData() {
  console.log('🧹 모든 데이터 삭제 시작...');

  try {
    // 1. 모든 사용자 데이터 삭제
    console.log('👥 사용자 데이터 삭제 중...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    for (const docSnapshot of usersSnapshot.docs) {
      await deleteDoc(doc(db, 'users', docSnapshot.id));
    }
    console.log(`✅ ${usersSnapshot.size}개의 사용자 삭제됨`);

    // 2. 모든 대관 신청 삭제
    console.log('📅 대관 신청 데이터 삭제 중...');
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    for (const docSnapshot of bookingsSnapshot.docs) {
      await deleteDoc(doc(db, 'bookings', docSnapshot.id));
    }
    console.log(`✅ ${bookingsSnapshot.size}개의 대관 신청 삭제됨`);

    // 3. 모든 프로그램 신청 삭제
    console.log('🏃 프로그램 신청 데이터 삭제 중...');
    const applicationsSnapshot = await getDocs(collection(db, 'programApplications'));
    for (const docSnapshot of applicationsSnapshot.docs) {
      await deleteDoc(doc(db, 'programApplications', docSnapshot.id));
    }
    console.log(`✅ ${applicationsSnapshot.size}개의 프로그램 신청 삭제됨`);

    // 4. 모든 프로그램 삭제
    console.log('📚 프로그램 데이터 삭제 중...');
    const programsSnapshot = await getDocs(collection(db, 'programs'));
    for (const docSnapshot of programsSnapshot.docs) {
      await deleteDoc(doc(db, 'programs', docSnapshot.id));
    }
    console.log(`✅ ${programsSnapshot.size}개의 프로그램 삭제됨`);

    console.log('');
    console.log('🎉 모든 데이터 삭제 완료!');
    console.log('');
    console.log('📋 삭제된 데이터:');
    console.log(`  - 사용자: ${usersSnapshot.size}개`);
    console.log(`  - 대관 신청: ${bookingsSnapshot.size}개`);
    console.log(`  - 프로그램 신청: ${applicationsSnapshot.size}개`);
    console.log(`  - 프로그램: ${programsSnapshot.size}개`);
    console.log('');
    console.log('🔒 보존된 데이터:');
    console.log('  - 시설(facilities) 데이터는 유지됨');
    console.log('');
    console.log('🚀 이제 깨끗한 상태입니다!');
    console.log('브라우저에서 새로 회원가입을 진행해주세요.');

  } catch (error) {
    console.error('❌ 데이터 삭제 중 오류 발생:', error);

    if (error.code === 'permission-denied') {
      console.log('');
      console.log('🔧 권한 문제로 삭제 실패');
      console.log('수동으로 Firebase Console에서 삭제해주세요:');
      console.log('');
      console.log('1. Firebase Console 접속');
      console.log('2. Firestore Database 메뉴');
      console.log('3. 다음 컬렉션들을 삭제:');
      console.log('   - users');
      console.log('   - bookings');
      console.log('   - programApplications');
      console.log('   - programs');
      console.log('');
      console.log('4. Firebase Console > Authentication > Users');
      console.log('5. 모든 사용자 삭제');
    }

    throw error;
  }
}

// 추가로 Firebase Authentication 사용자들도 삭제 안내
console.log('⚠️  참고사항:');
console.log('Firestore 데이터만 삭제됩니다.');
console.log('Firebase Authentication의 사용자 계정들은 수동으로 삭제해주세요:');
console.log('');
console.log('📱 Firebase Console > Authentication > Users에서:');
console.log('- admin@flexspace.test');
console.log('- flexadmin@test.com');
console.log('- testadmin@flexspace.com');
console.log('- 기타 테스트 계정들을 수동 삭제');
console.log('');

clearAllData()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });