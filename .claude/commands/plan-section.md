# 섹션 플랜 작성

> `/figma-extract` 완료 후 실행. 수치 시트 없이 진행 금지.

## 입력
- $ARGUMENTS: 섹션명 (예: `con7`)

## 전제 조건 확인
```
□ /tmp/claude_gate_session/active_spec 존재?
□ spec에 verified:true?
□ 수치 시트(ec_{섹션명}_plan.md) 존재?
→ 하나라도 NO면 "/figma-extract부터 실행하세요" 안내 후 중단
```

## 실행 순서

### STEP 1: 수치 시트 읽기
- `ec_{섹션명}_plan.md` Read
- 구조 트리, 수치표, 텍스트 상세 확인

### STEP 2: rltv vs absol 분류
각 요소에 대해 판단 + **근거 기록**:

| 분류 | CSS | 높이 기여 | 용도 |
|------|-----|----------|------|
| rltv | margin-top/left | O | 순서 배치 콘텐츠 |
| absol | top/left | X | 자유 좌표 (배경/장식) |

**금지**: 빈 spacer div, absol만 담긴 rltv div, rltv에 top/left, absol에 margin

### STEP 3: 높이 체인 설계
```
섹션 높이 = Σ(rltv margin-top + 콘텐츠 높이)
```
- 각 rltv div에 실제 콘텐츠 확인
- margin-top = Figma y좌표 차이 / 1920 * 100 (vw)

### STEP 4: Nested wrapper 결정
- Figma 그룹/프레임 = wrapper div
- children 순서 = z-index (임의 배정 금지)
- spec.nestedGroups와 일치 확인

### STEP 5: 이미지/텍스트/정렬 처리 계획
- 이미지 div: width + display:flex
- bgimg: width:100%!important
- nowrap + br 줄바꿈
- KERIS KEDU = font-weight:700
- characterStyleOverrides → span 분리
- 정렬: textAlignHorizontal 또는 부모중심 비교

### STEP 6: 판단 필요 항목 확인 (PLAN-ASK)
아래 해당되면 **코딩 금지, 유저에게 제안 먼저**:
```
□ Figma에 없는 요소 추가?
□ 디자이너 코멘트 2가지 이상 해석?
□ 디자인↔데이터 구조 불일치?
□ 인터랙션/애니메이션 미명시?
□ Swiper 설정 불명확?
□ hover/click 상태 미명시?
→ "제안: ..." 또는 "확인필요: ..." 형식으로 유저에게 질문
```

### STEP 7: 플랜 자기 검증
```
□ 모든 요소에 rltv/absol 근거?
□ 빈 rltv div 없음?
□ 높이 체인 = 실제 콘텐츠 rltv만?
□ nested = Figma 그룹 구조?
□ z-index = children 순서?
□ 이미지 div width+flex?
□ KERIS KEDU = 700?
□ overrides 반영?
```

## 완료 시
→ 플랜 파일 완성 → `/code-section` 실행 가능
