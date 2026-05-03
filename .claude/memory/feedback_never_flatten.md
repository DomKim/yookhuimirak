---
name: wrapper 구조 절대 풀지 말 것
description: 좌표 문제 해결한다고 wrapper를 없애고 flat하게 만드는 행위 절대 금지
type: feedback
---

HTML에서 논리적 그룹핑(wrapper div)을 절대 해체하지 말 것.

**Why:** con06에서 position 오차 해결한다고 wrapper(c6_point)를 없애고 모든 요소를 section 직속 flat으로 풀었다가 유저에게 심하게 지적받음. 문제의 원인은 wrapper가 아니라 wrapper에 position:absolute를 준 것이었음.

**How to apply:**
1. wrapper는 `position:static`(기본값)으로 두면 내부 absol 자식이 상위 positioned ancestor(section) 기준으로 잡힘
2. 좌표가 틀리면 wrapper를 없애는 게 아니라, wrapper의 position을 확인할 것
3. PSD에서 시각적으로 한 덩어리인 것은 반드시 wrapper로 그룹핑 유지
4. "flat이 더 간단하다"는 판단 금지 — 구조 > 편의
