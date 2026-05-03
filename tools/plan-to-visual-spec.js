#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (!args[0]) {
  console.error('사용법: node tools/plan-to-visual-spec.js <plan.json> [--out <spec_visual.json>]');
  process.exit(1);
}

function getArg(name) {
  const idx = args.indexOf('--' + name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

const planPath = path.resolve(args[0]);
const outPath = path.resolve(getArg('out') || path.join(path.dirname(planPath), 'spec_visual.json'));
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const projectRoot = path.resolve(__dirname, '..');
const rawSpecPath = plan.rawSpecFile
  ? path.resolve(projectRoot, plan.rawSpecFile)
  : (plan.specFile ? path.resolve(projectRoot, plan.specFile) : null);
const rawSpec = rawSpecPath && fs.existsSync(rawSpecPath)
  ? JSON.parse(fs.readFileSync(rawSpecPath, 'utf8'))
  : null;

const canvas = Number(plan.canvas || 1905);
const sectionTop = Number(plan.sectionY && plan.sectionY.top || 0);
const sectionBottom = Number(plan.effectiveEnd || (plan.sectionY && plan.sectionY.bottom) || sectionTop);
const rawOriginTop = Number(
  plan.visualOriginRawTop !== undefined && plan.visualOriginRawTop !== null
    ? plan.visualOriginRawTop
    : sectionTop
);

function toPx(value, base) {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  if (!str) return 0;
  if (str.endsWith('vw')) return canvas * parseFloat(str) / 100;
  if (str.endsWith('%')) return (base || 0) * parseFloat(str) / 100;
  return parseFloat(str) || 0;
}

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function findRawText(content) {
  if (!rawSpec || !Array.isArray(rawSpec.texts)) return null;
  const norm = normalizeText(content);
  return rawSpec.texts.find(function(item) {
    return normalizeText(item.content || item.name) === norm;
  }) || null;
}

function widthPxOf(el, parentWidth, rawText) {
  if (el.width !== undefined) return toPx(el.width, parentWidth);
  if (rawText && rawText.w) return rawText.w;
  if (el.type === 'image' && el.naturalWidth) return Number(el.naturalWidth);
  if (el.psdW) return Number(el.psdW);
  return parentWidth || 0;
}

function heightPxOf(el, widthPx, rawText, groupHeight) {
  if (el.height !== undefined) return toPx(el.height, widthPx);
  if (el.paddingBottom !== undefined) return toPx(el.paddingBottom, widthPx);
  if (el.aspectRatio) {
    var ratioMatch = String(el.aspectRatio).match(/([\d.]+)\s*\/\s*([\d.]+)/);
    if (ratioMatch) {
      var rw = parseFloat(ratioMatch[1]);
      var rh = parseFloat(ratioMatch[2]);
      if (rw && rh && widthPx) return widthPx * rh / rw;
    }
  }
  if (rawText && rawText.h) {
    const lines = Number(rawText.lineBreaks || 0) + 1;
    const seg = (rawText.segments || [])[0] || {};
    const segFontPx = Number(seg.fontSize_px || 0);
    const segLineHeight = Number(seg.lineHeight || 0);
    const estimated = lines >= 3 && segFontPx && segLineHeight
      ? segFontPx * segLineHeight * lines
      : 0;
    if (estimated && estimated > rawText.h + 5) return estimated;
    return rawText.h;
  }
  if (groupHeight) return groupHeight;
  const naturalW = Number(el.naturalWidth || 0);
  const naturalH = Number(el.naturalHeight || 0);
  if (el.type === 'image' && naturalW && naturalH && widthPx) {
    return widthPx * naturalH / naturalW;
  }
  const psdW = Number(el.psdW || 0);
  const psdH = Number(el.psdH || 0);
  if (psdW && psdH && widthPx) return widthPx * psdH / psdW;
  return 0;
}

function layoutElement(el, parentCtx, out) {
  const rawText = el.type === 'text' ? findRawText(el.content || el.name) : null;
  const widthPx = widthPxOf(el, parentCtx.width, rawText);

  let x = parentCtx.x;
  let y = parentCtx.flowY;

  if (el.position === 'absol') {
    x = parentCtx.x + toPx(el.left, parentCtx.width);
    y = parentCtx.y + toPx(el.top, canvas);
  } else {
    y = parentCtx.flowY + toPx(el.marginTop, canvas);
    if (el.marginLeft !== undefined) {
      x = parentCtx.x + toPx(el.marginLeft, parentCtx.width);
    } else if (
      el.alignSelf === 'center' ||
      parentCtx.centerChildren ||
      parentCtx.alignItems === 'center'
    ) {
      x = parentCtx.x + (parentCtx.width - widthPx) / 2;
    }
    if (rawText) {
      x = rawText.x;
      y = rawText.y - rawOriginTop;
    }
  }

  const groupCtx = {
    x: x,
    y: y,
    width: widthPx,
    flowY: y,
    centerChildren: !!el.centerChildren,
    alignItems: el.alignItems || (el.direction === 'column' && el.centerChildren ? 'center' : '')
  };

  let maxBottom = y;
  let flowBottom = y;
  let hasFlowChild = false;
  (el.children || []).forEach(function(child) {
    const box = layoutElement(child, groupCtx, out);
    if (child.position === 'rltv') {
      groupCtx.flowY = box.bottom;
      flowBottom = box.bottom;
      hasFlowChild = true;
    }
    if (box.bottom > maxBottom) maxBottom = box.bottom;
  });

  const groupHeight = hasFlowChild ? (flowBottom - y) : (maxBottom - y);
  const ownHeight = heightPxOf(el, widthPx, rawText, groupHeight > 0 ? groupHeight : 0);
  const bottom = hasFlowChild ? Math.max(y + ownHeight, flowBottom) : Math.max(y + ownHeight, maxBottom);

  if (el.type === 'text') {
    out.texts.push({
      name: el.name,
      content: el.content || '',
      x: Math.round((rawText ? rawText.x : x) * 1000) / 1000,
      y: Math.round((rawText ? (rawText.y - rawOriginTop) : y) * 1000) / 1000,
      w: Math.round((rawText ? rawText.w : widthPx) * 1000) / 1000,
      h: Math.round(ownHeight * 1000) / 1000,
      segments: el.segments || (rawText ? rawText.segments : []),
      lineBreaks: rawText ? rawText.lineBreaks : undefined
    });
  } else if (el.type === 'image') {
    const file = path.basename(String(el.src || ''));
    out.images.push({
      name: el.name,
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      w: Math.round(widthPx * 1000) / 1000,
      h: Math.round(ownHeight * 1000) / 1000,
      clippingRect: null,
      possibleFile: file,
      effects: el.effects === undefined ? null : el.effects
    });
  } else if (el.type === 'cssShape') {
    out.rects.push({
      name: el.name,
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      w: Math.round(widthPx * 1000) / 1000,
      h: Math.round(ownHeight * 1000) / 1000,
      fill: el.bgColor || '#000000',
      borderRadius: Number(el.borderRadius || 0),
      stroke: null,
      opacity: 1,
      effects: el.effects === undefined ? null : el.effects
    });
  }

  return { x, y, width: widthPx, height: ownHeight, bottom };
}

const visualSpec = {
  section: plan.section,
  canvas: canvas,
  sectionY: {
    top: 0,
    bottom: sectionBottom - sectionTop,
    height: sectionBottom - sectionTop
  },
  background: {
    type: 'color',
    fill: plan.bg || '#ffffff',
    src: null
  },
  groups: [],
  texts: [],
  rects: [],
  images: [],
  comments: [
    'generated from plan.json for replay validation',
    'raw PSD origin shifted to visual section origin'
  ]
};

const rootCtx = {
  x: 0,
  y: 0,
  width: canvas,
  flowY: 0,
  centerChildren: false,
  alignItems: ''
};

(plan.elements || []).forEach(function(el) {
  const box = layoutElement(el, rootCtx, visualSpec);
  if (el.position === 'rltv') rootCtx.flowY = box.bottom;
});

fs.writeFileSync(outPath, JSON.stringify(visualSpec, null, 2) + '\n');
console.log('✅ visual spec 생성:', outPath);
