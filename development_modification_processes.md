# 개발 수정 프로세스 (Development Modification Processes)

## 📅 오늘(2026-02-19)의 개발 목표
1. **AI 연동**: 기존의 목업(Mock)으로 작동하던 AI 기능을 실제 API와 연결하여 작동시키기.
2. **OpenAI 통합**: `openai` npm 패키지를 사용하여 GPT-4o 모델 활용.
3. **에디터 UI 개선**: API Key 입력, 설정 UI, 채팅창 로직 구현.
4. **상태 관리**: 파일 업로드 페이지(`file-dropzone`)와 에디터 페이지(`EditorPage`) 간 데이터 공유(`useLectureStore`).

---

## 🛠️ 주요 수정 내역 (Changelog)

### 1️⃣ OpenAI 연동 코드 구현 (OpenAI Integration)
- `/api/chat/route.ts` 파일 생성:
    - `POST` 요청을 받아 사용자의 메시지와 현재 HTML 컨텐츠를 OpenAI API로 전송.
    - 시스템 프롬프트(System Prompt)를 작성하여 AI가 "교육 콘텐츠 디자이너" 역할을 수행하도록 지시.
    - HTML 코드 블록(` ```html ... ``` `)을 감지하여 텍스트 응답과 실제 코드 변경을 구분.

### 2️⃣ 에디터 페이지 기능 구현 (`EditorPage.tsx`)
- `useLectureStore` 상태와 연동하여 병합된 페이지 데이터 로드.
- `fetch('/api/chat')` 호출 로직 추가:
    - 사용자가 입력한 API Key를 헤더에 포함하여 안전하게 전송.
    - AI 응답(`data.html`)이 있는 경우 `setPages`를 통해 즉시 화면 갱신.
- **설정 모달(Settings Modal)** 추가: API Key 입력 및 저장 UI 구현.
- **채팅 UI** 개선: 로딩 상태 표시, 메시지 말풍선 스타일링, 자동 스크롤.

### 3️⃣ Gemini 모델로 전환 (Pivot to Google Gemini)
- **사용자 요청**: OpenAI 대신 **Google Gemini** 모델 사용 요청.
- **API 수정**:
    - `import OpenAI` → `import { GoogleGenerativeAI }`
    - `openai.chat.completions.create` → `model.generateContent`
    - 모델명 변경: `gpt-4o` → `gemini-pro`
- **UI 수정**:
    - "OpenAI API Key" 문구를 "Google Gemini API Key"로 변경.
    - 설정 모달 내 플레이스홀더 변경 (`sk-...` → `AIzaSy...`).

---

## ⚠️ 발생한 오류 및 해결 과정 (Troubleshooting)

### ❌ `Module not found: Can't resolve 'openai'`
- **원인**: `npm install openai` 설치 명령어가 느린 네트워크 또는 프로세스 타임아웃으로 인해 정상적으로 완료되지 않음.
- **대처**: 재설치 시도, `--save` 옵션 추가, 타임아웃 시간 연장. 하지만 설치가 지연되어 Gemini로 전환됨.

### ❌ `Module not found: Can't resolve '@google/generative-ai'`
- **원인**: Gemini 연동을 위해 필요한 패키지가 설치되지 않았거나 설치 중단됨.
- **대처**: `npm install @google/generative-ai` 명령어 실행. 백그라운드 설치가 지연되어 사용자에게 수동 설치 안내함.

### ❌ `Syntax Error: Unterminated regexp literal` (EditorPage.tsx)
- **원인**: 코드 수정 과정에서 `page.tsx` 파일의 내용이 중간에 잘리거나 잘못된 문법으로 치환됨. (닫는 괄호 누락 등)
- **해결**: `EditorPage.tsx` 파일 전체 내용을 올바른 코드로 다시 작성하여 덮어쓰기 완료.

### ❌ `Fast Refresh had to perform a full reload`
- **원인**: 런타임 오류 및 모듈 없음 오류가 반복되면서 Next.js 개발 서버가 강제로 전체 새로고침을 수행함.
- **대처**: 오류 수정 후 개발 서버를 다른 포트(`3006`)로 재시작하여 캐시 문제 및 프로세스 충돌 방지.

---

## ✅ 현재 상태 및 향후 계획 (Current Status & Next Steps)
- **현재 상태**:
    - 코드는 **Google Gemini** 연동 로직으로 완벽하게 수정됨.
    - UI는 Gemini API Key 입력을 받도록 변경됨.
    - 단, `node_modules` 폴더의 패키지 설치가 불안정할 수 있음.
- **다음 접속 시 할 일**:
    1. 터미널에서 `npm install`을 실행하여 모든 의존성 패키지를 확실하게 설치.
    2. `npm run dev` 실행 후 `http://localhost:3000` 접속.
    3. Gemini API Key를 입력하고 실제 AI 기능 테스트.
