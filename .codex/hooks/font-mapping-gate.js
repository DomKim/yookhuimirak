#!/usr/bin/env node
// PostToolUse hook: fontFamily 전수 확인 강제 (S급)
// spec에 텍스트가 있는 섹션은 font-mapping.json 없으면 코딩 차단

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  let tool = '', file = '';
  try {
    const parsed = JSON.parse(input);
    tool = parsed.tool_name || '';
    file = (parsed.tool_input && parsed.tool_input.file_path) || '';
  } catch { process.exit(0); return; }

  if (tool !== 'Edit' && tool !== 'Write') { process.exit(0); return; }
  if (!file.endsWith('.css') && !file.endsWith('.html')) { process.exit(0); return; }

  // 프로젝트 루트
  let dir = path.dirname(path.resolve(file));
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'CLAUDE.md'))) break;
    dir = path.dirname(dir);
  }
  if (!fs.existsSync(path.join(dir, 'CLAUDE.md'))) { process.exit(0); return; }

  // 섹션 추출
  let section = '';
  let content = '';
  try {
    const parsed = JSON.parse(input);
    content = (parsed.tool_input && (parsed.tool_input.new_string || parsed.tool_input.content)) || '';
  } catch {}
  const matches = (content + file).match(/con(\d+)/g);
  if (matches) {
    const nums = matches.map(m => m.match(/(\d+)/)[1]);
    const freq = {};
    nums.forEach(n => freq[n] = (freq[n] || 0) + 1);
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    if (sorted.length) section = sorted[0][0];
  }
  if (!section) { process.exit(0); return; }

  const pad = section.padStart(2, '0');

  // 페이지명
  let page = '';
  if (file.endsWith('.css')) page = path.basename(file, '.css');
  else if (file.includes('index.html')) page = path.basename(path.dirname(file));
  if (['script', 'common', 'header', 'footer', 'reset', 'base'].includes(page)) { process.exit(0); return; }

  // #13 개선: style 페이지는 main 경로도 탐색
  const pageVariants = [page];
  if (page === 'style') pageVariants.push('main');

  // font-mapping.json 경로 후보들
  const candidates = [];
  for (const pg of pageVariants) {
    candidates.push(
      path.join(dir, '.planning', `${pg}_con${pad}`, 'font-mapping.json'),
      path.join(dir, '.planning', `con${pad}`, 'font-mapping.json'),
      path.join(dir, '.planning', `con${section}`, 'font-mapping.json')
    );
  }

  // S급: font-mapping.json 내용 검증 — mapping이 비어있으면 차단
  const foundFile = candidates.find(c => fs.existsSync(c));
  if (foundFile) {
    try {
      const fm = JSON.parse(fs.readFileSync(foundFile, 'utf8'));
      if (fm.verified && fm.mapping && Object.keys(fm.mapping).length > 0) {
        process.exit(0); return; // mapping entries 있으면 통과
      }
    } catch {}
    console.log(JSON.stringify({
      decision: 'block',
      reason: '🔴 FONT MAPPING GATE — font-mapping.json의 mapping이 비어있습니다.\n\nfontFamily 전수 확인 후 실제 매핑을 기록하세요:\n  {"verified":true,"mapping":{"PSD폰트명":"CSS font-family"}}'
    }));
    process.exit(0); return;
  }

  // spec 파일에 텍스트가 있는지 확인 (텍스트 없으면 패스)
  const specCandidates = [
    path.join(dir, '.planning', `con${pad}`, `spec_${page}_con${pad}.json`),
    path.join(dir, '.planning', `con${section}`, `spec_${page}_con${section}.json`),
    path.join(dir, '.planning', `con${section}`, `spec_main_con${section}.json`),
    path.join(dir, '.planning', `con${pad}`, `spec_main_con${pad}.json`)
  ];

  let hasTexts = false;
  for (const sf of specCandidates) {
    if (fs.existsSync(sf)) {
      try {
        const spec = JSON.parse(fs.readFileSync(sf, 'utf8'));
        if (spec.texts && spec.texts.length > 0) hasTexts = true;
      } catch {}
      break;
    }
  }

  if (!hasTexts) { process.exit(0); return; }

  console.log(JSON.stringify({
    decision: 'block',
    reason: `🔴 FONT MAPPING GATE — con${pad} fontFamily 전수 확인이 필요합니다.

먼저 실행하세요:
  node -e "const j=require('<spec.json>');const m=new Map();j.texts.forEach(t=>(t.segments||[]).forEach(s=>{const f=s.fontFamily||'?';m.set(f,(m.get(f)||0)+1)}));[...m].sort((a,b)=>b[1]-a[1]).forEach(([f,c])=>console.log(c+'x',f))"

매핑 결과를 저장하세요:
  echo '{"verified":true,"mapping":{}}' > .planning/con${section}/font-mapping.json

★ fontFamily → CSS font-family 매핑을 확인한 후에만 코딩 진행 가능`
  }));
  process.exit(0);
});
