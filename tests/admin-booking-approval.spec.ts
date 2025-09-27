import { test, expect } from '@playwright/test'

test.describe('관리자 대관 승인 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 개발 서버로 이동
    await page.goto('/')

    // 관리자 버튼 클릭
    await page.getByRole('button', { name: '관리자' }).click();

    // 관리자 로그인 정보 입력
    await page.fill('input[placeholder*="이메일"]', 'admin@flexspace.test');
    await page.fill('input[placeholder*="비밀번호"]', 'FlexAdmin2025!');

    // 관리자 로그인 버튼 클릭
    await page.getByRole('button', { name: '관리자 로그인' }).click();

    // 로그인 완료 대기
    await expect(page.locator('text=관리자')).toBeVisible();

    // 운영 관리 메뉴로 이동
    await page.getByRole('button', { name: /운영/ }).click();
  })

  test('대관 승인 기능 테스트', async ({ page }) => {
    console.log('=== 관리자 대관 승인 테스트 시작 ===')

    // 대기 중인 대관 신청이 있는지 확인
    const pendingBookings = await page.locator('.bg-gray-50:has(button:has-text("승인"))')
    const bookingCount = await pendingBookings.count()

    console.log(`대기 중인 대관 신청 수: ${bookingCount}`)

    if (bookingCount === 0) {
      console.log('대기 중인 대관 신청이 없습니다.')
      return
    }

    // 첫 번째 대관 신청의 승인 버튼 클릭
    const firstApproveButton = pendingBookings.first().locator('button:has-text("승인")')

    // 콘솔 로그 캡처
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`)
    })

    // 네트워크 요청 모니터링
    const networkRequests: any[] = []
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      })
    })

    // 네트워크 응답 모니터링
    const networkResponses: any[] = []
    page.on('response', (response) => {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      })
    })

    console.log('승인 버튼 클릭 전 상태 확인...')

    // 승인 버튼 클릭
    await firstApproveButton.click()

    // 잠시 대기하여 네트워크 요청과 응답 확인
    await page.waitForTimeout(3000)

    console.log('=== 콘솔 로그 ===')
    consoleLogs.forEach(log => console.log(log))

    console.log('=== 네트워크 요청 ===')
    networkRequests.forEach(req => {
      if (req.url.includes('firestore') || req.url.includes('firebase')) {
        console.log(`${req.method} ${req.url}`)
      }
    })

    console.log('=== 네트워크 응답 ===')
    networkResponses.forEach(res => {
      if (res.url.includes('firestore') || res.url.includes('firebase')) {
        console.log(`${res.status} ${res.statusText} - ${res.url}`)
      }
    })

    // 성공 또는 오류 메시지 확인
    const successMessage = page.locator('text=승인되었습니다')
    const errorMessage = page.locator('text=실패했습니다')

    const hasSuccess = await successMessage.isVisible()
    const hasError = await errorMessage.isVisible()

    console.log(`성공 메시지 표시: ${hasSuccess}`)
    console.log(`오류 메시지 표시: ${hasError}`)

    if (hasError) {
      const errorText = await errorMessage.textContent()
      console.log(`오류 내용: ${errorText}`)
    }

    // 테스트 결과 검증
    if (hasError) {
      console.log('❌ 대관 승인 실패 - 오류 발생')
      throw new Error('대관 승인 처리 중 오류 발생')
    } else if (hasSuccess) {
      console.log('✅ 대관 승인 성공')
    } else {
      console.log('⚠️ 명확한 결과를 확인할 수 없음')
    }
  })

  test('Firebase 연결 상태 확인', async ({ page }) => {
    console.log('=== Firebase 연결 상태 확인 ===')

    // Firebase 초기화 관련 콘솔 로그 캡처
    const firebaseInfo: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('Firebase') || text.includes('firestore') || text.includes('auth')) {
        firebaseInfo.push(`${msg.type()}: ${text}`)
      }
    })

    // 페이지 새로고침으로 Firebase 초기화 로그 확인
    await page.reload()
    await page.waitForTimeout(2000)

    console.log('Firebase 관련 로그:')
    firebaseInfo.forEach(log => console.log(log))
  })
})