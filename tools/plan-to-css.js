#!/usr/bin/env node
/**
 * plan-to-css.js — plan.json → CSS 초안 자동 생성
 *
 * Usage: node tools/plan-to-css.js <plan.json> [--out <output.css>]
 *
 * plan.json의 수치를 그대로 CSS로 변환.
 * AI는 이 초안 위에 보정만 하면 됨 (유틸 클래스, 특수 패턴 등).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node plan-to-css.js <plan.json> [--out output.css]');
  process.exit(1);
}

const planPath = args[0];
let outPath = null;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--out' && args[i + 1]) outPath = args[++i];
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const CANVAS = plan.canvas || 1905;

const section = plan.section || 'con??';
const secNum = String(Number(section.replace(/\D/g, '')) || section.replace(/\D/g, ''));
const sectionClass = plan.sectionClass || section;
const lines = [];

function emit(s) { lines.push(s); }
function comment(s) { emit(`/* ${s} */`); }

// ── font-size: var(--size-XX) → vw 직접 출력 ──
function fontSize(seg) {
  if (!seg.fontSize) return null;
  const fsVw = seg.fontSize.split(' ')[0]; // "2.3633vw (45px)"
  return fsVw; // var(--size-XX) 안 씀, vw 직접 출력
}

// ── wrapper 높이 자동 계산: absol children bbox → padding-bottom ──
function calcWrapperHeight(el) {
  if (!el.children || el.children.length === 0) return null;
  // rltv children이 있으면 높이 자동 → 불필요
  if (el.children.some(c => c.position === 'rltv')) return null;
  // 전부 absol → padding-bottom으로 높이 확보 필요
  // _height가 있으면 그걸 사용
  if (el._height) return el._height;
  // psdY 기반: 가장 아래 자식의 bottom - wrapper top
  let maxBot = 0;
  for (const c of el.children) {
    const topVw = parseFloat(c.top) || 0;
    // 이미지면 aspect ratio로 높이 추정
    let hVw = 0;
    if (c.naturalWidth && c.naturalHeight) {
      const wPct = parseFloat(c.width) || 0;
      const parentPx = el.parentWidth || CANVAS;
      const elPx = parentPx * wPct / 100;
      hVw = (elPx * c.naturalHeight / c.naturalWidth) / CANVAS * 100;
    } else {
      // 텍스트/shape → fontSize 기반 추정 (lineHeight * lines)
      hVw = 3; // 최소 높이
    }
    maxBot = Math.max(maxBot, topVw + hVw);
  }
  return maxBot > 0 ? `${maxBot.toFixed(4)}vw` : null;
}

// ── image width: naturalWidth 기준 자동 보정 ──
function imageWidth(el) {
  if (el.naturalWidth && el.parentWidth) {
    return `${(el.naturalWidth / el.parentWidth * 100).toFixed(6)}%`;
  }
  return el.width;
}

// ── colorOverlay → CSS filter ──
function colorOverlayCSS(el) {
  if (!el.colorOverlay) return null;
  const co = el.colorOverlay;
  // opacity 낮으면 단순 opacity 처리
  if (co.opacity && co.opacity < 0.5) {
    return `opacity: ${co.opacity}; filter: brightness(0.3);`;
  }
  // 완전 덮기 → brightness(0) + sepia + hue-rotate 조합 or 단순 opacity
  return `opacity: ${co.opacity || 0.3}; filter: brightness(0.2);`;
}

// ── Section ──
const sectionTitle = section.toUpperCase();
emit(`/* ===== ${sectionTitle}: TODO 섹션명 ===== */`);
emit(`.${sectionClass} {`);
if (plan.bg && plan.bg !== '#ffffff') emit(`    background: ${plan.bg};`);
emit(`    padding-top: ${plan.pt};`);
emit(`    padding-bottom: ${plan.pb};`);
emit(`}`);
emit('');

// ── Elements ──
function processElement(el, depth) {
  const indent = '    ';
  const sel = `.${el.name}`;

  // Comment
  const typeLabel = el.type || '';
  const posLabel = el.position || '';
  comment(`${el.name} (${posLabel} ${typeLabel})`);

  emit(`${sel} {`);

  // Position-specific
  if (el.position === 'rltv') {
    if (el.marginTop && el.marginTop !== '0') emit(`${indent}margin-top: ${el.marginTop};`);
    if (el.alignSelf === 'center' || el.centerSelf === true) {
      emit(`${indent}margin-left: 0.000000%;`);
      emit(`${indent}align-self: center;`);
    } else if (el.marginLeft && parseFloat(el.marginLeft) !== 0) {
      emit(`${indent}margin-left: ${el.marginLeft}; align-self: flex-start;`);
    }
    if (el.width && el.type !== 'text' && el.type !== 'text-only') emit(`${indent}width: ${el.width};`);
    if (el.textAlign === 'center') emit(`${indent}text-align: center;`);
  } else if (el.position === 'absol') {
    if (el.top) emit(`${indent}top: ${el.top};`);
    if (el.left) emit(`${indent}left: ${el.left};`);
    // 이미지면 naturalWidth 기준 width
    if (el.type === 'image' || el.type === 'bgImage') {
      emit(`${indent}width: ${imageWidth(el)};`);
    } else if (el.width && el.type !== 'text' && el.type !== 'text-only') {
      emit(`${indent}width: ${el.width};`);
    }
  }

  // Image
  if (el.type === 'image' || el.type === 'bgImage') {
    if (el.naturalWidth && el.naturalHeight) {
      emit(`${indent}/* ${el.naturalWidth}×${el.naturalHeight} — aspect-ratio: ${el.aspectRatio || el.naturalWidth + ' / ' + el.naturalHeight} */`);
    }
    if (el.type === 'bgImage') {
      emit(`${indent}/* bgimg 패턴 */`);
    }
  }

  // Text segments → font info (vw 직접 출력, var(--size-XX) 안 씀)
  if (el.segments && el.segments.length > 0) {
    const seg = el.segments[0];
    const fsVw = fontSize(seg);
    if (fsVw) {
      emit(`${indent}font-size: ${fsVw}; /* ${seg.fontSize} */`);
    }
    if (seg.letterSpacing && seg.letterSpacing !== '0') emit(`${indent}letter-spacing: ${seg.letterSpacing};`);
    if (seg.lineHeight) emit(`${indent}line-height: ${seg.lineHeight};`);
    if (seg.color) emit(`${indent}color: ${seg.color};`);
    if (seg.fontWeight && seg.fontWeight !== 400) emit(`${indent}font-weight: ${seg.fontWeight};`);
  }

  // Shape properties
  if (el._fill) emit(`${indent}background: ${el._fill};`);
  if (el._opacity && el._opacity < 1) emit(`${indent}opacity: ${el._opacity};`);
  if (el.border) emit(`${indent}border: ${el.border};`);
  if (el.borderRadius && el.borderRadius !== 0) {
    let brVal;
    if (typeof el.borderRadius === 'string') {
      brVal = el.borderRadius;
    } else if (typeof el.borderRadius === 'object') {
      const br = el.borderRadius;
      const tl = br.topLeft || br.all || 0;
      const tr = br.topRight || br.all || 0;
      const bra = br.bottomRight || br.all || 0;
      const bl = br.bottomLeft || br.all || 0;
      if (tl === tr && tr === bra && bra === bl) {
        brVal = `${(tl / CANVAS * 100).toFixed(4)}vw`;
      } else {
        brVal = [tl, tr, bra, bl].map(v => `${(v / CANVAS * 100).toFixed(4)}vw`).join(' ');
      }
    } else {
      brVal = `${(el.borderRadius / CANVAS * 100).toFixed(4)}vw`;
    }
    emit(`${indent}border-radius: ${brVal};`);
  }

  // colorOverlay → CSS filter
  const coCSS = colorOverlayCSS(el);
  if (coCSS) emit(`${indent}${coCSS}`);

  // Effects (shadow) — 완성형 이미지는 이미 shadow 포함이므로 스킵
  if (el.effects && el.effects.length > 0 && el.sourceType !== '완성형') {
    for (const eff of el.effects) {
      if (eff.css) emit(`${indent}box-shadow: ${eff.css};`);
    }
  }

  // Wrapper 높이: absol children만 있으면 padding-bottom 자동 계산
  const wrapH = calcWrapperHeight(el);
  if (wrapH) emit(`${indent}padding-bottom: ${wrapH}; /* absol children 높이 확보 */`);

  // centerChildren → 부모 기준 중앙 정렬
  if (el.centerChildren) {
    const dir = el.flexDirection || 'column';
    emit(`${indent}display: flex;`);
    emit(`${indent}flex-direction: ${dir};`);
    if (dir === 'column') {
      emit(`${indent}align-items: ${el.alignItems || 'center'};`);
    } else {
      emit(`${indent}justify-content: ${el.justifyContent || 'center'};`);
      emit(`${indent}align-items: ${el.alignItems || 'flex-start'};`);
    }
  } else if (el.display === 'flex-row' || el.display === 'flex-column') {
    const dir = el.display === 'flex-row' ? 'row' : 'column';
    emit(`${indent}display: flex;`);
    emit(`${indent}flex-direction: ${dir};`);
    if (dir === 'row') {
      emit(`${indent}align-items: ${el.alignItems || 'flex-start'};`);
    } else {
      emit(`${indent}align-items: ${el.alignItems || 'center'};`);
    }
  } else if (el._flexRow) {
    emit(`${indent}display: flex; flex-direction: row; justify-content: space-between;`);
  }

  emit(`}`);

  // Image inner rule
  if ((el.type === 'image' || el.type === 'bgImage') && el.naturalWidth) {
    emit(`${sel} img { width: 100%; }`);
  }

  emit('');

  // Children
  if (el.children) {
    for (const child of el.children) {
      processElement(child, depth + 1);
    }
  }
}

// Process all elements
for (const el of plan.elements) {
  processElement(el, 0);
}

// ── Output ──
const css = lines.join('\n');

if (outPath) {
  fs.writeFileSync(outPath, css, 'utf8');
  console.log(`✅ CSS 초안 생성: ${outPath}`);
} else {
  console.log(css);
}

// ── Summary ──
const blockCount = (css.match(/\{/g) || []).length;
console.error(`\n📊 CSS 생성 요약:`);
console.error(`   섹션: ${section}`);
console.error(`   CSS 블록: ${blockCount}개`);
console.error(`   클래스: .${sectionClass}`);
