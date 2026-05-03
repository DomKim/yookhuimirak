---
name: plan.json 작성 전 기존 형식 확인 필수
description: plan.json을 처음부터 올바른 형식으로 작성하기 위해 기존 통과된 plan.json을 반드시 먼저 읽을 것
type: feedback
---

plan.json 작성 시 기존 통과된 plan.json 형식을 먼저 읽고 그 형식을 따라야 한다.

**Why:** franchise con06에서 형식을 무시하고 마음대로 작성해서 35개 오류 발생 → 3번 재작성 → 시간 낭비. plan-checker 필수 필드(parentWidth, width, top, src, prevSectionBottom 기준 계산, wrapper children, effects, borderRadius 등)를 모르고 작성하면 반드시 실패한다.

**How to apply:**
1. plan.json 작성 전에 `.planning/` 폴더에서 통과된 기존 plan.json을 1개 읽기
2. 필수 필드 목록 확인 후 첫 작성에서 전부 포함
3. absol top은 항상 prevSectionBottom 기준으로 계산
4. 이미지는 src, naturalWidth, naturalHeight, sourceType, psdY, effects, borderRadius 전부 명시
5. 겹치는 absol은 wrapper+children으로 그룹핑
