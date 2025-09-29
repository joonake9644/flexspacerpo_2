"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAdminClaims = exports.checkAdminRole = exports.setAdminClaims = exports.onProgramApplicationStatusChange = exports.onBookingStatusChange = exports.createUserByAdmin = exports.updateUserEmail = exports.subscribeToPush = exports.updateReservationStatus = exports.createProgramApplication = exports.createBooking = void 0;
// 통합 관리 분석 및 리빙랩 솔루션을 위해 정리된 코드 - 슬랙 알림 기능 포함
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const Joi = __importStar(require("joi"));
const nodemailer = __importStar(require("nodemailer"));
const webpush = __importStar(require("web-push"));
const notification_utils_1 = require("./notification-utils");
// NOTE: Removed external app util imports for Functions build isolation
// 관리자 이메일 목록 (보안 규칙과 동일)
const ADMIN_EMAILS = [
    'admin@flexspace.test',
    'flexadmin@test.com',
    'joonake@naver.com',
    'uu@naver.com',
    'kan@naver.com',
    'kun6@naver.com'
];
// Firebase Admin SDK 초기화(한번만 실행되도록 보장)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// --- Joi 스키마 정의 ---
const bookingSchema = Joi.object({
    facilityId: Joi.string().required(),
    startDate: Joi.string().isoDate().required(),
    endDate: Joi.string().isoDate().required(),
    startTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    purpose: Joi.string().min(2).max(100).required(),
    category: Joi.string().valid('personal', 'club', 'event', 'class').required(),
    organization: Joi.string().allow('').max(50),
    numberOfParticipants: Joi.number().integer().min(1).required(),
});
// --- Cloud Functions ---
/**
 * 새로운 시설 대관 신청을 생성합니다
 */
exports.createBooking = functions.https.onCall(async (data, context) => {
    // 1. 인증 확인
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }
    const userId = context.auth.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
    }
    const user = userDoc.data();
    // 2. 입력 데이터 유효성 검증
    const { error, value } = bookingSchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { facilityId, startDate, endDate, startTime, endTime, numberOfParticipants } = value;
    const startISO = `${startDate}T${startTime}`;
    const endISO = `${endDate}T${endTime}`;
    if (startISO >= endISO) {
        throw new functions.https.HttpsError('invalid-argument', '시작 시간이 종료 시간보다 빨라야 합니다');
    }
    const facilityRef = db.collection('facilities').doc(facilityId);
    const bookingsRef = db.collection('bookings');
    try {
        const newBookingId = await db.runTransaction(async (transaction) => {
            const facilityDoc = await transaction.get(facilityRef);
            if (!facilityDoc.exists) {
                throw new functions.https.HttpsError('not-found', '존재하지 않는 시설입니다');
            }
            const facility = facilityDoc.data();
            // Date 객체 생성 없이 ISO 문자열로 직접 쿼리
            // 동일 사용자의 중복 신청 방지 (최근 10초 내)
            const recentUserBookings = await transaction.get(bookingsRef
                .where('userId', '==', userId)
                .where('facilityId', '==', facilityId)
                .where('startDate', '==', startDate)
                .where('startTime', '==', startTime)
                .limit(1));
            if (!recentUserBookings.empty) {
                const existingBooking = recentUserBookings.docs[0].data();
                const timeDiff = Date.now() - (existingBooking.createdAt?.toMillis() || 0);
                if (timeDiff < 10000) { // 10초 내 중복 신청 차단
                    throw new functions.https.HttpsError('already-exists', '동일한 대관 신청이 이미 처리 중입니다.');
                }
            }
            const conflictQuery = bookingsRef
                .where('facilityId', '==', facilityId)
                .where('status', 'in', ['pending', 'approved'])
                .where('startTime', '<', endISO);
            const snapshot = await transaction.get(conflictQuery);
            let totalParticipantsInOverlap = 0;
            for (const doc of snapshot.docs) {
                const existingBooking = doc.data();
                const existingStart = `${existingBooking.startDate}T${existingBooking.startTime}`;
                const existingEnd = `${existingBooking.endDate}T${existingBooking.endTime}`;
                // 버퍼 시간을 고려한 비교가 필요하다면 여기서 부가적인 위조로 변경하지 비교해야 함        // 현재 로직에서는 버퍼 시간 비교를 생략하고 시간만 비교
                if (startISO < existingEnd && endISO > existingStart) {
                    if (facility.capacity === 1) {
                        throw new functions.https.HttpsError('failed-precondition', '해당 시간에는 이미 다른 신청이 존재하여 승인할 수 없습니다.');
                    }
                    totalParticipantsInOverlap += existingBooking.numberOfParticipants;
                }
            }
            if (facility.capacity > 1 && (totalParticipantsInOverlap + numberOfParticipants > facility.capacity)) {
                throw new functions.https.HttpsError('resource-exhausted', `신청 가능한 인원을 초과했습니다.`);
            }
            const newBookingRef = db.collection('bookings').doc();
            // Omit<Booking, 'id'> 타입에 맞게 모든 필수 필드를 채워줍니다
            const newBookingData = {
                ...value,
                userId,
                userName: user.name,
                userEmail: user.email,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            transaction.set(newBookingRef, newBookingData);
            return newBookingRef.id;
        });
        // Slack 알림 전송 (관리자에게)
        try {
            const facilityDoc = await db.collection('facilities').doc(facilityId).get();
            const facility = facilityDoc.exists ? facilityDoc.data() : { name: '알 수 없는 시설' };
            const newBookingData = {
                ...value,
                userId,
                userName: user.name,
                userEmail: user.email,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            // Slack 알림 전송 (비동기, 실패해도 대관 신청은 성공)
            await (0, notification_utils_1.sendSlackWithRetry)(() => (0, notification_utils_1.sendBookingApplicationSlackAlert)(newBookingData, user, facility));
        }
        catch (slackError) {
            console.warn('Slack 알림 전송 실패 (대관 신청은 성공):', slackError);
        }
        return { success: true, bookingId: newBookingId, message: '대관 신청이 성공적으로 접수되었습니다.' };
    }
    catch (err) {
        console.error('Booking creation failed:', err);
        if (err instanceof functions.https.HttpsError) {
            throw err;
        }
        throw new functions.https.HttpsError('internal', '신청 생성 중 예상치 못한 오류가 발생했습니다.');
    }
});
/**
 * 프로그램 신청을 승인합니다 (기본 구조 유지)
 */
exports.createProgramApplication = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }
    const { programId } = data;
    if (!programId) {
        throw new functions.https.HttpsError('invalid-argument', '프로그램 ID가 필요합니다');
    }
    const newApplicationRef = db.collection('program_applications').doc();
    const applicationData = {
        userId: context.auth.uid,
        programId,
        status: 'pending',
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        userName: context.auth.token?.name || 'Unknown User',
        userEmail: context.auth.token?.email,
        programTitle: 'Unknown Program',
    };
    await newApplicationRef.set(applicationData);
    // Slack 알림 전송 (관리자에게)
    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const user = userDoc.exists ? userDoc.data() : {
            id: context.auth.uid,
            name: context.auth.token?.name || 'Unknown User',
            email: context.auth.token?.email || 'unknown@email.com',
            role: 'user'
        };
        // Slack 알림 전송 (비동기, 실패해도 프로그램 신청은 성공)
        await (0, notification_utils_1.sendSlackWithRetry)(() => (0, notification_utils_1.sendProgramApplicationSlackAlert)(applicationData, user));
    }
    catch (slackError) {
        console.warn('Slack 알림 전송 실패 (프로그램 신청은 성공):', slackError);
    }
    return { success: true, applicationId: newApplicationRef.id };
});
// Helper function to check for admin privileges
const isUserAdmin = async (uid) => {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists)
        return false;
    return userDoc.data()?.role === 'admin';
};
/**
 * 신청 상태를 변경합니다. (관리자 전용)
 */
exports.updateReservationStatus = functions.https.onCall(async (data, context) => {
    // 1. 인증 및 관리자 권한 확인
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }
    const isAdmin = await isUserAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다');
    }
    // 2. 입력 데이터 유효성 검증
    const { reservationId, status, adminNotes } = data;
    if (!reservationId || !status) {
        throw new functions.https.HttpsError('invalid-argument', '신청 ID와 상태가 필수입니다');
    }
    if (!['approved', 'rejected', 'completed'].includes(status)) {
        throw new functions.https.HttpsError('invalid-argument', '유효하지 않은 상태 값입니다');
    }
    // 3. 신청 문서 업데이트
    try {
        const reservationRef = db.collection('bookings').doc(reservationId);
        const updateData = {
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (status === 'rejected' && adminNotes) {
            updateData.rejectionReason = adminNotes;
        }
        await reservationRef.update(updateData);
        return { success: true, message: '신청 상태가 성공적으로 업데이트되었습니다' };
    }
    catch (error) {
        console.error('Reservation status update failed:', error);
        throw new functions.https.HttpsError('internal', '신청 상태 업데이트 중 오류가 발생했습니다.');
    }
});
/**
 * Saves a user's web push subscription to their user document.
 */
exports.subscribeToPush = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }
    const { subscription } = data;
    if (!subscription) {
        throw new functions.https.HttpsError('invalid-argument', '구독 객체가 필요합니다');
    }
    try {
        const userRef = db.collection('users').doc(context.auth.uid);
        // Use merge: true to avoid overwriting the whole document
        await userRef.set({ pushSubscription: subscription }, { merge: true });
        return { success: true, message: '실시 알림 구독했습니다' };
    }
    catch (error) {
        console.error('Failed to save push subscription:', error);
        throw new functions.https.HttpsError('internal', '구독 정보 저장에 실패했습니다.');
    }
});
/**
 * Updates a user's email address in Auth and Firestore.
 */
exports.updateUserEmail = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to change email.');
    }
    const { newEmail } = data;
    if (!newEmail || typeof newEmail !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'A valid new email must be provided.');
    }
    const uid = context.auth.uid;
    try {
        // Update email in Firebase Authentication
        await admin.auth().updateUser(uid, { email: newEmail });
        // Update email in Firestore
        const userRef = db.collection('users').doc(uid);
        await userRef.update({ email: newEmail });
        // Optionally, trigger a verification email for the new address
        // Note: The client-side `updateEmail` function already handles this,
        // but this ensures it happens even if only the function is called.
        // await admin.auth().generateEmailVerificationLink(newEmail);
        return { success: true, message: 'Email updated successfully.' };
    }
    catch (error) {
        console.error('Error updating email:', error);
        // Provide a more specific error message if possible
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'The new email address is already in use by another account.');
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred while updating the email.');
    }
});
/**
 * Creates a new user via admin without affecting admin session.
 * Only admins can call this function.
 */
exports.createUserByAdmin = functions.https.onCall(async (data, context) => {
    // 1. Authentication and admin check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }
    const isAdmin = await isUserAdmin(context.auth.uid);
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
    }
    // 2. Input validation
    const { name, email, phone, password, role } = data;
    if (!name || !email || !password) {
        throw new functions.https.HttpsError('invalid-argument', '이름, 이메일, 비밀번호는 필수입니다.');
    }
    if (!['user', 'admin'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', '올바른 권한을 선택하세요.');
    }
    try {
        // 3. Create user in Firebase Auth using Admin SDK
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: name,
            emailVerified: true, // Admin-created users skip email verification
        });
        // 4. Create user document in Firestore
        const userDoc = {
            name: name,
            email: email,
            phone: phone || null,
            role: role,
            isActive: true,
            adminCreated: true, // Flag to bypass email verification on login
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('users').doc(userRecord.uid).set(userDoc);
        console.log(`Admin ${context.auth.uid} successfully created user ${userRecord.uid} (${email})`);
        return {
            success: true,
            uid: userRecord.uid,
            message: `새 사용자 '${name}'이 생성되었습니다.`
        };
    }
    catch (error) {
        console.error('Admin user creation failed:', error);
        // Provide specific error messages
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', '이미 등록된 이메일입니다.');
        }
        else if (error.code === 'auth/weak-password') {
            throw new functions.https.HttpsError('invalid-argument', '비밀번호가 너무 간단합니다.');
        }
        else if (error.code === 'auth/invalid-email') {
            throw new functions.https.HttpsError('invalid-argument', '올바른 이메일 주소를 입력하세요.');
        }
        throw new functions.https.HttpsError('internal', '사용자 생성 중 오류가 발생했습니다.');
    }
});
// --- 이메일 및 실시 알림 관련 ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    if (vapidPublicKey && vapidPrivateKey) {
        // 오탈자 수정: setVapIDDetails -> setVapidDetails
        webpush.setVapidDetails('mailto:admin@example.com', vapidPublicKey, vapidPrivateKey);
    }
}
catch (e) {
    console.warn('VAPID keys invalid or not set. Push notifications disabled.');
}
/**
 * 신청 상태 변경시 사용자에게 이메일 알림을 보냅니다.
 */
exports.onBookingStatusChange = functions.firestore
    .document('bookings/{bookingId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status) {
        return null;
    }
    const userDoc = await db.collection('users').doc(after.userId).get();
    if (!userDoc.exists) {
        console.error(`User not found: ${after.userId}`);
        return null;
    }
    const user = userDoc.data();
    const mailOptions = {
        from: '"FlexSpace Pro" <noreply@flexspace.pro>',
        to: user.email,
        subject: `[FlexSpace Pro] 신청 상태 변경 알림: ${after.purpose}`,
        html: `
        <h1>신청 상태 변경 알림</h1>
        <p><strong>${after.purpose}</strong> 신청의 상태가 <strong>${before.status}</strong>에서 <strong>${after.status}</strong>로 변경되었습니다.</p>
        <p>자세한 내용은 사이트에서 확인해주세요.</p>
      `
    };
    const notificationPromises = [];
    // 1. Email Notification Promise
    notificationPromises.push(transporter.sendMail(mailOptions).then(() => {
        console.log(`Status change email sent to ${user.email}`);
    }).catch((error) => {
        console.error('Failed to send email:', error);
    }));
    // 2. Web Push Notification Promise
    if (user.pushSubscription) {
        const payload = JSON.stringify({
            title: 'FlexSpace Pro: Booking Status Changed',
            body: 'Booking "' + after.purpose + '" status: ' + after.status,
            icon: '/icon-192x192.png',
            data: {
                url: '/booking'
            }
        });
        notificationPromises.push(webpush.sendNotification(user.pushSubscription, payload).then(() => {
            console.log('Push notification sent successfully.');
        }).catch(pushError => {
            console.error('Failed to send push notification:', pushError);
            if (pushError.statusCode === 404 || pushError.statusCode === 410) {
                console.log('Subscription has expired or is no longer valid. Removing...');
                return db.collection('users').doc(after.userId).update({
                    pushSubscription: admin.firestore.FieldValue.delete()
                });
            }
            return null;
        }));
    }
    // 3. Slack Notification Promise
    notificationPromises.push((async () => {
        try {
            // 시설 정보 가져오기
            const facilityDoc = await db.collection('facilities').doc(after.facilityId).get();
            const facility = facilityDoc.exists ? facilityDoc.data() : { name: '알 수 없는 시설' };
            // Slack 알림 전송
            await (0, notification_utils_1.sendSlackWithRetry)(() => (0, notification_utils_1.sendBookingStatusSlackAlert)(after, user, facility, before.status, after.status));
            console.log(`Slack notification sent for booking status change: ${before.status} -> ${after.status}`);
        }
        catch (slackError) {
            console.error('Failed to send Slack notification:', slackError);
        }
    })());
    await Promise.all(notificationPromises);
    return null;
});
/**
 * 프로그램 신청 상태 변경시 사용자에게 이메일 및 슬랙 알림을 보냅니다.
 */
exports.onProgramApplicationStatusChange = functions.firestore
    .document('program_applications/{applicationId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status) {
        return null;
    }
    const userDoc = await db.collection('users').doc(after.userId).get();
    if (!userDoc.exists) {
        console.error(`User not found: ${after.userId}`);
        return null;
    }
    const user = userDoc.data();
    const mailOptions = {
        from: '"FlexSpace Pro" <noreply@flexspace.pro>',
        to: user.email,
        subject: `[FlexSpace Pro] 프로그램 신청 상태 변경 알림: ${after.programTitle}`,
        html: `
        <h1>프로그램 신청 상태 변경 알림</h1>
        <p><strong>${after.programTitle}</strong> 프로그램 신청의 상태가 <strong>${before.status}</strong>에서 <strong>${after.status}</strong>로 변경되었습니다.</p>
        <p>자세한 내용은 사이트에서 확인해주세요.</p>
      `
    };
    const notificationPromises = [];
    // 1. Email Notification Promise
    notificationPromises.push(transporter.sendMail(mailOptions).then(() => {
        console.log(`Program status change email sent to ${user.email}`);
    }).catch((error) => {
        console.error('Failed to send program status email:', error);
    }));
    // 2. Web Push Notification Promise
    if (user.pushSubscription) {
        const payload = JSON.stringify({
            title: 'FlexSpace Pro: Program Status Changed',
            body: 'Program "' + after.programTitle + '" status: ' + after.status,
            icon: '/icon-192x192.png',
            data: {
                url: '/program'
            }
        });
        notificationPromises.push(webpush.sendNotification(user.pushSubscription, payload).then(() => {
            console.log('Program push notification sent successfully.');
        }).catch(pushError => {
            console.error('Failed to send program push notification:', pushError);
            if (pushError.statusCode === 404 || pushError.statusCode === 410) {
                console.log('Subscription has expired or is no longer valid. Removing...');
                return db.collection('users').doc(after.userId).update({
                    pushSubscription: admin.firestore.FieldValue.delete()
                });
            }
            return null;
        }));
    }
    // 3. Slack Notification Promise
    notificationPromises.push((async () => {
        try {
            // Slack 알림 전송
            await (0, notification_utils_1.sendSlackWithRetry)(() => (0, notification_utils_1.sendProgramStatusSlackAlert)(after, user, before.status, after.status));
            console.log(`Slack notification sent for program status change: ${before.status} -> ${after.status}`);
        }
        catch (slackError) {
            console.error('Failed to send program Slack notification:', slackError);
        }
    })());
    await Promise.all(notificationPromises);
    return null;
});
// --- 강화된 보안을 위한 Custom Claims 관리 ---
/**
 * 관리자 이메일 확인 함수
 */
function isAdminEmail(email) {
    return ADMIN_EMAILS.includes(email);
}
/**
 * Custom Claims를 통한 관리자 권한 설정
 * 보안 규칙의 get() 호출 문제를 해결하기 위해 토큰 기반 권한 확인 사용
 */
exports.setAdminClaims = functions.https.onCall(async (data, context) => {
    // 1. 인증 확인
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }
    // 2. 관리자 권한 확인 (이메일 기반)
    const callerEmail = context.auth.token.email;
    if (!callerEmail || !isAdminEmail(callerEmail)) {
        throw new functions.https.HttpsError('permission-denied', '관리자만 권한을 설정할 수 있습니다.');
    }
    const { uid, email, role, admin } = data;
    // 3. 입력 유효성 검증
    if (!uid || !email) {
        throw new functions.https.HttpsError('invalid-argument', 'UID와 이메일이 필요합니다.');
    }
    // 4. 대상 사용자가 관리자 이메일인지 확인
    if (!isAdminEmail(email)) {
        throw new functions.https.HttpsError('invalid-argument', '관리자 권한을 부여할 수 없는 이메일입니다.');
    }
    try {
        console.log(`관리자 Custom Claims 설정: ${email} (${uid})`);
        // 5. Custom Claims 설정
        const customClaims = {
            role: role || 'admin',
            admin: admin !== undefined ? admin : true,
            email: email,
            updatedAt: Date.now()
        };
        await admin.auth().setCustomUserClaims(uid, customClaims);
        // 6. Firestore 사용자 문서도 업데이트
        await db.collection('users').doc(uid).update({
            role: 'admin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Custom Claims 설정 완료: ${email}`, customClaims);
        return {
            success: true,
            message: `${email}에게 관리자 권한이 설정되었습니다.`,
            claims: customClaims
        };
    }
    catch (error) {
        console.error('Custom Claims 설정 실패:', error);
        throw new functions.https.HttpsError('internal', `권한 설정 중 오류가 발생했습니다: ${error.message}`);
    }
});
/**
 * 사용자의 관리자 권한 확인 (토큰 기반)
 * 보안 규칙에서 get() 호출 없이 사용할 수 있는 방식
 */
exports.checkAdminRole = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        return { isAdmin: false, source: 'none' };
    }
    const userEmail = context.auth.token.email;
    const customClaims = context.auth.token;
    // 1. Custom Claims 확인
    if (customClaims.role === 'admin' || customClaims.admin === true) {
        return {
            isAdmin: true,
            source: 'token',
            claims: {
                role: customClaims.role,
                admin: customClaims.admin
            }
        };
    }
    // 2. 이메일 기반 백업 확인
    if (userEmail && isAdminEmail(userEmail)) {
        console.log(`이메일 기반 관리자 확인: ${userEmail}`);
        // Custom Claims가 없는 경우 자동 설정
        try {
            await admin.auth().setCustomUserClaims(context.auth.uid, {
                role: 'admin',
                admin: true,
                email: userEmail,
                autoGranted: true,
                updatedAt: Date.now()
            });
            return {
                isAdmin: true,
                source: 'email',
                autoGranted: true
            };
        }
        catch (error) {
            console.error('자동 권한 부여 실패:', error);
            return {
                isAdmin: true,
                source: 'email',
                error: error.message || 'Unknown error'
            };
        }
    }
    return { isAdmin: false, source: 'none' };
});
/**
 * 모든 관리자 계정의 Custom Claims 일괄 설정
 * 초기 설정이나 마이그레이션 용도
 */
exports.initializeAdminClaims = functions.https.onCall(async (data, context) => {
    // 슈퍼 관리자만 실행 가능
    if (!context.auth || !context.auth.token.email || !['admin@flexspace.test', 'kan@naver.com'].includes(context.auth.token.email)) {
        throw new functions.https.HttpsError('permission-denied', '슈퍼 관리자만 실행할 수 있습니다.');
    }
    const results = [];
    try {
        console.log('관리자 계정 Custom Claims 일괄 설정 시작...');
        // 모든 관리자 이메일에 대해 처리
        for (const adminEmail of ADMIN_EMAILS) {
            try {
                // 이메일로 사용자 찾기
                const userRecord = await admin.auth().getUserByEmail(adminEmail);
                // Custom Claims 설정
                await admin.auth().setCustomUserClaims(userRecord.uid, {
                    role: 'admin',
                    admin: true,
                    email: adminEmail,
                    batchInitialized: true,
                    updatedAt: Date.now()
                });
                // Firestore 업데이트
                await db.collection('users').doc(userRecord.uid).update({
                    role: 'admin',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                results.push({
                    email: adminEmail,
                    uid: userRecord.uid,
                    success: true
                });
                console.log(`관리자 권한 설정 완료: ${adminEmail} (${userRecord.uid})`);
            }
            catch (userError) {
                console.warn(`사용자 처리 실패: ${adminEmail}`, userError.message);
                results.push({
                    email: adminEmail,
                    success: false,
                    error: userError.message
                });
            }
        }
        return {
            success: true,
            message: `${results.filter(r => r.success).length}/${ADMIN_EMAILS.length} 관리자 계정 설정 완료`,
            results: results
        };
    }
    catch (error) {
        console.error('일괄 권한 설정 실패:', error);
        throw new functions.https.HttpsError('internal', `일괄 설정 중 오류가 발생했습니다: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map