import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { getAuth, deleteUser, signOut } from 'firebase/auth';
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

async function cleanupUserData() {
  console.log('🧹 사용자 데이터 정리 시작...');

  try {
    // 1. 대관 신청(bookings) 데이터 삭제
    console.log('📅 대관 신청 데이터 삭제 중...');
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    for (const docSnapshot of bookingsSnapshot.docs) {
      await deleteDoc(doc(db, 'bookings', docSnapshot.id));
    }
    console.log(`✅ ${bookingsSnapshot.size}개의 대관 신청 삭제됨`);

    // 2. 프로그램 신청(programApplications) 데이터 삭제
    console.log('🏃 프로그램 신청 데이터 삭제 중...');
    const applicationsSnapshot = await getDocs(collection(db, 'programApplications'));
    for (const docSnapshot of applicationsSnapshot.docs) {
      await deleteDoc(doc(db, 'programApplications', docSnapshot.id));
    }
    console.log(`✅ ${applicationsSnapshot.size}개의 프로그램 신청 삭제됨`);

    // 3. 프로그램(programs) 데이터 삭제
    console.log('📚 프로그램 데이터 삭제 중...');
    const programsSnapshot = await getDocs(collection(db, 'programs'));
    for (const docSnapshot of programsSnapshot.docs) {
      await deleteDoc(doc(db, 'programs', docSnapshot.id));
    }
    console.log(`✅ ${programsSnapshot.size}개의 프로그램 삭제됨`);

    // 4. 일반 사용자 데이터 삭제 (관리자 제외)
    console.log('👥 일반 사용자 데이터 삭제 중...');
    const adminEmails = ['admin@flexspace.test', 'flexadmin@test.com', 'joonake@naver.com'];

    const usersSnapshot = await getDocs(collection(db, 'users'));
    let deletedUserCount = 0;

    for (const docSnapshot of usersSnapshot.docs) {
      const userData = docSnapshot.data();

      // 관리자 계정이 아닌 경우에만 삭제
      if (!adminEmails.includes(userData.email) && userData.role !== 'admin') {
        await deleteDoc(doc(db, 'users', docSnapshot.id));
        deletedUserCount++;
      }
    }
    console.log(`✅ ${deletedUserCount}개의 일반 사용자 삭제됨`);

    console.log('🎉 데이터 정리 완료!');
    console.log('');
    console.log('📋 정리된 데이터:');
    console.log(`  - 대관 신청: ${bookingsSnapshot.size}개`);
    console.log(`  - 프로그램 신청: ${applicationsSnapshot.size}개`);
    console.log(`  - 프로그램: ${programsSnapshot.size}개`);
    console.log(`  - 일반 사용자: ${deletedUserCount}개`);
    console.log('');
    console.log('🔒 보존된 데이터:');
    console.log('  - 관리자 계정 유지됨');
    console.log('  - 시설(facilities) 데이터 유지됨');

  } catch (error) {
    console.error('❌ 데이터 정리 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
cleanupUserData()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });