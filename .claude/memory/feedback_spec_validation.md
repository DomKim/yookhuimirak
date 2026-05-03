---
name: spec 추출 후 반드시 PSD raw 크로스체크
description: psd-to-spec.js 결과를 맹신하지 말고, 핵심 fill/color를 PSD 원본 레이어와 대조 필수
type: feedback
---

spec 추출 결과를 검증 없이 사용하면 안 됨.

**Why:** con15(창업비용) 테이블 헤더 fill이 spec에서 #043915로 나왔지만 PSD 실제값은 #f2fff3. 이전 세션에서 뽑은 캐시된 spec 파일을 그대로 읽은 것이 원인. 이로 인해 3번 재작업.

**How to apply:**
1. spec 파일은 매번 새로 추출 (기존 파일 재사용 금지)
2. 추출 후 핵심 rect의 fill, 텍스트 color를 PSD raw 레이어 데이터와 크로스체크
3. 특히 bg rect, header/footer rect, 뱃지 등 시각적으로 눈에 띄는 요소는 반드시 확인
4. "spec에 이렇게 나와있으니까 맞겠지" 판단 금지 — 직접 PSD 레이어 열어서 확인
