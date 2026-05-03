---
name: PSD flat 레이어를 HTML에서 시각적 그룹핑 필수
description: PSD 레이어가 형제로 나열되어도 시각적으로 한 덩어리인 요소(동심원+dot 등)는 HTML wrapper로 그룹핑
type: feedback
---

PSD 레이어 구조를 HTML에 1:1로 옮기면 안 됨.

**Why:** con06에서 동심원(outer ring, mid ring)과 dot(con06_2.png)이 PSD에서 같은 레벨 형제 레이어인데, HTML에도 형제로 놓아서 구조가 깨짐. dot_wrap 안에 ring + dot을 넣어야 중앙 정렬/크기 관리가 됨.

**How to apply:**
1. PSD 레이어 나열 전에 시안 이미지를 보고 "시각적 덩어리" 파악
2. 동심원+dot, 카드+뱃지, 아이콘+라벨 등 → wrapper div로 그룹핑
3. STEP 0 체크리스트 "HTML 구조" 항목에서 확인
