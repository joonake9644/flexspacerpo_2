// ?좉린??愿怨?遺꾩꽍 諛?由ы뙥?좊쭅???듯빐 ?덉젙?붾맂 肄붾뱶
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as Joi from 'joi';
import * as nodemailer from 'nodemailer';
import * as webpush from 'web-push';

import { Booking, Facility, CreateBookingData, User, ProgramApplication, CreateProgramApplicationData } from './types';
// NOTE: Removed external app util imports for Functions build isolation

// Firebase Admin SDK 珥덇린??(??踰덈쭔 ?ㅽ뻾?섎룄濡?蹂댁옣)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// --- Joi ?ㅽ궎留??뺤쓽 ---
const bookingSchema = Joi.object({
  facilityId: Joi.string().required(),
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required(),
  startTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  purpose: Joi.string().min(5).max(100).required(),
  category: Joi.string().valid('personal', 'club', 'event', 'class').required(),
  organization: Joi.string().allow('').max(50),
  numberOfParticipants: Joi.number().integer().min(1).required(),
});

// --- Cloud Functions ---

/**
 * ?덈줈???쒖꽕 ?愿 ?덉빟???앹꽦?⑸땲??
 */
export const createBooking = functions.https.onCall(async (data: CreateBookingData, context) => {
  // 1. ?몄쬆 ?뺤씤
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎.');
  }
  const userId = context.auth.uid;
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', '?ъ슜???뺣낫瑜?李얠쓣 ???놁뒿?덈떎.');
  }
  const user = userDoc.data() as User;

  // 2. 입력 데이터 유효성 검증
  const { error, value } = bookingSchema.validate(data);
  if (error) {
    throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
  }

  const { facilityId, startDate, endDate, startTime, endTime, numberOfParticipants } = value;
  const startISO = `${startDate}T${startTime}`;
  const endISO = `${endDate}T${endTime}`;

  if (startISO >= endISO) {
    throw new functions.https.HttpsError('invalid-argument', '?쒖옉 ?쒓컙? 醫낅즺 ?쒓컙蹂대떎 鍮⑤씪???⑸땲??');
  }

  const facilityRef = db.collection('facilities').doc(facilityId);
  const bookingsRef = db.collection('bookings');

  try {
    const newBookingId = await db.runTransaction(async (transaction) => {
      const facilityDoc = await transaction.get(facilityRef);
      if (!facilityDoc.exists) {
        throw new functions.https.HttpsError('not-found', '議댁옱?섏? ?딅뒗 ?쒖꽕?낅땲??');
      }
      const facility = facilityDoc.data() as Facility;

      // Date 媛앹껜 ?앹꽦 ?놁씠 ISO 臾몄옄?대줈 吏곸젒 荑쇰━
      const conflictQuery = bookingsRef
        .where('facilityId', '==', facilityId)
        .where('status', 'in', ['pending', 'approved'])
        .where('startTime', '<', endISO);
      
      const snapshot = await transaction.get(conflictQuery);
      
      let totalParticipantsInOverlap = 0;
      for (const doc of snapshot.docs) {
        const existingBooking = doc.data() as Booking;
        const existingStart = `${existingBooking.startDate}T${existingBooking.startTime}`;
        const existingEnd = `${existingBooking.endDate}T${existingBooking.endTime}`;

        // 踰꾪띁 ?쒓컙??怨좊젮??鍮꾧탳媛 ?꾩슂?섎떎硫? ?ш린??遺??⑥쐞濡?蹂?섑븯??鍮꾧탳?댁빞 ??        // ?꾩옱 濡쒖쭅?먯꽌??踰꾪띁 ?쒓컙 鍮꾧탳瑜??앸왂?섍퀬 ?쒓컙?留?鍮꾧탳
        if (startISO < existingEnd && endISO > existingStart) {
          if (facility.capacity === 1) {
            throw new functions.https.HttpsError('failed-precondition', '?대떦 ?쒓컙???대? ?ㅻⅨ ?덉빟??議댁옱?섏뿬 ?좎껌?????놁뒿?덈떎.');
          }
          totalParticipantsInOverlap += existingBooking.numberOfParticipants;
        }
      }

      if (facility.capacity > 1 && (totalParticipantsInOverlap + numberOfParticipants > facility.capacity)) {
        throw new functions.https.HttpsError('resource-exhausted', `?덉빟 媛?ν븳 ?몄썝??珥덇낵?덉뒿?덈떎.`);
      }

      const newBookingRef = db.collection('bookings').doc();
      // Omit<Booking, 'id'> ??낆뿉 留욊쾶 紐⑤뱺 ?꾩닔 ?꾨뱶瑜?梨꾩썙以띾땲??
      const newBookingData: Omit<Booking, 'id'> = {
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

    return { success: true, bookingId: newBookingId, message: '?덉빟 ?좎껌???깃났?곸쑝濡??꾨즺?섏뿀?듬땲??' };

  } catch (err: any) {
    console.error('Booking creation failed:', err);
    if (err instanceof functions.https.HttpsError) {
      throw err;
    }
    throw new functions.https.HttpsError('internal', '?덉빟 ?앹꽦 以??????녿뒗 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
  }
});

/**
 * ?꾨줈洹몃옩???좎껌?⑸땲?? (湲곕낯 援ъ“ ?꾩꽦)
 */
export const createProgramApplication = functions.https.onCall(async (data: CreateProgramApplicationData, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎.');
  }
  const { programId } = data;
  if (!programId) {
    throw new functions.https.HttpsError('invalid-argument', '?꾨줈洹몃옩 ID媛 ?꾩슂?⑸땲??');
  }

  const newApplicationRef = db.collection('program_applications').doc();
  const applicationData: Omit<ProgramApplication, 'id'> = {
    userId: context.auth.uid,
    programId,
    status: 'pending',
    appliedAt: admin.firestore.FieldValue.serverTimestamp(),
    userName: context.auth.token?.name || 'Unknown User',
    userEmail: context.auth.token?.email,
    programTitle: 'Unknown Program',
  };

  await newApplicationRef.set(applicationData);

  return { success: true, applicationId: newApplicationRef.id };
});

// Helper function to check for admin privileges
const isUserAdmin = async (uid: string): Promise<boolean> => {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return false;
  return userDoc.data()?.role === 'admin';
};

/**
 * ?덉빟 ?곹깭瑜?蹂寃쏀빀?덈떎. (愿由ъ옄 ?꾩슜)
 */
export const updateReservationStatus = functions.https.onCall(async (data, context) => {
  // 1. ?몄쬆 諛?愿由ъ옄 沅뚰븳 ?뺤씤
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎.');
  }
  const isAdmin = await isUserAdmin(context.auth.uid);
  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', '愿由ъ옄 沅뚰븳???꾩슂?⑸땲??');
  }

  // 2. 입력 데이터 유효성 검증
  const { reservationId, status, adminNotes } = data;
  if (!reservationId || !status) {
    throw new functions.https.HttpsError('invalid-argument', '?덉빟 ID? ?곹깭???꾩닔?낅땲??');
  }
  if (!['approved', 'rejected', 'completed'].includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', '?좏슚?섏? ?딆? ?곹깭 媛믪엯?덈떎.');
  }

  // 3. ?덉빟 臾몄꽌 ?낅뜲?댄듃
  try {
    const reservationRef = db.collection('bookings').doc(reservationId);
    const updateData: { status: string; rejectionReason?: string; updatedAt?: any } = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (status === 'rejected' && adminNotes) {
      updateData.rejectionReason = adminNotes;
    }
    
    await reservationRef.update(updateData);

    return { success: true, message: '?덉빟 ?곹깭媛 ?깃났?곸쑝濡??낅뜲?댄듃?섏뿀?듬땲??' };
  } catch (error) {
    console.error('Reservation status update failed:', error);
    throw new functions.https.HttpsError('internal', '?덉빟 ?곹깭 ?낅뜲?댄듃 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
  }
});

/**
 * Saves a user's web push subscription to their user document.
 */
export const subscribeToPush = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎.');
  }

  const { subscription } = data;
  if (!subscription) {
    throw new functions.https.HttpsError('invalid-argument', '援щ룆 媛앹껜媛 ?꾩슂?⑸땲??');
  }

  try {
    const userRef = db.collection('users').doc(context.auth.uid);
    // Use merge: true to avoid overwriting the whole document
    await userRef.set({ pushSubscription: subscription }, { merge: true });
    return { success: true, message: '?몄떆 ?뚮┝??援щ룆?섏뿀?듬땲??' };
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    throw new functions.https.HttpsError('internal', '援щ룆 ?뺣낫 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎.');
  }
});

// --- ?대찓??諛??몄떆 ?뚮┝ 愿??---

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
    // ?⑥닔紐??ㅽ? ?섏젙: setVapIDDetails -> setVapidDetails
    webpush.setVapidDetails(
      'mailto:admin@example.com',
      vapidPublicKey,
      vapidPrivateKey
    );
  }
} catch (e) {
  console.warn('VAPID keys invalid or not set. Push notifications disabled.');
}

/**
 * ?덉빟 ?곹깭 蹂寃????ъ슜?먯뿉寃??대찓???뚮┝??蹂대깄?덈떎.
 */
export const onBookingStatusChange = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Booking;
    const after = change.after.data() as Booking;

    if (before.status === after.status) {
      return null;
    }

    const userDoc = await db.collection('users').doc(after.userId).get();
    if (!userDoc.exists) {
      console.error(`User not found: ${after.userId}`);
      return null;
    }
    const user = userDoc.data() as User;

    const mailOptions = {
      from: '"FlexSpace Pro" <noreply@flexspace.pro>',
      to: user.email,
      subject: `[FlexSpace Pro] ?덉빟 ?곹깭 蹂寃??뚮┝: ${after.purpose}`,
      html: `
        <h1>?덉빟 ?곹깭 蹂寃??뚮┝</h1>
        <p><strong>${after.purpose}</strong> ?덉빟???곹깭媛 <strong>${before.status}</strong>?먯꽌 <strong>${after.status}</strong>(??濡?蹂寃쎈릺?덉뒿?덈떎.</p>
        <p>?먯꽭???댁슜? ?깆뿉???뺤씤?댁＜?몄슂.</p>
      `
    };

    const notificationPromises = [];

    // 1. Email Notification Promise
    notificationPromises.push(
      transporter.sendMail(mailOptions).then(() => {
        console.log(`Status change email sent to ${user.email}`);
      }).catch(error => {
        console.error('Failed to send email:', error);
      })
    );

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

      notificationPromises.push(
        webpush.sendNotification(user.pushSubscription, payload).then(() => {
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
        })
      );
    }

    await Promise.all(notificationPromises);

    return null;
  });





