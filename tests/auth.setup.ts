import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';
const adminAuthFile = 'playwright/.auth/admin.json';

setup('authenticate as user', async ({ page }) => {
  // 일반 사용자 로그인
  await page.goto('/');

  // 회원가입 진행
  await page.getByRole('button', { name: '회원가입' }).click();

  const timestamp = Date.now();
  const testUserEmail = `testuser${timestamp}@test.com`;

  await page.fill('input[placeholder*="이름"]', '테스트 사용자');
  await page.fill('input[placeholder*="이메일"]', testUserEmail);
  await page.fill('input[placeholder*="전화번호"]', '010-1234-5678');
  await page.fill('input[placeholder*="비밀번호"][type="password"]', 'testpass123');
  await page.fill('input[placeholder*="비밀번호 확인"]', 'testpass123');

  await page.getByRole('button', { name: '회원가입' }).click();

  // 개인정보 동의
  await page.getByRole('button', { name: '동의하고 계속하기' }).click();

  // 회원가입 완료 알림 대기
  await expect(page.locator('text=회원가입이 완료되었습니다')).toBeVisible();

  // 로그인 모드로 전환
  await page.getByRole('button', { name: '로그인' }).click();

  // 로그인
  await page.fill('input[placeholder*="이메일"]', testUserEmail);
  await page.fill('input[placeholder*="비밀번호"]', 'testpass123');
  await page.getByRole('button', { name: '로그인' }).click();

  // 대시보드 확인
  await expect(page.locator('text=FlexSpace Pro')).toBeVisible();

  // 인증 상태 저장
  await page.context().storageState({ path: authFile });
});

setup('authenticate as admin', async ({ page }) => {
  // 관리자 로그인
  await page.goto('/');

  await page.getByRole('button', { name: '관리자' }).click();

  await page.fill('input[placeholder*="이메일"]', 'admin@flexspace.test');
  await page.fill('input[placeholder*="비밀번호"]', 'FlexAdmin2025!');

  await page.getByRole('button', { name: '관리자 로그인' }).click();

  // 대시보드 확인
  await expect(page.locator('text=관리자')).toBeVisible();

  // 관리자 인증 상태 저장
  await page.context().storageState({ path: adminAuthFile });
});