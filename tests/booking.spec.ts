import { test, expect } from '@playwright/test';

test.describe('체육관 대관 시스템', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 사용자로 로그인
    await page.goto('/');

    // 임시로 회원가입 및 로그인
    await page.getByRole('button', { name: '회원가입', exact: true }).first().click();

    const timestamp = Date.now();
    const testUserEmail = `testuser${timestamp}@test.com`;

    await page.fill('input[placeholder*="이름"]', '테스트 사용자');
    await page.fill('input[placeholder*="이메일"]', testUserEmail);
    await page.fill('input[placeholder*="비밀번호"][type="password"]', 'testpass123');
    await page.fill('input[placeholder*="비밀번호 확인"]', 'testpass123');

    await page.getByRole('button', { name: '회원가입 / Sign Up' }).click();

    // 개인정보 동의
    await page.getByRole('button', { name: '동의하고 계속하기' }).click();

    // 로그인 모드로 전환
    await page.getByRole('button', { name: '로그인', exact: true }).first().click();

    // 로그인
    await page.fill('input[placeholder*="이메일"]', testUserEmail);
    await page.fill('input[placeholder*="비밀번호"]', 'testpass123');
    await page.getByRole('button', { name: '로그인 / Login' }).click();

    // 체육관 대관 메뉴로 이동
    await page.getByRole('button', { name: '체육관 대관' }).click();
  });

  test('대관 신청 생성', async ({ page }) => {
    // 신규 대관 신청 폼 찾기
    await expect(page.locator('text=신규 대관 신청')).toBeVisible();

    // 대관 신청 정보 입력
    await page.fill('input[value=""][type="text"]', '테스트 대관 신청');

    // 분류 선택
    await page.selectOption('select', 'training');

    // 시설 선택 (첫 번째 available facility 선택)
    const facilitySelect = page.locator('select').nth(1); // 두 번째 select가 시설 선택
    await facilitySelect.selectOption({ index: 1 }); // 첫 번째 option은 "시설을 선택해 주세요"이므로 두 번째 선택

    // 날짜 설정 (오늘 날짜)
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').last();

    await startDateInput.fill(today);
    await endDateInput.fill(today);

    // 시간 설정
    const startTimeInput = page.locator('input[type="time"]').first();
    const endTimeInput = page.locator('input[type="time"]').last();

    await startTimeInput.fill('14:00');
    await endTimeInput.fill('16:00');

    // 대관 신청 버튼 클릭
    await page.getByRole('button', { name: '대관 신청' }).click();

    // 성공 알림 확인
    await expect(page.locator('text=예약 신청이 완료되었습니다')).toBeVisible();

    // 대관 목록에 추가되었는지 확인
    await expect(page.locator('text=테스트 대관 신청')).toBeVisible();
    await expect(page.locator('text=대기중')).toBeVisible();
  });

  test('대관 목록 보기 (목록/캘린더 전환)', async ({ page }) => {
    // 목록 뷰 확인
    await expect(page.getByRole('button', { name: '목록' })).toBeVisible();
    await expect(page.getByRole('button', { name: '캘린더' })).toBeVisible();

    // 캘린더 뷰로 전환
    await page.getByRole('button', { name: '캘린더' }).click();

    // 캘린더가 표시되는지 확인
    await expect(page.locator('text=2025년')).toBeVisible();
    await expect(page.locator('.grid.grid-cols-7')).toBeVisible();

    // 다시 목록 뷰로 전환
    await page.getByRole('button', { name: '목록' }).click();

    // 목록이 표시되는지 확인
    await expect(page.locator('text=진행중인 대관')).toBeVisible();
    await expect(page.locator('text=완료된 대관')).toBeVisible();
  });

  test('대관 신청 폼 유효성 검증', async ({ page }) => {
    // 빈 폼으로 신청 시도
    await page.getByRole('button', { name: '대관 신청' }).click();

    // 오류 메시지 확인 - 대관 목적이 필요하다는 메시지가 먼저 나타남
    await expect(page.locator('text=대관 목적을 입력해주세요')).toBeVisible();

    // 목적만 입력하고 다시 시도
    await page.fill('input[value=""][type="text"]', '테스트');
    await page.getByRole('button', { name: '대관 신청' }).click();

    // 시설 선택 오류 메시지 확인
    await expect(page.locator('text=시설을 선택해주세요')).toBeVisible();
  });
});