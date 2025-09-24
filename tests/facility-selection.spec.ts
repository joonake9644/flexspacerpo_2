import { test, expect } from '@playwright/test';

test.describe('시설 선택 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 개발 서버 접속
    await page.goto('http://localhost:5174');
  });

  test('체육관 대관 - 시설 선택 필드 확인', async ({ page }) => {
    // 관리자로 로그인하여 테스트 환경 설정
    await page.getByRole('button', { name: '관리자', exact: true }).click();

    // 관리자 로그인
    await page.fill('input[type="email"]', 'admin@flexspace.test');
    await page.fill('input[type="password"]', 'admin123');
    await page.getByRole('button', { name: '관리자 로그인 / Admin Login' }).click();

    // 체육관 대관 메뉴로 이동
    await page.getByRole('button', { name: '체육관 대관' }).click();

    // 시설 선택 필드가 존재하는지 확인
    await expect(page.locator('label:has-text("시설 선택")')).toBeVisible();
    await expect(page.locator('select:has(option:has-text("시설을 선택해 주세요"))')).toBeVisible();

    // 대관 목적 필드가 존재하는지 확인
    await expect(page.locator('label:has-text("대관 목적")')).toBeVisible();

    // 분류 필드의 옵션들이 올바른지 확인
    const categorySelect = page.locator('select').first(); // 분류 선택
    await expect(categorySelect.locator('option:has-text("훈련")')).toBeVisible();
    await expect(categorySelect.locator('option:has-text("수업")')).toBeVisible();
    await expect(categorySelect.locator('option:has-text("행사")')).toBeVisible();
  });

  test('운영관리 - 수강생/팀 직접 등록 기능 확인', async ({ page }) => {
    // 관리자로 로그인
    await page.getByRole('button', { name: '관리자', exact: true }).click();
    await page.fill('input[type="email"]', 'admin@flexspace.test');
    await page.fill('input[type="password"]', 'admin123');
    await page.getByRole('button', { name: '관리자 로그인 / Admin Login' }).click();

    // 운영관리 메뉴로 이동
    await page.getByRole('button', { name: '운영 관리' }).click();

    // 수강생/팀 직접 등록 섹션 확인
    await expect(page.locator('text=수강생/팀 직접 등록')).toBeVisible();

    // 필드들이 올바르게 표시되는지 확인
    await expect(page.locator('label:has-text("신청자 이름")')).toBeVisible();
    await expect(page.locator('label:has-text("대관 목적")')).toBeVisible();
    await expect(page.locator('label:has-text("분류")')).toBeVisible();
    await expect(page.locator('label:has-text("시설 선택")')).toBeVisible();

    // 분류 옵션들이 체육관 대관과 동일한지 확인
    const adminCategorySelect = page.locator('form').locator('select').first();
    await expect(adminCategorySelect.locator('option:has-text("훈련")')).toBeVisible();
    await expect(adminCategorySelect.locator('option:has-text("수업")')).toBeVisible();
    await expect(adminCategorySelect.locator('option:has-text("행사")')).toBeVisible();
  });

  test('유효성 검사 - 시설 선택 누락 시 오류 메시지', async ({ page }) => {
    // 관리자로 로그인
    await page.getByRole('button', { name: '관리자', exact: true }).click();
    await page.fill('input[type="email"]', 'admin@flexspace.test');
    await page.fill('input[type="password"]', 'admin123');
    await page.getByRole('button', { name: '관리자 로그인 / Admin Login' }).click();

    // 체육관 대관 메뉴로 이동
    await page.getByRole('button', { name: '체육관 대관' }).click();

    // 대관 목적만 입력하고 시설 선택하지 않고 신청
    await page.fill('input[value=""][type="text"]', '테스트 대관');

    // 대관 신청 버튼 클릭
    await page.getByRole('button', { name: '대관 신청' }).click();

    // "시설을 선택해주세요" 오류 메시지 확인
    await expect(page.locator('text=시설을 선택해주세요')).toBeVisible();
  });
});