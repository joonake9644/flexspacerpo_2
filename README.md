# Firebase 웹앱 개발 가이드

<div align="center">
  <img src="https://picsum.photos/1200/400?random=2" alt="Firebase 웹앱 개발 배너" />
</div>

## 프로젝트 개요

이 저장소는 Firebase를 백엔드로 사용하는 Next.js 웹 애플리케이션 개발을 위한 종합 가이드입니다. 모든 Firebase 기반 프로젝트에서 재사용 가능한 개발 패턴, 베스트 프랙티스, 그리고 AI 코딩 어시스턴트 활용법을 제공합니다.

### 제공하는 내용
- Firebase 서비스 통합 패턴
- TypeScript + React 개발 가이드라인
- 보안 규칙 및 성능 최적화
- AI 어시스턴트 활용 워크플로우
- 테스트 및 배포 전략

## 기술 스택

### Frontend
- **Framework**: Next.js 15 + TypeScript
- **UI Library**: shadcn/ui + TailwindCSS
- **State Management**: Zustand + @tanstack/react-query
- **Icons**: Lucide React

### Backend (Firebase)
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Functions**: Firebase Functions (Node.js)
- **Hosting**: Firebase Hosting
- **Storage**: Firebase Storage
- **Messaging**: Firebase Cloud Messaging

### Development Tools
- **AI Assistants**: Cursor AI / Windsurf / GitHub Copilot
- **Package Manager**: npm
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + Firebase Emulator Suite

## 프로젝트 구조

```
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   └── common/             # 공통 컴포넌트
│   ├── features/               # 기능별 모듈
│   │   └── [feature-name]/     # 기능별 디렉토리
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── types/
│   │       └── api.ts
│   ├── lib/
│   │   ├── firebase/           # Firebase 설정
│   │   └── utils.ts            # 유틸리티 함수
│   ├── hooks/                  # 전역 커스텀 훅
│   └── types/                  # 전역 TypeScript 타입
├── functions/                  # Firebase Functions
├── firestore.rules            # Firestore 보안 규칙
├── storage.rules              # Storage 보안 규칙
└── firebase.json              # Firebase 설정
```

## 시작하기

### Prerequisites
- Node.js 18.0 이상
- npm
- Firebase CLI
- AI 코딩 어시스턴트 (Cursor AI, Windsurf, GitHub Copilot 등)

### 1. 저장소 설정
```bash
# 새 프로젝트 생성 또는 기존 프로젝트 클론
git clone [your-repository-url]
cd [your-project-name]
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Firebase 프로젝트 설정
```bash
# Firebase CLI 설치 (글로벌)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 프로젝트 초기화
firebase init
```

### 4. 환경변수 설정
`.env.local` 파일을 생성하고 Firebase 설정을 추가하세요:

```bash
# Firebase 클라이언트 설정 (NEXT_PUBLIC_ 필수)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (서버 전용)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# 환경 설정
NEXT_PUBLIC_ENVIRONMENT=development
```

### 5. Firebase Emulator Suite 시작
```bash
# 개발용 에뮬레이터 실행
firebase emulators:start --only auth,firestore,functions,storage
```

### 6. 개발 서버 실행
```bash
# 새 터미널에서 실행
npm run dev
```

애플리케이션이 http://localhost:3000 에서 실행됩니다.

## 개발 가이드

### AI 코딩 어시스턴트 활용
이 프로젝트는 다양한 AI 코딩 어시스턴트와 함께 개발하도록 설계되었습니다.

#### 공통 설정
1. 프로젝트 루트의 개발 가이드라인 파일들:
   - `.cursorrules` (Cursor AI용)
   - `windsurf.config.json` (Windsurf용)
   - 기타 AI 어시스턴트별 설정 파일
2. Firebase 특화 개발 패턴이 미리 정의되어 있습니다
3. TypeScript + React + Firebase 베스트 프랙티스가 적용됩니다

#### 권장 개발 워크플로우 (AI 어시스턴트 공통)
1. **기능 계획** → AI와 함께 요구사항 정리
2. **컴포넌트 설계** → AI 어시스턴트로 구조 설계
3. **코드 구현** → AI 어시스턴트의 코드 제안 활용
4. **테스트 작성** → Firebase Emulator로 테스트
5. **리팩토링** → AI 어시스턴트로 코드 개선

#### AI 어시스턴트별 활용법
- **Cursor AI**: `.cursorrules` 파일 기반 컨텍스트 이해
- **Windsurf**: 프로젝트 구조와 Firebase 패턴 학습
- **GitHub Copilot**: 인라인 코드 제안 및 자동완성
- **기타**: 프로젝트 문서와 코딩 스타일 참조

### Firebase 개발 패턴

#### 기본 Firebase 설정
```typescript
// lib/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Firebase 설정
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

#### Firestore 데이터 작업
```typescript
// 데이터 읽기
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function getData(collectionName: string, filters?: any) {
  const q = query(collection(db, collectionName), ...filters);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 실시간 데이터 구독
import { onSnapshot } from 'firebase/firestore';

useEffect(() => {
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setData(data);
  });

  return unsubscribe;
}, []);
```

#### 보안 규칙 예제
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 테스트

### Firebase Emulator Suite 사용
```bash
# 테스트 실행 (에뮬레이터 자동 시작)
npm run test

# 보안 규칙 테스트
npm run test:rules
```

### 테스트 종류
- **Unit Tests**: 비즈니스 로직 테스트
- **Integration Tests**: Firebase 서비스 연동 테스트
- **Security Rules Tests**: Firestore 보안 규칙 검증

## 배포

### 스테이징 환경
```bash
# Firebase 스테이징 배포
firebase use staging
firebase deploy
```

### 프로덕션 환경
```bash
# Firebase 프로덕션 배포
firebase use production
firebase deploy --only hosting,firestore,functions
```

## 모니터링

### Firebase Console 확인 사항
- **Authentication**: 사용자 인증 현황
- **Firestore**: 데이터베이스 사용량 및 성능
- **Functions**: 클라우드 함수 실행 로그
- **Hosting**: 웹앱 배포 상태
- **Performance**: 앱 성능 메트릭

## 문제 해결

### 일반적인 이슈들
1. **Firebase 초기화 오류**
   ```bash
   firebase use --add
   ```

2. **환경변수 누락**
   - `.env.local` 파일의 모든 필수 변수 확인
   - `NEXT_PUBLIC_` 접두사 확인

3. **보안 규칙 오류**
   ```bash
   firebase firestore:rules:test --test-file=firestore-test.js
   ```

4. **Emulator 연결 실패**
   ```bash
   firebase emulators:start --only auth,firestore --reset-cache
   ```

## 기여하기

1. 이슈 생성 또는 기존 이슈 확인
2. 피처 브랜치 생성 (`git checkout -b feature/새기능`)
3. 변경사항 커밋 (`git commit -m 'feat: 새로운 기능 추가'`)
4. 브랜치 푸시 (`git push origin feature/새기능`)
5. Pull Request 생성

### 커밋 메시지 규칙
- `feat:` 새로운 기능
- `fix:` 버그 수정
- `docs:` 문서 변경
- `style:` 코드 포맷팅
- `refactor:` 리팩토링
- `test:` 테스트 추가
- `firebase:` Firebase 설정 변경

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 지원

- **버그 신고**: [GitHub Issues](../../issues)
- **기능 요청**: [GitHub Discussions](../../discussions)
- **문서**: [Wiki](../../wiki)

## Vite 기준 참고

- 프런트엔드는 Vite + React + TypeScript(SPA) 기준으로 동작합니다.
- 환경변수는 `VITE_` 접두사를 사용합니다(`.env.local`).
- 개발 서버: `npm run dev` 실행 시 기본 포트는 `5173`입니다.

예시(.env.local):

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=

# (선택) 에뮬레이터/푸시 설정
VITE_USE_EMULATOR=false
VITE_EMULATOR_HOST=127.0.0.1
VITE_EMULATOR_AUTH_PORT=9099
VITE_EMULATOR_FIRESTORE_PORT=8080
VITE_VAPID_PUBLIC_KEY=
```

개발 서버 실행:

```
npm run dev   # http://localhost:5173
```

---

<div align="center">
  Made with Firebase & Next.js
</div>
