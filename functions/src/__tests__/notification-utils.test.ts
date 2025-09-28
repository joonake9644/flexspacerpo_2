import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IncomingWebhook } from '@slack/webhook';
import {
  sendBookingApplicationSlackAlert,
  sendBookingStatusSlackAlert,
  sendProgramApplicationSlackAlert,
  sendProgramStatusSlackAlert,
  sendSlackWithRetry
} from '../notification-utils';
import { Booking, User, ProgramApplication } from '../types';

// Slack Webhook 모킹
vi.mock('@slack/webhook');
const MockedIncomingWebhook = vi.mocked(IncomingWebhook);

// 환경변수 모킹
const originalEnv = process.env;

describe('Slack Notification Utils', () => {
  const mockWebhookSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      SLACK_WEBHOOK_URL: 'https://hooks.slack.com/test',
      SLACK_CHANNEL: '#test-channel',
      SLACK_BOT_NAME: 'Test Bot'
    };

    // IncomingWebhook 모킹
    MockedIncomingWebhook.mockImplementation(() => ({
      send: mockWebhookSend
    } as any));

    mockWebhookSend.mockResolvedValue({ text: 'ok' });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('sendBookingApplicationSlackAlert', () => {
    const mockBooking: Omit<Booking, 'id'> = {
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
      createdAt: {} as any
    };

    const mockUser: User = {
      id: 'user123',
      name: '홍길동',
      email: 'hong@test.com',
      role: 'user'
    };

    const mockFacility = { name: '체육관 A' };

    it('성공적으로 대관 신청 Slack 알림을 전송해야 한다', async () => {
      const result = await sendBookingApplicationSlackAlert(mockBooking, mockUser, mockFacility);

      expect(result.success).toBe(true);
      expect(result.message).toBe('관리자에게 Slack 알림을 전송했습니다.');
      expect(MockedIncomingWebhook).toHaveBeenCalledWith(process.env.SLACK_WEBHOOK_URL);
      expect(mockWebhookSend).toHaveBeenCalledWith({
        channel: '#test-channel',
        username: 'Test Bot',
        icon_emoji: ':clipboard:',
        blocks: expect.arrayContaining([
          expect.objectContaining({
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📝 새로운 대관 신청'
            }
          })
        ])
      });
    });

    it('SLACK_WEBHOOK_URL이 없으면 에러를 반환해야 한다', async () => {
      delete process.env.SLACK_WEBHOOK_URL;

      const result = await sendBookingApplicationSlackAlert(mockBooking, mockUser, mockFacility);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Slack Webhook이 설정되지 않았습니다.');
    });

    it('Slack 전송 실패 시 에러를 반환해야 한다', async () => {
      const errorMessage = 'Webhook failed';
      mockWebhookSend.mockRejectedValue(new Error(errorMessage));

      const result = await sendBookingApplicationSlackAlert(mockBooking, mockUser, mockFacility);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('단체명이 있는 경우 추가 정보를 포함해야 한다', async () => {
      await sendBookingApplicationSlackAlert(mockBooking, mockUser, mockFacility);

      expect(mockWebhookSend).toHaveBeenCalledWith(
        expect.objectContaining({
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*🏛️ 단체명:* 동호회'
              }
            })
          ])
        })
      );
    });
  });

  describe('sendBookingStatusSlackAlert', () => {
    const mockBooking: Booking = {
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
      createdAt: {} as any
    };

    const mockUser: User = {
      id: 'user123',
      name: '홍길동',
      email: 'hong@test.com',
      role: 'user'
    };

    const mockFacility = { name: '체육관 A' };

    it('대관 승인 Slack 알림을 성공적으로 전송해야 한다', async () => {
      const result = await sendBookingStatusSlackAlert(
        mockBooking,
        mockUser,
        mockFacility,
        'pending',
        'approved'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('대관 승인 Slack 알림을 전송했습니다.');
      expect(mockWebhookSend).toHaveBeenCalledWith({
        channel: '#test-channel',
        username: 'Test Bot',
        icon_emoji: '✅',
        blocks: expect.arrayContaining([
          expect.objectContaining({
            type: 'header',
            text: {
              type: 'plain_text',
              text: '✅ 대관 승인 알림'
            }
          })
        ])
      });
    });

    it('대관 거부 시 거부 사유를 포함해야 한다', async () => {
      const rejectedBooking = {
        ...mockBooking,
        status: 'rejected' as const,
        rejectionReason: '시설 점검'
      };

      await sendBookingStatusSlackAlert(
        rejectedBooking,
        mockUser,
        mockFacility,
        'pending',
        'rejected'
      );

      expect(mockWebhookSend).toHaveBeenCalledWith(
        expect.objectContaining({
          icon_emoji: '❌',
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*📝 거부 사유:*\n시설 점검'
              }
            })
          ])
        })
      );
    });
  });

  describe('sendProgramApplicationSlackAlert', () => {
    const mockApplication: Omit<ProgramApplication, 'id'> = {
      userId: 'user123',
      userName: '홍길동',
      userEmail: 'hong@test.com',
      programId: 'program123',
      programTitle: '요가 클래스',
      status: 'pending',
      appliedAt: {} as any
    };

    const mockUser: User = {
      id: 'user123',
      name: '홍길동',
      email: 'hong@test.com',
      role: 'user'
    };

    it('성공적으로 프로그램 신청 Slack 알림을 전송해야 한다', async () => {
      const result = await sendProgramApplicationSlackAlert(mockApplication, mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toBe('관리자에게 Slack 알림을 전송했습니다.');
      expect(mockWebhookSend).toHaveBeenCalledWith({
        channel: '#test-channel',
        username: 'Test Bot',
        icon_emoji: ':books:',
        blocks: expect.arrayContaining([
          expect.objectContaining({
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

  describe('sendProgramStatusSlackAlert', () => {
    const mockApplication: ProgramApplication = {
      id: 'app123',
      userId: 'user123',
      userName: '홍길동',
      userEmail: 'hong@test.com',
      programId: 'program123',
      programTitle: '요가 클래스',
      status: 'approved',
      appliedAt: {} as any
    };

    const mockUser: User = {
      id: 'user123',
      name: '홍길동',
      email: 'hong@test.com',
      role: 'user'
    };

    it('프로그램 승인 Slack 알림을 성공적으로 전송해야 한다', async () => {
      const result = await sendProgramStatusSlackAlert(
        mockApplication,
        mockUser,
        'pending',
        'approved'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('프로그램 승인 Slack 알림을 전송했습니다.');
      expect(mockWebhookSend).toHaveBeenCalledWith({
        channel: '#test-channel',
        username: 'Test Bot',
        icon_emoji: '✅',
        blocks: expect.arrayContaining([
          expect.objectContaining({
            type: 'header',
            text: {
              type: 'plain_text',
              text: '✅ 프로그램 승인 알림'
            }
          })
        ])
      });
    });

    it('프로그램 거부 시 거부 사유를 포함해야 한다', async () => {
      const rejectedApplication = {
        ...mockApplication,
        status: 'rejected' as const,
        rejectionReason: '정원 초과'
      };

      await sendProgramStatusSlackAlert(
        rejectedApplication,
        mockUser,
        'pending',
        'rejected'
      );

      expect(mockWebhookSend).toHaveBeenCalledWith(
        expect.objectContaining({
          icon_emoji: '❌',
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*📝 거부 사유:*\n정원 초과'
              }
            })
          ])
        })
      );
    });
  });

  describe('sendSlackWithRetry', () => {
    it('첫 번째 시도에서 성공하면 재시도하지 않아야 한다', async () => {
      const mockSlackFunction = vi.fn().mockResolvedValue({
        success: true,
        message: 'Slack 전송 성공'
      });

      const result = await sendSlackWithRetry(mockSlackFunction, 3);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Slack 전송 성공');
      expect(mockSlackFunction).toHaveBeenCalledTimes(1);
    });

    it('실패 시 지정된 횟수만큼 재시도해야 한다', async () => {
      const mockSlackFunction = vi.fn().mockRejectedValue(new Error('Slack 전송 실패'));

      const result = await sendSlackWithRetry(mockSlackFunction, 3);

      expect(result.success).toBe(false);
      expect(result.error).toContain('3번 시도 후 Slack 알림 전송 실패');
      expect(mockSlackFunction).toHaveBeenCalledTimes(3);
    });

    it('재시도 중 성공하면 성공 결과를 반환해야 한다', async () => {
      const mockSlackFunction = vi.fn()
        .mockRejectedValueOnce(new Error('첫 번째 실패'))
        .mockResolvedValueOnce({ success: true, message: '두 번째 성공' });

      const result = await sendSlackWithRetry(mockSlackFunction, 3);

      expect(result.success).toBe(true);
      expect(result.message).toBe('두 번째 성공');
      expect(mockSlackFunction).toHaveBeenCalledTimes(2);
    });
  });
});