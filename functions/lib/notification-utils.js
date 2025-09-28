"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSlackWithRetry = exports.sendProgramStatusSlackAlert = exports.sendProgramApplicationSlackAlert = exports.sendBookingStatusSlackAlert = exports.sendBookingApplicationSlackAlert = void 0;
const webhook_1 = require("@slack/webhook");
// Slack Webhook 인스턴스 생성
const createSlackWebhook = () => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn('SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다.');
        return null;
    }
    return new webhook_1.IncomingWebhook(webhookUrl);
};
// 대관 신청 슬랙 알림 (관리자용)
const sendBookingApplicationSlackAlert = async (booking, user, facility) => {
    try {
        const webhook = createSlackWebhook();
        if (!webhook) {
            return { success: false, error: 'Slack Webhook이 설정되지 않았습니다.' };
        }
        const channel = process.env.SLACK_CHANNEL || '#알림';
        const botName = process.env.SLACK_BOT_NAME || 'FlexSpace Pro';
        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '📝 새로운 대관 신청'
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*👤 신청자:*\n${user.name} (${user.email})`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*🏢 시설:*\n${facility.name}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*📅 일시:*\n${booking.startDate} ${booking.startTime}-${booking.endTime}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*👥 인원:*\n${booking.numberOfParticipants}명`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*✍️ 목적:*\n${booking.purpose}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*🏷️ 분류:*\n${booking.category}`
                    }
                ]
            }
        ];
        if (booking.organization) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*🏛️ 단체명:* ${booking.organization}`
                }
            });
        }
        blocks.push({
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: `⏰ 신청 시각: ${new Date().toLocaleString('ko-KR')}`
                }
            ]
        });
        await webhook.send({
            channel,
            username: botName,
            icon_emoji: ':clipboard:',
            blocks
        });
        console.log('✅ 대관 신청 Slack 알림 전송 성공');
        return {
            success: true,
            message: '관리자에게 Slack 알림을 전송했습니다.'
        };
    }
    catch (error) {
        console.error('❌ 대관 신청 Slack 알림 전송 실패:', error);
        return {
            success: false,
            error: error.message || 'Slack 알림 전송 중 오류가 발생했습니다.'
        };
    }
};
exports.sendBookingApplicationSlackAlert = sendBookingApplicationSlackAlert;
// 대관 상태 변경 슬랙 알림 (사용자 및 관리자용)
const sendBookingStatusSlackAlert = async (booking, user, facility, oldStatus, newStatus) => {
    try {
        const webhook = createSlackWebhook();
        if (!webhook) {
            return { success: false, error: 'Slack Webhook이 설정되지 않았습니다.' };
        }
        const channel = process.env.SLACK_CHANNEL || '#알림';
        const botName = process.env.SLACK_BOT_NAME || 'FlexSpace Pro';
        const statusEmoji = newStatus === 'approved' ? '✅' :
            newStatus === 'rejected' ? '❌' : '🔄';
        const statusText = newStatus === 'approved' ? '승인' :
            newStatus === 'rejected' ? '거부' : '변경';
        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${statusEmoji} 대관 ${statusText} 알림`
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*👤 신청자:*\n${user.name} (${user.email})`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*🏢 시설:*\n${facility.name}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*📅 일시:*\n${booking.startDate} ${booking.startTime}-${booking.endTime}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*✍️ 목적:*\n${booking.purpose}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*📊 상태:*\n${oldStatus} → ${newStatus}`
                    }
                ]
            }
        ];
        if (newStatus === 'rejected' && booking.rejectionReason) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*📝 거부 사유:*\n${booking.rejectionReason}`
                }
            });
        }
        blocks.push({
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: `⏰ 처리 시각: ${new Date().toLocaleString('ko-KR')}`
                }
            ]
        });
        await webhook.send({
            channel,
            username: botName,
            icon_emoji: statusEmoji,
            blocks
        });
        console.log(`✅ 대관 ${statusText} Slack 알림 전송 성공`);
        return {
            success: true,
            message: `대관 ${statusText} Slack 알림을 전송했습니다.`
        };
    }
    catch (error) {
        const statusText = newStatus === 'approved' ? '승인' :
            newStatus === 'rejected' ? '거부' : '변경';
        console.error(`❌ 대관 ${statusText} Slack 알림 전송 실패:`, error);
        return {
            success: false,
            error: error.message || 'Slack 알림 전송 중 오류가 발생했습니다.'
        };
    }
};
exports.sendBookingStatusSlackAlert = sendBookingStatusSlackAlert;
// 프로그램 신청 슬랙 알림 (관리자용)
const sendProgramApplicationSlackAlert = async (application, user) => {
    try {
        const webhook = createSlackWebhook();
        if (!webhook) {
            return { success: false, error: 'Slack Webhook이 설정되지 않았습니다.' };
        }
        const channel = process.env.SLACK_CHANNEL || '#알림';
        const botName = process.env.SLACK_BOT_NAME || 'FlexSpace Pro';
        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '🎯 새로운 프로그램 신청'
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*👤 신청자:*\n${user.name} (${user.email})`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*📚 프로그램:*\n${application.programTitle}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*📊 상태:*\n대기중`
                    }
                ]
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `⏰ 신청 시각: ${new Date().toLocaleString('ko-KR')}`
                    }
                ]
            }
        ];
        await webhook.send({
            channel,
            username: botName,
            icon_emoji: ':books:',
            blocks
        });
        console.log('✅ 프로그램 신청 Slack 알림 전송 성공');
        return {
            success: true,
            message: '관리자에게 Slack 알림을 전송했습니다.'
        };
    }
    catch (error) {
        console.error('❌ 프로그램 신청 Slack 알림 전송 실패:', error);
        return {
            success: false,
            error: error.message || 'Slack 알림 전송 중 오류가 발생했습니다.'
        };
    }
};
exports.sendProgramApplicationSlackAlert = sendProgramApplicationSlackAlert;
// 프로그램 상태 변경 슬랙 알림 (사용자 및 관리자용)
const sendProgramStatusSlackAlert = async (application, user, oldStatus, newStatus) => {
    try {
        const webhook = createSlackWebhook();
        if (!webhook) {
            return { success: false, error: 'Slack Webhook이 설정되지 않았습니다.' };
        }
        const channel = process.env.SLACK_CHANNEL || '#알림';
        const botName = process.env.SLACK_BOT_NAME || 'FlexSpace Pro';
        const statusEmoji = newStatus === 'approved' ? '✅' :
            newStatus === 'rejected' ? '❌' : '🔄';
        const statusText = newStatus === 'approved' ? '승인' :
            newStatus === 'rejected' ? '거부' : '변경';
        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${statusEmoji} 프로그램 ${statusText} 알림`
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*👤 신청자:*\n${user.name} (${user.email})`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*📚 프로그램:*\n${application.programTitle}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*📊 상태:*\n${oldStatus} → ${newStatus}`
                    }
                ]
            }
        ];
        if (newStatus === 'rejected' && application.rejectionReason) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*📝 거부 사유:*\n${application.rejectionReason}`
                }
            });
        }
        blocks.push({
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: `⏰ 처리 시각: ${new Date().toLocaleString('ko-KR')}`
                }
            ]
        });
        await webhook.send({
            channel,
            username: botName,
            icon_emoji: statusEmoji,
            blocks
        });
        console.log(`✅ 프로그램 ${statusText} Slack 알림 전송 성공`);
        return {
            success: true,
            message: `프로그램 ${statusText} Slack 알림을 전송했습니다.`
        };
    }
    catch (error) {
        const statusText = newStatus === 'approved' ? '승인' :
            newStatus === 'rejected' ? '거부' : '변경';
        console.error(`❌ 프로그램 ${statusText} Slack 알림 전송 실패:`, error);
        return {
            success: false,
            error: error.message || 'Slack 알림 전송 중 오류가 발생했습니다.'
        };
    }
};
exports.sendProgramStatusSlackAlert = sendProgramStatusSlackAlert;
// Slack 알림 재시도 함수
const sendSlackWithRetry = async (slackFunction, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await slackFunction();
            if (result.success) {
                return result;
            }
            // 마지막 시도가 아니면 잠시 대기
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        catch (error) {
            console.warn(`Slack 알림 전송 시도 ${i + 1}/${maxRetries} 실패:`, error.message);
            // 마지막 시도에서도 실패하면 에러 반환
            if (i === maxRetries - 1) {
                return {
                    success: false,
                    error: `${maxRetries}번 시도 후 Slack 알림 전송 실패: ${error.message}`
                };
            }
        }
    }
    return {
        success: false,
        error: '예상치 못한 오류로 Slack 알림 전송에 실패했습니다.'
    };
};
exports.sendSlackWithRetry = sendSlackWithRetry;
//# sourceMappingURL=notification-utils.js.map