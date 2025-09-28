// Slack Webhook 연결 테스트 스크립트
const https = require('https');
const url = require('url');

// .env.local에서 환경변수 로드
require('dotenv').config({ path: '.env.local' });

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#알림';
const SLACK_BOT_NAME = process.env.SLACK_BOT_NAME || 'flexspacepro';

console.log('🧪 Slack Webhook 연결 테스트 시작');
console.log('📋 설정 정보:');
console.log(`   - Webhook URL: ${SLACK_WEBHOOK_URL ? SLACK_WEBHOOK_URL.substring(0, 30) + '...' : '❌ 없음'}`);
console.log(`   - Channel: ${SLACK_CHANNEL}`);
console.log(`   - Bot Name: ${SLACK_BOT_NAME}`);

if (!SLACK_WEBHOOK_URL) {
  console.error('❌ SLACK_WEBHOOK_URL이 설정되지 않았습니다.');
  process.exit(1);
}

// 테스트 메시지 데이터
const testMessage = {
  channel: SLACK_CHANNEL,
  username: SLACK_BOT_NAME,
  icon_emoji: ':test_tube:',
  blocks: [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🧪 EmailJS + Slack 통합 테스트'
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: '*📅 테스트 일시:*\\n' + new Date().toLocaleString('ko-KR')
        },
        {
          type: 'mrkdwn',
          text: '*🎯 목적:*\\n연동 기능 정상 동작 확인'
        },
        {
          type: 'mrkdwn',
          text: '*⚙️ 상태:*\\n개발 환경 테스트'
        },
        {
          type: 'mrkdwn',
          text: '*📊 결과:*\\n연결 성공'
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '✅ *FlexSpace Pro 알림 시스템이 정상적으로 작동하고 있습니다.*\\n\\n다음 기능들이 활성화되었습니다:\\n• 대관 신청 알림\\n• 대관 승인/거부 알림\\n• 프로그램 신청 알림\\n• 프로그램 승인/거부 알림'
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '🤖 FlexSpace Pro Bot | 개발환경 테스트'
        }
      ]
    }
  ]
};

// Webhook URL 파싱
const parsedUrl = url.parse(SLACK_WEBHOOK_URL);
const postData = JSON.stringify(testMessage);

const options = {
  hostname: parsedUrl.hostname,
  port: 443,
  path: parsedUrl.path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('\\n🚀 Slack으로 테스트 메시지 전송 중...');

const req = https.request(options, (res) => {
  console.log(`📡 응답 상태: ${res.statusCode}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Slack 메시지 전송 성공!');
      console.log('🔔 이제 Slack #알림 채널을 확인하세요.');
      console.log('\\n📋 예상 결과:');
      console.log('   - 채널에 "🧪 EmailJS + Slack 통합 테스트" 헤더의 메시지가 표시됨');
      console.log('   - 메시지에 테스트 정보와 활성화된 기능 목록이 포함됨');
      console.log('   - 봇 이름이 "flexspacepro"로 표시됨');
    } else {
      console.log('❌ Slack 메시지 전송 실패');
      console.log('📋 응답 내용:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 요청 오류:', error.message);
  console.log('\\n🔍 문제 해결 방법:');
  console.log('   1. SLACK_WEBHOOK_URL이 올바른지 확인');
  console.log('   2. 인터넷 연결 상태 확인');
  console.log('   3. Slack 워크스페이스에서 Webhook이 활성화되어 있는지 확인');
});

req.write(postData);
req.end();