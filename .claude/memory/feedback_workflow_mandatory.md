---
name: 워크플로우 절대 이탈 금지
description: CLAUDE.md 워크플로우(STEP 0~4)를 반드시 순서대로 따라야 함 — 수동 대체 행위 금지
type: feedback
---

워크플로우(STEP 0→1→2→3→4)를 절대 벗어나지 말 것. 하네스가 자동으로 해주는 작업을 수동으로 대체하지 말 것.

**Why:** con06 작업 시 spec JSON을 직접 열어 읽고, 이미지를 하나씩 수동 확인하고, PSD raw를 직접 파싱하려 함 — harness step 1~2가 자동으로 해주는 걸 수동으로 해서 시간 낭비 + 유저 지적받음.

**How to apply:**
1. 섹션 작업 시작하면 무조건 CLAUDE.md의 STEP 0부터 순서대로
2. harness가 자동으로 해주는 것(spec 추출, 이미지 분석)은 harness로 실행
3. 수동으로 spec JSON 열어서 읽기, PSD raw 직접 파싱 같은 행위 금지
4. 각 STEP 완료 후 다음 STEP으로 넘어가기 전 체크리스트 확인
5. 워크플로우 이탈 시 즉시 멈추고 원래 순서로 복귀
