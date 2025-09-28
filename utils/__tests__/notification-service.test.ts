import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import emailjs from '@emailjs/browser';
import {
  sendBookingApplicationEmail,
  sendBookingStatusEmail,
  sendProgramApplicationEmail,
  sendProgramStatusEmail,
  sendEmailWithRetry
} from '../notification-service';

// EmailJS 모킹
vi.mock('@emailjs/browser');
const mockedEmailjs = vi.mocked(emailjs);

// 환경변수 모킹
const mockEnv = {
  VITE_EMAILJS_SERVICE_ID: 'test_service_id',
  VITE_EMAILJS_TEMPLATE_ID: 'test_template_id',
  VITE_EMAILJS_PUBLIC_KEY: 'test_public_key'
};

// import.meta.env 모킹
Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true
});

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 성공적인 응답 모킹
    mockedEmailjs.send.mockResolvedValue({
      status: 200,
      text: 'SUCCESS'
    });
    mockedEmailjs.init.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendBookingApplicationEmail', () => {
    const mockParams = {
      userName: '홍길동',
      userEmail: 'hong@test.com',
      facilityName: '체육관 A',
      bookingDate: '2024-01-15',
      bookingTime: '14:00-16:00',
      purpose: '배드민턴 모임'
    };

    it('성공적으로 대관 신청 이메일을 전송해야 한다', async () => {
      const result = await sendBookingApplicationEmail(mockParams);

      expect(result.success).toBe(true);
      expect(result.message).toBe('대관 신청 확인 이메일이 전송되었습니다.');
      expect(mockedEmailjs.send).toHaveBeenCalledWith(
        mockEnv.VITE_EMAILJS_SERVICE_ID,
        mockEnv.VITE_EMAILJS_TEMPLATE_ID,
        expect.objectContaining({
          to_name: mockParams.userName,
          user_email: mockParams.userEmail,
          facility_name: mockParams.facilityName,
          booking_date: mockParams.bookingDate,
          booking_time: mockParams.bookingTime,
          purpose: mockParams.purpose,
          status: '신청 완료'
        })
      );
    });

    it('환경변수가 없으면 에러를 반환해야 한다', async () => {
      // 환경변수 제거
      const originalEnv = import.meta.env;
      Object.defineProperty(import.meta, 'env', {
        value: {},
        writable: true
      });

      const result = await sendBookingApplicationEmail(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('EmailJS 환경변수가 설정되지 않았습니다.');

      // 환경변수 복원
      Object.defineProperty(import.meta, 'env', {
        value: originalEnv,
        writable: true
      });
    });

    it('EmailJS 전송 실패 시 에러를 반환해야 한다', async () => {
      const errorMessage = 'Network error';
      mockedEmailjs.send.mockRejectedValue(new Error(errorMessage));

      const result = await sendBookingApplicationEmail(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('sendBookingStatusEmail', () => {
    const mockParams = {
      userName: '홍길동',
      userEmail: 'hong@test.com',
      facilityName: '체육관 A',
      bookingDate: '2024-01-15',
      bookingTime: '14:00-16:00',
      purpose: '배드민턴 모임',
      status: 'approved' as const
    };

    it('대관 승인 이메일을 성공적으로 전송해야 한다', async () => {
      const result = await sendBookingStatusEmail(mockParams);

      expect(result.success).toBe(true);
      expect(result.message).toBe('대관 승인 이메일이 전송되었습니다.');
      expect(mockedEmailjs.send).toHaveBeenCalledWith(
        mockEnv.VITE_EMAILJS_SERVICE_ID,
        mockEnv.VITE_EMAILJS_TEMPLATE_ID,
        expect.objectContaining({
          status: '승인'
        })
      );
    });

    it('대관 거부 이메일을 성공적으로 전송해야 한다', async () => {
      const rejectedParams = {
        ...mockParams,
        status: 'rejected' as const,
        rejectionReason: '중복 신청'
      };

      const result = await sendBookingStatusEmail(rejectedParams);

      expect(result.success).toBe(true);
      expect(result.message).toBe('대관 거부 이메일이 전송되었습니다.');
      expect(mockedEmailjs.send).toHaveBeenCalledWith(
        mockEnv.VITE_EMAILJS_SERVICE_ID,
        mockEnv.VITE_EMAILJS_TEMPLATE_ID,
        expect.objectContaining({
          status: '거부',
          rejection_reason: '중복 신청'
        })
      );
    });
  });

  describe('sendProgramApplicationEmail', () => {
    const mockParams = {
      userName: '홍길동',
      userEmail: 'hong@test.com',
      programTitle: '요가 클래스'
    };

    it('성공적으로 프로그램 신청 이메일을 전송해야 한다', async () => {
      const result = await sendProgramApplicationEmail(mockParams);

      expect(result.success).toBe(true);
      expect(result.message).toBe('프로그램 신청 확인 이메일이 전송되었습니다.');
      expect(mockedEmailjs.send).toHaveBeenCalledWith(
        mockEnv.VITE_EMAILJS_SERVICE_ID,
        mockEnv.VITE_EMAILJS_TEMPLATE_ID,
        expect.objectContaining({
          to_name: mockParams.userName,
          user_email: mockParams.userEmail,
          program_title: mockParams.programTitle,
          status: '신청 완료'
        })
      );
    });
  });

  describe('sendProgramStatusEmail', () => {
    const mockParams = {
      userName: '홍길동',
      userEmail: 'hong@test.com',
      programTitle: '요가 클래스',
      status: 'approved' as const,
      adminNotes: '환영합니다!'
    };

    it('성공적으로 프로그램 승인 이메일을 전송해야 한다', async () => {
      const result = await sendProgramStatusEmail(mockParams);

      expect(result.success).toBe(true);
      expect(result.message).toBe('프로그램 승인 이메일이 전송되었습니다.');
      expect(mockedEmailjs.send).toHaveBeenCalledWith(
        mockEnv.VITE_EMAILJS_SERVICE_ID,
        mockEnv.VITE_EMAILJS_TEMPLATE_ID,
        expect.objectContaining({
          status: '승인',
          admin_notes: '환영합니다!'
        })
      );
    });
  });

  describe('sendEmailWithRetry', () => {
    it('첫 번째 시도에서 성공하면 재시도하지 않아야 한다', async () => {
      const mockEmailFunction = vi.fn().mockResolvedValue({
        success: true,
        message: '전송 성공'
      });

      const result = await sendEmailWithRetry(mockEmailFunction, 3);

      expect(result.success).toBe(true);
      expect(result.message).toBe('전송 성공');
      expect(mockEmailFunction).toHaveBeenCalledTimes(1);
    });

    it('실패 시 지정된 횟수만큼 재시도해야 한다', async () => {
      const mockEmailFunction = vi.fn().mockRejectedValue(new Error('전송 실패'));

      const result = await sendEmailWithRetry(mockEmailFunction, 3);

      expect(result.success).toBe(false);
      expect(result.error).toContain('3번 시도 후 이메일 전송 실패');
      expect(mockEmailFunction).toHaveBeenCalledTimes(3);
    });

    it('재시도 중 성공하면 성공 결과를 반환해야 한다', async () => {
      const mockEmailFunction = vi.fn()
        .mockRejectedValueOnce(new Error('첫 번째 실패'))
        .mockResolvedValueOnce({ success: true, message: '두 번째 성공' });

      const result = await sendEmailWithRetry(mockEmailFunction, 3);

      expect(result.success).toBe(true);
      expect(result.message).toBe('두 번째 성공');
      expect(mockEmailFunction).toHaveBeenCalledTimes(2);
    });
  });
});