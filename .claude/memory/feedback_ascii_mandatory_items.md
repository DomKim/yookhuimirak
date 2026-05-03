---
name: ASCII 다이어그램 필수 기입 항목 — 하나라도 빠지면 코딩 금지
description: 콘솔 ASCII에 rltv/absol, 부모, 모든 수치, child의 child까지 전부 기입 강제
type: feedback
---

ASCII 다이어그램에 아래 항목이 하나라도 빠지면 코딩 시작 금지.

**Why:** 수치 없이 대충 구조만 그리거나, absol/rltv 구분 안 하거나, 부모를 안 적거나, child의 child를 빠뜨리는 실수 반복. 유저가 "수단과 방법 가리지 말고 영영 강제하라"고 지시.

**How to apply:**
모든 요소에 반드시 기입:
1. rltv / absol 명시
2. 부모가 누구인지 명시 (부모=section, 부모=c13_map 등)
3. rltv → margin-top 정확값 (vw)
4. absol → top(vw) + left(vw) 정확값
5. width 정확값 + 기준 (원본파일크기/1905, 부모대비% 등)
6. 자식이 있으면 자식도 전부 동일하게 기입 (child의 child까지)
7. 텍스트: font-weight + color + font-size(vw,px) + ls(em) + lh
8. 이미지: 원본크기(px) + 소스/완성형 + radius
9. flex/grid: gap(vw), direction
10. 높이체인: pt → (rltv요소 나열) → pb 전체 흐름 명시
11. 섹션 bg색상, pt, pb 정확값
12. "하지 마라" 목록
