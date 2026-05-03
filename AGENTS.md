# 프로젝트 설정

> **워크플로우 필독**: 아래 두 파일을 반드시 먼저 읽을 것 (session-briefing이 강제)
> - `tools/WORKFLOW.md` — 워크플로우 + 금지규칙 + 도구 실행법
> - `tools/PUBLISHING_CLAUDE_TEMPLATE.md` — 150개 퍼블리싱 규칙

---

## 프로젝트 정보

- **프로젝트명**: `<PROJECT_NAME>` *(마스터 템플릿 — 신규 프로젝트 clone 시 교체)*
- **프로젝트 형태**: `<Landing | Brand>` *(theme/design/template/ 에 subNN/ 존재 시 Brand. 자세한 건 .claude/PROJECT_TYPES.md)*
- **캔버스 크기**: 1905 (÷1920 금지!)
- **로컬 서버**: `php -d short_open_tag=On -S localhost:8080`
- **DB**: `<DB_NAME>` (mysql root / `<PASSWORD or empty>`)
- **반응형**: `@media (max-width: 599px)`
- **PSD 파일**: `/psd/` 하위 (`<PROJECT>_원본.psd` 등)
- **PSD 파서**: `node tools/psd_parser.js <PSD경로> <출력JSON경로>`
- **PSD stroke guard**: `node scripts/psd-stroke-guard.js --psd <PSD경로> --parsed <parsed.json> --write --strict` / `node scripts/psd-stroke-guard.js --psd <PSD경로> --spec <spec.json> --write --strict`
- **구조 shadow 추론**: `node scripts/structure-shadow.js --spec <spec.json> --plan <plan.json> --image-analysis <image-analysis.json> --out <structure-shadow.json> [--reference-image <시안crop>]`

## 디자인 토큰 (header.css :root)

```
--mc: #043915 (메인 녹색)
--sc: #2d2a26 (어두운 브라운)
--fc: #f2fff3 (밝은 민트 배경)
--mf: Pretendard
```

## 페이지 라우팅

| 페이지 | URL | CSS/JS |
|--------|-----|--------|
| 메인 | / | style.css / script.js |
| 브랜드 | /bbs/content.php?co_id=brand | brand.css / brand.js |
| 매장안내 | /bbs/content.php?co_id=shop | shop.css / shop.js |
| 비상주사무실 | /bbs/content.php?co_id=virtualoffice | virtualoffice.css / virtualoffice.js |
| 창업안내 | /bbs/content.php?co_id=franchise | franchise.css / franchise.js |
| 커뮤니티 | /bbs/content.php?co_id=community | coummunity.css / coummunity.js |

## section 공통 CSS (style.css)

```css
section { overflow:hidden; display:flex; justify-content:center; align-items:center; width:100%; flex-direction:column; }
```
→ rltv 자식에 margin-left로 좌측 정렬하려면 `align-self:flex-start` 필수
→ `section` 자체에 `aspect-ratio` 넣지 말 것. 높이 제어가 필요하면 내부 `rltv` wrapper에만 사용하고, 모바일 대응은 section padding/margin 구조로 처리할 것.
→ bg/texture/smoke/deco는 절대 `rltv`/heightChain source로 잡지 말 것. 실제 카피 묶음, 패널 내부 live content처럼 세로 흐름이 있는 콘텐츠만 `rltv`로 잡을 것.

## 외부 연동

- **Notion API Key**: <NOTION_API_KEY>
- **Notion 프로젝트 DB**: <NOTION_DB_ID>
- **Figma token**: <FIGMA_TOKEN>

## 강제 검증 워크플로우 (전 단계 필수 — 스킵 시 작업 무효)

### 절대 금지
```
❌ 도구 소스코드(tools/*.js) 읽기 금지 — 실행만 할 것
❌ 수치 암산 금지 — 모든 계산은 node -e로만
❌ 둥근수(5vw, 10%, 15vw 등) 사용 시 PSD 정확값인지 반드시 재확인
❌ PSD 텍스트 줄바꿈/정렬 임의 변경 금지 — spec segments 그대로
❌ leaf 텍스트 자동 줄바꿈 금지 — 기본 `white-space:nowrap` 유지
❌ 여러 줄 텍스트는 `<br>`로만 줄바꿈 — 모바일 포함 `br` 숨김/자동 개행 금지
❌ spec-to-plan 없이 plan.json 수작업 금지
❌ lineHeight ≥ 2.0인 텍스트를 <br>로 한 행에 합치기 금지 — lineHeight × fontSize ≈ 행 높이이면 별개 행으로 분리 (예: lh 2.611 × 18px = 47px = 테이블 행 높이 → 각 줄이 독립 행)
```

### 섹션 작업 순서 (각 단계 통과 없이 다음 진입 금지)

```bash
# ── STEP 0: 데이터 추출 (병렬) ──
# 0) parsed.json 생성 직후 border/stroke 누락 보정 (필수)
node scripts/psd-stroke-guard.js --psd <PSD경로> --parsed <parsed.json> --write --strict

# A) spec 추출
node tools/section-finder.js <parsed.json> <섹션번호>
node tools/psd-to-spec.js <parsed.json> <그룹명> <출력경로>

# A-1) spec.json border/stroke 누락 보정 (필수)
node scripts/psd-stroke-guard.js --psd <PSD경로> --spec <spec.json> --write --strict

# B) 이미지 분석
node tools/image-analyzer.js images/<폴더> --prefix <conXX> --out .planning/<dir>/image-analysis.json

# B-1) 구조 shadow 추론 (권장 — shadow mode, hard fail 아님)
# spec와 시안 이미지를 함께 보고 panel ownership / clipsChildren / outerOffsetTop / innerOffsetTop 후보를 출력
# --reference-image 생략 시 spec 폴더 옆 reference.png / design-reference.png / section-reference.png / reference-render.png 자동 탐색
node scripts/structure-shadow.js --spec <spec.json> --plan <plan.json> --image-analysis .planning/<dir>/image-analysis.json --out .planning/<dir>/structure-shadow.json [--reference-image <시안crop>]

# C) 캔버스 검증 (spec canvas ≠ 1905이면 즉시 패치)
node -e "const j=require('<spec.json>');if(j.canvas!==1905){j.canvas=1905;require('fs').writeFileSync('<spec.json>',JSON.stringify(j,null,2));console.log('PATCHED');}else console.log('OK');"

# D) fontFamily 전수 확인 → font-mapping.json 저장 (mapping 비어있으면 안 됨)
node -e "const j=require('<spec.json>');const m=new Map();j.texts.forEach(t=>(t.segments||[]).forEach(s=>{const f=s.fontFamily||'?';m.set(f,(m.get(f)||0)+1)}));[...m].sort((a,b)=>b[1]-a[1]).forEach(([f,c])=>console.log(c+'x',f))"
# → {"verified":true,"mapping":{"PSD폰트":"CSS font-family"}} 형식으로 저장

# E) 이전 섹션 plan.json 참조 (같은 프로젝트 완성 plan 패턴 확인)

# ── STEP 0.5: harness-prep 마킹 ──
node tools/workflow-enforce.js harness-prep --section <conXX> --page <page>
# → spec 파일 없으면 차단됨

# ── STEP 1: plan.json 작성 ──
# 반드시 spec-to-plan으로 초안 생성 후 AI 보정
node tools/spec-to-plan.js <spec.json> --page <page> --prev auto --out <plan.json>
# → structure-shadow.json이 있으면 panel ownership / ov hid / pt 분리 후보를 먼저 검토
# → plan-checker 🟢 통과 필수
node tools/plan-checker.js <plan.json>

# ── STEP 2: ASCII + 유저 컨펌 ──
# plan.json의 ascii 필드에 실제 다이어그램 작성 (TODO이면 approve 불가)
# ASCII + 수치표를 유저에게 보여주고 승인
node tools/workflow-enforce.js approve --section <conXX> --page <page>
# → plan-checker 미통과 시 차단
# → ascii 필드 없으면 차단
# → plan 수정 후 재승인 필요 (timestamp 검증)

# ── STEP 3: 코딩 ──
# CSS 작성 후 금지규칙 검증
node tools/harness.js --step 4 --page <page> --css <css파일>
# → 둥근수 의심값이 있으면 node -e로 재계산

# ── STEP 4: 최종 검증 ──
node tools/harness.js --psd <parsed.json> --section <conXX> --page <page> --selector "<selector>" --summary
# → 🟢 ALL CLEAR 필수
```

## 주의사항

1. content.php 페이지: `.container { width:1200px }` 래퍼 → 페이지 CSS에서 `display:none !important`
2. `flexrow` 클래스 쓰면 `width:100%` 강제됨 → 직접 flex 스타일 작성
3. PSD 회색 배경 = "콘텐츠 있음" 표시일 뿐, 실제 배경색 아님
4. force push 주의 — 기존 파일 날아간 사고 이력 있음
