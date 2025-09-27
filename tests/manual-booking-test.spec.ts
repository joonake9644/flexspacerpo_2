import { test, expect } from '@playwright/test'

test.describe('수동 대관 승인 테스트', () => {
  test('관리자 로그인 및 대관 승인 확인', async ({ page }) => {
    console.log('=== 수동 대관 승인 테스트 시작 ===')

    // 개발 서버로 이동
    await page.goto('http://localhost:5173/')
    await page.waitForTimeout(2000)

    // 콘솔 로그 캡처
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })

    try {
      // 먼저 브라우저에서 직접 테스트 대관 데이터 생성
      await page.evaluate(async () => {
        try {
          const { doc, setDoc } = await import('firebase/firestore')
          const { db } = await import('./firebase.ts')

          const testBookingId = `test-booking-${Date.now()}`

          await setDoc(doc(db, 'bookings', testBookingId), {
            id: testBookingId,
            userId: 'test-user-kun6',
            userName: 'kun6@naver.com',
            userEmail: 'kun6@naver.com',
            facilityId: 'facility-1',
            startDate: '2025-09-28',
            endDate: '2025-09-28',
            startTime: '09:00',
            endTime: '10:00',
            purpose: '테스트 대관 승인',
            category: 'personal',
            status: 'pending',
            numberOfParticipants: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          })

          console.log('✅ 테스트 대관 데이터 생성:', testBookingId)
        } catch (error) {
          console.error('❌ 테스트 데이터 생성 실패:', error)
        }
      })

      await page.waitForTimeout(2000)

      // 관리자 버튼 클릭 (더 구체적인 선택자 사용)
      await page.getByRole('button', { name: '관리자', exact: true }).first().click()
      await page.waitForTimeout(1000)

      // 관리자 로그인 정보 입력
      await page.fill('input[placeholder*="이메일"]', 'flexadmin@test.com')
      await page.fill('input[placeholder*="비밀번호"]', 'AdminTest2025!')

      // 관리자 로그인 버튼 클릭
      await page.getByRole('button', { name: '관리자 로그인' }).click()
      await page.waitForTimeout(3000)

      // 운영 관리 메뉴로 이동
      const operationButton = page.getByRole('button', { name: /운영/ })
      if (await operationButton.isVisible()) {
        await operationButton.click()
        await page.waitForTimeout(2000)
        console.log('✅ 운영 관리 메뉴 접근 성공')
      } else {
        console.log('❌ 운영 관리 메뉴를 찾을 수 없음')
      }

      // 대기 중인 대관 신청 섹션 확인
      const bookingSection = page.locator('h3:has-text("사용자 대관 신청 대기")')
      await page.waitForTimeout(2000)

      if (await bookingSection.isVisible()) {
        console.log('📋 대관 신청 대기 섹션 발견')

        // 더 구체적인 승인 버튼 선택자 사용 - 대관 섹션 내에서만 찾기
        const bookingContainer = page.locator('h3:has-text("사용자 대관 신청 대기")').locator('..').locator('..')
        const approveButtons = bookingContainer.locator('button').filter({ hasText: '승인' })
        const buttonCount = await approveButtons.count()
        console.log(`🔍 대관 승인 버튼 개수: ${buttonCount}`)

        if (buttonCount > 0) {
          console.log('🔍 승인 버튼 발견 - 클릭 준비')

          // 첫 번째 승인 버튼 클릭
          await approveButtons.first().click()
          await page.waitForTimeout(5000)

          // 성공/실패 메시지 확인
          const successMessage = page.locator('text=승인되었습니다')
          const errorMessage = page.locator('text=실패했습니다')

          const hasSuccess = await successMessage.isVisible()
          const hasError = await errorMessage.isVisible()

          if (hasSuccess) {
            console.log('✅ 대관 승인 성공!')
          } else if (hasError) {
            console.log('❌ 대관 승인 실패 - 오류 발생')
          } else {
            console.log('⚠️ 명확한 결과를 확인할 수 없음')
          }
        } else {
          console.log('⚠️ 대관 승인 버튼을 찾을 수 없음')
        }
      } else {
        console.log('📝 대관 신청 대기 섹션을 찾을 수 없음')
      }

    } catch (error) {
      console.error('테스트 실행 중 오류:', error)
    }

    // 콘솔 로그 출력
    console.log('=== 브라우저 콘솔 로그 ===')
    consoleLogs.forEach(log => {
      if (log.includes('Firebase') || log.includes('admin') || log.includes('승인') || log.includes('error')) {
        console.log(log)
      }
    })

    console.log('=== 수동 테스트 완료 ===')
  })
})