#!/usr/bin/env node
/**
 * auto-css v3 — "한번에 끝내기"
 * spec.json + structure-v3.json → 복붙 가능한 완성 CSS
 *
 * 설계 원칙:
 *   1. structure의 anchor/position 필드가 최우선 (spec 크기 추론보다 우선)
 *   2. 같은 클래스 반복 요소 → 공통 CSS + inline style 가이드
 *   3. bottom:0 바 그룹 → chartBar:true + bottom:0 자동
 *   4. specRef 없고 relatedRefs만 있는 요소 → relatedRefs[0]으로 위치 계산
 *   5. ÷1905 고정, 소수 4자리, 둥근 수 경고
 */

const fs = require('fs');
const path = require('path');
// 이미지 크기 직접 읽기 (PNG/JPEG 헤더)
function getImageSize(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf[0] === 0x89 && buf[1] === 0x50) { // PNG
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (buf[0] === 0xFF && buf[1] === 0xD8) { // JPEG
      let i = 2;
      while (i < buf.length - 8) {
        if (buf[i] === 0xFF) {
          const m = buf[i+1];
          if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8) {
            return { height: buf.readUInt16BE(i+5), width: buf.readUInt16BE(i+7) };
          }
          i += 2 + buf.readUInt16BE(i+2);
        } else { i++; }
      }
    }
  } catch(e) {}
  return null;
}
const CANVAS = 1905;

// 프로젝트 루트 (spec 파일 기준으로 추정)
const PROJECT_ROOT = path.resolve(path.dirname(process.argv[2] || '.'), '..');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('사용법: node tools/auto-css-v3.js <spec.json> <structure-v3.json>');
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(path.resolve(args[0]), 'utf-8'));
const structure = JSON.parse(fs.readFileSync(path.resolve(args[1]), 'utf-8'));

function getSpec(ref) {
  if (!ref) return null;
  const m = ref.match(/^(texts|rects|images)\[(\d+)\]$/);
  if (!m) return null;
  return (spec[m[1]] || [])[parseInt(m[2])] || null;
}

// 섹션 경계
function getSectionBounds() {
  if (structure.bgRef) {
    const bg = getSpec(structure.bgRef);
    if (bg) return { top: bg.y, h: bg.h, w: bg.w, x: bg.x || 0 };
  }
  const bgs = (spec.rects || []).filter(r => r.w > 1900 && r.h > 200 && r.h < 2000);
  if (bgs.length) { bgs.sort((a, b) => a.y - b.y); const r = bgs[0]; return { top: r.y, h: r.h, w: r.w, x: r.x || 0 }; }
  return { top: 0, h: 0, w: CANVAS, x: 0 };
}
const SEC = getSectionBounds();

// 수치 유틸
const vw = px => (px / CANVAS * 100).toFixed(4);
const pctW = (px, pw) => (px / (pw || CANVAS) * 100).toFixed(4);
const minVP = px => `min(${vw(px)}vw, ${px}px)`;
const maxVP = px => `max(${vw(px)}vw, ${px}px)`;

// 출력
const output = [];
let sectionPaddingTop = null;
const warnings = [];

function emit(sel, props, comment) {
  output.push({ sel, props, comment: comment || '' });
}

function warn(msg) { warnings.push(msg); }

// ═══════════════════════════════════════
// 메인 처리
// ═══════════════════════════════════════
function processNode(node, parentSpec, prevSpec) {
  const item = getSpec(node.specRef);
  const sel = '.' + (node.className || node.id).split(' ').join('.');
  const props = {};
  const pY = parentSpec ? parentSpec.y : SEC.top;
  const pX = parentSpec ? parentSpec.x : 0;
  const pW = parentSpec ? parentSpec.w : CANVAS;
  const pH = parentSpec ? parentSpec.h : SEC.h;

  // ───────────────────────────────
  // ABSOLUTE
  // ───────────────────────────────
  if (node.position === 'absolute') {

    // 1) anchor가 명시되어 있으면 그게 최우선
    if (node.anchor === 'cover') {
      props['top'] = '0'; props['left'] = '0';
      props['width'] = '100%'; props['height'] = '100%';

    } else if (node.anchor === 'bottom') {
      props['bottom'] = '0'; props['left'] = '0';
      props['width'] = '100%';

    } else if (node.anchor === 'bottom-right' && item) {
      props['bottom'] = '0'; props['right'] = '0';
      if (item.w && item.w < pW * 0.9) props['width'] = `${pctW(item.w, pW)}%`;

    } else if (node.anchor === 'top-right' && item) {
      props['top'] = '0'; props['right'] = '0';
      if (item.w && item.w < pW * 0.9) props['width'] = `${pctW(item.w, pW)}%`;

    } else if (node.anchor === 'right' && item) {
      const relY = item.y - pY;
      props['top'] = minVP(relY);
      props['right'] = '0';
      if (item.w && item.w < pW * 0.9) props['width'] = `${pctW(item.w, pW)}%`;

    } else if (node.anchor === 'top') {
      props['top'] = '0'; props['left'] = '0';
      props['width'] = '100%';

    } else if (node.chartBar && item) {
      // 2) 차트 바 그룹: bottom:0, left는 bar center %
      props['bottom'] = '0';
      const center = item.x + item.w / 2;
      props['left'] = `${pctW(center, pW)}%`;

    } else if (item) {
      // 3) 일반 absol
      const relY = item.y - pY;
      const relX = item.x - pX;
      // top: 부모 HEIGHT 기준 %가 필요한 경우 (swiper-wrap 내부 등)
      if (node.topAsPercent && pH > 0) {
        props['top'] = `${(relY / pH * 100).toFixed(4)}%`;
      } else {
        props['top'] = minVP(relY);
      }
      props['left'] = `${pctW(relX, pW)}%`;
      if (item.w && item.w < pW * 0.9) {
        props['width'] = `${pctW(item.w, pW)}%`;
      }

    } else if (!item && node.relatedRefs && node.relatedRefs.length > 0) {
      // 4) specRef 없고 relatedRefs만 있는 경우 (deco-dots 등)
      //    relatedRefs 중 첫번째의 좌표로 위치 계산
      const firstRef = getSpec(node.relatedRefs[0]);
      if (firstRef) {
        const relY = firstRef.y - pY;
        const relX = firstRef.x - pX;
        props['top'] = minVP(relY);
        props['left'] = `${pctW(relX, pW)}%`;
      }
    }
  }

  // ───────────────────────────────
  // RELATIVE
  // ───────────────────────────────
  if (node.position === 'relative' && item) {
    // margin-left
    const relX = item.x - pX;
    if (relX > 0) {
      props['margin-left'] = `${pctW(relX, pW)}%`;
    }

    // margin-top (flow 기반)
    if (prevSpec) {
      const gap = item.y - (prevSpec.y + prevSpec.h);
      props['margin-top'] = gap >= 0 ? minVP(gap) : maxVP(gap);
    } else {
      // 첫 rltv → section padding-top
      sectionPaddingTop = minVP(item.y - SEC.top);
    }

    // 텍스트 속성
    if (item.segments && item.segments[0]) {
      const s = item.segments[0];
      props['font-size'] = minVP(s.fontSize_px);
      props['font-weight'] = String(s.fontWeight);
      props['color'] = s.color;
      props['line-height'] = String(s.lineHeight);
      if (s.letterSpacing) props['letter-spacing'] = s.letterSpacing;

      // 둥근 수 경고
      const roundLH = [1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0];
      if (roundLH.includes(s.lineHeight)) {
        warn(`${sel} line-height:${s.lineHeight} 둥근 수 — PSD 원본 재확인`);
      }
    }
  }

  // ───────────────────────────────
  // 공통 속성 (spec item 기반)
  // ───────────────────────────────
  if (item) {
    if (item.borderRadius && !node.imgSrc) {
      props['border-radius'] = `${vw(item.borderRadius)}vw`;
    }
    if (item.fill && typeof item.fill === 'string' && !node.imgSrc && !node.anchor) {
      props['background'] = item.fill;
    }
    if (item.opacity !== undefined && item.opacity !== 1 && !node.anchor) {
      props['opacity'] = String(parseFloat(item.opacity.toFixed(4)));
    }
    if (item.stroke && !node.anchor) {
      props['border'] = `${item.stroke.width}px solid ${item.stroke.color}`;
    }
    if (item.effects && !node.anchor) {
      const shadows = [];
      item.effects.forEach(e => {
        if (e.type === 'strokeEffect') shadows.push(`0 0 0 ${minVP(e.size_px)} ${e.color}`);
        if (e.type === 'dropShadow') {
          const a = (e.angle || 90) * Math.PI / 180;
          const d = e.distance || 0;
          const ox = Math.round(Math.cos(a) * d);
          const oy = Math.round(Math.sin(a) * d);
          const r = parseInt((e.color || '#000000').slice(1, 3), 16);
          const g = parseInt((e.color || '#000000').slice(3, 5), 16);
          const b = parseInt((e.color || '#000000').slice(5, 7), 16);
          shadows.push(`${ox}px ${oy}px ${e.blur || 0}px rgba(${r},${g},${b},${e.opacity || 0.1})`);
        }
      });
      if (shadows.length) props['box-shadow'] = shadows.join(', ');
    }
  }

  // ───────────────────────────────
  // structure 추가 속성
  // ───────────────────────────────
  if (node.zIndex !== undefined) props['z-index'] = String(node.zIndex);
  if (node.overflow) props['overflow'] = node.overflow;
  if (node.display) props['display'] = node.display;
  if (node.flexDirection) props['flex-direction'] = node.flexDirection;
  if (node.alignItems) props['align-items'] = node.alignItems;
  if (node.justifyContent) props['justify-content'] = node.justifyContent;
  if (node.transform) props['transform'] = node.transform;
  if (node.whiteSpace) props['white-space'] = node.whiteSpace;
  if (node.imgSrc) {
    props['display'] = props['display'] || 'flex';

    // ── 이미지 파일 크기 읽기 → 화질 뭉개짐 방지 (렌더링=원본 정확 매칭) ──
    const imgPath = path.join(PROJECT_ROOT, node.imgSrc);
    const dim = getImageSize(imgPath);
    if (dim && item && !node.anchor) {
      const psdW = item.w;
      const psdH = item.h;
      const naturalW = dim.width;
      const naturalH = dim.height;
      const diffW = naturalW - psdW;
      const diffH = naturalH - psdH;
      const ratioW = naturalW / psdW;
      const ratioH = naturalH / psdH;

      if (ratioW > 2 || ratioH > 2) {
        warn(`🚨 ${sel} 이미지 크기 불일치! 실제:${naturalW}×${naturalH} vs PSD:${psdW}×${psdH} (${ratioW.toFixed(1)}배)`);
        warn(`  → PSD spec은 클리핑/크롭된 값일 가능성 높음. 실제 이미지 파일 기준으로 width 계산!`);
      } else if (Math.abs(diffW) > 2 || Math.abs(diffH) > 2) {
        warn(`${sel} shadow padding 감지! 이미지:${naturalW}×${naturalH} vs PSD:${psdW}×${psdH} (차이:${diffW}×${diffH}px)`);
      }

      // 항상 이미지 자연 크기 기준으로 width 출력 (다운스케일 뭉개짐 방지)
      // naturalWidth / 1905 * 100 → 1905px 뷰포트에서 렌더링 = 원본 정확 일치
      const exactPct = (naturalW / CANVAS * 100);
      props['width'] = `${exactPct.toFixed(4)}%`;
      warn(`📐 ${sel} 이미지 자연크기 기준 width: ${naturalW}px / ${CANVAS} = ${exactPct.toFixed(4)}% (렌더링=원본 매칭)`);
    } else if (dim && node.anchor) {
      // anchor 이미지 (cover/bottom/top)는 기존 로직 유지
    } else if (!dim) {
      warn(`⚠️ ${sel} 이미지 파일 읽기 실패: ${imgPath}`);
    }
  }
  // ── cssShape: CSS로 그리는 도형 (divider, bar 등) ──
  // width + height 둘 다 PSD rect에서 가져옴
  if (node.cssShape && item) {
    props['width'] = `${pctW(item.w, pW)}%`;
    props['height'] = minVP(item.h);
    if (item.fill && typeof item.fill === 'string') props['background'] = item.fill;
    if (item.opacity !== undefined && item.opacity !== 1) props['opacity'] = String(parseFloat(item.opacity.toFixed(4)));
    if (item.borderRadius) props['border-radius'] = `${vw(item.borderRadius)}vw`;
  }

  // height: absol이거나 allowHeight 명시된 경우만 (rltv에 height 금지)
  if (node.heightCalc && !node.cssShape) {
    if (node.position === 'absolute' || node.allowHeight) {
      props['height'] = minVP(node.heightCalc);
    } else {
      warn(`${sel} heightCalc 무시됨 — rltv에 height 금지. allowHeight:true 필요.`);
    }
  }
  if (node.heightFromSpec && item && !node.cssShape) {
    if (node.position === 'absolute' || node.allowHeight) {
      props['height'] = minVP(item.h);
    } else {
      warn(`${sel} heightFromSpec 무시됨 — rltv에 height 금지. allowHeight:true 필요.`);
    }
  }

  // padding-bottom: 섹션 높이 마감 (배경 bottom - 이 요소 bottom)
  if (node.sectionPaddingBottom && item) {
    const secBottom = SEC.top + SEC.h;
    const elBottom = item.y + item.h;
    const pb = secBottom - elBottom;
    if (pb > 0) {
      props['padding-bottom'] = minVP(pb);
    }
  }

  // right 배치 (absol이 아닌 rltv에서 margin-right 필요한 경우)
  if (node.marginRight && item) {
    const rightEdge = pX + pW;
    const elRight = item.x + item.w;
    const mr = rightEdge - elRight;
    if (mr > 0) props['margin-right'] = `${pctW(mr, pW)}%`;
  }

  // ───────────────────────────────
  // emit (chartBar 반복 요소는 건너뛰기 — 아래에서 공통+개별로 처리)
  // ───────────────────────────────
  if (!node.chartBar) {
    emit(sel, props, node.note || node.id);
  }

  // ───────────────────────────────
  // 형제 요소 y좌표 겹침 자동 감지
  // ───────────────────────────────
  if (node.children && node.children.length > 1) {
    const childSpecs = node.children
      .filter(c => c.specRef || (c.relatedRefs && c.relatedRefs.length))
      .map(c => {
        const s = getSpec(c.specRef);
        if (s) return { id: c.id || c.className, y: s.y, h: s.h, bottom: s.y + s.h, position: c.position };
        // relatedRefs에서 첫 번째
        if (c.relatedRefs) {
          const r = getSpec(c.relatedRefs[0]);
          if (r) return { id: c.id || c.className, y: r.y, h: r.h, bottom: r.y + r.h, position: c.position };
        }
        return null;
      })
      .filter(Boolean);

    for (let i = 0; i < childSpecs.length; i++) {
      for (let j = i + 1; j < childSpecs.length; j++) {
        const a = childSpecs[i];
        const b = childSpecs[j];
        // y 범위가 겹치는지 확인
        if (a.y < b.bottom && b.y < a.bottom) {
          const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
          if (overlap > 5 && a.position === 'relative' && b.position === 'relative') {
            warn(`🚨 y좌표 겹침! "${a.id}"(y:${a.y}~${a.bottom}) ↔ "${b.id}"(y:${b.y}~${b.bottom}) ${overlap}px 겹침`);
            warn(`  → 둘 다 rltv면 flex 쌓기로 밀림. 하나를 absol로 바꾸거나 부모 안에 넣어야 함.`);
          }
        }
      }
    }
  }

  // ───────────────────────────────
  // 자식 재귀
  // ───────────────────────────────
  if (node.children) {
    let prev = null;
    node.children.forEach(child => {
      const cp = item || { x: pX, y: pY, w: pW, h: pH };
      const ps = prev ? getSpec(prev.specRef) : null;
      processNode(child, cp, ps);
      if (child.position === 'relative' && child.specRef) prev = child;
    });
  }

  // ───────────────────────────────
  // chart: 공통 CSS + 개별 inline guide
  // ───────────────────────────────
  if (node.id === 'chart' && node.children) {
    generateChartCSS(node, pW);
  }

  // ═══════════════════════════════
  // 상태 기반 CSS
  // ═══════════════════════════════

  // 1) Swiper active 효과
  if (node.swiperActive) {
    const sa = node.swiperActive;
    const activeItem = getSpec(sa.activeRef);
    const inactiveItem = getSpec(sa.inactiveRef);
    if (activeItem && inactiveItem) {
      const target = sa.target || '';
      const parentSel = sel;
      const activeSel = `${parentSel} .swiper-slide-active ${target}`.trim();
      const activeProps = {};
      const transforms = [];

      (sa.effects || []).forEach(effect => {
        if (effect === 'translateY') {
          const diff = activeItem.y - inactiveItem.y;
          transforms.push(`translateY(${minVP(diff)})`);
        }
        if (effect === 'translateX') {
          const diff = activeItem.x - inactiveItem.x;
          transforms.push(`translateX(${minVP(diff)})`);
        }
        if (effect === 'scale') {
          const scaleX = activeItem.w / inactiveItem.w;
          const scaleY = activeItem.h / inactiveItem.h;
          if (Math.abs(scaleX - scaleY) < 0.01) {
            transforms.push(`scale(${scaleX.toFixed(4)})`);
          } else {
            transforms.push(`scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`);
          }
        }
        if (effect === 'opacity') {
          const aOp = activeItem.opacity !== undefined ? activeItem.opacity : 1;
          const iOp = inactiveItem.opacity !== undefined ? inactiveItem.opacity : 1;
          if (aOp !== iOp) activeProps['opacity'] = String(aOp);
        }
      });

      if (transforms.length) activeProps['transform'] = transforms.join(' ');

      // transition on target (비active 상태에도 transition 걸어야 부드럽게)
      if (sa.transition) {
        const baseSel = sel + ' ' + target;
        emit(baseSel.trim(), { 'transition': sa.transition }, 'swiper transition (비active에도 적용)');
      }

      emit(activeSel, activeProps, `swiper active: ${(sa.effects||[]).join('+')}`);
    }
  }

  // 1-b) Swiper 슬라이드별 개별 y offset
  if (node.swiperSlideOffsets) {
    const so = node.swiperSlideOffsets;
    const target = so.target || '';
    const slides = (so.slides || []).map(s => ({ ref: s.ref, item: getSpec(s.ref) })).filter(s => s.item);

    if (slides.length > 0) {
      // 최소 y 찾기 (기준점)
      const minY = Math.min(...slides.map(s => s.item.y));

      slides.forEach((s, i) => {
        const offset = s.item.y - minY;
        const nth = `${sel} .swiper-slide:nth-child(${i + 1}) ${target}`.trim();
        if (offset === 0) {
          emit(nth, { 'transform': 'translateY(0)' }, `slide${i + 1} offset:0 (기준점)`);
        } else {
          emit(nth, { 'transform': `translateY(${minVP(offset)})` }, `slide${i + 1} offset:${offset}px`);
        }
      });

      // transition on base target
      if (so.transition) {
        const baseSel = `${sel} .swiper-slide ${target}`.trim();
        emit(baseSel, { 'transition': so.transition }, 'slide offset transition');
      }
    }
  }

  // 2) 탭 active 상태
  if (node.tabStates) {
    const ts = node.tabStates;
    const activeItem = getSpec(ts.activeRef);
    const inactiveItem = getSpec(ts.inactiveRef);
    if (activeItem && inactiveItem) {
      const activeSel = ts.activeSelector || `${sel}.active`;
      const inactiveSel = ts.inactiveSelector || sel;
      const activeProps = {};
      const inactiveProps = {};

      if (activeItem.fill && inactiveItem.fill && activeItem.fill !== inactiveItem.fill) {
        activeProps['background'] = activeItem.fill;
        inactiveProps['background'] = inactiveItem.fill;
      }
      if (activeItem.segments && inactiveItem.segments) {
        const as = activeItem.segments[0];
        const is = inactiveItem.segments[0];
        if (as.color !== is.color) {
          activeProps['color'] = as.color;
          inactiveProps['color'] = is.color;
        }
        if (as.fontWeight !== is.fontWeight) {
          activeProps['font-weight'] = String(as.fontWeight);
          inactiveProps['font-weight'] = String(is.fontWeight);
        }
      }
      if (ts.transition) {
        inactiveProps['transition'] = ts.transition;
      }

      if (Object.keys(inactiveProps).length) emit(inactiveSel, inactiveProps, 'tab 비active');
      emit(activeSel, activeProps, 'tab active');
    }
  }

  // 3) ::before / ::after 가상 요소
  if (node.pseudoBefore) {
    const pb = node.pseudoBefore;
    const pItem = getSpec(pb.specRef);
    const pseudoProps = { 'content': "''", 'position': 'absolute' };
    if (pItem) {
      const relY = pItem.y - pY;
      const relX = pItem.x - pX;
      if (pb.anchor === 'bottom') { pseudoProps['bottom'] = '0'; pseudoProps['left'] = '0'; }
      else if (pb.anchor === 'cover') { pseudoProps['top'] = '0'; pseudoProps['left'] = '0'; pseudoProps['right'] = '0'; pseudoProps['bottom'] = '0'; }
      else { pseudoProps['top'] = minVP(relY); pseudoProps['left'] = `${pctW(relX, pW)}%`; }
      if (pItem.w) pseudoProps['width'] = `${pctW(pItem.w, pW)}%`;
      if (pItem.h) pseudoProps['height'] = minVP(pItem.h);
      if (pItem.fill && typeof pItem.fill === 'string') pseudoProps['background'] = pItem.fill;
      if (pItem.borderRadius) pseudoProps['border-radius'] = `${vw(pItem.borderRadius)}vw`;
      if (pItem.opacity !== undefined && pItem.opacity !== 1) pseudoProps['opacity'] = String(pItem.opacity);
    }
    // 수동 속성 오버라이드
    if (pb.background) pseudoProps['background'] = pb.background;
    if (pb.width) pseudoProps['width'] = pb.width;
    if (pb.height) pseudoProps['height'] = pb.height;
    if (pb.zIndex !== undefined) pseudoProps['z-index'] = String(pb.zIndex);
    emit(`${sel}::before`, pseudoProps, 'pseudo before');
  }

  if (node.pseudoAfter) {
    const pa = node.pseudoAfter;
    const pItem = getSpec(pa.specRef);
    const pseudoProps = { 'content': "''", 'position': 'absolute' };
    if (pItem) {
      const relY = pItem.y - pY;
      const relX = pItem.x - pX;
      if (pa.anchor === 'bottom') { pseudoProps['bottom'] = '0'; pseudoProps['left'] = '0'; }
      else if (pa.anchor === 'cover') { pseudoProps['top'] = '0'; pseudoProps['left'] = '0'; pseudoProps['right'] = '0'; pseudoProps['bottom'] = '0'; }
      else { pseudoProps['top'] = minVP(relY); pseudoProps['left'] = `${pctW(relX, pW)}%`; }
      if (pItem.w) pseudoProps['width'] = `${pctW(pItem.w, pW)}%`;
      if (pItem.h) pseudoProps['height'] = minVP(pItem.h);
      if (pItem.fill && typeof pItem.fill === 'string') pseudoProps['background'] = pItem.fill;
      if (pItem.borderRadius) pseudoProps['border-radius'] = `${vw(pItem.borderRadius)}vw`;
      if (pItem.opacity !== undefined && pItem.opacity !== 1) pseudoProps['opacity'] = String(pItem.opacity);
    }
    if (pa.background) pseudoProps['background'] = pa.background;
    if (pa.width) pseudoProps['width'] = pa.width;
    if (pa.height) pseudoProps['height'] = pa.height;
    if (pa.zIndex !== undefined) pseudoProps['z-index'] = String(pa.zIndex);
    emit(`${sel}::after`, pseudoProps, 'pseudo after');
  }

  // 4) GSAP 초기 상태
  if (node.gsapInit) {
    const gi = node.gsapInit;
    const initProps = {};
    if (gi.opacity !== undefined) initProps['opacity'] = String(gi.opacity);
    if (gi.y) initProps['transform'] = `translateY(${gi.y})`;
    if (gi.x) initProps['transform'] = `translateX(${gi.x})`;
    if (gi.clipPath) initProps['clip-path'] = gi.clipPath;
    emit(sel, initProps, 'GSAP 초기 상태 (JS에서 animate)');
  }

  // 5) Hover 효과
  if (node.hoverEffect) {
    const he = node.hoverEffect;
    const hoverProps = {};
    if (he.opacity !== undefined) hoverProps['opacity'] = String(he.opacity);
    if (he.scale) hoverProps['transform'] = `scale(${he.scale})`;
    if (he.background) hoverProps['background'] = he.background;
    if (he.color) hoverProps['color'] = he.color;
    emit(`${sel}:hover`, hoverProps, 'hover 효과');
    // base에 transition 추가
    if (he.transition) {
      emit(sel, { 'transition': he.transition }, 'hover transition');
    }
  }
}

// ═══════════════════════════════════════
// 차트 바 전용 CSS 생성
// ═══════════════════════════════════════
function generateChartCSS(chartNode, parentW) {
  const bars = chartNode.children.filter(c => c.chartBar);
  if (!bars.length) return;

  // 각 바의 간격 데이터 수집
  const barData = [];
  bars.forEach(bar => {
    const barSpec = getSpec(bar.specRef);
    if (!barSpec) return;
    const refs = (bar.relatedRefs || []).map(r => ({ ref: r, item: getSpec(r) })).filter(x => x.item);
    const texts = refs.filter(x => x.ref.startsWith('texts')).sort((a, b) => a.item.y - b.item.y);
    const dots = refs.filter(x => x.ref.startsWith('rects')).sort((a, b) => a.item.w - b.item.w);

    const d = {
      id: bar.id,
      className: bar.className,
      spec: barSpec,
      center: barSpec.x + barSpec.w / 2,
      texts, dots,
      yearCountGap: null,
      labelDotGap: null,
      dotBarOverlap: null
    };

    if (texts.length >= 2) {
      d.yearCountGap = texts[1].item.y - (texts[0].item.y + texts[0].item.h);
    }
    if (texts.length > 0 && dots.length > 0) {
      const lastT = texts[texts.length - 1];
      d.labelDotGap = dots[0].item.y - (lastT.item.y + lastT.item.h);
    }
    if (dots.length > 0) {
      const overlap = (dots[0].item.y + dots[0].item.h) - barSpec.y;
      if (overlap > 0) d.dotBarOverlap = -overlap;
    }

    barData.push(d);
  });

  // ── 바 그룹 공통 CSS ──
  const commonSel = '.' + (bars[0].className || bars[0].id).split(' ')[0];
  emit(commonSel, {
    'position': 'absolute',
    'bottom': '0',
    'display': 'flex',
    'flex-direction': 'column',
    'align-items': 'center',
    'transform': 'translateX(-50%)'
  }, '바 그룹 공통');

  // ── 바 라인 공통 CSS ──
  // 바 너비: 대부분 동일값 사용, 특수한 것만 override
  const barWidths = barData.map(d => d.spec.w);
  const commonWidth = barWidths.sort((a, b) => barWidths.filter(v => v === a).length - barWidths.filter(v => v === b).length).pop();

  // ── 라벨 gap (year→count) ──
  const ycGaps = barData.map(d => d.yearCountGap).filter(g => g !== null);
  const commonYCGap = ycGaps.length ? ycGaps.sort((a, b) => ycGaps.filter(v => v === a).length - ycGaps.filter(v => v === b).length).pop() : null;

  // ── 라벨→도트 gap ──
  const ldGaps = barData.map(d => d.labelDotGap).filter(g => g !== null);
  const commonLDGap = ldGaps.length ? Math.min(...ldGaps) : null;

  // ── 도트→바 overlap ──
  const dbOverlaps = barData.map(d => d.dotBarOverlap).filter(g => g !== null);
  const commonOverlap = dbOverlaps.length ? dbOverlaps[0] : null;

  // ── count (점포수) 텍스트 CSS ──
  if (barData[0].texts.length >= 2) {
    const countSeg = barData[0].texts[1].item.segments ? barData[0].texts[1].item.segments[0] : null;
    const yearSeg = barData[0].texts[0].item.segments ? barData[0].texts[0].item.segments[0] : null;

    if (yearSeg) {
      emit(`${commonSel} .c6_year`, {
        'font-size': minVP(yearSeg.fontSize_px),
        'font-weight': String(yearSeg.fontWeight),
        'color': yearSeg.color,
        'letter-spacing': yearSeg.letterSpacing || '-0.05em'
      }, 'year 텍스트');
    }

    if (countSeg) {
      const countProps = {
        'font-size': minVP(countSeg.fontSize_px),
        'font-weight': String(countSeg.fontWeight),
        'letter-spacing': countSeg.letterSpacing || '-0.05em'
      };
      if (commonYCGap !== null) {
        countProps['margin-top'] = minVP(commonYCGap);
      }
      emit(`${commonSel} .c6_count`, countProps, `count 텍스트 (year→count gap: ${commonYCGap}px)`);
    }
  }

  // ── 라벨 margin-bottom (label→dot) ──
  if (commonLDGap !== null) {
    emit(`${commonSel} .c6_bar_label`, {
      'display': 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      'margin-bottom': minVP(commonLDGap),
      'white-space': 'nowrap'
    }, `라벨 (label→dot gap: ${commonLDGap}px)`);
  }

  // ── 도트 CSS ──
  if (barData[0].dots.length > 0) {
    const smallDot = barData[0].dots[0];
    const dotProps = {
      'width': minVP(smallDot.item.w),
      'height': minVP(smallDot.item.h),
      'background': smallDot.item.fill || '#043915',
      'border-radius': '50%',
      'position': 'relative',
      'z-index': '2'
    };
    if (commonOverlap !== null) {
      dotProps['margin-bottom'] = maxVP(commonOverlap);
    }
    // stroke effect → box-shadow
    if (smallDot.item.effects) {
      smallDot.item.effects.forEach(e => {
        if (e.type === 'strokeEffect') {
          dotProps['box-shadow'] = `0 0 0 ${minVP(e.size_px)} ${e.color}`;
        }
      });
    }
    emit(`${commonSel} .c6_dot_point`, dotProps, `도트 (overlap: ${commonOverlap}px)`);
  }

  // ── 바 라인 CSS ──
  emit(`${commonSel} .c6_bar`, {
    'width': '1px',
    'background': '#ffffff'
  }, '바 세로선');

  // ── 특수 바 override (2024 등) ──
  barData.forEach(d => {
    if (d.labelDotGap !== commonLDGap && d.labelDotGap !== null) {
      const specialSel = '.' + (d.className || d.id).split(' ').join('.');
      emit(`${specialSel} .c6_bar_label`, {
        'margin-bottom': minVP(d.labelDotGap)
      }, `${d.id} 특수 label→dot gap: ${d.labelDotGap}px`);
    }
    if (d.dotBarOverlap !== commonOverlap && d.dotBarOverlap !== null) {
      const specialSel = '.' + (d.className || d.id).split(' ').join('.');
      emit(`${specialSel} .c6_dot_point`, {
        'margin-bottom': maxVP(d.dotBarOverlap)
      }, `${d.id} 특수 dot overlap: ${d.dotBarOverlap}px`);
    }
  });

  // ── 2024 대형 도트 CSS (3중 원) ──
  barData.forEach(d => {
    const largeDots = d.dots.filter(dot => dot.item.w > 30);
    if (largeDots.length > 0) {
      const specialSel = '.' + (d.className || d.id).split(' ').join('.');
      const outer = largeDots[largeDots.length - 1]; // 가장 큰 것
      emit(`${specialSel} .c6_dot_large`, {
        'width': minVP(outer.item.w),
        'height': minVP(outer.item.h),
        'position': 'relative',
        'display': 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'background': 'none',
        'box-shadow': 'none',
        'margin-bottom': d.dotBarOverlap !== null ? maxVP(d.dotBarOverlap) : '0'
      }, `${d.id} 대형 도트 컨테이너`);

      // 각 링
      largeDots.sort((a, b) => b.item.w - a.item.w).forEach((ring, i) => {
        const suffix = i === 0 ? '::before' : `.c6_dot_ring${i}`;
        const ringProps = {
          'position': 'absolute',
          'width': i === 0 ? '100%' : minVP(ring.item.w),
          'height': i === 0 ? '100%' : minVP(ring.item.h),
          'background': ring.item.fill || '#043915',
          'border-radius': '50%',
          'opacity': String(parseFloat(ring.item.opacity.toFixed(4)))
        };
        if (i === 0) ringProps['content'] = "''";
        emit(`${specialSel} .c6_dot_large${suffix}`, ringProps, `ring${i + 1} ${ring.item.w}×${ring.item.h}`);
      });
    }
  });

  // ── 뱃지 CSS ──
  barData.forEach(d => {
    const badges = d.dots.filter(dot => dot.ref.startsWith('rects') && dot.item.borderRadius > 0 && dot.item.w > 100);
    const badgeRects = (d.relatedRefs || []).map(r => ({ ref: r, item: getSpec(r) })).filter(x => x.item && x.item.borderRadius > 0 && x.item.w > 100);
    if (badgeRects.length > 0) {
      const badge = badgeRects[0];
      const specialSel = '.' + (d.className || d.id).split(' ').join('.');
      emit(`${specialSel} .c6_badge`, {
        'width': minVP(badge.item.w),
        'display': 'flex',
        'margin-bottom': minVP(10)
      }, `${d.id} 뱃지 ${badge.item.w}×${badge.item.h}`);
    }
  });

  // ── 개별 바 inline style 가이드 ──
  console.log('\n/* ═══ 바 개별값 (HTML inline style) ═══ */');
  barData.forEach(d => {
    const center = d.spec.x + d.spec.w / 2;
    console.log(`/* ${d.id}: style="left:${pctW(center, parentW)}%"  bar height:${minVP(d.spec.h)} */`);
  });

  // ── deco dots 상세 (relatedRefs 기반) ──
  // 이건 chart 밖이므로 여기서 안 함
}

// ═══════════════════════════════════════
// 실행
// ═══════════════════════════════════════
console.log('/*');
console.log(` * auto-css v3 — ${structure.section}`);
console.log(` * spec: ${path.basename(args[0])}`);
console.log(` * section top:${SEC.top} h:${SEC.h} canvas:${CANVAS}`);
console.log(' */\n');

// children 처리
if (structure.children) {
  // ── 최상위 children y좌표 겹침 감지 ──
  const topSpecs = structure.children
    .filter(c => c.specRef || (c.relatedRefs && c.relatedRefs.length))
    .map(c => {
      const s = getSpec(c.specRef);
      if (s) return { id: c.id || c.className, y: s.y, h: s.h, bottom: s.y + s.h, position: c.position };
      if (c.relatedRefs) {
        const r = getSpec(c.relatedRefs[0]);
        if (r) return { id: c.id || c.className, y: r.y, h: r.h, bottom: r.y + r.h, position: c.position };
      }
      return null;
    })
    .filter(Boolean);

  for (let i = 0; i < topSpecs.length; i++) {
    for (let j = i + 1; j < topSpecs.length; j++) {
      const a = topSpecs[i];
      const b = topSpecs[j];
      if (a.y < b.bottom && b.y < a.bottom) {
        const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
        if (overlap > 5 && a.position === 'relative' && b.position === 'relative') {
          warn(`🚨 y좌표 겹침! "${a.id}"(y:${a.y}~${a.bottom}) ↔ "${b.id}"(y:${b.y}~${b.bottom}) ${overlap}px 겹침`);
          warn(`  → 둘 다 rltv면 flex 쌓기로 밀림. 하나를 absol로 바꾸거나 부모 안에 넣어야 함.`);
        }
      }
    }
  }

  let prev = null;
  structure.children.forEach(child => {
    const ps = prev ? getSpec(prev.specRef) : null;
    processNode(child, null, ps);
    if (child.position === 'relative' && child.specRef) prev = child;
  });
}

// 섹션 CSS
const secProps = { 'max-width': '1905px', 'margin-left': 'auto', 'margin-right': 'auto' };
if (structure.overflow) secProps['overflow'] = structure.overflow;
if (sectionPaddingTop) secProps['padding-top'] = sectionPaddingTop;

// 출력
console.log(`.${structure.className} {`);
Object.entries(secProps).forEach(([k, v]) => console.log(`    ${k}: ${v};`));
console.log('}\n');

output.forEach(block => {
  console.log(`/* ${block.comment} */`);
  console.log(`${block.sel} {`);
  Object.entries(block.props).forEach(([k, v]) => console.log(`    ${k}: ${v};`));
  console.log('}\n');
});

// 이미지 규칙
output.forEach(block => {
  if (block.props['display'] === 'flex' && (block.sel.includes('bg') || block.sel.includes('photo'))) {
    console.log(`${block.sel} img { width: 100%!important; }\n`);
  }
});

// 텍스트 세그먼트
console.log('/* ═══ 텍스트 세그먼트 (span) ═══ */');
structure.children && structure.children.forEach(node => {
  const item = getSpec(node.specRef);
  if (item && item.segments && item.segments.length > 1) {
    console.log(`/* ${node.className || node.id}: */`);
    item.segments.forEach((s, i) => {
      const txt = s.text.substring(0, 30).replace(/\n/g, '\\n');
      console.log(`/*   [${i}] "${txt}" → ${s.fontWeight}, ${s.color} */`);
    });
  }
});

// deco-dots 상세
structure.children && structure.children.forEach(node => {
  if (node.relatedRefs && !node.specRef && node.relatedRefs[0] && node.relatedRefs[0].startsWith('rects')) {
    const dots = node.relatedRefs.map(r => getSpec(r)).filter(Boolean);
    if (dots.length > 1) {
      console.log(`\n/* ═══ ${node.className || node.id} 개별 도트 ═══ */`);
      const gaps = [];
      for (let i = 1; i < dots.length; i++) {
        gaps.push(dots[i].x - (dots[i - 1].x + dots[i - 1].w));
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      console.log(`/* dots: ${dots.length}개, 크기:${dots[0].w}×${dots[0].h}, gap:${gaps.join('/')}px (avg:${avgGap.toFixed(1)}px → ${vw(avgGap)}vw) */`);
      console.log(`.${(node.className || node.id).split(' ')[0]} { gap: ${minVP(Math.round(avgGap))}; }`);
      console.log(`.${(node.className || node.id).split(' ')[0]} span {`);
      console.log(`    width: ${minVP(dots[0].w)};`);
      console.log(`    height: ${minVP(dots[0].h)};`);
      console.log(`    background: ${dots[0].fill || '#043915'};`);
      console.log(`    border-radius: 50%;`);
      console.log('}');
    }
  }
});

// 경고
if (warnings.length) {
  console.log('\n/* ═══ 경고 ═══ */');
  warnings.forEach(w => console.log(`/* ⚠️ ${w} */`));
}

// 검증 명령어
console.log(`\n/* ═══ 검증 ═══ */`);
console.log(`/* node tools/position-checker.js ${path.basename(args[0])} <URL> .${structure.className} */`);
console.log(`\n/* 완료: ${output.length}개 CSS 블록 */`);
