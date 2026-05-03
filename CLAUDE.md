# 프로젝트 설정

> **워크플로우 필독**: 아래 두 파일을 반드시 먼저 읽을 것 (session-briefing이 강제)
> - `tools/WORKFLOW.md` — 워크플로우 + 금지규칙 + 도구 실행법
> - `tools/PUBLISHING_CLAUDE_TEMPLATE.md` — 150개 퍼블리싱 규칙
> - `.claude/PROJECT_TYPES.md` — 프로젝트 두 형태(Landing/Brand) 구조 기준

---

## 프로젝트 정보

> ⚠️ 이 파일은 **마스터 템플릿** (vwebmaster) 입니다.
> 신규 프로젝트로 clone 시 아래 값을 **프로젝트별 실제 값으로 교체**하세요.

- **프로젝트명**: `<PROJECT_NAME>` *(e.g. cafeprihet, harupoke)*
- **프로젝트 형태**: `<Landing | Brand>` *(theme/design/template/ 에 subNN/ 존재 시 Brand)*
- **캔버스 크기**: 1905 (÷1920 금지!)
- **로컬 서버**: `php -d short_open_tag=On -S localhost:8080`
- **DB**: `<DB_NAME>` (mysql root / `<PASSWORD or empty>`)
- **반응형**: `@media (max-width: 599px)`
- **PSD 파일**: `/psd/` 하위 (`<PROJECT>_원본.psd` 등)
- **PSD 파서**: `node tools/psd_parser.js <PSD경로> <출력JSON경로>`
- **PSD stroke guard**: `node scripts/psd-stroke-guard.js --psd <PSD경로> --parsed <parsed.json> --write --strict` / `node scripts/psd-stroke-guard.js --psd <PSD경로> --spec <spec.json> --write --strict`
- **구조 shadow 추론**: `node scripts/structure-shadow.js --spec <spec.json> --plan <plan.json> --image-analysis <image-analysis.json> --out <structure-shadow.json> [--reference-image <시안crop>]`

## 디자인 토큰 (header.css :root)

> 프로젝트별로 값 교체. 아래는 형식 예시.

```
--mc: <메인 컬러 hex>          /* 메인 */
--sc: <서브 컬러 hex>          /* 서브/강조 */
--fc: <배경 컬러 hex>          /* 배경 */
--mf: <메인 폰트 패밀리>       /* 본문 */
```

## 페이지 라우팅

> **Landing 형태**: 메인 1개만. 헤더 메뉴는 `#move_XX` 앵커.
> **Brand 형태**: 메인 + subNN 서브페이지. 아래 표는 Brand 형태의 예시 스켈레톤.

| 페이지 | URL | CSS/JS |
|--------|-----|--------|
| 메인 | / | style.css / script.js |
| sub01 | /bbs/content.php?co_id=sub01 | sub01.css / sub01.js |
| sub02 | /bbs/content.php?co_id=sub02 | sub02.css / sub02.js |
| … | … | … |

## section 공통 CSS (style.css)

```css
section { overflow:hidden; display:flex; justify-content:center; align-items:center; width:100%; flex-direction:column; }
```
→ rltv 자식에 margin-left로 좌측 정렬하려면 `align-self:flex-start` 필수
→ `section` 자체에 `aspect-ratio` 넣지 말 것. 높이 제어가 필요하면 내부 `rltv` wrapper에만 사용하고, 모바일 대응은 section padding/margin 구조로 처리할 것.
→ bg/texture/smoke/deco는 절대 `rltv`/heightChain source로 잡지 말 것. 실제 카피 묶음, 패널 내부 live content처럼 세로 흐름이 있는 콘텐츠만 `rltv`로 잡을 것.

## 외부 연동

> 프로젝트별로 실제 키/ID 로 교체. **마스터 템플릿에는 실제 값 넣지 말 것.**

- **Notion API Key**: `<NOTION_API_KEY>`
- **Notion 프로젝트 DB**: `<NOTION_DB_ID>`
- **Figma token**: `<FIGMA_TOKEN>`

## 주의사항

1. content.php 페이지: `.container { width:1200px }` 래퍼 → 페이지 CSS에서 `display:none !important`
2. `flexrow` 클래스 쓰면 `width:100%` 강제됨 → 직접 flex 스타일 작성
3. PSD 회색 배경 = "콘텐츠 있음" 표시일 뿐, 실제 배경색 아님
4. force push 주의 — 기존 파일 날아간 사고 이력 있음
5. `structure-shadow`는 shadow mode다. panel ownership / overflow-hidden / outer-inner top 분리 후보를 주지만, 현재는 hard fail 게이트로 쓰지 않는다.
6. leaf 텍스트는 기본 `white-space:nowrap`로 유지하고 자동 줄바꿈을 허용하지 않는다.
7. 여러 줄 텍스트는 `<br>`로만 제어한다. 모바일 포함 `br` 숨김/자동 개행으로 재해석하지 않는다.
