// Create test booking with pending status
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function createTestBooking() {
  try {
    const testBookingId = `test-booking-${Date.now()}`

    await setDoc(doc(db, 'bookings', testBookingId), {
      id: testBookingId,
      userId: 'test-user-id',
      userName: 'kun6@naver.com',
      userEmail: 'kun6@naver.com',
      facilityId: 'facility-1',
      startDate: '2025-09-28',
      endDate: '2025-09-28',
      startTime: '09:00',
      endTime: '10:00',
      purpose: '달리기 테스트',
      category: 'personal',
      status: 'pending', // 중요: pending 상태로 설정
      numberOfParticipants: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log('✅ 테스트 대관 데이터 생성 완료:', testBookingId)
    console.log('📋 상태: pending (승인 대기 중)')

  } catch (error) {
    console.error('❌ 테스트 데이터 생성 실패:', error)
  }
}

createTestBooking()