# 퍼블리싱 워크플로우

> 이 파일은 모든 프로젝트에서 공통으로 사용하는 워크플로우입니다.
> 세션 시작 시 반드시 읽어야 합니다. (session-briefing이 강제)
>
> 강제 경로:
> - Claude: `.claude/settings.json` + `.claude/hooks/*.js`
> - Codex: 루트 `AGENTS.md`
> - 워크플로우 수정 시 `AGENTS.md`, `CLAUDE.md`, `tools/WORKFLOW.md` 동시 업데이트

## 공통 상태 마킹 (Claude/Codex 공용)

```
유저 승인 완료:
  node tools/workflow-enforce.js approve --section <conXX> --page <page>

harness step 1~2 완료:
  node tools/workflow-enforce.js harness-prep --section <conXX> --page <page>

full harness ALL CLEAR 후 verified 상태 확인:
  node tools/workflow-enforce.js status --section <conXX> --page <page>

상태 확인:
  node tools/workflow-enforce.js status --section <conXX> --page <page>
```

- `verified`는 full harness가 `🟢 ALL CLEAR`면 자동 저장된다.

---

## 워크플로우 (섹션 1개)

```
STEP -1. 규칙 암기 (필수 — 스킵 금지)
  → tools/PUBLISHING_CLAUDE_TEMPLATE.md 전체 읽기
  → tools/WORKFLOW.md 전체 읽기
  → CLAUDE.md 전체 읽기
  → 세 파일에서 추출한 규칙을 전부 나열 (번호 매겨서)
  → 나열 완료 후에만 STEP 0 진행 가능
  → "이미 읽었다", "알고 있다" 등의 생략 불가 — 반드시 출력

STEP 0. 준비 — 데이터 추출 + 이미지 분석 (병렬)
  ① 디자인 시안(이미지) 먼저 Read로 열어서 전체 레이아웃 파악
  ② 기존 CSS/HTML 있는지 확인 (있으면 덮어쓰기 금지)
  ③ parsed.json 생성 직후 stroke/border guard 실행 (필수 — 스킵 금지)
     node scripts/psd-stroke-guard.js --psd <PSD경로> --parsed <parsed.json> --write --strict
     - PSD vector stroke/tagged block에 값이 있는데 parsed.json에서 빠진 경우 자동 보강
     - solid stroke로 확정 못 하면 strict 모드에서 즉시 실패시켜 silent omission 금지
  ④ 데이터 추출 (아래 2개 동시 실행 — 순서 바뀌면 안 됨)
     A) section-finder → psd-to-spec → spec.json
        node tools/section-finder.js <parsed.json> <섹션번호>
        node tools/psd-to-spec.js <parsed.json> <그룹명> <출력경로>
        node scripts/psd-stroke-guard.js --psd <PSD경로> --spec <spec.json> --write --strict
        ⚠️ spec.json도 guard 필수. parsed → spec 전달 과정에서 stroke detail이 비면 여기서 다시 보강
        ⚠️ 캔버스 검증 (필수 — 스킵 금지):
           spec.json의 canvas 값과 CLAUDE.md의 캔버스 크기 비교
           불일치 시 spec.json의 canvas를 CLAUDE.md 값으로 즉시 패치
           → node -e "const fs=require('fs');const p='<spec.json>';const j=JSON.parse(fs.readFileSync(p));j.canvas=<CLAUDE.md캔버스>;fs.writeFileSync(p,JSON.stringify(j,null,2))"
     B) image-analyzer → image-analysis.json
        node tools/image-analyzer.js images/<폴더> --prefix <conXX> --out .planning/<dir>/image-analysis.json
     ⚠️ A와 B는 독립적이라 병렬 가능. 단, 둘 다 STEP 1 전에 완료 필수
  ④-1 structure-shadow 실행 (권장 — shadow mode, hard fail 아님)
     node scripts/structure-shadow.js --spec <spec.json> --plan .planning/<dir>/plan.json --image-analysis .planning/<dir>/image-analysis.json --out .planning/<dir>/structure-shadow.json [--reference-image <시안crop>]
     - 목적: panel ownership / clipsChildren / outerOffsetTop / innerOffsetTop 후보를 자동 제안
     - design screenshot crop이나 section reference 이미지가 있으면 함께 사용한다
     - `--reference-image`를 생략하면 spec 폴더 옆 `reference.png`, `design-reference.png`, `section-reference.png`, `reference-render.png`를 자동 탐색
     - 현재는 shadow mode다. 결과가 이상해도 workflow를 block하지 않고, ASCII/plan 보정 참고용으로만 쓴다
  ⑤ 이미지 Read로 열어서 완성형/소스 판단
  ⑥ section 공통 CSS 확인 (style.css의 section flex 등)
  ⑦ "하지 마라" 목록 정리
  ⑧ 텍스트 fontFamily 전수 확인 (필수 — 스킵 금지):
     spec.json의 모든 텍스트 segments에서 fontFamily를 추출하고
     CLAUDE.md 디자인 토큰(--mf, --sf, --tf, --ff 등)과 매핑 확인
     → node -e "const j=require('<spec.json>');const m=new Map();j.texts.forEach(t=>(t.segments||[]).forEach(s=>{const f=s.fontFamily||'?';m.set(f,(m.get(f)||0)+1)}));[...m].sort((a,b)=>b[1]-a[1]).forEach(([f,c])=>console.log(c+'x',f))"
     출력 예: "12x SUIT-Regular, 3x ImcreSoojinOTFRegular, 2x YPairingFontOTF-Bd"
     → 각 PSD fontFamily가 어떤 CSS 토큰/font-face에 매핑되는지 표로 정리
     → 매핑 안 되는 폰트가 있으면 @font-face 존재 여부 확인
     → 이 매핑표를 plan.json 작성 시 참조 (추측 금지)

STEP 1. plan.json 작성 (spec-to-plan 플랫 데이터 기반 + AI 구조 판단)
  ① spec-to-plan 실행 → 플랫 데이터 추출
     node tools/spec-to-plan.js <spec.json> --page <페이지> --prev auto --out .planning/<dir>/plan.json
     → 출력: 플랫 요소 리스트 + 겹침 관계 + 세로 흐름 힌트 + pt/pb 참고값
     → rltv/absol 판단 없음 — AI가 결정
  ①-1 structure-shadow.json이 있으면 먼저 검토
     - panel candidate confidence가 높고 ownedNodes / clipsChildren가 명확하면 그 신호를 우선 검토
     - 특히 `panel-ownership-mismatch`, `clip-missing`, `combined-top-offset` 경고는 ASCII 승인 전에 정리
     - 단, 현재는 자동 강제가 아니다. 시안과 모순되면 shadow 결과를 버린다
  ② 시안 이미지 Read로 다시 확인 (STEP 0에서 이미 봤더라도 반드시 재확인)
  ③ 이전 섹션 plan 참조 (비슷한 구조면 패턴 복사)
     → 같은 프로젝트의 완성된 plan.json을 Read로 열어서 구조 참고
  ④ AI 구조 결정 (시안 기반, 30초 이내)
     - 시안 보고 rltv/absol 결정 (도구 출력 그대로 따르지 말 것)
     - 세로 흐름 텍스트/이미지 → rltv (heightChain)
     - 겹치는 요소/배경/장식 → absol (deco wrapper)
     - `section` 자체에는 `aspect-ratio`를 넣지 않는다. 높이 고정이 필요하면 내부 `rltv` stage/wrapper에만 제한적으로 사용하고, section 높이는 padding/margin/heightChain으로 유지한다.
     - centeredFlow 힌트 참고 (but 시안이 최우선)
     - centerAxisHints 힌트 참고: 부모 기준 중앙축 반복은 자식 margin-left가 아니라 부모 centerChildren/align-items:center
     - swiperHints 힌트 참고: 완성형 이미지 반복열이 양옆 일부 잘림/캐러셀 징후를 보이면 Swiper 후보로 본다. 단, 강제 확정하지 말고 유저에게 최종 확인
     - containmentHints 힌트 참고: 작은 badge/marker/callout이 chart/map/image 내부에 있으면 형제 배치가 아니라 해당 요소의 children으로 중첩
     - requiredTextHints 힌트 참고: 완성형 이미지 내부가 아닌 유의미한 PSD 텍스트는 반드시 plan text element로 넣거나 ignoredTexts에 근거를 남긴다
     - stackCardHints 힌트 참고: 반복 카드 stack archetype이면 카드별 wrapper, stage crop, desktop interaction 여부를 plan에서 먼저 확정
     - manualDataHints 힌트 참고: 넓은 smart-object 카드열 + 카드 1세트 라이브 텍스트만 남은 경우 자동 추출이 전부가 아니다. 반복 카드/Swiper와 나머지 데이터는 수동 입력 가능성을 먼저 검토
     - containment 판단은 이름만 보지 말고 같은 부모/완전 포함/면적비/완성형 asset/배경·패널 제외 조건을 함께 볼 것
     - overlaps 참고하여 wrapper 구조 결정
     - pt/pb: ptSuggestions 참고하되 시안 기반 최종 결정
     - 이미지 TODO 매칭: availableImages 크기 비교 + 이미지 직접 Read
  ⑤ plan.json 최종 작성
     - heightChain 작성 (pt → rltv요소들 → pb)
     - doNot 제약 작성
     - sectionClass 지정
  ⑥ plan-advisor 실행 (advisory only, block 안 함 — 구조 개선 후보 노출)
     node tools/plan-advisor.js .planning/<dir>/plan.json
     → 출력: flat 안티패턴 / parentWidth 1905 강제 / heightChain TODO / aspectRatio 미사용 / absol 과다 / margin-left 중앙정렬 / _hint 무시
     → AI는 advisor 출력 + element._hint 보고 plan 보정 후 plan-checker 재실행
     → element._hint 필드 (spec-to-plan이 자동 주입):
       · psdGroup / psdGroupBbox / suggestedParentWidth / aspectRatioSuggest / siblings (그룹화)
       · centerSuspect / axisDelta / axisAdvice (margin-left 중앙정렬 의심)
       · heightChainCandidate / rltvCandidate / verticalStackPos (rltv heightChain)
       · containmentParent / containmentAdvice (자식 중첩)
       · parentWidthSuspect (1905 강제 회피)
  ⑦ plan-checker 🟢 통과 필수
     node tools/plan-checker.js <plan.json>
  ⚠️ 30초 넘게 고민하면 → 멈추고 다른 방법 시도하거나 유저에게 질문
  ⚠️ 도구 출력 디버깅 금지 — 틀리면 무시하고 시안 기반으로 직접 판단
  ⚠️ element._hint는 advisory다. AI가 시안 기준으로 무시 가능. 단 무시 시 advisor가 경고함

STEP 2. 유저 컨펌 (ASCII 필수)
  → plan-checker 🟢 통과 후에만 구조트리 + 수치표 + ASCII 3종세트
  → "plan-checker 🟢 통과 완료. ASCII 작성 시작합니다." 출력 필수
  → 유저 승인 후에만 코딩 시작
  → plan-checker 🟢 ≠ 유저 컨펌. 유저 컨펌 없이 코딩 = 절대 금지

STEP 3. 코딩 (CSS 자동생성 + HTML 직접 + CSS 보정)
  ① plan-to-css → CSS 초안
     node tools/plan-to-css.js <plan.json> --out /tmp/<section>.css
  ② HTML: AI가 직접 작성 (plan.json 구조 기반)
  ③ CSS: plan-to-css 초안 위에 보정만 (수치 수정 금지, 형식만)
     - 부모 기준 중앙축은 centerChildren/alignSelf:center 구조를 유지하고, 자식별 margin-left 중앙정렬로 되돌리지 말 것
     - bg/texture/smoke/deco와 baked 배경 이미지는 absol 레이어로 둔다. 실제 live text/content 묶음이나 분리된 패널 내부 콘텐츠만 rltv heightChain에 참여시킬 것
  → 매 Edit마다 hook 자동 검증 (css-check + plan-gate)

STEP 4. 검증
  → harness 전체 파이프라인 실행 (step 1~6)
     node tools/harness.js --psd <parsed.json> --section <conXX> --page <page>
  → Playwright 스크린샷 → 디자인 시안과 비교
  → 🟢 ALL CLEAR 필수

STEP 4.5. replay/visual-origin 보정 (필요할 때만)
  → raw spec가 visible origin과 다르거나, replay 구조가 raw PSD group bbox와 다르면 replay 검증용 visual spec 생성
     node tools/plan-to-visual-spec.js .planning/<dir>/plan.json --out .planning/<dir>/spec_visual.json
  → 그 다음 harness/position-checker는 spec_visual.json 기준으로 실행
  → visual spec는 raw PSD를 버리는 게 아니라 replay 검증 기준만 분리하는 것

STEP 4.8. 답안 비교 (완료 후 사후 점검)
  → 원본 섹션이 있을 때만 replay와 구조 비교
     node tools/replay-structure-audit.js http://localhost:8080/ --all-main-replays --json > /tmp/replay_audit.json
  → 답안에 `pb spacer`, leaf 텍스트 `width` 고정, `margin-left` 중심 정렬, fake-height wrapper 같은 반패턴이 있으면 학습 금지
  → 답안 비교는 "더 강한 구조를 발견했는가"만 본다. strict workflow보다 답안이 약하면 답안을 버린다.
```

## 자동 강제 (hooks — settings.json)

```
SessionStart → session-briefing.js (환경/도구/모듈 자동설치/하네스 검증)
PostToolUse Edit/Write:
  → css-check.js → CSS 금지규칙 (위반 시 block)
  → plan-gate.js → plan-checker (plan 미통과 시 block)
  → confirm-gate.js → 유저 컨펌 없으면 block
  → workflow-gate.js → STEP 0 미완료 시 block
  → plan-format-gate.js → spec-to-plan 미사용 시 block
  → tool-read-gate.js → 도구 소스코드 읽기 방지
```

## 하네스 파이프라인 (harness.js)

```
STEP 1:   spec 추출 (psd-to-spec.js)
STEP 1.5: spec ↔ PSD raw 크로스체크
STEP 2:   이미지 전수 분석 + image-analyzer.js (border/shadow/완성형 자동 감지)
STEP 3:   auto-css (spec + structure → CSS)
STEP 4:   CSS 금지규칙 검증 ← hook이 매 Edit마다 자동 실행
STEP 4.5: 이미지 HTML 사용 확인
STEP 5:   Playwright 이미지=원본 검증
STEP 5.5: position-checker 좌표 대조
STEP 5.7: 렌더링 스타일 vs spec 대조
STEP 6:   스크린샷 캡처
```

## 빠른 검증 모드 (정확도 유지용)

```
개발 중 빠른 루프:
node tools/harness.js --psd <parsed.json> --section <conXX> --page <page> --selector <현재섹션셀렉터> --fast --summary --budget-sec 600

최종 완료:
node tools/harness.js --psd <parsed.json> --section <conXX> --page <page> --selector <현재섹션셀렉터> --summary --timings --budget-sec 600

외부 PSD replay / visual-origin 보정:
node tools/harness.js --section <검증명> --page <page> --selector <현재섹션셀렉터> --spec <visual-spec.json> --css <css파일> --image-dir <이미지폴더> --image-prefix <이미지prefix> --summary --timings --budget-sec 600
```

- `--fast`는 현재 섹션 작업 중 피드백 전용이다. `FAST PASS`는 완료가 아니며, 최종 선언은 full harness의 `🟢 ALL CLEAR`만 인정한다.
- `--summary`는 검증을 줄이지 않고 로그만 요약한다. FAIL은 즉시 출력하고 WARN/PASS는 최종 요약으로 보며, position-checker JSON 모드도 WARN≥6 FAIL 정책을 동일하게 적용한다.
- `--budget-sec 600`은 섹션당 10분 목표 계측이다. 초과해도 검증을 생략하지 말고 `TIMINGS` 상위 병목부터 workflow 개선 대상으로 올린다.
- Swiper 검증은 현재 selector HTML 안에 `.swiper`가 있을 때만 브라우저를 띄운다. Swiper가 없는 섹션은 full harness에서도 즉시 스킵해 정확도 손실 없이 약 4초 병목을 제거한다.
- `--fast`는 PSD/spec와 이미지 파일이 바뀌지 않은 경우에만 캐시를 허용하고, 최종 full harness는 항상 새 추출/전수 분석/스크린샷을 실행한다.
- 현재 섹션 selector를 반드시 넘겨 전역/레거시 WARN과 현재 섹션 FAIL을 분리한다.
- 외부 프로젝트 PSD나 overlap group replay처럼 raw PSD 그룹 top과 실제 visible section origin이 다르면 raw spec를 억지로 맞추지 말고 `--spec`로 visual-origin spec를 명시한다. 이때 `--image-dir`, `--image-prefix`, `--css`도 같이 넘겨 이미지/CSS 자동 추정이 기존 섹션 자산을 잘못 잡지 않게 한다.
- `plan-to-visual-spec`는 replay 검증 spec를 plan 기준으로 만든다. 이때 rltv group 높이는 absol overlay가 아니라 flow 자식(panel/title 등) 기준으로 잡는다.
- `sectionY.bottom`과 `effectiveEnd`/full-width bgRect bottom이 크게 다르면 레이어 max bottom을 pb로 쓰지 않는다. smoke/background overhang은 섹션 높이가 아니라 overflow/crop/음수 margin-bottom 후보로 보고, 그래도 max bottom을 써야 하면 `sectionBottomReason`에 PSD 근거를 남긴다.
- pb는 `pbSuggestions.fromLastContent`와 `pbSuggestions.fromLastContentToEffectiveEnd`를 같이 본다. 두 값이 크게 다르면 `effectiveEnd` 쪽을 우선하고, 마지막 콘텐츠가 넓다는 이유만으로 제외하지 않는다.
- 완성형 이미지 내부 텍스트/TODO 레이어는 DOM 텍스트 재조립을 요구하지 않는다. 대신 이미지 밖 실제 텍스트는 계속 검증한다.
- panel/card JPG 위에 raw PSD상 별도 제목/설명 텍스트가 존재하면 그 이미지를 complete image로 오판하지 않는다. 이 경우 panel은 source 배경이고, 텍스트는 HTML로 구현한다.
- `image-analyzer`의 `panelLike`는 source panel 후보를 뜻하는 보조 힌트일 뿐, 단독 판정 기준이 아니다. 반드시 raw text/rect/family 반복과 함께 본다.
- `structure-shadow`는 geometry + optional reference image를 합친 shadow-mode 추천기다. panel ownership / `overflow:hidden` / outer-inner top 분리 같은 구조 판단을 도와주지만, 아직 hard fail 기준은 아니다.
- design screenshot이 있으면 `structure-shadow`에 넣어라. 단일 bbox 규칙보다 실제 시안의 panel 경계/내부 평탄색/외곽 대비를 같이 보므로 오판이 줄어든다.
- `structure-shadow`가 panel-owned-flow를 강하게 추천하는데 plan에서 panel을 absol deco로만 두면, 코드 단계에서 `pt` 과대/`overflow:hidden` 누락/width 축소 같은 후행 수정 비용이 커진다.
- `stackCardHints.cards[*].bodyTexts`가 2개 이상이면 그 카드는 `sourcePanelPreferred`로 본다. 이 경우 패널 JPG를 완성형으로 덮지 말고 카드 wrapper 안에 live text/body를 먼저 세운다.
- 같은 박스 안에 ring/circle/badge asset이 2~3개 겹쳐 있으면 baked-in을 추정하지 않는다. 실제 export 이미지를 열어 확인하기 전까지는 `ignoredAssets`로 보내지 말고 DOM 배치 후보로 둔다.
- `stage/sales/wrap/inner` 같은 범용 래퍼가 의미 없는 `padding-bottom`만으로 높이를 만들면 구조 실패로 본다. `panel/card/bg/deco`처럼 실제 시각 박스가 있는 경우만 허용한다.
- bg/paper/texture/deco는 절대 rltv heightChain source로 잡지 않는다. baked 패널/카드 배경도 absol로 두고, 그 안의 live text/content wrapper만 rltv로 세운다. 부모 padding-bottom + absol bg 조합으로 높이만 속이면 plan-checker에서 실패한다.
- `section` 태그 자체를 full-scene wrapper처럼 써서 `aspect-ratio`로 높이를 고정하지 않는다. 모바일 변경 비용이 커지므로 section은 흐름 컨테이너로 두고, 꼭 필요할 때만 내부 `rltv` wrapper에 `aspectRatio`를 둔다.
- rltv heightChain wrapper가 내부를 absol로 배치해야 하는 full-scene 구조라면 `aspectRatio` 또는 `heightSource`를 plan에 명시한다. strictStructure plan에서는 높이 근거 없는 absol-only rltv wrapper를 실패 처리한다.
- 이미지 asset이 있으면 텍스트/CSS 재구현으로 대체한 게 아닌 이상 반드시 plan element와 HTML에서 사용한다. 중간 composite/mask 조각처럼 정말 쓰면 안 되는 asset만 `ignoredAssets: [{file, reason}]`에 PSD 근거를 남긴다.
- `spec.images[].possibleFile === "TODO"`인데 visually important한 raster면 추정하지 말고 PSD layer export를 먼저 시도한다. `node tools/extract-psd-layer.js psd/<PROJECT>_원본.psd "con09 > 레이어 33" images/con09_05.png`처럼 꺼낸 뒤, plan에는 `ignoredAssets: [{ name: "레이어 33", file: "images/con09_05.png", reason: "PSD raster exported via extract-psd-layer" }]`로 연결하고 실제 DOM에는 export된 PNG를 쓴다.
- `requiredTextHints`가 나온 텍스트는 plan에서 사라지면 안 된다. split segment는 자유지만 줄바꿈은 spec lineBreaks와 `<br>` 기준만 허용한다. 자동 개행으로 재해석하지 말고, 실제 텍스트 요소 또는 `ignoredTexts` 근거가 필요하다.
- `requiredTextHints`에 `cardIndex`/`hintRole(body|overlay)`가 붙어 있으면 카드별 누락 경고로 읽는다. 수정도 카드 단위로 처리해 body/overlay를 함께 맞춘다.
- 넓은 rect/deco strip와 거의 같은 bbox의 complete image asset이 함께 있으면 rect를 기계적으로 추가하지 않는다. 먼저 이미지 안에 fill/strip이 baked-in 됐는지 확인하고, baked-in이면 `ignoredShapes`에 근거를 남긴다.
- 이미지가 아닌 얇은 rect/shape 라인도 PSD 요소다. `requiredShapeHints`가 나온 라인은 CSS shape/deco element로 구현하거나, 완성형 이미지 내부/중간 마스크 등 진짜 제외 사유를 `ignoredShapes: [{name, reason}]`에 남긴다. 단순 thin 판정만으로 강제하지 말고 완성형 이미지 내부 여부와 배경 대비를 함께 본다.
- `requiredShapeHints`가 좌우 대칭 라인의 한쪽만 잡았더라도 끝내지 말고, STEP 0에서 spec rect를 다시 훑어 반대편 thin line이 있는지 수동 대조한다. 특히 섹션 양끝 세로 보더는 left/right를 한 쌍으로 본다.
- 같은 1개 PNG를 좌우/상하에 재사용하는 경우 spec 자동매칭이 첫 번째 PSD image에 붙어 x/y 대조가 틀어질 수 있다. 이때는 `specImageName`으로 각 위치의 PSD image name을 명시해 매칭 충돌을 막는다.
- `image-analyzer`나 spec 대조에서 naturalWidth가 PSD body/image보다 10px 이상 크고 dropShadow가 잡히면 shadow baked-in으로 본다. 이 경우 plan/CSS에 box-shadow를 추가하지 않는다.
- 부모 기준 중앙 정렬 요소를 자식별 `margin-left`로 맞추지 않는다. 부모에 `display:flex`, `flex-direction:column`, `align-items:center` 또는 적절한 `justify-content:center`를 둔다.
- 답안 비교는 구조 강화용 사후 점검으로만 쓴다. 답안에 `pb spacer`, leaf 텍스트 `width` 고정, `margin-left` 중심 정렬, fake-height wrapper 같은 반패턴이 있으면 따라 배우지 않는다. 이 경우 답안보다 현재 strict workflow 결과를 우선한다.
- 큰 chart/map/image 내부에 작은 badge/marker/callout이 완전히 들어가면 의미상 parent-child로 묶는다. 단순 겹침이나 이름 1개가 아니라 containment + 이름/역할 + 면적비 + 완성형 asset + bg/panel/table 제외 조건을 함께 보고 판단한다.
- `spec-to-plan`의 `swiperHints`는 반복 complete image row + edge clipping 등으로 만든 비강제 힌트다. Swiper 자동 확정 규칙으로 쓰지 말고, ASCII/계획 설명에서 “Swiper 후보”로 보여준 뒤 유저에게 최종 확인받는다.
- 반복 raster/photo row가 있고 PSD 메모/텍스트 레이어에 URL 목록이 들어 있으면, 추정 링크를 만들지 말고 그 URL을 slide anchor `href`에 직접 연결한다. 링크형 피드/릴스 strip은 `swiperConfig.mode:"strip"`으로 명시해 centered active-card 검증과 분리한다.
- strip형 Swiper는 카드 캐러셀과 다르다. `centeredSlides`, active scale, nav 버튼을 기본 강제하지 말고, slide width/gap/링크/PSD 좌표를 우선 검증한다.
- `spec-to-plan`의 `containmentHints`가 parent/child 후보를 제시했는데 plan에서 같은 flat parent 형제로 남아 있으면 strictStructure plan은 실패한다. 정말 형제로 둬야 하는 예외는 `allowLayered:true` 또는 `allowSiblingOverlay:true`에 근거를 남긴다.
- `spec-to-plan`의 `stackCardHints`가 나오면 세로 카드 스택 archetype 후보로 본다. 이 경우 카드별 wrapper, overflow-hidden stage, desktop interaction 여부를 초기에 정하지 않으면 나중에 JS/CSS를 같이 뜯게 된다.
- `gsap-pin-stack`을 선택했는데 `stackCardHints.cards.length`만큼의 wrapper/stage children 구조가 없으면 구조가 평평해지고 수정비용이 커진다. plan-checker에서 먼저 실패시키는 기준으로 본다.
- `aspectRatio` full-scene wrapper 하나에 내용 요소를 전부 `absol`로 넣지 않는다. 모바일에서 싸게 바꾸려면 제목/문구/주요 이미지는 `rltv` heightChain으로 분리하고, 배경/연기/금박/사이드 장식만 `absol` deco layer에 둔다. 정말 full-scene overlay가 필요한 예외는 `allowSingleSceneOverlayReason`에 근거를 남긴다.
- 중앙축 요소는 부모 `centerChildren:true` 또는 `alignSelf:"center"`를 우선한다. 단, 완성형 이미지 bbox가 PSD에서 몇 px 어긋나 순수 center 정렬이 PSD 위치를 깨는 경우에만 `allowManualCenter:true`와 `psdExactReason`을 같이 명시한다.

## 핵심 원칙

```
서브에이전트 사용 금지 — 메인 세션이 직접 판단 + 계산 + 코딩
계산 = node -e로만 (암산 금지)
검증 = hook이 자동 + harness 전체 파이프라인 + Playwright
thinking 30초 초과 → 멈추고 다른 방법 or 유저에게 질문
시안 이미지가 최우선 — 도구 출력은 수치 참고용일 뿐
도구 출력 디버깅 금지 — 틀리면 무시하고 직접 판단
이전 섹션 plan 참조 필수 — 비슷한 구조면 패턴 복사
```

## STEP 0 체크리스트

```
★ STEP 0 수동 확인 (자동화 불가 — 반드시 직접)
□ 디자인 시안 이미지 먼저 확인 (PSD 좌표만 보고 작업 금지)
□ 기존 CSS/HTML 존재 여부 확인 (있으면 덮어쓰기 금지)
□ section 공통 CSS 확인 (style.css — display:flex, align-items:center 등)
□ 이미지: 완성형이면 "img만 배치", 소스면 "HTML 구조 필요"
□ 그래프/세로라인: height:999vw + overflow:hidden 패턴 확인
□ composite 이미지 효과 중복 금지
□ 색상 대비 확인: 요소 색상과 배경 색상이 같으면 안 보임
□ 좌우 외곽 thin line/보더는 한쪽 힌트만 나와도 반대편까지 수동 대칭 확인
□ parsed/spec 생성 직후 `psd-stroke-guard` 실행 여부 확인 (stroke silent omission 금지)
□ ★ 캔버스 검증: spec.json canvas와 CLAUDE.md 캔버스 일치 확인 (불일치 → 즉시 패치)
□ ★ fontFamily 전수 확인: spec 텍스트 전체의 fontFamily 추출 → CLAUDE.md 토큰 매핑표 작성
□ ★ leaf 텍스트 `white-space:nowrap` 적용 여부 확인
□ ★ 여러 줄 텍스트는 `<br>`로만 줄바꿈했는지 확인 (`br` 숨김/자동 개행 금지)

★ STEP 0에서 자동 추출 (수작업 금지)
  ✗ 좌표 목록 수동 정리 → psd-to-spec이 자동
  ✗ 배경색 수동 확인 → spec-to-plan이 자동
  ✗ 텍스트 정보 수동 정리 → psd-to-spec이 자동
  ✗ effects 수동 정리 → psd-to-spec이 자동
  ✗ 이미지 border/shadow/radius 수동 확인 → image-analyzer가 자동
  ✗ 이미지 파일 크기 수동 확인 → spec-to-plan이 직접 스캔
  ✗ 겹침 관계 수동 계산 → spec-to-plan이 자동 (overlaps)
  ✗ 세로 흐름 수동 판단 → spec-to-plan이 힌트 제공 (centeredFlow)

★ AI가 직접 판단 (도구가 안 함)
  ○ rltv/absol 분류 → 시안 보고 AI가 결정
  ○ wrapper 구조 → overlaps + 시안 보고 AI가 결정
  ○ heightChain → rltv 결정 후 AI가 작성
  ○ pt/pb 최종값 → ptSuggestions 참고 + 시안 기반
  ○ 이미지 매칭 (TODO) → availableImages + 이미지 Read로 AI가 판단

★ STEP 1 AI 구조 판단 (시안 필수 — 안 보면 의미 없음)
□ 시안 이미지 Read로 열어서 레이아웃 확인 (필수 — 스킵 시 plan 무효)
□ 이전 섹션 plan.json Read로 열어서 패턴 참고 (필수)
□ centeredFlow/overlaps/yGaps 참고하되 시안이 최우선
□ centerAxisHints 참고: 중앙축 반복 요소는 부모 flex/align-items:center로 구조화
□ containmentHints 참고: chart/map/image 내부 overlay는 해당 부모의 children으로 중첩
□ containment는 단순 이름 매칭 금지: 같은 부모, 완전 포함, 면적비, 완성형 asset, bg/panel/table 제외 조건까지 확인
□ bg/paper/texture/deco와 baked 배경 이미지는 absol 유지. 실제 세로 흐름 콘텐츠 묶음이나 패널 내부 live content만 rltv heightChain으로 세움
□ rltv: 세로 흐름 텍스트/이미지 (시안에서 위→아래 순서)
□ absol: 배경/장식/겹치는 요소 (시안에서 뒤에 깔리는 것)
□ wrapper: 겹치는 요소 묶음 (overlaps 참고)
□ pt/pb: ptSuggestions 참고 + 시안 기반 최종 결정
□ 이미지 TODO: availableImages 크기 + 이미지 직접 Read로 확인
□ ★ 텍스트 요소의 fontFamily: STEP 0 매핑표 참조 (추측 금지 — 매핑표에 없으면 spec segments 재확인)
□ ★ fill이 bg색과 동일한 요소: 시안에서 border/stroke 유무 반드시 확인 (투명 단정 금지)
□ ★ 텍스트 styleRuns 분기 강제: spec segments.length ≥ 2면 plan에도 segments 모두 명시 + HTML에 strong/span 분리 (단일 fontWeight로 합치지 말 것)
□ ★ leaf 텍스트는 기본 `white-space:nowrap` 유지 (자동 줄바꿈 금지)
□ ★ 여러 줄 텍스트는 `<br>`로만 구현 (PC/모바일 공통, `br` 숨김 금지)
□ plan-checker 🟢 통과 후 ASCII 출력
```

## 금지 규칙 (CLAUDE.md 공통)

- ❌ 서브에이전트 사용 금지
- ❌ 수치 암산 금지 (node -e로만)
- ❌ "됐겠지" 판단 금지
- ❌ ÷1920 금지 — 모든 계산 ÷캔버스(CLAUDE.md에 명시)
- ❌ 캔버스 기준 % 금지 — 모든 %는 CSS 부모 요소 대비
- ❌ 이미지 크기 = 원본 파일 크기 확인 필수
- ❌ 텍스트 추측 금지 — PSD styleRuns 확인 후 작업
- ❌ line-height 어림값 금지 — PSD 정확값 사용
- ❌ letter-spacing 누락 금지
- ❌ PSD에 없는 요소 추가 금지
- ❌ Playwright 검증 생략 금지
- ❌ 유저 컨펌 없이 코드 작성 금지
- ❌ 기존 코드 확인 안 하고 덮어쓰기 금지
- ❌ 디자인 시안 안 보고 작업 금지
- ❌ thinking에서 PSD 데이터 처리 금지 — node -e로 추출/계산
- ❌ thinking 30초 초과 금지
- ❌ PSD 구조 최적화 금지 — PSD 레이어 1개 = HTML 요소 1개
- ❌ "더 나은 방법" 찾기 금지 — PSD 그대로 옮길 것
- ❌ plan-checker 🟢 없이 ASCII 출력 절대 금지
- ❌ bgimg width:100% 금지 — naturalWidth/캔버스 사용 필수
- ❌ 높이 위조 (Height-Faking) 전면 금지 — 항상 hard-fail
  - stage/scene/wrap/wrapper/inner/area/content/frame/holder/box/container/field 류 wrapper 에 aspect-ratio 박제 금지
  - 동일 wrapper 들에 height (vw/px/%) 박제 금지
  - section 태그 자체에 aspect-ratio / height 박제 금지
  - .spacer / .gap / .gutter / .space / .filler / *_pb / *_pt 같은 빈 div 로 높이 메우기 금지
  - rltv element 가 absol 자식만 가지면서 aspectRatio/heightSource/rltv-child/이미지 근거 없이 박제 금지
  - 흐름 자식 0개 + absol 자식만 있는 wrapper 에 padding-bottom 으로 높이 만들기 금지
- ✅ 섹션/wrapper 높이는 (1) pt + 자식 mt 누적 + 콘텐츠 + pb 로만 만든다.
  (2) panel/card/media/figure 처럼 시각 박스가 명확하고 plan 에 heightSource + heightSourceReason 명시한 경우에만 aspect-ratio 허용.
  (3) Swiper/video 등 라이브러리/미디어 자체가 요구하는 height 만 예외.
- ✅ 발동 위치: plan-checker.js (plan 단계) + css-check.js (코드 단계). 둘 다 strictStructure 플래그 무관 항상 강제.
- ❌ 텍스트에 white-space:nowrap 누락 금지
- ❌ 텍스트 자동 줄바꿈 금지 — leaf 텍스트는 기본 `white-space:nowrap`
- ❌ 여러 줄 텍스트를 CSS 자동 개행으로 처리 금지 — `<br>`로만 줄바꿈
- ❌ 모바일에서 `br` 숨김 금지 — PC/모바일 모두 같은 줄 구조 유지
- ❌ spec lineHeight 무시 금지 — spec 값 그대로 사용
- ❌ PSD 색상 추측 금지 — spec fill 값 사용
- ❌ plan.json 형식 모르고 작성 금지 — 기존 통과된 plan 참고 후 작성
- ❌ 색상 겹침 무시 금지 — 요소 색상과 배경 색상 대비 확인 필수
- ✅ 디자인 시안 먼저 Read로 열어서 레이아웃 파악
- ✅ 이미지 먼저 열어보고 완성형/소스 판단
- ✅ 기존 CSS/HTML 있으면 그 위에서 작업
- ✅ 유저에게 판단 필요 사항 질문

## 도구 실행법 (소스 읽지 말고 실행만)

| 도구 | 실행 |
|------|------|
| harness | `node tools/harness.js --psd <parsed.json> --section <conXX> --page <page>` |
| plan-checker | `node tools/plan-checker.js <plan.json>` |
| image-analyzer | `node tools/image-analyzer.js <경로> --prefix <conXX> --out <출력경로>` |
| section-finder | `node tools/section-finder.js <parsed.json> <섹션번호\|--list>` |
| psd-to-spec | `node tools/psd-to-spec.js <parsed.json> <섹션명> <출력경로>` |
| spec-to-plan | `node tools/spec-to-plan.js <spec.json> --page <page> --prev auto --out <plan.json> [--swiper]` |
| plan-advisor | `node tools/plan-advisor.js <plan.json>` (advisory only, block 안 함) |
| plan-to-css | `node tools/plan-to-css.js <plan.json> [--out <output.css>]` |
| psd_parser | `node tools/psd_parser.js <psd> <output>` |
| position-checker | `node tools/position-checker.js <spec.json> <url> <selector>` |
| swiper-checker | `node tools/swiper-checker.js --selector <sel> --url <url>` |
| workflow-export | `node tools/workflow-export.js <대상경로>` |
