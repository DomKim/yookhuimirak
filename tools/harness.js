#!/usr/bin/env node
/**
 * harness.js — 섹션 구현 파이프라인 (가두리)
 *
 * 워크플로우 단계를 강제로 순서대로 실행.
 * 단계 하나라도 FAIL이면 다음 단계 진행 불가.
 *
 * 사용법:
 *   node tools/harness.js --psd <parsed.json> --section <con09> --page <main>
 *   node tools/harness.js --step 3 --spec <spec.json> --structure <structure.json>
 *
 * 단계:
 *   STEP 1: spec 추출 (psd-to-spec)
 *   STEP 2: 이미지 전수 분석 (파일 존재 + 원본 크기 + 완성형/소스 판단)
 *   STEP 3: auto-css 실행 (spec + structure → CSS)
 *   STEP 4: CSS 금지규칙 검증 (min(), max-width, ÷1920, 음수 margin 등)
 *   STEP 5: 이미지 렌더링=원본 검증 (Playwright)
 *   STEP 6: 스크린샷 캡처
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const workflow = require('./workflow-enforce');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// ─── 캔버스 자동 감지 (CLAUDE.md → 1905 fallback) ───
function detectCanvas() {
    const claudePath = path.join(PROJECT_ROOT, 'CLAUDE.md');
    if (fs.existsSync(claudePath)) {
        const md = fs.readFileSync(claudePath, 'utf-8');
        const m = md.match(/캔버스\s*(?:크기)?[*:\s]*(\d{3,5})/);
        if (m) return parseInt(m[1], 10);
    }
    return 1905;
}
const CANVAS = detectCanvas();

// ── 이미지 크기 읽기 ──
function getImageSize(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (buf[0] === 0xFF && buf[1] === 0xD8) {
      let i = 2;
      while (i < buf.length - 8) {
        if (buf[i] === 0xFF) {
          const m = buf[i + 1];
          if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8) {
            return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
          }
          i += 2 + buf.readUInt16BE(i + 2);
        } else { i++; }
      }
    }
  } catch (e) { }
  return null;
}

// ── Args ──
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf('--' + name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

const psdFile = getArg('psd');
const section = getArg('section');
const psdSection = getArg('psd-section') || section; // PSD 그룹명이 HTML 섹션명과 다를 때
const page = getArg('page') || 'main';
const stepOnly = getArg('step');
const specFile = getArg('spec');
const structureFile = getArg('structure');
const cssFile = getArg('css');
const selectorArg = getArg('selector');
const imageDirArg = getArg('image-dir');
const imagePrefixArg = getArg('image-prefix');
const fastMode = args.includes('--fast');
const summaryMode = args.includes('--summary') || args.includes('--quiet');
const timingsMode = args.includes('--timings') || summaryMode;
const budgetSec = getArg('budget-sec') ? Number(getArg('budget-sec')) : null;

// project-routes.json 자동 로드 (있으면 page 기반 url/css 자동 매핑, 없으면 기존 로직)
let routes = {};
const routesPath = path.join(PROJECT_ROOT, '.claude', 'project-routes.json');
if (fs.existsSync(routesPath)) {
  try { routes = JSON.parse(fs.readFileSync(routesPath, 'utf8')); } catch(e) {}
}
const pageRoute = routes[page] || {};
const defaultUrl = page === 'main' ? 'http://localhost:8080/' : 'http://localhost:8080/bbs/content.php?co_id=' + page;
const url = getArg('url') || pageRoute.url || defaultUrl;

let fails = [];
let warns = [];
let passes = [];
let timings = [];
const harnessStartedAt = Date.now();

function PASS(msg) { passes.push(msg); if (!summaryMode) console.log('  ✅ ' + msg); }
function FAIL(msg) { fails.push(msg); console.log('  ❌ ' + msg); }
function WARN(msg) { warns.push(msg); if (!summaryMode) console.log('  ⚠️  ' + msg); }
function timedStep(label, fn) {
  const started = Date.now();
  try {
    return fn();
  } finally {
    const sec = (Date.now() - started) / 1000;
    timings.push({ label, sec });
    if (timingsMode) console.log('  ⏱️  ' + label + ': ' + sec.toFixed(2) + 's');
  }
}

function scopedTemplateHtml(sectionSelector) {
  const htmlPath = path.join(PROJECT_ROOT, 'theme/design/template', page, 'index.html');
  if (!fs.existsSync(htmlPath)) return '';
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const clsMatch = String(sectionSelector || '').match(/\.([A-Za-z0-9_-]+)/);
  if (!clsMatch) return html;
  const idx = html.indexOf(clsMatch[1]);
  if (idx === -1) return '';
  const sectionStart = html.lastIndexOf('<section', idx);
  if (sectionStart === -1) return html.slice(Math.max(0, idx - 1000), idx + 1000);
  const sectionEnd = html.indexOf('</section>', idx);
  if (sectionEnd === -1) return html.slice(sectionStart);
  return html.slice(sectionStart, sectionEnd + '</section>'.length);
}

function normSec(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function planningPlanCandidates(specPath) {
  const out = [];
  const specAbs = path.isAbsolute(specPath) ? specPath : path.join(PROJECT_ROOT, specPath);
  const specDir = path.dirname(specAbs);
  const specBase = path.basename(specAbs, path.extname(specAbs));
  const baseMatch = specBase.match(/^spec_([^_]+)_(.+)$/i);
  const pageName = (baseMatch && baseMatch[1]) || page || '';
  const sectionName = (baseMatch && baseMatch[2]) || section || '';

  out.push(path.join(specDir, 'plan.json'));
  if (pageName && sectionName) out.push(path.join(PROJECT_ROOT, '.planning', `${pageName}_${sectionName}`, 'plan.json'));
  if (sectionName) out.push(path.join(PROJECT_ROOT, '.planning', sectionName, 'plan.json'));

  const planningRoot = path.join(PROJECT_ROOT, '.planning');
  if (fs.existsSync(planningRoot)) {
    try {
      fs.readdirSync(planningRoot)
        .map(function(d) {
          let score = 0;
          const lower = d.toLowerCase();
          const secLower = String(sectionName || '').toLowerCase();
          if (pageName && lower === `${pageName}_${secLower}`) score += 100;
          if (pageName && lower.startsWith(`${pageName}_${secLower}`)) score += 60;
          if (lower === secLower) score += 50;
          if (lower.includes(secLower)) score += 20;
          if (normSec(d) === normSec(sectionName)) score += 10;
          return { d, score };
        })
        .filter(function(item) { return item.score > 0; })
        .sort(function(a, b) { return b.score - a.score || a.d.localeCompare(b.d); })
        .forEach(function(item) {
          out.push(path.join(planningRoot, item.d, 'plan.json'));
        });
    } catch (e) {}
  }

  return Array.from(new Set(out));
}

function loadLocalPlanForSpec(specPath) {
  if (!specPath) return null;
  try {
    const candidates = planningPlanCandidates(specPath);
    for (const localPlan of candidates) {
      if (!fs.existsSync(localPlan)) continue;
      return JSON.parse(fs.readFileSync(localPlan, 'utf8'));
    }
  } catch (e) {
    return null;
  }
  return null;
}

function collectMultilineTextSelectors(planData) {
  const names = new Set();
  function segHasMultiline(node) {
    if (!Array.isArray(node.segments)) return false;
    return node.segments.some(function(seg) {
      const t = String(seg.text || '');
      return t.includes('\n') || /<br\s*\/?>/i.test(t);
    });
  }
  function walk(nodes) {
    (nodes || []).forEach(function(node) {
      if (!node || typeof node !== 'object') return;
      const isTextLike = node.type === 'text' || node.type === 'text-only';
      const content = String(node.content || '');
      const isMultiline = isTextLike && (content.includes('\n') || /<br\s*\/?>/i.test(content) || segHasMultiline(node));
      if (isMultiline && node.name) {
        names.add('.' + node.name);
        // multilineClass 별칭 (공통 base 클래스)
        if (Array.isArray(node.multilineClasses)) {
          node.multilineClasses.forEach(function(cls) { names.add('.' + cls); });
        }
      }
      if (Array.isArray(node.children)) walk(node.children);
    });
  }
  walk(planData && planData.elements);
  // 플랜 최상위에서 multilineClasses 글로벌 선언 지원
  if (planData && Array.isArray(planData.multilineClasses)) {
    planData.multilineClasses.forEach(function(cls) { names.add('.' + cls); });
  }
  return names;
}

function isFresh(outPath, inputPaths) {
  if (!outPath || !fs.existsSync(outPath)) return false;
  const outMtime = fs.statSync(outPath).mtimeMs;
  return inputPaths.filter(Boolean).every(p => {
    const full = path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p);
    return fs.existsSync(full) && fs.statSync(full).mtimeMs <= outMtime;
  });
}

function sectionNumber() {
  const m = String(section || '').match(/^con0*(\d+)$/i);
  return m ? m[1] : null;
}

function isSectionImageFile(file) {
  if (!/\.(png|jpe?g|webp|gif)$/i.test(file || '')) return false;
  if (imagePrefixArg) return file.startsWith(imagePrefixArg + '_') || file.startsWith(imagePrefixArg + '.');
  const num = sectionNumber();
  if (!num) return file.startsWith((section || '') + '_') || file.startsWith(section || '');
  return new RegExp('^con0*' + num + '(?:[_.,]|\\b)', 'i').test(file);
}

function analyzerPrefixForSection() {
  if (imagePrefixArg) return imagePrefixArg;
  const num = sectionNumber();
  if (!num) return section || '';
  return 'con' + String(num).padStart(2, '0');
}

// ════════════════════════════════════════════
// STEP 1: spec 추출
// ════════════════════════════════════════════
function step1() {
  console.log('\n══ STEP 1: spec 추출' + (fastMode ? ' (fast cache 허용)' : ' (항상 새로 추출)') + ' ══');
  if (specFile) {
    const overrideSpec = path.isAbsolute(specFile) ? specFile : path.join(PROJECT_ROOT, specFile);
    if (fs.existsSync(overrideSpec)) {
      PASS('spec override 사용: ' + path.basename(overrideSpec));
      return overrideSpec;
    }
    FAIL('spec override 파일 없음: ' + overrideSpec);
    return null;
  }
  if (!psdFile || !section) {
    FAIL('--psd와 --section 필수');
    return null;
  }
  const outSpec = path.join(PROJECT_ROOT, 'psd', `spec_${page}_${section}.json`);

  if (fastMode && isFresh(outSpec, [psdFile, path.join('tools', 'psd-to-spec.js')])) {
    PASS(`FAST spec cache hit: ${path.basename(outSpec)}`);
    return outSpec;
  }

  // 항상 새로 추출 (캐시된 spec 사용 금지)
  try {
    execSync(`node "${path.join(__dirname, 'psd-to-spec.js')}" "${psdFile}" "${psdSection}" "${outSpec}"`, { stdio: 'pipe' });
    if (fs.existsSync(outSpec)) {
      PASS(`spec 새로 추출: ${path.basename(outSpec)}`);
      return outSpec;
    }
  } catch (e) {
    FAIL('spec 생성 실패: ' + e.message);
  }
  return null;
}

// ════════════════════════════════════════════
// STEP 1.5: spec ↔ PSD raw 크로스체크
// ════════════════════════════════════════════
function step1_5(specPath) {
  console.log('\n══ STEP 1.5: spec ↔ PSD raw 크로스체크 ══');
  if (specPath && !psdFile) { PASS('spec override 모드 — PSD raw 크로스체크 스킵'); return; }
  if (!specPath || !psdFile) { WARN('spec 또는 PSD 없음 — 스킵'); return; }

  let spec, psd;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    psd = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, psdFile), 'utf-8'));
  } catch (e) { WARN('파일 로드 실패: ' + e.message); return; }

  // PSD에서 해당 섹션 그룹 찾기
  const layers = psd.layers || psd.children || [];
  // con06/con6 정규화 비교
  const _normSec = (n) => { const d = String(n).replace(/\D/g, ''); return d ? d.replace(/^0+/, '') || '0' : n; };
  const sectionLayer = layers.find(l => _normSec(l.name) === _normSec(psdSection));
  if (!sectionLayer) { WARN('PSD에서 섹션 그룹 "' + psdSection + '" 미발견'); return; }

  // PSD 모든 레이어 flat 수집 (fill 있는 것만)
  const psdRects = [];
  function collectRects(nodes, path) {
    for (const n of (nodes || [])) {
      if (n.kind === 'layer' && n.fill && n.width > 0 && n.height > 0) {
        const hex = (typeof n.fill === 'object' && n.fill.hex) ? n.fill.hex : (typeof n.fill === 'string' ? n.fill : null);
        if (hex) psdRects.push({ name: n.name, top: n.top, left: n.left, w: n.width, h: n.height, fill: hex.toLowerCase(), path: path });
      }
      if (n.children) collectRects(n.children, path + '/' + (n.name || '?'));
    }
  }
  collectRects(sectionLayer.children || [], '/' + section);

  // spec rects와 대조: 같은 위치(y,w,h)인데 fill이 다르면 FAIL
  let mismatchCount = 0;
  if (spec.rects) {
    spec.rects.forEach(sr => {
      if (!sr.fill || typeof sr.fill !== 'string') return;
      const specFill = sr.fill.toLowerCase();
      // PSD에서 같은 좌표의 rect 찾기 — 중복 이름이 많아서 좌표 우선
      let match = psdRects.find(pr =>
        pr.top === sr.y &&
        pr.left === sr.x &&
        Math.abs(pr.w - sr.w) <= 2 &&
        Math.abs(pr.h - sr.h) <= 2
      );
      if (!match) {
        match = psdRects.find(pr => pr.name === sr.name && pr.top === sr.y && pr.left === sr.x && Math.abs(pr.w - sr.w) <= 2);
      }
      if (!match) {
        match = psdRects.find(pr => pr.name === sr.name && pr.top === sr.y && Math.abs(pr.w - sr.w) <= 2);
      }
      if (!match) {
        // 같은 좌표에 여러 rect 있으면 전부 수집, spec fill과 일치하는 게 있으면 OK
        const candidates = psdRects.filter(pr => pr.top === sr.y && pr.left === sr.x && Math.abs(pr.w - sr.w) <= 2 && Math.abs(pr.h - sr.h) <= 2);
        if (candidates.length > 0) {
          // spec fill과 일치하는 후보가 있으면 → 매칭 OK (불일치 아님)
          const exactMatch = candidates.find(pr => pr.fill === specFill);
          if (exactMatch) { match = exactMatch; }
          else { match = candidates[candidates.length - 1]; } // z-order 가장 위 = 마지막
        }
      }
      if (match && match.fill !== specFill) {
        FAIL(`fill 불일치: "${sr.name}" (y:${sr.y} w:${sr.w}) — spec:${specFill} vs PSD:${match.fill} [${match.path}]`);
        mismatchCount++;
      }
    });
  }

  // spec texts color 대조
  const psdTexts = [];
  function collectTexts(nodes, path) {
    for (const n of (nodes || [])) {
      if (n.kind === 'text' && n.text && n.text.style && n.text.style.color) {
        psdTexts.push({ name: n.name, top: n.top, color: n.text.style.color.toLowerCase(), path: path });
      }
      if (n.children) collectTexts(n.children, path + '/' + (n.name || '?'));
    }
  }
  collectTexts(sectionLayer.children || [], '/' + section);

  if (spec.texts) {
    spec.texts.forEach(st => {
      if (!st.segments || !st.segments[0]) return;
      const specColor = st.segments[0].color.toLowerCase();
      const match = psdTexts.find(pt => pt.top === st.y && pt.name === st.name);
      if (match && match.color !== specColor) {
        FAIL(`text color 불일치: "${st.name}" (y:${st.y}) — spec:${specColor} vs PSD:${match.color}`);
        mismatchCount++;
      }
    });
  }

  if (mismatchCount === 0) {
    PASS(`spec ↔ PSD 크로스체크 통과 (rect ${spec.rects ? spec.rects.length : 0}개, text ${spec.texts ? spec.texts.length : 0}개)`);
  } else {
    FAIL(`spec ↔ PSD 크로스체크 ${mismatchCount}개 불일치 — spec 재추출 필요`);
  }
}

// ════════════════════════════════════════════
// STEP 2: 이미지 전수 분석
// ════════════════════════════════════════════
function step2(specPath) {
  console.log('\n══ STEP 2: 이미지 전수 분석 ══');

  // 해당 섹션 이미지 폴더 스캔 (하위폴더 또는 루트)
  const imagesRoot = imageDirArg
    ? (path.isAbsolute(imageDirArg) ? imageDirArg : path.join(PROJECT_ROOT, imageDirArg))
    : path.join(PROJECT_ROOT, 'images');
  const analyzerPrefix = analyzerPrefixForSection();
  let imgDir = imagesRoot;
  let imgFiles = [];
  try {
    // 1) 지정 이미지 폴더/루트에서 먼저 찾기
    imgFiles = fs.readdirSync(imagesRoot)
      .filter(f => !fs.statSync(path.join(imagesRoot, f)).isDirectory() && isSectionImageFile(f))
      .sort();
    // 2) 루트에 없으면 하위 폴더 탐색
    if (imgFiles.length === 0 && !imageDirArg) {
      const subDirs = fs.readdirSync(imagesRoot).filter(f => {
        const fp = path.join(imagesRoot, f);
        return fs.statSync(fp).isDirectory() && !fs.lstatSync(fp).isSymbolicLink();
      });
      for (const sub of subDirs) {
        const subPath = path.join(imagesRoot, sub);
        const found = fs.readdirSync(subPath)
          .filter(f => isSectionImageFile(f));
        if (found.length > 0) { imgDir = subPath; imgFiles = found.sort(); break; }
      }
    }
  } catch (e) {
    FAIL('이미지 폴더 읽기 실패: ' + imagesRoot);
    return null;
  }

  if (imgFiles.length === 0) {
    FAIL(`${section} 이미지 없음`);
    return null;
  }

  const images = {};
  imgFiles.forEach(f => {
    const fullPath = path.join(imgDir, f);
    const dim = getImageSize(fullPath);
    if (dim) {
      images[f] = { width: dim.width, height: dim.height, path: fullPath };
      PASS(`${f}: ${dim.width}×${dim.height}`);
    } else {
      FAIL(`${f}: 크기 읽기 실패`);
    }
  });

  // spec의 이미지와 대조
  if (specPath) {
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    if (spec.images) {
      spec.images.forEach(img => {
        const name = (img.name || '').replace(/.*\//, '');
        if (images[name]) {
          const file = images[name];
          const psdW = img.w, psdH = img.h;
          const ratioW = file.width / psdW;
          if (ratioW > 2) {
            WARN(`🚨 ${name}: 파일 ${file.width}×${file.height} vs PSD ${psdW}×${psdH} (${ratioW.toFixed(1)}배 차이 — 클리핑?)`);
          } else if (Math.abs(file.width - psdW) > 2) {
            WARN(`${name}: shadow padding? 파일 ${file.width} vs PSD ${psdW} (차이 ${file.width - psdW}px)`);
          }
        }
      });
    }
  }

  console.log(`  총 ${imgFiles.length}개 이미지 분석 완료`);

  if (fastMode) {
    console.log('  ⏭️  FAST: image-analyzer 내용 분석 생략 — 최종 full harness에서 전수 분석');
    return images;
  }

  // ── image-analyzer 통합: 내용 분석 (border/shadow/radius/완성형) ──
  const analyzerPath = path.join(PROJECT_ROOT, 'tools', 'image-analyzer.js');
  if (fs.existsSync(analyzerPath)) {
    console.log('\n── 이미지 내용 분석 (border/shadow/radius) ──');
    try {
      const planDataForAnalyzer = loadLocalPlanForSpec(specPath || currentSpec);
      const ignoredAssetFiles = new Set();
      if (planDataForAnalyzer) {
        (planDataForAnalyzer.ignoredAssets || []).forEach(function(item) {
          var file = typeof item === 'string' ? item : item && item.file;
          if (file) ignoredAssetFiles.add(path.basename(String(file)));
        });
      }
      const analyzerResult = execSync(
        'node "' + analyzerPath + '" "' + imgDir + '" --prefix ' + analyzerPrefix,
        { encoding: 'utf-8', timeout: 30000, cwd: PROJECT_ROOT }
      );
      if (!summaryMode) console.log(analyzerResult);
      else PASS('image-analyzer 내용 분석 완료');

      // 완성형 이미지 경고 추출
      var lines = analyzerResult.split('\n');
      lines.forEach(function(line) {
        if (line.includes('완성형') && line.includes('CSS 효과 중복')) {
          var fname = (line.match(/── (\S+\.(?:png|jpg))/) || [])[1] || '';
          if (ignoredAssetFiles.has(fname)) return;
          WARN('⚠️ ' + fname + ' 완성형 — CSS border/shadow/radius 중복 추가 금지');
        }
        if (line.includes('border: ✅')) {
          var fname2 = '';
          // 이전 줄에서 파일명 추출
          for (var li = lines.indexOf(line) - 1; li >= 0; li--) {
            var m = lines[li].match(/── (\S+\.(?:png|jpg))/);
            if (m) { fname2 = m[1]; break; }
          }
          if (ignoredAssetFiles.has(fname2)) return;
          if (fname2) WARN(fname2 + ' 내장 border 감지 — ' + line.trim());
        }
        if (line.includes('shadow: ✅')) {
          var fname3 = '';
          for (var li2 = lines.indexOf(line) - 1; li2 >= 0; li2--) {
            var m2 = lines[li2].match(/── (\S+\.(?:png|jpg))/);
            if (m2) { fname3 = m2[1]; break; }
          }
          if (ignoredAssetFiles.has(fname3)) return;
          if (fname3) WARN(fname3 + ' 내장 shadow 감지 — ' + line.trim());
        }
      });
    } catch (e) {
      WARN('image-analyzer 실행 실패: ' + (e.message || '').substring(0, 100));
    }
  }

  return images;
}

// ════════════════════════════════════════════
// STEP 3: auto-css 실행
// ════════════════════════════════════════════
function step3(specPath, structPath) {
  console.log('\n══ STEP 3: auto-css 실행 ══');

  if (!specPath) { FAIL('spec 파일 없음'); return null; }
  if (!structPath) { FAIL('structure 파일 없음 — 먼저 structure-v3.json 작성 필요'); return null; }
  if (!fs.existsSync(structPath)) { FAIL(`structure 파일 없음: ${structPath}`); return null; }

  try {
    const output = execSync(
      `node "${path.join(__dirname, 'auto-css-v3.js')}" "${specPath}" "${structPath}"`,
      { encoding: 'utf-8', timeout: 10000 }
    );

    // 경고 카운트
    const warnings = (output.match(/⚠️|🚨/g) || []).length;
    if (warnings > 0) {
      WARN(`auto-css 경고 ${warnings}개 — 출력 확인 필수`);
    }

    PASS('auto-css 실행 완료');
    return output;
  } catch (e) {
    FAIL('auto-css 실행 실패: ' + (e.stderr || e.message));
    return null;
  }
}

// ════════════════════════════════════════════
// STEP 4: CSS 금지규칙 검증
// ════════════════════════════════════════════
function step4(targetCss) {
  console.log('\n══ STEP 4: CSS 금지규칙 검증 ══');

  if (!targetCss) { FAIL('CSS 파일 경로 없음'); return false; }
  if (!fs.existsSync(targetCss)) { FAIL(`CSS 파일 없음: ${targetCss}`); return false; }

  const css = fs.readFileSync(targetCss, 'utf-8');
  let ok = true;

  // 금지 1: min(Xvw, Ypx)
  const minMatches = css.match(/min\s*\(\s*[\d.]+vw\s*,?\s*[\d.]+px\s*\)/g);
  if (minMatches) {
    FAIL(`min(vw,px) ${minMatches.length}개 발견 — vw만 사용해야 함`);
    ok = false;
  } else {
    PASS('min(vw,px) 없음');
  }

  // 금지 2: max-width: 100%
  const mw100 = css.match(/max-width\s*:\s*100%/g);
  if (mw100) {
    FAIL(`max-width:100% ${mw100.length}개 발견 — 삭제 필요`);
    ok = false;
  } else {
    PASS('max-width:100% 없음');
  }

  // 금지 3: max-width: Xpx (unset 제외, @media 쿼리 제외)
  const cssNoMedia = css.replace(/@media[^{]*/g, '');
  const mwPx = cssNoMedia.match(/max-width\s*:\s*\d+px/g);
  if (mwPx) {
    FAIL(`max-width:Xpx ${mwPx.length}개 발견 — 삭제 필요`);
    ok = false;
  } else {
    PASS('max-width:Xpx 없음');
  }

  // 금지 4: 잘못된 캔버스 참조 — 프로젝트 캔버스가 아닌 값 사용 금지
  const wrongCanvases = [1905, 1915, 1920].filter(c => c !== CANVAS);
  let wrongRefs = [];
  for (const wc of wrongCanvases) {
    const re = new RegExp(`(^|[^\\d.])${wc}(?![\\d.])`, 'g');
    const m = css.match(re);
    if (m) wrongRefs.push(`${wc}×${m.length}`);
  }
  if (wrongRefs.length > 0) {
    FAIL(`잘못된 캔버스 참조 [${wrongRefs.join(', ')}] — ÷${CANVAS}만 사용 (주석 포함)`);
    ok = false;
  } else {
    PASS(`캔버스 ÷${CANVAS} 정합`);
  }

  // 금지 5: 음수 margin-top → FAIL (rltv 요소에서 위험)
  const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const htmlForScopePath = path.join(PROJECT_ROOT, 'theme/design/template', page, 'index.html');
  const htmlForScope = fs.existsSync(htmlForScopePath) ? fs.readFileSync(htmlForScopePath, 'utf-8') : '';
  const secNumForScope = section ? section.replace('con','').replace(/^0+/,'') : '';
  function selectorClassNames(sel) {
    const classNames = [];
    String(sel || '').replace(/\.([A-Za-z0-9_-]+)/g, function(_, cls) {
      classNames.push(cls);
      return _;
    });
    return classNames;
  }
  function selectorParts(sel) {
    return String(sel || '').split(',').map(part => part.trim()).filter(Boolean);
  }
  function selectorExistsInHtml(sel) {
    if (!htmlForScope) return true;
    const parts = selectorParts(sel);
    if (!parts.length) return true;
    return parts.some(part => {
      const classNames = selectorClassNames(part);
      if (!classNames.length) return true;
      return classNames.every(cls => htmlForScope.indexOf(cls) !== -1);
    });
  }
  function selectorHasPositionUtilityInHtml(sel) {
    if (!htmlForScope) return false;
    const classAttrs = htmlForScope.match(/class=(["'])[^"']+\1/g) || [];
    return selectorParts(sel).some(part => {
      const classNames = selectorClassNames(part);
      if (!classNames.length) return false;
      return classAttrs.some(attr => (
        classNames.every(cls => new RegExp(`\\b${cls}\\b`).test(attr)) &&
        /\b(?:rltv|absol|fixed|sticky)\b/.test(attr)
      ));
    });
  }
  function isCurrentSectionSelector(sel) {
    if (!selectorExistsInHtml(sel)) return false;
    if (selectorArg) {
      const scopeClass = (String(selectorArg).match(/\.([A-Za-z0-9_-]+)/) || [])[1] || '';
      if (scopeClass) {
        const stem = scopeClass.replace(/(?:_|-)replay$/i, '');
        const stemCompact = stem.replace(/^con0*/i, 'c');
        const classes = selectorClassNames(sel);
        if (classes.some(cls =>
          cls === scopeClass ||
          cls.indexOf(stem + '_') === 0 ||
          cls.indexOf(stem + '-') === 0 ||
          cls.indexOf(stem + 'r') === 0 ||
          cls.indexOf(stemCompact + 'r') === 0
        )) return true;
      }
    }
    if (!secNumForScope) return false;
    if (selectorArg && /replay/i.test(selectorArg)) {
      return new RegExp('\\b(?:fr-con0*' + secNumForScope + '[-_]replay|con0*' + secNumForScope + '[_-]replay|c0*' + secNumForScope + 'r)[\\w-]*').test(sel);
    }
    return new RegExp('\\b(?:fr-con0*' + secNumForScope + '|con0*' + secNumForScope + '|c0*' + secNumForScope + ')[\\w-]*').test(sel);
  }
  const negMarginBlocks = cssNoComments.match(/[^{}]+\{[^}]*margin-top\s*:\s*-[\d.]+[^}]*\}/g) || [];
  const negMarginCurrent = [];
  const negMarginOther = [];
  negMarginBlocks.forEach(block => {
    const sel = (block.split('{')[0] || '').trim();
    if (isCurrentSectionSelector(sel)) negMarginCurrent.push(sel.substring(0, 40));
    else negMarginOther.push(sel.substring(0, 40));
  });
  if (negMarginCurrent.length) {
    FAIL(`현재 섹션 음수 margin-top ${negMarginCurrent.length}개 — rltv 요소면 레이아웃 붕괴 위험: ${negMarginCurrent.slice(0,3).join(', ')}`);
    ok = false;
  } else if (negMarginOther.length) {
    WARN(`다른 섹션 음수 margin-top ${negMarginOther.length}개 (현재 섹션은 OK)`);
  } else {
    PASS('음수 margin-top 없음');
  }

  // 금지 6: height로 섹션 높이 잡기 (section에 height)
  const sectionHeight = css.match(/\.(?:fr-)?con\d+\s*\{[^}]*\bheight\s*:/g);
  if (sectionHeight) {
    WARN('섹션에 height 직접 지정 발견');
  } else {
    PASS('섹션 height 없음');
  }

  // 금지 6b: 섹션에 overflow:hidden 누락 검증
  // content.php 페이지(brand/shop/franchise 등)에서 style.css 공통이 안 먹힘
  const sectionBlocks = cssNoComments.match(/\.(?:fr-)?con\d+\s*\{[^}]+\}/g) || [];
  const hasGlobalSectionOverflow = /(?:^|})\s*section\s*\{[^}]*overflow\s*:\s*hidden/.test(cssNoComments);
  const noOverflow = [];
  sectionBlocks.forEach(block => {
    if (hasGlobalSectionOverflow) return;
    if (!/overflow\s*:\s*hidden/.test(block)) {
      const sel = block.match(/\.(?:fr-)?con\d+/)[0];
      noOverflow.push(sel);
    }
  });
  if (noOverflow.length) {
    WARN(`섹션 overflow:hidden 누락 ${noOverflow.length}개: ${noOverflow.join(', ')} — 직접 추가 필수`);
  } else if (sectionBlocks.length > 0) {
    PASS('섹션 overflow:hidden 전부 있음');
  }

  // 금지 7: absol top에 % 사용 (기존 코드 호환 WARN, 신규 코드 주의)
  const absolTopPct = cssNoComments.match(/top\s*:\s*[\d.]+%/g);
  if (absolTopPct) {
    WARN(`absol top에 % 사용 ${absolTopPct.length}개 — vw 필수 (% = 부모높이 의존 → 깨짐)`);
  } else {
    PASS('absol top % 없음');
  }

  // 금지 9: px 단위 사용 (border/shadow/outline 제외)
  const pxUsage = cssNoComments.match(/:\s*[\d.]+px/g);
  if (pxUsage) {
    // border, box-shadow, outline, text-shadow, border-radius에서의 px는 허용
    const nonBorderPx = [];
    const cssLines = cssNoComments.split('\n');
    cssLines.forEach(line => {
      if (/:\s*[\d.]+px/.test(line) && !/border|shadow|outline/.test(line)) {
        nonBorderPx.push(line.trim().substring(0, 50));
      }
    });
    if (nonBorderPx.length) {
      WARN(`px 단위 ${nonBorderPx.length}개 (border/shadow 외) — vw/% 사용 필수: ${nonBorderPx.slice(0,2).join(', ')}`);
    } else {
      PASS('px 사용 적정 (border/shadow만)');
    }
  } else {
    PASS('px 사용 없음');
  }

  // 금지 10: 정수 퍼센트 (22%, 50% 등 — 소수점 4자리 이상 필수)
  const roundPct = cssNoComments.match(/:\s*(\d+)%/g);
  if (roundPct) {
    const filtered = roundPct.filter(m => {
      const val = m.match(/(\d+)%/)[1];
      return val !== '100' && val !== '0' && val !== '50'; // 100%, 0%, 50% 는 의도적일 수 있음
    });
    if (filtered.length) {
      WARN(`정수 퍼센트 ${filtered.length}개 — PSD 정확값(소수 4자리) 사용 필수: ${filtered.slice(0,3).join(' ')}`);
    } else {
      PASS('정수 퍼센트 없음');
    }
  } else {
    PASS('정수 퍼센트 없음');
  }

  // 금지 11: object-fit 사용 금지
  const objFit = cssNoComments.match(/object-fit\s*:/g);
  if (objFit) {
    WARN(`object-fit ${objFit.length}개 — 이미지 원본 비율 훼손 금지`);
  } else {
    PASS('object-fit 없음');
  }

  // 금지 12: rltv에 top/left 사용 금지 (margin-top/left 써야 함)
  const rltvBlocks = cssNoComments.match(/position\s*:\s*relative[^}]*/g) || [];
  let rltvTopLeft = 0;
  rltvBlocks.forEach(block => {
    if (/\btop\s*:\s*[\d.]+/.test(block) || /\bleft\s*:\s*[\d.]+/.test(block)) {
      rltvTopLeft++;
    }
  });
  if (rltvTopLeft) {
    WARN(`rltv에 top/left ${rltvTopLeft}개 — margin-top/left 사용 필수`);
  } else {
    PASS('rltv top/left 없음');
  }

  // 금지 13: absol에 margin 사용 금지 (top/left 써야 함)
  const absolBlocks = cssNoComments.match(/position\s*:\s*absolute[^}]*/g) || [];
  let absolMargin = 0;
  absolBlocks.forEach(block => {
    if (/margin-top\s*:\s*[\d.]+/.test(block) || /margin-left\s*:\s*[\d.]+/.test(block)) {
      absolMargin++;
    }
  });
  if (absolMargin) {
    WARN(`absol에 margin ${absolMargin}개 — top/left 사용 필수`);
  } else {
    PASS('absol margin 없음');
  }

  // 금지 14: z-index without position (static에 z-index는 안 먹힘)
  // CSS 블록에 z-index가 있는데 position도 없고, selector에 absol/rltv도 없는 경우
  const blocks = css.match(/[^{}]+\{[^}]+\}/g) || [];
  const zinNoPosList = [];
  blocks.forEach(block => {
    const hasZin = /z-index\s*:/.test(block);
    const hasPos = /position\s*:\s*(relative|absolute|fixed|sticky)/.test(block);
    // selector 부분에서 absol/rltv 클래스 참조 확인
    const selectorPart = block.split('{')[0] || '';
    const refAbsol = /\.absol|\.rltv|\.zin/.test(selectorPart);
    const htmlHasPositionUtility = selectorHasPositionUtilityInHtml(selectorPart);
    if (hasZin && !hasPos && !refAbsol && !htmlHasPositionUtility) {
      const sel = selectorPart.trim().substring(0, 40);
      zinNoPosList.push(sel);
    }
  });
  if (zinNoPosList.length) {
    WARN(`z-index without position ${zinNoPosList.length}개 — HTML에 absol/rltv 있는지 확인: ${zinNoPosList.slice(0,3).join(', ')}`);
  } else {
    PASS('z-index + position 정합');
  }

  // 금지 15: flex-basis 사용 금지 (width로 대체)
  const flexBasis = cssNoComments.match(/flex-basis\s*:/g);
  if (flexBasis) {
    WARN(`flex-basis ${flexBasis.length}개 — width로 대체 필수`);
  } else {
    PASS('flex-basis 없음');
  }

  // 금지 16: scaleX/scaleY 사용 금지
  const scaleXY = cssNoComments.match(/scale[XY]\s*\(/g);
  if (scaleXY) {
    WARN(`scaleX/scaleY ${scaleXY.length}개 — opacity, yPercent만 사용`);
  } else {
    PASS('scaleX/scaleY 없음');
  }

  // 금지 17: box-sizing 누락 체크 (padding + % width 조합)
  blocks.forEach(block => {
    const hasPadding = /padding\s*:/.test(block);
    const hasPctWidth = /width\s*:\s*[\d.]+%/.test(block);
    const hasBoxSizing = /box-sizing/.test(block);
    if (hasPadding && hasPctWidth && !hasBoxSizing) {
      const sel = block.split('{')[0].trim().substring(0, 30);
      WARN(`${sel}: padding + %width인데 box-sizing 누락`);
    }
  });

  // 금지 17b: 의미 없는 padding-bottom 높이 대체 금지
  // bg/card/img/video/panel처럼 실제 시각 박스가 있는 경우는 허용하고,
  // stage/sales/wrap류 범용 래퍼가 pb만으로 높이를 만들면 모바일에서 별도 좌표 세트가 필요해진다.
  const pbSpacerCurrent = [];
  const pbSpacerOther = [];
  blocks.forEach(block => {
    const selectorPart = (block.split('{')[0] || '').trim();
    const body = block.split('{')[1] || '';
    const pbMatch = body.match(/padding-bottom\s*:\s*([\d.]+)vw/);
    if (!pbMatch) return;
    if (Number(pbMatch[1]) === 0) return;
    if (/background\s*:|border\s*:/.test(body)) return;
    if (/(?:^|[_\s.:-])(?:bg|clip|card|img|image|photo|video|map|line|deco|circle|panel|badge)(?:$|[_\s.:-])/i.test(selectorPart)) return;
    if (!/(?:^|[_\s.:-])(?:stage|sales|wrap|group|area|inner|content)(?:$|[_\s.:-])/i.test(selectorPart)) return;
    if (isCurrentSectionSelector(selectorPart)) pbSpacerCurrent.push(selectorPart.substring(0, 40));
    else pbSpacerOther.push(selectorPart.substring(0, 40));
  });
  if (pbSpacerCurrent.length) {
    FAIL(`의미 없는 padding-bottom 높이 대체 ${pbSpacerCurrent.length}개 — 실제 flow/card/panel 구조로 높이를 만들 것: ${pbSpacerCurrent.slice(0,3).join(', ')}`);
    ok = false;
  } else if (pbSpacerOther.length) {
    WARN(`다른 섹션 padding-bottom spacer 의심 ${pbSpacerOther.length}개 (현재 섹션은 OK)`);
  }

  // 금지 18: font-size 있는 블록에 white-space:nowrap 누락
  // 줄바꿈은 br로만 제어. 모든 텍스트에 nowrap 필수.
  // 현재 섹션(SECTION) 블록만 FAIL, 나머지는 WARN
  const nowrapMissing = [];
  const nowrapMissingOther = [];
  const planDataForNowrap = loadLocalPlanForSpec(currentSpec);
  const multilineSelectors = collectMultilineTextSelectors(planDataForNowrap);
  blocks.forEach(block => {
    const body = block.split('{')[1] || '';
    // selector에서 /* 주석 */ 제거 후 trim
    const rawSel = block.split('{')[0];
    const sel = rawSel.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const selParts = sel.split(',').map(function(part) { return part.trim(); }).filter(Boolean);
    const allowedMultiline = /white-space\s*:\s*(?:pre-line|pre-wrap)/.test(body) &&
      selParts.length > 0 &&
      selParts.every(function(part) { return multilineSelectors.has(part); });
    if (/font-size\s*:/.test(body) && !/white-space\s*:\s*nowrap/.test(body) && !allowedMultiline) {
      if (!/^\.(?:fr-)?con\d+\s*$/.test(sel.trim()) && !/@media/.test(sel)) {
        const isCurrentSection = isCurrentSectionSelector(sel);
        if (isCurrentSection) {
          nowrapMissing.push(sel.substring(0, 40));
        } else {
          nowrapMissingOther.push(sel.substring(0, 40));
        }
      }
    }
  });
  if (nowrapMissing.length) {
    FAIL(`font-size에 white-space:nowrap 누락 ${nowrapMissing.length}개 — ${nowrapMissing.slice(0,3).join(', ')}`);
    ok = false;
  } else if (nowrapMissingOther.length) {
    WARN(`다른 섹션 font-size nowrap 누락 ${nowrapMissingOther.length}개 (현재 섹션은 OK)`);
  } else {
    PASS('텍스트 white-space:nowrap 전부 있음');
  }

  // 금지 18b: leaf 텍스트 width 고정 금지
  // 폰트는 intrinsic width를 쓰는 편이 폰트 매핑/모바일 대응에 안전하다.
  const textWidthCurrent = [];
  const textWidthOther = [];
  blocks.forEach(block => {
    const body = block.split('{')[1] || '';
    const sel = block.split('{')[0].trim();
    if (!/font-size\s*:/.test(body) || !/width\s*:/.test(body)) return;
    if (/background\s*:|border\s*:|padding\s*:|padding-(?:top|bottom|left|right)\s*:/.test(body)) return;
    if (/(?:^|[_\s.:-])(?:row|card|panel|badge|button|btn|form|field|input|select|textarea|box|tab)(?:$|[_\s.:-])/i.test(sel)) return;
    if (isCurrentSectionSelector(sel)) textWidthCurrent.push(sel.substring(0, 40));
    else textWidthOther.push(sel.substring(0, 40));
  });
  if (textWidthCurrent.length) {
    FAIL(`현재 섹션 leaf 텍스트 width 고정 ${textWidthCurrent.length}개 — 폰트는 intrinsic width 사용: ${textWidthCurrent.slice(0,3).join(', ')}`);
    ok = false;
  } else if (textWidthOther.length) {
    WARN(`다른 섹션 leaf 텍스트 width 고정 의심 ${textWidthOther.length}개 (현재 섹션은 OK)`);
  } else {
    PASS('leaf 텍스트 width 고정 없음');
  }

  // 금지 18c: 부모 기준 중앙 정렬을 margin-left로 때우기 금지
  // 중앙축 배치가 목적이면 부모에 flex column + align-items:center를 두는 편이 모바일 대응에 안전하다.
  const centerByMarginCurrent = [];
  const centerByMarginOther = [];
  blocks.forEach(block => {
    const body = block.split('{')[1] || '';
    const sel = block.split('{')[0].trim();
    const mlMatch = body.match(/margin-left\s*:\s*([\d.]+)%/);
    if (!mlMatch) return;
    const ml = Number(mlMatch[1]);
    if (!Number.isFinite(ml) || ml === 0) return;

    const widthMatch = body.match(/width\s*:\s*([\d.]+)%/);
    const textCenterNoBox = /font-size\s*:/.test(body) &&
      /text-align\s*:\s*center/.test(body) &&
      !/width\s*:/.test(body) &&
      !/background\s*:|border\s*:|padding\s*:|padding-(?:top|bottom|left|right)\s*:/.test(body);
    const centeredWidthChild = widthMatch &&
      /(?:display\s*:\s*flex|line-height\s*:\s*0|img|image|bubble|copy|badge|zero|logo|icon)/i.test(sel + body) &&
      Math.abs((ml + Number(widthMatch[1]) / 2) - 50) <= 1.5;

    if (!textCenterNoBox && !centeredWidthChild) return;
    if (isCurrentSectionSelector(sel)) centerByMarginCurrent.push(sel.substring(0, 40));
    else centerByMarginOther.push(sel.substring(0, 40));
  });
  if (centerByMarginCurrent.length) {
    FAIL(`현재 섹션 중앙정렬 margin-left 의심 ${centerByMarginCurrent.length}개 — 부모 flex/align-items:center 사용: ${centerByMarginCurrent.slice(0,3).join(', ')}`);
    ok = false;
  } else if (centerByMarginOther.length) {
    WARN(`다른 섹션 중앙정렬 margin-left 의심 ${centerByMarginOther.length}개 (현재 섹션은 OK)`);
  } else {
    PASS('중앙정렬 margin-left 대체 없음');
  }

  // 금지 19: bgimg에 width:100% 사용 금지 → naturalWidth/캔버스 필수
  // 현재 섹션만 FAIL, 나머지는 WARN
  const bgWidth100 = [];
  const bgWidth100Other = [];
  blocks.forEach(block => {
    const selRaw = block.split('{')[0].trim();
    const sel = selRaw.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const body = block.split('{')[1] || '';
    if (/(_bg|_photo)\b/.test(sel) && /width\s*:\s*100%\s*[;}]/.test(body) && !/\bimg\b/.test(sel)) {
      const isCurrentSection = isCurrentSectionSelector(sel);
      if (isCurrentSection) {
        bgWidth100.push(sel.substring(0, 40));
      } else {
        bgWidth100Other.push(sel.substring(0, 40));
      }
    }
  });
  if (bgWidth100.length) {
    FAIL(`bgimg에 width:100% ${bgWidth100.length}개 — naturalWidth/${CANVAS} 사용 필수: ${bgWidth100.join(', ')}`);
    ok = false;
  } else if (bgWidth100Other.length) {
    WARN(`다른 섹션 bgimg width:100% ${bgWidth100Other.length}개 (현재 섹션은 OK)`);
  } else {
    PASS('bgimg width:100% 없음');
  }

  return ok;
}

// ════════════════════════════════════════════
// STEP 4.5: 이미지 전수 HTML 사용 확인
// ════════════════════════════════════════════
function step4_5() {
  console.log('\n══ STEP 4.5: 이미지 HTML 사용 확인 ══');

  const htmlPath = path.join(PROJECT_ROOT, 'theme/design/template', page, 'index.html');
  if (!fs.existsSync(htmlPath)) { WARN('HTML 파일 없음: ' + htmlPath); return; }

  const html = selectorArg ? scopedTemplateHtml(selectorArg) : fs.readFileSync(htmlPath, 'utf-8');
  if (!html) { WARN('현재 selector HTML 스코프를 찾지 못함: ' + selectorArg); return; }
  const ignoredAssets = new Set();
  const planData = loadLocalPlanForSpec(currentSpec);
  if (planData) {
    (planData.ignoredAssets || []).forEach(item => {
      const file = typeof item === 'string' ? item : item && item.file;
      if (file) ignoredAssets.add(path.basename(file));
    });
  }
  const imagesRoot2 = imageDirArg
    ? (path.isAbsolute(imageDirArg) ? imageDirArg : path.join(PROJECT_ROOT, imageDirArg))
    : path.join(PROJECT_ROOT, 'images');
  let imgDir = imagesRoot2;
  let imgFiles = [];
  try {
    imgFiles = fs.readdirSync(imagesRoot2)
      .filter(f => !fs.statSync(path.join(imagesRoot2, f)).isDirectory() && isSectionImageFile(f));
    if (imgFiles.length === 0 && !imageDirArg) {
      const subDirs = fs.readdirSync(imagesRoot2).filter(f => {
        const fp = path.join(imagesRoot2, f);
        return fs.statSync(fp).isDirectory() && !fs.lstatSync(fp).isSymbolicLink();
      });
      for (const sub of subDirs) {
        const subPath = path.join(imagesRoot2, sub);
        const found = fs.readdirSync(subPath).filter(f => isSectionImageFile(f));
        if (found.length > 0) { imgDir = subPath; imgFiles = found; break; }
      }
    }
  } catch (e) { return; }

  let unused = [];
  let checkedImages = 0;
  imgFiles.forEach(f => {
    if (ignoredAssets.has(f)) return;
    checkedImages++;
    if (!html.includes(f)) {
      unused.push(f);
    }
  });

  if (unused.length > 0) {
    unused.forEach(f => {
      if (/_m\.(png|jpe?g|webp|gif)$/i.test(f)) WARN(`모바일 변형 이미지 미사용: ${f} — desktop replay HTML에는 없음`);
      else WARN(`이미지 미사용: ${f} — HTML에 없음`);
    });
  } else {
    const ignoredCount = imgFiles.length - checkedImages;
    PASS(`${checkedImages}개 이미지 전부 HTML에 사용됨` + (ignoredCount ? ` (${ignoredCount}개 ignoredAssets)` : ''));
  }

  // 이미지 div wrapper 필수 검증 — <img>가 div 안에 있는지
  const imgTags = Array.from(html.matchAll(/<img[^>]*src="[^"]*con\d+[^"]*"[^>]*>/g));
  let noWrapper = 0;
  imgTags.forEach(match => {
    const tag = match[0];
    // img 앞의 HTML에서 바로 앞 태그가 <div인지 확인 (간이 검증)
    const idx = match.index;
    if (idx > 0) {
      const before = html.substring(Math.max(0, idx - 100), idx).trim();
      // 바로 앞이 <section 또는 <p 이면 wrapper 없음
      if (before.endsWith('>') && !/<div[^>]*>\s*$/.test(before)) {
        noWrapper++;
      }
    }
  });
  if (noWrapper > 0) {
    WARN(`이미지 ${noWrapper}개 div wrapper 없이 직접 배치 — div로 감싸기 권장`);
  }

}

// ════════════════════════════════════════════
// STEP 5: 이미지 렌더링=원본 검증 (Playwright)
// ════════════════════════════════════════════
function step5(sectionSelector) {
  console.log('\n══ STEP 5: 이미지 렌더링=원본 검증 ══');

  const sel = sectionSelector || '.fr-' + section;
  const script = `
    const { chromium } = require('playwright');
    (async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage({ viewport: { width: ${CANVAS}, height: 1080 } });
      await page.goto('${url}');
      await page.waitForTimeout(2000);
      const results = await page.evaluate((sel) => {
        const section = document.querySelector(sel);
        if (!section) return { error: 'section not found: ' + sel };
        const imgs = section.querySelectorAll('img');
        return Array.from(imgs).filter(img => {
          const cs = getComputedStyle(img);
          const rect = img.getBoundingClientRect();
          return !img.src.includes('?TODO') &&
                 cs.display !== 'none' &&
                 cs.visibility !== 'hidden' &&
                 parseFloat(cs.opacity) !== 0 &&
                 rect.width > 0 &&
                 rect.height > 0;
        }).map(img => ({
          src: img.src.split('/').pop(),
          rendered: Math.round(img.getBoundingClientRect().width * 100) / 100,
          natural: img.naturalWidth,
          psdWidth: img.closest('[data-psd-width]') ? parseFloat(img.closest('[data-psd-width]').getAttribute('data-psd-width')) : null,
          match: Math.abs(img.getBoundingClientRect().width - (img.closest('[data-psd-width]') ? parseFloat(img.closest('[data-psd-width]').getAttribute('data-psd-width')) : img.naturalWidth)) < 1
        }));
      }, '${sel}');
      console.log(JSON.stringify(results));
      await browser.close();
    })();
  `;

  try {
    const output = execSync(`node -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      encoding: 'utf-8',
      timeout: 30000
    });
    const results = JSON.parse(output.trim());

    if (results.error) {
      FAIL(results.error);
      return false;
    }

    let allMatch = true;
    results.forEach(r => {
      if (r.match) {
        if (r.psdWidth) PASS(`${r.src}: ${r.rendered}px = PSD ${r.psdWidth}px`);
        else PASS(`${r.src}: ${r.rendered}px = ${r.natural}px`);
      } else {
        // anchor cover 이미지는 스케일링 OK
        if (r.rendered > r.natural * 1.5) {
          WARN(`${r.src}: ${r.rendered}px vs ${r.natural}px (cover 이미지?)`)
        } else {
          const expectedWidth = r.psdWidth || r.natural;
          const expectedLabel = r.psdWidth ? `PSD ${r.psdWidth}px` : `원본 ${r.natural}px`;
          FAIL(`${r.src}: 렌더링 ${r.rendered}px ≠ ${expectedLabel} (차이 ${(r.rendered - expectedWidth).toFixed(2)}px)`);
          allMatch = false;
        }
      }
    });

    return allMatch;
  } catch (e) {
    FAIL('Playwright 실행 실패: ' + e.message.substring(0, 200));
    return false;
  }
}

// ════════════════════════════════════════════
// STEP 5.5: position-checker (PSD 좌표 vs 렌더링 위치 대조)
// ════════════════════════════════════════════
function step5_5(specPath) {
  console.log('\n══ STEP 5.5: 좌표 검증 (position-checker) ══');

  var sp = specPath || currentSpec;
  if (!sp) {
    // spec 파일 자동 탐색
    var guesses = [
      path.join(PROJECT_ROOT, 'psd', 'spec_' + page + '_' + section + '.json'),
      path.join(PROJECT_ROOT, 'psd', 'spec_' + section + '.json'),
      path.join(PROJECT_ROOT, '.planning', page + '_' + section, 'spec_' + page + '_' + section + '.json'),
      path.join(PROJECT_ROOT, 'spec_' + section + '.json')
    ];
    for (var g of guesses) {
      if (fs.existsSync(g)) { sp = g; break; }
    }
  }
  if (!sp || !fs.existsSync(sp)) {
    console.log('  ⏭️  spec 파일 없음 — 스킵');
    return;
  }

  var sel = selectorArg || '.fr-' + section;
  var checker = path.join(PROJECT_ROOT, 'tools', 'position-checker.js');
  if (!fs.existsSync(checker)) {
    WARN('position-checker.js 없음');
    return;
  }

  try {
    var output = execSync(
      'node "' + checker + '" "' + sp + '" "' + url + '" "' + sel + '" --tolerance 5' + (summaryMode ? ' --json' : ''),
      { encoding: 'utf-8', timeout: 30000, cwd: PROJECT_ROOT }
    );
    if (!summaryMode) console.log(output);

    // 결과 파싱 — "FAIL:숫자"에서 실제 숫자 추출 (FAIL:0은 PASS)
    var realFails = 0;
    var warnCount = 0;
    if (summaryMode) {
      try {
        var parsedPosition = JSON.parse(output);
        realFails = Number(parsedPosition.fails || 0);
        warnCount = Number(parsedPosition.warns || 0);
      } catch(e) {
        var failMatchJsonFallback = output.match(/FAIL:(\d+)/);
        realFails = failMatchJsonFallback ? parseInt(failMatchJsonFallback[1]) : 0;
      }
    } else {
      var failMatch = output.match(/FAIL:(\d+)/);
      realFails = failMatch ? parseInt(failMatch[1]) : 0;
    }
    if (realFails > 0) {
      FAIL('position-checker: ' + realFails + '개 좌표 불일치 (tolerance 5px)');
    } else if (output.includes('POSITION CHECK PASS') || output.includes('✅ PASS')) {
      PASS('position-checker: 좌표 검증 통과');
    } else if (summaryMode) {
      PASS('position-checker: 좌표 검증 통과' + (warnCount ? ' (WARN ' + warnCount + ')' : ''));
    } else {
      PASS('position-checker 실행 완료');
    }
  } catch (e) {
    var errMsg = e.stdout || e.message || '';
    var errRealFails = 0;
    try {
      var parsedErrPosition = JSON.parse(errMsg);
      errRealFails = Number(parsedErrPosition.fails || 0);
    } catch(_) {
      var errFailMatch = errMsg.match(/FAIL:(\d+)/);
      errRealFails = errFailMatch ? parseInt(errFailMatch[1]) : 0;
    }
    if (errRealFails > 0) {
      console.log(errMsg);
      FAIL('position-checker: ' + errRealFails + '개 좌표 불일치');
    } else {
      WARN('position-checker 실행 오류: ' + errMsg.substring(0, 150));
    }
  }
}

// ════════════════════════════════════════════
// STEP 5.7: 렌더링 스타일 vs spec 대조 (set-based comparison)
//   1) bg-color: spec fill colors vs rendered bg-colors
//   2) text color: spec text colors vs rendered text colors
//   3) font-weight: spec font-weights vs rendered font-weights
//   4) border-color: only on elements with visible borders
// ════════════════════════════════════════════
function step5_7(specPath) {
  console.log('\n══ STEP 5.7: 렌더링 스타일 vs spec 대조 ══');

  var sp = specPath || currentSpec;
  if (!sp || !fs.existsSync(sp)) { console.log('  ⏭️  spec 없음 — 스킵'); return; }

  var spec;
  try { spec = JSON.parse(fs.readFileSync(sp, 'utf-8')); } catch(e) { WARN('spec 로드 실패'); return; }
  var localPlan = loadLocalPlanForSpec(sp);
  var multilineSelectorsForWrap = Array.from(collectMultilineTextSelectors(localPlan));
  var ignoredShapeNames = new Set();
  if (localPlan && Array.isArray(localPlan.ignoredShapes)) {
    localPlan.ignoredShapes.forEach(function(item) {
      if (typeof item === 'string') ignoredShapeNames.add(item);
      else if (item && item.name) ignoredShapeNames.add(item.name);
    });
  }

  var sel = selectorArg || '.fr-' + section;
  var tmpScript = path.join(PROJECT_ROOT, '_style_check_' + Date.now() + '.js');

  // ── 프로젝트 공통색 (허용 목록 — WARN/FAIL 대상에서 제외) ──
  var COMMON_COLORS = ['#043915','#2d2a26','#f2fff3','#fafafa','#fafaf9','#ffffff','#000000'];

  // ── hex 변환 함수 (여기서 정의, Playwright 밖에서도 사용) ──
  function rgbToHex(rgb) {
    if (!rgb) return '';
    var m = rgb.match(/rgb\w?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return rgb.toLowerCase();
    return '#' + [m[1],m[2],m[3]].map(function(x) { return parseInt(x).toString(16).padStart(2,'0'); }).join('');
  }

  // ── 1. spec에서 고유 색상/스타일 세트 추출 ──

  // composite 이미지 영역 추출 (내부 rect/text는 스킵 대상)
  var compositeAreas = [];
  if (spec.images) {
    spec.images.forEach(function(img) {
      if (!img.possibleFile || /(?:^|_)bg\./i.test(img.possibleFile) || /bg/i.test(img.possibleFile)) return;
      if (img.w > 50 && img.h > 50) {
        var area = img.clippingRect || img;
        compositeAreas.push({ x: area.x, y: area.y, w: area.w, h: area.h });
      }
    });
  }
  if (spec.groups) {
    spec.groups.forEach(function(g) {
      if (!g.name || !g.bbox) return;
      var hasGroupImage = ['.png', '.jpg', '.jpeg', '.webp'].some(function(ext) {
        return fs.existsSync(path.join(PROJECT_ROOT, 'images', g.name + ext));
      });
      if (!hasGroupImage) return;
      compositeAreas.push({ x: g.bbox.x, y: g.bbox.y, w: g.bbox.w, h: g.bbox.h });
    });
  }
  function isInsideComposite(x, y, w, h) {
    return compositeAreas.some(function(area) {
      return x >= area.x - 5 && y >= area.y - 5 &&
             (x + w) <= (area.x + area.w + 5) && (y + h) <= (area.y + area.h + 5);
    });
  }
  var completeTextSigSet = {};
  if (spec.texts) {
    spec.texts.forEach(function(t) {
      if (t.possibleFile && t.possibleFile !== 'TODO') {
        completeTextSigSet[(t.content || t.name || '') + '|' + Math.round(t.w || 0) + '|' + Math.round(t.h || 0)] = true;
      }
    });
  }
  function isCompleteImageText(t) {
    if (!t) return false;
    if (t.possibleFile && t.possibleFile !== 'TODO') return true;
    return !!completeTextSigSet[(t.content || t.name || '') + '|' + Math.round(t.w || 0) + '|' + Math.round(t.h || 0)];
  }

  // 1a. bg-color: spec.rects의 fill — 대형 rect만 (w>400, 섹션bg/header/footer급)
  // composite 이미지 내부 + 소형 rect는 제외
  var specFillSet = {};  // hex -> [names]
  if (spec.rects) {
    spec.rects.forEach(function(r) {
      if (ignoredShapeNames.has(r.name)) return;
      if (!r.fill || typeof r.fill !== 'string') return;
      var hex = r.fill.toLowerCase();
      if (hex === '#ffffff' || hex === '#000000' || hex === 'transparent') return;
      if (isInsideComposite(r.x, r.y, r.w, r.h)) return;
      if (r.w < 400) return; // 소형 rect(카드 내부, 뱃지 등) 스킵 — composite에 포함됐을 가능성
      if (!specFillSet[hex]) specFillSet[hex] = [];
      specFillSet[hex].push(r.name || '(unnamed)');
    });
  }

  // 1b. text color: spec.texts의 segments[*].color (composite 내부 + 소형 제외)
  var specTextColorSet = {};  // hex -> [text previews]
  if (spec.texts) {
    spec.texts.forEach(function(t) {
      if (!t.segments) return;
      if (isCompleteImageText(t)) return;
      if (isInsideComposite(t.x, t.y, t.w, t.h)) return;
      if (t.w < 30) return; // 아주 작은 텍스트 스킵
      t.segments.forEach(function(seg) {
        if (!seg.color) return;
        var hex = seg.color.toLowerCase();
        if (!specTextColorSet[hex]) specTextColorSet[hex] = [];
        var preview = (t.content || '').substring(0, 20);
        if (specTextColorSet[hex].length < 3) specTextColorSet[hex].push(preview);
      });
    });
  }

  // 1c. font-weight: spec.texts의 segments[*].fontWeight
  var specFontWeightSet = {};  // weight -> [text previews]
  if (spec.texts) {
    spec.texts.forEach(function(t) {
      if (!t.segments) return;
      if (isCompleteImageText(t)) return;
      if (isInsideComposite(t.x, t.y, t.w, t.h)) return;
      if (t.w < 30) return;
      t.segments.forEach(function(seg) {
        if (!seg.fontWeight) return;
        var fw = String(seg.fontWeight);
        if (!specFontWeightSet[fw]) specFontWeightSet[fw] = [];
        var preview = (t.content || '').substring(0, 20);
        if (specFontWeightSet[fw].length < 3) specFontWeightSet[fw].push(preview);
      });
    });
  }

  // 1d. border-color: spec.rects with stroke.color (composite 내부 + 소형 제외)
  var specBorderColorSet = {};  // hex -> [names]
  if (spec.rects) {
    spec.rects.forEach(function(r) {
      if (ignoredShapeNames.has(r.name)) return;
      if (!r.stroke || !r.stroke.color) return;
      if (isInsideComposite(r.x, r.y, r.w, r.h)) return;
      if (r.w < 400) return;
      var hex = r.stroke.color.toLowerCase();
      if (!specBorderColorSet[hex]) specBorderColorSet[hex] = [];
      specBorderColorSet[hex].push(r.name || '(unnamed)');
    });
  }

  var hasAnythingToCheck = Object.keys(specFillSet).length > 0 ||
    Object.keys(specTextColorSet).length > 0 ||
    Object.keys(specFontWeightSet).length > 0 ||
    Object.keys(specBorderColorSet).length > 0;

  if (!hasAnythingToCheck) {
    console.log('  ⏭️  체크할 스타일 항목 없음 — 스킵');
    return;
  }

  // ── 2. Playwright로 섹션 내 모든 요소의 computed style 수집 ──
  var code = [
    "const { chromium } = require('playwright');",
    "(async () => {",
    "  const browser = await chromium.launch();",
    "  const pg = await browser.newPage({ viewport: { width: " + CANVAS + ", height: 1080 } });",
    "  await pg.goto('" + url + "');",
    "  await pg.waitForTimeout(2000);",
    "  const results = await pg.evaluate((sel) => {",
    "    const sec = document.querySelector(sel);",
    "    if (!sec) return { error: 'section not found: ' + sel };",
    "    const bgColors = new Set();",
    "    const textColors = new Set();",
    "    const fontWeights = new Set();",
    "    const borderColors = new Set();",
    "    const lineWrapIssues = [];",
    "    const all = sec.querySelectorAll('*');",
    "    all.forEach(el => {",
    "      const cs = getComputedStyle(el);",
    "      const rect = el.getBoundingClientRect();",
    "      if (rect.width < 1 || rect.height < 1) return;",
    // bg-color
    "      const bg = cs.backgroundColor;",
    "      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {",
    "        bgColors.add(bg);",
    "      }",
    // text color — only on leaf text nodes
    "      if (el.childNodes.length > 0) {",
    "        for (const cn of el.childNodes) {",
    "          if (cn.nodeType === 3 && cn.textContent.trim()) {",
    "            textColors.add(cs.color);",
    "            fontWeights.add(cs.fontWeight);",
    "            break;",
    "          }",
    "        }",
    "      }",
    // border-color — only if border is actually visible
    "      const bStyle = cs.borderTopStyle || cs.borderStyle;",
    "      const bWidth = parseFloat(cs.borderTopWidth) || 0;",
    "      if (bStyle && bStyle !== 'none' && bWidth > 0) {",
    "        borderColors.add(cs.borderTopColor);",
    "      }",
    "      const bStyleR = cs.borderRightStyle;",
    "      const bWidthR = parseFloat(cs.borderRightWidth) || 0;",
    "      if (bStyleR && bStyleR !== 'none' && bWidthR > 0) {",
    "        borderColors.add(cs.borderRightColor);",
    "      }",
    "      const bStyleB = cs.borderBottomStyle;",
    "      const bWidthB = parseFloat(cs.borderBottomWidth) || 0;",
    "      if (bStyleB && bStyleB !== 'none' && bWidthB > 0) {",
    "        borderColors.add(cs.borderBottomColor);",
    "      }",
    "      const bStyleL = cs.borderLeftStyle;",
    "      const bWidthL = parseFloat(cs.borderLeftWidth) || 0;",
    "      if (bStyleL && bStyleL !== 'none' && bWidthL > 0) {",
    "        borderColors.add(cs.borderLeftColor);",
    "      }",
    "    });",
    "    const multilineSelectors = " + JSON.stringify(multilineSelectorsForWrap) + ";",
    "    multilineSelectors.forEach(selector => {",
    "      sec.querySelectorAll(selector).forEach(el => {",
    "        if (!el || el.hasAttribute('data-allow-softwrap')) return;",
    "        const rect = el.getBoundingClientRect();",
    "        if (rect.width < 1 || rect.height < 1) return;",
    "        const brCount = el.querySelectorAll ? el.querySelectorAll('br').length : 0;",
    "        if (brCount === 0) return;",
    "        const html = el.innerHTML || '';",
    "        const explicitNonEmpty = html.split(/<br\\s*\\/?>/i)",
    "          .map(s => s.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim())",
    "          .filter(Boolean).length;",
    "        const renderedNonEmpty = (el.innerText || '')",
    "          .split(/\\n/)",
    "          .map(s => s.replace(/\\s+/g, ' ').trim())",
    "          .filter(Boolean).length;",
    "        if (renderedNonEmpty > explicitNonEmpty) {",
    "          lineWrapIssues.push({",
    "            selector,",
    "            text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 60),",
    "            explicit: explicitNonEmpty,",
    "            rendered: renderedNonEmpty",
    "          });",
    "        }",
    "      });",
    "    });",
    // also check the section element itself
    "    const secCs = getComputedStyle(sec);",
    "    const secBg = secCs.backgroundColor;",
    "    if (secBg && secBg !== 'rgba(0, 0, 0, 0)' && secBg !== 'transparent') {",
    "      bgColors.add(secBg);",
    "    }",
    "    return {",
    "      bgColors: Array.from(bgColors),",
    "      textColors: Array.from(textColors),",
    "      fontWeights: Array.from(fontWeights),",
    "      borderColors: Array.from(borderColors),",
    "      lineWrapIssues",
    "    };",
    "  }, '" + sel + "');",
    "  console.log(JSON.stringify(results));",
    "  await browser.close();",
    "})();"
  ].join('\n');

  fs.writeFileSync(tmpScript, code);

  try {
    var output = execSync('node "' + tmpScript + '"', { encoding: 'utf-8', timeout: 30000 });
    var rendered = JSON.parse(output.trim());
    fs.unlinkSync(tmpScript);

    if (rendered.error) { FAIL('style check: ' + rendered.error); return; }

    var styleIssues = 0;

    // Convert rendered sets to hex
    var renderedBgHex = new Set(rendered.bgColors.map(function(c) { return rgbToHex(c); }));
    var renderedTextHex = new Set(rendered.textColors.map(function(c) { return rgbToHex(c); }));
    var renderedFontWeights = new Set(rendered.fontWeights.map(function(w) { return String(w); }));
    var renderedBorderHex = new Set(rendered.borderColors.map(function(c) { return rgbToHex(c); }));

    // ── CHECK 1: bg-color — spec fill present in rendering? ──
    var fillKeys = Object.keys(specFillSet);
    if (fillKeys.length > 0) {
      console.log('  --- bg-color ---');
      fillKeys.forEach(function(hex) {
        if (renderedBgHex.has(hex)) {
          PASS('bg-color ' + hex + ' 존재 (' + specFillSet[hex].join(', ') + ')');
        } else {
          FAIL('bg-color ' + hex + ' 렌더링에 미존재 — spec: ' + specFillSet[hex].join(', '));
          styleIssues++;
        }
      });

      // Reverse check: rendered bg-color not in spec? (WARN only, skip common colors)
      var allAllowedBg = new Set(COMMON_COLORS.concat(fillKeys));
      renderedBgHex.forEach(function(hex) {
        if (!hex || hex === 'transparent') return;
        if (!allAllowedBg.has(hex)) {
          WARN('렌더링에 spec 외 bg-color: ' + hex);
        }
      });
    }

    // ── CHECK 2: text color — spec text color present in rendering? ──
    var textColorKeys = Object.keys(specTextColorSet);
    if (textColorKeys.length > 0) {
      console.log('  --- text color ---');
      textColorKeys.forEach(function(hex) {
        if (renderedTextHex.has(hex)) {
          PASS('text-color ' + hex + ' 존재');
        } else {
          WARN('text-color ' + hex + ' 렌더링에 미존재 — spec: "' + specTextColorSet[hex].join('", "') + '"');
        }
      });
    }

    // ── CHECK 3: font-weight — spec weight present in rendering? (WARN only) ──
    var fwKeys = Object.keys(specFontWeightSet);
    if (fwKeys.length > 0) {
      console.log('  --- font-weight ---');
      // Normalize: "Bold" -> "700", "Regular" -> "400", etc.
      var FW_MAP = { 'Thin':'100','ExtraLight':'200','Light':'300','Regular':'400','Normal':'400',
        'Medium':'500','SemiBold':'600','DemiBold':'600','Bold':'700','ExtraBold':'800',
        'Black':'900','Heavy':'900' };
      fwKeys.forEach(function(fw) {
        var normalized = FW_MAP[fw] || fw;
        if (renderedFontWeights.has(normalized) || renderedFontWeights.has(fw)) {
          PASS('font-weight ' + fw + (fw !== normalized ? ' (' + normalized + ')' : '') + ' 존재');
        } else {
          WARN('font-weight ' + fw + (fw !== normalized ? ' (' + normalized + ')' : '') + ' 렌더링에 미존재 — spec: "' + specFontWeightSet[fw].join('", "') + '"');
        }
      });
    }

    // ── CHECK 4: border-color — spec stroke colors vs rendered border colors ──
    var borderKeys = Object.keys(specBorderColorSet);
    if (borderKeys.length > 0) {
      console.log('  --- border-color ---');
      if (renderedBorderHex.size === 0) {
        borderKeys.forEach(function(hex) {
          WARN('border-color ' + hex + ' — 렌더링에 border 요소 없음 (composite 이미지?) — spec: ' + specBorderColorSet[hex].join(', '));
        });
      } else {
        borderKeys.forEach(function(hex) {
          if (renderedBorderHex.has(hex)) {
            PASS('border-color ' + hex + ' 존재');
          } else {
            FAIL('border-color ' + hex + ' 렌더링에 미존재 — spec: ' + specBorderColorSet[hex].join(', ') + ' / 렌더링 borders: ' + Array.from(renderedBorderHex).join(', '));
            styleIssues++;
          }
        });
      }
    }

    if (Array.isArray(rendered.lineWrapIssues) && rendered.lineWrapIssues.length > 0) {
      rendered.lineWrapIssues.forEach(function(issue) {
        FAIL('explicit br 텍스트 soft-wrap 발생 — ' + (issue.selector || '(unknown)') + ' "' + issue.text + '" (explicit ' + issue.explicit + ' lines, rendered ' + issue.rendered + ' lines)');
        styleIssues++;
      });
    }

    // ── Summary ──
    if (styleIssues === 0) {
      var totalChecks = fillKeys.length + textColorKeys.length + fwKeys.length + borderKeys.length;
      PASS('렌더링 스타일 대조 통과 (bg:' + fillKeys.length + ' text:' + textColorKeys.length + ' fw:' + fwKeys.length + ' border:' + borderKeys.length + ' = ' + totalChecks + '개 검증)');
    }

  } catch(e) {
    try { fs.unlinkSync(tmpScript); } catch(_) {}
    FAIL('style check 실행 오류: ' + e.message.substring(0, 200));
  }
}

// ════════════════════════════════════════════
// STEP 7: Swiper 자동 검증 (섹션 내 .swiper 있을 때만)
// ════════════════════════════════════════════
function step7(sectionSelector) {
  console.log('\n══ STEP 7: Swiper 검증 ══');

  const sel = sectionSelector || '.fr-' + section;
  const derivedSpecPath = specFile
    ? (path.isAbsolute(specFile) ? specFile : path.join(PROJECT_ROOT, specFile))
    : path.join(PROJECT_ROOT, 'psd', 'spec_' + page + '_' + section + '.json');
  const localPlan = loadLocalPlanForSpec(derivedSpecPath) || null;

  function findFirstSwiper(nodes) {
    for (const node of nodes || []) {
      if (!node || typeof node !== 'object') continue;
      if (node.type === 'swiper') return node;
      const nested = findFirstSwiper(node.children || []);
      if (nested) return nested;
    }
    return null;
  }

  const swiperPlan = localPlan ? findFirstSwiper(localPlan.elements || []) : null;
  const swiperConfig = swiperPlan && swiperPlan.swiperConfig
    ? swiperPlan.swiperConfig
    : (localPlan && localPlan.swiperConfig ? localPlan.swiperConfig : {});
  const isStripSwiper = swiperConfig.mode === 'strip' || swiperConfig.centeredSlides === false;
  const requireActiveScale = swiperConfig.requireActiveScale !== false;
  const requireNav = swiperConfig.requireNav !== false;

  if (!/\bswiper\b/.test(scopedTemplateHtml(sel))) {
    console.log('  ⏭️  템플릿에 Swiper 없음 — 브라우저 검증 생략');
    return;
  }
  const tmpScript = path.join(PROJECT_ROOT, '_swiper_check_' + Date.now() + '.js');

  const code = [
    "const { chromium } = require('playwright');",
    "(async () => {",
    "  const browser = await chromium.launch();",
    "  const page = await browser.newPage({ viewport: { width: " + CANVAS + ", height: 1080 } });",
    "  await page.goto('" + url + "');",
    "  await page.waitForTimeout(2000);",
    "  const results = await page.evaluate((sel) => {",
    "    const sec = document.querySelector(sel);",
    "    if (!sec) return { hasSwiper: false };",
    "    const swiper = sec.querySelector('.swiper');",
    "    if (!swiper) return { hasSwiper: false };",
    "    const activeSlide = sec.querySelector('.swiper-slide-active');",
    "    if (!activeSlide) return { hasSwiper: true, error: 'active slide not found' };",
    "    const activeChild = activeSlide.firstElementChild || activeSlide;",
    "    const activeBox = activeChild.getBoundingClientRect();",
    "    const activeOp = parseFloat(getComputedStyle(activeChild).opacity);",
    "    const inactiveSlides = sec.querySelectorAll('.swiper-slide:not(.swiper-slide-active)');",
    "    let inactiveWidths = [], inactiveOpacities = [];",
    "    inactiveSlides.forEach(s => {",
    "      const child = s.firstElementChild || s;",
    "      const box = child.getBoundingClientRect();",
    "      if (box.width > 0) { inactiveWidths.push(box.width); inactiveOpacities.push(parseFloat(getComputedStyle(child).opacity)); }",
    "    });",
    "    const avgInW = inactiveWidths.reduce((a,b)=>a+b,0) / inactiveWidths.length;",
    "    const avgInOp = inactiveOpacities.reduce((a,b)=>a+b,0) / inactiveOpacities.length;",
    "    const viewportCenter = " + CANVAS + " / 2;",
    "    const activeCenter = activeBox.x + activeBox.width / 2;",
    "    const allSlides = Array.from(sec.querySelectorAll('.swiper-slide'));",
    "    const visibleBoxes = allSlides.map(s => s.getBoundingClientRect()).filter(b => b.x > -b.width && b.x < " + CANVAS + " && b.width > 0).sort((a,b) => a.x - b.x);",
    "    let gaps = [];",
    "    for (let i = 1; i < visibleBoxes.length; i++) gaps.push(visibleBoxes[i].x - (visibleBoxes[i-1].x + visibleBoxes[i-1].width));",
    "    const slideRadius = getComputedStyle(activeSlide).borderRadius;",
    "    const childRadius = getComputedStyle(activeChild).borderRadius;",
    "    const slideWidth = getComputedStyle(activeSlide).width;",
    "    const hasNav = !!(sec.querySelector('[class*=prev]') && sec.querySelector('[class*=next]'));",
    "    return {",
    "      hasSwiper: true, activeW: activeBox.width, avgInactiveW: avgInW,",
    "      sizeRatio: avgInW / activeBox.width, sizeDiff: Math.abs(activeBox.width - avgInW) > 5,",
    "      activeOpacity: activeOp, avgInactiveOpacity: avgInOp, opacityDiff: activeOp > avgInOp + 0.1,",
    "      centerOffset: Math.abs(activeCenter - viewportCenter), centered: Math.abs(activeCenter - viewportCenter) < 50,",
    "      gaps: gaps, avgGap: gaps.length > 0 ? gaps.reduce((a,b)=>a+b,0)/gaps.length : 0,",
    "      hasRadius: (slideRadius && slideRadius !== '0px') || (childRadius && childRadius !== '0px'),",
    "      slideWidth: slideWidth, hasNav: hasNav",
    "    };",
    "  }, '" + sel + "');",
    "  console.log(JSON.stringify(results));",
    "  await browser.close();",
    "})();"
  ].join('\n');

  fs.writeFileSync(tmpScript, code);

  try {
    const output = execSync('node ' + tmpScript, { encoding: 'utf-8', timeout: 30000 });
    const r = JSON.parse(output.trim());
    fs.unlinkSync(tmpScript);

    if (!r.hasSwiper) { console.log('  ⏭️  Swiper 없음 — 스킵'); return; }
    if (r.error) { FAIL('Swiper: ' + r.error); return; }

    if (requireActiveScale) {
      if (r.sizeDiff) PASS('active/비활성 크기 차이 — active:' + r.activeW.toFixed(1) + 'px, 비활성:' + r.avgInactiveW.toFixed(1) + 'px (ratio:' + r.sizeRatio.toFixed(3) + ')');
      else FAIL('active/비활성 크기 동일 (' + r.activeW.toFixed(1) + 'px) — scale 또는 width 차이 필요');
    } else {
      PASS('strip swiper — active/비활성 크기 차이 강제 안 함');
    }

    if (requireActiveScale) {
      if (r.opacityDiff) PASS('opacity 차이 — active:' + r.activeOpacity + ', 비활성:' + r.avgInactiveOpacity.toFixed(2));
      else WARN('opacity 차이 미미 — active:' + r.activeOpacity + ', 비활성:' + r.avgInactiveOpacity.toFixed(2));
    } else {
      PASS('strip swiper — active opacity 차이 강제 안 함');
    }

    if (isStripSwiper) {
      PASS('strip swiper — centeredSlides 강제 안 함');
    } else if (r.centered) PASS('centeredSlides — 중앙에서 ' + r.centerOffset.toFixed(1) + 'px');
    else FAIL('centeredSlides 미적용 — 중앙에서 ' + r.centerOffset.toFixed(1) + 'px 벗어남');

    if (r.avgGap > 1) PASS('슬라이드 gap — 평균 ' + r.avgGap.toFixed(1) + 'px');
    else WARN('슬라이드 gap 거의 없음 — ' + r.avgGap.toFixed(1) + 'px');

    if (isStripSwiper) {
      PASS('strip swiper — border-radius 강제 안 함');
    } else if (r.hasRadius) PASS('border-radius 적용됨');
    else WARN('border-radius 미적용');

    if (r.slideWidth && r.slideWidth !== 'auto' && r.slideWidth !== '0px') PASS('슬라이드 CSS width — ' + r.slideWidth);
    else FAIL('slidesPerView:auto인데 슬라이드 CSS width 미설정');

    if (requireNav) {
      if (r.hasNav) PASS('nav 버튼 존재');
      else WARN('nav 버튼 없음');
    } else {
      PASS('strip swiper — nav 버튼 강제 안 함');
    }

  } catch (e) {
    try { fs.unlinkSync(tmpScript); } catch(_) {}
    FAIL('Swiper 검증 실패: ' + e.message.substring(0, 200));
  }
}

// ════════════════════════════════════════════
// STEP 6: 스크린샷
// ════════════════════════════════════════════
function step6(sectionSelector) {
  console.log('\n══ STEP 6: 스크린샷 캡처 ══');

  const sel = sectionSelector || '.fr-' + section;
  const outPath = `/tmp/${section}_harness.png`;

  try {
    execSync(`node -e "
      const { chromium } = require('playwright');
      (async () => {
        const browser = await chromium.launch();
        const page = await browser.newPage({ viewport: { width: ${CANVAS}, height: 1080 } });
        await page.goto('${url}');
        await page.waitForTimeout(2000);
        const el = await page.\\$('${sel}');
        if (el) await el.screenshot({ path: '${outPath}' });
        await browser.close();
      })();
    "`, { timeout: 30000 });

    if (fs.existsSync(outPath)) {
      PASS(`스크린샷 저장: ${outPath}`);
      return outPath;
    }
  } catch (e) {
    FAIL('스크린샷 실패');
  }
  return null;
}

// ════════════════════════════════════════════
// 메인 실행
// ════════════════════════════════════════════
console.log('╔══════════════════════════════════════╗');
console.log('║  HARNESS — 섹션 구현 파이프라인      ║');
console.log('║  누락 방지 가두리 시스템              ║');
console.log('╚══════════════════════════════════════╝');
console.log(`섹션: ${section || '?'}  페이지: ${page}  URL: ${url}`);

let currentSpec = specFile;
let currentStructure = structureFile;
let currentCss = cssFile ||
  (pageRoute.css && path.join(PROJECT_ROOT, pageRoute.css)) ||
  (page === 'main'
    ? path.join(PROJECT_ROOT, 'css', 'style.css')
    : path.join(PROJECT_ROOT, 'css', page + '.css'));

// 특정 단계만 실행
if (stepOnly) {
  const step = parseInt(stepOnly);
  if (step === 1) timedStep('STEP 1', step1);
  else if (step === 2) {
    timedStep('STEP 2', function() { return step2(currentSpec); });
    // plan.json 작성 가이드 자동 출력
    const planningDir = path.join(PROJECT_ROOT, '.planning');
    let existingPlan = null;
    if (fs.existsSync(planningDir)) {
      const dirs = fs.readdirSync(planningDir).filter(d => d.includes('con') && d !== '_template');
      for (const d of dirs) {
        const pp = path.join(planningDir, d, 'plan.json');
        if (fs.existsSync(pp)) { existingPlan = pp; break; }
      }
      if (!existingPlan) {
        const tp = path.join(planningDir, '_template', 'plan.json');
        if (fs.existsSync(tp)) existingPlan = tp;
      }
    }
    if (existingPlan) {
      console.log('\n══ plan.json 작성 가이드 ══');
      console.log('  📄 형식 참고: ' + existingPlan);
      console.log('  → Read로 먼저 읽고 형식 따라 작성');
      console.log('  → node tools/plan-checker.js <plan.json> 검증');
      console.log('  → 🟢 PLAN APPROVED 후 ASCII → 유저 컨펌');
    }

    // PSD 그룹 계층 구조 출력 (plan parent 설정 참고용)
    if (psdFile) {
      console.log('\n══ PSD 그룹 계층 구조 (plan parent 참고) ══');
      const psdData = JSON.parse(fs.readFileSync(psdFile, 'utf8'));
      function printTree(layers, target, depth) {
        for (const l of layers) {
          if (l.name === target || depth > 0) {
            if (depth > 0 && depth <= 2) {
              const childInfo = l.children ? ` → ${l.children.map(c => c.name).join(', ').substring(0, 60)}` : '';
              console.log('  ' + '  '.repeat(depth-1) + l.name + ' (' + l.kind + ')' + childInfo);
            }
            if (l.children) printTree(l.children, target, depth > 0 ? depth+1 : 1);
          } else if (l.children) {
            printTree(l.children, target, 0);
          }
        }
      }
      printTree(psdData.layers, section, 0);
      console.log('  ⚠️  plan의 parent는 이 PSD 부모 구조와 일치해야 함');
    }
  }
  else if (step === 3) timedStep('STEP 3', function() { return step3(currentSpec, currentStructure); });
  else if (step === 4) timedStep('STEP 4', function() { return step4(currentCss); });
  else if (step === 5) timedStep('STEP 5', function() { return step5(selectorArg); });
  else if (step === 6) timedStep('STEP 6', function() { return step6(selectorArg); });
  else if (step === 7) timedStep('STEP 7', function() { return step7(selectorArg); });
} else {
  // 전체 파이프라인

  // STEP 1
  const specOut = timedStep('STEP 1', step1);
  if (specOut) currentSpec = specOut;

  if (fails.length > 0) {
    console.log('\n🛑 STEP 1 FAIL — 중단');
    process.exit(1);
  }

  // STEP 1.5: spec ↔ PSD 크로스체크
  timedStep('STEP 1.5', function() { return step1_5(currentSpec); });

  if (fails.length > 0) {
    console.log('\n🛑 STEP 1.5 FAIL — spec 불일치, 중단');
    process.exit(1);
  }

  // STEP 2
  timedStep('STEP 2', function() { return step2(currentSpec); });

  if (fails.length > 0) {
    console.log('\n🛑 STEP 2 FAIL — 중단');
    process.exit(1);
  }

  // STEP 3 (structure 필요)
  if (!currentStructure) {
    const guessPath = path.join(PROJECT_ROOT, 'psd', `structure_${section}_v3.json`);
    if (fs.existsSync(guessPath)) {
      currentStructure = guessPath;
    } else {
      console.log('\n⏸️  STEP 3 대기 — structure-v3.json 작성 필요');
      console.log(`   경로: psd/structure_${section}_v3.json`);
      console.log('   작성 후: node tools/harness.js --step 3 --spec ' + currentSpec + ' --structure <path>');
    }
  }

  if (currentStructure) {
    timedStep('STEP 3', function() { return step3(currentSpec, currentStructure); });
  }

  // STEP 4
  timedStep('STEP 4', function() { return step4(currentCss); });

  // STEP 4.5: 이미지 전수 HTML 사용
  timedStep('STEP 4.5', step4_5);

  // STEP 5
  timedStep('STEP 5', function() { return step5(selectorArg); });

  // STEP 5.5: position-checker (spec 있을 때)
  timedStep('STEP 5.5', step5_5);

  // STEP 5.7: 렌더링 스타일 vs spec 대조
  timedStep('STEP 5.7', step5_7);

  // STEP 7: Swiper (있을 때만)
  timedStep('STEP 7', function() { return step7(selectorArg); });

  // STEP 6
  if (fastMode) {
    console.log('\n══ STEP 6: 스크린샷 캡처 ══');
    console.log('  ⏭️  FAST: 스크린샷 생략 — 최종 full harness에서 캡처');
  } else {
    timedStep('STEP 6', function() { return step6(selectorArg); });
  }
}

const totalSec = (Date.now() - harnessStartedAt) / 1000;
if (budgetSec && totalSec > budgetSec) {
  WARN('time budget 초과: ' + totalSec.toFixed(2) + 's > ' + budgetSec + 's — 병목 단계는 TIMINGS 상위 항목 확인');
}

// ═══ 최종 리포트 ═══
console.log('\n╔══════════════════════════════════════╗');
console.log('║            최종 리포트                ║');
console.log('╚══════════════════════════════════════╝');
console.log(`  ✅ PASS: ${passes.length}`);
console.log(`  ⚠️  WARN: ${warns.length}`);
console.log(`  ❌ FAIL: ${fails.length}`);

if (fails.length > 0) {
  console.log('\n❌ FAIL 목록:');
  fails.forEach(f => console.log('  - ' + f));
}
if (warns.length > 0) {
  console.log('\n⚠️  WARN 목록:');
  var warnLimit = summaryMode ? 20 : warns.length;
  warns.slice(0, warnLimit).forEach(w => console.log('  - ' + w));
  if (summaryMode && warns.length > warnLimit) {
    console.log('  ... ' + (warns.length - warnLimit) + '개 추가 WARN 생략 (--summary)');
  }
}

if (timingsMode) {
  console.log('\n⏱️  TIMINGS: total ' + totalSec.toFixed(2) + 's');
  timings
    .slice()
    .sort((a, b) => b.sec - a.sec)
    .slice(0, 6)
    .forEach(t => console.log('  - ' + t.label + ': ' + t.sec.toFixed(2) + 's'));
}

if (fails.length === 0 && fastMode) {
  console.log('\n🟢 FAST PASS — final full harness required');
} else {
  console.log('\n' + (fails.length === 0 ? '🟢 ALL CLEAR' : '🔴 FIX REQUIRED'));
}

if (fails.length === 0 && !fastMode && section) {
  try {
    const markedFile = workflow.markState(PROJECT_ROOT, section, 'verified', {
      page,
      source: 'harness'
    });
    console.log('  ✅ verified state saved: ' + path.relative(PROJECT_ROOT, markedFile));
  } catch (err) {
    console.log('  ⚠️  verified state 저장 실패: ' + err.message);
  }
}
process.exit(fails.length > 0 ? 1 : 0);
