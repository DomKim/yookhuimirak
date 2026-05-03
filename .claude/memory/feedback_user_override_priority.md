---
name: 유저가 직접 준 CSS 값은 PSD보다 우선
description: 유저가 명시적으로 CSS 값을 지정하면 PSD 원본보다 우선 적용, 재작업 시에도 유지
type: feedback
---

유저가 직접 CSS 값을 지정하면 그 값이 최우선. PSD 값으로 되돌리지 말 것.

**Why:** con15 c15_desc에서 유저가 `background:transparent; text-align:center`로 수정해줬는데, 재작업 때 PSD 기준으로 `background:#2d2a26; text-align:left`로 되돌렸다. 3번 반복.

**How to apply:**
1. 유저가 CSS 값을 직접 지정하면 즉시 기억
2. 재작업/다시 만들기 시에도 유저 지정값 유지
3. PSD와 다르더라도 유저 지시가 우선
4. 확신이 안 서면 "PSD에서는 X인데 유저 지정값 Y로 유지할까요?" 물어보기
