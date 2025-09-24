import { test, expect } from '@playwright/test';

test.describe('UI 컴포넌트 기본 기능 테스트', () => {
  test('페이지 로딩 및 기본 요소 확인', async ({ page }) => {
    // 개발 서버 접속
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

    // 기본 로그인 화면이 로드되었는지 확인
    await expect(page.locator('text=FlexSpace Pro')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
    await expect(page.getByRole('button', { name: '관리자' })).toBeVisible();

    console.log('✅ 기본 로그인 화면 로딩 완료');
  });

  test('관리자 로그인 후 운영관리 화면 확인', async ({ page }) => {
    // 타임아웃 증가
    page.setDefaultTimeout(10000);

    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

    // 관리자 탭 클릭
    await page.getByRole('button', { name: '관리자', exact: true }).click();

    // 관리자 계정으로 로그인
    await page.fill('input[type="email"]', 'admin@flexspace.test');
    await page.fill('input[type="password"]', 'admin123');
    await page.getByRole('button', { name: '관리자 로그인 / Admin Login' }).click();

    // 로그인 성공 후 화면 대기
    await page.waitForLoadState('networkidle');

    // 운영 관리 메뉴 확인 및 클릭
    const operationsButton = page.getByRole('button', { name: /운영.*관리/i });
    await expect(operationsButton).toBeVisible({ timeout: 10000 });
    await operationsButton.click();

    // 수강생/팀 직접 등록 섹션 확인
    await expect(page.locator('text=수강생/팀 직접 등록')).toBeVisible({ timeout: 5000 });

    // 수정된 필드들이 존재하는지 확인
    await expect(page.locator('text=신청자 이름')).toBeVisible();
    await expect(page.locator('text=대관 목적')).toBeVisible();
    await expect(page.locator('text=시설 선택')).toBeVisible();

    console.log('✅ 운영관리 화면 및 수정된 필드들 확인 완료');
  });

  test('체육관 대관 화면에서 시설 선택 필드 확인', async ({ page }) => {
    page.setDefaultTimeout(10000);

    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

    // 관리자로 로그인
    await page.getByRole('button', { name: '관리자', exact: true }).click();
    await page.fill('input[type="email"]', 'admin@flexspace.test');
    await page.fill('input[type="password"]', 'admin123');
    await page.getByRole('button', { name: '관리자 로그인 / Admin Login' }).click();
    await page.waitForLoadState('networkidle');

    // 체육관 대관 메뉴 클릭
    const bookingButton = page.getByRole('button', { name: /체육관.*대관/i });
    await expect(bookingButton).toBeVisible({ timeout: 10000 });
    await bookingButton.click();

    // 신규 대관 신청 섹션 확인
    await expect(page.locator('text=신규 대관 신청')).toBeVisible({ timeout: 5000 });

    // 시설 선택 필드가 추가되었는지 확인
    await expect(page.locator('text=시설 선택')).toBeVisible();

    // 시설 선택 드롭다운 확인
    const facilitySelect = page.locator('select').filter({ has: page.locator('option:has-text("시설을 선택해 주세요")') });
    await expect(facilitySelect).toBeVisible();

    console.log('✅ 체육관 대관 화면의 시설 선택 필드 확인 완료');
  });
});