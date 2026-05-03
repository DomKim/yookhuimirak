# Figma 데이터 추출 + spec 생성 + GATE 자동 세팅

> 섹션 작업의 첫 단계. 이 Skill이 GATE 1~7을 자동으로 통과시킨다.

## 입력
- $ARGUMENTS: 섹션명 nodeId (예: `con7 123:456`)

## 실행 순서 (전부 자동 — 순서 변경/스킵 금지)

### STEP 1: 세션 초기화 + 메모리 읽기
```
1. rm -f /tmp/claude_gate_session/plan_read /tmp/claude_gate_session/figma_verified /tmp/claude_gate_session/gate_declared /tmp/claude_gate_session/active_spec /tmp/claude_gate_session/needs_puppeteer /tmp/claude_gate_session/puppeteer_passed /tmp/claude_gate_session/check_rules_errors
2. mkdir -p /tmp/claude_gate_session
3. Read: memory/pc_section_process.md (PC) 또는 memory/mobile_rules.md (모바일)
4. touch /tmp/claude_gate_session/plan_read   ← GATE-1 통과
```

### STEP 2: Figma API 호출 + 자동 추출
```bash
node "$CLAUDE_PROJECT_DIR/_figma_extract.js" {nodeId} ec_{섹션명}_data.json
```
이 스크립트가 한 번에 추출:
- children 트리 + z-index 순서
- cornerRadius + pathRadius (2단계)
- characterStyleOverrides + styleOverrideTable
- rotation, size, fills
- 부모 기준 상대좌표 + vw/% 변환

### STEP 3: spec JSON 생성
`ec_{섹션명}_spec.json` 생성 — 필수 필드:
```json
{
  "section": "{섹션명}",
  "verified": false,
  "allSelectors": [".cN_bg", ".cN_title", ...],
  "zIndex": {".cN_bg": 0, ".cN_title": 1, ...},
  "nestedGroups": [...],
  "elements": [
    {"name": ".cN_bg", "figmaNodeId": "XXX:YYY", "figma": {...}}
  ]
}
```
- **allSelectors**: 모든 CSS 셀렉터 등록 (GATE-6 필수)
- **figmaNodeId**: 모든 요소에 필수 (GATE-7 필수)
- **zIndex**: children 순서 기반
- **nestedGroups**: Figma 부모-자식 관계

### STEP 4: spec 검증 + GATE 플래그 자동 세팅
```bash
# Figma 수치 확인 완료
touch /tmp/claude_gate_session/figma_verified   ← GATE-2 통과

# GATE 선언 출력
echo "이번 작업에서 나는:
- 스크린샷 없이 완료 선언하지 않는다
- computed style 수치 없이 정상 판단하지 않는다
- Figma 수치 확인 없이 CSS 수정하지 않는다"
touch /tmp/claude_gate_session/gate_declared   ← GATE-3 통과

# active_spec 등록
echo "$CLAUDE_PROJECT_DIR/ec_{섹션명}_spec.json" > /tmp/claude_gate_session/active_spec   ← GATE-4 통과

# _verify_spec.js 실행 → ALL PASS → verified:true 자동 기록
node "$CLAUDE_PROJECT_DIR/_verify_spec.js" ec_{섹션명}_spec.json   ← GATE-5 통과
```

### STEP 5: 검증 결과 확인
```
_verify_spec.js 결과가 ALL PASS가 아니면:
→ FAIL 항목 수정 → 재실행
→ ALL PASS 될 때까지 반복
→ verified:true 자동 기록되면 GATE-5 통과
```

### STEP 6: 수치 시트 작성
`ec_{섹션명}_plan.md`에 정리:
```markdown
## 구조 트리 (Figma children 순서 = z-index)
[자동 추출 트리]

## 수치표
| 요소 | 부모 | x | y | w | h | 정렬 | radius | z-index | rltv/absol |
|------|------|---|---|---|---|------|--------|---------|------------|

## 텍스트 상세
| 요소 | font | size | weight | color | overrides | lineHeight |
|------|------|------|--------|-------|-----------|------------|
```

## 완료 시 상태
```
GATE-1: ✅ plan_read
GATE-2: ✅ figma_verified
GATE-3: ✅ gate_declared
GATE-4: ✅ active_spec → ec_{섹션명}_spec.json
GATE-5: ✅ verified:true
GATE-6: ✅ allSelectors 존재
GATE-7: ✅ figmaNodeId 전수 존재
→ 이 시점에서 /plan-section 실행 가능
```
