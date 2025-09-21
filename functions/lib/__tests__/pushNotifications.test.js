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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_functions_test_1 = __importDefault(require("firebase-functions-test"));
const webpush = __importStar(require("web-push"));
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
const index_1 = require("../index");
const testEnv = (0, firebase_functions_test_1.default)();
describe('Cloud Functions: Push Notifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        testEnv.cleanup();
    });
    describe('subscribeToPush', () => {
        test('should fail for unauthenticated users', async () => {
            const wrapped = testEnv.wrap(index_1.subscribeToPush);
            await expect(wrapped({}, {})).rejects.toThrow(/인증되지 않은 사용자입니다/);
        });
        test('should fail if subscription object is missing', async () => {
            const wrapped = testEnv.wrap(index_1.subscribeToPush);
            const context = { auth: { uid: 'test-uid' } };
            await expect(wrapped({ subscription: null }, context)).rejects.toThrow(/구독 객체가 필요합니다/);
        });
        test('should save subscription to user document', async () => {
            firestoreMock.set.mockResolvedValueOnce({});
            const wrapped = testEnv.wrap(index_1.subscribeToPush);
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
            webpush.sendNotification.mockResolvedValueOnce({});
            const before = { status: 'pending', userId: 'test-user', purpose: 'Test' };
            const after = { status: 'approved', userId: 'test-user', purpose: 'Test' };
            const change = testEnv.makeChange(testEnv.firestore.makeDocumentSnapshot(before, 'bookings/test'), testEnv.firestore.makeDocumentSnapshot(after, 'bookings/test'));
            const wrapped = testEnv.wrap(index_1.onBookingStatusChange);
            await wrapped(change, { params: { bookingId: 'test' } });
            expect(webpush.sendNotification).toHaveBeenCalled();
        });
        test('should not send if user has no subscription', async () => {
            const userWithoutSubscription = { email: 'test@example.com' };
            firestoreMock.get.mockResolvedValue({ exists: true, data: () => userWithoutSubscription });
            const before = { status: 'pending', userId: 'test-user', purpose: 'Test' };
            const after = { status: 'approved', userId: 'test-user', purpose: 'Test' };
            const change = testEnv.makeChange(testEnv.firestore.makeDocumentSnapshot(before, 'bookings/test'), testEnv.firestore.makeDocumentSnapshot(after, 'bookings/test'));
            const wrapped = testEnv.wrap(index_1.onBookingStatusChange);
            await wrapped(change, { params: { bookingId: 'test' } });
            expect(webpush.sendNotification).not.toHaveBeenCalled();
        });
        test('should delete subscription if it is invalid (410 error)', async () => {
            const userWithSubscription = {
                email: 'test@example.com',
                pushSubscription: { endpoint: 'test-endpoint' },
            };
            firestoreMock.get.mockResolvedValue({ exists: true, data: () => userWithSubscription });
            webpush.sendNotification.mockRejectedValue({ statusCode: 410 });
            const before = { status: 'pending', userId: 'test-user', purpose: 'Test' };
            const after = { status: 'approved', userId: 'test-user', purpose: 'Test' };
            const change = testEnv.makeChange(testEnv.firestore.makeDocumentSnapshot(before, 'bookings/test'), testEnv.firestore.makeDocumentSnapshot(after, 'bookings/test'));
            const wrapped = testEnv.wrap(index_1.onBookingStatusChange);
            await wrapped(change, { params: { bookingId: 'test' } });
            expect(webpush.sendNotification).toHaveBeenCalled();
            expect(firestoreMock.doc).toHaveBeenCalledWith('test-user');
            expect(firestoreMock.update).toHaveBeenCalledWith({ pushSubscription: 'MOCK_DELETE' });
        });
    });
});
//# sourceMappingURL=pushNotifications.test.js.map