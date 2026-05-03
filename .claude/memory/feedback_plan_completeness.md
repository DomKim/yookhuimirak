---
name: 플랜 작성 시 모든 디테일 빠짐없이 포함
description: 플랜에 텍스트 color, carousel 구조, hover 동작, effects 등 모든 세부사항을 첫 제출 때 완벽하게 포함할 것
type: feedback
---

플랜을 처음 제출할 때 세부사항을 자꾸 누락한다. 유저가 여러 번 지적.

**누락 이력:**
- 텍스트 segment color 생략 (weight만 적고 color 안 적음)
- carousel 0.5+1+0.5 구조 미반영
- card hover shadow 미발견
- composite 이미지 내장 border/shadow 중복 적용
- dots 위치 계산 오류

**Why:** 유저가 "왜 안해 자꾸 안하는게 왤케 많어"라고 반복 지적. 플랜이 불완전하면 컨펌 의미가 없다.

**How to apply:**
- 플랜 작성 후 제출 전에 체크리스트 자체 검증:
  □ 모든 텍스트에 weight + color 명시했는가
  □ 모든 이미지 hover/default 상태 명시했는가
  □ carousel이면 보이는 슬라이드 수/구조 명시했는가
  □ effects (shadow, border, glow) 전부 반영했는가
  □ composite 이미지 내장 효과 확인했는가
  □ 콘솔 다이어그램에 실제 레이아웃 정확히 반영했는가
- "대충 넘기기" 금지. 한 번에 완벽하게.
