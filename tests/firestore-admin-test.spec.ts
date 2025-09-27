import { test, expect } from '@playwright/test'

test.describe('Firestore 관리자 권한 테스트', () => {
  test('관리자 권한 및 대관 데이터 확인', async ({ page }) => {
    console.log('=== Firestore 관리자 권한 테스트 시작 ===')

    // 개발 서버로 이동
    await page.goto('/')

    // 페이지 로드 및 Firebase 초기화 대기
    await page.waitForTimeout(2000)

    // 브라우저 콘솔에서 Firebase/Firestore 상태 확인
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })

    // Firestore 상태 확인 스크립트 실행
    const firestoreStatus = await page.evaluate(async () => {
      try {
        // Firebase 모듈들 import
        const { auth } = await import('/src/firebase.ts')
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('/src/firebase.ts')

        console.log('Firebase 모듈 import 성공')

        // 관리자 로그인 시도
        const userCredential = await signInWithEmailAndPassword(auth, 'admin@flexspace.test', 'FlexAdmin2025!')
        console.log('관리자 로그인 성공:', userCredential.user.uid)

        // 현재 사용자의 Firestore 문서 확인
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
        console.log('사용자 문서 존재:', userDoc.exists())

        if (userDoc.exists()) {
          const userData = userDoc.data()
          console.log('사용자 데이터:', userData)
          return {
            success: true,
            userExists: true,
            userData: userData,
            uid: userCredential.user.uid
          }
        } else {
          console.log('사용자 문서가 존재하지 않음')
          return {
            success: true,
            userExists: false,
            uid: userCredential.user.uid
          }
        }
      } catch (error) {
        console.error('Firestore 테스트 오류:', error)
        return {
          success: false,
          error: error.message
        }
      }
    })

    console.log('Firestore 상태 결과:', firestoreStatus)

    // 관리자 문서가 없다면 생성
    if (firestoreStatus.success && !firestoreStatus.userExists) {
      console.log('관리자 사용자 문서 생성 중...')

      await page.evaluate(async (uid) => {
        try {
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
          const { db } = await import('/src/firebase.ts')

          await setDoc(doc(db, 'users', uid), {
            name: 'Admin User',
            email: 'admin@flexspace.test',
            role: 'admin',
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })

          console.log('관리자 사용자 문서 생성 완료')
        } catch (error) {
          console.error('관리자 문서 생성 실패:', error)
        }
      }, firestoreStatus.uid)
    }

    // 테스트용 대관 데이터 생성
    await page.evaluate(async () => {
      try {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
        const { db } = await import('/src/firebase.ts')

        const testBookingId = `test-booking-${Date.now()}`

        await setDoc(doc(db, 'bookings', testBookingId), {
          id: testBookingId,
          userId: 'test-user-id',
          userName: 'kun6@naver.com',
          userEmail: 'kun6@naver.com',
          facilityId: 'facility-1',
          startDate: '2025-09-27',
          endDate: '2025-09-27',
          startTime: '09:00',
          endTime: '10:00',
          purpose: '달리기',
          category: 'personal',
          status: 'pending',
          numberOfParticipants: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        console.log('테스트 대관 데이터 생성 완료:', testBookingId)
        return testBookingId
      } catch (error) {
        console.error('테스트 데이터 생성 실패:', error)
        return null
      }
    })

    console.log('=== 콘솔 로그 ===')
    consoleLogs.forEach(log => console.log(log))

    console.log('✅ Firestore 관리자 권한 테스트 완료')
  })
})