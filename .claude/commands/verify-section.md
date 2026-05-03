# 섹션 검증 + Puppeteer GATE-8 자동 통과

> 코딩 완료 후 반드시 실행. 이 Skill이 검증 + GATE-8 플래그를 자동 처리한다.

## 입력
- $ARGUMENTS: 섹션명 모드 (예: `con7 pc`)

## 실행 순서 (전부 자동)

### STEP 1: _verify_rules.js 실행
```bash
node "$CLAUDE_PROJECT_DIR/_verify_rules.js" {섹션명} {pc|mobile}
```
- PASS/FAIL 리포트 출력
- **FAIL 있으면 → 수정 → 재실행 → ALL PASS까지 반복**

### STEP 2: Puppeteer 스크린샷
```javascript
// PC: 1920x1080, 모바일: 390x844
const browser = await puppeteer.launch({headless: true});
const page = await browser.newPage();
await page.setViewport({width: 1920, height: 1080}); // 또는 390x844
await page.goto('http://localhost:8081');
await page.screenshot({path: '/tmp/{섹션명}_verify.png', fullPage: false, clip: {해당 섹션 영역}});
```
→ Read로 스크린샷 열어서 시각 확인

### STEP 3: Computed Style 수치 추출
```javascript
// spec의 모든 셀렉터에 대해 자동 실행
const selectors = spec.allSelectors;
for (const sel of selectors) {
  const style = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      position: cs.position, left: cs.left, top: cs.top,
      width: r.width + 'px', x: r.x, y: r.y
    };
  }, sel);
  console.log(sel, style);
}
```
**수치 출력 없이 "정상" 판단 금지.**

### STEP 4: 독립 검증 (Subagent)
Agent 도구로 검증 전용 subagent 실행:
```
- subagent_type: "general-purpose"
- description: "verify {섹션명} section"
- prompt: 아래 체크리스트 21항목 전수 확인
```

체크리스트:
```
A. 구조: wrapper 일치, 빈 div 없음, rltv 콘텐츠 있음
B. z-index: children 순서 일치, 임의 배정 없음, 가림 없음
C. 수치: px 없음, 정수% 없음, height 없음, Figma 정확값
D. 위치: rltv/absol CSS 속성 정확, 정렬 Figma 기반
E. 이미지: width+flex, bgimg 100%, object-fit
F. 텍스트: nowrap+br, KERIS700, overrides, lineHeight
G. border-radius: cornerRadius + fillGeometry 2단계
H. hover 일관, rotation 정확
```

### STEP 5: ALL PASS 시 GATE-8 플래그 자동 세팅
```bash
# _verify_rules.js ALL PASS + 스크린샷 확인 + 수치 확인 후:
touch /tmp/claude_gate_session/puppeteer_passed   ← GATE-8 통과
```

### STEP 6: FAIL 시 수정 사이클
```
FAIL 발견 → 수정 → /verify-section 재실행
→ CSS 수정하면 puppeteer_passed 자동 삭제 (PostToolUse)
→ 다시 STEP 1부터
→ ALL PASS까지 반복
```

## 완료 시 상태
```
GATE-8: ✅ puppeteer_passed
GATE-9: ✅ check_rules_errors 없음 (PostToolUse에서 자동 관리)
→ 다음 섹션 작업 가능
→ 또는 "검증 완료" 선언 가능
```

## 검증 완료 선언 전 최종 체크
```
□ 스크린샷을 Read로 열어서 봤는가?
□ computed style 수치를 출력했는가?
□ _verify_rules.js ALL PASS인가?
□ subagent 검증 PASS인가?
→ 하나라도 NO면 "완료" 선언 금지
```
