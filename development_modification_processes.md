# Lecture Forge - 개발 과정 및 기술 문서

> **최종 수정일**: 2026-02-20 (v2.1 - Blob URL 차트 렌더링 수정)  
> **현재 버전**: v2.1 (HTML Merger + Chart Fix)  
> **배포**: Vercel  
> **GitHub**: https://github.com/bignine99/html_merger_v1.0.git

---

## 1. 프로젝트 개요

### 1.1 목적
여러 개의 HTML 강의 파일(.html)을 **하나의 단일 HTML 파일**로 병합하는 웹 도구.  
병합된 결과물은 **CSS 충돌 없이** 각 페이지를 iframe으로 격리하며, **플로팅 네비게이션**으로 페이지 간 이동이 가능.

### 1.2 핵심 기능
| 기능 | 설명 |
|------|------|
| 파일 업로드 | 드래그 앤 드롭 또는 클릭으로 HTML/HTM 파일 다중 선택 |
| 순서 변경 | 업로드된 파일의 병합 순서를 ▲▼ 버튼으로 조정 |
| 스마트 병합 | CSS 격리(iframe), `</script>` 이스케이프, 제목 자동 추출 |
| 인라인 미리보기 | 병합 결과를 페이지 내 iframe으로 즉시 확인 |
| 다운로드 | `merged_lecture.html` 파일로 다운로드 |
| 새 탭 미리보기 | 브라우저 새 탭에서 전체화면으로 확인 |

### 1.3 사용 시나리오
1. 교수/강사가 각 챕터별로 제작한 HTML 강의 슬라이드를 하나로 합침
2. 학생 배포용 단일 파일 생성 (네비게이션 포함)
3. `file:///` 프로토콜에서도 작동 (로컬에서 바로 열기 가능)

---

## 2. 기술 스택

### 2.1 프레임워크 & 라이브러리
| 패키지 | 버전 | 용도 |
|--------|------|------|
| Next.js | 14.1.0 | React 프레임워크, SSR/SSG |
| React | ^18 | UI 렌더링 |
| TypeScript | ^5 | 타입 안전성 |
| Tailwind CSS | ^3.3.0 | 유틸리티 CSS 스타일링 |
| Zustand | ^4.5.1 | 전역 상태 관리 (현재는 pages만 저장) |
| Lucide React | ^0.323.0 | 아이콘 컴포넌트 |
| Framer Motion | ^11.0.3 | 애니메이션 (현재 미사용, 향후 확장 가능) |
| Radix UI | ^1.0.2 | 접근성 기반 UI 프리미티브 (Button slot) |
| CVA | ^0.7.0 | class-variance-authority, 컴포넌트 변형 관리 |

### 2.2 빌드 & 배포
| 항목 | 값 |
|------|-----|
| 빌드 도구 | Next.js (Webpack) |
| TypeScript target | **es2018** (정규식 `s` 플래그 필수) |
| 배포 플랫폼 | Vercel |
| Node.js | 18+ 권장 |

---

## 3. 프로젝트 구조

```
lecture-forge-web/
├── package.json                 # 의존성 및 스크립트
├── tsconfig.json                # TypeScript 설정 (target: es2018)
├── tailwind.config.ts           # Tailwind CSS 설정
├── postcss.config.js            # PostCSS 설정
├── .gitignore                   # Git 제외 목록
├── development_modification_processes.md  # 이 문서
├── program_instruction.md       # 프로그램 사용 설명서
│
└── src/
    ├── app/
    │   ├── layout.tsx           # 루트 레이아웃 (Inter 폰트, 메타데이터)
    │   ├── page.tsx             # 메인 페이지 (Hero + FileDropzone)
    │   └── globals.css          # 전역 CSS (Tailwind + 커스텀 테마)
    │
    ├── components/
    │   ├── file-dropzone.tsx    # ⭐ 핵심 컴포넌트: 파일 업로드 및 병합 UI
    │   └── ui/
    │       ├── button.tsx       # Shadcn/ui Button (CVA 기반)
    │       ├── card.tsx         # Shadcn/ui Card
    │       └── input.tsx        # Shadcn/ui Input
    │
    └── lib/
        ├── smart-merger.ts      # ⭐ 핵심 로직: HTML 병합 엔진
        ├── store.ts             # Zustand 전역 상태 (pages)
        └── utils.ts             # cn() 유틸리티 (tailwind-merge + clsx)
```

---

## 4. 핵심 데이터 구조

### 4.1 `MergedPage` (src/lib/smart-merger.ts)
```typescript
export interface MergedPage {
    filename: string;     // 원본 파일명 (예: "chapter_01.html")
    title: string;        // 추출된 제목 (예: "Software Architecture 101")
    content: string;      // 원본 HTML 전체 텍스트
    safeContent: string;  // JSON.stringify() + </script> 이스케이프 처리된 문자열
}
```

### 4.2 `LecturePage` (src/lib/store.ts)
```typescript
export interface LecturePage {
    filename: string;
    title: string;
    content: string;
    safeContent: string;
}

// Zustand Store
interface LectureStore {
    pages: LecturePage[];
    setPages: (pages: LecturePage[]) => void;
}
```

> **참고**: `MergedPage`와 `LecturePage`는 동일한 구조. 향후 통합 가능.

---

## 5. 핵심 로직 상세

### 5.1 제목 추출 (`extractTitle`)
HTML에서 페이지 제목을 추출하는 우선순위:

1. **`nn-header-title` 클래스를 가진 div** → HTML 태그 제거 후 텍스트 반환
2. **`<title>` 태그** → "NINETYNINE - " 접두사 제거 후 반환
3. **파일명 fallback** → 확장자 제거, 언더스코어를 공백으로 변환

```
정규식: /<div[^>]*class=["'][^"']*nn-header-title[^"']*["'][^>]*>(.*?)<\/div>/is
```
> ⚠️ `s` 플래그 (dotAll) 사용 → **tsconfig.json의 target이 es2018 이상**이어야 함

### 5.2 스마트 병합 (`smartMergeFiles`)
각 HTML 파일을 안전하게 JavaScript 변수에 저장할 수 있도록 처리:

```
원본 HTML → JSON.stringify() → </script> 이스케이프 → safeContent
```

**왜 `</script>` 이스케이프가 필요한가?**  
병합된 HTML 파일에서 각 페이지의 내용을 `<script>` 블록 내 JavaScript 변수로 저장합니다.  
만약 원본 HTML에 `</script>`가 포함되어 있으면, 브라우저 HTML 파서가 부모 `<script>` 태그를 닫아버려 전체가 깨집니다.  
따라서 `</script>` → `<\/script>`로 이스케이프합니다.

### 5.3 병합 HTML 생성 (`generateMergedHtml`)
최종 출력은 **Single Page Application** 구조:

```
<!DOCTYPE html>
├── <head>
│   ├── Google Fonts (Inter, Noto Sans KR)
│   └── <style> (네비게이션 바 CSS)
├── <body>
│   ├── <nav> 플로팅 네비게이션
│   │   ├── ☰ 토글 버튼
│   │   ├── << 이전 페이지
│   │   ├── [1] [2] [3] ... 페이지 번호 버튼
│   │   ├── >> 다음 페이지
│   │   └── 페이지 인디케이터 (1/N)
│   ├── <iframe id="pageFrame"> ← 현재 페이지 표시
│   └── <script>
│       ├── var _pages = [...] ← 모든 페이지의 safeContent 배열
│       ├── loadPage(idx) ← Blob URL 방식으로 iframe 페이지 로드
│       ├── goPage(idx), prevPage(), nextPage()
│       ├── toggleNav() ← 네비게이션 바 접기/펼치기
│       └── 키보드 이벤트 (←→ 화살표 키로 페이지 이동)
```

**CSS 격리 방식**: `iframe` + `Blob URL`  
- 각 페이지의 CSS가 다른 페이지에 영향을 주지 않음
- 외부 CDN 스크립트(Chart.js 등)도 정상적으로 로드됨
- `file:///` 프로토콜에서도 작동 (CORS 이슈 없음)

---

## 6. 개발 과정 & 시행착오

### 6.1 Phase 1: 초기 Node.js 스크립트 (merge.js)
- **방식**: Node.js 스크립트로 폴더 내 HTML 파일을 자동 탐지하여 병합
- **문제**: 매번 터미널에서 실행해야 하는 불편함
- **결과**: 기능은 작동하지만 비개발자에게 접근성이 낮음

### 6.2 Phase 2: Next.js 웹 앱으로 전환
- **결정**: 브라우저에서 드래그 앤 드롭으로 병합할 수 있는 웹 앱으로 전환
- **기술 선택**: Next.js 14 + Tailwind CSS + Zustand
- **성과**: 파일 업로드 → 병합 → 다운로드 기본 워크플로우 완성

### 6.3 Phase 3: AI 편집 기능 추가 (v1.x) → 제거됨
이 단계에서 Google Gemini API를 연동하여 AI 기반 강의 내용 수정 기능을 추가했습니다.

#### 시도했던 AI 기능들:
| 기능 | 설명 | 문제점 |
|------|------|--------|
| AI 채팅 에디터 | `/editor` 페이지에서 AI와 대화하며 슬라이드 수정 | 복잡한 프롬프트 엔지니어링 필요 |
| 페이지별 수정 | "페이지 2 수정해줘" → 특정 페이지만 AI에 전송 | Stale closure 문제로 잘못된 페이지 전송 |
| 일괄 수정 | "모든 페이지 수정해줘" → 전체 순차 처리 | API 요청 많아 비용/시간 과다 |
| 수정 보고서 | AI가 수정 전후 변경 내역을 상세히 보고 | 보고서 품질 불안정 |

#### 발생했던 주요 버그들:

**Bug 1: Gemini 모델 404 오류**
- 원인: `gemini-pro` 모델이 deprecated됨
- 해결: `gemini-2.0-flash`로 변경

**Bug 2: AI가 다른 페이지의 HTML을 받음 (Stale Closure)**
- 원인: React 클로저 특성상 `pages` 변수가 이전 렌더링의 값을 참조
- 해결: `useLectureStore.getState().pages`로 zustand 스토어에서 직접 최신 값 읽기

**Bug 3: AI가 "페이지 2 코드를 보내주세요"라고 응답**
- 원인: API에 페이지 번호/제목을 보내지 않아 AI가 어떤 페이지인지 모름
- 해결: `pageNumber`, `pageTitle`, `totalPages`를 API에 함께 전송하고, 시스템 프롬프트에 "이 HTML이 해당 페이지입니다"라고 명시

**Bug 4: AI가 내용을 삭제하는 방식으로 "수정"**
- 원인: 시스템 프롬프트가 "보강 = 확장"이 아니라 "간소화"로 해석됨
- 해결: 한국어 프롬프트로 전환, "절대 삭제 금지" 규칙 명시, 보강 작업의 4개 카테고리 상세 지침 추가

**Bug 5: 수정 결과가 미리보기에 반영되지 않음**
- 원인: 미리보기가 전체 병합 HTML을 보여주어, 수정된 페이지가 아닌 1페이지로 초기화됨
- 해결: 개별 페이지 미리보기 모드 추가 (수정 중인 페이지만 표시)

**Bug 6: 채팅창에 HTML 코드가 그대로 노출**
- 원인: AI 응답에서 코드블록 파싱이 불완전함
- 해결: `stripCodeFromMessage()` 함수로 코드블록 완전 제거

#### AI 기능 제거 결정:
- AI 응답 품질이 불안정 (내용 삭제, 불필요한 코드 노출 등)
- 프롬프트 엔지니어링의 한계 (강의 내용 도메인 전문성 부족)
- 도구의 핵심 목적은 **"병합"**이지 "AI 편집"이 아님
- 복잡성 증가 대비 실용성이 낮음

### 6.4 Phase 4: 순수 병합 도구로 정리 (v2.0 - 현재)
- AI 관련 코드 전체 제거 (`/api/chat`, `/editor`, `@google/generative-ai`)
- 메인 페이지에서 업로드 → 병합 → 미리보기 → 다운로드 원스톱 완성
-  파일 순서 변경 기능 추가 (▲▼ 버튼)
- Vercel 배포 준비

### 6.5 Vercel 배포 시 발생한 에러
**에러**: `This regular expression flag is only available when targeting 'es2018' or later.`
- 위치: `src/lib/smart-merger.ts:15` (정규식 `/is` 플래그 중 `s`)
- 원인: `tsconfig.json`에 `target`이 없어 TypeScript 기본값(ES3/ES5) 적용
- 해결: `tsconfig.json`에 `"target": "es2018"` 추가

### 6.6 Phase 5: 차트 렌더링 버그 수정 (v2.1 - 2026-02-20)

#### 문제 현상
원본 HTML 파일에 포함된 **Chart.js 차트**가 병합 후 사라지는 현상 발생.  
원본 파일을 단독으로 열면 차트가 정상 표시되지만, 병합된 결과물에서는 빈 캔버스만 나옴.

#### 근본 원인 분석
원본 HTML 파일들은 다음 구조를 가짐:
```html
<!-- head에서 CDN으로 Chart.js 로드 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- body 하단에서 DOMContentLoaded 이벤트로 차트 초기화 -->
<script>
window.addEventListener("DOMContentLoaded", () => {
    new Chart(document.getElementById("myChart"), { ... });
});
</script>
```

기존 `document.write()` 방식의 문제:
```javascript
// ❌ 기존 방식
doc.open();
doc.write(_pages[idx]);  // HTML 파싱 시작
doc.close();             // → DOMContentLoaded 즉시 발생!
// 하지만 Chart.js CDN은 아직 다운로드 중...
// → Chart 객체가 undefined → 차트 생성 실패 → 빈 캔버스
```

`doc.close()` 호출 시 브라우저는 문서 로딩이 완료된 것으로 간주하여  
`DOMContentLoaded` 이벤트를 발생시키지만, `<script src="...">` 태그로  
참조된 외부 스크립트의 다운로드/실행은 아직 완료되지 않은 상태.  
결과적으로 `Chart` 전역 객체가 `undefined`인 상태에서 차트 초기화 코드가 실행됨.

#### 해결: Blob URL 방식으로 전환
```javascript
// ✅ 수정된 방식 (Blob URL)
function loadPage(idx) {
    var frame = document.getElementById('pageFrame');
    var blob = new Blob([_pages[idx]], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    if (frame._blobUrl) URL.revokeObjectURL(frame._blobUrl);
    frame._blobUrl = url;
    frame.src = url;
}
```

**Blob URL 방식의 장점:**
- `iframe.src`에 Blob URL을 설정하면 브라우저가 **정상적인 페이지 로드 프로세스**를 수행
- 외부 `<script src="...">` 태그가 파싱 시 정상적으로 다운로드/실행 완료됨
- 이후 `DOMContentLoaded`가 올바른 시점에 발생하여 차트 초기화 정상 동작
- `file:///` 프로토콜에서도 Blob URL은 정상 작동 (동일 출처 컨텍스트)
- 이전 Blob URL을 `URL.revokeObjectURL()`로 해제하여 메모리 누수 방지

#### 수정된 파일
| 파일 | 위치 | 변경 내용 |
|------|------|----------|
| `src/lib/smart-merger.ts` | `loadPage()` 함수 | `document.write()` → `Blob URL` |
| `merge.js` (루트) | `loadPage()` 함수 | `document.write()` → `Blob URL` |

---

## 7. 로컬 개발 환경 설정

### 7.1 최초 설치
```bash
cd lecture-forge-web
npm install
```

### 7.2 개발 서버 실행
```bash
npm run dev
# → http://localhost:3000 에서 접속
```

### 7.3 프로덕션 빌드
```bash
npm run build
npm start
```

### 7.4 Git 커밋 & 푸시
```bash
git add -A
git commit -m "설명"
git push origin main
# → Vercel에서 자동 배포 트리거
```

---

## 8. 향후 개발 고려사항

### 8.1 기능 확장 아이디어
| 기능 | 난이도 | 설명 |
|------|--------|------|
| 폴더 업로드 | 중 | 폴더째 드래그 앤 드롭으로 내부 HTML 자동 탐지 |
| 드래그 순서 변경 | 중 | 현재 ▲▼ 버튼 → 드래그 앤 드롭 방식으로 개선 |
| 테마 선택 | 하 | 네비게이션 바 색상/스타일 커스터마이징 |
| PDF 내보내기 | 상 | 병합 결과를 PDF로 변환 (Puppeteer 필요) |
| 페이지별 미리보기 | 중 | 병합 전 각 페이지를 개별 미리보기 |
| 제목 수동 편집 | 하 | 자동 추출된 제목을 사용자가 직접 수정 |
| 네비게이션 위치 설정 | 하 | 하단/상단/좌측 등 위치 선택 |

### 8.2 주의사항 (향후 개발 시)
1. **`safeContent` 생성 로직을 변경하지 마세요** — `JSON.stringify` + `</script>` 이스케이프는 보안 및 안정성에 필수
2. **`target: "es2018"`을 제거하지 마세요** — 정규식 `s` 플래그가 빌드에 실패합니다
3. **iframe 방식을 변경할 때 주의** — CSS 격리가 깨지면 페이지 간 스타일 충돌 발생
4. **`file:///` 프로토콜 호환성 유지** — 최종 출력물은 로컬에서도 사용되므로 외부 리소스 의존 최소화
5. **`document.write()` 방식으로 되돌리지 마세요** — 외부 CDN 스크립트(Chart.js 등)가 정상 로드되지 않아 차트가 사라집니다. 반드시 `Blob URL` 방식 유지

### 8.3 과거 AI 기능 재도입 시 참고
만약 향후 AI 기능을 다시 추가한다면:
- Gemini 모델은 `gemini-2.0-flash` 이상 사용 (이전 모델 deprecated)
- 시스템 프롬프트를 **한국어**로 작성해야 응답 품질이 높음
- `useLectureStore.getState()`로 항상 최신 상태를 읽어야 stale closure 문제 방지
- 페이지 번호/제목을 API에 반드시 함께 전송
- AI 응답에서 HTML 코드블록을 반드시 파싱하여 분리 (채팅에 코드 노출 방지)

---

## 9. 커밋 히스토리

| 해시 | 날짜 | 설명 |
|------|------|------|
| af94618 | 2026-02-20 | v2.0: HTML Merger 초기 커밋 (AI 기능 제거, 순수 병합 도구) |
| 3afa7c2 | 2026-02-20 | fix: tsconfig target es2018 - Vercel 빌드 정규식 플래그 에러 수정 |
| 808eb21 | 2026-02-20 | fix: Blob URL 방식으로 변경 - iframe 내 Chart.js 등 CDN 스크립트 정상 로드 |

---

## 10. 연락처 & 리소스

- **GitHub**: https://github.com/bignine99/html_merger_v1.0
- **배포**: Vercel (자동 배포, main 브랜치 push 시)
