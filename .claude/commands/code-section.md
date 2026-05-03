# 섹션 코딩

> `/plan-section` 완료 후 실행. 플랜 없이 코딩 금지.
> 이 Skill 실행 시 GATE 0~9가 이미 통과된 상태여야 함.

## 입력
- $ARGUMENTS: 섹션명 (예: `con7`)

## 전제 조건 자동 확인
아래 전부 통과해야 코딩 시작:
```bash
# 자동 체크 (하나라도 실패 → 중단)
test -f /tmp/claude_gate_session/plan_read       # GATE-1
test -f /tmp/claude_gate_session/figma_verified  # GATE-2
test -f /tmp/claude_gate_session/gate_declared   # GATE-3
test -f /tmp/claude_gate_session/active_spec     # GATE-4
# GATE-5~7: gate-check.sh가 Edit 시 자동 검사
```
실패 시 → "/figma-extract부터 실행하세요" 안내

## 코딩 규칙 (전부 강제 — hook이 물리 차단)

### CSS 절대 금지
- ❌ px → vw, % only (border/outline/box-shadow 제외)
- ❌ height (video/Swiper 제외)
- ❌ 정수% → 소수점 4자리
- ❌ rltv에 top/left
- ❌ absol에 margin-top/left
- 캔버스 기준: 1920px (÷1905 금지)

### HTML 구조
- Figma 부모-자식 = wrapper-children
- children 순서 = z-index 순서
- 빈 spacer/rltv div 금지

### 이미지
```css
.cN_XXimg { width: XX.XXXX%; display: flex; justify-content: center; align-items: center; }
.cN_XXimg img { width: 100%; }
.cN_bg { width: 100% !important; }
/* height+width:auto → object-fit:contain 필수 */
```

### 텍스트
- white-space: nowrap + br 줄바꿈
- KERIS KEDU = font-weight: 700
- characterStyleOverrides → span 분리
- line-height = Figma text height / fontSize

### 좌표 변환
```
width(%) = naturalWidth / 1920 * 100
left(%)  = (figma_x + 59.7) / 1920 * 100
top(vw)  = from_section_top / 1920 * 100
fontSize(vw) = fontSize_px / 1920 * 100
```

## 코딩 중 자동 강제 (hook)
- **매 Edit/Write 전**: gate-check.sh가 GATE 0~9 검사
- **매 Edit/Write 후**: pc-checklist.sh가 _check_rules.js 자동 실행 + 체크리스트 출력
- **_check_rules.js ERROR 시**: GATE-9가 다음 Edit 차단 → 에러 수정 필수
- **CSS 수정 시**: puppeteer_passed 자동 삭제 → GATE-8 재검증 필요

## 코딩 완료 후
**즉시 `/verify-section {섹션명}` 실행. 검증 없이 완료 선언 금지.**
