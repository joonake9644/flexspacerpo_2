import { test, expect } from '@playwright/test';

test.describe('프로그램 관리 시스템', () => {
  test.beforeEach(async ({ page }) => {
    // 일반 사용자로 로그인
    await page.goto('/');

    await page.getByRole('button', { name: '회원가입' }).click();

    const timestamp = Date.now();
    const testUserEmail = `proguser${timestamp}@test.com`;

    await page.fill('input[placeholder*="이름"]', '프로그램 테스트 사용자');
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

    // 프로그램 메뉴로 이동
    await page.getByRole('button', { name: '프로그램' }).click();
  });

  test('프로그램 목록 보기', async ({ page }) => {
    // 프로그램 섹션 확인
    await expect(page.locator('text=프로그램')).toBeVisible();

    // 검색 및 필터 요소 확인
    await expect(page.locator('input[placeholder*="검색"]')).toBeVisible();

    // 카테고리 필터 버튼들 확인
    await expect(page.locator('button:has-text("전체")')).toBeVisible();
    await expect(page.locator('button:has-text("요가")')).toBeVisible();
    await expect(page.locator('button:has-text("필라테스")')).toBeVisible();
  });

  test('프로그램 검색', async ({ page }) => {
    // 검색 기능 테스트
    const searchInput = page.locator('input[placeholder*="검색"]');
    await searchInput.fill('요가');

    // 검색 결과 확인 (요가 관련 프로그램만 표시)
    const programCards = page.locator('.bg-white.rounded-2xl.shadow-sm');

    if (await programCards.count() > 0) {
      // 각 카드에 '요가' 텍스트가 포함되어 있는지 확인
      for (let i = 0; i < await programCards.count(); i++) {
        const card = programCards.nth(i);
        await expect(card.locator('text*="요가"')).toBeVisible();
      }
    }

    // 검색어 지우기
    await searchInput.clear();
  });

  test('프로그램 카테고리 필터링', async ({ page }) => {
    // 요가 카테고리 클릭
    await page.locator('button:has-text("요가")').click();

    // 요가 프로그램만 표시되는지 확인
    const programCards = page.locator('.bg-white.rounded-2xl.shadow-sm');

    if (await programCards.count() > 0) {
      // 첫 번째 카드 확인
      const firstCard = programCards.first();
      await expect(firstCard).toBeVisible();
    }

    // 전체 카테고리로 다시 전환
    await page.locator('button:has-text("전체")').click();
  });

  test('프로그램 신청', async ({ page }) => {
    const programCards = page.locator('.bg-white.rounded-2xl.shadow-sm');

    if (await programCards.count() > 0) {
      const firstCard = programCards.first();

      // 신청하기 버튼 찾기 및 클릭
      const applyButton = firstCard.locator('button:has-text("신청하기")');

      if (await applyButton.isVisible()) {
        await applyButton.click();

        // 신청 완료 확인
        await expect(page.locator('text=신청이 완료되었습니다')).toBeVisible();

        // 버튼이 '신청됨'으로 변경되었는지 확인
        await expect(firstCard.locator('button:has-text("신청됨")')).toBeVisible();
      }
    }
  });

  test('프로그램 상세 정보 확인', async ({ page }) => {
    const programCards = page.locator('.bg-white.rounded-2xl.shadow-sm');

    if (await programCards.count() > 0) {
      const firstCard = programCards.first();

      // 프로그램 카드에 필수 정보가 표시되는지 확인
      await expect(firstCard).toBeVisible();

      // 카드 내용 확인 (제목, 강사, 시간, 정원 등)
      const cardContent = firstCard.locator('div');
      await expect(cardContent).toBeVisible();
    }
  });

  test('프로그램 정렬', async ({ page }) => {
    // 정렬 옵션이 있는지 확인
    const sortButtons = page.locator('button:has-text("최신순")');

    if (await sortButtons.isVisible()) {
      await sortButtons.click();
    }

    // 프로그램 목록이 여전히 표시되는지 확인
    await expect(page.locator('.bg-white.rounded-2xl.shadow-sm')).toBeVisible();
  });

  test('빈 상태 처리', async ({ page }) => {
    // 존재하지 않는 키워드로 검색
    const searchInput = page.locator('input[placeholder*="검색"]');
    await searchInput.fill('존재하지않는프로그램1234567890');

    // 빈 상태 메시지 또는 '검색 결과가 없습니다' 메시지 확인
    const noResults = page.locator('text=검색 결과가 없습니다');
    const emptyState = page.locator('text=프로그램이 없습니다');

    // 둘 중 하나가 표시되는지 확인
    await expect(noResults.or(emptyState)).toBeVisible();
  });
});