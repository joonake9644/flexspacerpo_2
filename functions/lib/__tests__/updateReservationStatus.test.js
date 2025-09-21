"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_functions_test_1 = __importDefault(require("firebase-functions-test"));
// Mock the admin SDK
const firestoreMock = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    update: jest.fn(),
    get: jest.fn(),
};
jest.mock('firebase-admin', () => {
    const firestore = () => firestoreMock;
    // Mock the FieldValue static property
    firestore.FieldValue = { serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP') };
    return {
        initializeApp: jest.fn(),
        apps: { length: 1 },
        firestore,
    };
});
// Import the function to be tested *after* mocking
const index_1 = require("../index");
const testEnv = (0, firebase_functions_test_1.default)();
describe('Cloud Functions: updateReservationStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        testEnv.cleanup();
    });
    test('should reject unauthenticated requests', async () => {
        const wrapped = testEnv.wrap(index_1.updateReservationStatus);
        await expect(wrapped({}, {})).rejects.toThrow(/인증되지 않은 사용자입니다/);
    });
    test('should reject requests from non-admin users', async () => {
        firestoreMock.get.mockResolvedValue({ exists: true, data: () => ({ role: 'user' }) });
        const wrapped = testEnv.wrap(index_1.updateReservationStatus);
        const context = { auth: { uid: 'non-admin-uid' } };
        const data = { reservationId: 'some-id', status: 'approved' };
        await expect(wrapped(data, context)).rejects.toThrow(/관리자 권한이 필요합니다/);
        expect(firestoreMock.doc).toHaveBeenCalledWith('non-admin-uid');
    });
    test('should reject requests with invalid arguments', async () => {
        firestoreMock.get.mockResolvedValue({ exists: true, data: () => ({ role: 'admin' }) });
        const wrapped = testEnv.wrap(index_1.updateReservationStatus);
        const context = { auth: { uid: 'admin-uid' } };
        await expect(wrapped({ status: 'approved' }, context)).rejects.toThrow(/예약 ID와 상태는 필수입니다/);
        await expect(wrapped({ reservationId: 'some-id' }, context)).rejects.toThrow(/예약 ID와 상태는 필수입니다/);
        await expect(wrapped({ reservationId: 'some-id', status: 'invalid-status' }, context)).rejects.toThrow(/유효하지 않은 상태 값입니다/);
    });
    test('should successfully update status for an admin user', async () => {
        firestoreMock.get.mockResolvedValue({ exists: true, data: () => ({ role: 'admin' }) });
        firestoreMock.update.mockResolvedValueOnce(undefined);
        const wrapped = testEnv.wrap(index_1.updateReservationStatus);
        const context = { auth: { uid: 'admin-uid' } };
        const data = { reservationId: 'test-booking-id', status: 'approved' };
        const result = await wrapped(data, context);
        expect(firestoreMock.doc).toHaveBeenCalledWith('test-booking-id');
        expect(firestoreMock.update).toHaveBeenCalledWith({ status: 'approved', updatedAt: 'MOCK_TIMESTAMP' });
        expect(result.success).toBe(true);
    });
    test('should include rejectionReason when status is rejected', async () => {
        firestoreMock.get.mockResolvedValue({ exists: true, data: () => ({ role: 'admin' }) });
        firestoreMock.update.mockResolvedValueOnce(undefined);
        const wrapped = testEnv.wrap(index_1.updateReservationStatus);
        const context = { auth: { uid: 'admin-uid' } };
        const data = { reservationId: 'test-booking-id', status: 'rejected', adminNotes: 'Not available' };
        await wrapped(data, context);
        expect(firestoreMock.update).toHaveBeenCalledWith({
            status: 'rejected',
            rejectionReason: 'Not available',
            updatedAt: 'MOCK_TIMESTAMP'
        });
    });
});
//# sourceMappingURL=updateReservationStatus.test.js.map