#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function findProjectRoot(startDir) {
  let dir = path.resolve(startDir || process.cwd());
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'CLAUDE.md'))) return dir;
    dir = path.dirname(dir);
  }
  return fs.existsSync(path.join(dir, 'CLAUDE.md')) ? dir : null;
}

function normalizeSection(raw) {
  const match = String(raw || '').match(/(\d+)/);
  if (!match) return null;
  return 'con' + match[1].padStart(2, '0');
}

function normalizePage(raw) {
  const page = String(raw || '').trim();
  return page || 'main';
}

function stateKey(page, section) {
  return normalizePage(page) + '_' + normalizeSection(section);
}

function stateDir(root, section, page) {
  return path.join(root, '.workflow-state', stateKey(page, section));
}

function stateFile(root, section, name, page) {
  return path.join(stateDir(root, section, page), name + '.json');
}

function hasState(root, section, name, page) {
  return fs.existsSync(stateFile(root, section, name, page));
}

function readState(root, section, name, page) {
  const file = stateFile(root, section, name, page);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return null;
  }
}

function markState(root, section, name, meta) {
  const normalized = normalizeSection(section);
  const page = normalizePage(meta && meta.page);
  if (!root || !normalized) throw new Error('root/section required');
  const dir = stateDir(root, normalized, page);
  fs.mkdirSync(dir, { recursive: true });
  const payload = Object.assign(
    {
      section: normalized,
      page,
      state: name,
      markedAt: new Date().toISOString()
    },
    meta || {}
  );
  const file = stateFile(root, normalized, name, page);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n');
  return file;
}

function clearState(root, section, names, page) {
  const normalized = normalizeSection(section);
  if (!root || !normalized) throw new Error('root/section required');
  const targets = names && names.length ? names : ['approved', 'harness-prep', 'verified'];
  const removed = [];
  const stateRoot = path.join(root, '.workflow-state');
  if (!fs.existsSync(stateRoot)) return removed;

  if (page) {
    targets.forEach((name) => {
      const file = stateFile(root, normalized, name, page);
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        removed.push(file);
      }
    });
    return removed;
  }

  for (const entry of fs.readdirSync(stateRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.endsWith('_' + normalized)) continue;
    targets.forEach((name) => {
      const file = path.join(stateRoot, entry.name, name + '.json');
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        removed.push(file);
      }
    });
  }
  return removed;
}

function listState(root, section, page) {
  if (page) {
    return {
      approved: readState(root, section, 'approved', page),
      harnessPrep: readState(root, section, 'harness-prep', page),
      verified: readState(root, section, 'verified', page)
    };
  }

  const normalized = normalizeSection(section);
  const results = {};
  const stateRoot = path.join(root, '.workflow-state');
  if (!fs.existsSync(stateRoot)) return results;

  for (const entry of fs.readdirSync(stateRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.endsWith('_' + normalized)) continue;
    const entryPage = entry.name.slice(0, entry.name.length - ('_' + normalized).length);
    results[entryPage] = {
      approved: readState(root, section, 'approved', entryPage),
      harnessPrep: readState(root, section, 'harness-prep', entryPage),
      verified: readState(root, section, 'verified', entryPage)
    };
  }

  return results;
}

function runGit(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function planDirMatches(dirName, section) {
  const sec = normalizeSection(section);
  const num = sec.replace('con', '');
  const raw = String(parseInt(num, 10));
  return dirName.endsWith('_' + sec) || dirName.endsWith('_con' + raw);
}

function findPlanCandidates(root, section, preferredPage) {
  const planningDir = path.join(root, '.planning');
  if (!fs.existsSync(planningDir)) return [];

  const candidates = [];
  for (const entry of fs.readdirSync(planningDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!planDirMatches(entry.name, section)) continue;
    const planFile = path.join(planningDir, entry.name, 'plan.json');
    if (!fs.existsSync(planFile)) continue;
    candidates.push(planFile);
  }

  candidates.sort((a, b) => a.localeCompare(b));
  if (!preferredPage) return candidates;

  return candidates.sort((a, b) => {
    const aExact = path.basename(path.dirname(a)).startsWith(preferredPage + '_') ? 0 : 1;
    const bExact = path.basename(path.dirname(b)).startsWith(preferredPage + '_') ? 0 : 1;
    return aExact - bExact || a.localeCompare(b);
  });
}

function checkPlanFile(root, planFile) {
  let planData;
  try {
    planData = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  } catch (err) {
    return { ok: false, reason: 'plan.json parse 실패: ' + planFile };
  }

  if (!planData.generatedBy || !String(planData.generatedBy).startsWith('spec-to-plan')) {
    return {
      ok: false,
      reason: 'spec-to-plan 생성본 아님: ' + planFile
    };
  }

  const checker = path.join(root, 'tools', 'plan-checker.js');
  if (!fs.existsSync(checker)) {
    return { ok: false, reason: 'plan-checker.js 없음' };
  }

  try {
    const output = execFileSync(process.execPath, [checker, planFile], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    if (!output.includes('PLAN APPROVED')) {
      return { ok: false, reason: 'plan-checker 미통과: ' + planFile };
    }
  } catch (err) {
    const output = String((err && err.stdout) || '') + String((err && err.stderr) || '');
    const line = output.split('\n').find((item) => item.includes('❌'));
    return {
      ok: false,
      reason: (line || 'plan-checker 미통과') + ' (' + planFile + ')'
    };
  }

  return { ok: true };
}

function inferPageFromFile(file) {
  const normalized = String(file || '').replace(/\\/g, '/');
  let match = normalized.match(/^css\/([^/]+)\.css$/);
  if (match) return match[1];
  match = normalized.match(/^js\/([^/]+)\.js$/);
  if (match) return match[1];
  match = normalized.match(/^theme\/design\/template\/([^/]+)\/index\.html$/);
  if (match) return match[1];
  return null;
}

function extractSectionsFromText(text) {
  const found = new Set();
  const regex = /(?:^|[^a-z0-9_-])(?:fr-)?con0*(\d+)\b|\.c0*(\d+)\b/gi;
  let match;
  while ((match = regex.exec(String(text || '')))) {
    const num = match[1] || match[2];
    if (num) found.add('con' + String(parseInt(num, 10)).padStart(2, '0'));
  }
  return Array.from(found).sort();
}

function changedLineWindows(diffText) {
  const windows = [];
  const regex = /@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/g;
  let match;
  while ((match = regex.exec(String(diffText || '')))) {
    const start = parseInt(match[1], 10);
    const count = parseInt(match[2] || '1', 10);
    windows.push({
      from: Math.max(1, start - 120),
      to: start + count + 120
    });
  }
  return windows;
}

function sectionsForFile(root, file) {
  const sections = new Set();
  const normalized = String(file || '').replace(/\\/g, '/');
  extractSectionsFromText(normalized).forEach((item) => sections.add(item));

  let diffText = '';
  try {
    diffText = runGit(root, ['diff', '--cached', '--unified=0', '--', normalized]);
  } catch (err) {
    diffText = '';
  }
  extractSectionsFromText(diffText).forEach((item) => sections.add(item));

  let stagedContent = '';
  try {
    stagedContent = runGit(root, ['show', ':' + normalized]);
  } catch (err) {
    stagedContent = '';
  }

  if (stagedContent) {
    const lines = stagedContent.split(/\r?\n/);
    changedLineWindows(diffText).forEach((window) => {
      const slice = lines.slice(window.from - 1, window.to).join('\n');
      extractSectionsFromText(slice).forEach((item) => sections.add(item));
    });
  }

  return Array.from(sections).sort();
}

function inferTargetsFromStaged(root) {
  let files = [];
  try {
    files = runGit(root, ['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  } catch (err) {
    files = [];
  }

  const targets = new Map();
  files.forEach((file) => {
    const normalized = file.replace(/\\/g, '/');
    if (
      normalized.startsWith('.claude/') ||
      normalized.startsWith('tools/') ||
      normalized.startsWith('.githooks/') ||
      normalized === 'AGENTS.md' ||
      normalized === 'CLAUDE.md'
    ) {
      return;
    }

    const page = inferPageFromFile(normalized);
    const ext = path.extname(normalized);
    if (!page || !['.css', '.html', '.js'].includes(ext)) return;

    const sections = sectionsForFile(root, normalized);
    sections.forEach((section) => {
      const key = section;
      if (!targets.has(key)) {
        targets.set(key, {
          section,
          pages: new Set(),
          files: new Set()
        });
      }
      const target = targets.get(key);
      target.pages.add(page);
      target.files.add(normalized);
    });
  });

  return Array.from(targets.values()).map((target) => ({
    section: target.section,
    pages: Array.from(target.pages).sort(),
    files: Array.from(target.files).sort()
  }));
}

function gitCheck(root, options) {
  const requireVerified = !options || options.requireVerified !== false;
  const targets = inferTargetsFromStaged(root);
  if (targets.length === 0) {
    return { ok: true, messages: ['workflow git-check: 대상 섹션 없음'] };
  }

  const failures = [];
  targets.forEach((target) => {
    const section = target.section;
    const preferredPage = target.pages[0] || null;
    const planFiles = findPlanCandidates(root, section, preferredPage);

    if (planFiles.length === 0) {
      failures.push(
        '[' + section + '] plan.json 없음: .planning/*_' + section + '/plan.json'
      );
      return;
    }

    const planResult = checkPlanFile(root, planFiles[0]);
    if (!planResult.ok) {
      failures.push('[' + section + '] ' + planResult.reason);
    }

    if (!hasState(root, section, 'approved', preferredPage)) {
      failures.push(
        '[' + preferredPage + ' ' + section + '] 유저 승인 플래그 없음: node tools/workflow-enforce.js approve --section ' + section + ' --page ' + preferredPage
      );
    }
    if (!hasState(root, section, 'harness-prep', preferredPage)) {
      failures.push(
        '[' + preferredPage + ' ' + section + '] harness-prep 플래그 없음: node tools/workflow-enforce.js harness-prep --section ' + section + ' --page ' + preferredPage
      );
    }
    if (requireVerified && !hasState(root, section, 'verified', preferredPage)) {
      failures.push(
        '[' + preferredPage + ' ' + section + '] verified 플래그 없음: full harness 통과 후 node tools/workflow-enforce.js verified --section ' + section + ' --page ' + preferredPage
      );
    }
  });

  if (failures.length > 0) {
    return { ok: false, messages: failures };
  }

  return {
    ok: true,
    messages: targets.map((target) => {
      return '[' + target.section + '] plan/approval/harness 상태 확인 완료';
    })
  };
}

function printUsage() {
  console.log('Usage:');
  console.log('  node tools/workflow-enforce.js approve --section con06 --page main');
  console.log('  node tools/workflow-enforce.js harness-prep --section con06 --page main');
  console.log('  node tools/workflow-enforce.js verified --section con06 --page main');
  console.log('  node tools/workflow-enforce.js clear --section con06 [--page main]');
  console.log('  node tools/workflow-enforce.js status --section con06 [--page main]');
}

function cli() {
  const root = findProjectRoot(process.cwd());
  if (!root) {
    console.error('CLAUDE.md 기준 프로젝트 루트를 찾지 못했습니다.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const cmd = args[0];
  const getArg = (name) => {
    const idx = args.indexOf('--' + name);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
  };
  const section = normalizeSection(getArg('section'));
  const page = getArg('page') || null;

  if (!cmd) {
    printUsage();
    process.exit(1);
  }

  if (cmd === 'approve' || cmd === 'harness-prep' || cmd === 'verified') {
    if (!section) {
      console.error('--section 필요');
      process.exit(1);
    }
    if (!page) {
      console.error('--page 필요');
      process.exit(1);
    }

    // S급 강제: harness-prep은 실제 spec 파일이 존재해야만 마킹 가능
    if (cmd === 'harness-prep') {
      const planningDir = path.join(root, '.planning');
      const specCandidates = [
        path.join(planningDir, `con${section.replace('con','')}`, `spec_${page}_con${section.replace('con','')}.json`),
        path.join(planningDir, `con${section.replace('con','')}`, `spec_main_con${section.replace('con','')}.json`),
        path.join(planningDir, `${page}_${section}`, `spec_${page}_${section}.json`)
      ];
      const specExists = specCandidates.some(f => fs.existsSync(f));
      // S급: harness step 1-2 실행 로그 확인
      const harnessSpec = path.join(root, 'psd', 'spec_' + page + '_' + section + '.json');
      const harnessSpecAlt = path.join(root, 'psd', 'spec_main_' + section + '.json');
      const harnessRan = fs.existsSync(harnessSpec) || fs.existsSync(harnessSpecAlt);
      if (!harnessRan && specExists) {
        // spec은 planning에 있지만 harness가 psd/에 생성한 spec은 없음 → harness 로그 미실행
        console.error('⚠️  harness step 1 미실행 경고 — psd/spec_*_' + section + '.json 없음. harness --step 1 실행을 권장합니다.');
      }
      if (!specExists) {
        console.error(`🔴 harness-prep 차단 — spec 파일이 없습니다.\n  psd-to-spec 실행 후 다시 시도하세요.\n  후보: ${specCandidates[0]}`);
        process.exit(1);
      }
    }

    // A급 강제: approve는 plan.json의 ascii 필드가 있어야만 마킹 가능
    if (cmd === 'approve') {
      const planCandidates = findPlanCandidates(root, section, page);
      if (planCandidates.length > 0) {
        try {
          const plan = JSON.parse(fs.readFileSync(planCandidates[0], 'utf8'));
          // A급: ascii 필드 검증
          if (!plan.ascii || plan.ascii === 'TODO' || plan.ascii.includes('plan-checker')) {
            console.error('🔴 approve 차단 — plan.json에 ascii 다이어그램이 없습니다.\n  plan-checker 🟢 통과 후 ASCII 작성 → 유저 컨펌 → approve\n  ascii 필드가 TODO이면 approve 불가');
            process.exit(1);
          }
          // plan-checker 🟢 통과 확인
          const checkResult = checkPlanFile(root, planCandidates[0]);
          if (!checkResult.ok) {
            console.error(`🔴 approve 차단 — plan-checker 미통과\n  ${checkResult.reason}`);
            process.exit(1);
          }
        } catch (e) {
          console.error(`🔴 approve 차단 — plan.json 읽기 실패: ${e.message}`);
          process.exit(1);
        }
      }
    }

    const stateName = cmd === 'approve' ? 'approved' : cmd;
    const file = markState(root, section, stateName, { page, source: 'manual' });
    console.log(cmd + ' marked: ' + path.relative(root, file));
    process.exit(0);
  }

  if (cmd === 'clear') {
    if (!section) {
      console.error('--section 필요');
      process.exit(1);
    }
    const removed = clearState(root, section, null, page);
    console.log(removed.length ? removed.map((file) => path.relative(root, file)).join('\n') : 'nothing to clear');
    process.exit(0);
  }

  if (cmd === 'status') {
    if (!section) {
      console.error('--section 필요');
      process.exit(1);
    }
    console.log(JSON.stringify(listState(root, section, page), null, 2));
    process.exit(0);
  }

  printUsage();
  process.exit(1);
}

if (require.main === module) {
  cli();
} else {
  module.exports = {
    clearState,
    findPlanCandidates,
    findProjectRoot,
    hasState,
    listState,
    markState,
    normalizeSection,
    stateFile
  };
}
