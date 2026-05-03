#!/usr/bin/env node
// PostToolUse hook: HTML/CSS/JS 수정 전 plan-checker 통과 여부 검증
// plan.json 없거나 plan-checker 미통과 시 block
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

  // 프로젝트 루트 찾기
  let dir = path.dirname(path.resolve(file || '.'));
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'CLAUDE.md'))) break;
    dir = path.dirname(dir);
  }
  if (!fs.existsSync(path.join(dir, 'CLAUDE.md'))) { process.exit(0); return; }

  // plan-checker 없으면 패스
  const checker = path.join(dir, 'tools', 'plan-checker.js');
  if (!fs.existsSync(checker)) { process.exit(0); return; }

  // 페이지명 추출
  let page = '';
  if (file.endsWith('.css')) page = path.basename(file, '.css');
  else if (file.includes('index.html')) page = path.basename(path.dirname(file));
  else if (file.endsWith('.js')) page = path.basename(file, '.js');
  else { process.exit(0); return; }

  // 공통 파일 패스
  if (['script', 'common', 'header', 'footer', 'reset', 'base', 'util'].includes(page)) {
    process.exit(0); return;
  }

  // tools/ 디렉토리 파일 패스 (도구 소스코드 수정은 섹션 작업 아님)
  const normFile = file.replace(/\\/g, '/');
  if (normFile.includes('/tools/') || normFile.includes('/.claude/')) {
    process.exit(0); return;
  }

  // 편집 내용에서 섹션 번호 추출
  let content = '';
  try {
    const parsed = JSON.parse(input);
    content = (parsed.tool_input && (parsed.tool_input.new_string || parsed.tool_input.content)) || '';
  } catch {}

  let section = '';
  // 파일 경로에서 먼저
  const fileMatch = file.match(/con(\d+)/);
  if (fileMatch) section = fileMatch[1];
  // 편집 내용에서
  if (!section && content) {
    const matches = content.match(/[a-z]*-?con(\d+)|\.c(\d+)/g);
    if (matches) {
      const nums = matches.map(m => { const n = m.match(/(\d+)/); return n ? n[1] : null; }).filter(Boolean);
      // 가장 빈번한 숫자
      const freq = {};
      nums.forEach(n => freq[n] = (freq[n] || 0) + 1);
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) section = sorted[0][0];
    }
  }
  if (!section) { process.exit(0); return; }

  // plan.json 경로 탐색 (zero-padded 포함)
  const pad = section.padStart(2, '0');
  let planDir = path.join(dir, '.planning', `${page}_con${section}`);
  if (!fs.existsSync(planDir)) planDir = path.join(dir, '.planning', `${page}_con${pad}`);
  const planFile = path.join(planDir, 'plan.json');

  if (!fs.existsSync(planFile)) {
    console.log(JSON.stringify({
      decision: 'block',
      reason: `🔴 PLAN GATE BLOCKED — ${page} con${section}의 plan.json이 없습니다.\n\n경로: ${planFile}\n\n먼저 spec-to-plan으로 초안을 생성하세요:\n  node tools/spec-to-plan.js <spec.json> --page ${page} --prev <N> --out ${planFile}\n\n그 후 plan-checker 통과:\n  node tools/plan-checker.js ${planFile}`
    }));
    process.exit(0); return;
  }

  // generatedBy 체크 — spec-to-plan으로 생성된 plan만 허용
  try {
    const planData = JSON.parse(fs.readFileSync(planFile, 'utf8'));
    if (!planData.generatedBy || !String(planData.generatedBy).startsWith('spec-to-plan')) {
      console.log(JSON.stringify({
        decision: 'block',
        reason: `🔴 PLAN GATE BLOCKED — ${page} con${section}의 plan.json이 spec-to-plan으로 생성되지 않았습니다.\n\n수작업 plan.json 금지. 반드시 spec-to-plan으로 초안을 생성하세요:\n  node tools/spec-to-plan.js <spec.json> --page ${page} --prev <N> --out ${planFile}`
      }));
      process.exit(0); return;
    }
  } catch {}

  // plan-checker 실행
  let result = '';
  try {
    result = execSync(`node "${checker}" "${planFile}"`, { encoding: 'utf8', timeout: 10000 });
  } catch (e) {
    result = (e.stdout || '') + (e.stderr || '');
  }

  if (result.includes('PLAN APPROVED')) {
    process.exit(0);
  } else {
    const errors = result.split('\n').filter(l => l.includes('❌')).slice(0, 5).join(' ');
    console.log(JSON.stringify({
      decision: 'block',
      reason: `🔴 PLAN GATE BLOCKED — ${page} con${section}의 plan-checker 미통과.\n\n${errors}\n\n수정 후 재실행: node tools/plan-checker.js ${planFile}`
    }));
  }
});
