PSD 전체 파싱 (ag-psd 기반)

사용법: /parse-psd <PSD파일경로> [출력JSON경로]

1. `node /Users/aga/Downloads/프로젝트모음/psd_parser.js` 실행
2. PSD 파일 전체 레이어를 JSON으로 파싱
3. 파싱 완료 후 `_warnings` 요약 출력
4. JSON 파일 경로 알려주기

인자가 없으면 현재 프로젝트 폴더에서 .psd 파일을 자동 탐색.
출력 경로 미지정 시 PSD파일명_parsed.json으로 자동 생성.

파싱 항목: fill, stroke, borderRadius, fontSize(실제px+vw), fontFamily, textColor, tracking, leading, textAlign, opacity, fillOpacity, 좌표(px+vw+%), nested구조, zIndex, blendMode, clipping, mask, effects, smartObject, styleRuns(부분텍스트), fontCaps, underline/strikethrough.

_warnings 자동감지: MULTI_COLOR, MULTI_FONT, MULTI_SIZE, FILL_OPACITY, MASK, GRADIENT, STROKE, ASYMMETRIC_RADIUS, EFFECT_*.

실행 예시:
```bash
node /Users/aga/Downloads/프로젝트모음/psd_parser.js "코끼리카페.psd" "ec_psd_full.json"
```
