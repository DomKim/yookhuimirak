#!/usr/bin/env node
// PostToolUse hook: 유저 컨펌 없이 코딩 방지 + harness 전체 실행 강제
// /tmp/claude_workflow/ (Mac) 또는 %TEMP%/claude_workflow/ (Win) 에 상태 플래그 관리
// ✅ 크로스플랫폼 (Mac + Windows)

const fs = require('fs');
const path = require('path');
const os = require('os');
const workflow = require('../../tools/workflow-enforce');

const GATE = path.join(os.tmpdir(), 'claude_workflow');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  let file = '';
  try {
    const parsed = JSON.parse(input);
    file = (parsed.tool_input && parsed.tool_input.file_path) || (parsed.tool_response && parsed.tool_response.filePath) || '';
  } catch {}

  // CSS/HTML 아니면 패스
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

  try { fs.mkdirSync(GATE, { recursive: true }); } catch {}

  // === 1. 유저 컨펌 체크 ===
  // 편집 내용에서 섹션 번호 추출
  let content = '';
  try {
    const parsed = JSON.parse(input);
    content = (parsed.tool_input && (parsed.tool_input.new_string || parsed.tool_input.content || parsed.tool_input.old_string)) || '';
  } catch {}

  let section = '';
  const matches = (content.match(/[a-z]*-?con(\d+)|\.c(\d+)/g) || []);
  const nums = matches.map(m => { const n = m.match(/(\d+)/); return n ? n[1] : null; }).filter(Boolean);
  const freq = {};
  nums.forEach(n => freq[n] = (freq[n] || 0) + 1);
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) section = sorted[0][0];

  if (section) {
    const pad = section.padStart(2, '0');
    const sectionKey = 'con' + pad;
    let planDir = path.join(dir, '.planning', `${page}_con${section}`);
    if (!fs.existsSync(planDir)) planDir = path.join(dir, '.planning', `${page}_con${pad}`);

    const planFile = path.join(planDir, 'plan.json');
    // #13 개선: style.css 편집 시 main 상태도 허용
    const pagesToCheck = [page];
    if (page === 'style') pagesToCheck.push('main');

    const hasApproval = pagesToCheck.some(p => workflow.hasState(dir, sectionKey, 'approved', p));
    if (!hasApproval && fs.existsSync(planFile)) {
      console.log(JSON.stringify({
        decision: 'block',
        reason: `🔴 CONFIRM GATE — ${sectionKey} 유저 컨펌 상태가 없습니다.\n\nASCII 다이어그램 + 수치표를 유저에게 보여주고 승인 받은 뒤:\n  node tools/workflow-enforce.js approve --section ${sectionKey} --page ${page}\n\n이 프로젝트는 레거시 tmp 플래그가 아니라 repo 상태(.workflow-state)로 승인 여부를 강제합니다.`
      }));
      process.exit(0); return;
    }

    // A급 강제: approve가 plan.json보다 오래되면 재승인 필요
    if (hasApproval && fs.existsSync(planFile)) {
      try {
        // timestamp 검증: 어느 페이지 기준이든 approve 파일 찾기
        const approvedPage = pagesToCheck.find(p => workflow.hasState(dir, sectionKey, 'approved', p));
        const approveFile = workflow.stateFile(dir, sectionKey, 'approved', approvedPage);
        const planMtime = fs.statSync(planFile).mtimeMs;
        const approveMtime = fs.statSync(approveFile).mtimeMs;
        if (planMtime > approveMtime) {
          console.log(JSON.stringify({
            decision: 'block',
            reason: `🔴 CONFIRM GATE — ${sectionKey} plan.json이 승인 이후 수정되었습니다.\n\nplan 변경 후 재승인 필수:\n  1. ASCII 다이어그램 + 수치표 유저 재확인\n  2. node tools/workflow-enforce.js approve --section ${sectionKey} --page ${page}`
          }));
          process.exit(0); return;
        }
      } catch {}
    }
  }

  // === 2. 코딩 중 → needs_harness 플래그 세팅 ===
  try { fs.writeFileSync(path.join(GATE, `${page}_needs_harness`), page); } catch {}
  process.exit(0);
});
