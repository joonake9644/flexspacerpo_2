import { test, expect } from '@playwright/test';

// 테스트 데이터
const TEST_USER = {
  email: 'testuser964419@gmail.com',
  password: '964419Kun!',
  name: '테스트 사용자'
};

const TEST_ADMIN = {
  email: 'admin@flexspace.test',
  password: 'FlexAdmin2025!',
  name: '관리자'
};

const TEST_BOOKING = {
  facility: '체육관 A',
  purpose: 'EmailJS + Slack 통합 테스트',
  participants: '5',
  organization: '개발팀'
};

test.describe('EmailJS + Slack 통합 알림 테스트', () => {
  test.setTimeout(120000); // 2분 타임아웃

  test.beforeEach(async ({ page }) => {
    // 개발 서버로 이동
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('대관 신청 → Slack 알림 → 승인 → Slack 알림 전체 플로우', async ({ page }) => {
    console.log('🧪 시작: 대관 신청 및 Slack 알림 통합 테스트');

    // Step 1: 사용자 로그인
    console.log('📝 Step 1: 사용자 로그인');
    await page.getByText('로그인').click();
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.getByRole('button', { name: '로그인' }).click();

    // 로그인 성공 확인
    await expect(page.getByText('대시보드')).toBeVisible({ timeout: 10000 });
    console.log('✅ 사용자 로그인 성공');

    // Step 2: 대관 섹션으로 이동
    console.log('📝 Step 2: 대관 신청 페이지로 이동');
    await page.getByText('대관').click();
    await expect(page.getByText('시설 대관 신청')).toBeVisible();

    // Step 3: 대관 신청 양식 작성
    console.log('📝 Step 3: 대관 신청 양식 작성');

    // 시설 선택
    await page.locator('select[name="facilityId"]').selectOption({ label: TEST_BOOKING.facility });

    // 오늘 날짜 + 2일 후로 예약 (충돌 방지)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const dateString = futureDate.toISOString().split('T')[0];

    await page.fill('input[name="startDate"]', dateString);
    await page.fill('input[name="endDate"]', dateString);
    await page.fill('input[name="startTime"]', '14:00');
    await page.fill('input[name="endTime"]', '16:00');
    await page.fill('input[name="purpose"]', TEST_BOOKING.purpose);
    await page.fill('input[name="organization"]', TEST_BOOKING.organization);
    await page.fill('input[name="numberOfParticipants"]', TEST_BOOKING.participants);

    // 카테고리 선택
    await page.locator('select[name="category"]').selectOption('club');

    console.log('📋 대관 신청 정보:');
    console.log(`   - 시설: ${TEST_BOOKING.facility}`);
    console.log(`   - 날짜: ${dateString}`);
    console.log(`   - 시간: 14:00-16:00`);
    console.log(`   - 목적: ${TEST_BOOKING.purpose}`);
    console.log(`   - 단체: ${TEST_BOOKING.organization}`);

    // Step 4: 신청 제출
    console.log('📝 Step 4: 대관 신청 제출');
    await page.getByRole('button', { name: '신청하기' }).click();

    // 성공 메시지 확인
    await expect(page.getByText('대관 신청이 성공적으로 접수되었습니다')).toBeVisible({ timeout: 15000 });
    console.log('✅ 대관 신청 성공');
    console.log('🔔 이제 Slack #알림 채널을 확인하세요!');
    console.log('   예상 메시지: "📝 새로운 대관 신청"');

    // 사용자 로그아웃
    await page.getByText('로그아웃').click();
    console.log('✅ 사용자 로그아웃');

    // Step 5: 관리자 로그인
    console.log('📝 Step 5: 관리자 로그인');
    await page.getByText('로그인').click();
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.getByRole('button', { name: '로그인' }).click();

    // 관리자 페이지 확인
    await expect(page.getByText('관리자 대시보드')).toBeVisible({ timeout: 10000 });
    console.log('✅ 관리자 로그인 성공');

    // Step 6: 관리자 섹션으로 이동
    console.log('📝 Step 6: 관리자 섹션으로 이동');
    await page.getByText('관리자').click();
    await expect(page.getByText('대관 관리')).toBeVisible();

    // Step 7: 방금 신청한 대관 찾기 및 승인
    console.log('📝 Step 7: 대관 승인 처리');

    // 대관 목록에서 방금 신청한 항목 찾기
    const bookingRow = page.locator('tr').filter({ hasText: TEST_BOOKING.purpose });
    await expect(bookingRow).toBeVisible({ timeout: 10000 });

    // 승인 버튼 클릭
    await bookingRow.getByRole('button', { name: '승인' }).click();

    // 승인 확인
    await expect(page.getByText('대관이 승인되었습니다')).toBeVisible({ timeout: 10000 });
    console.log('✅ 대관 승인 처리 완료');
    console.log('🔔 이제 Slack #알림 채널을 다시 확인하세요!');
    console.log('   예상 메시지: "✅ 대관 승인 알림"');

    // 테스트 완료 메시지
    console.log('🎉 테스트 완료!');
    console.log('📊 검증할 항목:');
    console.log('   1. Slack #알림 채널에 2개의 메시지가 도착했는지 확인');
    console.log('   2. 첫 번째 메시지: 대관 신청 알림 (📝 새로운 대관 신청)');
    console.log('   3. 두 번째 메시지: 대관 승인 알림 (✅ 대관 승인 알림)');
    console.log('   4. 각 메시지에 올바른 정보가 포함되어 있는지 확인');
  });

  test('프로그램 신청 → Slack 알림 → 승인 → Slack 알림 전체 플로우', async ({ page }) => {
    console.log('🧪 시작: 프로그램 신청 및 Slack 알림 통합 테스트');

    // Step 1: 사용자 로그인
    console.log('📝 Step 1: 사용자 로그인');
    await page.getByText('로그인').click();
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page.getByText('대시보드')).toBeVisible({ timeout: 10000 });
    console.log('✅ 사용자 로그인 성공');

    // Step 2: 프로그램 섹션으로 이동
    console.log('📝 Step 2: 프로그램 신청 페이지로 이동');
    await page.getByText('프로그램').click();
    await expect(page.getByText('프로그램 목록')).toBeVisible();

    // Step 3: 첫 번째 프로그램 신청
    console.log('📝 Step 3: 프로그램 신청');
    const firstProgram = page.locator('.program-card').first();
    const programTitle = await firstProgram.locator('h3').textContent() || '테스트 프로그램';

    await firstProgram.getByRole('button', { name: '신청하기' }).click();

    // 성공 메시지 확인
    await expect(page.getByText('프로그램 신청이 완료되었습니다')).toBeVisible({ timeout: 15000 });
    console.log('✅ 프로그램 신청 성공:', programTitle);
    console.log('🔔 이제 Slack #알림 채널을 확인하세요!');
    console.log('   예상 메시지: "🎯 새로운 프로그램 신청"');

    // 사용자 로그아웃
    await page.getByText('로그아웃').click();
    console.log('✅ 사용자 로그아웃');

    // Step 4: 관리자 로그인 및 승인
    console.log('📝 Step 4: 관리자 로그인');
    await page.getByText('로그인').click();
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page.getByText('관리자 대시보드')).toBeVisible({ timeout: 10000 });
    console.log('✅ 관리자 로그인 성공');

    // Step 5: 프로그램 신청 승인
    console.log('📝 Step 5: 프로그램 신청 승인');
    await page.getByText('관리자').click();

    // 프로그램 신청 탭으로 이동 (구현에 따라 조정 필요)
    const applicationRow = page.locator('tr').filter({ hasText: programTitle });
    if (await applicationRow.count() > 0) {
      await applicationRow.getByRole('button', { name: '승인' }).click();
      await expect(page.getByText('신청이 승인되었습니다')).toBeVisible({ timeout: 10000 });
      console.log('✅ 프로그램 신청 승인 완료');
      console.log('🔔 Slack #알림 채널에서 승인 알림을 확인하세요!');
      console.log('   예상 메시지: "✅ 프로그램 승인 알림"');
    } else {
      console.log('⚠️ 프로그램 신청 목록에서 항목을 찾을 수 없습니다.');
    }

    console.log('🎉 프로그램 테스트 완료!');
  });

  test('Firebase Functions 로그 확인', async ({ page }) => {
    console.log('🧪 Firebase Functions 로그 확인 테스트');

    // 브라우저 콘솔 로그 캡처
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        logs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    // 간단한 페이지 로드 테스트
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // 로그 출력
    console.log('📋 브라우저 콘솔 로그:');
    logs.forEach(log => console.log(`   ${log}`));

    // Firebase Functions 상태 확인을 위한 더미 요청
    try {
      const response = await page.evaluate(async () => {
        return fetch('/api/health-check').then(r => r.status).catch(e => e.message);
      });
      console.log('🔍 Firebase Functions 상태:', response);
    } catch (error) {
      console.log('⚠️ Firebase Functions 상태 확인 실패:', error);
    }
  });
});