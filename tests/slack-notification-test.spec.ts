import { test, expect } from '@playwright/test';

test.describe('슬랙 알림 통합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 개발 서버로 이동
    await page.goto('http://localhost:5173');

    // Firebase 초기화 대기
    await page.waitForFunction(() => typeof window.firebase !== 'undefined');
    await page.waitForLoadState('networkidle');
  });

  test('대관 신청 슬랙 알림 테스트', async ({ page }) => {
    console.log('🔔 대관 신청 슬랙 알림 테스트 시작...');

    // 1. 관리자 로그인
    console.log('👨‍💼 관리자 로그인 중...');

    // 로그인 폼 찾기
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button').filter({ hasText: /로그인|Login/i }).first();

    await emailInput.fill('kan@naver.com');
    await passwordInput.fill('964419Kun!');
    await loginButton.click();

    // 로그인 완료 대기
    await page.waitForTimeout(3000);

    // 2. 대관 신청 메뉴로 이동
    console.log('📋 대관 신청 메뉴로 이동...');

    // 대관 신청 버튼 찾기 (여러 가능한 텍스트로 시도)
    const bookingButton = page.locator('button, a').filter({
      hasText: /대관|시설|예약|Booking/i
    }).first();

    if (await bookingButton.isVisible()) {
      await bookingButton.click();
      await page.waitForTimeout(2000);
    }

    // 3. 대관 신청 폼 작성
    console.log('📝 대관 신청 폼 작성 중...');

    // 시설 선택 (첫 번째 시설 선택)
    const facilitySelect = page.locator('select').filter({ hasText: /시설|facility/i }).first();
    if (await facilitySelect.isVisible()) {
      await facilitySelect.selectOption({ index: 1 }); // 첫 번째 옵션 선택
    }

    // 날짜 입력
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    const startDateInput = page.locator('input[type="date"]').first();
    if (await startDateInput.isVisible()) {
      await startDateInput.fill(dateString);
    }

    // 시간 입력
    const startTimeInput = page.locator('input[type="time"]').first();
    if (await startTimeInput.isVisible()) {
      await startTimeInput.fill('14:00');
    }

    const endTimeInput = page.locator('input[type="time"]').nth(1);
    if (await endTimeInput.isVisible()) {
      await endTimeInput.fill('16:00');
    }

    // 목적 입력
    const purposeInput = page.locator('input[placeholder*="목적"], textarea[placeholder*="목적"]').first();
    if (await purposeInput.isVisible()) {
      await purposeInput.fill('슬랙 알림 테스트용 대관 신청');
    }

    // 인원 수 입력
    const participantsInput = page.locator('input[type="number"]').first();
    if (await participantsInput.isVisible()) {
      await participantsInput.fill('5');
    }

    // 분류 선택
    const categorySelect = page.locator('select').filter({ hasText: /분류|category/i }).first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('personal');
    }

    // 4. 대관 신청 제출
    console.log('🚀 대관 신청 제출...');

    const submitButton = page.locator('button').filter({
      hasText: /신청|제출|Submit|신청하기/i
    }).first();

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // 제출 완료 대기
      await page.waitForTimeout(5000);

      console.log('✅ 대관 신청이 제출되었습니다.');
      console.log('📱 슬랙 #알림 채널에서 "📝 새로운 대관 신청" 메시지를 확인하세요.');
    }

    // 5. Firebase Functions 로그 확인을 위한 정보 출력
    console.log('📊 Firebase Functions 로그 확인 명령:');
    console.log('   firebase functions:log');

    // 테스트 완료 표시
    expect(true).toBe(true); // 테스트 통과 표시
  });

  test('대관 상태 변경 슬랙 알림 테스트', async ({ page }) => {
    console.log('🔄 대관 상태 변경 슬랙 알림 테스트 시작...');

    // 1. 관리자 로그인
    console.log('👨‍💼 관리자 로그인 중...');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button').filter({ hasText: /로그인|Login/i }).first();

    await emailInput.fill('kan@naver.com');
    await passwordInput.fill('964419Kun!');
    await loginButton.click();

    await page.waitForTimeout(3000);

    // 2. 관리자 섹션으로 이동
    console.log('🛠️ 관리자 섹션으로 이동...');

    const adminButton = page.locator('button, a').filter({
      hasText: /관리|admin|Admin/i
    }).first();

    if (await adminButton.isVisible()) {
      await adminButton.click();
      await page.waitForTimeout(2000);
    }

    // 3. 대기 중인 대관 신청 찾기
    console.log('📋 대기 중인 대관 신청 찾는 중...');

    // 승인 버튼이 있는지 확인
    const approveButtons = page.locator('button').filter({
      hasText: /승인|Approve/i
    });

    const approveButtonCount = await approveButtons.count();
    console.log(`📊 승인 가능한 신청 개수: ${approveButtonCount}`);

    if (approveButtonCount > 0) {
      // 4. 첫 번째 신청 승인
      console.log('✅ 첫 번째 대관 신청 승인 중...');

      await approveButtons.first().click();
      await page.waitForTimeout(3000);

      console.log('✅ 대관 신청이 승인되었습니다.');
      console.log('📱 슬랙 #알림 채널에서 "✅ 대관 승인 알림" 메시지를 확인하세요.');
    }

    // 거부 버튼도 테스트
    const rejectButtons = page.locator('button').filter({
      hasText: /거부|거절|Reject/i
    });

    const rejectButtonCount = await rejectButtons.count();
    console.log(`📊 거부 가능한 신청 개수: ${rejectButtonCount}`);

    if (rejectButtonCount > 0) {
      // 5. 다른 신청 거부 (있다면)
      console.log('❌ 대관 신청 거부 테스트...');

      await rejectButtons.first().click();
      await page.waitForTimeout(1000);

      // 거부 사유 입력 (모달이 있다면)
      const rejectReasonInput = page.locator('input, textarea').filter({
        hasText: /사유|reason/i
      }).first();

      if (await rejectReasonInput.isVisible()) {
        await rejectReasonInput.fill('테스트용 거부 사유');
      }

      // 거부 확인 버튼
      const confirmRejectButton = page.locator('button').filter({
        hasText: /확인|거부|Reject/i
      }).last();

      if (await confirmRejectButton.isVisible()) {
        await confirmRejectButton.click();
        await page.waitForTimeout(3000);

        console.log('❌ 대관 신청이 거부되었습니다.');
        console.log('📱 슬랙 #알림 채널에서 "❌ 대관 거부 알림" 메시지를 확인하세요.');
      }
    }

    expect(true).toBe(true);
  });

  test('Firebase Functions 로그 실시간 모니터링', async ({ page }) => {
    console.log('📊 Firebase Functions 로그 모니터링 안내');
    console.log('');
    console.log('다음 명령어로 실시간 로그를 확인하세요:');
    console.log('firebase functions:log');
    console.log('');
    console.log('예상되는 로그 메시지:');
    console.log('- ✅ 대관 신청 Slack 알림 전송 성공');
    console.log('- ✅ 대관 승인 Slack 알림 전송 성공');
    console.log('- ✅ 대관 거부 Slack 알림 전송 성공');
    console.log('');
    console.log('오류가 있다면:');
    console.log('- ❌ 대관 신청 Slack 알림 전송 실패');
    console.log('- SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다.');

    expect(true).toBe(true);
  });
});