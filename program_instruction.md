# Lecture Forge AI - Program Instruction

## 1. 프로젝트 개요 (Project Overview)
**Lecture Forge AI**는 여러 개의 강의 슬라이드(HTML 파일)를 하나로 병합하고, **Google Gemini AI**를 활용하여 강의 내용과 디자인을 지능적으로 수정할 수 있는 웹 기반 에디터입니다.

기존의 단순 병합 도구를 넘어, 사용자가 대화형 인터페이스를 통해 "내용 요약", "스타일 변경", "어조 수정" 등의 요청을 하면 AI가 실시간으로 HTML 코드를 분석하고 수정하여 반영합니다.

## 2. 주요 기능 (Key Features)

### 📁 스마트 파일 병합 (Smart File Merging)
- 여러 HTML 파일을 Drag & Drop으로 업로드하여 순서를 지정하고 병합할 수 있습니다.
- 각 HTML 파일의 CSS와 스크립트가 충돌하지 않도록 독립적인 환경(Iframe/Blob)을 유지하며 병합합니다.

### 🤖 AI 기반 콘텐츠 에디터 (AI-Powered Editor)
- **Google Gemini Pro** 모델을 탑재하여 높은 수준의 자연어 이해 및 코드 생성 능력을 제공합니다.
- **채팅 UI**: 우측 사이드 패널에서 AI와 대화하며 수정 요청을 할 수 있습니다.
- **기능 예시**:
    - "이 슬라이드의 내용을 3줄로 요약해줘."
    - "중요한 키워드를 굵게 표시해줘."
    - "배경을 다크 모드로 바꾸고 폰트를 키워줘."
    - "너무 어려운 용어를 쉬운 말로 풀어줘."

### ⚙️ 사용자 설정 (User Settings)
- **API Key 관리**: 별도의 서버 저장 없이 브라우저 내에서 안전하게 본인의 Google Gemini API Key를 입력하여 사용할 수 있습니다.
- **실시간 미리보기**: 수정된 내용이 즉시 중앙 미리보기 화면(Preview)에 반영됩니다.

### 💾 내보내기 (Export)
- 최종 수정된 강의 자료를 단일 HTML 파일(`forge_lecture_final.html`)로 다운로드하여 배포하거나 브라우저에서 바로 열어볼 수 있습니다.

## 3. 기술 스택 (Tech Stack)
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Lucide Icons
- **State Management**: Zustand (전역 상태 관리)
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai`)
- **Backend API**: Next.js API Routes (Serverless functions)

## 4. 실행 방법 (How to Run)
이 프로젝트는 웹 애플리케이션으로 로컬 환경에서 실행됩니다.

1. **프로젝트 폴더 이동**:
   ```bash
   cd lecture-forge-web
   ```

2. **의존성 설치** (최초 1회 또는 모듈 에러 시):
   ```bash
   npm install
   ```

3. **개발 서버 실행**:
   ```bash
   npm run dev
   ```
   - 실행 후 브라우저에서 `http://localhost:3000` (또는 터미널에 표시된 포트)으로 접속합니다.

## 5. 사용 가이드
1. 메인 화면에 HTML 파일들을 드래그하여 업로드합니다.
2. 순서를 확인하고 **"Merge & Open AI Editor"** 버튼을 클릭합니다.
3. 에디터 화면 좌측 하단의 **설정(⚙️)** 버튼을 누르고 **Gemini API Key**를 입력합니다.
4. 우측 채팅창을 열고 AI에게 원하는 수정 사항을 명령합니다.
