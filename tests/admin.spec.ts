import { test, expect } from '@playwright/test';

test.describe('관리자 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 로그인
    await page.goto('/');

    await page.getByRole('button', { name: '관리자' }).click();

    await page.fill('input[placeholder*="이메일"]', 'admin@flexspace.test');
    await page.fill('input[placeholder*="비밀번호"]', 'FlexAdmin2025!');

    await page.getByRole('button', { name: '관리자 로그인' }).click();

    // 관리자 대시보드 확인
    await expect(page.locator('text=관리자')).toBeVisible();
  });

  test('관리자 대시보드 접근', async ({ page }) => {
    // 관리자 섹션으로 이동
    await page.getByRole('button', { name: /운영/ }).click();

    // 관리자 섹션 내용 확인
    await expect(page.locator('text=수강생/팀 직접 등록')).toBeVisible();
    await expect(page.locator('text=대기중인 신청 관리')).toBeVisible();
    await expect(page.locator('text=프로그램 관리')).toBeVisible();
  });

  test('대관 신청 승인/거절', async ({ page }) => {
    // 운영 관리로 이동
    await page.getByRole('button', { name: /운영/ }).click();

    // 대기중인 신청이 있다면 승인/거절 버튼 확인
    const pendingBookings = page.locator('text=대기중');

    if (await pendingBookings.isVisible()) {
      // 첫 번째 대기중인 신청 승인
      await page.locator('button:has-text("승인")').first().click();

      // 승인 확인
      await expect(page.locator('text=승인됨')).toBeVisible();
    }
  });

  test('프로그램 생성', async ({ page }) => {
    // 운영 관리로 이동
    await page.getByRole('button', { name: /운영/ }).click();

    // 프로그램 관리 섹션으로 이동
    const createProgramButton = page.locator('button:has-text("새 프로그램 추가")');

    if (await createProgramButton.isVisible()) {
      await createProgramButton.click();

      // 프로그램 정보 입력
      await page.fill('input[placeholder*="제목"]', '테스트 요가 클래스');
      await page.fill('textarea[placeholder*="설명"]', '초보자를 위한 요가 클래스입니다.');
      await page.fill('input[placeholder*="강사"]', '김요가');

      // 카테고리 선택
      await page.selectOption('select', 'yoga');

      // 프로그램 생성
      await page.getByRole('button', { name: '프로그램 생성' }).click();

      // 성공 확인
      await expect(page.locator('text=프로그램이 생성되었습니다')).toBeVisible();
    }
  });

  test('회원 관리', async ({ page }) => {
    // 회원 관리 메뉴로 이동
    await page.getByRole('button', { name: /회원/ }).click();

    // 회원 목록 확인
    await expect(page.locator('text=회원 목록')).toBeVisible();
    await expect(page.locator('text=새 회원 추가')).toBeVisible();

    // 새 회원 추가 테스트
    await page.getByRole('button', { name: '새 회원 추가' }).click();

    // 회원 정보 입력
    const timestamp = Date.now();
    await page.fill('input[placeholder*="이름"]', '테스트 회원');
    await page.fill('input[placeholder*="이메일"]', `testmember${timestamp}@test.com`);
    await page.fill('input[placeholder*="비밀번호"]', 'testpass123');

    // 회원 생성
    await page.getByRole('button', { name: '회원 생성' }).click();

    // 성공 확인
    await expect(page.locator('text=회원이 생성되었습니다')).toBeVisible();
  });

  test('통계 대시보드 확인', async ({ page }) => {
    // 대시보드 확인
    await expect(page.locator('text=대기중인 대관')).toBeVisible();
    await expect(page.locator('text=프로그램 신청')).toBeVisible();
    await expect(page.locator('text=운영중인 프로그램')).toBeVisible();
    await expect(page.locator('text=총 이용자')).toBeVisible();

    // 숫자가 표시되는지 확인
    const statsNumbers = page.locator('.text-3xl.font-bold');
    await expect(statsNumbers).toHaveCount(4);
  });
});