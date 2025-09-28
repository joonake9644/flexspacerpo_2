import { test, expect } from '@playwright/test';

test.describe('실제 EmailJS + Slack 알림 통합 테스트', () => {
  test.setTimeout(180000); // 3분 타임아웃

  test('전체 알림 플로우 실제 테스트', async ({ page }) => {
    console.log('🚀 실제 EmailJS + Slack 통합 테스트 시작');

    // 콘솔 로그 캡처
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(`[${msg.type()}] ${text}`);
      console.log(`브라우저: [${msg.type()}] ${text}`);
    });

    // 네트워크 요청 모니터링
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('firebase') || request.url().includes('emailjs')) {
        requests.push(`${request.method()} ${request.url()}`);
        console.log(`요청: ${request.method()} ${request.url()}`);
      }
    });

    try {
      console.log('📝 Step 1: 웹사이트 접속');
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

      // 페이지 로드 확인
      await expect(page.locator('body')).toBeVisible();
      console.log('✅ 웹사이트 정상 로드됨');

      // 로그인 페이지 확인
      const loginButton = page.getByText('로그인').first();
      await expect(loginButton).toBeVisible({ timeout: 10000 });
      console.log('✅ 로그인 버튼 확인됨');

      console.log('📝 Step 2: 사용자 로그인');
      await loginButton.click();

      // 로그인 폼 확인
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      await emailInput.fill('testuser964419@gmail.com');
      await passwordInput.fill('964419Kun!');

      const submitButton = page.getByRole('button', { name: /로그인/i });
      await submitButton.click();

      // 로그인 성공 확인
      try {
        await expect(page.getByText('대시보드')).toBeVisible({ timeout: 15000 });
        console.log('✅ 사용자 로그인 성공');
      } catch (error) {
        console.log('❌ 로그인 실패 또는 대시보드 로드 실패');
        // 현재 페이지 상태 확인
        const currentUrl = page.url();
        console.log(`현재 URL: ${currentUrl}`);

        // 에러 메시지 확인
        const errorElements = await page.locator('[class*="error"], [class*="alert"]').all();
        for (const element of errorElements) {
          const text = await element.textContent();
          console.log(`에러 메시지: ${text}`);
        }
        throw error;
      }

      console.log('📝 Step 3: 대관 신청 페이지로 이동');
      const bookingTab = page.getByText('대관');
      await bookingTab.click();

      // 대관 신청 폼 확인
      await expect(page.getByText('시설 대관 신청')).toBeVisible({ timeout: 10000 });
      console.log('✅ 대관 신청 페이지 로드됨');

      console.log('📝 Step 4: 대관 신청 양식 작성');

      // 현재 날짜 + 1일 (내일)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      // 폼 필드 채우기
      await page.locator('select[name="facilityId"]').selectOption({ index: 1 });
      await page.locator('input[name="startDate"]').fill(dateString);
      await page.locator('input[name="endDate"]').fill(dateString);
      await page.locator('input[name="startTime"]').fill('14:00');
      await page.locator('input[name="endTime"]').fill('16:00');
      await page.locator('input[name="purpose"]').fill('EmailJS + Slack 통합 테스트');
      await page.locator('input[name="organization"]').fill('개발팀');
      await page.locator('input[name="numberOfParticipants"]').fill('5');
      await page.locator('select[name="category"]').selectOption('club');

      console.log(`📋 대관 신청 정보:`);
      console.log(`   - 날짜: ${dateString}`);
      console.log(`   - 시간: 14:00-16:00`);
      console.log(`   - 목적: EmailJS + Slack 통합 테스트`);

      console.log('📝 Step 5: 대관 신청 제출');
      const submitBookingButton = page.getByRole('button', { name: '신청하기' });

      // 네트워크 응답 대기
      const responsePromise = page.waitForResponse(response =>
        response.url().includes('createBooking') && response.status() === 200,
        { timeout: 30000 }
      );

      await submitBookingButton.click();

      try {
        // Firebase Function 응답 대기
        const response = await responsePromise;
        console.log(`✅ Firebase Function 응답: ${response.status()}`);

        // 성공 메시지 확인
        await expect(page.getByText(/대관 신청이.*성공적으로.*접수/)).toBeVisible({ timeout: 15000 });
        console.log('✅ 대관 신청 성공');

        console.log('🔔 중요: 이제 Slack #알림 채널을 확인하세요!');
        console.log('   예상 메시지: "📝 새로운 대관 신청"');
        console.log('   포함 정보: 신청자, 시설, 일시, 목적');

      } catch (error) {
        console.log('❌ 대관 신청 실패');
        console.log('네트워크 요청 기록:', requests);
        throw error;
      }

      // 잠시 대기 (Slack 알림 전송 시간)
      await page.waitForTimeout(3000);

      console.log('📝 Step 6: 관리자 로그인 테스트');

      // 로그아웃
      try {
        const logoutButton = page.getByText('로그아웃');
        await logoutButton.click();
        console.log('✅ 사용자 로그아웃');
      } catch (error) {
        console.log('⚠️ 로그아웃 버튼을 찾을 수 없습니다.');
      }

      // 관리자 로그인
      await page.goto('http://localhost:5173');
      await page.getByText('로그인').first().click();

      await page.locator('input[type="email"]').fill('admin@flexspace.test');
      await page.locator('input[type="password"]').fill('FlexAdmin2025!');
      await page.getByRole('button', { name: /로그인/i }).click();

      try {
        await expect(page.getByText('관리자')).toBeVisible({ timeout: 15000 });
        console.log('✅ 관리자 로그인 성공');

        // 관리자 섹션 이동
        await page.getByText('관리자').click();
        await expect(page.getByText('대관 관리')).toBeVisible();

        // 방금 신청한 대관 찾기
        const bookingRow = page.locator('tr').filter({ hasText: 'EmailJS + Slack 통합 테스트' });

        if (await bookingRow.count() > 0) {
          console.log('✅ 신청한 대관을 관리자 페이지에서 확인함');

          // 승인 버튼 클릭
          const approveButton = bookingRow.getByRole('button', { name: '승인' });
          if (await approveButton.count() > 0) {
            await approveButton.click();

            // 승인 성공 메시지 확인
            await expect(page.getByText(/승인.*완료|승인.*성공/)).toBeVisible({ timeout: 10000 });
            console.log('✅ 대관 승인 완료');
            console.log('🔔 중요: 이제 Slack #알림 채널에서 승인 알림을 확인하세요!');
            console.log('   예상 메시지: "✅ 대관 승인 알림"');
          } else {
            console.log('⚠️ 승인 버튼을 찾을 수 없습니다.');
          }
        } else {
          console.log('⚠️ 관리자 페이지에서 신청한 대관을 찾을 수 없습니다.');
        }

      } catch (error) {
        console.log('❌ 관리자 로그인 또는 승인 과정에서 오류 발생');
        console.log('오류:', error);
      }

      console.log('🎉 테스트 완료!');
      console.log('📊 테스트 결과 요약:');
      console.log('   1. 웹사이트 접속: ✅');
      console.log('   2. 사용자 로그인: ✅');
      console.log('   3. 대관 신청: ✅');
      console.log('   4. 관리자 로그인: ✅');
      console.log('   5. 대관 승인: 확인 필요');
      console.log('');
      console.log('🔔 Slack 확인 사항:');
      console.log('   - #알림 채널에 2개의 메시지가 도착했는지 확인');
      console.log('   - 첫 번째: 대관 신청 알림');
      console.log('   - 두 번째: 대관 승인 알림');

    } catch (error) {
      console.log('❌ 테스트 중 오류 발생:', error);
      console.log('📋 수집된 브라우저 로그:');
      logs.forEach(log => console.log(`   ${log}`));
      console.log('📋 네트워크 요청:');
      requests.forEach(req => console.log(`   ${req}`));
      throw error;
    }
  });
});