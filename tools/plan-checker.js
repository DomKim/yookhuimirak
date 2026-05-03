#!/usr/bin/env node
/**
 * plan-checker.js — 플랜 사전 검증 (코딩 전 가두리)
 *
 * 사용법:
 *   node tools/plan-checker.js <plan.json>
 *
 * plan.json 스키마:
 *   section, bg, pt, pb, heightChain[], elements[], doNot[]
 *   각 element: name, position(rltv/absol), parent, parentWidth(px),
 *               위치값(vw/%), width, 타입별 필수필드
 *
 * 🟢 PLAN APPROVED → 코딩 시작 허용
 * 🔴 PLAN REJECTED → 누락 항목 수정 후 재실행
 */

const fs = require('fs');
const path = require('path');

// con06/con6/6 → 동일 취급
function normSec(n) {
  var d = String(n).replace(/\D/g, '');
  return d ? d.replace(/^0+/, '') || '0' : String(n).toLowerCase();
}

const planPath = process.argv[2];
if (!planPath || !fs.existsSync(planPath)) {
  console.error('사용법: node tools/plan-checker.js <plan.json>');
  process.exit(1);
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const errors = [];
const warns = [];
const CANVAS = plan.canvas || 1905;
let autoPlan = null;
const autoPlanPath = path.join(path.dirname(planPath), 'plan.auto.json');
if (path.basename(planPath) !== 'plan.auto.json' && fs.existsSync(autoPlanPath)) {
  try {
    autoPlan = JSON.parse(fs.readFileSync(autoPlanPath, 'utf8'));
  } catch (_) {}
}

// ── 유틸 ──
function parseNum(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v);
  return NaN;
}

function normalizePlanSegment(seg) {
  var out = Object.assign({}, seg || {});
  if (!out.fontSize) {
    if (out.fontSize_px) {
      out.fontSize = ((parseNum(out.fontSize_px) / CANVAS) * 100).toFixed(6) + 'vw (' + out.fontSize_px + 'px)';
    } else if (out.fontSize_vw) {
      var fsVw = parseNum(out.fontSize_vw);
      if (!isNaN(fsVw)) out.fontSize = fsVw.toFixed(6) + 'vw';
    }
  }
  return out;
}

function isRoundNumber(v) {
  var n = parseNum(v);
  if (isNaN(n)) return false;
  // 정수이거나 소수점 1자리까지만 (5, 10, 2.5 등)
  return n === Math.round(n) || n === Math.round(n * 10) / 10;
}

function hasEstimation(v) {
  if (typeof v !== 'string') return false;
  return /[~약대충정도]/.test(v);
}

function collectAllElements(list) {
  const out = [];
  function visit(el) {
    if (!el) return;
    out.push(el);
    if (Array.isArray(el.children)) el.children.forEach(visit);
  }
  (list || []).forEach(visit);
  return out;
}

function hexToRgb(hex) {
  var m = String(hex || '').match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  var n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function colorDistance(a, b) {
  var ra = hexToRgb(a), rb = hexToRgb(b);
  if (!ra || !rb) return 999;
  return Math.sqrt(Math.pow(ra.r - rb.r, 2) + Math.pow(ra.g - rb.g, 2) + Math.pow(ra.b - rb.b, 2));
}

function normalizeTextValue(v) {
  return String(v || '')
    .replace(/\s+/g, '')
    .replace(/[“”"'`]/g, '')
    .trim();
}

function lineSignature(v) {
  return String(v || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(function(line) { return normalizeTextValue(line); });
}

// ── 1. 섹션 기본 필드 ──
const requiredTop = ['section', 'bg', 'pt', 'pb', 'heightChain', 'elements'];
for (const field of requiredTop) {
  if (plan[field] === undefined || plan[field] === null || plan[field] === '') {
    errors.push('최상위 필드 누락: ' + field);
  }
}

// pt, pb 값 검증
['pt', 'pb'].forEach(function(field) {
  if (plan[field] !== undefined) {
    if (hasEstimation(String(plan[field]))) {
      errors.push(field + ' 추정값 금지: "' + plan[field] + '"');
    }
    var n = parseNum(plan[field]);
    if (!isNaN(n) && n > 0 && isRoundNumber(n) && n !== 0) {
      errors.push(field + ' 둥근 수 의심: ' + plan[field] + ' — PSD 정확값 확인 필수');
    }
    // vw 값이 1 미만이면 ×100 누락 의심 (단, 실제로 작은 값일 수 있으므로 warning)
    if (!isNaN(n) && n > 0 && n < 1) {
      warns.push(field + ' 값이 1vw 미만 (' + plan[field] + ') — ÷1905 후 ×100 누락?');
    }
  }
});

// ── 1.5. prevSectionBottom 기반 pt 역산 검증 ──
if (!plan.prevSectionBottom && plan.prevSectionBottom !== 0) {
  errors.push('prevSectionBottom 누락 (이전 섹션 마지막 콘텐츠 PSD y좌표 필수)');
}
if (!plan.firstRltvY && plan.firstRltvY !== 0) {
  errors.push('firstRltvY 누락 (이 섹션 첫 rltv 콘텐츠 PSD y좌표 필수)');
}
if (plan.prevSectionBottom !== undefined && plan.firstRltvY !== undefined && plan.pt) {
  var expectedPt = (plan.firstRltvY - plan.prevSectionBottom) / CANVAS * 100;
  var actualPt = parseNum(plan.pt);
  if (!isNaN(expectedPt) && !isNaN(actualPt) && Math.abs(expectedPt - actualPt) > 0.5) {
    // bgRect 기반 pt는 prevSectionBottom 역산과 다를 수 있음 → warning으로 완화
    if (actualPt >= 2 && actualPt <= 20) {
      warns.push('pt 역산 차이: shape 기반 ' + expectedPt.toFixed(1) + 'vw vs plan ' + actualPt.toFixed(1) + 'vw (bgRect 기반일 수 있음)');
    } else {
      errors.push('pt 역산 불일치: firstRltvY(' + plan.firstRltvY + ') - prevSectionBottom(' + plan.prevSectionBottom + ') = ' + expectedPt.toFixed(4) + 'vw ≠ plan pt ' + actualPt.toFixed(4) + 'vw');
    }
  }
}

// ── 1.6. absol top 기준점 검증 ──
// absol top은 CSS section padding-box 기준이다.
// 과거에는 CSS section top을 prevSectionBottom으로만 봤지만, 공유 배경/overlap 섹션처럼
// PSD sectionY.top이 따로 존재하는 경우도 있다. 두 기준 중 plan top과 맞는 쪽을 허용한다.
if (plan.prevSectionBottom !== undefined && Array.isArray(plan.elements)) {
  var cssSecTop = plan.prevSectionBottom;
  var psdSecTop = plan.sectionY && plan.sectionY.top !== undefined ? plan.sectionY.top : cssSecTop;
  plan.elements.forEach(function checkAbsolTop(el) {
    if (el.position === 'absol' && el.psdY !== undefined && el.top && el.parent === 'section') {
      // bgImage: PSD 레이어가 섹션 범위 밖이면 (전체 페이지 gradient 등)
      // raw psdY 대신 섹션 범위로 클램핑하여 검증
      var effectivePsdY = el.psdY;
      if (el.type === 'bgImage' && el.psdY < cssSecTop) {
        // PSD 레이어가 섹션 위로 확장 → 내보낸 이미지는 섹션 top부터 시작
        // 섹션 하단 정렬이 필요할 수 있으므로 naturalHeight 기반으로 검증
        if (el.naturalHeight) {
          var ptVw = parseNum(plan.pt);
          var pbVw = parseNum(plan.pb);
          if (!isNaN(ptVw) && !isNaN(pbVw)) {
            // 대략적 섹션 높이 = (ptVw + pbVw + 중간요소) * canvas / 100
            // → 정확한 섹션 높이는 렌더링 후 알 수 있으므로, 이미지가 섹션보다 짧으면 하단 정렬 가능성 경고
            var imgH = el.naturalHeight;
            warns.push('[' + el.name + '] bgImage psdY(' + el.psdY + ')가 섹션 top(' + cssSecTop + ') 위에 있음 — 내보낸 이미지 기준으로 top 설정 필요 (섹션 하단 정렬: top = (섹션높이 - ' + imgH + ') / ' + CANVAS + ')');
          }
        }
        // bgImage with psdY outside section: top 자동검증 스킵 (수동 배치)
      } else {
        var expectedTopPrev = (effectivePsdY - cssSecTop) / CANVAS * 100;
        var expectedTopSection = (effectivePsdY - psdSecTop) / CANVAS * 100;
        var actualTop = parseNum(el.top);
        var matchesPrev = !isNaN(expectedTopPrev) && !isNaN(actualTop) && Math.abs(expectedTopPrev - actualTop) <= 1;
        var matchesSection = !isNaN(expectedTopSection) && !isNaN(actualTop) && Math.abs(expectedTopSection - actualTop) <= 1;
        if (!matchesPrev && !matchesSection) {
          errors.push('[' + el.name + '] absol top 기준점 불일치: psdY(' + el.psdY + ') 기준 prevSecBottom=' + expectedTopPrev.toFixed(4) + 'vw, sectionY.top=' + expectedTopSection.toFixed(4) + 'vw, plan=' + actualTop.toFixed(4) + 'vw — 기준점 선택 재확인');
        }
      }
    }
    if (Array.isArray(el.children)) el.children.forEach(checkAbsolTop);
  });
}

// ── 1.7. effectiveEnd 기반 section bottom/pb sanity check ──
// 레이어 max bottom이 smoke/background overhang 때문에 커진 경우를 pb로 흡수하면
// 섹션이 과도하게 길어지고 모바일 비용이 폭증한다.
if (plan.effectiveEnd !== undefined && plan.sectionY && plan.sectionY.bottom !== undefined) {
  var endDelta = Math.abs(parseNum(plan.sectionY.bottom) - parseNum(plan.effectiveEnd));
  if (!isNaN(endDelta) && endDelta > 200) {
    var effectiveMsg = 'sectionY.bottom(' + plan.sectionY.bottom + ')과 effectiveEnd(' + plan.effectiveEnd + ') 차이 ' + endDelta.toFixed(0) + 'px — smoke/background overhang 가능. pb/section height는 effectiveEnd 기준 우선 검토하고, sectionY.bottom 사용 시 sectionBottomReason 명시';
    if (!plan.sectionBottomReason) {
      if (plan.strictStructure === true) errors.push(effectiveMsg);
      else warns.push(effectiveMsg);
    }
  }
}

// ── 1.8. auto plan 핵심 힌트 보존 검증 ──
// workflow상 final plan.json은 spec-to-plan plan.auto.json을 바탕으로 다듬는 구조다.
// 그래서 auto plan의 고신뢰 힌트를 final plan에서 통째로 지우면 초반 실수를 다시 반복하게 된다.
if (autoPlan) {
  if (Array.isArray(autoPlan.requiredTextHints) && autoPlan.requiredTextHints.length > 0 &&
      (!Array.isArray(plan.requiredTextHints) || plan.requiredTextHints.length === 0)) {
    errors.push('plan.auto.json의 requiredTextHints가 final plan에서 누락됨 — 유의미한 PSD 텍스트 누락 방지 힌트는 유지해야 함');
  }
  if (Array.isArray(autoPlan.requiredTextHints) && autoPlan.requiredTextHints.length > 0 &&
      Array.isArray(plan.requiredTextHints) && plan.requiredTextHints.length > 0) {
    var finalTextHintKeys = new Set(plan.requiredTextHints.map(function(h) {
      if (!h) return '';
      if (h.name) return 'name:' + String(h.name);
      return 'text:' + normalizeTextValue(h.content || h.text || '');
    }).filter(Boolean));
    var droppedAutoTextHints = autoPlan.requiredTextHints.filter(function(h) {
      if (!h) return false;
      var byName = h.name ? 'name:' + String(h.name) : '';
      var byText = 'text:' + normalizeTextValue(h.content || h.text || '');
      return !(byName && finalTextHintKeys.has(byName)) && !(byText && finalTextHintKeys.has(byText));
    });
    if (droppedAutoTextHints.length > 0) {
      errors.push('plan.auto.json의 requiredTextHints 중 ' + droppedAutoTextHints.length + '개가 final plan에서 빠짐: ' + droppedAutoTextHints.slice(0, 6).map(function(h) { return h.name || (h.content || '').slice(0, 18); }).join(', ') + ' — auto hint를 삭제하지 말고 유지하거나 ignoredTexts에 reason 명시');
    }
  }
  if (Array.isArray(autoPlan.requiredShapeHints) && autoPlan.requiredShapeHints.length > 0 &&
      (!Array.isArray(plan.requiredShapeHints) || plan.requiredShapeHints.length === 0)) {
    errors.push('plan.auto.json의 requiredShapeHints가 final plan에서 누락됨 — 라인/shape 힌트는 유지해야 함');
  }
  if (Array.isArray(autoPlan.requiredShapeHints) && autoPlan.requiredShapeHints.length > 0 &&
      Array.isArray(plan.requiredShapeHints) && plan.requiredShapeHints.length > 0) {
    var finalShapeNames = new Set(plan.requiredShapeHints.map(function(h) { return h && h.name; }).filter(Boolean));
    var droppedAutoShapes = autoPlan.requiredShapeHints.filter(function(h) { return h && h.name && !finalShapeNames.has(h.name); });
    if (droppedAutoShapes.length > 0) {
      errors.push('plan.auto.json의 requiredShapeHints 중 ' + droppedAutoShapes.length + '개가 final plan에서 빠짐: ' + droppedAutoShapes.slice(0, 6).map(function(h) { return h.name; }).join(', ') + ' — auto hint를 삭제하지 말고 유지하거나 ignoredShapes에 reason 명시');
    }
  }
  if (Array.isArray(autoPlan.stackCardHints) && autoPlan.stackCardHints.length > 0 &&
      (!Array.isArray(plan.stackCardHints) || plan.stackCardHints.length === 0)) {
    warns.push('plan.auto.json의 stackCardHints가 final plan에서 누락됨 — 카드 스택 archetype 힌트를 유지하면 초기 구조 실수를 줄일 수 있음');
  }
  if (Array.isArray(autoPlan.stackCardHints) && autoPlan.stackCardHints.length > 0 &&
      Array.isArray(plan.stackCardHints) && plan.stackCardHints.length > 0) {
    var autoCardCount = Math.max.apply(null, autoPlan.stackCardHints.map(function(h) {
      return Array.isArray(h.cards) ? h.cards.length : (Array.isArray(h.panelRects) ? h.panelRects.length : 0);
    }));
    var finalCardCount = Math.max.apply(null, plan.stackCardHints.map(function(h) {
      return Array.isArray(h.cards) ? h.cards.length : (Array.isArray(h.panelRects) ? h.panelRects.length : 0);
    }));
    if (autoCardCount > finalCardCount) {
      warns.push('plan.auto.json stackCardHints card count(' + autoCardCount + ')보다 final plan card count(' + finalCardCount + ')가 작음 — stack archetype 정보가 약해졌을 수 있음');
    }
  }
  if (Array.isArray(autoPlan.manualDataHints) && autoPlan.manualDataHints.length > 0 &&
      (!Array.isArray(plan.manualDataHints) || plan.manualDataHints.length === 0)) {
    warns.push('plan.auto.json의 manualDataHints가 final plan에서 누락됨 — smart-object row/template 구간은 수동 데이터 필요 가능성을 plan에 남기는 편이 안전함');
  }
}

// ── 2. heightChain 검증 ──
if (Array.isArray(plan.heightChain)) {
  if (plan.heightChain[0] !== 'pt') {
    errors.push('heightChain 첫 항목은 "pt"여야 함');
  }
  if (plan.heightChain[plan.heightChain.length - 1] !== 'pb') {
    errors.push('heightChain 마지막 항목은 "pb"여야 함');
  }
  var flatHeightChainEls = [];
  function collectHeightChainEls(el) {
    if (!el || !el.name) return;
    flatHeightChainEls.push(el);
    if (Array.isArray(el.children)) el.children.forEach(collectHeightChainEls);
  }
  (plan.elements || []).forEach(collectHeightChainEls);
  var heightChainElByName = {};
  flatHeightChainEls.forEach(function(el) { heightChainElByName[el.name] = el; });
  var elementNames = flatHeightChainEls.map(function(e) { return e.name; });
  for (var i = 0; i < plan.heightChain.length; i++) {
    var item = plan.heightChain[i];
    if (item === 'pt' || item === 'pb') continue;
    if (!elementNames.includes(item)) {
      errors.push('heightChain의 "' + item + '"이 elements에 없음');
      continue;
    }
    var hcEl = heightChainElByName[item];
    var hcChildren = flatHeightChainEls.filter(function(ch) { return ch.parent === item; });
    var hasIntrinsicHeight =
      hcEl.type === 'text' ||
      hcEl.type === 'text-only' ||
      hcEl.type === 'image' ||
      !!hcEl.aspectRatio ||
      !!hcEl.heightSource ||
      !!hcEl.naturalHeight ||
      !!hcEl.paddingBottom ||
      !!hcEl.background ||
      !!hcEl.fill;
    var hasFlowChild = hcChildren.some(function(ch) { return ch.position === 'rltv'; });
    var allChildrenAbsolute = hcChildren.length > 0 && hcChildren.every(function(ch) { return ch.position === 'absol'; });
    if (hcEl.position === 'rltv' && allChildrenAbsolute && !hasIntrinsicHeight && !hasFlowChild) {
      // height-faking hard-fail: 항상 FAIL (strictStructure 무관)
      errors.push('heightChain의 "' + item + '"은 rltv지만 실제 높이 근거(aspectRatio/heightSource/rltv child/image)가 없고 absol 자식만 있음 — flat absolute stage 금지. 실제 height-chain wrapper 로 만들 것');
    }
    if (hcEl.position === 'rltv' && hcEl.aspectRatio && allChildrenAbsolute && !hasFlowChild) {
      var nonDecoAbsChildren = hcChildren.filter(function(ch) {
        if (ch.role && /background|deco|ornament/i.test(ch.role)) return false;
        if (/(bg|background|smoke|deco|gold|dust|particle)/i.test(ch.name || '')) return false;
        return true;
      });
      if (nonDecoAbsChildren.length >= 3 && !hcEl.allowSingleSceneOverlayReason) {
        // height-faking hard-fail: 항상 FAIL
        errors.push('heightChain의 "' + item + '"은 aspect-ratio scene이지만 내용 요소 ' + nonDecoAbsChildren.length + '개가 전부 absol임 — 텍스트/중앙스택/주요 이미지는 rltv nested height-chain으로 분리하거나 allowSingleSceneOverlayReason 명시');
      }
    }
  }
} else if (plan.heightChain !== undefined) {
  errors.push('heightChain은 배열이어야 함');
}

// ── 2.5 height-faking hard-fail (strictStructure 무관 항상 강제) ──
//   stage/scene/wrap/inner/area/content/frame/holder/box/container/field 같은
//   흐름성 wrapper 이름에 aspectRatio 또는 height 를 박제하는 것을 차단한다.
//   panel/card 처럼 정말 시각 박스인 경우만 heightSource + heightSourceReason 을
//   명시하면 통과시킨다.
(function checkHeightFakingHardFail() {
  if (!Array.isArray(plan.elements)) return;
  var GENERIC_WRAPPER = /^(?:stage|scene|wrap|wrapper|inner|area|content|frame|holder|box|container|field|spacer|gap|gutter|space|filler|placeholder)$/i;
  var WRAPPER_SUFFIX  = /(?:^|[_-])(?:stage|scene|wrap|wrapper|inner|area|content|frame|holder|box|container|field|spacer|gap|gutter|space|filler|placeholder)(?:[_-]\d+)?$/i;
  var ALLOW_NAMES     = /(?:^|[_-])(?:panel|card|media|video|swiper|cssShape|shape|figure|hero|cover_img|panel_img|card_img)(?:[_-]\d+)?$/i;
  var SPACER_NAMES    = /(?:^|[_-])(?:spacer|gap|gutter|space|filler|placeholder|pb|pt)(?:[_-]\d+)?$/i;

  function walk(el) {
    if (!el || !el.name) {
      if (Array.isArray(el && el.children)) el.children.forEach(walk);
      return;
    }
    var name = String(el.name);
    var isAspectSet = !!el.aspectRatio;
    var hasExplicitHeight = !!(el.height || el.cssHeight || el.fixedHeight);
    var hasReason = !!(el.heightSource && el.heightSourceReason);
    var isGenericWrapper = GENERIC_WRAPPER.test(name) || WRAPPER_SUFFIX.test(name);
    var isAllowedShape   = ALLOW_NAMES.test(name);

    // (a) aspectRatio 가 박혀 있는데 wrapper 이름 + heightSource 근거 없음 → FAIL
    if (isAspectSet && isGenericWrapper && !isAllowedShape && !hasReason) {
      errors.push('[' + name + '] aspectRatio 박제 — stage/scene/wrap/inner 류 wrapper 에 높이 위조 금지. panel/card 면 heightSource + heightSourceReason 명시, 아니면 rltv heightChain 으로 분리');
    }
    // (b) 명시적 height 가 박혀 있는데 wrapper 이름 + 근거 없음 → FAIL
    if (hasExplicitHeight && isGenericWrapper && !isAllowedShape && !hasReason) {
      errors.push('[' + name + '] height 박제 — wrapper 에 임의 높이 금지. mt 누적 + pb 로 섹션 높이 만들 것');
    }
    // (c) spacer/gap/filler 류 element 자체 금지 — 이름 기반 항상 차단
    if (SPACER_NAMES.test(name)) {
      var hasContent = !!(el.segments || el.src);
      var hasReason  = !!(el.heightSource && el.heightSourceReason);
      if (!hasContent && !hasReason) {
        errors.push('[' + name + '] spacer/gap/filler/pb/pt 류 element 금지 — 빈 div 로 높이 메우는 행위. 형제 mt 또는 부모 padding 으로 처리');
      }
    }
    // (d) section 자체에 aspectRatio 또는 height 명시 금지
    if (name === 'section' && (isAspectSet || hasExplicitHeight)) {
      errors.push('[section] section 태그에 aspectRatio/height 박제 금지 — section 은 흐름 컨테이너로 두고 내부 wrapper 와 heightChain 으로 높이 만들 것');
    }
    if (Array.isArray(el.children)) el.children.forEach(walk);
  }
  plan.elements.forEach(walk);
})();

// ── 3. parentWidth 맵 구축 (부모 대비 검증용) ──
var parentWidthMap = {};
parentWidthMap['section'] = CANVAS;
parentWidthMap['canvas'] = CANVAS;
if (Array.isArray(plan.elements)) {
  plan.elements.forEach(function(el) {
    if (el.name && el.parentWidth) {
      // 이 요소의 실제 px 너비 계산 (부모 대비)
      var pw = parseNum(el.parentWidth);
      if (!isNaN(pw)) parentWidthMap[el.name] = pw;
    }
    // children도 등록
    if (Array.isArray(el.children)) {
      el.children.forEach(function(ch) {
        if (ch.name && ch.parentWidth) {
          parentWidthMap[ch.name] = parseNum(ch.parentWidth);
        }
      });
    }
  });
}

// ── 4. 요소 검증 함수 (재귀) ──
function validateElement(el, depth, parentPrefix) {
  var prefix = parentPrefix ? parentPrefix + ' → [' + (el.name || '이름없음') + ']' : '[' + (el.name || '이름없음') + ']';

  // 필수: name, position, parent
  if (!el.name) errors.push(prefix + ' name 누락');
  if (!el.position) {
    errors.push(prefix + ' position 누락 (rltv/absol)');
  } else if (!['rltv', 'absol'].includes(el.position)) {
    errors.push(prefix + ' position은 rltv 또는 absol이어야 함 (현재: ' + el.position + ')');
  }
  if (!el.parent) errors.push(prefix + ' parent 누락');

  // ★ parent 타입 검증 (문자열이어야 함, 숫자면 인자 순서 버그)
  if (el.parent !== undefined && el.parent !== null && typeof el.parent !== 'string') {
    errors.push(prefix + ' parent가 문자열이 아님 (현재: ' + typeof el.parent + ' ' + el.parent + ') — buildChildElement 인자 순서 확인');
  }

  // ★ NaN/null 값 검증
  for (var field of ['top', 'left', 'width', 'marginTop', 'marginLeft']) {
    if (el[field] !== undefined && el[field] !== null && typeof el[field] === 'string' && /NaN/.test(el[field])) {
      errors.push(prefix + ' ' + field + '에 NaN 포함: "' + el[field] + '"');
    }
  }

  // ★ parentWidth 필수 (부모의 px 너비)
  if (!el.parentWidth && el.parentWidth !== 0) {
    errors.push(prefix + ' parentWidth 누락 (부모 px 너비 필수 — 예: 1905, 1443 등)');
  }

  // ★ width 필수 (text는 intrinsic width 사용 권장)
  if (!el.width && el.type !== 'text-only' && el.type !== 'text') {
    errors.push(prefix + ' width 누락');
  }

  // ★ 수치 품질 검증
  // roundNumberOverride: PSD 정확값이 우연히 둥근 수인 경우 예외 허용
  // plan.json 최상위 또는 요소에 "roundNumberOverride": ["50%", "100%"] 형태로 명시
  var overrides = [].concat(plan.roundNumberOverride || [], el.roundNumberOverride || []);
  var numericFields = ['marginTop', 'marginLeft', 'top', 'left', 'width', 'paddingTop', 'paddingBottom'];
  numericFields.forEach(function(field) {
    if (el[field] !== undefined) {
      // 추정값 금지
      if (hasEstimation(String(el[field]))) {
        errors.push(prefix + ' ' + field + ' 추정값 금지: "' + el[field] + '"');
      }
      // 둥근 수 경고 (0 제외, override 제외)
      var n = parseNum(el[field]);
      var valStr = String(el[field]);
      var isOverridden = overrides.some(function(ov) { return valStr === ov || Math.abs(parseNum(ov) - n) < 0.001; });
      if (!isNaN(n) && n > 0 && isRoundNumber(n) && !isOverridden) {
        errors.push(prefix + ' ' + field + ' 둥근 수 의심: ' + el[field] + ' — PSD 정확값이면 roundNumberOverride에 추가');
      }
    }
  });

  // ★ 부모 대비 % 역산 검증
  if (el.parentWidth && el.width) {
    var pw = parseNum(el.parentWidth);
    var w = parseNum(el.width);
    if (!isNaN(pw) && !isNaN(w) && pw > 0) {
      // width가 %로 적혀있으면 역산: width% * parentWidth / 100 = 실제px
      var widthStr = String(el.width);
      if (widthStr.includes('%')) {
        var actualPx = w * pw / 100;
        // naturalWidth가 있으면 대조
        if (el.naturalWidth) {
          var diff = Math.abs(actualPx - el.naturalWidth);
          if (diff > 2) {
            // 완성형 이미지(sourceType)는 PSD와 크기 다를 수 있음 → warning
            if (el.sourceType === '완성형' || diff < 50) {
              warns.push(prefix + ' width 차이: ' + actualPx.toFixed(0) + 'px vs nat ' + el.naturalWidth + 'px (Δ' + diff.toFixed(0) + 'px' + (el.sourceType === '완성형' ? ', 완성형' : '') + ')');
            } else {
              errors.push(prefix + ' width 역산 불일치: ' + w + '% of ' + pw + 'px = ' + actualPx.toFixed(1) + 'px ≠ naturalWidth ' + el.naturalWidth + 'px (차이 ' + diff.toFixed(1) + 'px)');
            }
          }
        }
      }
    }
  }

  // rltv 요소
  if (el.position === 'rltv') {
    if (el.marginTop === undefined && el.marginTop !== 0) {
      if (plan.heightChain && plan.heightChain.includes(el.name)) {
        errors.push(prefix + ' rltv인데 marginTop 누락');
      }
    }
    if (el.top !== undefined) {
      errors.push(prefix + ' rltv에 top 사용 금지 → marginTop 사용');
    }
    if (el.left !== undefined) {
      warns.push(prefix + ' rltv에 left 사용 → marginLeft 또는 text-align 권장');
    }
  }

  // absol 요소
  if (el.position === 'absol') {
    if (!el.top && el.top !== 0) errors.push(prefix + ' absol인데 top 누락 (vw)');
    if (el.left === undefined || el.left === null) errors.push(prefix + ' absol인데 left 누락');
    if (el.marginTop !== undefined) {
      errors.push(prefix + ' absol에 marginTop 사용 금지 → top 사용');
    }
    if (typeof el.top === 'string' && el.top.includes('%')) {
      errors.push(prefix + ' absol top에 % 금지 → vw 사용');
    }
  }

  // ★ MID~HIGH 규칙: 수치 정밀도 + 금지 패턴
  // 소수점 4자리 미만 vw 값 감지
  ['width', 'marginTop', 'marginLeft', 'top', 'left'].forEach(function(field) {
    var v = el[field];
    if (v && typeof v === 'string' && v.includes('vw')) {
      var num = parseFloat(v);
      if (!isNaN(num) && num > 0) {
        var decimalPlaces = (v.split('.')[1] || '').replace(/vw.*/, '').length;
        if (decimalPlaces < 4 && num < 50) {
          warns.push(prefix + ' ' + field + ' 소수점 ' + decimalPlaces + '자리 — 4자리 이상 권장 (' + v + ')');
        }
      }
    }
  });

  // absol에 marginLeft 금지 (left 써야 함)
  if (el.position === 'absol' && el.marginLeft !== undefined) {
    errors.push(prefix + ' absol에 marginLeft 금지 → left 사용');
  }

  // rltv에 top 사용 금지 (marginTop 써야 함)
  if (el.position === 'rltv' && el.top !== undefined) {
    errors.push(prefix + ' rltv에 top 사용 금지 → marginTop 사용');
  }

  // 텍스트에 lineHeight 누락
  if ((el.type === 'text' || el.type === 'text-only') && el.segments) {
    el.segments.forEach(function(seg, si) {
      seg = normalizePlanSegment(seg);
      if (seg.lineHeight === undefined) {
        warns.push(prefix + ' segments[' + si + '] lineHeight 누락 — PSD 정확값 필수');
      }
      if (seg.letterSpacing === undefined) {
        warns.push(prefix + ' segments[' + si + '] letterSpacing 누락');
      }
    });
  }

  // 이미지 width가 원본파일 기준인지 확인 (naturalWidth/1905)
  if ((el.type === 'image') && el.naturalWidth && el.width) {
    var expectedW = (el.naturalWidth / CANVAS * 100).toFixed(4);
    var actualW = parseFloat(el.width).toFixed(4);
    if (String(el.width).includes('vw') && Math.abs(parseFloat(expectedW) - parseFloat(actualW)) > 0.01) {
      warns.push(prefix + ' 이미지 width가 원본 기준(naturalWidth/1905)과 불일치: expected=' + expectedW + 'vw actual=' + el.width);
    }
  }

  // 테이블 타입
  if (el.type === 'table') {
    if (!el.headerBg) errors.push(prefix + ' table인데 headerBg 누락');
    if (!el.headerColor) errors.push(prefix + ' table인데 headerColor 누락');
    if (!el.borderColor) errors.push(prefix + ' table인데 borderColor 누락');
    if (el.footer) {
      if (!el.footer.bg) errors.push(prefix + ' table footer bg 누락');
      if (!el.footer.color) errors.push(prefix + ' table footer color 누락');
    }
  }

  // 이미지 타입
  if (el.type === 'image' || el.type === 'bgImage') {
    if (!el.naturalWidth) errors.push(prefix + ' 이미지인데 naturalWidth 누락');
    if (!el.naturalHeight) errors.push(prefix + ' 이미지인데 naturalHeight 누락');
    if (el.sourceType === undefined) errors.push(prefix + ' 이미지인데 sourceType 누락 (소스/완성형)');
    if (!el.src && !el.background) errors.push(prefix + ' 이미지인데 src/background 누락');
    // absol 이미지인데 psdY도 없고 clippingRect 매칭도 안 되면 위치 검증 불가 → 경고
    if (el.position === 'absol' && !el.psdY && el.parent === 'section') {
      warns.push(prefix + ' absol 이미지인데 psdY 미명시 — clippingRect 자동 매칭 안 되면 위치 검증 불가');
    }
  }

  // 텍스트 타입
  if (el.type === 'text' || el.type === 'text-only') {
    if (!el.segments || !Array.isArray(el.segments) || el.segments.length === 0) {
      errors.push(prefix + ' 텍스트인데 segments 누락');
    } else {
      for (var si = 0; si < el.segments.length; si++) {
        var seg = normalizePlanSegment(el.segments[si]);
        var sp = prefix + ' segment[' + si + ']';
        if (!seg.fontWeight && seg.fontWeight !== 0) errors.push(sp + ' fontWeight 누락');
        if (!seg.color) errors.push(sp + ' color 누락');
        if (!seg.fontSize) errors.push(sp + ' fontSize 누락');
        if (!seg.letterSpacing && seg.letterSpacing !== 0) errors.push(sp + ' letterSpacing 누락');
        if (!seg.lineHeight && seg.lineHeight !== 0) errors.push(sp + ' lineHeight 누락');
        // lineHeight 어림값 체크 (roundNumberOverride 또는 spec 대조 일치하면 면제)
        if (seg.lineHeight) {
          var lh = parseNum(seg.lineHeight);
          if (!isNaN(lh) && lh > 0 && isRoundNumber(lh) && lh > 1) {
            // roundNumberOverride에 있으면 면제
            var lhOverridden = overrides.some(function(ov) { return Math.abs(parseNum(ov) - lh) < 0.001; });
            if (!lhOverridden) {
              var lhMatchedSpec = false;
              // spec 파일 경로 탐색 (상대경로 → plan.json 기준 + psd/ 하위)
              var specPaths = [];
              if (plan.specFile) {
                specPaths.push(plan.specFile);
                var _planDir = path.dirname(planPath);
                var _sec = (plan.section || '').replace(/^fr-|^vo-|^brand-|^shop-|^cm-/, '');
                specPaths.push(path.join(_planDir, plan.specFile));
                specPaths.push(path.join(_planDir, '..', '..', 'psd', plan.specFile));
                specPaths.push(path.join(_planDir, '..', '..', 'psd', 'spec_' + (plan.page || '') + '_' + plan.section + '.json'));
                specPaths.push(path.join(_planDir, '..', '..', 'psd', 'spec_' + (plan.page || '') + '_' + _sec + '.json'));
                // con06/con6 양쪽 시도
                var _secDigits = _sec.replace(/\D/g, '');
                if (_secDigits) {
                  var _secPadded = 'con' + _secDigits.padStart(2, '0');
                  var _secUnpadded = 'con' + String(Number(_secDigits));
                  specPaths.push(path.join(_planDir, '..', '..', 'psd', 'spec_' + (plan.page || '') + '_' + _secPadded + '.json'));
                  specPaths.push(path.join(_planDir, '..', '..', 'psd', 'spec_' + (plan.page || '') + '_' + _secUnpadded + '.json'));
                }
                // .planning/ 디렉토리 내 spec 파일도 탐색
                specPaths.push(path.join(_planDir, plan.specFile));
                specPaths.push(path.join(_planDir, 'spec_' + (plan.page || '') + '_' + plan.section + '.json'));
                specPaths.push(path.join(_planDir, 'spec_' + (plan.page || '') + '_' + _sec + '.json'));
              }
              for (var spi = 0; spi < specPaths.length && !lhMatchedSpec; spi++) {
                if (fs.existsSync(specPaths[spi])) {
                  try {
                    var specForLh = JSON.parse(fs.readFileSync(specPaths[spi], 'utf8'));
                    if (specForLh.texts) {
                      specForLh.texts.forEach(function(st) {
                        if (st.segments) st.segments.forEach(function(ss) {
                          if (ss.lineHeight && Math.abs(parseNum(ss.lineHeight) - lh) < 0.01) lhMatchedSpec = true;
                        });
                      });
                    }
                  } catch(e) {}
                }
              }
              if (!lhMatchedSpec) {
                errors.push(sp + ' lineHeight 둥근 수: ' + seg.lineHeight + ' — PSD 정확값 확인 필수 (1.4, 1.6 등 어림값 금지)');
              }
            }
          }
        }
      }
    }
  }

  // flex/grid
  if (el.type === 'flex' || el.type === 'grid') {
    if (!el.gap && el.gap !== 0) errors.push(prefix + ' flex/grid인데 gap 누락');
    if (!el.direction) errors.push(prefix + ' flex/grid인데 direction 누락');
  }

  // Swiper 타입
  if (el.type === 'swiper') {
    if (!el.slidesPerView) warns.push(prefix + ' swiper인데 slidesPerView 누락 — AI 보정 시 추가 필요');
    if (!el.spaceBetween && el.spaceBetween !== 0) warns.push(prefix + ' swiper인데 spaceBetween 누락 — AI 보정 시 추가 필요');
    if (!el.visibleCount) warns.push(prefix + ' swiper인데 visibleCount(보이는 슬라이드 수) 누락');
    if (el.activeScale && !el.activeGap) errors.push(prefix + ' swiper activeScale 있는데 activeGap 누락');
    if (el.activeScale && !el.inactiveGap) errors.push(prefix + ' swiper activeScale 있는데 inactiveGap 누락');
  }

  // effects
  if (el.effects === undefined && el.type !== 'text-only') {
    // effects 필드 없으면 경고 (null이면 "효과 없음" 의미로 OK)
    warns.push(prefix + ' effects 미명시 — PSD effects 확인했는지?');
  }

  // border-radius
  if (el.borderRadius === undefined && el.type === 'image') {
    warns.push(prefix + ' borderRadius 미명시 — PSD 확인');
  }

  // ★ 자식 검증 (무한 재귀)
  if (Array.isArray(el.children)) {
    for (var ci = 0; ci < el.children.length; ci++) {
      validateElement(el.children[ci], depth + 1, prefix);
    }
  }
}

// ── 5. 전체 요소 검증 실행 ──
if (Array.isArray(plan.elements)) {
  for (var ei = 0; ei < plan.elements.length; ei++) {
    validateElement(plan.elements[ei], 0, '');
  }
}

// ── 5.5. PSD spec 대조 (specFile 있으면) ──
if (plan.specFile && fs.existsSync(plan.specFile)) {
  var spec;
  try { spec = JSON.parse(fs.readFileSync(plan.specFile, 'utf8')); } catch(e) { spec = null; }

  if (spec) {
    // ── 5.5a. 텍스트 segments 대조 ──
    if (spec.texts && Array.isArray(plan.elements)) {
      plan.elements.forEach(function(el) {
        if ((el.type !== 'text' && el.type !== 'text-only') || !el.segments) return;
        // plan의 텍스트 내용으로 spec에서 매칭 (우선순위: 완전일치 → psdY → 부분일치)
        var planText = el.segments.map(function(s) { return s.text || ''; }).join('').replace(/\n/g, '');
        var matched = null;

        // 1순위: specTextName 직접 매칭
        if (el.specTextName) {
          matched = spec.texts.find(function(st) { return st.name && st.name.includes(el.specTextName); });
        }

        // plan의 첫 segment fontSize 추출 (보조 매칭용)
        var planFs = el.segments[0] && el.segments[0].fontSize ? parseNum(el.segments[0].fontSize) : null;

        // 2순위: 완전 일치 + fontSize 보조 (동명 텍스트 구분)
        if (!matched && planText) {
          var exactMatches = spec.texts.filter(function(st) {
            if (!st.segments) return false;
            var specText = st.segments.map(function(s) { return s.text || ''; }).join('').replace(/\n/g, '');
            return specText === planText;
          });
          if (exactMatches.length === 1) {
            matched = exactMatches[0];
          } else if (exactMatches.length > 1 && planFs) {
            // 동명 텍스트 여러 개 → fontSize로 구분
            matched = exactMatches.find(function(st) {
              var specFs = st.segments[0] && st.segments[0].fontSize_vw ? parseNum(st.segments[0].fontSize_vw) : null;
              return specFs && Math.abs(specFs - planFs) < 0.1;
            }) || exactMatches[0];
          } else if (exactMatches.length > 1) {
            matched = exactMatches[0];
          }
        }

        // 3순위: psdY 기반
        if (!matched && el.psdY) {
          matched = spec.texts.find(function(st) {
            return st.y && Math.abs(st.y - el.psdY) < 5;
          });
        }

        // 4순위: 부분 일치 + fontSize 보조
        if (!matched && planText && planText.length >= 5) {
          var partialMatches = spec.texts.filter(function(st) {
            if (!st.segments) return false;
            var specText = st.segments.map(function(s) { return s.text || ''; }).join('').replace(/\n/g, '');
            return specText.length >= 5 && (specText.includes(planText) || planText.includes(specText));
          });
          if (partialMatches.length === 1) {
            matched = partialMatches[0];
          } else if (partialMatches.length > 1 && planFs) {
            matched = partialMatches.find(function(st) {
              var specFs = st.segments[0] && st.segments[0].fontSize_vw ? parseNum(st.segments[0].fontSize_vw) : null;
              return specFs && Math.abs(specFs - planFs) < 0.1;
            }) || partialMatches[0];
          } else if (partialMatches.length > 1) {
            matched = partialMatches[0];
          }
        }
        if (!matched) return;

        var prefix = '[' + el.name + '] spec대조';
        // segment 수 비교
        if (el.segments.length !== matched.segments.length) {
          errors.push(prefix + ' segment 수 불일치: plan ' + el.segments.length + '개 vs PSD ' + matched.segments.length + '개 — 한 텍스트 안에서 color/weight 다른 구간 누락?');
        }
        // 각 segment 값 대조
        var minLen = Math.min(el.segments.length, matched.segments.length);
        for (var si = 0; si < minLen; si++) {
          var ps = normalizePlanSegment(el.segments[si]);
          var ss = matched.segments[si];
          var sp = prefix + ' seg[' + si + ']';
          // fontWeight
          if (ps.fontWeight && ss.fontWeight && parseNum(ps.fontWeight) !== ss.fontWeight) {
            errors.push(sp + ' fontWeight 불일치: plan=' + ps.fontWeight + ' PSD=' + ss.fontWeight);
          }
          // color
          if (ps.color && ss.color && ps.color.toLowerCase() !== ss.color.toLowerCase()) {
            errors.push(sp + ' color 불일치: plan=' + ps.color + ' PSD=' + ss.color);
          }
          // fontSize (vw 비교, 오차 0.05vw 허용)
          if (ps.fontSize && ss.fontSize_vw) {
            var planVw = parseNum(ps.fontSize);
            var specVw = parseNum(ss.fontSize_vw);
            if (!isNaN(planVw) && !isNaN(specVw) && Math.abs(planVw - specVw) > 0.05) {
              errors.push(sp + ' fontSize 불일치: plan=' + ps.fontSize + ' PSD=' + ss.fontSize_vw + 'vw(' + ss.fontSize_px + 'px)');
            }
          }
          // letterSpacing
          if (ps.letterSpacing && ss.letterSpacing) {
            var planLs = String(ps.letterSpacing).replace('em', '');
            var specLs = String(ss.letterSpacing).replace('em', '');
            if (parseNum(planLs) !== parseNum(specLs)) {
              errors.push(sp + ' letterSpacing 불일치: plan=' + ps.letterSpacing + ' PSD=' + ss.letterSpacing);
            }
          }
          // lineHeight (오차 0.05 허용)
          if (ps.lineHeight && ss.lineHeight) {
            var planLh = parseNum(ps.lineHeight);
            var specLh = parseNum(ss.lineHeight);
            if (!isNaN(planLh) && !isNaN(specLh) && Math.abs(planLh - specLh) > 0.05) {
              errors.push(sp + ' lineHeight 불일치: plan=' + ps.lineHeight + ' PSD=' + ss.lineHeight);
            }
          }
        }
      });
    }

    // ── 5.5b. 이미지 위치/크기 대조 (자동 매칭 + clippingRect 검증) ──
    if (spec.images && Array.isArray(plan.elements)) {
      // plan 이미지 요소에서 src 파일명 추출하여 spec 자동 매칭
      plan.elements.forEach(function checkImgEl(el) {
        if (el.type !== 'image' && el.type !== 'bgImage') {
          if (Array.isArray(el.children)) el.children.forEach(checkImgEl);
          return;
        }
        var prefix = '[' + el.name + ']';

        // ── 자동 매칭: src/background 파일명 → spec possibleFile ──
        var matched = null;
        if (el.specImageName) {
          matched = spec.images.find(function(si) { return si.name && si.name.includes(el.specImageName); });
        }
        var elSrc = el.src || (el.background ? (el.background.match(/url\(([^)]+)\)/)||[])[1] : null);
        if (!matched && elSrc) {
          var srcBase = path.basename(elSrc);
          matched = spec.images.find(function(si) { return si.possibleFile === srcBase; });
        }

        // ── clippingRect 기반 위치 검증 ──
        if (matched && matched.clippingRect && el.position === 'absol' && el.parent === 'section' && plan.prevSectionBottom !== undefined) {
          var cr = matched.clippingRect;
          // bgImage: PSD 원본 레이어가 섹션 밖으로 확장될 수 있음
          // 내보낸 이미지는 이미 크롭되므로 clippingRect top = section top이면
          // 하단 정렬 등 수동 배치가 필요할 수 있음 → error 대신 warning
          if (el.type === 'bgImage' && matched.y < plan.prevSectionBottom) {
            var crExpTop = (cr.y - plan.prevSectionBottom) / CANVAS * 100;
            var crActTop = parseNum(el.top);
            if (!isNaN(crExpTop) && !isNaN(crActTop) && Math.abs(crExpTop - crActTop) > 1.5) {
              warns.push(prefix + ' bgImage clippingRect top(' + cr.y + ')과 plan top(' + el.top + ') 차이 — PSD 원본이 섹션 밖으로 확장됨, 내보낸 이미지 기준으로 수동 배치 확인 필요');
            }
          } else {
            var expectedTop = (cr.y - plan.prevSectionBottom) / CANVAS * 100;
            var actualTop = parseNum(el.top);
            if (!isNaN(expectedTop) && !isNaN(actualTop) && Math.abs(expectedTop - actualTop) > 1.5) {
              errors.push(prefix + ' 이미지 top이 clippingRect 기준과 불일치: clippingRect.y=' + cr.y + ' → 예상 top=' + expectedTop.toFixed(4) + 'vw, plan top=' + actualTop.toFixed(4) + 'vw — clippingRect 좌표 기준으로 계산 필수');
            }
          }
        }

        // ── 기존: psdX/Y/W 대조 ──
        if (matched) {
          if (el.psdX !== undefined && Math.abs(parseNum(el.psdX) - matched.x) > 3) {
            errors.push(prefix + ' spec대조(이미지) x 불일치: plan=' + el.psdX + ' PSD=' + matched.x);
          }
          if (el.psdY !== undefined && Math.abs(parseNum(el.psdY) - matched.y) > 3) {
            // clippingRect가 있으면 psdY가 clippingRect.y 기준일 수 있으므로 그것도 허용
            var crY = matched.clippingRect ? matched.clippingRect.y : null;
            if (crY === null || Math.abs(parseNum(el.psdY) - crY) > 3) {
              errors.push(prefix + ' spec대조(이미지) y 불일치: plan=' + el.psdY + ' PSD=' + matched.y + (crY !== null ? ' (clippingRect.y=' + crY + ')' : ''));
            }
          }
          if (el.psdW !== undefined && Math.abs(parseNum(el.psdW) - matched.w) > 3) {
            errors.push(prefix + ' spec대조(이미지) w 불일치: plan=' + el.psdW + ' PSD=' + matched.w);
          }
        }

        // ── 실제 이미지 파일 크기 검증 ──
        if (elSrc && el.naturalWidth && el.naturalHeight) {
          var imgPath = elSrc;
          // /images/... → 프로젝트 루트 기준 변환
          if (imgPath.startsWith('/')) imgPath = imgPath.substring(1);
          var planDir = path.dirname(planPath);
          // plan 파일에서 프로젝트 루트 찾기
          var projectRoot = planDir;
          while (projectRoot !== '/' && !fs.existsSync(path.join(projectRoot, 'CLAUDE.md'))) {
            projectRoot = path.dirname(projectRoot);
          }
          var fullImgPath = path.join(projectRoot, imgPath);
          if (fs.existsSync(fullImgPath)) {
            try {
              var imgBuf = fs.readFileSync(fullImgPath);
              var fileW = 0, fileH = 0;
              // PNG
              if (imgBuf[0] === 0x89 && imgBuf[1] === 0x50) {
                fileW = imgBuf.readUInt32BE(16);
                fileH = imgBuf.readUInt32BE(20);
              }
              // JPEG
              else if (imgBuf[0] === 0xFF && imgBuf[1] === 0xD8) {
                var ji = 2;
                while (ji < imgBuf.length - 8) {
                  if (imgBuf[ji] !== 0xFF) { ji++; continue; }
                  var marker = imgBuf[ji+1];
                  if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
                    fileH = imgBuf.readUInt16BE(ji+5);
                    fileW = imgBuf.readUInt16BE(ji+7);
                    break;
                  }
                  var mlen = imgBuf.readUInt16BE(ji+2);
                  ji += 2 + mlen;
                }
              }
              if (fileW > 0 && fileH > 0) {
                if (fileW !== el.naturalWidth) {
                  errors.push(prefix + ' naturalWidth 불일치: plan=' + el.naturalWidth + ' 실제파일=' + fileW + 'px (' + el.src + ')');
                }
                if (fileH !== el.naturalHeight) {
                  errors.push(prefix + ' naturalHeight 불일치: plan=' + el.naturalHeight + ' 실제파일=' + fileH + 'px (' + el.src + ')');
                }
              }
            } catch(e) { /* 파싱 실패 무시 */ }
          } else {
            warns.push(prefix + ' 이미지 파일 없음: ' + fullImgPath);
          }
        }

        if (Array.isArray(el.children)) el.children.forEach(checkImgEl);
      });
    }

    // ── 5.5c. rect(배경/카드) fill 대조 ──
    if (spec.rects && Array.isArray(plan.elements)) {
      plan.elements.forEach(function checkRectEl(el) {
        if (el.specRectName && el.bgColor) {
          var matched = spec.rects.find(function(sr) { return sr.name && sr.name.includes(el.specRectName); });
          if (matched && matched.fill) {
            var prefix = '[' + el.name + '] spec대조(rect)';
            if (el.bgColor.toLowerCase() !== matched.fill.toLowerCase()) {
              errors.push(prefix + ' fill 불일치: plan=' + el.bgColor + ' PSD=' + matched.fill);
            }
          }
        }
        if (Array.isArray(el.children)) el.children.forEach(checkRectEl);
      });
    }

    // ── 5.5c2. bgRect/effectiveEnd sanity + thin shape 누락 대조 ──
    if (spec.rects && Array.isArray(plan.elements)) {
      var specBgRectCandidates = spec.rects.filter(function(r) {
        if (!r || !r.w || !r.h || !r.fill) return false;
        if (r.w < CANVAS * 0.9 || r.h < 100) return false;
        if (String(r.fill).toLowerCase() !== String(plan.bg || '').toLowerCase()) return false;
        return true;
      }).sort(function(a, b) {
        return (b.w * b.h) - (a.w * a.h);
      });
      if (specBgRectCandidates.length > 0 && plan.sectionY && plan.sectionY.bottom !== undefined) {
        var bgRectForEnd = specBgRectCandidates[0];
        var bgRectBottom = bgRectForEnd.y + bgRectForEnd.h;
        var bottomDelta = Math.abs(bgRectBottom - parseNum(plan.sectionY.bottom));
        if (!isNaN(bottomDelta) && bottomDelta > 200 && !plan.sectionBottomReason) {
          errors.push('sectionY.bottom(' + plan.sectionY.bottom + ')과 full-width bgRect bottom(' + bgRectBottom + ', "' + bgRectForEnd.name + '") 차이 ' + bottomDelta.toFixed(0) + 'px — overhang 레이어를 섹션 높이로 잡았을 수 있음. effectiveEnd/bgRect 기준으로 pb 재검토하거나 sectionBottomReason 명시');
        }
      }

      var flatForSpecShapes = collectAllElements(plan.elements);
      var ignoredShapeNames = {};
      (plan.ignoredShapes || []).forEach(function(item) {
        if (typeof item === 'string') ignoredShapeNames[item] = 'listed';
        else if (item && item.name) ignoredShapeNames[item.name] = item.reason || 'listed';
      });

      function elBoxPx(el) {
        var parentW = parseNum(el.parentWidth || CANVAS);
        var x = el.psdX !== undefined ? parseNum(el.psdX) : (el.left !== undefined ? parseNum(el.left) * parentW / 100 : NaN);
        var y = el.psdY !== undefined ? parseNum(el.psdY) : (el.top !== undefined ? parseNum(el.top) * CANVAS / 100 + (plan.prevSectionBottom || 0) : NaN);
        var w = el.psdW !== undefined ? parseNum(el.psdW) : (el.naturalWidth || (el.width !== undefined ? parseNum(el.width) * parentW / 100 : NaN));
        var h = el.psdH !== undefined ? parseNum(el.psdH) : (el.naturalHeight || NaN);
        return { x:x, y:y, w:w, h:h };
      }
      function rectInsidePlannedComposite(r) {
        var cx = r.x + r.w / 2;
        var cy = r.y + r.h / 2;
        return flatForSpecShapes.some(function(el) {
          if (el.type !== 'image') return false;
          var completeLike = el.composite === true || /완성형|composite/i.test(String(el.sourceType || ''));
          if (!completeLike) return false;
          var b = elBoxPx(el);
          if ([b.x,b.y,b.w,b.h].some(function(n){ return isNaN(n); })) return false;
          return cx >= b.x - 8 && cx <= b.x + b.w + 8 && cy >= b.y - 8 && cy <= b.y + b.h + 8;
        });
      }
      function rectImplemented(r) {
        return flatForSpecShapes.some(function(el) {
          if (el.specRectName && String(r.name).indexOf(String(el.specRectName)) !== -1) return true;
          if (el.psdName && el.psdName === r.name) return true;
          if (el.name === r.name) return true;
          var b = elBoxPx(el);
          if ([b.x,b.y,b.w,b.h].some(function(n){ return isNaN(n); })) return false;
          return Math.abs(b.x - r.x) <= 4 && Math.abs(b.y - r.y) <= 4 && Math.abs(b.w - r.w) <= 6 && Math.abs(b.h - r.h) <= 8;
        });
      }
      var missingThinRects = spec.rects.filter(function(r) {
        if (!r || !r.w || !r.h || ignoredShapeNames[r.name]) return false;
        if (/^(사각형 1|background|bg)/i.test(r.name || '')) return false;
        var opacity = typeof r.opacity === 'number' ? r.opacity : 1;
        if (opacity <= 0) return false;
        var isThinLine = (r.w <= 8 && r.h >= 80 && r.h / Math.max(r.w, 1) >= 12) ||
          (r.h <= 8 && r.w >= 80 && r.w / Math.max(r.h, 1) >= 12);
        if (!isThinLine) return false;
        if (colorDistance(r.fill, plan.bg) < 30 && opacity >= 0.8) return false;
        if (rectInsidePlannedComposite(r)) return false;
        return !rectImplemented(r);
      });
      if (missingThinRects.length > 0) {
        var thinMsg = 'spec thin shape/line 미구현 ' + missingThinRects.length + '개: ' + missingThinRects.map(function(r){ return r.name; }).join(', ') + ' — CSS shape line/deco로 구현하거나 ignoredShapes에 reason 명시';
        if (plan.strictStructure === true) errors.push(thinMsg);
        else warns.push(thinMsg);
      }
    }
  }

    // ── 5.5d. PSD 그룹 구조 vs plan wrapper 대조 ──
    if (spec.groups && Array.isArray(plan.elements)) {
      // plan에서 children 가진 요소 수집
      var planWrappers = [];
      function collectWrappers(els) {
        els.forEach(function(el) {
          if (el.children && el.children.length > 0) planWrappers.push(el);
          if (el.children) collectWrappers(el.children);
        });
      }
      collectWrappers(plan.elements);

      // PSD 반복 그룹 검증 제거 (오탐만 유발, 유효 검출 0회)
      // 구조 판단(wrapper 그룹핑)은 AI가 STEP 0에서 수행
      // excludedPsdGroups/psdGroup 필드로 이미 명시 가능
    }

    // ── 5.5e. plan 요소 parent vs PSD 그룹 계층 대조 (bbox 기반) ──
    if (spec.groups && Array.isArray(plan.elements)) {
      // PSD 그룹 중 bbox 있는 것만 수집 (section 직속 depth-1 그룹)
      var psdTopGroups = spec.groups.filter(function(g) {
        return normSec(g.parentGroup || '') === normSec(plan.section || '') && g.bbox && g.bbox.w > 0;
      });

      function checkParentMatch(el, prefix) {
        if (!el || el.position !== 'absol' || el.parent === 'section') {
          // section 직속이면 — PSD에서도 section 직속인지 확인
          if (el && el.position === 'absol' && el.parent === 'section' && el.top) {
            var elY = parseNum(el.top) * CANVAS / 100 + (plan.prevSectionBottom || 0);
            var elX = el.left ? parseNum(el.left) * CANVAS / 100 : 0;
            // 이 요소가 PSD의 어느 depth-1 그룹 bbox 안에 있는지 확인
            var containingGroup = null;
            var smallestArea = Infinity;
            psdTopGroups.forEach(function(g) {
              var b = g.bbox;
              if (elX >= b.x - 10 && elX <= b.x + b.w + 10 && elY >= b.y - 10 && elY <= b.y + b.h + 10) {
                var area = b.w * b.h;
                if (area < smallestArea) { smallestArea = area; containingGroup = g; }
              }
            });
            // 배경 그룹 제외: bbox가 캔버스 90% 이상 넓으면 배경으로 간주 (하드코딩 방지)
            var isBgGroup = containingGroup && containingGroup.bbox && containingGroup.bbox.w > CANVAS * 0.9;
            if (containingGroup && !isBgGroup) {
              warns.push(prefix + ' section 직속 absol이지만 PSD에서는 "' + containingGroup.name + '" 그룹(parent:' + containingGroup.parentGroup + ') bbox 안에 위치 — parent를 "' + containingGroup.name + '" 대응 wrapper로 변경 권장');
            }
          }
        }
        if (el && el.children) el.children.forEach(function(ch) { checkParentMatch(ch, prefix + ' → [' + (ch.name || '?') + ']'); });
      }
      plan.elements.forEach(function(el) { checkParentMatch(el, '[' + (el.name || '?') + ']'); });
    }
} else if (plan.specFile) {
  warns.push('specFile 지정됨("' + plan.specFile + '")이지만 파일 없음 — 경로 확인');
} else {
  warns.push('specFile 미지정 — PSD spec 대조 생략됨 (spec 경로를 plan.json에 추가 권장)');
}

// ── 5.8. image-analysis.json 존재 체크 ──
var planDir = path.dirname(planPath);
var analysisPath = path.join(planDir, 'image-analysis.json');
// planDir에 없으면 같은 .planning/ 하위에서 자동 탐색
if (!fs.existsSync(analysisPath)) {
  var planningRoot = path.dirname(planDir);
  var planDirName = path.basename(planDir);
  try {
    var dirs = fs.readdirSync(planningRoot);
    for (var di = 0; di < dirs.length; di++) {
      var candidate = path.join(planningRoot, dirs[di], 'image-analysis.json');
      if (dirs[di] === planDirName || !fs.existsSync(candidate)) continue;
      // 같은 섹션 prefix면 사용 (예: franchise_con07 → franchise_con07)
      if (dirs[di].includes(plan.section || '')) { analysisPath = candidate; break; }
    }
  } catch(e) {}
}
if (!fs.existsSync(analysisPath)) {
  errors.push('image-analysis.json 없음 — image-analyzer 실행 필수\n     → node tools/image-analyzer.js images/<폴더> --prefix <conXX> --out ' + analysisPath);
} else {
  // 분석 결과와 plan 이미지 요소 대조
  try {
    var analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    if (analysis.images && Array.isArray(plan.elements)) {
      plan.elements.forEach(function checkAnalysis(el) {
        if (el.type !== 'image' || !el.src) {
          if (Array.isArray(el.children)) el.children.forEach(checkAnalysis);
          return;
        }
        var srcBase = path.basename(el.src);
        var analyzed = analysis.images.find(function(a) { return a.file === srcBase; });
        if (!analyzed) {
          warns.push('[' + el.name + '] image-analysis에 ' + srcBase + ' 결과 없음 — AI 보정 시 이미지 매핑 확인 필요');
        } else {
          // 완성형인데 sourceType이 plan에서 다르게 적혀있으면 경고
          if (analyzed.composite && el.sourceType && !el.sourceType.includes('완성형')) {
            warns.push('[' + el.name + '] image-analyzer: 완성형 판정인데 plan sourceType="' + el.sourceType + '" — CSS 효과 중복 위험');
          }
          // border 감지됐는데 plan에서 CSS border 추가하면 위험
          if (analyzed.border.detected && el.effects && String(el.effects).includes('border')) {
            errors.push('[' + el.name + '] 이미지에 border 내장(~' + analyzed.border.thickness + 'px) + plan effects에 border → CSS 중복 금지');
          }
          // ── shadow baked-in 감지: naturalWidth > PSD body → shadow가 이미지에 포함 ──
          if (el.naturalWidth && el.effects && Array.isArray(el.effects)) {
            var hasDropShadow = el.effects.some(function(eff) { return eff && eff.type === 'dropShadow'; });
            if (hasDropShadow && spec && spec.rects) {
              // spec rects에서 dropShadow가 있고 크기가 비슷한 rect 찾기
              var matchRect = spec.rects.find(function(sr) {
                return sr.effects && sr.effects.some(function(e) { return e.type === 'dropShadow'; })
                  && el.naturalWidth > sr.w + 10;
              });
              if (matchRect) {
                var pad = el.naturalWidth - matchRect.w;
                errors.push('[' + el.name + '] shadow baked-in: naturalWidth(' + el.naturalWidth + ') > PSD rect(' + matchRect.w + 'px), 차이=' + pad + 'px → 이미지에 shadow 포함됨, CSS box-shadow 중복 금지');
              }
            }
            // spec images에서도 체크
            if (hasDropShadow && spec && spec.images) {
              var srcBase2 = path.basename(el.src);
              var matchImg = spec.images.find(function(si) { return si.possibleFile === srcBase2; });
              if (matchImg && el.naturalWidth > matchImg.w + 10) {
                var pad2 = el.naturalWidth - matchImg.w;
                errors.push('[' + el.name + '] shadow baked-in: naturalWidth(' + el.naturalWidth + ') > PSD image(' + matchImg.w + 'px), 차이=' + pad2 + 'px → CSS box-shadow 중복 금지');
              }
            }
          }
        }
        if (Array.isArray(el.children)) el.children.forEach(checkAnalysis);
      });
    }
  } catch(e) { warns.push('image-analysis.json 파싱 실패: ' + e.message); }
}

// ── 5.9. 구조 검증 — 좌표가 겹치는 absol 요소 → wrapper 그룹핑 필요 ──
if (Array.isArray(plan.elements)) {
  // psdY + top으로 실제 PSD 위치 추정, 같은 parent의 absol끼리 영역 겹침 체크
  var absolEls = [];
  var overlapElementByName = {};
  function collectOverlapElements(el) {
    if (el && el.name) overlapElementByName[el.name] = el;
    if (Array.isArray(el.children)) el.children.forEach(collectOverlapElements);
  }
  plan.elements.forEach(collectOverlapElements);
  function pushAbsolElement(el) {
    if (el.position !== 'absol' || !el.parent) return;
    // 위치 추정: top(vw) → px
    var topPx = parseNum(el.top) * CANVAS / 100;
    var leftPx = 0;
    var leftStr = String(el.left || '0');
    if (leftStr.includes('%')) leftPx = parseNum(el.left) * (el.parentWidth || CANVAS) / 100;
    else leftPx = parseNum(el.left) * CANVAS / 100;
    var widthPx = 0;
    var wStr = String(el.width || '0');
    if (wStr.includes('%')) widthPx = parseNum(el.width) * (el.parentWidth || CANVAS) / 100;
    else widthPx = parseNum(el.width) * CANVAS / 100;
    var heightPx = 0;
    if (el.height) {
      heightPx = parseNum(el.height) * CANVAS / 100;
    } else if (el.naturalWidth && el.naturalHeight && widthPx) {
      heightPx = widthPx * parseNum(el.naturalHeight) / parseNum(el.naturalWidth);
    } else {
      heightPx = widthPx; // 정보가 없을 때만 정사각형 추정
    }
    if (!isNaN(topPx) && !isNaN(leftPx)) {
      absolEls.push({
        name: el.name,
        parent: el.parent,
        x: leftPx,
        y: topPx,
        w: widthPx,
        h: heightPx,
        hasWrapper: !!el.children,
        type: el.type,
        sourceType: el.sourceType,
        composite: el.composite,
        src: el.src,
        role: el.role
      });
    }
  }
  function collectAbsolElements(el) {
    pushAbsolElement(el);
    if (Array.isArray(el.children)) el.children.forEach(collectAbsolElements);
  }
  plan.elements.forEach(collectAbsolElements);
  // 같은 parent의 absol끼리 영역 겹침 그룹 탐색
  function rectContains(container, child, margin) {
    margin = margin === undefined ? 2 : margin;
    return child.x >= container.x - margin &&
      child.y >= container.y - margin &&
      child.x + child.w <= container.x + container.w + margin &&
      child.y + child.h <= container.y + container.h + margin;
  }
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
    return !!(el && (el.composite === true || /완성형|composite/i.test(el.sourceType || '')));
  }
  function overlayContainmentEvidence(container, child, areaRatio) {
    var score = 0;
    var reasons = [];
    if (isOverlayContainerName(container.name) || isOverlayContainerName(container.role)) { score += 2; reasons.push('container role/name'); }
    if (isOverlayChildName(child.name) || isOverlayChildName(child.role)) { score += 2; reasons.push('child role/name'); }
    if (container.type === 'image' && child.type === 'image') { score += 1; reasons.push('image pair'); }
    if (isCompleteish(child)) { score += 1; reasons.push('complete child'); }
    if (isCompleteish(container) || /source|visual/i.test(container.sourceType || '')) { score += 1; reasons.push('visual container'); }
    if (areaRatio >= 0.04 && areaRatio <= 0.35) { score += 1; reasons.push('contained area ratio'); }
    return { score: score, reasons: reasons };
  }

  for (var ai = 0; ai < absolEls.length; ai++) {
    var a = absolEls[ai];
    var overlaps = [a.name];
    for (var bi = ai + 1; bi < absolEls.length; bi++) {
      var b = absolEls[bi];
      if (a.parent !== b.parent) continue;
      // AABB 겹침 체크
      var overlapX = a.x < b.x + b.w && a.x + a.w > b.x;
      var overlapY = a.y < b.y + b.h && a.y + a.h > b.y;
      if (overlapX && overlapY) overlaps.push(b.name);
    }
    if (overlaps.length >= 2) {
      // 이미 더 큰 그룹의 서브셋이면 스킵 (중복 방지)
      var key = overlaps.slice().sort().join(',');
      if (!usedOverlapKeys) var usedOverlapKeys = {};
      var isSubset = Object.keys(usedOverlapKeys).some(function(k) {
        return overlaps.every(function(n) { return k.indexOf(n) >= 0; });
      });
      if (isSubset) { /* skip subset */ }
      else {
        usedOverlapKeys[key] = true;
        var anyWrapped = absolEls.filter(function(e) { return overlaps.indexOf(e.name) >= 0 && e.hasWrapper; }).length > 0;
        var parentEl = overlapElementByName[a.parent || ''];
        var parentAllowsLayered = !!(parentEl && parentEl.allowLayered === true);
        if (!anyWrapped && !parentAllowsLayered) {
          if (overlaps.length >= 3) {
            errors.push('좌표 겹치는 absol ' + overlaps.length + '개: ' + overlaps.join(', ') + ' — wrapper(children)로 그룹핑 필수');
          } else {
            warns.push('좌표 겹치는 absol 감지: ' + overlaps.join(', ') + ' — wrapper(children)로 그룹핑 권장');
          }
        } else if (parentAllowsLayered && overlaps.length >= 3) {
          warns.push('[' + a.parent + '] allowLayered:true로 겹치는 absol 허용: ' + overlaps.join(', ') + ' — 실제 시각 패널/카드 안의 의도된 레이어인지 최종 harness로 확인');
        }
      }
    }
  }

  var overlayPairKeys = {};
  for (var ci = 0; ci < absolEls.length; ci++) {
    for (var cj = 0; cj < absolEls.length; cj++) {
      if (ci === cj) continue;
      var container = absolEls[ci];
      var child = absolEls[cj];
      if (container.parent !== child.parent) continue;
      if (!container.w || !container.h || !child.w || !child.h) continue;
      var areaRatio = (child.w * child.h) / (container.w * container.h);
      if (areaRatio <= 0 || areaRatio > 0.45) continue;
      if (!rectContains(container, child, 4)) continue;
      if (isExcludedContainerName(container.name) || isExcludedContainerName(child.name)) continue;
      var evidence = overlayContainmentEvidence(container, child, areaRatio);
      var strongSemantic = (isOverlayContainerName(container.name) || isOverlayContainerName(container.role)) &&
        (isOverlayChildName(child.name) || isOverlayChildName(child.role));
      var overlayKey = [container.parent, container.name, child.name].join('>');
      if (overlayPairKeys[overlayKey]) continue;
      overlayPairKeys[overlayKey] = true;
      if (evidence.score >= 5 && strongSemantic) {
        errors.push('[' + child.name + '] "' + container.name + '" 내부 overlay로 보임 — 같은 parent 형제 배치 대신 parent를 "' + container.name + '"로 중첩할 것 (evidence: ' + evidence.reasons.join(', ') + ')');
      }
    }
  }
}

// ── 5.9b. 최상위 elements에서도 반복 패턴 검증 (flat 나열 방지) ──
if (Array.isArray(plan.elements) && plan.elements.length > 6) {
  var topPatterns = {};
  plan.elements.forEach(function(el) {
    var pat = (el.name || '').replace(/[0-9]+/g, 'N');
    if (!topPatterns[pat]) topPatterns[pat] = 0;
    topPatterns[pat]++;
  });
  var topRepeated = Object.keys(topPatterns).filter(function(p) { return topPatterns[p] >= 3; });
  if (topRepeated.length > 0) {
    errors.push('최상위 elements에 반복 패턴 "' + topRepeated.join('", "') + '" 감지 — wrapper(children)로 그룹핑 필수. flat 나열 금지');
  }
  // 개수만으로 block하지 않음 — 진짜 flat인 섹션도 있을 수 있음
}

// ── 5.9c0. 중앙 정렬 구조 검증 — 자식별 margin-left로 중앙축 맞추기 금지 ──
// plan 단계에서 잡아야 모바일 좌표를 다시 잡는 구조를 피할 수 있다.
if (Array.isArray(plan.elements)) {
  var planElementByName = {};
  function collectPlanElements(el) {
    if (el && el.name) planElementByName[el.name] = el;
    if (Array.isArray(el.children)) el.children.forEach(collectPlanElements);
  }
  plan.elements.forEach(collectPlanElements);

  function parentCentersChildren(el) {
    var parent = planElementByName[el.parent || ''];
    return !!(parent && parent.centerChildren);
  }

  function checkCenterMarginInPlan(el, parentPrefix) {
    var prefix = parentPrefix ? parentPrefix + ' → [' + (el.name || '이름없음') + ']' : '[' + (el.name || '이름없음') + ']';
    if (el.position === 'rltv' && el.marginLeft !== undefined) {
      var ml = parseNum(el.marginLeft);
      var w = el.width !== undefined ? parseNum(el.width) : NaN;
      var hasExplicitCenter = el.centerSelf === true || el.alignSelf === 'center' || parentCentersChildren(el);
      var hasManualPsdCenter = el.allowManualCenter === true && !!el.psdExactReason;
      var textCenterNoBox = (el.type === 'text' || el.type === 'text-only') &&
        el.textAlign === 'center' &&
        el.width === undefined &&
        ml > 0;
      var centeredWidthChild = !isNaN(w) && w > 0 && ml > 0 && Math.abs((ml + w / 2) - 50) <= 1.5;
      if (textCenterNoBox || centeredWidthChild) {
        if (hasManualPsdCenter) {
          // PSD exact offset exception: some exported composite assets are visually centered
          // but their bounding boxes are a few pixels off the canvas axis. Require an explicit
          // reason so this cannot become a generic "center with margin-left" escape hatch.
        } else if (!hasExplicitCenter) {
          errors.push(prefix + ' 중앙 정렬을 marginLeft(' + el.marginLeft + ')로 처리함 — 부모 centerChildren:true 또는 alignSelf:"center" 사용');
        } else if (ml > 0) {
          errors.push(prefix + ' 중앙 정렬 선언이 있는데 marginLeft(' + el.marginLeft + ')가 남아 있음 — marginLeft 0 또는 삭제 필요');
        }
      }

      var centerTextWithoutMechanism = (el.type === 'text' || el.type === 'text-only') &&
        el.textAlign === 'center' &&
        el.width === undefined &&
        ml === 0 &&
        !hasExplicitCenter;
      if (centerTextWithoutMechanism) {
        errors.push(prefix + ' width 없는 center 텍스트에 정렬 메커니즘 없음 — alignSelf:"center" 또는 부모 centerChildren:true 필요');
      }
    }
    if (Array.isArray(el.children)) el.children.forEach(function(ch) { checkCenterMarginInPlan(ch, prefix); });
  }
  plan.elements.forEach(function(el) { checkCenterMarginInPlan(el, ''); });
}

// ── 5.9c1. 실제 시각 박스 높이체인 검증 ──
// 패널/카드/배경 이미지가 실제 높이를 줄 수 있는데도 부모 padding-bottom으로만 높이를 만들면
// desktop은 맞아 보여도 mobile에서 내부 좌표를 다시 잡아야 한다.
if (Array.isArray(plan.elements)) {
  var boxElementByName = {};
  var boxChildrenByParent = {};
  function collectBoxElements(el) {
    if (!el || !el.name) return;
    boxElementByName[el.name] = el;
    if (el.parent) {
      if (!boxChildrenByParent[el.parent]) boxChildrenByParent[el.parent] = [];
      boxChildrenByParent[el.parent].push(el);
    }
    if (Array.isArray(el.children)) el.children.forEach(collectBoxElements);
  }
  plan.elements.forEach(collectBoxElements);

  Object.keys(boxElementByName).forEach(function(name) {
    var el = boxElementByName[name];
    if (el.position !== 'rltv' || !el.paddingBottom) return;
    var children = boxChildrenByParent[name] || [];
    var hasVisualSelf = !!(el.background || el.fill || el.border || el.borderColor || el.type === 'cssShape');
    var hasRltvVisualChild = children.some(function(ch) {
      return ch.position === 'rltv' && (ch.type === 'image' || ch.type === 'cssShape' || ch.background || ch.fill);
    });
    var hasAbsoluteVisualBg = children.some(function(ch) {
      return ch.position === 'absol' && (ch.type === 'image' || ch.background || ch.fill) && /(bg|paper|panel|card|body)/i.test(ch.name || '');
    });
    if (!hasVisualSelf && !hasRltvVisualChild && hasAbsoluteVisualBg) {
      errors.push('[' + name + '] 실제 배경/패널 이미지를 absol로 깔고 paddingBottom으로 높이만 만듦 — bg/paper 이미지를 rltv heightChain 자식으로 세울 것');
    }
  });
}

// ── 5.9c2. 섹션 이미지 asset 사용/무시 근거 검증 ──
// 이미지가 있는데 텍스트/CSS 재구현으로 대체한 게 아니면 plan에서 실제 element로 쓰거나,
// 정말 중간 composite/mask 조각일 때만 ignoredAssets에 근거를 남겨야 한다.
if (Array.isArray(plan.elements) && Array.isArray(plan.availableImages)) {
  var usedImageFiles = {};
  function collectUsedImageFiles(el) {
    if (!el) return;
    if (el.src) usedImageFiles[path.basename(String(el.src).split('?')[0])] = true;
    if (el.file) usedImageFiles[path.basename(String(el.file).split('?')[0])] = true;
    if (Array.isArray(el.children)) el.children.forEach(collectUsedImageFiles);
  }
  plan.elements.forEach(collectUsedImageFiles);

  var ignoredImageFiles = {};
  (plan.ignoredAssets || []).forEach(function(item) {
    if (typeof item === 'string') ignoredImageFiles[path.basename(item)] = 'listed';
    else if (item && item.file) ignoredImageFiles[path.basename(String(item.file))] = item.reason || 'listed';
  });

  var missingAssetFiles = plan.availableImages
    .map(function(img) { return img && img.file ? String(img.file) : ''; })
    .filter(function(file) { return file && file !== 'TODO' && !usedImageFiles[path.basename(file)] && !ignoredImageFiles[path.basename(file)]; });

  if (missingAssetFiles.length > 0) {
    var missingMsg = 'availableImages 미사용 ' + missingAssetFiles.length + '개: ' + missingAssetFiles.join(', ') + ' — 이미지가 있으면 사용하고, 중간 composite/mask 조각이면 ignoredAssets에 reason을 명시';
    if (plan.strictStructure === true) errors.push(missingMsg);
    else warns.push(missingMsg);
  }
}

// ── 5.9c2b. 필수 CSS shape/line 후보 사용/무시 근거 검증 ──
// 이미지가 아닌 얇은 장식 라인도 PSD 구성 요소다. 단, thin만으로 단정하지 않고
// spec-to-plan이 만든 다중 근거 후보(requiredShapeHints)만 강제한다.
if (Array.isArray(plan.requiredShapeHints)) {
  var flatForShapes = collectAllElements(plan.elements);
  var ignoredShapes = {};
  (plan.ignoredShapes || []).forEach(function(item) {
    if (typeof item === 'string') ignoredShapes[item] = 'listed';
    else if (item && item.name) ignoredShapes[item.name] = item.reason || 'listed';
  });
  var missingShapes = plan.requiredShapeHints.filter(function(shape) {
    if (!shape || !shape.name || ignoredShapes[shape.name]) return false;
    return !flatForShapes.some(function(el) {
      if (el.specRectName && String(shape.name).indexOf(String(el.specRectName)) !== -1) return true;
      if (el.psdName && el.psdName === shape.name) return true;
      if (el.name === shape.name) return true;
      if (el.name && String(el.name).replace(/_/g, ' ').indexOf(String(shape.name).replace(/_/g, ' ')) !== -1) return true;
      return false;
    });
  });
  if (missingShapes.length > 0) {
    var shapeMsg = 'requiredShapeHints 미사용 ' + missingShapes.length + '개: ' + missingShapes.map(function(s){ return s.name; }).join(', ') + ' — 얇은 라인/장식 rect도 plan element로 구현하거나 ignoredShapes에 reason 명시';
    if (plan.strictStructure === true) errors.push(shapeMsg);
    else warns.push(shapeMsg);
  }
}

// ── 5.9c2c. 유의미한 PSD 텍스트 누락 방지 ──
// 완성형 이미지 내부가 아닌 텍스트는 plan에서 사라지면 안 된다.
// 기존 plan 파일에는 영향이 없도록 spec-to-plan이 requiredTextHints를 넣은 새 플랜에만 적용한다.
if (Array.isArray(plan.requiredTextHints)) {
  var planTextElements = [];
  function collectPlanTexts(el) {
    if (!el) return;
    if (el.type === 'text' || el.type === 'text-only') {
      var combined = el.content;
      if (!combined && Array.isArray(el.segments)) {
        combined = el.segments.map(function(seg) { return seg.text || ''; }).join('');
      }
      planTextElements.push({
        name: el.name,
        content: normalizeTextValue(combined),
        raw: combined || ''
      });
    }
    if (Array.isArray(el.children)) el.children.forEach(collectPlanTexts);
  }
  (plan.elements || []).forEach(collectPlanTexts);

  var ignoredTextKeys = new Set();
  (plan.ignoredTexts || []).forEach(function(item) {
    if (!item) return;
    if (item.name) ignoredTextKeys.add('name:' + String(item.name));
    if (item.content || item.text) ignoredTextKeys.add('text:' + normalizeTextValue(item.content || item.text));
  });

  var missingTextHints = plan.requiredTextHints.filter(function(hint) {
    if (!hint) return false;
    if (hint.name && ignoredTextKeys.has('name:' + String(hint.name))) return false;
    var target = normalizeTextValue(hint.content || hint.text || '');
    if (!target) return false;
    if (ignoredTextKeys.has('text:' + target)) return false;
    return !planTextElements.some(function(el) {
      if (!el.content) return false;
      if (el.content === target) return true;
      if (el.content.length >= 6 && target.length >= 6) {
        return el.content.includes(target) || target.includes(el.content);
      }
      return false;
    });
  });

  if (missingTextHints.length > 0) {
    var stackBuckets = {};
    missingTextHints.forEach(function(hint) {
      if (!hint || !hint.hintGroup) return;
      if (!stackBuckets[hint.hintGroup]) stackBuckets[hint.hintGroup] = [];
      stackBuckets[hint.hintGroup].push(hint);
    });
    var stackDetails = Object.keys(stackBuckets).sort().map(function(groupKey) {
      var items = stackBuckets[groupKey];
      var label = items[0] && items[0].cardIndex ? 'card' + items[0].cardIndex : groupKey;
      return label + ': ' + items.map(function(t) { return t.name || (t.content || '').slice(0, 18); }).join(', ');
    });
    var textMsg = 'requiredTextHints 미사용 ' + missingTextHints.length + '개: ' + missingTextHints.slice(0, 6).map(function(t){ return t.name || (t.content || '').slice(0, 18); }).join(', ') + ' — 유의미한 PSD 텍스트는 plan text element로 구현하거나 ignoredTexts에 reason 명시';
    if (stackDetails.length > 0) textMsg += ' (' + stackDetails.join(' / ') + ')';
    if (plan.strictStructure === true) errors.push(textMsg);
    else warns.push(textMsg);
  }

  var lineBreakMismatches = [];
  plan.requiredTextHints.forEach(function(hint) {
    if (!hint || !/\n/.test(String(hint.content || hint.text || ''))) return;
    if (hint.name && ignoredTextKeys.has('name:' + String(hint.name))) return;
    var target = normalizeTextValue(hint.content || hint.text || '');
    if (!target || ignoredTextKeys.has('text:' + target)) return;
    var matched = planTextElements.find(function(el) {
      if (!el.content) return false;
      if (el.content === target) return true;
      if (el.content.length >= 6 && target.length >= 6) {
        return el.content.includes(target) || target.includes(el.content);
      }
      return false;
    });
    if (!matched) return;
    var hintSig = lineSignature(hint.content || hint.text || '');
    var planSig = lineSignature(matched.raw || '');
    if (hintSig.length !== planSig.length) {
      lineBreakMismatches.push({
        name: hint.name || matched.name || target.slice(0, 18),
        expected: hintSig.length,
        actual: planSig.length
      });
      return;
    }
    for (var i = 0; i < hintSig.length; i++) {
      if (hintSig[i] !== planSig[i]) {
        lineBreakMismatches.push({
          name: hint.name || matched.name || target.slice(0, 18),
          expected: hintSig.length,
          actual: planSig.length
        });
        return;
      }
    }
  });
  if (lineBreakMismatches.length > 0) {
    var lbMsg = 'requiredTextHints 줄 시그니처 불일치 ' + lineBreakMismatches.length + '개: ' + lineBreakMismatches.slice(0, 6).map(function(item) {
      return item.name + ' (spec ' + item.expected + ' lines / plan ' + item.actual + ' lines)';
    }).join(', ') + ' — PSD 명시 줄바꿈/빈 줄을 plan content에서 임의로 합치지 말 것';
    if (plan.strictStructure === true) errors.push(lbMsg);
    else warns.push(lbMsg);
  }
}

// ── 5.9c2d. 세로 카드 스택 섹션 상호작용 메타 확인 ──
// con3 전용이 아니라, 다중 근거로 감지된 stack card archetype에만 적용한다.
if (Array.isArray(plan.stackCardHints) && plan.stackCardHints.length > 0) {
  if (plan.interaction && plan.interaction.type === 'gsap-pin-stack') {
    if (plan.interaction.desktopOnly !== true) {
      errors.push('gsap-pin-stack interaction은 desktopOnly:true 명시 필요');
    }
    if (plan.interaction.initialVisibleCards === undefined) {
      errors.push('gsap-pin-stack interaction은 initialVisibleCards 명시 필요');
    }
    if (plan.interaction.stageCrop !== true) {
      errors.push('gsap-pin-stack interaction은 stageCrop:true 명시 필요');
    }
    var hintedCardCount = Math.max.apply(null, plan.stackCardHints.map(function(h) {
      return Array.isArray(h.cards) ? h.cards.length : (Array.isArray(h.panelRects) ? h.panelRects.length : 0);
    }));
    if (hintedCardCount > 0) {
      if (parseNum(plan.interaction.initialVisibleCards) >= hintedCardCount) {
        errors.push('gsap-pin-stack interaction initialVisibleCards(' + plan.interaction.initialVisibleCards + ')가 hinted card count(' + hintedCardCount + ') 이상임 — 뒤 카드가 초기에 숨겨지지 않을 수 있음');
      }
      var wrapperFound = false;
      function hasCardLikeChildren(el) {
        if (!el || !Array.isArray(el.children)) return false;
        var childCount = el.children.filter(function(ch) {
          return !!ch && !!ch.name && !/(bg|background|deco|ornament|line|smoke|texture)/i.test(ch.name || '');
        }).length;
        return childCount >= hintedCardCount;
      }
      function scanWrapper(el) {
        if (wrapperFound || !el) return;
        if (hasCardLikeChildren(el)) wrapperFound = true;
        if (Array.isArray(el.children)) el.children.forEach(scanWrapper);
      }
      (plan.elements || []).forEach(scanWrapper);
      if (!wrapperFound) {
        var wrapperMsg = 'stackCardHints가 ' + hintedCardCount + '장을 가리키지만 plan에 그 수를 담는 card wrapper/stage children 구조가 보이지 않음 — track/stage 아래 카드 wrapper를 먼저 세울 것';
        if (plan.strictStructure === true) errors.push(wrapperMsg);
        else warns.push(wrapperMsg);
      }
      if (plan.stackCardHints.some(function(h) { return h.sourcePanelPreferred === true; }) &&
          !Array.isArray(plan.requiredTextHints)) {
        warns.push('stackCardHints가 sourcePanelPreferred를 가리킴 — 패널 이미지를 완성형으로 오판하지 않도록 requiredTextHints 유지 권장');
      }
    }
  } else {
    warns.push('stackCardHints 감지 — 세로 카드 스택 섹션 후보. interaction/overflow-hidden stage 여부를 초기 plan에서 검토하면 재작업을 줄일 수 있음');
  }

  // source panel로 보는 카드의 body text는 overlay 이미지에 숨기지 말고 live HTML로 남겨야 한다.
  var planTextsNormalized = [];
  function collectNormalizedPlanTexts(el) {
    if (!el) return;
    if (el.type === 'text' || el.type === 'text-only') {
      var textCombined = el.content;
      if (!textCombined && Array.isArray(el.segments)) {
        textCombined = el.segments.map(function(seg) { return seg.text || ''; }).join('');
      }
      planTextsNormalized.push(normalizeTextValue(textCombined));
    }
    if (Array.isArray(el.children)) el.children.forEach(collectNormalizedPlanTexts);
  }
  (plan.elements || []).forEach(collectNormalizedPlanTexts);

  var ignoredTextByName = {};
  var ignoredTextByValue = {};
  (plan.ignoredTexts || []).forEach(function(item) {
    if (!item) return;
    if (item.name) ignoredTextByName[String(item.name)] = item.reason || 'listed';
    var val = normalizeTextValue(item.content || item.text || '');
    if (val) ignoredTextByValue[val] = item.reason || 'listed';
  });

  plan.stackCardHints.forEach(function(stackHint) {
    if (!Array.isArray(stackHint.cards)) return;
    stackHint.cards.forEach(function(card) {
      if (!card || card.sourcePanelPreferred !== true || !Array.isArray(card.bodyTexts)) return;
      var missingBody = [];
      var ignoredBody = [];
      card.bodyTexts.forEach(function(bodyText) {
        if (!bodyText) return;
        var bodyVal = normalizeTextValue(bodyText.content || '');
        var ignoredReason = (bodyText.name && ignoredTextByName[bodyText.name]) || (bodyVal && ignoredTextByValue[bodyVal]);
        if (ignoredReason) {
          ignoredBody.push((bodyText.name || bodyText.content || '').slice(0, 24));
          return;
        }
        if (!bodyVal) return;
        var existsLive = planTextsNormalized.some(function(txt) {
          if (!txt) return false;
          return txt === bodyVal || (txt.length >= 6 && bodyVal.length >= 6 && (txt.indexOf(bodyVal) !== -1 || bodyVal.indexOf(txt) !== -1));
        });
        if (!existsLive) missingBody.push((bodyText.name || bodyText.content || '').slice(0, 24));
      });
      if (ignoredBody.length > 0) {
        errors.push('stack card ' + card.cardIndex + ' bodyTexts를 ignoredTexts로 처리함: ' + ignoredBody.join(', ') + ' — sourcePanelPreferred 카드의 body text는 live HTML 구조로 구현해야 함');
      }
      if (missingBody.length > 0) {
        errors.push('stack card ' + card.cardIndex + ' bodyTexts 누락: ' + missingBody.join(', ') + ' — sourcePanelPreferred 카드의 제목/설명은 패널 이미지가 아니라 live HTML로 포함해야 함');
      }
    });
  });
}

// ── 5.9c3. spec-to-plan containmentHints 이행 검증 ──
// 힌트는 추정이 아니라 PSD bbox/semantic 근거가 결합된 "구조 후보"다.
// strictStructure에서는 같은 flat parent에 둔 채 통과시키지 말고 plan 단계에서 중첩 여부를 확정한다.
if (Array.isArray(plan.elements) && Array.isArray(plan.containmentHints)) {
  var containmentElements = {};
  var containmentByFile = {};
  function collectContainmentElements(el) {
    if (!el || !el.name) return;
    containmentElements[el.name] = el;
    var f = el.file || el.src;
    if (f) containmentByFile[path.basename(String(f).split('?')[0])] = el;
    if (Array.isArray(el.children)) el.children.forEach(collectContainmentElements);
  }
  plan.elements.forEach(collectContainmentElements);

  function findContainmentElement(nameOrFile) {
    if (!nameOrFile) return null;
    var key = String(nameOrFile);
    return containmentElements[key] || containmentByFile[path.basename(key)] || null;
  }

  function isDescendantOf(childEl, parentEl) {
    var cur = childEl;
    var guard = 0;
    while (cur && cur.parent && guard++ < 50) {
      if (cur.parent === parentEl.name) return true;
      cur = containmentElements[cur.parent];
    }
    return false;
  }

  plan.containmentHints.forEach(function(hint) {
    if (!hint) return;
    var parentKey = hint.parentCandidate || hint.parentAssetCandidate;
    var childKey = hint.childAsset || hint.child;
    var parentEl = findContainmentElement(parentKey);
    var childEl = findContainmentElement(childKey);
    if (!parentEl || !childEl || parentEl.name === childEl.name) return;
    if (parentEl.allowLayered === true || childEl.allowSiblingOverlay === true) return;
    if (isDescendantOf(childEl, parentEl)) return;

    var evidence = Array.isArray(hint.evidence) ? hint.evidence : [];
    var highConfidence = evidence.length >= 3 || hint.childAreaRatio !== undefined;
    var sameFlatParent = parentEl.parent && childEl.parent && parentEl.parent === childEl.parent;
    if (highConfidence && sameFlatParent) {
      var msg = '[' + childEl.name + '] containmentHint 미반영 — "' + parentEl.name + '" 내부 overlay 후보인데 같은 parent("' + childEl.parent + '") 형제로 남아 있음';
      if (plan.strictStructure === true) errors.push(msg);
      else warns.push(msg);
    }
  });
}

// ── 5.9c. wrapper children 수 제한 — 너무 많으면 하위 그룹핑 필요 ──
if (Array.isArray(plan.elements)) {
  plan.elements.forEach(function checkWrapperSize(el) {
    if (el.children && el.children.length > 0) {
      // 1. 이름 패턴 기반 (숫자→N 치환)
      var namePatterns = {};
      el.children.forEach(function(ch) {
        var pat = (ch.name || '').replace(/[0-9]+/g, 'N');
        if (!namePatterns[pat]) namePatterns[pat] = 0;
        namePatterns[pat]++;
      });
      var repeated = Object.keys(namePatterns).filter(function(p) { return namePatterns[p] >= 3; });
      if (repeated.length > 0 && el.children.length > 25) {
        errors.push('[' + el.name + '] children ' + el.children.length + '개 — 반복 패턴 "' + repeated.join('", "') + '" 감지, 하위 wrapper(children)로 그룹핑 필수');
      } else if (repeated.length > 0 && el.children.length > 6) {
        warns.push('[' + el.name + '] children ' + el.children.length + '개 — 반복 패턴 감지. AI 보정 시 그룹핑 검토');
      }

      // 2. 부분 이름 패턴 (마지막 토큰 제거 → 중간부 반복 잡기)
      // c6_dot_a, c6_dot_b → "c6_dot" = 2개, c6_yr_a, c6_yr_b → "c6_yr" = 2개
      var midPatterns = {};
      el.children.forEach(function(ch) {
        var parts = (ch.name || '').split('_');
        if (parts.length >= 3) {
          var mid = parts.slice(0, -1).join('_'); // 마지막 토큰 제거
          if (!midPatterns[mid]) midPatterns[mid] = 0;
          midPatterns[mid]++;
        }
      });
      var repeatedMid = Object.keys(midPatterns).filter(function(m) { return midPatterns[m] >= 3; });
      if (repeatedMid.length >= 2 && el.children.length > 6) {
        errors.push('[' + el.name + '] children 이름 패턴 반복 "' + repeatedMid.join('", "') + '" — 포인트별 wrapper 그룹핑 필수');
      }

      // 3. flat children 너무 많으면 경고
      var flatCount = el.children.filter(function(ch) { return !ch.children || ch.children.length === 0; }).length;
      if (flatCount > 10) {
        warns.push('[' + el.name + '] flat children ' + flatCount + '개 — 하위 그룹핑 권장');
      }
    }
    if (Array.isArray(el.children)) el.children.forEach(checkWrapperSize);
  });
}

// ── 5.10. decoration 요소 — 반복 자식의 gap 균등 가정 금지 ──
if (Array.isArray(plan.elements)) {
  plan.elements.forEach(function checkDecor(el) {
    var prefix = '[' + (el.name || '?') + ']';
    // dots 배열이 있으면 개별 좌표 명시 확인
    if (el.dots && Array.isArray(el.dots)) {
      el.dots.forEach(function(d, i) {
        if (!d.left && !d.x) {
          errors.push(prefix + ' dots[' + i + '] 개별 left/x 누락 — gap 균등 가정 금지, 각 dot 좌표 명시 필수');
        }
      });
    }
    // note에 "gap" 단일 값이 있으면 경고
    if (el.note && /gap\s*[\d.]+vw/.test(el.note) && !/gap.*각/.test(el.note)) {
      warns.push(prefix + ' note에 단일 gap 값 — PSD에서 gap이 균등한지 반드시 확인');
    }
    if (Array.isArray(el.children)) el.children.forEach(checkDecor);
  });
}

// ── 6. "하지 마라" 목록 ──
if (!plan.doNot || !Array.isArray(plan.doNot) || plan.doNot.length === 0) {
  errors.push('"doNot" (하지 마라) 목록이 비어있거나 없음');
}

// ── 7. ASCII 다이어그램 존재 확인 ──
if (!plan.ascii && !plan.diagram) {
  warns.push('ASCII 다이어그램(ascii/diagram 필드) 없음 — 유저 컨펌 시 필수');
}

// ── 8. 결과 출력 ──
console.log('╔══════════════════════════════════════╗');
console.log('║  PLAN CHECKER v2 — 플랜 사전 검증    ║');
console.log('╚══════════════════════════════════════╝');
console.log('섹션: ' + (plan.section || '?') + '  bg: ' + (plan.bg || '?'));
console.log('pt: ' + (plan.pt || '?') + '  pb: ' + (plan.pb || '?'));
if (plan.heightChain) {
  console.log('높이체인: ' + plan.heightChain.join(' → '));
}
console.log('요소: ' + (plan.elements || []).length + '개');
console.log('캔버스: ' + CANVAS + 'px\n');

if (errors.length > 0) {
  console.log('🔴 PLAN REJECTED — ' + errors.length + '개 오류\n');
  errors.forEach(function(e) { console.log('  ❌ ' + e); });
  if (warns.length > 0) {
    console.log('');
    warns.forEach(function(w) { console.log('  ⚠️  ' + w); });
  }
  process.exit(1);
} else {
  // WARN 8개 이상이면 FAIL 처리
  if (warns.length >= 12) {
    console.log('🔴 PLAN REJECTED — WARN ' + warns.length + '개 (12개 이상 → 재검토 필수)\n');
    warns.forEach(function(w) { console.log('  ⚠️  ' + w); });
    process.exit(1);
  }
  if (warns.length > 0) {
    warns.forEach(function(w) { console.log('  ⚠️  ' + w); });
    console.log('');
  }
  console.log('🟢 PLAN APPROVED — 기계적 검증 통과\n');
  console.log('  ✅ 최상위 필드 완비');
  console.log('  ✅ heightChain 유효');
  console.log('  ✅ 요소 ' + (plan.elements || []).length + '개 검증 통과');
  console.log('  ✅ parentWidth 전수 명시');
  console.log('  ✅ 수치 품질 검증 통과');
  if (plan.doNot && plan.doNot.length > 0) {
    console.log('  ✅ "하지 마라" ' + plan.doNot.length + '개 명시');
  }
  console.log('');
  console.log('⚠️  plan-checker 🟢 ≠ 유저 컨펌');
  console.log('   → ASCII 다이어그램 + 수치표를 유저에게 보여주고');
  console.log('   → 유저 승인 후에만 코딩 시작');
  console.log('   → 유저 컨펌 없이 코딩 = 절대 금지');
  process.exit(0);
}
