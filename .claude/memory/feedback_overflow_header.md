---
name: overflow:hidden은 style.css가 아니라 페이지 CSS에 직접
description: style.css의 section overflow:hidden이 content.php 페이지에서 안 먹힘 — 각 페이지 CSS에 직접 넣어야 함
type: feedback
---

style.css의 `section { overflow:hidden }` 이 content.php 페이지(brand/shop/franchise 등)에서 적용 안 됨.

**Why:** style.css가 이 페이지들에서 공통 CSS로 로드되지 않거나, 다른 스타일에 의해 override됨.

**How to apply:** 각 페이지 CSS(franchise.css 등)의 섹션 스타일에 `overflow: hidden` 직접 명시할 것. "공통에 있으니까 되겠지" 금지.
