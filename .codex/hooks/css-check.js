#!/usr/bin/env node
// PostToolUse hook: CSS 금지규칙 자동 검증
// ✅ 크로스플랫폼 (Mac + Windows)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  let file = '';
  try {
    const parsed = JSON.parse(input);
    file = (parsed.tool_input && parsed.tool_input.file_path) || (parsed.tool_response && parsed.tool_response.filePath) || '';
  } catch {}
  if (!file) {
    const m = input.match(/[^\s"]+\.css/);
    if (m) file = m[0];
  }
  if (!file || !file.endsWith('.css')) { process.exit(0); return; }

  // 프로젝트 루트 찾기
  let dir = path.dirname(path.resolve(file));
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'CLAUDE.md'))) break;
    dir = path.dirname(dir);
  }
  if (!fs.existsSync(path.join(dir, 'CLAUDE.md'))) { process.exit(0); return; }

  const harness = path.join(dir, 'tools', 'harness.js');
  if (!fs.existsSync(harness)) { process.exit(0); return; }

  const page = path.basename(file, '.css');
  let result = '';
  try {
    result = execSync(`node "${harness}" --step 4 --page "${page}" --css "${file}"`, {
      encoding: 'utf8', timeout: 10000
    });
  } catch (e) {
    result = (e.stdout || '') + (e.stderr || '');
  }

  if (result.includes('ALL CLEAR')) {
    let msg = '🟢 CSS 검증 PASS';
    try {
      const css = fs.readFileSync(file, 'utf8');
      if (css.match(/[Ss]wiper/)) {
        msg = '🟢 CSS PASS | ⚠️ Swiper 감지됨 — 섹션 완료 후 harness 전체 실행 필수';
      }
      // S급: round number 감지 — 새로 추가/변경된 내용만 스캔
      let editContent = '';
      try {
        const p = JSON.parse(input);
        editContent = (p.tool_input && (p.tool_input.new_string || p.tool_input.content)) || '';
      } catch {}
      if (editContent) {
        const roundHits = [];
        const editLines = editContent.split('\n');
        for (let i = 0; i < editLines.length; i++) {
          const line = editLines[i];
          if (line.trim().startsWith('/*') || line.trim().startsWith('//')) continue;
          // 5vw, 10vw 등 5의 배수 정수 vw
          const vwMatch = line.match(/:\s*(\d+)vw\b/);
          if (vwMatch) {
            const v = parseInt(vwMatch[1]);
            if (v > 0 && v % 5 === 0 && v <= 50) {
              roundHits.push(`${vwMatch[0].trim()} (${v}vw)`);
            }
          }
          // 5%, 10% 등 5의 배수 정수 % (50%, 100%, translate, calc 제외)
          const pctMatch = line.match(/:\s*(\d+)%/);
          if (pctMatch) {
            const v = parseInt(pctMatch[1]);
            if (v > 0 && v % 5 === 0 && v !== 50 && v !== 100 && !line.includes('translate') && !line.includes('calc') && !line.includes('aspect')) {
              roundHits.push(`${pctMatch[0].trim()} (${v}%)`);
            }
          }
        }
        if (roundHits.length > 0) {
          msg += ' | ⚠️ 둥근수 의심 ' + roundHits.length + '개 — node -e로 계산했는지 확인: ' + roundHits.join(', ');
        }
      }

      // ════════════════════════════════════════════════════════════
      // STRICT RULES — CLAUDE.md / WORKFLOW.md 명시 규칙
      //   1) br{display:none} 금지                                  → block
      //   2) 구조(leaf) selector 에 aspect-ratio 박제 금지          → block
      //   3) 구조(leaf) selector 에 height:vw|px 박제 금지          → block
      //   4) 텍스트 leaf 에 white-space:nowrap 누락 의심            → warn
      //   5) section 태그 자체에 aspect-ratio | height 금지         → block
      //   6) .spacer / 빈 div / padding-bottom-only 높이메우기 금지 → block
      //   7) 흐름 wrapper 가 padding-bottom 으로만 높이 만듦         → block
      // 판정은 selector 의 가장 오른쪽 클래스(leaf)만 본다
      // height-faking 예외: leaf 동일 selector 에 /* heightSource: ... */ 주석이 있으면 통과
      // ════════════════════════════════════════════════════════════
      if (editContent) {
        const strictBlock = [];
        const strictWarn = [];

        // 섹션 prefix: con\d+_ 또는 c\d+_
        // 공통 영역 prefix: footer_, quick_, header_, contact_, nav_, menu_, gnb_, hd_, ft_
        const SEC_PREFIX = '(?:con\\d+|c\\d+|footer|quick|header|contact|nav|menu|gnb|hd|ft|main|sub\\d*|aside)';
        const STRUCT_LEAF = new RegExp(
          // 1) 섹션/공통영역 prefix + 흐름성 wrapper 이름
          '^\\.(?:con\\d+|c\\d+)$|' +
          '^\\.' + SEC_PREFIX + '_(?:wrap|wrapper|form|panel|list|inner|section|popup|rows|stage|scene|head|body|field|container|main|aside|left|right|top|bottom|grid|row|col|col_|side|area|content|frame|holder|box|spacer|gap|gutter|space)(?:_|$|\\b)|' +
          // 2) 접두어 없는 generic wrapper 이름 (전면 금지)
          '^\\.(?:stage|scene|wrap|wrapper|inner|area|content|frame|holder|box|container|field|spacer|gap|gutter|space)(?:_|$|\\b)'
        );
        const DECO_LEAF   = new RegExp(
          '^\\.' + SEC_PREFIX + '_(?:bg|img|icon|bowl|photo|naver|marker|badge|star|deco|logo|cover|mask|drink|thumb|map|divider|dot|pin|arrow|btn|button|line|shadow|smoke|particle|sticker|stamp|ornament|leaf|flower|ring|circle|panel_img|card_img)(?:_|$|\\b)'
        );
        const TEXT_LEAF   = new RegExp(
          '^\\.' + SEC_PREFIX + '_(?:title|sub|subtitle|name|addr|tel|label|value|num|phone|info|price|date|author|category|tag|badge_text|sub_text)(?:_|$|\\b)'
        );
        const MULTI_LINE  = new RegExp(
          '^\\.' + SEC_PREFIX + '_(?:desc|copy|text|caption|body_text|paragraph|message|content_text)(?:_|$|\\b)'
        );
        const EXCEPTION_LEAF = /^(\.swiper-wrapper|\.swiper-slide|\.swiper|video|\.video|\.media)$/;

        function findSelector(src, lineIdx) {
          const lines = src.split('\n');
          for (let j = lineIdx - 1; j >= Math.max(0, lineIdx - 40); j--) {
            const mm = lines[j].match(/([.#][\w\s.#:_,>+~-]+?)\s*\{/);
            if (mm) return mm[1].trim();
          }
          return '';
        }
        function getLeaf(fullSel) {
          // 콤마 분리된 그룹의 경우 각각 판정이 다를 수 있으나, 일단 첫 번째만
          const firstGroup = fullSel.split(',')[0].trim();
          const tokens = firstGroup.split(/\s+/).filter(Boolean);
          return (tokens[tokens.length - 1] || firstGroup).trim();
        }

        const editLines = editContent.split('\n');
        const fileLines = css.split('\n');

        // 1) br { display:none } 검출 (한 줄/여러 줄 둘 다)
        if (/\bbr\s*\{[^}]*display\s*:\s*none/i.test(editContent)) {
          strictBlock.push('br{display:none} 금지 (br 숨김/재해석 불가)');
        }

        function resolveSelector(line, editIdx) {
          let sel = findSelector(editContent, editIdx);
          if (!sel) {
            const idxInFile = fileLines.findIndex(l => l === line);
            if (idxInFile >= 0) sel = findSelector(css, idxInFile);
          }
          return sel;
        }

        // heightSource 주석 마커: leaf selector 의 같은 block 안에
        //   /* heightSource: panel.jpg baked, 800x600 */
        // 또는 /* allowHeightFake: <reason> */ 가 있으면 height-faking 검사 우회
        function hasHeightSourceMarker(src, lineIdx) {
          const lines = src.split('\n');
          // 해당 라인을 포함하는 CSS 블록의 본문(주석 포함)을 찾는다
          let openIdx = -1, closeIdx = -1;
          for (let j = lineIdx; j >= 0; j--) {
            if (lines[j].includes('{')) { openIdx = j; break; }
          }
          for (let j = lineIdx; j < lines.length; j++) {
            if (lines[j].includes('}')) { closeIdx = j; break; }
          }
          if (openIdx < 0 || closeIdx < 0) return false;
          const body = lines.slice(openIdx, closeIdx + 1).join('\n');
          return /\/\*[^*]*?(heightSource|allowHeightFake)\s*:[^*]*?\*\//i.test(body);
        }

        // 2) aspect-ratio on 구조 leaf  →  block (heightSource 마커 있으면 통과)
        editLines.forEach((line, i) => {
          if (!/^\s*aspect-ratio\s*:/.test(line)) return;
          const sel = resolveSelector(line, i);
          if (!sel) return;
          const leaf = getLeaf(sel);
          if (EXCEPTION_LEAF.test(leaf)) return;
          if (DECO_LEAF.test(leaf)) return;           // 이미지/장식 허용
          if (STRUCT_LEAF.test(leaf)) {
            // editContent 안에서 같은 라인 위치 → 같은 block 의 heightSource 주석 탐지
            if (hasHeightSourceMarker(editContent, i)) return;
            strictBlock.push(`aspect-ratio 박제 [${leaf}] — rltv heightChain 사용 (panel/card 면 /* heightSource: ... */ 주석 추가)`);
          }
        });

        // 3) height:vw|px|% on 구조 leaf  →  block
        editLines.forEach((line, i) => {
          if (!/^\s*(min-|max-)?height\s*:\s*[\d.]+\s*(vw|px|%)\b/.test(line)) return;
          // height: auto / height: 100% (자식 stretch) 같은 정상 케이스는 패턴에 안 걸림
          // 단 100% 만큼은 부모 height 의존이라 흐름과 무관 — 여기서도 정확값이라면 OK
          const sel = resolveSelector(line, i);
          if (!sel) return;
          const leaf = getLeaf(sel);
          if (EXCEPTION_LEAF.test(leaf)) return;
          if (DECO_LEAF.test(leaf)) return;
          if (STRUCT_LEAF.test(leaf)) {
            if (hasHeightSourceMarker(editContent, i)) return;
            strictBlock.push(`height 박제 [${leaf}] — pt/mt/pb heightChain 으로 만들 것 (정말 필요하면 /* heightSource: ... */ 명시)`);
          }
        });

        // 5) section 태그 자체에 aspect-ratio | height 박제 금지
        editLines.forEach((line, i) => {
          const isAspect = /^\s*aspect-ratio\s*:/.test(line);
          const isHeight = /^\s*(min-|max-)?height\s*:\s*[\d.]+\s*(vw|px|%)\b/.test(line);
          if (!isAspect && !isHeight) return;
          const sel = resolveSelector(line, i);
          if (!sel) return;
          // 첫 토큰 그룹의 마지막 토큰이 'section' 이거나 'section.foo' 이면 hit
          const firstGroup = sel.split(',')[0].trim();
          const lastTok = firstGroup.split(/\s+/).pop() || '';
          if (/^section(\.[^\s]+)?$/i.test(lastTok)) {
            if (hasHeightSourceMarker(editContent, i)) return;
            strictBlock.push(`section 태그 자체에 ${isAspect ? 'aspect-ratio' : 'height'} 박제 [${lastTok}] — section 은 흐름 컨테이너로 두고 내부 wrapper/heightChain 사용`);
          }
        });

        // 6) spacer / 빈 wrapper 패턴 — selector 가 .spacer / .gap / .gutter / .space 이거나
        //    이름에 _spacer / _gap / _gutter 가 들어가면 height-faking 의도로 본다
        editLines.forEach((line, i) => {
          const isHeight = /^\s*(min-|max-)?height\s*:/.test(line);
          const isPadBot = /^\s*padding-bottom\s*:/.test(line);
          if (!isHeight && !isPadBot) return;
          const sel = resolveSelector(line, i);
          if (!sel) return;
          const leaf = getLeaf(sel);
          if (/(^|_)(spacer|gap|gutter|space|filler|placeholder)(_|$)/i.test(leaf)) {
            strictBlock.push(`spacer/gap 류 selector [${leaf}] 에 height/padding-bottom 박제 — 빈 div 로 높이 메우기 금지. 형제 mt 로 간격을 줄 것`);
          }
        });

        // 7) wrapper 가 padding-bottom 만으로 높이를 만든다 (=흐름 자식이 absol 만 있을 때 패턴)
        //    selector 가 STRUCT_LEAF 이고 같은 block 안에서 padding-bottom 이 있고 height 가 없다면 경고
        //    실제 absol-only 자식 여부는 plan-checker 에서 판정. 여기선 흐름 wrapper 의 padding-bottom 박제만 막음.
        editLines.forEach((line, i) => {
          if (!/^\s*padding-bottom\s*:\s*[\d.]+\s*(vw|px|%)\b/.test(line)) return;
          const sel = resolveSelector(line, i);
          if (!sel) return;
          const leaf = getLeaf(sel);
          if (EXCEPTION_LEAF.test(leaf)) return;
          if (DECO_LEAF.test(leaf)) return;
          if (TEXT_LEAF.test(leaf) || MULTI_LINE.test(leaf)) return;
          // pt/pb spacer 형태 클래스만 정밀 차단 (전체 wrapper 차단은 false positive 큼)
          if (/_(pb|pt)$/i.test(leaf) || /^\.(pb|pt)$/i.test(leaf)) {
            if (hasHeightSourceMarker(editContent, i)) return;
            strictBlock.push(`pt/pb spacer leaf [${leaf}] 에 padding-bottom 박제 — 섹션 자체의 padding 또는 형제 mt 로 처리`);
          }
        });

        // 4) text leaf 에 white-space:nowrap 누락 (warn)
        const blockRe = /([.][^{}]+?)\s*\{([^}]*)\}/g;
        let mm;
        while ((mm = blockRe.exec(editContent)) !== null) {
          const rawSel = mm[1].trim().split('\n').pop().trim();
          const body = mm[2];
          const leaf = getLeaf(rawSel);
          if (!TEXT_LEAF.test(leaf)) continue;
          if (MULTI_LINE.test(leaf)) continue;      // 여러 줄 의도 셀렉터 제외
          if (!/font-size/.test(body)) continue;
          if (/white-space\s*:/.test(body)) continue;
          strictWarn.push(`${leaf}: nowrap 누락 의심`);
        }

        // block 이 있으면 즉시 차단
        if (strictBlock.length > 0) {
          console.log(JSON.stringify({
            decision: 'block',
            reason: 'CSS 구조 규칙 위반 (strict)',
            systemMessage: '🔴 STRICT: ' + strictBlock.join(' | ')
          }));
          return;
        }
        if (strictWarn.length > 0) {
          msg += ' | ⚠️ ' + strictWarn.slice(0, 5).join(', ');
        }
      }
    } catch {}
    console.log(JSON.stringify({ systemMessage: msg }));
  } else if (result.includes('FIX REQUIRED')) {
    const fails = result.split('\n').filter(l => l.trim().startsWith('- ')).slice(0, 3).map(l => l.trim()).join(' ');
    console.log(JSON.stringify({ decision: 'block', reason: 'CSS 금지규칙 위반', systemMessage: `🔴 ${fails}` }));
  } else {
    console.log(JSON.stringify({ systemMessage: '⚠️ 하네스 실행 결과 확인 필요' }));
  }
});
