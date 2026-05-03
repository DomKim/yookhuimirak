---
name: composite 이미지 효과 중복 적용 금지
description: composite 이미지에 이미 포함된 border/shadow/radius를 CSS에서 다시 추가하지 말 것
type: feedback
---

composite 이미지에 이미 border, shadow, border-radius가 렌더링되어 있으면 CSS에서 중복 적용하지 마라.

**Why:** con05 로고 이미지(con05_1.png)에 이미 원형 border와 shadow가 포함되어 있었는데, CSS에서 border + box-shadow를 또 추가해서 이중 효과가 됨. 유저가 직접 발견하고 수정 요청.

**How to apply:**
- STEP 0에서 composite 이미지를 Read로 열어 확인할 때, border/shadow/radius가 이미 이미지에 포함되어 있는지 체크
- PSD spec의 effects가 이미지 레이어가 아닌 wrapper rect에 있으면 → 이미지 내포 가능성 높음
- 확신 없으면 CSS에서 효과를 빼고, Playwright 확인 후 필요시 추가
