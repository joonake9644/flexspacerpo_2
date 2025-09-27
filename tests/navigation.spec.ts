import { test, expect } from '@playwright/test';

test.describe('네비게이션 및 페이지 전환', () => {
  test.beforeEach(async ({ page }) => {
    // 일반 사용자로 로그인
    await page.goto('/');

    await page.getByRole('button', { name: '회원가입' }).click();

    const timestamp = Date.now();
    const testUserEmail = `navuser${timestamp}@test.com`;

    await page.fill('input[placeholder*="이름"]', '네비게이션 테스트 사용자');
    await page.fill('input[placeholder*="이메일"]', testUserEmail);
    await page.fill('input[placeholder*="비밀번호"][type="password"]', 'testpass123');
    await page.fill('input[placeholder*="비밀번호 확인"]', 'testpass123');

    await page.getByRole('button', { name: '회원가입' }).click();

    // 개인정보 동의
    await page.getByRole('button', { name: '동의하고 계속하기' }).click();

    // 로그인 모드로 전환 후 로그인
    await page.getByRole('button', { name: '로그인' }).click();

    await page.fill('input[placeholder*="이메일"]', testUserEmail);
    await page.fill('input[placeholder*="비밀번호"]', 'testpass123');
    await page.getByRole('button', { name: '로그인' }).click();
  });

  test('모든 메뉴 접근 가능성 확인', async ({ page }) => {
    // 대시보드 확인
    await expect(page.locator('text=FlexSpace Pro')).toBeVisible();

    // 체육관 대관 메뉴
    await page.getByRole('button', { name: /체육관 대관|Booking/ }).click();
    await expect(page.locator('text=체육관 대관')).toBeVisible();
    await expect(page.locator('text=신규 대관 신청')).toBeVisible();

    // 프로그램 메뉴
    await page.getByRole('button', { name: /프로그램|Program/ }).click();
    await expect(page.locator('input[placeholder*="검색"]')).toBeVisible();

    // 대시보드로 돌아가기
    await page.getByRole('button', { name: /대시보드|Dashboard/ }).click();
    await expect(page.locator('text=대시보드')).toBeVisible();
  });

  test('페이지 간 데이터 연계 확인', async ({ page }) => {
    // 1. 대관 신청 생성
    await page.getByRole('button', { name: /체육관 대관|Booking/ }).click();

    await page.fill('input[value=""][type="text"]', '데이터 연계 테스트 대관');
    await page.selectOption('select', 'personal');

    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]').first().fill(today);
    await page.locator('input[type="date"]').last().fill(today);

    await page.locator('input[type="time"]').first().fill('15:00');
    await page.locator('input[type="time"]').last().fill('17:00');

    await page.getByRole('button', { name: '대관 신청' }).click();

    // 성공 알림 확인
    await expect(page.locator('text=예약 신청이 완료되었습니다')).toBeVisible();

    // 2. 대시보드에서 데이터 확인
    await page.getByRole('button', { name: /대시보드|Dashboard/ }).click();

    // 대시보드의 통계에 반영되었는지 확인
    await expect(page.locator('text=대기중인 대관')).toBeVisible();

    // 3. 다시 대관 페이지에서 목록 확인
    await page.getByRole('button', { name: /체육관 대관|Booking/ }).click();
    await expect(page.locator('text=데이터 연계 테스트 대관')).toBeVisible();
  });

  test('사용자 프로필 정보 일관성', async ({ page }) => {
    // 네비게이션 바에 사용자 이름 표시 확인
    await expect(page.locator('text=네비게이션 테스트 사용자')).toBeVisible();

    // 다른 페이지로 이동해도 사용자 정보가 유지되는지 확인
    await page.getByRole('button', { name: /프로그램|Program/ }).click();
    await expect(page.locator('text=네비게이션 테스트 사용자')).toBeVisible();

    await page.getByRole('button', { name: /체육관 대관|Booking/ }).click();
    await expect(page.locator('text=네비게이션 테스트 사용자')).toBeVisible();
  });

  test('로그아웃 기능', async ({ page }) => {
    // 로그아웃 버튼 찾기 및 클릭
    const logoutButton = page.getByRole('button', { name: /로그아웃|Logout/ });
    await logoutButton.click();

    // 로그인 페이지로 리다이렉트 확인
    await expect(page.locator('text=FlexSpace Pro')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('반응형 네비게이션', async ({ page }) => {
    // 모바일 크기로 변경
    await page.setViewportSize({ width: 375, height: 667 });

    // 모바일에서도 네비게이션이 작동하는지 확인
    await expect(page.locator('text=FlexSpace Pro')).toBeVisible();

    // 메뉴 버튼들이 여전히 접근 가능한지 확인
    const menuButtons = page.locator('nav button');
    await expect(menuButtons.first()).toBeVisible();

    // 데스크톱 크기로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('페이지 새로고침 시 상태 유지', async ({ page }) => {
    // 특정 페이지로 이동
    await page.getByRole('button', { name: /체육관 대관|Booking/ }).click();
    await expect(page.locator('text=체육관 대관')).toBeVisible();

    // 페이지 새로고침
    await page.reload();

    // 여전히 로그인 상태이고 같은 페이지에 있는지 확인
    await expect(page.locator('text=체육관 대관')).toBeVisible();
    await expect(page.locator('text=네비게이션 테스트 사용자')).toBeVisible();
  });
});