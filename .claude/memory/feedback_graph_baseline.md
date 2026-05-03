---
name: 그래프 세로라인은 섹션 바닥까지 — 개별 height 계산 금지
description: 그래프/타임라인 세로 라인은 height:999vw + overflow:hidden으로 섹션 바닥까지 자동 채움. 개별 height 계산하지 말 것.
type: feedback
---

그래프/타임라인 세로 라인의 height를 PSD 값 기준으로 개별 계산하면 안 됨.

**Why:** con06에서 PSD baseline이 8673으로 통일되어 있었는데, 개별 height를 계산해서 섹션 바닥에 18~42px 못 미치는 결과 발생. 유저가 "line이 섹션 bottom까지 닿아야 한다"고 수정 지시.

**How to apply:**
1. PSD에서 baseline 통일 여부 먼저 확인
2. 통일되어 있으면: height:999vw + section overflow:hidden
3. 개별 height 계산 금지 — 어차피 overflow:hidden으로 잘림
