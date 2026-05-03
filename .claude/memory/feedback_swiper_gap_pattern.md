---
name: Swiper gap 패턴 — PSD active/비활성 gap 다를 때
description: active 양쪽 gap과 비활성끼리 gap이 다른 Swiper 처리 정답 패턴
type: feedback
---

PSD에서 active 양쪽 gap ≠ 비활성끼리 gap일 때 정답 패턴:

**Why:** main c5 Swiper에서 5번 시행착오. margin → slide translateX → JS img transform → CSS class 순서로 실패. 원인: Swiper가 slide에 translate3d를 넣어서 직접 transform 충돌, JS style.transform은 CSS transition과 타이밍 불일치.

**How to apply:**
1. PSD에서 두 종류 gap 측정: active양쪽gap, 비활성끼리gap
2. spaceBetween = active양쪽gap + scale확대분**한쪽** (scale은 중심 기준 확대 → 한쪽만 gap에 영향)
   - 예: activeGap=137, scale확대분=(384-335)/2=24.5 → spaceBetween=161.5px
3. outer translateX = spaceBetween - 비활성gap (한쪽 전체 보정)
   - 예: 161.5 - 45 = 116.5px = 6.1155vw
4. 바깥 slide 처리: JS `slideChangeTransitionStart`에서 **class만** 토글 (c5_outer, c5_outer-r)
5. CSS에서 class별 `.slide-inner { transform: translateX(±Xvw) }` + 동일 `transition: transform 0.4s ease`
6. border/radius/overflow:hidden → slide-inner(child wrapper)에. slide 자체는 깨끗하게
7. **절대 금지**: slide에 직접 transform, margin으로 gap 조절, JS style.transform으로 애니메이션
8. 모든 transform은 child(slide-inner)에만
9. ❌ 이전 오류: scale확대분×2(양쪽)로 계산하면 spaceBetween이 과대 → gap 안 맞음

실패한 접근 (다시 하지 말 것):
- ❌ slide에 margin → absol 금지규칙
- ❌ slide에 translateX → Swiper translate3d 충돌
- ❌ JS img.style.transform → CSS transition과 따로 놂
- ❌ slideChangeTransitionEnd → 딜레이 발생

swiper-checker TODO:
- img 기준 gap 측정 추가 (현재 slide box 기준만 → outer translateX 제거 미감지)
