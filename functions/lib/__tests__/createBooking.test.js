"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestoreMock = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    where: jest.fn().mockReturnThis(),
    runTransaction: jest.fn(),
};
jest.mock('firebase-admin', () => {
    const firestore = () => firestoreMock;
    // FieldValue를 정적 속성으로 할당합니다.
    firestore.FieldValue = { serverTimestamp: jest.fn() };
    return {
        initializeApp: jest.fn(),
        apps: { length: 0 },
        firestore,
    };
});
const firebase_functions_test_1 = __importDefault(require("firebase-functions-test"));
const index_1 = require("../index");
const testEnv = (0, firebase_functions_test_1.default)();
describe('Cloud Functions: createBooking - Final Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        testEnv.cleanup();
    });
    test('Step 1: should reject unauthenticated requests', async () => {
        const wrapped = testEnv.wrap(index_1.createBooking);
        await expect(wrapped({}, {})).rejects.toThrow(/인증되지 않은 사용자입니다/);
    });
    test('Step 2: should fail if user document does not exist', async () => {
        firestoreMock.get.mockResolvedValueOnce({ exists: false });
        const wrapped = testEnv.wrap(index_1.createBooking);
        const context = { auth: { uid: 'non-existent-user' } };
        const data = { /* ... valid data ... */};
        await expect(wrapped(data, context)).rejects.toThrow(/사용자 정보를 찾을 수 없습니다/);
    });
    test('Step 3: should reject requests with invalid data', async () => {
        firestoreMock.get.mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Test User', email: 'test@example.com' }) });
        const wrapped = testEnv.wrap(index_1.createBooking);
        const context = { auth: { uid: 'test-user-id' } };
        const invalidData = {
            facilityId: 'test-facility', startDate: '2024-09-01', endDate: '2024-09-01',
            startTime: '11:00', endTime: '10:00', // Invalid
            purpose: 'A valid purpose for booking', category: 'class', organization: '', numberOfParticipants: 10,
        };
        await expect(wrapped(invalidData, context)).rejects.toThrow(/시작 시간은 종료 시간보다 빨라야 합니다/);
    });
    test('Step 4: should create a booking with valid data', async () => {
        firestoreMock.get.mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Test User', email: 'test@example.com' }) });
        firestoreMock.runTransaction.mockImplementation(async (updateFunction) => {
            const transaction = {
                get: jest.fn().mockResolvedValue({
                    exists: true,
                    data: () => ({ capacity: 10, bufferMinutes: 10 }),
                    docs: [],
                }),
                set: jest.fn(),
            };
            await updateFunction(transaction);
            return 'mock-booking-id';
        });
        const wrapped = testEnv.wrap(index_1.createBooking);
        const context = { auth: { uid: 'test-user-id' } };
        const validData = {
            facilityId: 'test-facility', startDate: '2024-09-01', endDate: '2024-09-01',
            startTime: '10:00', endTime: '11:00', purpose: 'A valid purpose for booking', category: 'class',
            organization: '', numberOfParticipants: 10,
        };
        const result = await wrapped(validData, context);
        expect(result.success).toBe(true);
    });
});
//# sourceMappingURL=createBooking.test.js.map