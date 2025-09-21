# 체육관 예약 시스템 고도화 TRD (Technical Requirements Document)

## 1. 시스템 아키텍처 (정확한 기술 스택 기반)

### 1.1 전체 시스템 구조
```
[Vite + React 19 + TypeScript SPA] 
    ↓ HTTPS
[Firebase Hosting]
    ↓ Firebase SDK
[Firebase Authentication] ← [Firestore Database]
    ↓ HTTP Triggers        ↓ Triggers  
[Cloud Functions] → [Email Service] → [Push Notification Service]
    ↓
[External APIs (SMTP, FCM)]
```

### 1.2 현재 구현된 기술 스택
```
빌드 도구: Vite
프레임워크: React 19
언어: TypeScript
스타일링: Tailwind CSS + clsx + tailwind-merge
아이콘: Lucide React
백엔드: Firebase (Auth + Firestore)
린팅: ESLint
구조: SPA (탭 기반 네비게이션)
```

### 1.3 현재 구현된 아키텍처
```
App.tsx (메인 컨테이너)
├── LoginForm (인증)
├── Navigation (탭 네비게이션) 
├── Dashboard (대시보드)
├── BookingSection (대관 관리)
├── ProgramSection (프로그램 관리)  
├── AdminSection (관리자 기능)
└── UserManagement (사용자 관리)

설정 파일:
├── vite.config.ts (Vite 설정)
├── tsconfig.json (TypeScript 설정)
├── firebase.ts (Firebase 설정)
├── types.ts (타입 정의)
├── utils.ts (clsx, tailwind-merge 유틸리티)

Hooks:
├── use-auth.ts (인증 관리)
├── use-firestore.ts (데이터 관리)

Firebase:
├── firebase.ts (설정)
├── Firestore (데이터베이스)
└── Authentication (인증)
```

### 1.4 데이터 플로우
```
사용자 액션 → React 컴포넌트 → useFirestore 훅 → Firebase SDK
→ Cloud Function (신규 구현 필요) → Firestore 트랜잭션 
→ 성공/실패 응답 → 이메일/푸시 알림 → UI 상태 업데이트
```

---

## 2. 데이터베이스 설계

### 2.1 Firestore 컬렉션 구조 (기존 타입 기반 개선)

#### 2.1.1 예약 데이터 (bookings) - 기존 Booking 타입 개선
```javascript
{
  id: "auto_generated_id",
  userId: "user_uid",
  userName: "사용자명", // 기존 구현됨
  userEmail: "user@email.com", // 추가: 알림용
  startDate: "2024-01-15", // YYYY-MM-DD 형식 (기존)
  endDate: "2024-01-15", // YYYY-MM-DD 형식 (기존)
  startTime: "10:00", // HH:MM 형식 (기존)
  endTime: "11:00", // HH:MM 형식 (기존)
  purpose: "농구부 정기 연습", // 기존 구현됨
  organization: "이학생회", // 기존 구현됨
  category: "class" | "event" | "club" | "personal", // 기존 구현됨
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed", // 기존 구현됨
  recurrenceRule: { // 기존 구현됨
    days: [1, 3, 5] // 0=일요일, 1=월요일, ...
  },
  rejectionReason: "string", // 기존 구현됨
  createdAt: Timestamp, // 추가 필요
  updatedAt: Timestamp, // 추가 필요
  // 알림 관련 새 필드들
  emailSent: boolean,
  lastNotificationAt: Timestamp
}
```

#### 2.1.2 사용자 데이터 (users) - 기존 User 타입 개선  
```javascript
{
  uid: "user_uid",
  id: "user_uid", // 기존 구현됨
  name: "사용자명", // 기존 구현됨
  email: "user@email.com", // 기존 구현됨
  phone: "010-1234-5678", // 기존 구현됨 (선택적)
  role: "user" | "admin", // 기존 구현됨
  // 새로 추가할 필드들
  isActive: boolean,
  notificationSettings: {
    email: boolean,
    webPush: boolean,
    reservationConfirm: boolean,
    statusUpdate: boolean
  },
  pushSubscription: {
    endpoint: "string",
    keys: {
      p256dh: "string", 
      auth: "string"
    }
  },
  createdAt: Timestamp,
  lastLoginAt: Timestamp
}
```

#### 2.1.3 프로그램 데이터 (programs) - 기존 Program 타입 유지
```javascript
// 기존 구현된 Program 타입 그대로 사용
{
  id: "auto_generated_id",
  title: "요가 초급반",
  description: "초보자를 위한 요가",
  instructor: "김강사",
  capacity: 20,
  enrolled: 15, // 기존 구현됨
  scheduleDays: [1, 3, 5], // 기존 구현됨
  startTime: "10:00", // 기존 구현됨
  endTime: "11:00", // 기존 구현됨
  startDate: "2024-01-15", // 기존 구현됨
  endDate: "2024-03-15", // 기존 구현됨
  level: "beginner" | "intermediate" | "advanced", // 기존 구현됨
  category: "yoga" | "pilates" | "fitness" | "dance" | "badminton" | "pickleball", // 기존 구현됨
  fee: 50000 // 기존 구현됨
}
```

#### 2.1.4 프로그램 신청 (program_applications) - 기존 ProgramApplication 타입 개선
```javascript
{
  id: "auto_generated_id", 
  userId: "user_uid", // 기존 구현됨
  userName: "사용자명", // 기존 구현됨
  userEmail: "user@email.com", // 기존 구현됨 (선택적) → 필수로 변경
  programId: "program_id", // 기존 구현됨
  programTitle: "요가 초급반", // 기존 구현됨  
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed" | "waitlisted", // 기존 구현됨
  appliedAt: "2024-01-15", // 기존 구현됨 (YYYY-MM-DD 또는 ISO string)
  rejectionReason: "string", // 기존 구현됨 (선택적)
  // 새로 추가할 필드들
  createdAt: Timestamp,
  updatedAt: Timestamp,
  emailSent: boolean,
  lastNotificationAt: Timestamp
}
```

#### 2.1.5 운동 종목 관리 (sportTypes) - 신규 추가
```javascript
{
  id: "auto_generated_id",
  code: "YOGA_001", // 관리자가 설정하는 코드
  name: "요가",
  description: "몸과 마음의 균형을 찾는 운동",
  isActive: boolean,
  category: "fitness" | "sports" | "dance" | "martial_arts",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "admin_uid"
}
```

### 2.2 보안 규칙 (Security Rules)
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 본인 데이터만 읽기/쓰기
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 예약 데이터: 사용자는 본인 예약만, 관리자는 모든 예약
    match /reservations/{reservationId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         isAdmin(request.auth.uid));
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    // 관리자만 접근 가능한 컬렉션
    match /sportTypes/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    function isAdmin(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data.isAdmin == true;
    }
  }
}
```

---

## 3. Cloud Functions 구현

### 3.1 동시 예약 제어 함수

#### 3.1.1 createBooking Function
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

exports.reserveLocation = functions.https.onCall(async (data, context) => {
  // 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const { locationId, startTime, endTime, locationType } = data;
  const userId = context.auth.uid;
  const db = admin.firestore();

  try {
    // 트랜잭션으로 동시성 제어
    const result = await db.runTransaction(async (transaction) => {
      // 1. 겹치는 예약 조회
      const conflictQuery = db.collection('reservations')
        .where('locationId', '==', locationId)
        .where('status', 'in', ['pending', 'approved'])
        .where('startTime', '<', new Date(endTime))
        .where('endTime', '>', new Date(startTime));
      
      const conflictSnapshot = await transaction.get(conflictQuery);
      
      if (!conflictSnapshot.empty) {
        throw new Error('이미 예약된 시간입니다.');
      }

      // 2. 새 예약 생성
      const newReservationRef = db.collection('reservations').doc();
      const reservationData = {
        userId,
        userEmail: context.auth.token.email,
        locationId,
        locationType,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      transaction.set(newReservationRef, reservationData);
      
      return { id: newReservationRef.id, ...reservationData };
    });

    // 3. 성공 시 이메일 발송
    await sendReservationConfirmEmail(result);
    
    return { success: true, reservation: result };
    
  } catch (error) {
    console.error('Reservation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

#### 3.1.2 updateReservationStatus Function
```javascript
exports.updateReservationStatus = functions.https.onCall(async (data, context) => {
  // 관리자 권한 확인
  if (!context.auth || !await isUserAdmin(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
  }

  const { reservationId, status, adminNotes } = data;
  const db = admin.firestore();

  try {
    const reservationRef = db.collection('reservations').doc(reservationId);
    const reservation = await reservationRef.get();
    
    if (!reservation.exists) {
      throw new Error('예약을 찾을 수 없습니다.');
    }

    const updateData = {
      status,
      adminNotes: adminNotes || '',
      updatedAt: FieldValue.serverTimestamp()
    };

    await reservationRef.update(updateData);

    // 사용자에게 알림 발송
    const reservationData = reservation.data();
    await Promise.all([
      sendStatusUpdateEmail(reservationData, status),
      sendWebPushNotification(reservationData.userId, status)
    ]);

    return { success: true };
  } catch (error) {
    console.error('Status update error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### 3.2 이메일 알림 시스템

#### 3.2.1 Email Service 설정
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

async function sendReservationConfirmEmail(reservation) {
  const mailOptions = {
    from: functions.config().email.user,
    to: reservation.userEmail,
    subject: '[체육관] 예약 신청이 완료되었습니다',
    html: generateReservationEmailTemplate(reservation)
  };

  return transporter.sendMail(mailOptions);
}

function generateReservationEmailTemplate(reservation) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>예약 신청 완료</h2>
      <p>안녕하세요, 예약 신청이 완료되었습니다.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
        <p><strong>예약 시간:</strong> ${formatDateTime(reservation.startTime)} ~ ${formatDateTime(reservation.endTime)}</p>
        <p><strong>상태:</strong> 승인 대기중</p>
        <p><strong>예약 ID:</strong> ${reservation.id}</p>
      </div>
      <p>관리자 승인 후 최종 확정됩니다.</p>
    </div>
  `;
}
```

#### 3.2.2 비밀번호 재설정 트리거
```javascript
exports.sendPasswordResetEmail = functions.auth.user().onCreate(async (user) => {
  // Custom claim 설정 등 추가 로직
});

// 비밀번호 재설정 요청 처리
exports.requestPasswordReset = functions.https.onCall(async (data, context) => {
  const { email } = data;
  
  try {
    await admin.auth().generatePasswordResetLink(email, {
      url: 'https://yourapp.com/reset-password',
      handleCodeInApp: false
    });
    
    return { success: true, message: '재설정 링크가 전송되었습니다.' };
  } catch (error) {
    throw new functions.https.HttpsError('internal', '이메일 전송에 실패했습니다.');
  }
});
```

### 3.3 웹 푸시 알림 시스템

#### 3.3.1 Push Subscription 관리
```javascript
const webpush = require('web-push');

// VAPID 키 설정
webpush.setVapIDDetails(
  'mailto:admin@yourapp.com',
  functions.config().vapid.public_key,
  functions.config().vapid.private_key
);

async function sendWebPushNotification(userId, status) {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  if (!userData.pushSubscription || !userData.notificationSettings.webPush) {
    return;
  }

  const payload = JSON.stringify({
    title: '예약 상태 업데이트',
    body: `예약이 ${status === 'approved' ? '승인' : '거절'}되었습니다.`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { 
      url: '/reservations',
      reservationStatus: status
    }
  });

  try {
    await webpush.sendNotification(userData.pushSubscription, payload);
  } catch (error) {
    console.error('Push notification failed:', error);
    
    // 구독 정보가 만료된 경우 삭제
    if (error.statusCode === 410) {
      await admin.firestore().collection('users').doc(userId).update({
        pushSubscription: admin.firestore.FieldValue.delete()
      });
    }
  }
}
```

---

## 4. 프론트엔드 구현 (기존 코드 개선)

### 4.1 현재 구현된 구조 분석

#### 4.1.1 기존 컴포넌트 구조 개선
```typescript
// 현재 구현된 구조 (유지 및 개선)
src/
├── App.tsx                    // 메인 컨테이너 (구현됨)
├── index.tsx                  // 진입점 (구현됨)
├── firebase.ts                // Firebase 설정 (구현됨)
├── types.ts                   // 타입 정의 (구현됨)
├── utils.ts                   // 유틸리티 함수 (구현됨)
├── components/
│   ├── LoginForm.tsx          // 로그인 (구현됨)
│   ├── Navigation.tsx         // 네비게이션 (구현됨)
│   ├── Dashboard.tsx          // 대시보드 (구현됨)
│   ├── BookingSection.tsx     // 대관 관리 (구현됨)
│   ├── ProgramSection.tsx     // 프로그램 관리 (구현됨)
│   ├── AdminSection.tsx       // 관리자 (구현됨)
│   ├── UserManagement.tsx     // 사용자 관리 (구현됨)
│   └── BookingCalendar.tsx    // 캘린더 (구현됨)
├── hooks/
│   ├── use-auth.ts           // 인증 훅 (구현됨)
│   └── use-firestore.ts      // Firestore 훅 (구현됨)
└── app/
    ├── globals.css           // 스타일 (구현됨)
    ├── layout.tsx            // 레이아웃 (구현됨)
    └── page.tsx              // 페이지 (구현됨)
```

### 4.2 기존 컴포넌트 개선 방향

#### 4.2.1 BookingSection.tsx 개선 (Cloud Functions 연동)
```typescript
// 기존 코드에 Cloud Functions 연동 추가
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

export default function BookingSection({ currentUser, bookings, setBookings }: BookingSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cloud Function 연동 추가
  const createBookingFn = httpsCallable(functions, 'createBooking');
  
  const handleBookingSubmit = async (bookingData: CreateBookingData) => {
    setIsSubmitting(true);
    try {
      // 기존 클라이언트 검증은 유지하되, 서버 검증 추가
      const result = await reserveLocationFn({
        ...bookingData,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email
      });
      
      if (result.data.success) {
        // 기존 상태 업데이트 로직 유지
        setBookings(prev => [result.data.reservation, ...prev]);
        // 성공 알림 추가
        showNotification('예약 신청이 완료되었습니다. 승인을 기다려 주세요.', 'success');
        resetForm();
      }
    } catch (error) {
      // 충돌 에러 처리 개선
      if (error.message.includes('이미 예약된')) {
        showNotification('선택하신 시간에 이미 다른 예약이 있습니다. 다른 시간을 선택해 주세요.', 'error');
      } else {
        showNotification('예약 신청 중 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
      }
      console.error('예약 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 기존 JSX 구조는 유지하되, 로딩 상태 추가
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 기존 UI 유지 */}
      <form onSubmit={handleBookingSubmit}>
        {/* 기존 폼 필드들 유지 */}
        <button 
          type="submit" 
          disabled={isSubmitting || hasTimeConflict}
          className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
        >
          {isSubmitting ? '처리 중...' : '대관 신청하기'}
        </button>
      </form>
    </div>
  );
}
```

#### 4.2.2 AdminSection.tsx 개선 (이메일 알림 연동)
```typescript
// 기존 AdminSection.tsx에 Cloud Functions 연동 추가
import { httpsCallable } from 'firebase/functions';

export default function AdminSection(props: AdminSectionProps) {
  const updateReservationStatusFn = httpsCallable(functions, 'updateReservationStatus');

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      // Cloud Function 호출로 이메일 자동 발송
      const result = await updateReservationStatusFn({
        reservationId: bookingId,
        status: action === 'approve' ? 'approved' : 'rejected',
        adminNotes: reason || ''
      });

      if (result.data.success) {
        // 기존 상태 업데이트 로직 유지
        setBookings(prev => prev.map(b => 
          b.id === bookingId 
            ? { ...b, status: action === 'approve' ? 'approved' : 'rejected', rejectionReason: reason }
            : b
        ));
        
        showNotification(
          `예약이 ${action === 'approve' ? '승인' : '거절'}되었습니다. 사용자에게 이메일이 발송됩니다.`, 
          'success'
        );
      }
    } catch (error) {
      showNotification('처리 중 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
      console.error('상태 업데이트 실패:', error);
    }
  };

  // 기존 UI 구조 유지
  // ...
}
```

### 4.3 새로운 서비스 훅 추가

#### 4.3.1 알림 서비스 훅 (신규)
```typescript
// hooks/use-notification.ts
import { useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = 'info', duration = 5000) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    showNotification,
    removeNotification
  };
}
```

#### 4.3.2 웹 푸시 알림 훅 (신규)
```typescript
// hooks/use-web-push.ts
import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const subscribeToPushFn = httpsCallable(functions, 'subscribeToPush');

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      throw new Error('푸시 알림이 지원되지 않는 브라우저입니다.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('알림 권한이 거부되었습니다.');
    }

    return subscribeToPush();
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY!)
      });

      // 서버에 구독 정보 저장
      await subscribeToPushFn({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(subscription.getKey('auth')!)
          }
        }
      });

      setSubscription(subscription);
      setIsSubscribed(true);
      return subscription;
    } catch (error) {
      console.error('푸시 구독 실패:', error);
      throw error;
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    requestPermission,
    subscribeToPush
  };
}
```

### 4.4 Vite 설정 개선

#### 4.4.1 vite.config.ts 개선
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  envPrefix: 'VITE_',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          'ui': ['lucide-react'],
        }
      }
    }
  },
  // PWA를 위한 설정
  define: {
    '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
  }
})
```

### 4.5 Service Worker 추가 (PWA/푸시 알림)

#### 4.5.1 public/sw.js (신규)
```javascript
// Service Worker for PWA and Push Notifications
const CACHE_NAME = 'flexspace-pro-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// 푸시 알림 처리
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.data,
      actions: [
        {
          action: 'view',
          title: '확인',
          icon: '/icons/check.png'
        },
        {
          action: 'close',
          title: '닫기',
          icon: '/icons/close.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});
```

---

## 5. 테스트 전략

### 5.1 단위 테스트

#### 5.1.1 Cloud Functions 테스트
```javascript
// test/functions/reservation.test.js
const test = require('firebase-functions-test')();
const admin = require('firebase-admin');

describe('createBooking Function', () => {
  let reserveLocation;
  
  beforeAll(() => {
    reserveLocation = require('../../functions/index').reserveLocation;
  });
  
  afterAll(() => {
    test.cleanup();
  });

  test('동시 예약 시 충돌 감지', async () => {
    const data = {
      locationId: 'test-location',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z'
    };
    
    const context = {
      auth: { uid: 'test-user', token: { email: 'test@example.com' } }
    };

    // 첫 번째 예약 성공
    const result1 = await reserveLocation(data, context);
    expect(result1.success).toBe(true);

    // 두 번째 예약 실패 (충돌)
    await expect(reserveLocation(data, context))
      .rejects.toThrow('이미 예약된 시간입니다');
  });

  test('유효하지 않은 시간 입력 시 에러', async () => {
    const data = {
      locationId: 'test-location',
      startTime: '2024-01-01T11:00:00Z',
      endTime: '2024-01-01T10:00:00Z' // 종료시간이 시작시간보다 빠름
    };
    
    const context = {
      auth: { uid: 'test-user', token: { email: 'test@example.com' } }
    };

    await expect(reserveLocation(data, context))
      .rejects.toThrow('종료시간은 시작시간보다 늦어야 합니다');
  });
});
```

#### 5.1.2 프론트엔드 컴포넌트 테스트
```javascript
// test/components/ReservationForm.test.js
import { mount } from '@vue/test-utils';
import ReservationForm from '@/components/reservation/ReservationForm.vue';

describe('ReservationForm.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(ReservationForm, {
      global: {
        mocks: {
          $reservationService: {
            createReservation: jest.fn(),
            checkAvailability: jest.fn()
          }
        }
      }
    });
  });

  test('당일 이벤트 시 반복 설정 숨김', async () => {
    await wrapper.setData({
      form: {
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00')
      }
    });

    expect(wrapper.find('.recurring-settings').exists()).toBe(false);
  });

  test('다른 날짜 선택 시 반복 설정 표시', async () => {
    await wrapper.setData({
      form: {
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-02T11:00:00')
      }
    });

    expect(wrapper.find('.recurring-settings').exists()).toBe(true);
  });

  test('충돌 감지 시 제출 버튼 비활성화', async () => {
    await wrapper.setData({ hasConflict: true });
    
    const submitButton = wrapper.find('button[type="submit"]');
    expect(submitButton.attributes('disabled')).toBeDefined();
  });
});
```

### 5.2 통합 테스트

#### 5.2.1 E2E 테스트 (Cypress)
```javascript
// cypress/integration/reservation.spec.js
describe('예약 시스템', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password');
    cy.visit('/reservations/new');
  });

  it('예약 신청 플로우', () => {
    // 시설 선택
    cy.get('[data-cy=location-select]').select('메인 체육관');
    
    // 날짜/시간 선택
    cy.get('[data-cy=date-picker]').click();
    cy.get('.date-cell[data-date="2024-01-15"]').click();
    cy.get('[data-cy=start-time]').select('10:00');
    cy.get('[data-cy=end-time]').select('11:00');

    // 가용성 확인
    cy.get('[data-cy=check-availability]').click();
    cy.get('[data-cy=availability-result]').should('contain', '예약 가능');

    // 예약 신청
    cy.get('[data-cy=submit-reservation]').click();
    
    // 성공 메시지 확인
    cy.get('[data-cy=success-message]')
      .should('be.visible')
      .and('contain', '예약 신청이 완료되었습니다');
  });

  it('동시 예약 충돌 처리', () => {
    // 첫 번째 사용자 예약
    cy.makeReservation('2024-01-15', '10:00', '11:00');
    
    // 두 번째 사용자로 동일 시간 예약 시도
    cy.login('user2@example.com', 'password');
    cy.visit('/reservations/new');
    
    cy.get('[data-cy=location-select]').select('메인 체육관');
    cy.selectDateTime('2024-01-15', '10:00', '11:00');
    
    cy.get('[data-cy=submit-reservation]').click();
    
    // 충돌 에러 메시지 확인
    cy.get('[data-cy=error-message]')
      .should('contain', '이미 예약된 시간입니다');
  });
});
```

### 5.3 부하 테스트

#### 5.3.1 동시 접속자 테스트
```javascript
// loadtest/reservation-load.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100, // 100명 동시 사용자
  duration: '5m',
};

export default function () {
  const payload = JSON.stringify({
    data: {
      locationId: 'test-location',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T11:00:00Z'
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.FIREBASE_TOKEN}`
    },
  };

  const response = http.post(`${__ENV.FUNCTIONS_URL}/createBooking`, payload, params);
  
  check(response, {
    '응답 시간 3초 이내': (r) => r.timings.duration < 3000,
    '상태 코드 정상': (r) => r.status === 200 || r.status === 400,
  });
}
```

---

## 6. 배포 및 모니터링

### 6.1 배포 파이프라인

#### 6.1.1 GitHub Actions 워크플로우
```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          npm ci
          cd functions && npm ci
          
      - name: Run tests
        run: |
          npm run test:unit
          npm run test:functions
          
      - name: Run E2E tests
        run: npm run test:e2e:headless

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Staging
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}'
          projectId: 'gym-reservation-staging'

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Production
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: 'gym-reservation-prod'
```

### 6.2 모니터링 및 로깅

#### 6.2.1 Cloud Functions 모니터링
```javascript
// functions/monitoring.js
const { logger } = require('firebase-functions');

// 구조화된 로깅
function logReservationEvent(eventType, data) {
  logger.info('Reservation Event', {
    eventType,
    userId: data.userId,
    locationId: data.locationId,
    timestamp: new Date().toISOString(),
    metadata: {
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status
    }
  });
}

// 에러 추적
function logError(error, context) {
  logger.error('Function Error', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
}

// 성능 메트릭
function logPerformanceMetric(functionName, duration, success) {
  logger.info('Performance Metric', {
    functionName,
    duration,
    success,
    timestamp: new Date().toISOString()
  });
}
```

#### 6.2.2 클라이언트 에러 추적
```javascript
// src/services/errorTracking.js
class ErrorTrackingService {
  constructor() {
    this.setupGlobalErrorHandler();
  }

  setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise_rejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack
      });
    });
  }

  trackError(errorData) {
    const errorInfo = {
      ...errorData,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId()
    };

    // Firebase Analytics로 에러 전송
    import('@/config/firebase').then(({ analytics }) => {
      logEvent(analytics, 'exception', {
        description: errorInfo.message,
        fatal: false
      });
    });

    // 심각한 에러는 개발팀에 알림
    if (this.isCriticalError(errorData)) {
      this.sendCriticalErrorAlert(errorInfo);
    }
  }

  isCriticalError(error) {
    const criticalPatterns = [
      /payment/i,
      /reservation.*conflict/i,
      /database.*transaction/i
    ];

    return criticalPatterns.some(pattern => 
      pattern.test(error.message || '')
    );
  }
}
```

---

## 7. 보안 고려사항

### 7.1 인증 및 권한 관리

#### 7.1.1 Custom Claims 설정
```javascript
// functions/auth.js
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // 슈퍼 관리자만 실행 가능
  if (!context.auth || !await isSuperAdmin(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', '권한이 없습니다.');
  }

  const { uid, isAdmin } = data;
  
  await admin.auth().setCustomUserClaims(uid, { isAdmin });
  
  return { success: true };
});

// 관리자 권한 확인
async function isUserAdmin(uid) {
  const userRecord = await admin.auth().getUser(uid);
  return userRecord.customClaims?.isAdmin === true;
}
```

### 7.2 데이터 검증

#### 7.2.1 입력 데이터 검증
```javascript
// functions/validation.js
const Joi = require('joi');

const reservationSchema = Joi.object({
  locationId: Joi.string().required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
  locationType: Joi.string().valid('gym', 'program').required()
});

function validateReservationData(data) {
  const { error, value } = reservationSchema.validate(data);
  if (error) {
    throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
  }
  return value;
}
```

### 7.3 Rate Limiting
```javascript
// functions/rateLimiting.js
const rateLimit = new Map();

function checkRateLimit(userId, action, limit = 10, window = 60000) {
  const key = `${userId}:${action}`;
  const now = Date.now();
  
  if (!rateLimit.has(key)) {
    rateLimit.set(key, { count: 1, resetTime: now + window });
    return true;
  }
  
  const record = rateLimit.get(key);
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + window;
    return true;
  }
  
  if (record.count >= limit) {
    throw new functions.https.HttpsError('resource-exhausted', '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.');
  }
  
  record.count++;
  return true;
}
```

---

## 8. 성능 최적화

### 8.1 데이터베이스 최적화

#### 8.1.1 인덱스 설정
```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "locationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

#### 8.1.2 데이터 캐싱
```javascript
// src/services/cacheService.js
class CacheService {
  constructor() {
    this.cache = new Map();
    this.TTL = 5 * 60 * 1000; // 5분
  }

  set(key, value, ttl = this.TTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  // 위치별 예약 정보 캐싱
  async getCachedReservations(locationId, startDate, endDate) {
    const cacheKey = `reservations:${locationId}:${startDate}:${endDate}`;
    let reservations = this.get(cacheKey);
    
    if (!reservations) {
      reservations = await this.fetchReservationsFromDB(locationId, startDate, endDate);
      this.set(cacheKey, reservations, 2 * 60 * 1000); // 2분 캐시
    }
    
    return reservations;
  }
}
```

### 8.2 프론트엔드 최적화

#### 8.2.1 번들 최적화
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor': ['vue', 'vue-router'],
          'admin': [
            './src/components/admin/AdminDashboard.vue',
            './src/components/admin/ReservationManager.vue'
          ]
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
```

---

## 9. 개발 워크플로우 (기존 코드 기반)

### 9.1 현재 상황 분석
**구현 완료된 부분:**
- ✅ 기본 UI/UX (Tailwind + Lucide React)
- ✅ Firebase 연동 (Auth, Firestore)
- ✅ 사용자 인증 시스템
- ✅ 대관 신청/관리 인터페이스
- ✅ 프로그램 신청/관리 인터페이스  
- ✅ 관리자 승인/거절 기능
- ✅ 실시간 데이터 동기화

**구현 필요한 부분:**
- ❌ Cloud Functions (동시성 제어, 이메일 알림)
- ❌ 웹 푸시 알림 시스템
- ❌ 에러 처리 및 사용자 피드백
- ❌ Security Rules 강화
- ❌ 성능 최적화

### 9.2 브랜칭 전략 (현실적)
```
main (production) - 현재 작동하는 코드
  ↑
develop (staging) - 새 기능 통합
  ↑
feature/cloud-functions    - 백엔드 로직
feature/email-notifications - 이메일 시스템
feature/web-push          - 푸시 알림
feature/error-handling    - 에러 처리
hotfix/urgent-fixes       - 긴급 수정
```

### 9.3 개발 단계별 체크리스트 (현실 기반)

#### Phase 1: 백엔드 안정화 (Week 1-2)
```
□ Cloud Functions 프로젝트 설정
  - functions 디렉토리 초기화
  - Firebase Functions CLI 설정  
  - TypeScript 환경 구성

□ 동시 예약 제어 함수 개발
  - reserveLocation function 구현
  - 트랜잭션 기반 충돌 검증
  - 기존 BookingSection.tsx 연동

□ Firestore Security Rules 강화
  - 현재 개방 규칙을 세분화
  - 사용자별 권한 제어
  - 관리자 권한 검증 추가

□ 테스트 환경 구축
  - Firebase Emulator Suite 설정
  - 기본 단위 테스트 작성
```

#### Phase 2: 알림 시스템 구축 (Week 2-3)  
```
□ 이메일 알림 시스템
  - Firebase Extensions 또는 Nodemailer 설정
  - 이메일 템플릿 작성 (HTML)
  - updateReservationStatus function 구현
  - AdminSection.tsx 연동

□ 이메일 발송 테스트
  - 예약 승인 메일 테스트
  - 예약 거절 메일 테스트
  - 비밀번호 재설정 메일 테스트

□ 기존 컴포넌트 개선
  - 성공/실패 피드백 추가
  - 로딩 상태 표시 개선
```

#### Phase 3: 사용자 경험 개선 (Week 3-4)
```
□ 웹 푸시 알림 (선택적)
  - Service Worker 등록 (public/sw.js)
  - PWA manifest 추가
  - 푸시 구독 관리 훅 개발
  - 알림 권한 요청 UI

□ 에러 처리 강화
  - 전역 에러 핸들러 추가
  - 사용자 친화적 에러 메시지
  - 네트워크 오류 재시도 로직

□ 성능 최적화
  - React.memo 적용
  - useMemo, useCallback 최적화
  - 불필요한 리렌더링 방지
```

#### Phase 4: 관리자 기능 고도화 (Week 4-5)
```
□ AdminSection.tsx 개선
  - 당일 이벤트 UI 로직 수정
  - 필터링 성능 최적화
  - 대량 데이터 페이지네이션

□ 운동 종목 코드 관리
  - sportTypes 컬렉션 추가
  - 관리자 인터페이스 개발  
  - 기존 하드코딩 제거

□ 데이터 분석 기능
  - 예약 통계 대시보드
  - 사용률 분석 차트
  - 엑셀 내보내기 기능
```

### 9.4 배포 및 테스트 전략

#### 9.4.1 로컬 개발 환경
```bash
# 1. 개발 환경 시작
npm run dev

# 2. Firebase Emulator 시작 (별도 터미널)
firebase emulators:start --only auth,firestore,functions

# 3. 개발 중 테스트
npm run test  # 단위 테스트
npm run build # 빌드 테스트
```

#### 9.4.2 스테이징 배포
```bash
# 1. develop 브랜치 병합
git checkout develop
git merge feature/[기능명]

# 2. 스테이징 배포
firebase use staging
firebase deploy --only hosting,functions

# 3. 스테이징 테스트
# - 전체 기능 통합 테스트
# - 실제 데이터로 동작 확인
```

#### 9.4.3 프로덕션 배포
```bash
# 1. main 브랜치 병합
git checkout main  
git merge develop

# 2. 버전 태그 생성
git tag -a v1.1.0 -m "데이터 무결성 및 알림 시스템 추가"

# 3. 프로덕션 배포
firebase use production
firebase deploy --only hosting,functions,firestore:rules

# 4. 배포 후 모니터링
# - Firebase Console에서 에러 로그 확인
# - 사용자 피드백 수집
```

### 9.5 QA 체크리스트 (실제 동작 확인)

#### 기능 테스트
```
□ 사용자 대관 신청 → 관리자 화면 실시간 반영
□ 동일 시간 중복 예약 → Cloud Function에서 차단
□ 관리자 승인 → 사용자에게 이메일 발송
□ 관리자 거절 → 거절 사유와 함께 이메일 발송
□ 당일 이벤트 등록 → 반복 요일 자동 비활성화
□ 프로그램 신청 → 정원 초과 시 대기열 처리
□ 비밀번호 재설정 → 이메일 링크 정상 동작
```

#### 성능 테스트  
```
□ 초기 페이지 로딩 < 3초
□ 예약 신청 처리 < 2초
□ 관리자 승인 처리 < 2초
□ 대량 예약 데이터 표시 성능
□ 실시간 동기화 지연 < 1초
```

#### 사용성 테스트
```
□ 모바일 반응형 레이아웃 정상 동작
□ 에러 발생 시 사용자 친화적 메시지
□ 로딩 상태 명확한 표시
□ 성공/실패 피드백 적절성
□ 관리자 인터페이스 직관성
```

### 9.6 배포 승인 기준 (현실적)
```
□ 기존 기능 정상 동작 (회귀 테스트)
□ 새 기능 요구사항 충족
□ 에러 발생률 < 2%
□ 사용자 피드백 수렴
□ 관리자 교육 완료
□ 롤백 계획 수립
□ Firebase 할당량 충분
```

### 9.7 운영 모니터링

#### Firebase Console 모니터링
```
□ Authentication: 로그인 성공률
□ Firestore: 읽기/쓰기 사용량
□ Functions: 실행 횟수 및 에러율
□ Hosting: 트래픽 및 응답시간
□ Performance: 페이지 로드 성능
```

#### 사용자 피드백 수집
```
□ 예약 실패 신고 채널
□ 이메일 미수신 문의 대응
□ UI/UX 개선 요청 수집
□ 새 기능 요구사항 파악
□ 정기적인 만족도 조사
```
