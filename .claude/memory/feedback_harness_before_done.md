---
name: 섹션 "완료" 선언 전 harness 전체 실행 필수
description: 코딩 끝났다고 "완료"라고 말하기 전에 harness 전체 파이프라인(step 1~6) 실행하고 🟢 ALL CLEAR 받아야 함
type: feedback
---

섹션 작업 후 "완료"/"done"/"끝" 선언 전에 반드시 harness 전체 실행.

**Why:** con06 작업 시 css-check(step 4) hook만 통과하고 "확인해보세요"라고 넘김. position-checker, Playwright 스크린샷, 렌더링 스타일 대조 전부 안 돌림. 결과물 엉망.

**How to apply:**
1. 간단한 수정(색상, 간격 등) → css-check hook만 (자동, block 안 함)
2. 섹션 완료 선언 → harness 전체(step 1~6) 실행 필수
3. 🟢 ALL CLEAR 안 나오면 "완료" 선언 금지
4. 특히 step 5(Playwright 이미지=원본), step 5.5(position-checker), step 5.7(스타일 대조) 생략 금지
5. 스크린샷 Read로 열어서 디자인 시안과 비교까지 해야 "완료"
