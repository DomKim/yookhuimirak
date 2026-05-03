---
name: plan-checker 통과 ≠ 유저 컨펌 — ASCII 보여주고 승인받기 전에 코딩 금지
description: plan-checker 🟢는 기계적 필드검증일 뿐, 유저가 ASCII 보고 승인해야 코딩 시작
type: feedback
---

plan-checker 🟢 APPROVED는 JSON 필드가 다 있다는 의미일 뿐, 유저 컨펌이 아님.

**Why:** coninterview 섹션에서 plan-checker 통과 후 ASCII 다이어그램을 유저에게 안 보여주고 바로 구현함. 유저가 "플랜 approve는 내가 해야지"라고 지적.

**How to apply:**
올바른 순서 (절대 스킵 금지):
1. plan.json 작성 → plan-checker.js 🟢
2. 유저에게 ASCII 다이어그램 + 수치표 보여줌
3. 유저 "ㅇ" / "컨펌" / "ㄱ" 받음
4. 그 다음 코딩 시작

plan-checker 통과했다고 바로 코딩 들어가면 안 됨.
