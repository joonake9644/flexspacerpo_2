import functions from 'firebase-functions-test';
import * as admin from 'firebase-admin';
import * as webpush from 'web-push';

// Mock web-push library
jest.mock('web-push');

// Mock Firestore
const firestoreMock = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  set: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
};

jest.mock('firebase-admin', () => {
  const firestore = () => firestoreMock;
  // Mock the FieldValue static property, which is used in the trigger
  firestore.FieldValue = {
    serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
    delete: jest.fn(() => 'MOCK_DELETE'),
  };
  
  return {
    initializeApp: jest.fn(),
    apps: { length: 1 },
    firestore,
  };
});

// Import functions after mocks
import { subscribeToPush, onBookingStatusChange } from '../index';

const testEnv = functions();

describe('Cloud Functions: Push Notifications', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    testEnv.cleanup();
  });

  describe('subscribeToPush', () => {
    test('should fail for unauthenticated users', async () => {
      const wrapped = testEnv.wrap(subscribeToPush);
      await expect(wrapped({}, {})).rejects.toThrow(/인증되지 않은 사용자입니다/);
    });

    test('should fail if subscription object is missing', async () => {
      const wrapped = testEnv.wrap(subscribeToPush);
      const context = { auth: { uid: 'test-uid' } };
      await expect(wrapped({ subscription: null }, context)).rejects.toThrow(/구독 객체가 필요합니다/);
    });

    test('should save subscription to user document', async () => {
      firestoreMock.set.mockResolvedValueOnce({});
      const wrapped = testEnv.wrap(subscribeToPush);
      const context = { auth: { uid: 'test-uid' } };
      const subscription = { endpoint: 'test-endpoint' };
      
      const result = await wrapped({ subscription }, context);

      expect(firestoreMock.collection).toHaveBeenCalledWith('users');
      expect(firestoreMock.doc).toHaveBeenCalledWith('test-uid');
      expect(firestoreMock.set).toHaveBeenCalledWith({ pushSubscription: subscription }, { merge: true });
      expect(result.success).toBe(true);
    });
  });

  describe('onBookingStatusChange (Push Notification Logic)', () => {
    test('should send push notification if user has subscription', async () => {
      const userWithSubscription = {
        email: 'test@example.com',
        pushSubscription: { endpoint: 'test-endpoint' },
      };
      firestoreMock.get.mockResolvedValue({ exists: true, data: () => userWithSubscription });
      (webpush.sendNotification as jest.Mock).mockResolvedValueOnce({});

      const before = { status: 'pending', userId: 'test-user', purpose: 'Test' };
      const after = { status: 'approved', userId: 'test-user', purpose: 'Test' };
      const change = testEnv.makeChange(testEnv.firestore.makeDocumentSnapshot(before, 'bookings/test'), testEnv.firestore.makeDocumentSnapshot(after, 'bookings/test'));

      const wrapped = testEnv.wrap(onBookingStatusChange);
      await wrapped(change, { params: { bookingId: 'test' } });

      expect(webpush.sendNotification).toHaveBeenCalled();
    });

    test('should not send if user has no subscription', async () => {
      const userWithoutSubscription = { email: 'test@example.com' };
      firestoreMock.get.mockResolvedValue({ exists: true, data: () => userWithoutSubscription });

      const before = { status: 'pending', userId: 'test-user', purpose: 'Test' };
      const after = { status: 'approved', userId: 'test-user', purpose: 'Test' };
      const change = testEnv.makeChange(testEnv.firestore.makeDocumentSnapshot(before, 'bookings/test'), testEnv.firestore.makeDocumentSnapshot(after, 'bookings/test'));

      const wrapped = testEnv.wrap(onBookingStatusChange);
      await wrapped(change, { params: { bookingId: 'test' } });

      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    test('should delete subscription if it is invalid (410 error)', async () => {
      const userWithSubscription = {
        email: 'test@example.com',
        pushSubscription: { endpoint: 'test-endpoint' },
      };
      firestoreMock.get.mockResolvedValue({ exists: true, data: () => userWithSubscription });
      (webpush.sendNotification as jest.Mock).mockRejectedValue({ statusCode: 410 });

      const before = { status: 'pending', userId: 'test-user', purpose: 'Test' };
      const after = { status: 'approved', userId: 'test-user', purpose: 'Test' };
      const change = testEnv.makeChange(testEnv.firestore.makeDocumentSnapshot(before, 'bookings/test'), testEnv.firestore.makeDocumentSnapshot(after, 'bookings/test'));

      const wrapped = testEnv.wrap(onBookingStatusChange);
      await wrapped(change, { params: { bookingId: 'test' } });

      expect(webpush.sendNotification).toHaveBeenCalled();
      expect(firestoreMock.doc).toHaveBeenCalledWith('test-user');
      expect(firestoreMock.update).toHaveBeenCalledWith({ pushSubscription: 'MOCK_DELETE' });
    });
  });
});