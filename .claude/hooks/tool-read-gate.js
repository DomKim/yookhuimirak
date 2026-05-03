#!/usr/bin/env node
// PostToolUse hook: 도구 소스코드(.js) 읽기 방지
// tools/*.js를 Read하면 block — 실행만 허용
// ✅ 크로스플랫폼 (Mac + Windows)

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  let tool = '', file = '';
  try {
    const parsed = JSON.parse(input);
    tool = parsed.tool_name || '';
    file = (parsed.tool_input && parsed.tool_input.file_path) || '';
  } catch {}

  if (tool !== 'Read') { process.exit(0); return; }

  // tools/*.js 패턴 체크 (경로 구분자 양쪽 지원)
  const normalized = file.replace(/\\/g, '/');
  if (normalized.match(/\/tools\/[^/]+\.js$/)) {
    console.log(JSON.stringify({
      decision: 'block',
      reason: '🔴 TOOL READ GATE — 도구 소스코드 읽기 금지!\n\n소스를 읽지 말고 실행만 하세요:\n  harness: node tools/harness.js --psd <parsed.json> --section <conXX> --page <page>\n  plan-checker: node tools/plan-checker.js <plan.json>\n  image-analyzer: node tools/image-analyzer.js <경로> --prefix <conXX>\n  psd-to-spec: node tools/psd-to-spec.js <parsed.json> <섹션명>\n  position-checker: node tools/position-checker.js <spec.json> <url> <selector>'
    }));
    process.exit(0); return;
  }

  process.exit(0);
});
