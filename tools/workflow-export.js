#!/usr/bin/env node
/**
 * workflow-export.js
 * 워크플로우 파일을 새 프로젝트로 복사하는 스크립트
 *
 * 사용법:
 *   node tools/workflow-export.js /path/to/new-project
 *
 * 복사 대상:
 *   .claude/settings.json
 *   .claude/hooks/*.js
 *   .claude/memory/ (피드백만)
 *   tools/*.js + PUBLISHING_CLAUDE_TEMPLATE.md
 *   .planning/_template/plan.json
 *   CLAUDE.md (프로젝트 정보 섹션은 빈칸)
 *   package.json (의존성만)
 */

const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('사용법: node tools/workflow-export.js <대상 프로젝트 경로>');
  process.exit(1);
}

const src = path.resolve(__dirname, '..');
const dst = path.resolve(target);

if (!fs.existsSync(dst)) {
  console.error(`대상 경로 없음: ${dst}`);
  process.exit(1);
}

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cp(from, to) {
  const srcPath = path.join(src, from);
  const dstPath = path.join(dst, to || from);
  if (!fs.existsSync(srcPath)) {
    console.log(`  ⚠️  없음: ${from}`);
    return;
  }
  mkdirp(path.dirname(dstPath));
  fs.copyFileSync(srcPath, dstPath);
  console.log(`  ✅ ${from}`);
}

function cpDir(fromDir, toDir, filter) {
  const srcDir = path.join(src, fromDir);
  if (!fs.existsSync(srcDir)) return;
  const files = fs.readdirSync(srcDir).filter(f => !filter || filter(f));
  files.forEach(f => cp(path.join(fromDir, f), path.join(toDir || fromDir, f)));
}

console.log(`\n📦 워크플로우 내보내기: ${dst}\n`);

// 1. settings.json
console.log('── settings.json ──');
cp('.claude/settings.json');

// 2. hooks
console.log('\n── hooks ──');
cpDir('.claude/hooks', '.claude/hooks', f => f.endsWith('.js'));

// 3. tools
console.log('\n── tools ──');
cpDir('tools', 'tools', f => f.endsWith('.js') || f.endsWith('.md'));

// 4. planning template
console.log('\n── planning 템플릿 ──');
cp('.planning/_template/plan.json');

// 5. memory (피드백만 — 프로젝트 고유 정보 제외)
console.log('\n── memory (피드백) ──');
const memDir = path.join(src, '.claude/memory');
if (fs.existsSync(memDir)) {
  const feedbacks = fs.readdirSync(memDir).filter(f => f.startsWith('feedback_'));
  feedbacks.forEach(f => cp(path.join('.claude/memory', f)));
  cp('.claude/memory/user_workstyle.md');
  // MEMORY.md는 새로 생성
  const memIndex = feedbacks.map(f => `- [${f.replace('.md','')}](${f})`).join('\n');
  const memContent = `# 메모리 인덱스\n\n## 피드백\n${memIndex}\n\n## 유저 프로필\n- [user_workstyle.md](user_workstyle.md)\n`;
  mkdirp(path.join(dst, '.claude/memory'));
  fs.writeFileSync(path.join(dst, '.claude/memory/MEMORY.md'), memContent);
  console.log('  ✅ MEMORY.md (새로 생성)');
}

// 6. CLAUDE.md — 프로젝트 정보 빈칸으로
console.log('\n── CLAUDE.md (템플릿) ──');
const claudeMd = fs.readFileSync(path.join(src, 'CLAUDE.md'), 'utf8');
const templateClaudeMd = claudeMd.replace(
  /## 프로젝트 정보[\s\S]*$/,
  `## 프로젝트 정보

- **프로젝트명**: (프로젝트명)
- **캔버스 크기**: (예: 1905, ÷1920 금지!)
- **로컬 서버**: (예: php -d short_open_tag=On -S localhost:8080)
- **DB**: (예: project_db, mysql root)
- **반응형**: \`@media (max-width: 599px)\`
- **PSD 파일**: (예: /psd/*.psd)
- **PSD 파서**: \`node tools/psd_parser.js <PSD경로> <출력JSON경로>\`

## 디자인 토큰 (header.css :root)

\`\`\`
--mc: (메인 색상)
--sc: (서브 색상)
--fc: (배경 색상)
--mf: (메인 폰트)
\`\`\`

## 페이지 라우팅

| 페이지 | URL | CSS/JS |
|--------|-----|--------|
| 메인 | / | style.css / script.js |

## section 공통 CSS (style.css)

\`\`\`css
section { overflow:hidden; display:flex; justify-content:center; align-items:center; width:100%; flex-direction:column; }
\`\`\`

## 주의사항

1. (프로젝트별 주의사항)
`
);
fs.writeFileSync(path.join(dst, 'CLAUDE.md'), templateClaudeMd);
console.log('  ✅ CLAUDE.md (프로젝트 정보 = 빈칸 템플릿)');

// 7. package.json — 워크플로우 의존성만
console.log('\n── package.json ──');
const pkg = {
  name: path.basename(dst),
  private: true,
  dependencies: {
    "ag-psd": "^30.1.0",
    "playwright": "^1.59.1",
    "sharp": "^0.34.5"
  }
};
fs.writeFileSync(path.join(dst, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
console.log('  ✅ package.json (의존성만)');

console.log(`
✅ 내보내기 완료!

다음 단계:
  cd ${dst}
  npm install
  npx playwright install chromium
  → CLAUDE.md 프로젝트 정보 섹션 채우기
  → PSD 파일 /psd/ 에 넣기
`);
