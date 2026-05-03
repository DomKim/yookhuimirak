#!/usr/bin/env node
// PostToolUse hook: 워크플로우 순서 강제
// harness step 1~2 실행 없이 코딩 진입 차단
// ✅ 크로스플랫폼 (Mac + Windows)

const fs = require('fs');
const path = require('path');
const workflow = require('../../tools/workflow-enforce');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  let tool = '', file = '';
  try {
    const parsed = JSON.parse(input);
    tool = parsed.tool_name || '';
    file = (parsed.tool_input && parsed.tool_input.file_path) || (parsed.tool_response && parsed.tool_response.filePath) || '';
  } catch {}

  // Edit/Write가 아니면 패스
  if (tool !== 'Edit' && tool !== 'Write') { process.exit(0); return; }
  if (!file.endsWith('.css') && !file.endsWith('.html')) { process.exit(0); return; }

  // 프로젝트 루트 찾기
  let dir = path.dirname(path.resolve(file));
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'CLAUDE.md'))) break;
    dir = path.dirname(dir);
  }
  if (!fs.existsSync(path.join(dir, 'CLAUDE.md'))) { process.exit(0); return; }

  // 페이지명 추출
  let page = '';
  if (file.endsWith('.css')) page = path.basename(file, '.css');
  else if (file.includes('index.html')) page = path.basename(path.dirname(file));
  else { process.exit(0); return; }

  if (['script', 'common', 'header', 'footer', 'reset', 'base'].includes(page)) {
    process.exit(0); return;
  }

  // 섹션 번호 추출
  let section = '';
  const fileMatch = file.match(/con(\d+)/);
  if (fileMatch) section = fileMatch[1];

  if (!section) {
    let content = '';
    try {
      const parsed = JSON.parse(input);
      content = (parsed.tool_input && (parsed.tool_input.new_string || parsed.tool_input.content)) || '';
    } catch {}
    if (content) {
      const matches = content.match(/[a-z]*-?con(\d+)|\.c(\d+)/g);
      if (matches) {
        const nums = matches.map(m => { const n = m.match(/(\d+)/); return n ? n[1] : null; }).filter(Boolean);
        const freq = {};
        nums.forEach(n => freq[n] = (freq[n] || 0) + 1);
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) section = sorted[0][0];
      }
    }
  }
  if (!section) { process.exit(0); return; }

  const pad = section.padStart(2, '0');
  const sectionKey = 'con' + pad;


  // S급: 캔버스 검증 — spec canvas vs CLAUDE.md 캔버스
  const planningDir = path.join(dir, '.planning');
  const specCandidates = [
    path.join(planningDir, 'con' + pad, 'spec_main_con' + pad + '.json'),
    path.join(planningDir, 'con' + section, 'spec_main_con' + section + '.json'),
    path.join(planningDir, 'con' + pad, 'spec_' + page + '_con' + pad + '.json'),
    path.join(planningDir, 'con' + section, 'spec_' + page + '_con' + section + '.json'),
    path.join(planningDir, page + '_con' + pad, 'spec_main_con' + pad + '.json'),
    path.join(planningDir, page + '_con' + pad, 'spec_' + page + '_con' + pad + '.json')
  ];
  let specCanvas = null;
  for (const sf of specCandidates) {
    if (fs.existsSync(sf)) {
      try { specCanvas = JSON.parse(fs.readFileSync(sf, 'utf8')).canvas; } catch {}
      break;
    }
  }
  if (specCanvas) {
    let claudeCanvas = null;
    const claudeMd = path.join(dir, 'CLAUDE.md');
    if (fs.existsSync(claudeMd)) {
      const cm = fs.readFileSync(claudeMd, 'utf8');
      const match = cm.match(/캔버스\s*(?:크기)?\**\s*[:：]?\s*(\d+)/);
      if (match) claudeCanvas = parseInt(match[1]);
    }
    if (claudeCanvas && specCanvas !== claudeCanvas) {
      console.log(JSON.stringify({
        decision: 'block',
        reason: '🔴 CANVAS MISMATCH — spec canvas(' + specCanvas + ') ≠ CLAUDE.md(' + claudeCanvas + ')\n\nspec.json의 canvas를 ' + claudeCanvas + '로 패치하세요:\n  node -e "const fs=require(\'fs\');const p=\'<spec.json>\';const j=JSON.parse(fs.readFileSync(p));j.canvas=' + claudeCanvas + ';fs.writeFileSync(p,JSON.stringify(j,null,2))"'
      }));
      process.exit(0); return;
    }
  }

  // #13 개선: style.css 편집 시 main 상태도 허용 (CSS는 main 워크플로우에서 관리)
  const pagesToCheck = [page];
  if (page === 'style') pagesToCheck.push('main');

  const hasPrep = pagesToCheck.some(p => workflow.hasState(dir, sectionKey, 'harness-prep', p));
  if (!hasPrep) {
    console.log(JSON.stringify({
      decision: 'block',
      reason: `🔴 WORKFLOW GATE — ${sectionKey} harness-prep 상태가 없습니다.\n\n워크플로우 순서:\n  STEP 0: 디자인 시안 확인\n  STEP 1~2: harness 준비 단계 실행\n  STEP 2: ASCII 다이어그램 → 유저 컨펌\n  STEP 3: 코딩\n\n먼저 실행하세요:\n  node tools/harness.js --psd <parsed.json> --section ${sectionKey} --page ${page} --step 1\n  node tools/harness.js --psd <parsed.json> --section ${sectionKey} --page ${page} --step 2\n\n완료 후 상태 마킹:\n  node tools/workflow-enforce.js harness-prep --section ${sectionKey} --page ${page}\n\n이 프로젝트는 레거시 tmp 플래그가 아니라 repo 상태(.workflow-state)로 선행 단계를 강제합니다.`
    }));
    process.exit(0); return;
  }

  process.exit(0);
});
