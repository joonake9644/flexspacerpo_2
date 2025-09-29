import { test, expect } from '@playwright/test';

test.describe('Firebase 데이터 연결 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 개발 서버로 이동
    await page.goto('http://localhost:5173');

    // Firebase 초기화 대기
    await page.waitForFunction(() => typeof window.firebase !== 'undefined');
  });

  test('Firebase 초기화 및 인증 상태 확인', async ({ page }) => {
    console.log('🔍 Firebase 초기화 테스트 시작...');

    // Firebase 앱 상태 확인
    const firebaseStatus = await page.evaluate(() => {
      if (typeof firebase === 'undefined') {
        return { error: 'Firebase가 초기화되지 않음' };
      }

      return {
        apps: firebase.apps.length,
        currentApp: firebase.app().name,
        hasAuth: typeof firebase.auth === 'function',
        hasFirestore: typeof firebase.firestore === 'function'
      };
    });

    console.log('📊 Firebase 상태:', firebaseStatus);
    expect(firebaseStatus.apps).toBeGreaterThan(0);
    expect(firebaseStatus.hasAuth).toBe(true);
    expect(firebaseStatus.hasFirestore).toBe(true);

    // 인증 상태 확인
    const authStatus = await page.evaluate(() => {
      const auth = firebase.auth();
      return {
        hasCurrentUser: !!auth.currentUser,
        userEmail: auth.currentUser?.email || null,
        userId: auth.currentUser?.uid || null
      };
    });

    console.log('🔑 인증 상태:', authStatus);
  });

  test('Firestore 컬렉션 접근 테스트', async ({ page }) => {
    console.log('📋 Firestore 컬렉션 접근 테스트 시작...');

    // 사용자 컬렉션 테스트
    const usersResult = await page.evaluate(async () => {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('users').get();

        const users = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          users.push({
            id: doc.id,
            name: data.name,
            email: data.email,
            role: data.role
          });
        });

        return {
          success: true,
          count: snapshot.size,
          users: users
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
    });

    console.log('👤 사용자 컬렉션 결과:', usersResult);
    expect(usersResult.success).toBe(true);
    expect(usersResult.count).toBeGreaterThan(0);

    // 대관 컬렉션 테스트
    const bookingsResult = await page.evaluate(async () => {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('bookings').get();

        const bookings = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          bookings.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            facilityId: data.facilityId,
            status: data.status
          });
        });

        return {
          success: true,
          count: snapshot.size,
          bookings: bookings
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
    });

    console.log('🏢 대관 컬렉션 결과:', bookingsResult);
    expect(bookingsResult.success).toBe(true);

    // 프로그램 컬렉션 테스트
    const programsResult = await page.evaluate(async () => {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('programs').get();

        const programs = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          programs.push({
            id: doc.id,
            name: data.name,
            instructor: data.instructor
          });
        });

        return {
          success: true,
          count: snapshot.size,
          programs: programs
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
    });

    console.log('🏃 프로그램 컬렉션 결과:', programsResult);
    expect(programsResult.success).toBe(true);

    // 프로그램 신청 컬렉션 테스트
    const applicationsResult = await page.evaluate(async () => {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('applications').get();

        const applications = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          applications.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            programId: data.programId,
            status: data.status
          });
        });

        return {
          success: true,
          count: snapshot.size,
          applications: applications
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
    });

    console.log('📝 프로그램 신청 컬렉션 결과:', applicationsResult);
    expect(applicationsResult.success).toBe(true);
  });

  test('사용자별 데이터 필터링 테스트', async ({ page }) => {
    console.log('🔍 사용자별 데이터 필터링 테스트 시작...');

    // 로그인 상태 확인
    const authStatus = await page.evaluate(() => {
      const auth = firebase.auth();
      return {
        isAuthenticated: !!auth.currentUser,
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email
      };
    });

    console.log('🔑 현재 인증 상태:', authStatus);

    if (authStatus.isAuthenticated) {
      // 내 대관 필터링 테스트
      const myBookingsResult = await page.evaluate(async () => {
        try {
          const db = firebase.firestore();
          const auth = firebase.auth();
          const currentUserId = auth.currentUser.uid;

          const snapshot = await db.collection('bookings')
            .where('userId', '==', currentUserId)
            .get();

          return {
            success: true,
            count: snapshot.size,
            userId: currentUserId
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            code: error.code
          };
        }
      });

      console.log('🏢 내 대관 필터링 결과:', myBookingsResult);
      expect(myBookingsResult.success).toBe(true);

      // 내 프로그램 신청 필터링 테스트
      const myApplicationsResult = await page.evaluate(async () => {
        try {
          const db = firebase.firestore();
          const auth = firebase.auth();
          const currentUserId = auth.currentUser.uid;

          const snapshot = await db.collection('applications')
            .where('userId', '==', currentUserId)
            .get();

          return {
            success: true,
            count: snapshot.size,
            userId: currentUserId
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            code: error.code
          };
        }
      });

      console.log('📝 내 프로그램 신청 필터링 결과:', myApplicationsResult);
      expect(myApplicationsResult.success).toBe(true);
    } else {
      console.log('⚠️ 로그인되지 않은 상태 - 필터링 테스트 스킵');
    }
  });

  test('애플리케이션 UI 로딩 테스트', async ({ page }) => {
    console.log('🎨 애플리케이션 UI 로딩 테스트 시작...');

    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');

    // 메인 앱 요소 확인
    const appElement = await page.locator('body').first();
    await expect(appElement).toBeVisible();

    // 로그인 또는 대시보드 요소 확인
    const hasLoginForm = await page.locator('form').count() > 0;
    const hasDashboard = await page.locator('[data-testid="dashboard"], .dashboard').count() > 0;

    console.log('🎨 UI 상태:', {
      hasLoginForm,
      hasDashboard,
      url: page.url()
    });

    // 최소한 로그인 폼이나 대시보드 중 하나는 있어야 함
    expect(hasLoginForm || hasDashboard).toBe(true);

    // JavaScript 오류 체크
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // 잠시 대기하여 JavaScript 실행 완료
    await page.waitForTimeout(2000);

    console.log('🚨 JavaScript 오류 개수:', jsErrors.length);
    if (jsErrors.length > 0) {
      console.log('🚨 JavaScript 오류 목록:', jsErrors);
    }
  });
});