"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const webhook_1 = require("@slack/webhook");
const notification_utils_1 = require("../notification-utils");
// Slack Webhook 모킹
vitest_1.vi.mock('@slack/webhook');
const MockedIncomingWebhook = vitest_1.vi.mocked(webhook_1.IncomingWebhook);
// 환경변수 모킹
const originalEnv = process.env;
(0, vitest_1.describe)('Slack Notification Utils', () => {
    const mockWebhookSend = vitest_1.vi.fn();
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        process.env = {
            ...originalEnv,
            SLACK_WEBHOOK_URL: 'https://hooks.slack.com/test',
            SLACK_CHANNEL: '#test-channel',
            SLACK_BOT_NAME: 'Test Bot'
        };
        // IncomingWebhook 모킹
        MockedIncomingWebhook.mockImplementation(() => ({
            send: mockWebhookSend
        }));
        mockWebhookSend.mockResolvedValue({ text: 'ok' });
    });
    (0, vitest_1.afterEach)(() => {
        process.env = originalEnv;
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('sendBookingApplicationSlackAlert', () => {
        const mockBooking = {
            userId: 'user123',
            userName: '홍길동',
            userEmail: 'hong@test.com',
            facilityId: 'facility123',
            startDate: '2024-01-15',
            endDate: '2024-01-15',
            startTime: '14:00',
            endTime: '16:00',
            purpose: '배드민턴 모임',
            organization: '동호회',
            numberOfParticipants: 8,
            status: 'pending',
            category: 'club',
            createdAt: {}
        };
        const mockUser = {
            id: 'user123',
            name: '홍길동',
            email: 'hong@test.com',
            role: 'user'
        };
        const mockFacility = { name: '체육관 A' };
        (0, vitest_1.it)('성공적으로 대관 신청 Slack 알림을 전송해야 한다', async () => {
            const result = await (0, notification_utils_1.sendBookingApplicationSlackAlert)(mockBooking, mockUser, mockFacility);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toBe('관리자에게 Slack 알림을 전송했습니다.');
            (0, vitest_1.expect)(MockedIncomingWebhook).toHaveBeenCalledWith(process.env.SLACK_WEBHOOK_URL);
            (0, vitest_1.expect)(mockWebhookSend).toHaveBeenCalledWith({
                channel: '#test-channel',
                username: 'Test Bot',
                icon_emoji: ':clipboard:',
                blocks: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: '📝 새로운 대관 신청'
                        }
                    })
                ])
            });
        });
        (0, vitest_1.it)('SLACK_WEBHOOK_URL이 없으면 에러를 반환해야 한다', async () => {
            delete process.env.SLACK_WEBHOOK_URL;
            const result = await (0, notification_utils_1.sendBookingApplicationSlackAlert)(mockBooking, mockUser, mockFacility);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toBe('Slack Webhook이 설정되지 않았습니다.');
        });
        (0, vitest_1.it)('Slack 전송 실패 시 에러를 반환해야 한다', async () => {
            const errorMessage = 'Webhook failed';
            mockWebhookSend.mockRejectedValue(new Error(errorMessage));
            const result = await (0, notification_utils_1.sendBookingApplicationSlackAlert)(mockBooking, mockUser, mockFacility);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toBe(errorMessage);
        });
        (0, vitest_1.it)('단체명이 있는 경우 추가 정보를 포함해야 한다', async () => {
            await (0, notification_utils_1.sendBookingApplicationSlackAlert)(mockBooking, mockUser, mockFacility);
            (0, vitest_1.expect)(mockWebhookSend).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                blocks: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: '*🏛️ 단체명:* 동호회'
                        }
                    })
                ])
            }));
        });
    });
    (0, vitest_1.describe)('sendBookingStatusSlackAlert', () => {
        const mockBooking = {
            id: 'booking123',
            userId: 'user123',
            userName: '홍길동',
            userEmail: 'hong@test.com',
            facilityId: 'facility123',
            startDate: '2024-01-15',
            endDate: '2024-01-15',
            startTime: '14:00',
            endTime: '16:00',
            purpose: '배드민턴 모임',
            numberOfParticipants: 8,
            status: 'approved',
            category: 'club',
            createdAt: {}
        };
        const mockUser = {
            id: 'user123',
            name: '홍길동',
            email: 'hong@test.com',
            role: 'user'
        };
        const mockFacility = { name: '체육관 A' };
        (0, vitest_1.it)('대관 승인 Slack 알림을 성공적으로 전송해야 한다', async () => {
            const result = await (0, notification_utils_1.sendBookingStatusSlackAlert)(mockBooking, mockUser, mockFacility, 'pending', 'approved');
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toBe('대관 승인 Slack 알림을 전송했습니다.');
            (0, vitest_1.expect)(mockWebhookSend).toHaveBeenCalledWith({
                channel: '#test-channel',
                username: 'Test Bot',
                icon_emoji: '✅',
                blocks: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: '✅ 대관 승인 알림'
                        }
                    })
                ])
            });
        });
        (0, vitest_1.it)('대관 거부 시 거부 사유를 포함해야 한다', async () => {
            const rejectedBooking = {
                ...mockBooking,
                status: 'rejected',
                rejectionReason: '시설 점검'
            };
            await (0, notification_utils_1.sendBookingStatusSlackAlert)(rejectedBooking, mockUser, mockFacility, 'pending', 'rejected');
            (0, vitest_1.expect)(mockWebhookSend).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                icon_emoji: '❌',
                blocks: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: '*📝 거부 사유:*\n시설 점검'
                        }
                    })
                ])
            }));
        });
    });
    (0, vitest_1.describe)('sendProgramApplicationSlackAlert', () => {
        const mockApplication = {
            userId: 'user123',
            userName: '홍길동',
            userEmail: 'hong@test.com',
            programId: 'program123',
            programTitle: '요가 클래스',
            status: 'pending',
            appliedAt: {}
        };
        const mockUser = {
            id: 'user123',
            name: '홍길동',
            email: 'hong@test.com',
            role: 'user'
        };
        (0, vitest_1.it)('성공적으로 프로그램 신청 Slack 알림을 전송해야 한다', async () => {
            const result = await (0, notification_utils_1.sendProgramApplicationSlackAlert)(mockApplication, mockUser);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toBe('관리자에게 Slack 알림을 전송했습니다.');
            (0, vitest_1.expect)(mockWebhookSend).toHaveBeenCalledWith({
                channel: '#test-channel',
                username: 'Test Bot',
                icon_emoji: ':books:',
                blocks: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: '🎯 새로운 프로그램 신청'
                        }
                    })
                ])
            });
        });
    });
    (0, vitest_1.describe)('sendProgramStatusSlackAlert', () => {
        const mockApplication = {
            id: 'app123',
            userId: 'user123',
            userName: '홍길동',
            userEmail: 'hong@test.com',
            programId: 'program123',
            programTitle: '요가 클래스',
            status: 'approved',
            appliedAt: {}
        };
        const mockUser = {
            id: 'user123',
            name: '홍길동',
            email: 'hong@test.com',
            role: 'user'
        };
        (0, vitest_1.it)('프로그램 승인 Slack 알림을 성공적으로 전송해야 한다', async () => {
            const result = await (0, notification_utils_1.sendProgramStatusSlackAlert)(mockApplication, mockUser, 'pending', 'approved');
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toBe('프로그램 승인 Slack 알림을 전송했습니다.');
            (0, vitest_1.expect)(mockWebhookSend).toHaveBeenCalledWith({
                channel: '#test-channel',
                username: 'Test Bot',
                icon_emoji: '✅',
                blocks: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: '✅ 프로그램 승인 알림'
                        }
                    })
                ])
            });
        });
        (0, vitest_1.it)('프로그램 거부 시 거부 사유를 포함해야 한다', async () => {
            const rejectedApplication = {
                ...mockApplication,
                status: 'rejected',
                rejectionReason: '정원 초과'
            };
            await (0, notification_utils_1.sendProgramStatusSlackAlert)(rejectedApplication, mockUser, 'pending', 'rejected');
            (0, vitest_1.expect)(mockWebhookSend).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                icon_emoji: '❌',
                blocks: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: '*📝 거부 사유:*\n정원 초과'
                        }
                    })
                ])
            }));
        });
    });
    (0, vitest_1.describe)('sendSlackWithRetry', () => {
        (0, vitest_1.it)('첫 번째 시도에서 성공하면 재시도하지 않아야 한다', async () => {
            const mockSlackFunction = vitest_1.vi.fn().mockResolvedValue({
                success: true,
                message: 'Slack 전송 성공'
            });
            const result = await (0, notification_utils_1.sendSlackWithRetry)(mockSlackFunction, 3);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toBe('Slack 전송 성공');
            (0, vitest_1.expect)(mockSlackFunction).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('실패 시 지정된 횟수만큼 재시도해야 한다', async () => {
            const mockSlackFunction = vitest_1.vi.fn().mockRejectedValue(new Error('Slack 전송 실패'));
            const result = await (0, notification_utils_1.sendSlackWithRetry)(mockSlackFunction, 3);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('3번 시도 후 Slack 알림 전송 실패');
            (0, vitest_1.expect)(mockSlackFunction).toHaveBeenCalledTimes(3);
        });
        (0, vitest_1.it)('재시도 중 성공하면 성공 결과를 반환해야 한다', async () => {
            const mockSlackFunction = vitest_1.vi.fn()
                .mockRejectedValueOnce(new Error('첫 번째 실패'))
                .mockResolvedValueOnce({ success: true, message: '두 번째 성공' });
            const result = await (0, notification_utils_1.sendSlackWithRetry)(mockSlackFunction, 3);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toBe('두 번째 성공');
            (0, vitest_1.expect)(mockSlackFunction).toHaveBeenCalledTimes(2);
        });
    });
});
//# sourceMappingURL=notification-utils.test.js.map