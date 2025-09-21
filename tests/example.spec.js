import { test, expect } from '@playwright/test';

// 테스트 그룹: 인증 관련 기능 (로그인, 회원가입 등)
test.describe('인증 (Authentication)', () => {
  // 각 인증 테스트가 실행되기 전에 로그인 페이지로 이동합니다.
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 실패 (잘못된 비밀번호)', async ({ page }) => {
    // 유효한 이메일과 잘못된 비밀번호를 입력합니다.
    await page.locator('#email').fill('testuser@example.com');
    await page.locator('#password').fill('wrong-password');
    await page.locator('button[type="submit"]').click();

    // 에러 메시지가 화면에 보이는지, 그리고 올바른 텍스트를 포함하는지 확인합니다.
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('이메일 또는 비밀번호가 올바르지 않습니다.');
  });
  
  test('회원가입 성공 (개인정보 동의 포함)', async ({ page }) => {
    // 회원가입 페이지로 이동합니다.
    await page.getByRole('link', { name: '회원가입' }).click();
    await expect(page).toHaveURL('/signup');

    // 고유한 이메일을 생성하여 테스트가 반복 가능하도록 합니다.
    const uniqueEmail = `testuser-${Date.now()}@example.com`;
    
    // 회원가입 폼을 채웁니다.
    await page.locator('#username').fill('새로운테스터');
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill('password123');
    
    // 개인정보 동의 체크박스를 클릭합니다.
    await page.locator('#privacy-policy-checkbox').check();
    
    // 회원가입 버튼을 클릭합니다.
    await page.locator('button[type="submit"]').click();

    // 회원가입 성공 후 로그인 페이지로 리디렉션되었는지 확인합니다.
    await expect(page).toHaveURL('/login');
    // 성공 메시지가 표시되는지 확인합니다. (선택적)
    await expect(page.locator('.signup-success-message')).toBeVisible();
  });
});

// 테스트 그룹: 로그인된 사용자의 기능 (체육관 대관)
// 이 그룹의 모든 테스트는 '로그인 된 상태'에서 시작됩니다. (playwright.config.js 설정 덕분)
test.describe('체육관 대관', () => {
  // 각 대관 테스트 실행 전에 대관 페이지로 이동합니다.
  test.beforeEach(async ({ page }) => {
    await page.goto('/booking');
  });

  test('성공적으로 체육관 대관 신청', async ({ page }) => {
    // 대관 날짜와 시간을 선택합니다.
    await page.locator('#date-picker').fill('2025-12-25');
    await page.locator('#time-slot').selectOption({ label: '14:00 - 16:00' });
    
    // 대관 신청 버튼을 클릭합니다.
    await page.getByRole('button', { name: '대관 신청' }).click();

    // 대관 신청 완료를 알리는 모달(팝업)이 나타나는지 확인합니다.
    const successModal = page.locator('.reservation-success-modal');
    await expect(successModal).toBeVisible();
    await expect(successModal).toContainText('대관 신청이 완료되었습니다.');
  });
});
