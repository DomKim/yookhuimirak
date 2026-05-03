#!/usr/bin/env node
// PostToolUse hook: plan.json 작성 시 기존 통과된 plan.json을 먼저 읽었는지 검증
// ✅ 크로스플랫폼 (Mac + Windows)

const fs = require('fs');
const path = require('path');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  let file = '';
  try {
    const parsed = JSON.parse(input);
    file = (parsed.tool_input && parsed.tool_input.file_path) || (parsed.tool_response && parsed.tool_response.filePath) || '';
  } catch {}

  // plan.json 파일이 아니면 패스
  if (!file.endsWith('plan.json')) { process.exit(0); return; }
  if (!file.includes('.planning')) { process.exit(0); return; }

  // spec-to-plan으로 생성된 plan이면 형식 이미 올바름 → 스킵
  let content = '';
  try {
    const parsed = JSON.parse(input);
    content = (parsed.tool_input && parsed.tool_input.content) || '';
  } catch {}
  if (content.includes('"generatedBy"') && content.includes('spec-to-plan')) {
    process.exit(0); return;
  }
  // 이미 파일에 generatedBy가 있으면 스킵
  try {
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, 'utf8');
      if (existing.includes('"generatedBy"') && existing.includes('spec-to-plan')) {
        process.exit(0); return;
      }
    }
  } catch {}

  // 프로젝트 루트 찾기
  let dir = path.dirname(path.resolve(file));
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'CLAUDE.md'))) break;
    dir = path.dirname(dir);
  }
  if (!fs.existsSync(path.join(dir, 'CLAUDE.md'))) { process.exit(0); return; }

  // 템플릿 + 기존 plan.json 탐색
  const templatePath = path.join(dir, '.planning', '_template', 'plan.json');
  const planningDir = path.join(dir, '.planning');
  let existing = '';

  if (fs.existsSync(planningDir)) {
    try {
      for (const d of fs.readdirSync(planningDir, { withFileTypes: true })) {
        if (!d.isDirectory() || d.name === '_template') continue;
        if (path.join(planningDir, d.name) === path.dirname(path.resolve(file))) continue;
        const p = path.join(planningDir, d.name, 'plan.json');
        if (fs.existsSync(p)) { existing = p; break; }
      }
    } catch {}
  }

  let readList = '';
  if (fs.existsSync(templatePath)) readList += `  1. ${templatePath} (★ wrapper/children 패턴 필수 확인)`;
  if (existing) readList += `\n  2. ${existing} (기존 통과 예시)`;

  if (readList) {
    console.log(JSON.stringify({
      decision: 'block',
      reason: `🔴 PLAN FORMAT GATE — 수작업 plan.json 초안 작성은 금지입니다.\n\n반드시 아래 파일을 먼저 읽고 형식을 파악하세요:\n${readList}\n\n그리고 plan.json 초안은 직접 쓰지 말고 아래 명령으로 생성하세요:\n  node tools/spec-to-plan.js <spec.json> --page <page> --prev <N> --out ${file}\n\n★ wrapper/children 패턴을 반드시 따를 것 (flat 나열 금지)`
    }));
    process.exit(0); return;
  }

  process.exit(0);
});
