#!/usr/bin/env node
/**
 * spec-to-plan.js v4 — spec.json → plan.json 초안 자동 생성
 *
 * Usage: node tools/spec-to-plan.js <spec.json> [--page <page>] [--prev <prevSectionBottom>] [--out <output.json>]
 *
 * v4: 그룹 기반 rltv/absol 분류
 *   - 타이틀 그룹 → rltv texts
 *   - 타이틀 아래 콘텐츠 그룹 → rltv containers
 *   - 배경/서브nav/코멘트 그룹 → absol 또는 skip
 *   - bg 색상: 큰 rect fill에서 추출
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Args ──
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node spec-to-plan.js <spec.json> [--page page] [--prev N] [--out output.json]');
  process.exit(1);
}

const specPath = args[0];
let page = '';
let prevBottom = null;
let outPath = null;
let hasSwiper = false;
let imageAnalysisPath = null; // --images: image-analysis.json 경로 (파일 원본 크기 보정용)

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--page' && args[i + 1]) { page = args[++i]; }
  else if (args[i] === '--prev' && args[i + 1]) {
    if (args[i + 1] === 'auto') { prevBottom = 'auto'; i++; }
    else { prevBottom = Number(args[++i]); }
  }
  else if (args[i] === '--out' && args[i + 1]) { outPath = args[++i]; }
  else if (args[i] === '--swiper') { hasSwiper = true; }
  else if (args[i] === '--images' && args[i + 1]) { imageAnalysisPath = args[++i]; }
}

// ── Load image-analysis.json (파일 원본 크기 매핑) ──
const imageFileMap = {}; // possibleFile → { width, height }
const imageMetaMap = {}; // possibleFile → image-analyzer metadata
if (imageAnalysisPath && fs.existsSync(imageAnalysisPath)) {
  try {
    const ia = JSON.parse(fs.readFileSync(imageAnalysisPath, 'utf8'));
    const imgs = ia.images || (Array.isArray(ia) ? ia : []);
    for (const img of imgs) {
      if (img.file && img.width && img.height) {
        imageFileMap[img.file] = { width: img.width, height: img.height };
        imageMetaMap[img.file] = img;
      }
    }
    if (Object.keys(imageFileMap).length > 0) {
      console.error(`📷 이미지 원본 크기 로드: ${Object.keys(imageFileMap).length}개 (${imageAnalysisPath})`);
    }
  } catch {}
}
// Auto-search는 spec 로드 후 실행 (spec.section 필요)

// Helper: get real file dimensions (image-analysis > PSD fallback)
function getRealImageSize(possibleFile, psdW, psdH) {
  if (possibleFile && imageFileMap[possibleFile]) {
    return imageFileMap[possibleFile];
  }
  // Try matching by filename without path
  const basename = possibleFile ? path.basename(possibleFile) : null;
  if (basename && imageFileMap[basename]) {
    return imageFileMap[basename];
  }
  return { width: psdW, height: psdH }; // fallback to PSD size
}

// ── Normalize section name (con06/con6/6 → 동일 취급) ──
function normSec(n) {
  const d = String(n).replace(/\D/g, '');
  return d ? d.replace(/^0+/, '') || '0' : String(n).toLowerCase();
}

// ── Load spec ──
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const CANVAS = spec.canvas || 1905;
const sectionName = spec.section || 'con??';
const secNum = sectionName.replace(/\D/g, '') || '?';
const prefix = `c${String(Number(secNum) || secNum)}_`;

// ── Helpers ──
function toVw(px) { return `${((px / CANVAS) * 100).toFixed(6)}vw`; }
function toPct(px, pw) { return pw ? `${((px / pw) * 100).toFixed(6)}%` : '0%'; }

// ── Section boundaries ──
const secTop = spec.sectionY ? spec.sectionY.top : 0;
const secBottom = spec.sectionY ? spec.sectionY.bottom : 0;

// --prev auto: PSD shape 기반 prevBottom 자동 계산 (±1vw 정확도)
// 공식:
//   겹침(prevMaxY > secTop) → 이전 섹션의 shape rect 중 bot < firstRltvY인 max bottom
//   gap + 공유bg → min(prevSecBottom, firstRltvY)
//   gap → mySecTop
if (prevBottom === 'auto') {
  const parsedCandidates = [];
  const searchDirs = [
    path.dirname(path.resolve(specPath)),
    path.join(path.dirname(path.resolve(specPath)), '..'),
    process.cwd(), path.join(process.cwd(), 'psd'),
    path.resolve(__dirname, '..', 'psd'), path.resolve(__dirname, '..')
  ];
  for (const dir of searchDirs) {
    try {
      fs.readdirSync(dir).filter(f => f.endsWith('_parsed.json') || f === 'parsed.json')
        .forEach(f => { const full = path.join(dir, f); if (!parsedCandidates.includes(full)) parsedCandidates.push(full); });
    } catch {}
  }

  // firstRltvY 사전 계산 (spec에서)
  const allTexts = (spec.texts || []).filter(t => t.y > secTop);
  const allImages = (spec.images || []).filter(i => i.y > secTop && i.w < CANVAS * 0.9);
  const rltvCandidates = [...allTexts, ...allImages].sort((a, b) => a.y - b.y);
  const firstRltvY_est = rltvCandidates.length > 0 ? rltvCandidates[0].y : secTop + 200;

  let prevName = null;
  let prevMaxY = null;

  for (const pf of parsedCandidates) {
    try {
      const parsed = JSON.parse(fs.readFileSync(pf, 'utf8'));
      const getMinY = (l) => { let m=Infinity; if(l.top>0)m=Math.min(m,l.top); if(l.children)for(const c of l.children)m=Math.min(m,getMinY(c)); return m; };
      const getMaxY = (l) => { let m=-Infinity; if(l.top>0&&l.height>0)m=Math.max(m,l.top+l.height); if(l.children)for(const c of l.children)m=Math.max(m,getMaxY(c)); return m; };

      // 실제 섹션 그룹만 (모션, 공유bg 제외)
      const isSectionGroup = (name) => /^(con\d+|main|conmain|header|footer)$/i.test(name);
      const groups = [];
      for (const l of (parsed.layers || [])) {
        if (l.kind === 'group' && isSectionGroup(l.name)) {
          const minY = getMinY(l), maxY = getMaxY(l);
          if (minY < Infinity) groups.push({ name: l.name, minY, maxY, layer: l });
        }
      }
      groups.sort((a, b) => a.minY - b.minY);
      const secNorm = normSec(sectionName);
      const idx = groups.findIndex(g => normSec(g.name) === secNorm);
      if (idx <= 0) continue;

      prevName = groups[idx - 1].name;
      prevMaxY = groups[idx - 1].maxY;
      const prevLayer = groups[idx - 1].layer;
      const hasOverlap = prevMaxY > secTop;

      // 공유 bg 그룹 감지 (이름에 이전+현재 섹션 번호 모두 포함된 bg 그룹)
      const curNum = sectionName.replace(/\D/g, '').replace(/^0+/, '');
      const prevNum = prevName.replace(/\D/g, '').replace(/^0+/, '');
      const hasSharedBg = (parsed.layers || []).some(l =>
        l.kind === 'group' && /bg|배경/i.test(l.name) && l.name.includes(curNum) && l.name.includes(prevNum)
      );
      const hasGap = !hasOverlap;
      const hasGapWithSharedBg = hasGap && hasSharedBg;

      if (hasOverlap) {
        // 겹침: 이전 섹션의 shape rect 중 bot < firstRltvY인 max bottom
        const shapes = [];
        const findShapes = (layers) => {
          for (const l of (layers || [])) {
            const isShape = l.vectorMask || l.vectorFill || /^(사각형|모양|타원|삼각형|직사각형)/.test(l.name || '');
            const isThin = (l.width || 0) < 10 || (l.height || 0) < 10;
            if (isShape && !l.text && l.kind !== 'group' && !isThin && l.width && l.height) {
              shapes.push({ name: l.name, bot: l.top + l.height, w: l.width });
            }
            if (l.children) findShapes(l.children);
          }
        };
        findShapes(prevLayer.children || []);

        const validShapes = shapes.filter(s => s.bot <= firstRltvY_est);
        const shapeMaxBot = validShapes.length > 0 ? Math.max(...validShapes.map(s => s.bot)) : null;

        if (shapeMaxBot && shapeMaxBot > secTop) {
          prevBottom = shapeMaxBot;
          console.error(`📐 겹침 감지: "${prevName}" maxY(${prevMaxY}) > secTop(${secTop})`);
          console.error(`   → shape 기반 prevBottom: ${shapeMaxBot} (${validShapes.find(s=>s.bot===shapeMaxBot)?.name})`);
        } else {
          prevBottom = secTop;
          console.error(`📐 겹침 감지: "${prevName}" → shape 없음, secTop(${secTop}) 사용`);
        }
      } else if (hasGapWithSharedBg) {
        // 공유 bg로 연결된 gap → prevSecBottom 사용
        prevBottom = Math.min(prevMaxY, firstRltvY_est);
        console.error(`📐 공유 bg 감지: gap(${secTop - prevMaxY}px) + 공유bg → prevSecBottom(${prevMaxY}) 사용`);
      } else {
        // 일반 gap → mySecTop
        prevBottom = secTop;
        console.error(`📐 gap(${secTop - prevMaxY}px): secTop(${secTop}) 사용`);
      }
      // ── effectiveEnd 계산 (pb용): 현재 섹션의 shape maxBot ──
      // pt의 mirror: 현재 섹션의 shape(vectorMask, w>10, h>10)의 maxBot
      const curShapes = [];
      const curLayer = groups.find(g => normSec(g.name) === secNorm)?.layer;
      if (curLayer) {
        const findCurShapes = (layers) => {
          for (const l of (layers || [])) {
            const isShape = l.vectorMask || /^(사각형|모양|타원|삼각형)/.test(l.name || '');
            const isThin = (l.width || 0) < 10 || (l.height || 0) < 10;
            if (isShape && !l.text && l.kind !== 'group' && !isThin && l.width && l.height) {
              curShapes.push({ name: l.name, bot: l.top + l.height, w: l.width });
            }
            if (l.children) findCurShapes(l.children);
          }
        };
        findCurShapes(curLayer.children || []);
      }
      // overflow 감지: shape maxBot >= secBottom AND 간격 > 300px
      const curShapeMaxBot = curShapes.length ? Math.max(...curShapes.map(s => s.bot)) : secBottom;
      const _isOverflow = curShapeMaxBot >= secBottom - 10;

      // effectiveEnd 결정:
      // 다음 섹션의 pt 계산에서 사용할 prevBottom = 현재 섹션의 shape maxBot
      // 하지만 여기서는 다음 섹션 firstRltvY를 모르므로 curShapeMaxBot 그대로 사용
      // 또는 secBottom 사용 (다음 섹션이 없으면)
      const nextIdx = groups.findIndex(g => normSec(g.name) === secNorm) + 1;
      let effectiveEnd = secBottom;
      if (nextIdx < groups.length) {
        const nextSecTop = groups[nextIdx].minY;
        // 다음 섹션과 겹침이면 curShapeMaxBot, 아니면 min(secBottom, nextSecTop)
        if (curShapeMaxBot > nextSecTop) {
          effectiveEnd = curShapeMaxBot; // 겹침 → shape 기반
        } else {
          effectiveEnd = Math.min(secBottom, nextSecTop);
        }
      }
      // effectiveEnd를 전역 변수로 저장
      global.__effectiveEnd = effectiveEnd;
      global.__isOverflow = _isOverflow;
      console.error(`📍 prevBottom auto: ${prevBottom} (이전: ${prevName})`);
      console.error(`📍 effectiveEnd: ${effectiveEnd} (pb용)\n`);
      break;
    } catch {}
  }
  if (prevBottom === 'auto') prevBottom = secTop; // fallback
}

if (prevBottom === null) prevBottom = secTop;

// ── Auto-search image-analysis.json (spec 로드 후) ──
if (Object.keys(imageFileMap).length === 0) {
  const preferredIaPaths = [];
  if (outPath) preferredIaPaths.push(path.join(path.dirname(path.resolve(outPath)), 'image-analysis.json'));
  preferredIaPaths.push(path.join(path.dirname(path.resolve(specPath)), 'image-analysis.json'));
  for (const iaPath of preferredIaPaths) {
    if (!iaPath || !fs.existsSync(iaPath)) continue;
    try {
      const ia = JSON.parse(fs.readFileSync(iaPath, 'utf8'));
      const imgs = ia.images || (Array.isArray(ia) ? ia : []);
      for (const img of imgs) {
        if (img.file && img.width && img.height) {
          imageFileMap[img.file] = { width: img.width, height: img.height };
          imageMetaMap[img.file] = img;
        }
      }
      if (Object.keys(imageFileMap).length > 0) {
        console.error(`📷 이미지 원본 크기 자동 로드: ${Object.keys(imageFileMap).length}개 (${iaPath})`);
        break;
      }
    } catch {}
  }
}

if (Object.keys(imageFileMap).length === 0) {
  const autoSearchDirs = [
    path.join(path.dirname(path.resolve(specPath)), '..', '.planning'),
    path.join(path.dirname(path.resolve(specPath)), '..', '..', '.planning')
  ];
  for (const searchDir of autoSearchDirs) {
    if (!fs.existsSync(searchDir)) continue;
    try {
      const dirs = fs.readdirSync(searchDir)
        .map(function(d) {
          let score = 0;
          const lower = d.toLowerCase();
          const secLower = sectionName.toLowerCase();
          if (page && lower === `${page}_${secLower}`) score += 100;
          if (page && lower.startsWith(`${page}_${secLower}`)) score += 60;
          if (lower === secLower) score += 50;
          if (lower.includes(secLower)) score += 20;
          if (normSec(d) === normSec(sectionName)) score += 10;
          return { d, score };
        })
        .filter(function(item) { return item.score > 0; })
        .sort(function(a, b) { return b.score - a.score || a.d.localeCompare(b.d); });
      for (const item of dirs) {
        const d = item.d;
        const iaPath = path.join(searchDir, d, 'image-analysis.json');
        if (fs.existsSync(iaPath)) {
          try {
            const ia = JSON.parse(fs.readFileSync(iaPath, 'utf8'));
            const imgs = ia.images || (Array.isArray(ia) ? ia : []);
            for (const img of imgs) {
              if (img.file && img.width && img.height) {
                imageFileMap[img.file] = { width: img.width, height: img.height };
                imageMetaMap[img.file] = img;
              }
            }
            if (Object.keys(imageFileMap).length > 0) {
              console.error(`📷 이미지 원본 크기 자동 로드: ${Object.keys(imageFileMap).length}개 (${iaPath})`);
            }
          } catch {}
          break;
        }
      }
    } catch {}
    if (Object.keys(imageFileMap).length > 0) break;
  }
}

// ── Direct image file scan (image-analysis.json 없어도 파일 크기 직접 읽기) ──
if (Object.keys(imageFileMap).length === 0) {
  // psd-to-spec과 동일한 PNG/JPG 헤더 파싱
  function readImageDimensions(filePath) {
    try {
      const buf = fs.readFileSync(filePath);
      let fw = 0, fh = 0;
      if (buf[0] === 0x89 && buf[1] === 0x50) { // PNG
        fw = buf.readUInt32BE(16); fh = buf.readUInt32BE(20);
      } else if (buf[0] === 0xFF && buf[1] === 0xD8) { // JPEG
        let ji = 2;
        while (ji < buf.length - 8) {
          if (buf[ji] !== 0xFF) { ji++; continue; }
          const m = buf[ji+1];
          if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
            fh = buf.readUInt16BE(ji+5); fw = buf.readUInt16BE(ji+7); break;
          }
          ji += 2 + buf.readUInt16BE(ji+2);
        }
      }
      return fw > 0 ? { width: fw, height: fh } : null;
    } catch { return null; }
  }

  // 프로젝트 루트 찾기 (CLAUDE.md 기반 → CWD → specPath 상위)
  let projectRoot = null;
  const rootCandidates = [
    process.cwd(),
    path.dirname(path.resolve(specPath)),
    path.join(path.dirname(path.resolve(specPath)), '..'),
    path.join(path.dirname(path.resolve(specPath)), '..', '..'),
    path.resolve(__dirname, '..')
  ];
  for (const cand of rootCandidates) {
    if (fs.existsSync(path.join(cand, 'images')) && fs.existsSync(path.join(cand, 'CLAUDE.md'))) {
      projectRoot = cand; break;
    }
  }
  if (!projectRoot) {
    for (const cand of rootCandidates) {
      if (fs.existsSync(path.join(cand, 'images'))) { projectRoot = cand; break; }
    }
  }
  if (!projectRoot) projectRoot = process.cwd();
  const imagesRoot = path.join(projectRoot, 'images');
  if (fs.existsSync(imagesRoot)) {
    try {
      for (const sub of fs.readdirSync(imagesRoot)) {
        const subDir = path.join(imagesRoot, sub);
        if (!fs.statSync(subDir).isDirectory()) continue;
        for (const f of fs.readdirSync(subDir)) {
          // con06_1.png / con6_1.png 둘 다 매칭
          const fPrefix = f.split('_')[0] || '';
          if (!f.includes('_') || normSec(fPrefix) !== normSec(sectionName)) continue;
          if (!/\.(png|jpg|jpeg)$/i.test(f)) continue;
          const dims = readImageDimensions(path.join(subDir, f));
          if (dims) imageFileMap[f] = dims;
        }
      }
      if (Object.keys(imageFileMap).length > 0) {
        console.error(`📷 이미지 파일 직접 스캔: ${Object.keys(imageFileMap).length}개 (${imagesRoot})`);
      }
    } catch {}
  }
  if (Object.keys(imageFileMap).length === 0) {
    console.error(`⚠️  이미지 파일을 찾을 수 없습니다. image-analyzer를 먼저 실행하거나 images/ 디렉토리를 확인하세요.`);
  }
}

// ── Collect all flat elements ──
const texts = (spec.texts || []).map(t => ({ ...t, _type: 'text' }));

// 배경 rect 치수 캡처 (필터링 전) — pt/pb 계산의 기준
let bgRectTop = null, bgRectBottom = null;
const allRects = (spec.rects || []).map(r => ({ ...r, _type: 'rect' }));
{
  const sectionBg = (spec.background && spec.background.fill) || '#ffffff';
  // 전폭 배경 rect 찾기
  // spec.bgRect는 fallback으로만 (이미지 배경 포함할 수 있어서 부정확)
  // allRects에서 사각형(solid fill) inner rect를 우선 찾음
  // 조건: 전폭(90%+), 높이 100+, 섹션 Y범위와 겹침, 높이가 섹션의 50~200% 이내
  const secHEstimate = secBottom - secTop;
  const bgCandidates = allRects.filter(r => {
    const rFill = typeof r.fill === 'string' ? r.fill : (r.fill && r.fill.hex) || '';
    if (r.w < CANVAS * 0.9 || r.h < 100) return false;
    // 섹션 Y범위와 겹침 체크
    const rBot = r.y + r.h;
    const overlapY = Math.max(0, Math.min(rBot, secBottom) - Math.max(r.y, secTop));
    if (overlapY < secHEstimate * 0.3) return false; // 섹션과 30% 미만 겹침 → 다른 섹션 bg
    // 높이가 섹션의 200% 초과 → 페이지 전체 배경 (사용 부적합)
    if (r.h > secHEstimate * 2.5 && secHEstimate > 200) return false;
    return true;
  }).sort((a, b) => {
    // 섹션과의 겹침 비율이 높은 순
    const overlapA = Math.max(0, Math.min(a.y + a.h, secBottom) - Math.max(a.y, secTop));
    const overlapB = Math.max(0, Math.min(b.y + b.h, secBottom) - Math.max(b.y, secTop));
    return overlapB - overlapA;
  });
  if (bgCandidates.length > 0) {
    const bgRect = bgCandidates[0];
    bgRectTop = bgRect.y;
    bgRectBottom = bgRect.y + bgRect.h;
    console.error(`📐 배경 rect 감지: "${bgRect.name}" Y:${bgRectTop}~${bgRectBottom} (${bgRect.w}x${bgRect.h})`);
  }
  // allRects에서 못 찾으면 spec.bgRect fallback (이미지 배경 등)
  if (!bgRectTop && spec.bgRect) {
    bgRectTop = spec.bgRect.y;
    bgRectBottom = spec.bgRect.bottom;
    console.error(`📐 배경 rect fallback (spec.bgRect): "${spec.bgRect.name}" Y:${bgRectTop}~${bgRectBottom}`);
  }
}

const rects = allRects.filter(r => {
    // 배경색과 동일한 fill + 섹션 전폭 이상인 rect는 시각적 의미 없음 → 자동 제외
    const sectionBg = (spec.background && spec.background.fill) || '#ffffff';
    const rFill = typeof r.fill === 'string' ? r.fill : (r.fill && r.fill.hex) || '';
    if (rFill && rFill.toLowerCase() === sectionBg.toLowerCase() && r.w >= CANVAS * 0.95) {
      console.error(`⚠️  rect "${r.name}" 자동 제외 — fill(${rFill})이 섹션 bg(${sectionBg})와 동일 + 전폭(${r.w}px)`);
      return false;
    }
    return true;
  });
const images = (spec.images || []).map(i => ({ ...i, _type: 'image' }));
const allFlat = [...texts, ...rects, ...images].sort((a, b) => a.y - b.y);

// (완성형 이미지 병합 제거 — AI 추론에 위임)
const mergeMap = new Map();

// ── Index by name for lookup ──
const elemByName = {};
for (const e of allFlat) elemByName[e.name] = e;

// ── Groups ──
const allGroups = spec.groups || [];
const topGroups = allGroups.filter(g => normSec(g.parentGroup || '') === normSec(sectionName));

// ── Group classification ──
function isSkipGroup(name) {
  const n = (name || '').toLowerCase();
  return n.includes('서브nav') || n.includes('subnav') || n.includes('nav') ||
    n.includes('코멘트') || n.includes('comment') || n.includes('메모') ||
    n.startsWith('*'); // PSD에서 * 접두사 = skip/annotation
}
function isBgGroup(name) {
  const n = (name || '').toLowerCase();
  return n.includes('배경') || n.includes('bg') || n.includes('background');
}
function isTitleGroup(name) {
  const n = (name || '').toLowerCase();
  return n.includes('타이틀') || n.includes('title') || n.includes('제목');
}

// ── Find title group ──
const titleGroup = topGroups.find(g => isTitleGroup(g.name) && g.bbox);
const titleBottom = titleGroup ? (titleGroup.bbox.y + titleGroup.bbox.h) : prevBottom;

// ── Classify top-level groups ──
// Groups below title bottom → rltv content containers
// Groups overlapping/above title → absol (chart, decoration)
const classifiedGroups = topGroups.map(g => {
  let role;
  if (isSkipGroup(g.name)) role = 'skip';
  else if (isBgGroup(g.name)) role = 'bg';
  else if (isTitleGroup(g.name)) role = 'title';
  else if (g.bbox && g.bbox.y >= titleBottom - 10) {
    // "그룹 NNN" (PSD 기본명) → absol (의미 있는 이름이 아니면 장식/차트일 확률 높음)
    const isGenericName = /^그룹\s*\d+$/.test((g.name || '').trim()) || /^\d+$/.test((g.name || '').trim());
    if (isGenericName) {
      role = 'absol-content';
    } else {
      role = 'rltv-content';
    }
  }
  else role = 'absol-content'; // overlaps with title area

  return { ...g, role };
});

// ── Naming ──
let nameIdx = {};
function getName(hint) {
  if (!nameIdx[hint]) nameIdx[hint] = 0;
  nameIdx[hint]++;
  return nameIdx[hint] === 1 ? `${prefix}${hint}` : `${prefix}${hint}${nameIdx[hint]}`;
}

// ── bg color: find from largest rect at section top ──
let bg = '#ffffff';
if (spec.background && spec.background.fill && typeof spec.background.fill === 'string') {
  bg = spec.background.fill;
}
// Override with actual large rect fill if present
for (const r of rects) {
  if (r.w >= CANVAS && r.fill && typeof r.fill === 'string' &&
      Math.abs(r.y - prevBottom) < 50) {
    bg = r.fill;
    break;
  }
}

// ── Segment builder ──
function buildSegments(segs) {
  return (segs || []).map(seg => {
    const result = {
      text: seg.text || '',
      fontWeight: seg.fontWeight || 400,
      color: seg.color || '#000000',
      fontSize: seg.fontSize_px
        ? `${(seg.fontSize_px / CANVAS * 100).toFixed(6)}vw (${seg.fontSize_px}px)`
        : seg.fontSize_vw ? `${seg.fontSize_vw}vw` : 'unknown',
      letterSpacing: seg.letterSpacing || '0',
      lineHeight: seg.lineHeight || 1.2
    };
    if (seg.fontFamily) result.fontFamily = seg.fontFamily;
    return result;
  });
}

// ── Element in bbox check ──
function elemInBbox(elem, bbox, margin = 20) {
  return elem.x >= bbox.x - margin && elem.y >= bbox.y - margin &&
    (elem.x + elem.w) <= (bbox.x + bbox.w + margin) &&
    (elem.y + elem.h) <= (bbox.y + bbox.h + margin);
}

// ── Footnote pattern detection ──
function isFootnoteText(elem) {
  if (elem._type !== 'text' || !elem.segments) return false;
  const content = elem.content || elem.segments.map(s => s.text).join('');
  return content.startsWith('*') || content.startsWith('※') || content.startsWith('·');
}

// ── Find elements inside a group's bbox (exclude footnotes) ──
function getGroupElements(group) {
  if (!group.bbox) return [];
  return allFlat.filter(e => !claimed.has(e.name) && elemInBbox(e, group.bbox) && !isFootnoteText(e));
}

// ── Find sub-groups of a group ──
function getSubGroups(parentName) {
  return allGroups.filter(g => g.parentGroup === parentName && g.bbox && g.bbox.w > 0);
}

// ── Claimed set ──
const claimed = new Set();

// ── Build functions ──

function buildBgImage(img) {
  claimed.add(img.name);
  const realSize = getRealImageSize(img.possibleFile, img.w, img.h);
  const rawTop = img.y - prevBottom;
  const sectionH = secBottom - prevBottom;

  // bgImage top 보정:
  // psdY가 섹션 top 위에 있으면 → 배경 rect 안에서 하단 정렬 추정
  // 로직: prevBottom 근처 큰 rect 찾기 → top = (rect.h - imageFileHeight) / canvas
  let top = toVw(rawTop);
  let topNote = null;
  if (rawTop < -10) {
    // 배경 rect 찾기: prevBottom ±50px, width > canvas*0.9
    const bgRect = rects.find(r =>
      Math.abs(r.y - prevBottom) < 50 && r.w > CANVAS * 0.9 && r.h > 100
    );
    if (bgRect && realSize.height > 0 && realSize.height < bgRect.h) {
      // 하단 정렬: 이미지가 배경 rect보다 확실히 작을 때만 (5% 이상 차이)
      const bottomAlignPx = bgRect.h - realSize.height;
      top = toVw(bottomAlignPx);
      topNote = `하단정렬: (bgRect.h:${bgRect.h} - imgFile.h:${realSize.height}) / ${CANVAS} = ${top}`;
    } else {
      top = '0vw';
      topNote = `⚠️ psdY(${img.y})가 섹션 top(${prevBottom}) 위. 디자인 시안 보고 top 보정 필요. 이미지 높이: ${realSize.height}px`;
    }
  }

  const result = {
    name: getName('bg'),
    type: 'bgImage',
    position: 'absol',
    parent: 'section',
    parentWidth: CANVAS,
    top,
    left: toPct(img.x, CANVAS),
    width: `${((realSize.width / CANVAS) * 100).toFixed(6)}%`,
    src: img.possibleFile ? `/images/${img.possibleFile}` : 'TODO',
    naturalWidth: realSize.width,
    naturalHeight: realSize.height,
    aspectRatio: `${realSize.width} / ${realSize.height}`,
    sourceType: '완성형',
    psdY: img.y,
    effects: img.effects || null,
    borderRadius: 0
  };
  if (topNote) result._topNote = topNote;
  return result;
}

function buildRltvText(t, prevY) {
  claimed.add(t.name);
  const hint = (() => {
    if (!t.segments) return 'text';
    const fs = t.segments[0] ? t.segments[0].fontSize_px : 0;
    if (fs >= 35) return 'title';
    if (fs >= 18) return 'sub';
    return 'text';
  })();
  const mt = t.y - prevY;
  const result = {
    name: getName(hint),
    type: 'text',
    position: 'rltv',
    parent: 'section',
    parentWidth: CANVAS,
    marginTop: mt > 0 ? toVw(mt) : '0',
    width: toPct(t.w, CANVAS),
    psdY: t.y,
    effects: t.effects || null,
    segments: buildSegments(t.segments)
  };
  // Alignment
  const cx = t.x + t.w / 2;
  if (Math.abs(cx - CANVAS / 2) < 50) result.textAlign = 'center';
  else if (t.x > 20) result.marginLeft = toPct(t.x, CANVAS);
  return result;
}

function buildRltvContainer(group, prevY) {
  const bbox = group.bbox;
  const mt = bbox.y - prevY;
  const name = getName('group');

  const container = {
    name,
    type: 'container',
    position: 'rltv',
    parent: 'section',
    parentWidth: CANVAS,
    marginTop: mt > 0 ? toVw(mt) : '0',
    width: toPct(bbox.w, CANVAS),
    psdY: bbox.y,
    psdGroup: group.name,
    _groupBbox: { y: bbox.y, h: bbox.h },
    effects: null,
    borderRadius: 0
  };

  // Alignment
  const cx = bbox.x + bbox.w / 2;
  if (Math.abs(cx - CANVAS / 2) < 50) {
    // centered
  } else if (bbox.x > 20) {
    container.marginLeft = toPct(bbox.x, CANVAS);
  }

  // Build children from elements inside bbox
  const inside = getGroupElements(group);
  const subGroups = getSubGroups(group.name);

  // If has sub-groups, use them as wrapper structure
  if (subGroups.length > 0) {
    const children = [];
    for (const sg of subGroups.sort((a, b) => (a.bbox?.y || 0) - (b.bbox?.y || 0))) {
      const child = buildSubGroupChild(sg, name, bbox.w, bbox);
      children.push(child);
    }
    // Also add any elements not in sub-groups
    const subGroupBboxes = subGroups.filter(sg => sg.bbox).map(sg => sg.bbox);
    for (const elem of inside.sort((a, b) => a.y - b.y)) {
      if (!subGroupBboxes.some(bb => elemInBbox(elem, bb))) {
        children.push(buildChildElement(elem, name, bbox.w, bbox));
        claimed.add(elem.name);
      }
    }
    if (children.length > 0) container.children = children;
  } else if (inside.length > 0) {
    // No sub-groups, use elements directly
    const children = [];
    for (const elem of inside.sort((a, b) => a.y - b.y)) {
      children.push(buildChildElement(elem, name, bbox.w, bbox));
      claimed.add(elem.name);
    }
    container.children = children;
  }

  // Calculate actual bottom from sub-groups
  // Key: detect flex row (horizontal) vs stack (vertical)
  let actualBottom = bbox.y + bbox.h;
  const subGroups2 = getSubGroups(group.name).filter(sg => sg.bbox);
  if (subGroups2.length >= 2) {
    const ys = subGroups2.map(sg => sg.bbox.y);
    const xs = subGroups2.map(sg => sg.bbox.x);
    const yRange = Math.max(...ys) - Math.min(...ys);
    const xRange = Math.max(...xs) - Math.min(...xs);

    if (xRange > yRange && yRange < 100) {
      // Flex row (가로 배치): bottom = min(Y) + max(H)
      const minY = Math.min(...ys);
      const maxH = Math.max(...subGroups2.map(sg => sg.bbox.h));
      actualBottom = minY + maxH;
    } else {
      // Vertical stack: max(Y + H)
      actualBottom = Math.max(...subGroups2.map(sg => sg.bbox.y + sg.bbox.h));
    }
  }

  return { container, bottom: actualBottom };
}

function buildSubGroupChild(subGroup, parentName, parentW, parentBbox) {
  const bbox = subGroup.bbox;
  const name = getName('item');

  const child = {
    name,
    type: 'container',
    position: 'rltv',
    parent: parentName,
    parentWidth: Math.round(parentW),
    psdGroup: subGroup.name,
    effects: null,
    borderRadius: 0
  };

  // Width relative to parent
  child.width = toPct(bbox.w, parentW);

  // Get elements inside this sub-group
  const inside = allFlat.filter(e => !claimed.has(e.name) && elemInBbox(e, bbox));
  if (inside.length > 0) {
    child.children = inside.sort((a, b) => a.y - b.y).map(e => {
      claimed.add(e.name);
      return buildChildElement(e, name, bbox.w, bbox);
    });
  }

  return child;
}

function buildChildElement(elem, parentName, parentW, parentBbox) {
  // ★ 인자 타입 assertion — 잘못된 호출 즉시 감지
  if (typeof parentName !== 'string') throw new Error(`buildChildElement: parentName must be string, got ${typeof parentName} (${parentName})`);
  if (typeof parentW !== 'number' || isNaN(parentW)) throw new Error(`buildChildElement: parentW must be number, got ${typeof parentW} (${parentW})`);
  if (!parentBbox || typeof parentBbox.x !== 'number' || typeof parentBbox.y !== 'number') throw new Error(`buildChildElement: parentBbox must be {x,y}, got ${JSON.stringify(parentBbox)}`);
  const result = {
    name: getName(elem._type === 'text' ? 'text' : elem._type === 'image' ? 'img' : 'rect'),
    type: elem._type === 'text' ? 'text' : elem._type === 'image' ? 'image' : 'cssShape',
    position: 'absol',
    parent: parentName,
    parentWidth: Math.round(parentW),
    top: toVw(elem.y - parentBbox.y),
    left: toPct(elem.x - parentBbox.x, parentW),
    width: toPct(elem.w, parentW),
    psdY: elem.y,
    effects: elem.effects || null
  };

  if (elem._type === 'text' && elem.segments) {
    result.segments = buildSegments(elem.segments);
  }
  if (elem._type === 'image') {
    result.src = elem.possibleFile ? `/images/${elem.possibleFile}` : 'TODO';
    const realSize = getRealImageSize(elem.possibleFile, elem.w, elem.h);
    result.naturalWidth = realSize.width;
    result.naturalHeight = realSize.height;
    result.aspectRatio = `${realSize.width} / ${realSize.height}`;
    result.sourceType = '완성형';
    result.borderRadius = 0;
    // width를 naturalWidth 기준으로 재계산 (PSD크기 ≠ 파일크기 보정)
    if (realSize.width !== elem.w) {
      result.width = toPct(realSize.width, parentW);
    }
  }
  if (elem._type === 'rect') {
    if (elem.fill && typeof elem.fill === 'string') result._fill = elem.fill;
    if (elem.borderRadius) result.borderRadius = elem.borderRadius;
    if (elem.stroke) result.border = `${elem.stroke.width || 1}px solid ${elem.stroke.color || '#000'}`;
    if (typeof elem.opacity === 'number' && elem.opacity < 1) result._opacity = elem.opacity;
  }

  return result;
}

function buildAbsolContainer(group) {
  const bbox = group.bbox;
  const name = getName('absol_group');

  const container = {
    name,
    type: 'cssShape',
    position: 'absol',
    parent: 'section',
    parentWidth: CANVAS,
    top: toVw(bbox.y - prevBottom),
    left: toPct(bbox.x, CANVAS),
    width: toPct(bbox.w, CANVAS),
    psdGroup: group.name,
    effects: null,
    borderRadius: 0
  };

  const inside = getGroupElements(group);
  if (inside.length > 0) {
    // Check for sub-groups for better structure
    const subGroups = getSubGroups(group.name);
    if (subGroups.length > 0) {
      const children = [];
      for (const sg of subGroups.sort((a, b) => (a.bbox?.y || 0) - (b.bbox?.y || 0))) {
        const child = buildSubGroupChild(sg, name, bbox.w, bbox);
        children.push(child);
      }
      // Unclaimed elements
      for (const elem of inside.sort((a, b) => a.y - b.y)) {
        if (!claimed.has(elem.name)) {
          children.push(buildChildElement(elem, name, bbox.w, bbox));
          claimed.add(elem.name);
        }
      }
      container.children = children;
    } else {
      container.children = inside.sort((a, b) => a.y - b.y).map(e => {
        claimed.add(e.name);
        return buildChildElement(e, name, bbox.w, bbox);
      });
    }
  }

  return container;
}

// ══════════════════════════════════════════
// ── ASSEMBLY (플랫 리스트 + 데이터 보강 — 구조 판단은 AI에 위임) ──
// ══════════════════════════════════════════

// ── 1. 플랫 요소 리스트: 모든 요소를 Y순 정렬, PSD 좌표 그대로 ──
const flatElements = allFlat
  .filter(e => e.w >= 5 && e.h >= 5) // tiny artifacts 제외
  .sort((a, b) => a.y - b.y)
  .map((e, idx) => {
    const el = {
      zIndex: idx,
      name: e.name,
      type: e._type, // text, image, rect
      x: e.x, y: e.y, w: e.w, h: e.h,
      // section-relative 좌표 (vw/%)
      relTop: toVw(e.y - prevBottom),
      relLeft: toPct(e.x, CANVAS),
      relWidth: toPct(e.w, CANVAS),
    };
    // 이미지
    if (e._type === 'image') {
      el.possibleFile = e.possibleFile || 'TODO';
      if (el.possibleFile !== 'TODO') {
        const realSize = getRealImageSize(el.possibleFile, e.w, e.h);
        el.naturalWidth = realSize.width;
        el.naturalHeight = realSize.height;
        const meta = imageMetaMap[el.possibleFile] || imageMetaMap[path.basename(el.possibleFile)];
        if (meta) {
          el.composite = meta.composite === true;
          if (meta.sourceType) el.sourceType = meta.sourceType;
        }
      }
      el.clippingRect = e.clippingRect || null;
    }
    // 텍스트
    if (e._type === 'text' && e.segments) {
      el.segments = buildSegments(e.segments);
      el.content = e.content || e.segments.map(s => s.text || '').join('');
    }
    // rect
    if (e._type === 'rect') {
      if (e.fill && typeof e.fill === 'string') el.fill = e.fill;
      if (e.borderRadius) el.borderRadius = e.borderRadius;
      if (e.stroke) el.border = `${e.stroke.width || 1}px solid ${e.stroke.color || '#000'}`;
      if (typeof e.opacity === 'number' && e.opacity < 1) el.opacity = e.opacity;
    }
    // effects
    if (e.effects && e.effects.length > 0) el.effects = e.effects;
    // 배경 후보 표시
    if (e.w >= CANVAS * 0.8) el.isBackground = true;
    // 라인 표시
    if (e.w < 5 || e.h < 5) el.isLine = true;
    return el;
  });

// ── 2. 겹침 관계 계산 (AI가 wrapper 판단할 때 사용) ──
const overlaps = [];
const containmentHints = [];
function isExcludedContainerName(name) {
  return /(bg|background|paper|panel|table|wrap|stage|section|body)/i.test(name || '');
}
function isOverlayContainerName(name) {
  return /(chart|graph|map|photo|image|visual|figure|illust)/i.test(name || '') &&
    !isExcludedContainerName(name || '');
}
function isOverlayChildName(name) {
  return /(profit|badge|marker|pin|label|circle|callout|sticker|point|icon)/i.test(name || '');
}
function isCompleteish(el) {
  return el && (el.composite === true || /완성형|composite/i.test(el.sourceType || ''));
}
function overlayContainmentScore(container, child, areaRatio) {
  let score = 0;
  const reasons = [];
  if (isOverlayContainerName(container.name)) { score += 2; reasons.push('containerName'); }
  if (isOverlayChildName(child.name)) { score += 2; reasons.push('childName'); }
  if (container.type === 'image' && child.type === 'image') { score += 1; reasons.push('imagePair'); }
  if (isCompleteish(child)) { score += 1; reasons.push('completeChild'); }
  if (areaRatio >= 0.04 && areaRatio <= 0.35) { score += 1; reasons.push('areaRatio'); }
  if (isCompleteish(container) || /source|완성형/i.test(container.sourceType || '')) { score += 1; reasons.push('visualContainer'); }
  return { score, reasons };
}
for (let i = 0; i < flatElements.length; i++) {
  for (let j = i + 1; j < flatElements.length; j++) {
    const a = flatElements[i], b = flatElements[j];
    // bbox 교집합
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox > 0 && oy > 0) {
      const overlapArea = ox * oy;
      const smallerArea = Math.min(a.w * a.h, b.w * b.h);
      // 작은 요소 면적의 30% 이상 겹치면 의미 있는 겹침
      if (overlapArea > smallerArea * 0.3) {
        overlaps.push({ a: a.name, b: b.name, area: overlapArea });
      }
    }
    const pairs = [
      { container: a, child: b },
      { container: b, child: a }
    ];
    for (const pair of pairs) {
      const container = pair.container;
      const child = pair.child;
      if (!container.w || !container.h || !child.w || !child.h) continue;
      if (child.w * child.h > container.w * container.h * 0.45) continue;
      const contained = child.x >= container.x - 4 &&
        child.y >= container.y - 4 &&
        child.x + child.w <= container.x + container.w + 4 &&
        child.y + child.h <= container.y + container.h + 4;
      if (!contained) continue;
      if (isExcludedContainerName(container.name) || isExcludedContainerName(child.name)) continue;
      const evidence = overlayContainmentScore(container, child, child.w * child.h / (container.w * container.h));
      if (evidence.score < 5 || !isOverlayContainerName(container.name) || !isOverlayChildName(child.name)) continue;
      containmentHints.push({
        parentCandidate: container.name,
        child: child.name,
        childAreaRatio: Number((child.w * child.h / (container.w * container.h)).toFixed(3)),
        evidence: evidence.reasons,
        recommendation: `${child.name}는 ${container.name} 내부 overlay 후보 — 같은 wrapper 형제보다 ${container.name}의 children으로 중첩 검토`
      });
    }
  }
}

// ── 3. 이미지 파일 목록 ──
const availableImages = Object.entries(imageFileMap).map(([file, size]) => {
  const meta = imageMetaMap[file] || {};
  const out = { file, width: size.width, height: size.height };
  if (meta.composite === true) out.composite = true;
  if (meta.sourceType) out.sourceType = meta.sourceType;
  if (meta.hints) out.hints = meta.hints;
  return out;
}).sort((a, b) => a.file.localeCompare(b.file));

function stemOf(name) {
  const base = path.basename(String(name || ''));
  return base.replace(/\.[a-z0-9]+$/i, '');
}

function normTextValue(v) {
  return String(v || '')
    .replace(/\s+/g, '')
    .replace(/[“”"'`]/g, '')
    .trim();
}

function containsBox(inner, outer, margin = 8) {
  return inner.x >= outer.x - margin &&
    inner.y >= outer.y - margin &&
    inner.x + inner.w <= outer.x + outer.w + margin &&
    inner.y + inner.h <= outer.y + outer.h + margin;
}

function overlapRatio(a, b) {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (ox <= 0 || oy <= 0) return 0;
  return (ox * oy) / Math.max(1, Math.min(a.w * a.h, b.w * b.h));
}

function expandBox(box, margin) {
  return {
    x: box.x - margin,
    y: box.y - margin,
    w: box.w + margin * 2,
    h: box.h + margin * 2
  };
}

function centerXOf(box) {
  return box.x + box.w / 2;
}

function isCompleteMeta(meta) {
  return !!(meta && (meta.composite === true || /완성형|composite/i.test(meta.sourceType || '')));
}

function isConfirmedCompleteMeta(meta) {
  return !!(meta && (meta.composite === true || /^완성형$/i.test(meta.sourceType || '')));
}

const availableByStem = {};
availableImages.forEach(img => {
  availableByStem[stemOf(img.file)] = img;
});

const groupedBBoxes = (spec.groups || [])
  .filter(g => g && g.bbox && g.bbox.w && g.bbox.h)
  .map(g => ({
    name: g.name,
    x: g.bbox.x,
    y: g.bbox.y,
    w: g.bbox.w,
    h: g.bbox.h
  }));

function textCoveredByCompleteAsset(t) {
  for (const img of (spec.images || [])) {
    const file = img.possibleFile;
    if (!file || file === 'TODO') continue;
    const meta = imageMetaMap[path.basename(file)] || imageMetaMap[file] || availableByStem[stemOf(file)];
    if (!isConfirmedCompleteMeta(meta)) continue;
    const imgBox = img.clippingRect ? {
      x: img.clippingRect.x,
      y: img.clippingRect.y,
      w: img.clippingRect.w,
      h: img.clippingRect.h
    } : img;
    if (containsBox(t, imgBox, 8)) {
      return { type: 'image', name: file };
    }
  }

  for (const group of groupedBBoxes) {
    if (!containsBox(t, group, 8)) continue;
    const directAsset = availableByStem[stemOf(group.name)];
    if (isConfirmedCompleteMeta(directAsset)) {
      return { type: 'group-asset', name: group.name };
    }
    const overlappingComplete = (spec.images || []).find(img => {
      const file = img.possibleFile;
      if (!file || file === 'TODO') return false;
      const meta = imageMetaMap[path.basename(file)] || imageMetaMap[file] || availableByStem[stemOf(file)];
      if (!isConfirmedCompleteMeta(meta)) return false;
      const imgBox = img.clippingRect ? {
        x: img.clippingRect.x,
        y: img.clippingRect.y,
        w: img.clippingRect.w,
        h: img.clippingRect.h
      } : img;
      return overlapRatio(group, imgBox) >= 0.55;
    });
    if (overlappingComplete) {
      return { type: 'group-overlap', name: overlappingComplete.possibleFile || overlappingComplete.name };
    }
  }

  return null;
}

function textFontPx(t) {
  if (!t || !Array.isArray(t.segments) || !t.segments.length) return 0;
  return Number(t.segments[0].fontSize_px || 0);
}

function isSignificantRawText(t) {
  const raw = t.content || (t.segments || []).map(s => s.text || '').join('');
  const normalized = normTextValue(raw);
  if (!normalized) return false;
  if (/^\d{1,4}$/.test(normalized)) return false;
  const fs = textFontPx(t);
  if (raw.includes('\n')) return true;
  if (normalized.length >= 8) return true;
  if (fs >= 18 && t.w >= 80) return true;
  if (t.w >= 160 && t.h >= 22) return true;
  return false;
}

const requiredTextHints = (spec.texts || [])
  .filter(isSignificantRawText)
  .map(t => {
    const coveredBy = textCoveredByCompleteAsset(t);
    if (coveredBy) return null;
    const raw = t.content || (t.segments || []).map(s => s.text || '').join('');
    return {
      name: t.name,
      content: raw,
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      fontSizePx: textFontPx(t),
      recommendation: '완성형 이미지 내부가 아닌 유의미한 PSD 텍스트 — plan text element로 구현하거나 ignoredTexts에 reason 명시'
    };
  })
  .filter(Boolean);

const stackCardHints = [];
const familyMap = {};
availableImages.forEach(img => {
  const m = String(img.file || '').match(new RegExp('^con0*' + Number(secNum) + '_(\\d+)_'));
  if (!m) return;
  if (!familyMap[m[1]]) familyMap[m[1]] = [];
  familyMap[m[1]].push(img);
});

const panelFamilies = Object.keys(familyMap).filter(fam => {
  const items = familyMap[fam];
  return items.some(img => /_01\.(png|jpe?g|webp)$/i.test(img.file)) &&
    items.some(img => /_02\.(png|jpe?g|webp)$/i.test(img.file));
});

const repeatedPanelRects = (spec.rects || [])
  .filter(r => r.w >= CANVAS * 0.6 && r.h >= 300 && r.h <= 700)
  .filter(r => r.w < CANVAS * 0.9)
  .filter(r => !/(bg|background)/i.test(r.name || ''))
  .sort((a, b) => a.y - b.y);

if (panelFamilies.length >= 3 && repeatedPanelRects.length >= 3) {
  const topThreeRects = repeatedPanelRects.slice(0, 3);
  const widths = topThreeRects.map(r => r.w);
  const heights = topThreeRects.map(r => r.h);
  const centers = topThreeRects.map(r => r.x + r.w / 2);
  const gaps = [];
  for (let i = 1; i < topThreeRects.length; i++) {
    gaps.push(topThreeRects[i].y - topThreeRects[i - 1].y);
  }
  const maxWidthDelta = Math.max(...widths) - Math.min(...widths);
  const maxHeightDelta = Math.max(...heights) - Math.min(...heights);
  const maxCenterDelta = Math.max(...centers) - Math.min(...centers);
  const maxGapDelta = gaps.length ? Math.max(...gaps) - Math.min(...gaps) : 0;
  const badgeNums = (spec.texts || []).filter(t => /^(01|02|03)$/.test(normTextValue(t.content || '')));
  if (maxWidthDelta <= 8 && maxHeightDelta <= 8 && maxCenterDelta <= 8 && maxGapDelta <= 20) {
    const stackCards = topThreeRects.map((rect, idx) => {
      const expanded = expandBox(rect, 20);
      const significantTexts = requiredTextHints.filter(t =>
        containsBox(t, expanded, 8) || overlapRatio(t, expanded) >= 0.35
      );
      const badgeTexts = (spec.texts || [])
        .filter(t => /^(0?\d{1,2})$/.test(normTextValue(t.content || '')))
        .filter(t => containsBox(t, expanded, 8) || overlapRatio(t, expanded) >= 0.4)
        .map(t => ({
          name: t.name,
          content: t.content || (t.segments || []).map(s => s.text || '').join(''),
          x: t.x,
          y: t.y,
          w: t.w,
          h: t.h
        }));
      const bodyTexts = significantTexts.filter(t => centerXOf(t) <= rect.x + rect.w * 0.58);
      const overlayTexts = significantTexts.filter(t => !bodyTexts.includes(t));
      const overlayImages = flatElements
        .filter(el => el.type === 'image' && (containsBox(el, expanded, 8) || overlapRatio(el, expanded) >= 0.35))
        .filter(el => centerXOf(el) > rect.x + rect.w * 0.55)
        .map(el => ({
          name: el.name,
          possibleFile: el.possibleFile || null,
          x: el.x,
          y: el.y,
          w: el.w,
          h: el.h,
          sourceType: el.sourceType || null
        }));
      return {
        cardIndex: idx + 1,
        bbox: { x: rect.x, y: rect.y, w: rect.w, h: rect.h },
        badgeTexts,
        bodyTexts: bodyTexts.map(t => ({ name: t.name, content: t.content, fontSizePx: t.fontSizePx, x: t.x, y: t.y })),
        overlayTexts: overlayTexts.map(t => ({ name: t.name, content: t.content, fontSizePx: t.fontSizePx, x: t.x, y: t.y })),
        overlayImages,
        sourcePanelPreferred: bodyTexts.length >= 2,
        recommendation: bodyTexts.length >= 2
          ? '패널 이미지를 완성형으로 단정하지 말고, 카드 wrapper + live text/body 구조를 먼저 세울 것'
          : '카드 wrapper 내부에서 패널/텍스트/overlay 분리를 우선 검토'
      };
    });

    for (const hint of requiredTextHints) {
      if (hint.cardIndex) continue;
      const matchedCard = stackCards.find(card => containsBox(hint, expandBox(card.bbox, 20), 8) || overlapRatio(hint, expandBox(card.bbox, 20)) >= 0.35);
      if (!matchedCard) continue;
      hint.cardIndex = matchedCard.cardIndex;
      hint.hintGroup = 'stack-card-' + matchedCard.cardIndex;
      hint.hintRole = centerXOf(hint) <= matchedCard.bbox.x + matchedCard.bbox.w * 0.58 ? 'body' : 'overlay';
    }

    stackCardHints.push({
      type: 'vertical-card-stack',
      families: panelFamilies.sort(),
      panelRects: topThreeRects.map(r => ({ name: r.name, x: r.x, y: r.y, w: r.w, h: r.h })),
      cards: stackCards,
      sourcePanelPreferred: stackCards.every(card => card.sourcePanelPreferred === true),
      evidence: [
        'repeatedPanelAssetFamilies',
        'repeatedLargePanelRects',
        'alignedCenters',
        'regularVerticalGaps',
        badgeNums.length >= 3 ? 'badgeSequence01to03' : 'multiFamilyStack'
      ],
      recommendation: '같은 폭의 카드가 세로로 반복되는 stack 섹션 후보 — 카드별 wrapper를 먼저 세우고, 패널 이미지를 완성형으로 단정하지 말고 live text/body와 overlay를 분리한 뒤 PC에서는 overflow-hidden stage/desktop interaction 여부를 초기 plan에서 확정'
    });
  }
}

// image-analyzer asset 목록에만 존재하는 완성형 이미지도 구조 힌트로 남긴다.
// 예: PSD 내부 스마트오브젝트는 원형 뱃지 레이어로 풀려 있지만, 실제 사용 asset은
// chart 전체 이미지 + 내부 badge 이미지일 수 있다. 확정은 하지 않고 힌트만 제공한다.
const imageAssetContainmentHints = [];
const sectionPrefixPattern = new RegExp('^con0*' + Number(secNum) + '_', 'i');
for (const child of flatElements) {
  if (child.type !== 'image' || !child.possibleFile || child.possibleFile === 'TODO') continue;
  if (!child.naturalWidth || !child.naturalHeight) continue;
  const childFile = path.basename(child.possibleFile);
  const childMeta = imageMetaMap[childFile] || {};
  const childComplete = childMeta.composite === true || /완성형|composite/i.test(childMeta.sourceType || child.sourceType || '');
  const rawLooksLikeCroppedAsset = child.h > child.naturalHeight * 1.5 || child.w > child.naturalWidth * 1.5;
  if (!childComplete || !rawLooksLikeCroppedAsset) continue;
  for (const candidate of availableImages) {
    if (candidate.file === childFile) continue;
    if (/_m\.(png|jpe?g)$/i.test(candidate.file)) continue;
    if (!sectionPrefixPattern.test(candidate.file)) continue;
    if (/(bg|background|paper|table)/i.test(candidate.file)) continue;
    if (candidate.width <= child.naturalWidth * 1.45 || candidate.height <= child.naturalHeight * 1.45) continue;
    const areaRatio = (child.naturalWidth * child.naturalHeight) / (candidate.width * candidate.height);
    if (areaRatio < 0.08 || areaRatio > 0.35) continue;
    const heightMatchesRawSmartObject = Math.abs(candidate.height - child.h) <= Math.max(8, child.h * 0.08);
    if (!heightMatchesRawSmartObject) continue;
    imageAssetContainmentHints.push({
      parentAssetCandidate: candidate.file,
      child: child.name,
      childAsset: childFile,
      childAreaRatio: Number(areaRatio.toFixed(3)),
      evidence: ['completeChildAsset', 'croppedSmartObjectBounds', 'candidateNaturalSize'],
      recommendation: `${childFile}는 ${candidate.file} 내부 overlay asset 후보 — plan 작성 시 ${candidate.file} wrapper의 children 중첩 여부 확인`
    });
  }
}

// ── 3b. Swiper 후보 힌트 ──
// 강제 규칙이 아니라 "유저 확인용 힌트"만 제공한다.
// 조건: 완성형 이미지가 3개 이상 가로열, 크기 유사, section 양옆으로 일부 잘림이 있거나
// 폭이 거의 화면을 가득 채워 반복 카드열처럼 보이는 경우.
const swiperHints = [];
const carouselImageCandidates = flatElements
  .filter(e => e.type === 'image')
  .filter(e => isCompleteish(e))
  .filter(e => e.w >= 140 && e.h >= 120)
  .filter(e => !/(bg|background|paper|texture|smoke|line|deco|pattern)/i.test(e.name || ''))
  .sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2) || a.x - b.x);

let rowCluster = [];
function flushSwiperCluster() {
  if (rowCluster.length < 3) { rowCluster = []; return; }
  const items = rowCluster.slice().sort((a, b) => a.x - b.x);
  const widths = items.map(i => i.w);
  const heights = items.map(i => i.h);
  const minW = Math.min(...widths), maxW = Math.max(...widths);
  const minH = Math.min(...heights), maxH = Math.max(...heights);
  if (maxW / Math.max(minW, 1) > 1.25 || maxH / Math.max(minH, 1) > 1.25) {
    rowCluster = [];
    return;
  }

  const gaps = [];
  for (let i = 1; i < items.length; i++) {
    gaps.push(items[i].x - (items[i - 1].x + items[i - 1].w));
  }
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const gapVariance = gaps.length ? gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length : 0;
  const gapStd = Math.sqrt(gapVariance);
  const leftClipped = items[0].x < 0;
  const rightClipped = (items[items.length - 1].x + items[items.length - 1].w) > CANVAS;
  const totalSpan = items[items.length - 1].x + items[items.length - 1].w - items[0].x;

  if (gapStd <= 50 && totalSpan >= CANVAS * 0.9 && (leftClipped || rightClipped)) {
    swiperHints.push({
      items: items.map(i => i.possibleFile || i.name),
      rowY: Math.round(items.reduce((sum, i) => sum + i.y, 0) / items.length),
      avgGapPx: Math.round(avgGap * 10) / 10,
      evidence: [
        'repeatedCompleteImages',
        'horizontalRow',
        leftClipped ? 'leftEdgeClipped' : null,
        rightClipped ? 'rightEdgeClipped' : null
      ].filter(Boolean),
      recommendation: '반복 완성형 이미지가 가로열로 배치되고 양옆 일부가 잘려 보임 — Swiper 가능성 높음. 자동 확정하지 말고 유저에게 최종 확인'
    });
  }
  rowCluster = [];
}

for (const img of carouselImageCandidates) {
  if (rowCluster.length === 0) {
    rowCluster.push(img);
    continue;
  }
  const avgCy = rowCluster.reduce((sum, i) => sum + (i.y + i.h / 2), 0) / rowCluster.length;
  const curCy = img.y + img.h / 2;
  if (Math.abs(curCy - avgCy) <= 45) {
    rowCluster.push(img);
  } else {
    flushSwiperCluster();
    rowCluster.push(img);
  }
}
flushSwiperCluster();

// ── 3c. Smart-object row + single-card live text 템플릿 힌트 ──
// con04 같은 케이스: 카드열 전체는 넓은 clipped/smart-object 1장처럼 보이지만,
// PSD raw에는 카드 1세트 분량의 라이브 텍스트만 남아 있을 수 있다.
// 이 경우 자동 추출만으로 모든 카드 데이터를 알 수 없으므로, plan 단계에서
// "manualDataRequired" 힌트를 먼저 띄워 재작업을 줄인다.
function looksLikeStoreNameText(t) {
  const v = normTextValue(t.content || '');
  return /횟집|점/.test(v) && v.length >= 4 && v.length <= 20;
}
function looksLikeMonthText(t) {
  const v = normTextValue(t.content || '');
  return /\d{1,2}년\d{1,2}월/.test(v);
}
function looksLikeAmountText(t) {
  const v = normTextValue(t.content || '');
  return /^[0-9,]{7,}$/.test(v);
}
function looksLikeSalesLabel(t) {
  const v = normTextValue(t.content || '');
  return /월매출/.test(v);
}

const manualDataHints = [];
const wideRowImages = flatElements
  .filter(e => e.type === 'image')
  .filter(e => e.w >= CANVAS * 1.15 && e.h >= 120 && e.h <= 320)
  .filter(e => e.clippingRect || /group|레이어|그룹/i.test(e.name || ''))
  .sort((a, b) => a.y - b.y);

for (const row of wideRowImages) {
  const rowBox = row.clippingRect ? {
    x: row.clippingRect.x,
    y: row.clippingRect.y,
    w: row.clippingRect.w,
    h: row.clippingRect.h
  } : { x: row.x, y: row.y, w: row.w, h: row.h };
  const expanded = expandBox(rowBox, 40);
  const nearbyTexts = (spec.texts || []).filter(t => containsBox(t, expanded, 12) || overlapRatio(t, expanded) >= 0.25);
  const storeTexts = nearbyTexts.filter(looksLikeStoreNameText);
  const monthTexts = nearbyTexts.filter(looksLikeMonthText);
  const amountTexts = nearbyTexts.filter(looksLikeAmountText);
  const salesLabels = nearbyTexts.filter(looksLikeSalesLabel);
  if (storeTexts.length !== 1 || monthTexts.length !== 1 || amountTexts.length !== 1 || salesLabels.length < 1) continue;

  manualDataHints.push({
    type: 'smart-object-card-row-template',
    rowImage: {
      name: row.name,
      possibleFile: row.possibleFile || null,
      x: row.x,
      y: row.y,
      w: row.w,
      h: row.h,
      clippingRect: row.clippingRect || null
    },
    templateTexts: {
      store: { name: storeTexts[0].name, content: storeTexts[0].content || '' },
      month: { name: monthTexts[0].name, content: monthTexts[0].content || '' },
      amount: { name: amountTexts[0].name, content: amountTexts[0].content || '' },
      label: salesLabels.slice(0, 2).map(t => ({ name: t.name, content: t.content || '' }))
    },
    recommendation: '넓은 smart-object 카드열 + 카드 1세트 라이브 텍스트 템플릿 감지 — 반복 카드/Swiper 구조와 나머지 데이터는 수동 입력 가능성을 먼저 검토'
  });
}

// ── 4. PSD 그룹 정보 (참고용) ──
const psdGroups = classifiedGroups.map(g => ({
  name: g.name, role: g.role,
  bbox: g.bbox ? { x: g.bbox.x, y: g.bbox.y, w: g.bbox.w, h: g.bbox.h } : null
}));

// ── 5. pt/pb 참고값 (AI가 최종 결정) ──
const ptSuggestions = {};
if (bgRectTop !== null) {
  const contentElems = [...(spec.texts || []), ...(spec.images || []), ...(spec.rects || [])]
    .filter(e => e.y >= bgRectTop && e.y <= secBottom && e.w < CANVAS * 0.4 && e.w > 10 && e.h > 10)
    .sort((a, b) => a.y - b.y);
  const firstContentY = contentElems.length > 0 ? contentElems[0].y : secTop;
  ptSuggestions.bgRect = toVw(firstContentY - bgRectTop);
  ptSuggestions.bgRectTop = bgRectTop;
}
ptSuggestions.shape = toVw(Math.max(0, (flatElements.find(e => !e.isBackground && e.type !== 'rect')?.y || secTop) - prevBottom));
ptSuggestions.prevBottom = prevBottom;

const pbSuggestions = {};
function isPbContentCandidate(e) {
  if (!e || e.isBackground) return false;
  if (e.w >= CANVAS * 0.85) return false;
  if (/(bg|background|smoke|texture|paper|pattern|사각형 1)/i.test(e.name || '')) return false;
  return true;
}
const lastContent = [...flatElements]
  .filter(isPbContentCandidate)
  .sort((a, b) => (b.y + b.h) - (a.y + a.h) || b.y - a.y)[0];
if (lastContent) {
  pbSuggestions.fromLastContent = toVw(Math.max(0, secBottom - (lastContent.y + lastContent.h)));
  const effectiveEnd = typeof global.__effectiveEnd === 'number' ? global.__effectiveEnd : secBottom;
  pbSuggestions.fromLastContentToEffectiveEnd = toVw(effectiveEnd - (lastContent.y + lastContent.h));
  pbSuggestions.lastContent = {
    name: lastContent.name,
    bottom: lastContent.y + lastContent.h
  };
}
pbSuggestions.secBottom = secBottom;
pbSuggestions.effectiveEnd = typeof global.__effectiveEnd === 'number' ? global.__effectiveEnd : secBottom;
if (Math.abs(pbSuggestions.effectiveEnd - secBottom) > 200) {
  pbSuggestions.effectiveEndWarning = 'sectionY.bottom과 effectiveEnd 차이가 큼 — smoke/background/overhang이 섹션 높이를 늘렸을 수 있으므로 pb는 effectiveEnd 기준 우선 검토';
}

// ── 5b. CSS shape/line 필수 후보 ──
// 1차원 thin 판정 금지: 얇음 + 세로/가로 비율 + 배경색과 대비 + 불투명도 + 배경/카드 제외를 함께 사용한다.
function hexToRgb(hex) {
  const m = String(hex || '').match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function colorDistance(a, b) {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  if (!ra || !rb) return 999;
  return Math.sqrt(Math.pow(ra.r-rb.r, 2) + Math.pow(ra.g-rb.g, 2) + Math.pow(ra.b-rb.b, 2));
}
function groupHasCompleteAsset(groupName) {
  if (!groupName) return false;
  const normalized = String(groupName).trim().toLowerCase();
  return availableImages.some(img => {
    if (!img || !img.file) return false;
    const base = path.basename(img.file).replace(/\.[^.]+$/, '').toLowerCase();
    const looksComplete = img.composite === true || /완성형|composite/i.test(img.sourceType || '');
    return looksComplete && base === normalized;
  });
}
function rectInsideCompleteGroupAsset(r) {
  if (!r || !Array.isArray(spec.groups)) return false;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  return spec.groups.some(g => {
    if (!g || !g.bbox || !groupHasCompleteAsset(g.name)) return false;
    const box = g.bbox;
    return cx >= box.x - 8 && cx <= box.x + box.w + 8 &&
      cy >= box.y - 8 && cy <= box.y + box.h + 8;
  });
}
const requiredShapeHints = allRects
  .filter(r => {
    if (!r || !r.w || !r.h) return false;
    if (/^(사각형 1|background|bg)/i.test(r.name || '')) return false;
    const opacity = typeof r.opacity === 'number' ? r.opacity : 1;
    if (opacity <= 0) return false;
    const isThinLine = (r.w <= 8 && r.h >= 80 && r.h / Math.max(r.w, 1) >= 12) ||
      (r.h <= 8 && r.w >= 80 && r.w / Math.max(r.h, 1) >= 12);
    if (!isThinLine) return false;
    if (colorDistance(r.fill, bg) < 30 && opacity >= 0.8) return false;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const insideCompleteImage = flatElements.some(el => {
      if (el.type !== 'image' || !isCompleteish(el)) return false;
      if (!el.w || !el.h) return false;
      return cx >= el.x - 8 && cx <= el.x + el.w + 8 &&
        cy >= el.y - 8 && cy <= el.y + el.h + 8;
    });
    if (insideCompleteImage) return false;
    if (rectInsideCompleteGroupAsset(r)) return false;
    return true;
  })
  .map(r => ({
    name: r.name,
    type: 'cssShapeLine',
    x: r.x, y: r.y, w: r.w, h: r.h,
    fill: r.fill || '#000000',
    opacity: typeof r.opacity === 'number' ? r.opacity : 1,
    topFromPrevBottom: toVw(r.y - prevBottom),
    leftPct: toPct(r.x, CANVAS),
    widthPct: toPct(r.w, CANVAS),
    heightVw: toVw(r.h),
    recommendation: 'CSS shape line/deco 후보 — plan element로 구현하거나 ignoredShapes에 근거 명시'
  }));

// ── 6. 세로 흐름 힌트: 같은 X중심(±100px) 텍스트/이미지 → rltv 후보 ──
const contentElems = flatElements.filter(e => !e.isBackground && e.type !== 'rect');
const centerX = CANVAS / 2;
const centeredFlow = contentElems
  .filter(e => Math.abs((e.x + e.w / 2) - centerX) < 150)
  .sort((a, b) => a.y - b.y)
  .map(e => e.name);

// ── 6b. 중앙축 반복 힌트: 자식별 margin-left 대신 부모 flex centering 후보 ──
function centerOf(e) { return e.x + e.w / 2; }
function bboxContains(box, e, margin = 12) {
  return e.x >= box.x - margin && e.y >= box.y - margin &&
    e.x + e.w <= box.x + box.w + margin &&
    e.y + e.h <= box.y + box.h + margin;
}

const axisCandidates = contentElems
  .filter(e => e.w > 10 && e.h > 8 && e.w < CANVAS * 0.9)
  .map(e => ({ ...e, _cx: centerOf(e) }))
  .sort((a, b) => a._cx - b._cx);

const centerAxisHints = [];
let axisCluster = [];
function flushAxisCluster() {
  if (axisCluster.length < 2) { axisCluster = []; return; }
  const avgCx = axisCluster.reduce((sum, e) => sum + e._cx, 0) / axisCluster.length;
  const maxDelta = Math.max(...axisCluster.map(e => Math.abs(e._cx - avgCx)));
  if (maxDelta > 35) { axisCluster = []; return; }

  const elems = axisCluster.slice().sort((a, b) => a.y - b.y);
  const minX = Math.min(...elems.map(e => e.x));
  const maxX = Math.max(...elems.map(e => e.x + e.w));
  const minY = Math.min(...elems.map(e => e.y));
  const maxY = Math.max(...elems.map(e => e.y + e.h));

  const parentCandidates = [];
  for (const r of allRects) {
    if (r.w < 80 || r.h < 40) continue;
    const containsCount = elems.filter(e => bboxContains(r, e)).length;
    if (containsCount >= Math.min(2, elems.length)) {
      parentCandidates.push({
        type: 'rect',
        name: r.name,
        centerDelta: Math.round((avgCx - (r.x + r.w / 2)) * 10) / 10,
        contains: containsCount
      });
    }
  }
  for (const g of allGroups) {
    if (!g.bbox || g.bbox.w < 80 || g.bbox.h < 40) continue;
    const containsCount = elems.filter(e => bboxContains(g.bbox, e)).length;
    if (containsCount >= Math.min(2, elems.length)) {
      parentCandidates.push({
        type: 'group',
        name: g.name,
        centerDelta: Math.round((avgCx - (g.bbox.x + g.bbox.w / 2)) * 10) / 10,
        contains: containsCount
      });
    }
  }

  centerAxisHints.push({
    axisX: Math.round(avgCx * 10) / 10,
    axisPct: `${(avgCx / CANVAS * 100).toFixed(6)}%`,
    elements: elems.map(e => e.name),
    bbox: { x: Math.round(minX), y: Math.round(minY), w: Math.round(maxX - minX), h: Math.round(maxY - minY) },
    parentCandidates: parentCandidates.sort((a, b) => b.contains - a.contains || Math.abs(a.centerDelta) - Math.abs(b.centerDelta)).slice(0, 3),
    recommendation: '부모 wrapper에 flex-direction:column + align-items:center. 자식별 중앙정렬 margin-left 금지'
  });
  axisCluster = [];
}

for (const e of axisCandidates) {
  if (axisCluster.length === 0) {
    axisCluster.push(e);
    continue;
  }
  const avgCx = axisCluster.reduce((sum, item) => sum + item._cx, 0) / axisCluster.length;
  if (Math.abs(e._cx - avgCx) <= 35) {
    axisCluster.push(e);
  } else {
    flushAxisCluster();
    axisCluster.push(e);
  }
}
flushAxisCluster();

// ── 6c. element 안에 _hint inline 주입 (AI가 결정 시점에 즉시 봄) ──
// 목적: 그룹화/aspectRatio/heightChain/중앙정렬을 element 단위로 노출
// AI가 element를 편집하는 순간 그 자리에서 힌트가 보임 → 별도 필드 무시 방지
const axisElementToHint = new Map();
for (const ax of centerAxisHints) {
  for (const elemName of ax.elements) {
    axisElementToHint.set(elemName, ax);
  }
}
const elementToPsdGroup = new Map();
for (const pg of psdGroups) {
  if (!pg.bbox || pg.bbox.w < 80 || pg.bbox.h < 40) continue;
  for (const fe of flatElements) {
    if (fe.x >= pg.bbox.x - 8 && fe.y >= pg.bbox.y - 8 &&
        fe.x + fe.w <= pg.bbox.x + pg.bbox.w + 8 &&
        fe.y + fe.h <= pg.bbox.y + pg.bbox.h + 8) {
      const existing = elementToPsdGroup.get(fe.name);
      if (!existing || (existing.bbox.w * existing.bbox.h) > (pg.bbox.w * pg.bbox.h)) {
        elementToPsdGroup.set(fe.name, pg);
      }
    }
  }
}
const containmentParentMap = new Map();
for (const ch of containmentHints) {
  if (ch.parent && ch.child) containmentParentMap.set(ch.child, ch.parent);
}
// 세로 스택 인덱스 (centeredFlow 안에서 위치)
const verticalStackIdx = new Map();
centeredFlow.forEach((name, idx) => verticalStackIdx.set(name, idx));

for (const fe of flatElements) {
  const hint = {};
  // PSD group → wrapper 후보 (1번, 4번 커버: 그룹화 + 1905 회피)
  const pg = elementToPsdGroup.get(fe.name);
  if (pg) {
    hint.psdGroup = pg.name;
    hint.psdGroupBbox = `${pg.bbox.w}×${pg.bbox.h}`;
    hint.suggestedParentWidth = pg.bbox.w;
    hint.aspectRatioSuggest = `${pg.bbox.w}/${pg.bbox.h}`;
    const siblings = flatElements
      .filter(s => s.name !== fe.name && elementToPsdGroup.get(s.name) === pg)
      .map(s => s.name);
    if (siblings.length > 0) hint.siblings = siblings.slice(0, 8);
  }
  // 중앙축 의심 (6번 커버: marginLeft 대신 alignSelf:center)
  const ax = axisElementToHint.get(fe.name);
  if (ax) {
    const elemCx = fe.x + fe.w / 2;
    const axisDelta = Math.round((elemCx - ax.axisX) * 10) / 10;
    hint.centerSuspect = true;
    hint.axisDelta = axisDelta;
    hint.axisAdvice = "wrapper centerChildren:true 또는 alignSelf:'center', marginLeft 제거";
  }
  // containment (4번 보강: 형제 배치 → 자식 중첩)
  const containParent = containmentParentMap.get(fe.name);
  if (containParent) {
    hint.containmentParent = containParent;
    hint.containmentAdvice = `parent를 "${containParent}"로 중첩 (형제 배치 금지)`;
  }
  // 세로 스택 위치 (3번, 5번 커버: rltv heightChain)
  const stackIdx = verticalStackIdx.get(fe.name);
  if (stackIdx !== undefined) {
    hint.verticalStackPos = stackIdx;
    hint.heightChainCandidate = true;
    hint.rltvCandidate = true;
  }
  // 1905 직속 의심 (1번 커버)
  if (pg && pg.bbox.w < CANVAS * 0.85) {
    hint.parentWidthSuspect = `parentWidth:${CANVAS} → ${pg.bbox.w} 검토`;
  }
  // marginLeft + width/2 ≈ 50% 의심 (6번 보강)
  const xpct = parseFloat(fe.relLeft);
  const wpct = parseFloat(fe.relWidth);
  if (!isNaN(xpct) && !isNaN(wpct)) {
    const center = xpct + wpct / 2;
    if (Math.abs(center - 50) < 3) {
      hint.centerSuspect = true;
      hint.axisAdvice = hint.axisAdvice || "relLeft + relWidth/2 ≈ 50% → marginLeft 대신 alignSelf:'center'";
    }
  }
  if (Object.keys(hint).length > 0) fe._hint = hint;
}

// ── 7. Y간격 (연속 요소 간 gap) ──
const sortedContent = contentElems.sort((a, b) => a.y - b.y);
const yGaps = [];
for (let i = 1; i < sortedContent.length; i++) {
  const prev = sortedContent[i - 1];
  const cur = sortedContent[i];
  const gap = cur.y - (prev.y + prev.h);
  yGaps.push({ from: prev.name, to: cur.name, gap, gapVw: toVw(Math.max(0, gap)) });
}

// ── 8. 겹침 정보 보강: 타입 포함 ──
const overlapsEnriched = overlaps.map(o => {
  const elA = flatElements.find(e => e.name === o.a);
  const elB = flatElements.find(e => e.name === o.b);
  return {
    a: o.a, aType: elA?.type, aSize: `${elA?.w}×${elA?.h}`,
    b: o.b, bType: elB?.type, bSize: `${elB?.w}×${elB?.h}`,
    overlapArea: o.area
  };
});

// ── 9. Advisory Summary (최상위에 한눈에 보이도록) ──
// 목적: plan 파일을 열었을 때 첫 화면에 구조적 위험 요소가 모두 노출
// AI는 이걸 무시할 수 없도록 강제로 보게 됨
const advisorySummary = {
  '⚠️ 무시하지 말 것': 'element 안 _hint를 element별로 확인하고 plan 작성',
  '검사 항목': [
    '1) elements 중 _hint.psdGroup이 있는 것들 → wrapper 만들기 검토 (그룹화)',
    '2) elements 중 _hint.centerSuspect:true → marginLeft 대신 alignSelf:center',
    '3) elements 중 _hint.heightChainCandidate:true → heightChain에 포함',
    '4) elements 중 _hint.containmentParent → 형제 배치 금지, 자식으로 중첩',
    '5) elements 중 _hint.suggestedParentWidth → parentWidth:1905 대신 그룹 너비 사용',
    '6) elements 중 _hint.aspectRatioSuggest → wrapper에 aspectRatio 적용'
  ],
  flatAntiPattern: {
    sectionDirectChildren: flatElements.length,
    note: 'AI 결정 후 parent != "section"인 element가 0개면 flat 안티패턴 의심'
  },
  groupCandidates: psdGroups
    .filter(g => g.bbox && g.bbox.w >= 80 && g.bbox.h >= 40)
    .map(g => ({
      name: g.name,
      bbox: `${g.bbox.w}×${g.bbox.h}`,
      parentWidth: g.bbox.w,
      aspectRatio: `${g.bbox.w}/${g.bbox.h}`,
      members: flatElements.filter(fe => elementToPsdGroup.get(fe.name) === g).map(fe => fe.name)
    }))
    .filter(c => c.members.length >= 2)
    .slice(0, 8),
  centerAxisCount: centerAxisHints.length,
  verticalStackCount: centeredFlow.length
};

// ── Output plan ──
const plan = {
  generatedBy: 'spec-to-plan v3 (flat) + inline hints',
  _advisorySummary: advisorySummary,
  strictStructure: true,
  section: sectionName,
  sectionClass: null,
  page: page || 'TODO',
  specFile: path.basename(specPath),
  canvas: CANVAS,
  sectionY: { top: secTop, bottom: secBottom, height: secBottom - secTop },
  bg,
  bgRect: bgRectTop !== null ? { top: bgRectTop, bottom: bgRectBottom } : null,
  effectiveEnd: pbSuggestions.effectiveEnd,
  prevSectionBottom: prevBottom,
  ptSuggestions,
  pbSuggestions,
  pt: 'TODO — AI가 시안 보고 결정',
  pb: 'TODO — AI가 시안 보고 결정',
  heightChain: ['TODO — AI가 구조 결정 후 작성'],
  availableImages,
  requiredTextHints: requiredTextHints.length > 0 ? requiredTextHints : undefined,
  requiredShapeHints: requiredShapeHints.length > 0 ? requiredShapeHints : undefined,
  ignoredShapes: [],
  ignoredTexts: [],
  psdGroups: psdGroups.length > 0 ? psdGroups : undefined,
  centeredFlow: centeredFlow.length > 0 ? centeredFlow : undefined,
  centerAxisHints: centerAxisHints.length > 0 ? centerAxisHints : undefined,
  stackCardHints: stackCardHints.length > 0 ? stackCardHints : undefined,
  swiperHints: swiperHints.length > 0 ? swiperHints : undefined,
  manualDataHints: manualDataHints.length > 0 ? manualDataHints : undefined,
  yGaps: yGaps.length > 0 ? yGaps : undefined,
  containmentHints: containmentHints.concat(imageAssetContainmentHints).length > 0 ? containmentHints.concat(imageAssetContainmentHints) : undefined,
  overlaps: overlapsEnriched.length > 0 ? overlapsEnriched : undefined,
  elements: flatElements
};

// ── 자체 검증 ──
let selfCheckErrors = 0;
for (const el of flatElements) {
  for (const k of ['relTop', 'relLeft', 'relWidth']) {
    if (typeof el[k] === 'string' && /NaN/.test(el[k])) {
      console.error(`🔴 SELF-CHECK FAIL: ${el.name}.${k} = "${el[k]}"`);
      selfCheckErrors++;
    }
  }
}
if (selfCheckErrors > 0) {
  console.error(`\n🔴 ${selfCheckErrors}개 자체 검증 실패 — plan 생성 중단`);
  process.exit(1);
}

const output = JSON.stringify(plan, null, 2);
if (outPath) {
  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`✅ plan.json 생성: ${outPath}`);
} else {
  console.log(output);
}

// ── Summary ──
console.error(`\n📊 생성 요약:`);
console.error(`   섹션: ${sectionName} (${page || '?'})`);
console.error(`   배경: ${bg}`);
console.error(`   요소: ${flatElements.length}개 (text:${flatElements.filter(e=>e.type==='text').length} img:${flatElements.filter(e=>e.type==='image').length} rect:${flatElements.filter(e=>e.type==='rect').length})`);
console.error(`   겹침: ${overlaps.length}쌍`);
console.error(`   이미지 파일: ${availableImages.length}개`);
console.error(`   pt 참고: bgRect=${ptSuggestions.bgRect||'없음'} shape=${ptSuggestions.shape}`);
console.error(`   pb 참고: fromLastContent=${pbSuggestions.fromLastContent||'없음'} effectiveEnd=${pbSuggestions.fromLastContentToEffectiveEnd||'없음'}`);
