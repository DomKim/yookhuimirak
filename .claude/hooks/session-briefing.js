#!/usr/bin/env node
// 세션 시작 시 자동 환경 검증 + 프로젝트 상태 브리핑
// .claude/settings.json SessionStart hook에서 호출
// ⚠️ 프로젝트 독립적 — 도구/페이지/패턴 하드코딩 없음
// ✅ 크로스플랫폼 (Mac + Windows)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIR = path.resolve(__dirname, '..', '..');

// ═══ 유틸 ═══
function cmdExists(cmd) {
  try {
    execSync(process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch { return false; }
}
function nodeVersion() {
  try { return execSync('node -v', { encoding: 'utf8' }).trim(); } catch { return null; }
}
function countPattern(file, pattern) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    return (content.match(new RegExp(pattern, 'g')) || []).length;
  } catch { return 0; }
}
function globFiles(dir, ext) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(ext)) results.push(path.join(dir, e.name));
    }
  } catch {}
  return results;
}
function grepFile(file, regex) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(regex);
    return matches || [];
  } catch { return []; }
}

// ═══ 1. 환경 자동 검증 ═══
let checks = '';
let fails = 0;

if (cmdExists('jq')) {
  checks += '\n  ✅ jq 설치됨';
} else {
  checks += '\n  ❌ jq 미설치 — brew install jq (Mac) / choco install jq (Win)';
  fails++;
}

const nv = nodeVersion();
if (nv) {
  checks += `\n  ✅ node 설치됨 (${nv})`;
} else {
  checks += '\n  ❌ node 미설치';
  fails++;
}

// 도구 파일 확인
const toolsDir = path.join(DIR, 'tools');
let toolCount = 0;
if (fs.existsSync(toolsDir)) {
  for (const f of globFiles(toolsDir, '.js')) {
    const name = path.basename(f);
    if (name.startsWith('test-')) continue;
    checks += `\n  ✅ ${name}`;
    toolCount++;
  }
}
if (toolCount === 0) checks += '\n  ⚠️ tools/ 에 도구 없음';

// npm 모듈 자동 설치 (playwright 등)
const requiredModules = ['playwright', 'sharp', 'ag-psd'];
for (const mod of requiredModules) {
  try {
    require.resolve(mod);
    checks += `\n  ✅ ${mod} 설치됨`;
  } catch {
    checks += `\n  ⚠️ ${mod} 미설치 — 자동 설치 중...`;
    try {
      execSync(`cd "${DIR}" && npm install ${mod}`, { encoding: 'utf8', timeout: 120000 });
      // playwright는 브라우저도 설치 필요
      if (mod === 'playwright') {
        execSync('npx playwright install chromium', { encoding: 'utf8', timeout: 120000 });
      }
      checks += ` ✅ 완료`;
    } catch (e) {
      checks += `\n  ❌ ${mod} 설치 실패 — 수동 설치 필요: npm install ${mod}`;
      fails++;
    }
  }
}

// PUBLISHING_CLAUDE_TEMPLATE.md 확인
let templatePath = '';
for (const p of [path.join(DIR, 'tools', 'PUBLISHING_CLAUDE_TEMPLATE.md'), path.join(DIR, 'PUBLISHING_CLAUDE_TEMPLATE.md')]) {
  if (fs.existsSync(p)) { templatePath = p; break; }
}
if (templatePath) {
  const ruleCount = countPattern(templatePath, '❌');
  checks += `\n  ✅ 규칙 파일 (❌ ${ruleCount}개 금지규칙)`;
} else {
  checks += '\n  ❌ PUBLISHING_CLAUDE_TEMPLATE.md 없음';
  fails++;
}

// ═══ 2. Hook 자동 검증 ═══
let hookCheck = '  ⚠️ hook 검증 스킵 (JS 모드)';
const cssCheckHook = path.join(DIR, '.claude', 'hooks', 'css-check.js');
if (fs.existsSync(cssCheckHook)) {
  const cssFiles = globFiles(path.join(DIR, 'css'), '.css');
  if (cssFiles.length > 0) {
    try {
      const result = execSync(`node "${cssCheckHook}"`, {
        encoding: 'utf8',
        input: JSON.stringify({ tool_input: { file_path: cssFiles[0] } }),
        timeout: 10000
      });
      if (result.includes('CSS 검증 PASS') || result.includes('CSS PASS')) {
        hookCheck = '  ✅ css-check.js 정상 (🟢 PASS)';
      } else if (result.includes('block')) {
        hookCheck = '  ✅ css-check.js 정상 작동 (위반 감지→block 동작 확인)';
      } else {
        hookCheck = '  ⚠️ css-check.js 실행 결과 확인 필요';
      }
    } catch { hookCheck = '  ❌ css-check.js 실행 실패'; fails++; }
  }
}

// ═══ 3. 하네스 자동 검증 ═══
let harnessCheck = '  ⚠️ harness 테스트 스킵 (파일 부재)';
const harnessPath = path.join(DIR, 'tools', 'harness.js');
const cssFiles = globFiles(path.join(DIR, 'css'), '.css');
if (fs.existsSync(harnessPath) && cssFiles.length > 0) {
  const page = path.basename(cssFiles[0], '.css');
  try {
    const result = execSync(`node "${harnessPath}" --step 4 --page "${page}" --css "${cssFiles[0]}"`, {
      encoding: 'utf8', timeout: 15000
    });
    if (result.includes('ALL CLEAR')) {
      harnessCheck = '  ✅ harness step4 정상 (🟢 ALL CLEAR)';
    } else if (result.includes('FIX REQUIRED')) {
      const failLines = result.split('\n').filter(l => l.trim().startsWith('- ')).slice(0, 3).join(' ');
      harnessCheck = `  ⚠️ harness 위반: ${failLines}`;
    }
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    if (out.includes('FIX REQUIRED')) {
      const failLines = out.split('\n').filter(l => l.trim().startsWith('- ')).slice(0, 3).join(' ');
      harnessCheck = `  ⚠️ harness 위반: ${failLines}`;
    } else {
      harnessCheck = '  ❌ harness 실행 실패';
      fails++;
    }
  }
}

// ═══ 4. 프로젝트 상태 파악 ═══
const projectName = path.basename(DIR);
let lastSection = '';
let htmlSections = '';
let imgSections = '';

// CSS에서 마지막 섹션
for (const cf of globFiles(path.join(DIR, 'css'), '.css')) {
  const matches = grepFile(cf, /[Cc][Oo][Nn][0-9]+/g);
  if (matches.length > 0) {
    const sorted = matches.sort();
    lastSection = `${sorted[sorted.length - 1]} (${path.basename(cf)})`;
  }
}

// HTML 구현 섹션
const templateDir = path.join(DIR, 'theme', 'design', 'template');
if (fs.existsSync(templateDir)) {
  try {
    for (const d of fs.readdirSync(templateDir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const indexPath = path.join(templateDir, d.name, 'index.html');
      if (!fs.existsSync(indexPath)) continue;
      const secs = [...new Set(grepFile(indexPath, /[a-z]*-?con[0-9]+/g))].sort().join(',');
      if (secs) htmlSections += `\n    ${d.name}: ${secs}`;
    }
  } catch {}
}

// 이미지 폴더
const imagesDir = path.join(DIR, 'images');
if (fs.existsSync(imagesDir)) {
  try {
    for (const d of fs.readdirSync(imagesDir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const files = fs.readdirSync(path.join(imagesDir, d.name));
      const secs = [...new Set(files.map(f => { const m = f.match(/con[0-9]+/); return m ? m[0] : null; }).filter(Boolean))].sort().slice(-3).join(',');
      if (secs) imgSections += `\n    ${d.name}: ${secs}`;
    }
  } catch {}
}

// PSD parsed.json 목록
let psdFiles = '';
const psdDir = path.join(DIR, 'psd');
if (fs.existsSync(psdDir)) {
  try {
    const parsed = fs.readdirSync(psdDir).filter(f => f.endsWith('_parsed.json')).sort();
    for (const f of parsed) {
      // 섹션 목록 추출
      try {
        const data = JSON.parse(fs.readFileSync(path.join(psdDir, f), 'utf8'));
        const sections = (data.layers || [])
          .filter(l => l.kind === 'group' && /con\d+/i.test(l.name))
          .map(l => l.name).sort().join(',');
        psdFiles += `\n    psd/${f}: ${sections || '(섹션 없음)'}`;
      } catch {
        psdFiles += `\n    psd/${f}`;
      }
    }
  } catch {}
}

// ═══ 4-2. 프로젝트 형태 감지 (Landing vs Brand) ═══
// 판정 기준: theme/design/template/ 하위에 sub\d+ 폴더가 있으면 Brand, 없으면 Landing
let projectType = 'Unknown (theme/design/template/ 없음)';
let subList = '';
try {
  const tmplDir = path.join(DIR, 'theme/design/template');
  if (fs.existsSync(tmplDir)) {
    const subs = fs.readdirSync(tmplDir).filter(n => /^sub\d+$/i.test(n)).sort();
    if (subs.length > 0) {
      projectType = `Brand (브랜드형, 서브페이지 ${subs.length}개)`;
      subList = `  서브: ${subs.join(', ')}\n`;
    } else {
      projectType = 'Landing (랜딩 원페이지)';
    }
  }
} catch {}
const projectTypeBlock =
  `📐 프로젝트 형태: ${projectType}\n` +
  subList +
  `  ℹ️ 모든 프로젝트는 Landing(원페이지 앵커) 또는 Brand(메인+subNN 서브페이지) 중 하나\n` +
  `  자세한 구조/판정 규칙: .claude/PROJECT_TYPES.md`;

// ═══ 5. 최종 출력 ═══
const status = fails > 0 ? `🔴 환경 문제 ${fails}개 — 수정 필요` : '✅ 환경 정상';

const output = {
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: `📋 세션 자동 검증 완료\n\n${status}\n\n🔧 환경 검증:${checks}\n\n🪝 Hook 검증:\n${hookCheck}\n\n🏗️ 하네스 검증:\n${harnessCheck}\n\n📁 프로젝트: ${projectName}\n  마지막 섹션: ${lastSection}\n  PSD:${psdFiles || ' (없음)'}\n  HTML:${htmlSections}\n  이미지:${imgSections}\n\n${projectTypeBlock}\n\n🚨 첫 번째 할 일 (STEP -1 필수):\n  1. tools/PUBLISHING_CLAUDE_TEMPLATE.md 읽기 (150개 규칙)\n  2. tools/WORKFLOW.md 읽기 (워크플로우)\n  3. CLAUDE.md 읽기\n  4. 세 파일에서 추출한 규칙을 전부 번호 매겨서 나열 출력\n     → '이미 알고 있다' 생략 불가, 반드시 전부 출력\n     → 나열 완료 전까지 STEP 0 진입 금지\n  5. 유저에게 어떤 섹션 작업할지 확인\n  6. STEP 0: 데이터 추출 + 이미지 분석 (병렬)\n     A) section-finder → psd-to-spec → spec.json\n     B) image-analyzer → image-analysis.json\n     → 둘 다 STEP 1 전에 완료 필수\n  7. spec-to-plan으로 plan.json 초안 자동 생성 (수작업 금지)\n     → node tools/spec-to-plan.js <spec.json> --page <page> --prev auto --out .planning/<dir>/plan.json [--swiper]\n     → centeredFlow/centerAxisHints/containmentHints/overlaps는 힌트일 뿐이고, 시안 기준으로 wrapper/centerChildren/alignSelf, containment 중첩, bg/paper/card의 rltv heightChain 참여를 결정\n  8. AI가 초안 보정 (이름, wrapper, centerChildren/alignSelf, doNot, 실제 시각 박스 heightChain. 수치 수정 금지) → plan-checker 🟢 통과 필수\n  9. 🟢 통과 후에만 ASCII 출력 (plan-checker 없이 ASCII = 이중 작업)\n  10. 유저 컨펌 후 코딩 시작\n  11. 하네스 전체 파이프라인 (step 1~6) 🟢 ALL CLEAR 필수\n\n🔴 절대 하지 마라:\n  - 도구 소스코드(*.js) 읽지 말고 실행만 할 것\n  - spec JSON 직접 열지 말고 도구로 추출할 것\n  - 수치 암산 금지 — node -e로만 계산\n  - 임의값/둥근수 금지 — PSD 정확값만\n  - 유저 컨펌 없이 코딩 절대 금지\n  - wrapper 구조 절대 풀지 말 것 (flat 금지)\n  - 부모 기준 중앙 정렬을 자식별 margin-left로 때우지 말 것\n  - bg/paper/card 실제 이미지를 absol 배경 + padding-bottom 높이 대체로 속이지 말 것\n  - chart/map/image 내부 badge/marker overlay를 같은 parent 형제로 방치하지 말 것\n  - 기존 코드 확인 안 하고 덮어쓰기 금지\n  - STEP 0 완료 전에 STEP 1 진입 금지\n\n🔧 도구 실행법 (소스 읽지 말고 이렇게 실행):\n  harness: node tools/harness.js --psd <parsed.json> --section <conXX> --page <page>\n  plan-checker: node tools/plan-checker.js <plan.json>\n  image-analyzer: node tools/image-analyzer.js <경로> --prefix <conXX> --out <출력경로>\n  section-finder: node tools/section-finder.js <parsed.json> <섹션번호|--list>\n  psd-to-spec: node tools/psd-to-spec.js <parsed.json> <섹션명> <출력경로>\n  spec-to-plan: node tools/spec-to-plan.js <spec.json> --page <page> --prev auto --out <plan.json> [--swiper]\n  plan-to-css: node tools/plan-to-css.js <plan.json> --out <output.css>\n  position-checker: node tools/position-checker.js <spec.json> <url> <selector>`
  }
};

console.log(JSON.stringify(output));
