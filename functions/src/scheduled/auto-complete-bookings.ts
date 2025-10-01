/**
 * 자동 대관 완료 처리 스케줄러
 * 매일 새벽 2시에 실행되어 종료일이 지난 승인된 대관을 자동으로 완료 상태로 전환
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * 매일 새벽 2시(서울 시간) 실행
 * 승인된(approved) 대관 중 종료일이 어제 이전인 것을 완료(completed) 상태로 변경
 */
export const autoCompleteBookings = functions.pubsub
  .schedule('0 2 * * *')  // Cron: 매일 02:00 (새벽 2시)
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    console.log('🤖 자동 대관 완료 처리 시작');

    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // 어제 날짜 계산
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      console.log(`📅 기준 날짜: ${yesterdayStr} (${yesterdayStr} 이전에 종료된 대관 처리)`);

      // 종료일이 어제 이전이고 상태가 approved인 대관 검색
      const expiredBookingsSnapshot = await db
        .collection('bookings')
        .where('status', '==', 'approved')
        .where('endDate', '<=', yesterdayStr)
        .get();

      if (expiredBookingsSnapshot.empty) {
        console.log('✅ 자동 완료 처리할 대관이 없습니다.');
        return null;
      }

      console.log(`📋 ${expiredBookingsSnapshot.size}개의 만료된 대관 발견`);

      // Batch 업데이트로 성능 최적화
      const batch = db.batch();
      const completedBookings: any[] = [];

      expiredBookingsSnapshot.forEach((doc) => {
        const booking = doc.data();
        batch.update(doc.ref, {
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          autoCompleted: true,  // 자동 완료 플래그
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        completedBookings.push({
          id: doc.id,
          purpose: booking.purpose,
          userName: booking.userName,
          endDate: booking.endDate
        });
      });

      // 일괄 업데이트 실행
      await batch.commit();

      console.log('✅ 자동 완료 처리 완료:');
      completedBookings.forEach(b => {
        console.log(`  - ${b.id}: ${b.userName} - ${b.purpose} (종료일: ${b.endDate})`);
      });

      // 처리 결과 통계 저장 (선택 사항)
      await db.collection('system_logs').add({
        type: 'auto_complete_bookings',
        count: completedBookings.length,
        bookings: completedBookings,
        executedAt: admin.firestore.FieldValue.serverTimestamp(),
        referenceDate: yesterdayStr
      });

      return {
        success: true,
        count: completedBookings.length,
        completedBookings
      };

    } catch (error) {
      console.error('❌ 자동 완료 처리 중 오류:', error);

      // 오류 로그 저장
      await db.collection('system_logs').add({
        type: 'auto_complete_bookings_error',
        error: error instanceof Error ? error.message : String(error),
        executedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      throw error;
    }
  });

/**
 * 수동 실행 가능한 HTTP 트리거 버전 (테스트 및 관리자 수동 실행용)
 * URL: https://[region]-[project-id].cloudfunctions.net/manualCompleteBookings
 */
export const manualCompleteBookings = functions.https.onRequest(async (req, res) => {
  // 관리자만 실행 가능하도록 보안 체크 (선택 사항)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '인증이 필요합니다.' });
    return;
  }

  try {
    console.log('🔧 수동 대관 완료 처리 시작');

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const expiredBookingsSnapshot = await db
      .collection('bookings')
      .where('status', '==', 'approved')
      .where('endDate', '<=', yesterdayStr)
      .get();

    if (expiredBookingsSnapshot.empty) {
      res.status(200).json({
        message: '자동 완료 처리할 대관이 없습니다.',
        count: 0
      });
      return;
    }

    const batch = db.batch();
    const completedBookings: any[] = [];

    expiredBookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      batch.update(doc.ref, {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        manualCompleted: true,  // 수동 완료 플래그
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      completedBookings.push({
        id: doc.id,
        purpose: booking.purpose,
        userName: booking.userName,
        endDate: booking.endDate
      });
    });

    await batch.commit();

    console.log('✅ 수동 완료 처리 완료:', completedBookings.length);

    res.status(200).json({
      success: true,
      message: `${completedBookings.length}개의 대관이 완료 처리되었습니다.`,
      count: completedBookings.length,
      completedBookings
    });

  } catch (error) {
    console.error('❌ 수동 완료 처리 중 오류:', error);
    res.status(500).json({
      error: '처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});