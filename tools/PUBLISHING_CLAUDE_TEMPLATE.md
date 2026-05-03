# PSD 기반 퍼블리싱 가이드

> 이 파일은 Claude Code가 자동으로 읽습니다.
> 모든 규칙은 **강제**입니다. 예외 없음.

---

## SECTION 1: 절대 금지 (NEVER)

### CSS 속성 금지
```
❌ height        → rltv 요소에 사용 금지. (예외: video, Swiper wrapper, cssShape)
❌ px 단위       → vw 또는 % only. (예외: border, box-shadow px값)
❌ 정수 퍼센트    → 22% ❌ → 22.2047% ✅ (소수점 4자리 이상)
❌ object-fit    → 이미지 원본 비율 훼손. 사용 금지.
❌ rltv에 top/left → margin-top / margin-left 사용.
❌ absol에 margin  → top / left 사용.
❌ flex-basis     → width로 대체.
❌ scaleX/scaleY  → GSAP에서도 금지. opacity, yPercent만 사용.
❌ .spacer / 빈 div → 높이 맞추기용 빈 요소 금지. padding-bottom으로 해결.
❌ 쓸데없는 wrapper div → 자식 1개뿐인 div 금지. 구조적 이유 없으면 제거.
❌ min(Xvw, Ypx) → Xvw만 사용. min() 래퍼 전면 금지.
❌ max-width: 100% → 삭제. 이미지 업스케일 방지는 컨테이너 width로.
❌ max-width: Xpx → 삭제. (max-width: unset만 허용)
❌ 음수 margin-top → rltv 요소에 절대 금지. PSD 좌표를 rltv margin으로 억지 변환하지 말 것.
❌ absol top에 % → vw 사용. (% = 부모 높이 의존 → 높이 변하면 깨짐)
❌ ÷1920         → 모든 계산 ÷1905. 예외 없음.
```

### ★ 높이 위조 금지 (Height-Faking Ban) — 전면 hard-fail
```
❌ stage / scene / wrap / wrapper / inner / area / content / frame / holder / box / container / field
   류 흐름성 wrapper 에 aspect-ratio 박제 금지
   → CSS 도 금지, plan.json 의 element.aspectRatio 도 금지
❌ 동일 wrapper 들에 height (vw / px / %) 박제 금지
❌ section 태그 자체에 aspect-ratio 또는 height 박제 금지
❌ .spacer / .gap / .gutter / .space / .filler / .placeholder / *_pb / *_pt 같은
   "빈 div + height/padding-bottom" 패턴 금지 (= 빈 공간을 임의로 차지)
❌ 흐름 자식 0개 + absol 자식만 있는 wrapper 에 padding-bottom 으로 높이 만들기 금지
❌ rltv element 가 absol 자식만 가지면서 aspectRatio/heightSource/rltv-child/이미지 근거 없이 박제 금지

✅ 섹션/wrapper 높이는 다음 셋 중 하나로만 만든다:
   1) pt + 자식 mt 누적 + 자식 콘텐츠 height + pb  (= rltv heightChain. 기본)
   2) panel/card/media/figure 같이 시각 박스가 명확한 element 의 aspect-ratio
      (단 plan.json 에 heightSource + heightSourceReason 명시 필수)
   3) Swiper/video 등 라이브러리/미디어 자체가 요구하는 height
      (.swiper-wrapper, .swiper-slide, video 만 예외)

✅ 정말 panel/card 의 baked 배경처럼 height 가 필요하면:
   plan.json:
     "heightSource": "panel.jpg baked",
     "heightSourceReason": "PSD panel rect 800x600 + 동일 사이즈 jpg export 확인"
   CSS:
     .conXX_panel {
         /* heightSource: panel.jpg baked 800x600 */
         aspect-ratio: 800/600;
     }
   → plan-checker / css-check 모두 위 마커가 있으면 통과시킨다.

[발동 위치]
- plan-checker.js : aspectRatio / 명시적 height / spacer-요소 / section 박제 → 항상 FAIL
- css-check.js   : aspect-ratio / height / padding-bottom 박제 → block
- 두 게이트는 strictStructure 플래그와 무관하게 항상 강제된다.

[의사결정 트리 — wrapper 높이를 어떻게 잡지?]
1) 안에 rltv 자식이 1개라도 있나? → mt 누적이 곧 높이. 박제 금지.
2) 자식이 전부 absol 인가? → 십중팔구 자식 중 1개를 rltv 로 승격해야 한다.
   정말 deco overlay only 면 부모도 흐름에서 빠진 absol-deco 로 둔다.
3) 정말 panel/card/media 박스인가? → aspect-ratio 허용.
   plan 에 heightSource + heightSourceReason 명시.
4) 위 어디에도 안 맞으면 → 멈추고 유저에게 질문.

[한 줄 룰]
높이는 만드는 게 아니라, 콘텐츠가 차지한 결과로 나오는 것이다.
```


### 이미지 화질 금지
```
❌ 이미지 컨테이너 width를 PSD spec 기준으로 잡기
  → 반드시 이미지 원본 파일 크기(naturalWidth) / 1905 × 100 으로 계산
  → 렌더링 = 원본 정확 일치 → 스케일링 0 → 뭉개짐 0
❌ 이미지 크기 확인 안 하고 배치
  → sips -g pixelWidth/Height 로 원본 크기 확인 필수
❌ 소수점 정밀도 부족
  → 최소 6자리 (예: 35.643045vw) — 0.02px 오차도 뭉개짐 유발
```

### 작업 방식 금지
```
❌ 수치표 없이 코딩 시작
❌ 추정값 사용 (5vw, 10% 같은 둥근 수 = PSD 재확인)
❌ "~", "약", "대충", "정도" 포함된 수치
❌ 부모가 누구인지 모르는 상태에서 % 계산
❌ 이미지 shadow padding 무시
❌ 좌우 대칭 thin line/보더를 자동 힌트 한쪽만 보고 반대편 확인 없이 생략
❌ 하네스 검증 없이 "완료" 선언
❌ PSD 데이터 해석/추정 → 그대로 옮길 것
❌ 3섹션 이상 동시 작업 (최대 2섹션, 수정→검증 사이클)
❌ 이미지 열어보지 않고 배치 (완성형/소스 판단 필수)
❌ 동일 PNG 재사용 요소를 spec 자동매칭에만 맡김 (필요 시 specImageName 명시)
❌ PSD 좌표에 Figma 오프셋(+59.7) 잘못 적용 → PSD는 오프셋 없음
❌ rltv 형제끼리 y좌표 겹치는데 같은 흐름에 배치 → absol 또는 z-index 분리
❌ 수치 암산 → node -e 또는 auto-css만 허용
❌ 하네스 SKIP → node tools/harness.js 필수 실행
```

### 실제 실수 코드 예시

**부모 기준 계산 실패:**
```css
/* ❌ 섹션 기준으로 계산 */
.child { left: 76.6667%; width: 18.1771%; }  /* 1472/1920, 349/1920 */

/* ✅ 부모(parent_bg) 기준으로 재계산 */
.child { left: 78.4053%; width: 19.3245%; }  /* (1472-56)/1806, 349/1806 */
```

**배경 높이 부족 → 이미지 줄이기 시도:**
```css
/* ❌ 이미지를 줄여서 맞추려 함 */
.bg img { width:100%; height:100%; object-fit:cover; }

/* ✅ 이미지 원본 유지, 섹션 높이를 늘림 */
.bg img { width:100%!important; }
.last_element { padding-bottom: 7.9790vw; }  /* PSD: (배경B - 콘텐츠B) / 캔버스 */
```

**추정값 사용:**
```css
/* ❌ 근거 없는 둥근 수 */
.element { padding-bottom: 5vw; }

/* ✅ PSD 정확값 */
.element { padding-bottom: 17.8478vw; }  /* (21897-21557)/1905 = 340px */
```

---

## SECTION 2: 필수 규칙 (ALWAYS)

### 2-1. 위치 지정 철칙

**relative (rltv) 요소:**
```css
.element_rltv {
    position: relative;
    width: 22.2047%;            /* 부모 width 기준 % */
    margin-top: 10.4987vw;      /* 캔버스 기준 vw */
    margin-left: 5.2493%;       /* 부모 width 기준 % */
    /* (부모=wrapper) */         /* ← 부모 반드시 명시 */
}
```

**absolute (absol) 요소:**
```css
.element_absol {
    position: absolute;
    width: 23.0446%;            /* 부모 width 기준 % */
    left: 78.4053%;             /* (PSD_x - 부모_left) / 부모_width */
    top: 50.3571%;              /* (PSD_y - 부모_top) / 부모_height */
    /* (부모=parent_bg) */
}
```

### 2-2. % 기준 규칙 (CSS 스펙)
```
margin-top/bottom %    → 부모 WIDTH 기준 (height 아님!)
padding-top/bottom %   → 부모 WIDTH 기준
absol top/bottom %     → 부모 HEIGHT 기준
width %                → 부모 WIDTH 기준
left/right %           → 부모 WIDTH 기준
```

### 2-3. % 계산 공식
```
[absol 자식 left]   = (PSD_x - 부모_PSD_left) / 부모_PSD_width × 100
[absol 자식 top]    = (PSD_y - 부모_PSD_top) / 부모_PSD_height × 100
[absol 자식 width]  = 자식_PSD_width / 부모_PSD_width × 100

[rltv width]        = PSD_width / 부모_PSD_width × 100
[rltv margin-top]   = (현재_PSD_top - 이전요소_PSD_bottom) / 캔버스 × 100 (vw)

[font-size]         = fontSizeActualPx / 캔버스 × 100 (vw)
[line-height]       = lineHeightPx / 캔버스 × 100 (vw)
[letter-spacing]    = tracking / 1000 (em)
[border-radius]     = PSD_px / 캔버스 × 100 (vw)
```

### 2-4. 이미지 필수 패턴

**모든 이미지는 div wrapper 필수:**
```html
<div class="img_wrapper"><img src="/images/xxx.png"></div>
```
```css
/* 일반 이미지 */
.img_wrapper { display:flex; justify-content:center; align-items:center; width:XX.XXXX%; }
.img_wrapper img { width:100%; }

/* 배경 이미지 (bgimg) */
.bg img { width:100%!important; }
```

**shadow padding 계산:**
```
이미지 파일 naturalWidth = 349px (shadow 포함)
PSD body width = 335px
shadow padding = (349-335)/2 = 7px 양쪽
div width = naturalWidth(349) / 부모width × 100
```

### 2-5. 섹션 3단 레이어 구조
```html
<section class="conN rltv" id="move_XX">
    <!-- 레이어1: 배경 (absol, z:0) -->
    <div class="cN_bg absol"><img src="..."></div>

    <!-- 레이어2: 장식 (absol, z:0) -->
    <div class="cN_deco absol">...</div>

    <!-- 레이어3: 콘텐츠 (rltv, zin) -->
    <div class="cN_title rltv zin">...</div>
    <div class="cN_content rltv zin">...</div>
</section>
```

**섹션 높이 = rltv margin-top 체인 합계:**
```css
.cN_title   { margin-top: 24.5833vw; }
.cN_sub     { margin-top: 8.3333vw;  }
.cN_content { margin-top: 11.3044vw; }
/* + 마지막 요소 높이 + padding-bottom = 총 섹션 높이 */
```

**배경 높이 커버:**
```css
/* 배경이 섹션 높이를 못 덮을 때 → 이미지 줄이지 말고 padding-bottom으로 섹션 높이 확보 */
.last_rltv_element { padding-bottom: XX.XXXXvw; }
/* = (PSD 배경 bottom - 마지막 콘텐츠 bottom) / 캔버스 × 100 */
```

### 2-6. box-shadow (PSD effects)
```css
/* PSD: dropShadow angle:90° distance:10 blur:38 color:#000066 opacity:0.05 */
box-shadow: 0 10px 38px rgba(0, 0, 102, 0.05);
```

### 2-7. border-radius
```css
/* PSD: borderRadius {all: 20} → 20/캔버스×100 = vw */
border-radius: 1.0499vw;

/* PSD: 비대칭 → 각각 계산 */
border-radius: 1.0499vw 1.0499vw 0 0;
```

### 2-8. 텍스트 부분 색상 (styleRuns)
```
PSD: styleRuns [{length:4, color:'#000'}, {length:2, color:'#3d5eed'}]
```
```html
<p class="mf bold">영업은 <span style="color:#3d5eed">숫자</span>로 증명되지만,</p>
```

### 2-8.1. 텍스트 줄바꿈 규칙
```
- leaf 텍스트 기본값 = `white-space:nowrap`
- CSS 자동 줄바꿈 금지
- 여러 줄 텍스트는 `<br>`로만 제어
- PC/모바일 공통으로 `<br>` 구조 유지
- `br { display:none }` 같은 재해석 금지
```

### 2-9. box-sizing
```css
/* padding이 있는 % 너비 요소 → 반드시 */
.padded_element { width:48.7245%; padding:1.5vw 2vw; box-sizing:border-box; }
```

### 2-10. GSAP 규칙
```
- 빠르게 (~1.5s), yPercent + opacity 위주
- scale/rotation/blur 금지 (scaleX/Y 유틸 클래스 충돌)
- reveal = clip-path, 크기 변화 = height
- FOUC 방지: CSS opacity:0 → JS gsap.set → timeline animate
- 모바일 transform 오버라이드 시 PC transform 값 먼저 확인 후 병합
```

### 2-11. Swiper 규칙
```
- slidesPerView: numeric → CSS width 제거
- slidesPerView: 'auto' → CSS width 필수
```

---

## SECTION 3: 워크플로우 + 하네스 파이프라인

### 전체 파이프라인 (섹션 1개당)

```
node tools/harness.js --psd <parsed.json> --section <conXX> --page <페이지명>
```

| STEP | 내용 | 도구 | FAIL 시 |
|------|------|------|---------|
| 1 | spec 추출 | psd-to-spec.js | 중단 |
| 2 | 이미지 전수 분석 (원본 크기 + PSD 대조) | harness 내장 | 중단 |
| 3 | auto-css 실행 (structure 필요) | auto-css-v3.js | 경고 확인 |
| 4 | CSS 금지규칙 검증 (7개) | harness 내장 | 수정 필수 |
| 4.5 | 이미지 전수 HTML 사용 확인 | harness 내장 | 미사용 경고 |
| 5 | 이미지 렌더링=원본 검증 | Playwright | 수정 필수 |
| 6 | 스크린샷 캡처 | Playwright | 시각 확인 |

### Hook (자동 실행 — .claude/settings.json)
```
CSS 파일 Edit/Write → 자동으로 STEP 4 (금지규칙) 실행
위반 시 block → 내가 수정하기 전까지 진행 불가
```

### STEP 0. PSD 분석 + 플랜 (하네스 전)
```
① spec 파일 확인: spec_{페이지}_{섹션}.json (페이지명 포함!)
② 이미지 전수 Read로 열어서 완성형/소스 판단 + sips로 원본 크기 확인
③ PSD spec + parsed 읽고 구조 파악
④ plan.json 작성 → node tools/plan-checker.js 실행 → 🟢 통과 필수
⑤ 🟢 통과 후에만 수치표 + 콘솔 ASCII 레이아웃 작성 (plan-checker 없이 ASCII 금지 — 이중 작업 방지)
⑥ 유저 컨펌 후 코딩 시작
```

### 수치표 (필수)
```
| 요소 | PSD값 | 부모 | 계산식 | CSS값 |
|------|-------|------|--------|-------|
| child | x:1472 w:349 | parent(x:56,w:1806) | (1472-56)/1806 | left:78.4053% |
| img_div | — | section(1905) | naturalWidth(349)/1905 | width:18.3202% |
```
- **모든 행에 부모 명시**
- **이미지 div width = 원본 파일 크기 기준 (PSD 아님!)**
- 둥근 수(5vw, 10%) 발견 시 → PSD 재확인

### 콘솔 레이아웃 (필수 — 아래 항목 전부 기입 안 하면 코딩 금지)

**ASCII에 반드시 기입해야 하는 항목 (하나라도 빠지면 코딩 금지):**
```
□ 모든 요소에 rltv / absol 명시
□ 모든 요소에 부모가 누구인지 명시 (부모=section, 부모=c13_map 등)
□ 섹션 bg 색상 (예: bg:#fafafa)
□ padding-top / padding-bottom 정확값 (vw)
□ 모든 rltv 요소의 margin-top 정확값 (vw)
□ 모든 absol 요소의 top(vw) + left(vw) 정확값
□ 모든 텍스트: font-weight + color + font-size(vw) + px원본값
□ 모든 텍스트: letter-spacing(em) + line-height
□ 이미지 div: width (원본파일크기/1905) + 원본 크기(px)
□ flex 요소: gap 정확값 (vw), direction
□ 완성형/소스 여부 명시
□ 자식이 있으면 자식도 전부 동일하게 기입 (child의 child까지 누락 금지)
□ 높이체인: pt → (rltv요소 나열) → pb 전체 흐름 반드시 명시
□ absol 잡기 전: "rltv 높이체인에 넣을 수 있나?" 먼저 확인
□ "하지 마라" 목록
```

**예시:**
```
┌── section.conN (rltv, bg:#fafafa) ──────────────────────────┐
│  pt: 8.6614vw                                                │
│                                                               │
│  cN_title (rltv, center)                                      │
│    "텍스트 1줄" — 300, #2d2a26, 1.8378vw (35.01px)          │
│    "텍스트 2줄" — 700, #043915, 2.3633vw (45.02px)          │
│    ls:-0.05em, lh:1.5172                                      │
│                                                               │
│  cN_cards (rltv, flex, mt:2.9921vw, gap:1.3648vw)           │
│    ml: 17.2703%                                               │
│   ┌─ card (26.299213vw=501px) ─┐  ┌─ card (26.299213vw) ─┐ │
│   │ conN_1.png (501×281)       │  │ conN_2.png (501×281)  │ │
│   │ 완성형 — CSS 추가 금지     │  │ 완성형                │ │
│   └────────────────────────────┘  └───────────────────────┘ │
│                                                               │
│  pb: 8.6614vw                                                 │
└───────────────────────────────────────────────────────────────┘

하지 마라: 카드에 border/shadow/radius CSS 추가 금지 (완성형)
```
- **유저 승인 후에만 코딩 진행**

### 체크리스트 (코딩 완료 후, 하네스 전)
```
□ 이미지 div width = 원본 파일 크기 / 1905 (PSD 크기 아님!)
□ 배경 높이 커버 → padding-bottom 계산했는가?
□ 이미지 shadow padding 포함했는가?
□ absol top은 vw인가? (% 사용 금지)
□ rltv에 음수 margin 없는가?
□ min(), max-width 없는가?
□ 모든 이미지가 HTML에 사용됐는가?
□ PSD 좌표에 Figma 오프셋 안 섞였는가?
□ 텍스트 styleRuns(부분 색상) 확인했는가?
□ 하네스 🟢 ALL CLEAR 나왔는가?
```

### 하네스 실행 (필수 — 스킵 금지)
```bash
node tools/harness.js --psd psd/05_startup_parsed.json --section con09 --page franchise
# 🟢 ALL CLEAR 나올 때까지 반복. 🔴 FIX REQUIRED면 수정 후 재실행.
```

---

## SECTION 4: 자가진단 10문항

코딩 완료 후 모두 "예"여야 한다:

1. 모든 width/left/top 값에 **부모가 누구인지** 주석이 있는가?
2. 모든 수치에 **PSD 계산식**이 있는가?
3. **5vw, 10%, 50%** 같은 둥근 수가 없는가?
4. rltv 요소에 **top/left**를 쓴 곳이 없는가?
5. absol 요소에 **margin-top/left**를 쓴 곳이 없는가?
6. 이미지가 **div wrapper 없이** 직접 놓인 곳이 없는가?
7. **height 속성**을 rltv에 쓴 곳이 없는가?
8. **px 단위**를 쓴 곳이 없는가? (border/shadow 제외)
9. 배경 이미지가 섹션 높이를 **완전히 커버**하는가?
10. **Puppeteer 스크린샷**으로 검증했는가?

---

## SECTION 5: 유틸리티 클래스

```css
/* 위치 */
.rltv { position: relative; }
.absol { position: absolute; }
.zin { z-index: 1; }
.flexrow { display: flex; flex-direction: row; }
.flexcol { display: flex; flex-direction: column; }

/* 폰트 */
.mf { font-family: 'Pretendard Variable', sans-serif; }
.sf { font-family: serif; }
.bold { font-weight: 700; }
.semibold { font-weight: 600; }
.medium { font-weight: 500; }

/* 크기 */
.exsm(0.9vw) .sm(1.1) .sm-md(1.3) .semimd(1.7) .md(2) .exmd(2.5)
.md-lg(3.4) .semilg(3.9) .lg(4.3) .exlg(5)

/* 주의: CSS에서 display:flex를 직접 잡을 때는 flexrow/flexcol 유틸 안 쓰기 (충돌) */
```

---

## SECTION 6: 모바일 반응형

### 9대 원칙
```
1. 모든 요소 가운데 정렬 — align-self:center; margin-left:0; text-align:center
2. 첫 요소 margin-top: 15%
3. 마지막 요소 margin-bottom: 12%
4. 최소 폰트 3.3vw — 이보다 작으면 가독성 없음
5. 자동 줄바꿈 금지 — leaf 텍스트는 `white-space:nowrap`, 여러 줄은 `<br>` 유지
6. 가독성 최우선 — 이미지 내 텍스트, 배지, 숫자 모두 읽히는지 확인
7. 큰 타이틀 위, 설명 텍스트 아래
8. 회색 텍스트 → 검정 (gray/opacity 낮은 텍스트)
9. order 속성으로 순서 조정
```
- 브레이크포인트: `@media (max-width: 599px)`
- absol → rltv 전환: `position:relative; left:auto; top:auto;`
- transform 오버라이드 시 PC 값 먼저 확인 후 병합

### 레이아웃 변환 패턴
- absol → rltv 전환 (세로 스택)
- flexrow → column
- 장식 요소 숨김: `display:none !important`
- PC/모바일 공통 `<br>` 유지
- width 통일: 콘텐츠 85~90%, 카드 100%

### 폰트 크기 가이드 (모바일 vw)
| 용도 | 크기 | 비고 |
|------|------|------|
| 본문 최소 | 3.3vw | 이보다 작으면 안됨 |
| 본문 일반 | 3.5vw | line-height: 1.6~1.7 |
| 소제목 | 4~5vw | |
| 배지/라벨 숫자 | 5~7vw | 가독성 필수 |
| 카드 타이틀 | 5.5~6.5vw | |
| 카운터 숫자 | 7~12vw | 섹션별 조절 |

### 간격/여백 가이드
- 카드 간 gap: 4~5vw
- 섹션 내 요소 간 margin-top: 3~6%
- 라인하이트: 타이틀 1.3~1.4, 본문 1.6~1.7
- border-radius: 3vw (카드/박스), 4vw (탭 바)

### Swiper 모바일 패턴
- PC 5개 → 모바일 1.4개: `slidesPerView:1.4, centeredSlides:true`
- PC 3개 → 모바일 2개: `breakpoints: { 0: { slidesPerView:2 }, 600: { slidesPerView:3 } }`
- 블러 엣지: `::before/::after`로 좌우 `linear-gradient`
- 가운데 강조: `.swiper-slide-active { transform:scale(1.15~1.35); z-index:3 }`
- centeredSlides 필수 체크

### 자주 하는 실수
- 숫자/배지 너무 작게 — 반드시 키우기
- 이미지 opacity 0.45 이하 → 모바일 0.6 이상
- 라인하이트 안 넣기 — 본문 line-height: 1.6~1.7 필수
- 가운데 정렬 빠뜨리기
- absol 위치값 미리셋 — `left:auto!important; transform:none!important`
- transform 오버라이드 시 PC 값 소실 — 기존 값 확인 후 merge
- border-radius 깨짐 — overflow:hidden 빠뜨리면 내부 삐져나옴

### 모바일 검증
```bash
node _verify_rules.js [섹션명] mobile    # 단일
node _verify_rules.js all mobile          # 전체
```
| 코드 | 규칙 | FAIL 조건 |
|------|------|-----------|
| M-1 | 최소 폰트 | fontSize < 12.8px (390px 기준) |
| M-2 | 가운데 정렬 | 요소 x < 섹션 5% |
| M-3 | 첫 요소 margin-top | < 8% |
| M-4 | PC 잔존값 | relative인데 left≠auto |
| M-5 | line-height | 본문 ratio < 1.3 |
| M-6 | 이미지 opacity | < 0.5 |
| M-7 | Swiper centeredSlides | 미설정 |
| M-8 | border-radius+overflow | radius+visible+삐져나감 |

---

## SECTION 7: PSD 파서 (psd_parser.js)

```bash
# 설치
npm install ag-psd

# 사용
node psd_parser.js <psd파일경로> [출력json경로]
# 예: node psd_parser.js 커넥타.psd 커넥타_parsed.json
```
- GitHub: `DomKim/vwebmaster`
- ag-psd 기반, skipLayerImageData:true → 빠른 파싱 (~0.8s)
- 출력: 모든 레이어의 좌표, fontSize×transform(actualPx), fillColor, borderRadius, effects, styleRuns, opacity, textAlign

---

## [PROJECT] 프로젝트별 정보

> 아래 내용만 프로젝트마다 수정하세요.

```
- 프로젝트명:
- 캔버스 크기: (예: 1920px)
- 로컬 서버: (예: php -S localhost:8080)
- DB: (예: MySQL konnector, root/password)
- 반응형: @media (max-width: 599px)
- Git: (예: https://github.com/DomKim/vwebmaster.git)
- PSD 파일: (예: 커넥타.psd)
- 파싱 JSON: (예: 커넥타_parsed_v3.json)
- 폰트: (예: Pretendard, Anton)
- 주요 색상: (예: #000066 navy, #3d5eed blue)
- CSS 경로: (예: /css/style.css)
- 이미지 경로: (예: /images/conXX_YY.png)
```
