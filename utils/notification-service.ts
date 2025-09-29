import emailjs from '@emailjs/browser';

// EmailJS 초기화
const initEmailJS = () => {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (publicKey) {
    emailjs.init(publicKey);
  } else {
    console.warn('EmailJS Public Key not found in environment variables');
  }
};

// EmailJS 초기화 실행
initEmailJS();

// UTF-8 텍스트 안전 처리를 위한 헬퍼 함수
const safeText = (text: string): string => {
  try {
    // encodeURIComponent 사용하지 않고 안전한 텍스트만 반환
    return text && typeof text === 'string' ? text : '';
  } catch (error) {
    console.warn('텍스트 처리 실패, 빈 문자열 사용:', error);
    return '';
  }
};

// 이메일 전송을 위한 인터페이스
interface EmailTemplateParams {
  to_name: string;
  from_name: string;
  user_email: string;
  facility_name?: string;
  booking_date?: string;
  booking_time?: string;
  purpose?: string;
  status?: string;
  rejection_reason?: string;
  program_title?: string;
  admin_notes?: string;
}

// 대관 신청 확인 이메일 전송
export const sendBookingApplicationEmail = async (params: {
  userName: string;
  userEmail: string;
  facilityName: string;
  bookingDate: string;
  bookingTime: string;
  purpose: string;
}): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      throw new Error('EmailJS 환경변수가 설정되지 않았습니다.');
    }

    const templateParams: EmailTemplateParams = {
      to_name: safeText(params.userName),
      from_name: 'FlexSpace Pro',
      user_email: params.userEmail,
      facility_name: safeText(params.facilityName),
      booking_date: safeText(params.bookingDate),
      booking_time: safeText(params.bookingTime),
      purpose: safeText(params.purpose),
      status: safeText('신청 완료')
    };

    const response = await emailjs.send(serviceId, templateId, templateParams, {
      'Content-Type': 'application/json; charset=utf-8'
    });

    console.log('✅ 대관 신청 확인 이메일 전송 성공:', response);
    return {
      success: true,
      message: '대관 신청 확인 이메일이 전송되었습니다.'
    };

  } catch (error: any) {
    console.error('❌ 대관 신청 확인 이메일 전송 실패:', error);
    return {
      success: false,
      error: error.message || '이메일 전송 중 오류가 발생했습니다.'
    };
  }
};

// 대관 상태 변경 이메일 전송
export const sendBookingStatusEmail = async (params: {
  userName: string;
  userEmail: string;
  facilityName: string;
  bookingDate: string;
  bookingTime: string;
  purpose: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      throw new Error('EmailJS 환경변수가 설정되지 않았습니다.');
    }

    const statusText = params.status === 'approved' ? '승인' : '거부';

    const templateParams: EmailTemplateParams = {
      to_name: safeText(params.userName),
      from_name: 'FlexSpace Pro',
      user_email: params.userEmail,
      facility_name: safeText(params.facilityName),
      booking_date: safeText(params.bookingDate),
      booking_time: safeText(params.bookingTime),
      purpose: safeText(params.purpose),
      status: safeText(statusText),
      rejection_reason: safeText(params.rejectionReason || '')
    };

    const response = await emailjs.send(serviceId, templateId, templateParams, {
      'Content-Type': 'application/json; charset=utf-8'
    });

    console.log(`✅ 대관 ${statusText} 이메일 전송 성공:`, response);
    return {
      success: true,
      message: `대관 ${statusText} 이메일이 전송되었습니다.`
    };

  } catch (error: any) {
    console.error(`❌ 대관 ${params.status} 이메일 전송 실패:`, error);
    return {
      success: false,
      error: error.message || '이메일 전송 중 오류가 발생했습니다.'
    };
  }
};

// 프로그램 신청 확인 이메일 전송
export const sendProgramApplicationEmail = async (params: {
  userName: string;
  userEmail: string;
  programTitle: string;
}): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      throw new Error('EmailJS 환경변수가 설정되지 않았습니다.');
    }

    const templateParams: EmailTemplateParams = {
      to_name: safeText(params.userName),
      from_name: 'FlexSpace Pro',
      user_email: params.userEmail,
      program_title: safeText(params.programTitle),
      status: safeText('신청 완료')
    };

    const response = await emailjs.send(serviceId, templateId, templateParams, {
      'Content-Type': 'application/json; charset=utf-8'
    });

    console.log('✅ 프로그램 신청 확인 이메일 전송 성공:', response);
    return {
      success: true,
      message: '프로그램 신청 확인 이메일이 전송되었습니다.'
    };

  } catch (error: any) {
    console.error('❌ 프로그램 신청 확인 이메일 전송 실패:', error);
    return {
      success: false,
      error: error.message || '이메일 전송 중 오류가 발생했습니다.'
    };
  }
};

// 프로그램 상태 변경 이메일 전송
export const sendProgramStatusEmail = async (params: {
  userName: string;
  userEmail: string;
  programTitle: string;
  status: 'approved' | 'rejected';
  adminNotes?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      throw new Error('EmailJS 환경변수가 설정되지 않았습니다.');
    }

    const statusText = params.status === 'approved' ? '승인' : '거부';

    const templateParams: EmailTemplateParams = {
      to_name: safeText(params.userName),
      from_name: 'FlexSpace Pro',
      user_email: params.userEmail,
      program_title: safeText(params.programTitle),
      status: safeText(statusText),
      admin_notes: safeText(params.adminNotes || '')
    };

    const response = await emailjs.send(serviceId, templateId, templateParams, {
      'Content-Type': 'application/json; charset=utf-8'
    });

    console.log(`✅ 프로그램 ${statusText} 이메일 전송 성공:`, response);
    return {
      success: true,
      message: `프로그램 ${statusText} 이메일이 전송되었습니다.`
    };

  } catch (error: any) {
    console.error(`❌ 프로그램 ${params.status} 이메일 전송 실패:`, error);
    return {
      success: false,
      error: error.message || '이메일 전송 중 오류가 발생했습니다.'
    };
  }
};

// 에러 핸들링을 위한 재시도 함수
export const sendEmailWithRetry = async (
  emailFunction: () => Promise<{ success: boolean; message?: string; error?: string }>,
  maxRetries: number = 3
): Promise<{ success: boolean; message?: string; error?: string }> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await emailFunction();
      if (result.success) {
        return result;
      }

      // 마지막 시도가 아니면 잠시 대기
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    } catch (error: any) {
      console.warn(`이메일 전송 시도 ${i + 1}/${maxRetries} 실패:`, error.message);

      // 마지막 시도에서도 실패하면 에러 반환
      if (i === maxRetries - 1) {
        return {
          success: false,
          error: `${maxRetries}번 시도 후 이메일 전송 실패: ${error.message}`
        };
      }
    }
  }

  return {
    success: false,
    error: '예상치 못한 오류로 이메일 전송에 실패했습니다.'
  };
};