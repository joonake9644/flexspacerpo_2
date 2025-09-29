const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDPZXlAVXFGQJk0DPaLJYU0-1K8QZC2YmE",
  authDomain: "flexspaceprowin.firebaseapp.com",
  projectId: "flexspaceprowin",
  storageBucket: "flexspaceprowin.appspot.com",
  messagingSenderId: "740169974418",
  appId: "1:740169974418:web:4e69f3a7a2e6b1e8c1b4a3",
  measurementId: "G-96L5Q3JW2N"
};

async function testSlackNotification() {
  console.log('🔔 슬랙 알림 테스트 시작...');

  try {
    // Firebase 초기화
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);

    // 관리자 로그인
    console.log('👨‍💼 관리자로 로그인 중...');
    const userCredential = await signInWithEmailAndPassword(auth, 'kan@naver.com', '964419Kun!');
    console.log('✅ 로그인 성공:', userCredential.user.email);

    // createBooking 함수 호출
    console.log('📋 대관 신청 생성 중...');
    const createBooking = httpsCallable(functions, 'createBooking');

    const bookingData = {
      facilityId: 'fac1', // 헬스장 ID
      startDate: '2025-09-30',
      endDate: '2025-09-30',
      startTime: '14:00',
      endTime: '16:00',
      purpose: '슬랙 알림 테스트용 대관 신청',
      category: 'personal',
      organization: '',
      numberOfParticipants: 5
    };

    const result = await createBooking(bookingData);
    console.log('✅ 대관 신청 생성 성공:', result.data);
    console.log('📱 슬랙 #알림 채널을 확인하세요!');

    // Firebase Functions 로그 확인 안내
    console.log('');
    console.log('📊 Firebase Functions 로그 확인:');
    console.log('   firebase functions:log');
    console.log('');
    console.log('예상되는 로그 메시지:');
    console.log('   ✅ 대관 신청 Slack 알림 전송 성공');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    if (error.code) {
      console.error('오류 코드:', error.code);
    }
    if (error.message) {
      console.error('오류 메시지:', error.message);
    }
  }
}

// 테스트 실행
testSlackNotification();