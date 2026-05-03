#!/usr/bin/env node
// plan-advisor.js — plan.json 구조 advisory 도구
// 목적: AI가 plan을 작성한 후 "이 plan을 더 강하게 만들 수 있는가" 사후 점검
// 동작: advisory only — block 안 함, plan 수정 안 함, 검증 통과/실패에 영향 없음

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('사용법: node tools/plan-advisor.js <plan.json>');
  process.exit(1);
}
const planPath = args[0];
if (!fs.existsSync(planPath)) {
  console.error('plan 파일 없음: ' + planPath);
  process.exit(1);
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const elements = plan.elements || [];

// 모든 leaf element 평탄화 (children 재귀)
function flatten(els, out) {
  out = out || [];
  for (const el of els) {
    out.push(el);
    if (Array.isArray(el.children)) flatten(el.children, out);
  }
  return out;
}
const flat = flatten(elements);

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  plan-advisor — 구조 개선 제안 (block 안 함, 참고만)');
console.log('  파일: ' + path.basename(planPath));
console.log('═══════════════════════════════════════════════════════════');

const advices = [];

// ── 1) flat 안티패턴 ──
const sectionDirect = flat.filter(e => e.parent === 'section').length;
const ratio = flat.length > 0 ? sectionDirect / flat.length : 0;
if (ratio > 0.7) {
  advices.push({
    severity: 'WARN',
    title: 'flat 안티패턴 의심',
    detail: `parent="section"인 element가 ${sectionDirect}/${flat.length} (${Math.round(ratio*100)}%) — 그룹 wrapper 없이 캔버스 직속`,
    suggestion: '시안의 시각적 그룹을 wrapper로 묶기 검토'
  });
}

// ── 2) parentWidth 1905 강제 ──
const canvasWidthChildren = flat.filter(e => {
  const pw = e.parentWidth;
  return pw === 1905 || pw === 1920 || pw === '1905' || pw === '1920';
}).length;
if (canvasWidthChildren / Math.max(flat.length, 1) > 0.7) {
  advices.push({
    severity: 'WARN',
    title: 'parentWidth 캔버스 강제',
    detail: `parentWidth=캔버스(${canvasWidthChildren}/${flat.length}) — 그룹 wrapper의 실제 너비를 쓰지 않음`,
    suggestion: 'PSD group bbox 너비로 parentWidth 변경 (element._hint.suggestedParentWidth 참고)'
  });
}

// ── 3) heightChain 미사용/TODO ──
if (!Array.isArray(plan.heightChain) || plan.heightChain.length === 0 ||
    (plan.heightChain.length === 1 && /TODO/.test(plan.heightChain[0]))) {
  advices.push({
    severity: 'WARN',
    title: 'heightChain 미작성',
    detail: 'heightChain이 빈 배열이거나 TODO 그대로',
    suggestion: 'pt → rltv element들 → pb 순서로 작성 (element._hint.heightChainCandidate 참고)'
  });
}

// ── 4) aspectRatio 사용 0건 ──
const aspectRatioCount = flat.filter(e => e.aspectRatio).length;
const wrapperCount = flat.filter(e => Array.isArray(e.children) && e.children.length > 0).length;
if (wrapperCount > 0 && aspectRatioCount === 0) {
  advices.push({
    severity: 'INFO',
    title: 'aspectRatio 미사용',
    detail: `wrapper ${wrapperCount}개가 있는데 aspectRatio 사용 0건`,
    suggestion: 'full-scene wrapper에 aspectRatio 적용 (_hint.aspectRatioSuggest 참고)'
  });
}

// ── 5) absol 비율 ──
const absolCount = flat.filter(e => e.position === 'absol').length;
const rltvCount = flat.filter(e => e.position === 'rltv').length;
if (rltvCount > 0 && absolCount / (absolCount + rltvCount) > 0.75) {
  advices.push({
    severity: 'WARN',
    title: 'absol 과다',
    detail: `absol ${absolCount}개 / rltv ${rltvCount}개 (${Math.round(absolCount/(absolCount+rltvCount)*100)}% absol)`,
    suggestion: '세로 스택 element는 rltv heightChain으로 분리 검토 (_hint.rltvCandidate:true 참고)'
  });
}

// ── 6) marginLeft 중앙정렬 의심 ──
const marginCenterSuspect = flat.filter(e => {
  if (e.position !== 'rltv' || !e.marginLeft) return false;
  const ml = parseFloat(e.marginLeft);
  const w = e.width !== undefined ? parseFloat(e.width) : NaN;
  if (isNaN(ml) || isNaN(w) || w <= 0) return false;
  return Math.abs((ml + w / 2) - 50) <= 3;
});
if (marginCenterSuspect.length > 0) {
  advices.push({
    severity: 'WARN',
    title: 'marginLeft로 중앙정렬 의심',
    detail: marginCenterSuspect.map(e => `${e.name} (ml=${e.marginLeft}, w=${e.width})`).join(', '),
    suggestion: 'alignSelf:"center" 또는 부모 centerChildren:true (_hint.centerSuspect 참고)'
  });
}

// ── 7) _hint 무시 검사 ──
const hintsIgnored = flat.filter(e => {
  if (!e._hint) return false;
  const h = e._hint;
  // psdGroup hint 있는데 parent가 section
  if (h.psdGroup && e.parent === 'section') return true;
  // centerSuspect hint 있는데 alignSelf 없고 marginLeft 있음
  if (h.centerSuspect && !e.alignSelf && !e.centerSelf && e.marginLeft) return true;
  // containmentParent hint 있는데 parent가 다름
  if (h.containmentParent && e.parent !== h.containmentParent) return true;
  return false;
});
if (hintsIgnored.length > 0) {
  advices.push({
    severity: 'WARN',
    title: '_hint 무시 의심',
    detail: hintsIgnored.map(e => e.name + (e._hint.psdGroup ? ' (psdGroup=' + e._hint.psdGroup + ')' : '')).join(', '),
    suggestion: 'element._hint를 직접 확인하여 plan 보정'
  });
}

// ── 8) PSD group 후보 미사용 ──
if (plan._advisorySummary && plan._advisorySummary.groupCandidates) {
  const usedWrappers = new Set(flat.filter(e => Array.isArray(e.children)).map(e => e.name));
  const unusedGroups = plan._advisorySummary.groupCandidates.filter(g => !usedWrappers.has(g.name));
  if (unusedGroups.length > 0) {
    advices.push({
      severity: 'INFO',
      title: 'PSD group wrapper 후보 미사용',
      detail: unusedGroups.map(g => `${g.name} (${g.bbox}, ${g.members.length}개 자식)`).join('\n  '),
      suggestion: '시안에 시각적 wrapper가 보이면 PSD group으로 묶기'
    });
  }
}

// ── 출력 ──
if (advices.length === 0) {
  console.log('');
  console.log('🟢 구조 advisory: 모두 PASS — 추가 제안 없음');
  console.log('');
  process.exit(0);
}

const sevColor = { WARN: '🟡', INFO: '🟦', BLOCK: '🔴' };
console.log('');
advices.forEach((a, i) => {
  console.log(`${sevColor[a.severity] || '🟡'} ${i + 1}. ${a.title}`);
  console.log(`   상세: ${a.detail}`);
  console.log(`   제안: ${a.suggestion}`);
  console.log('');
});

console.log('───────────────────────────────────────────────────────────');
console.log(`총 ${advices.length}개 개선 후보 (block 안 함, 참고만)`);
console.log('AI는 element._hint를 직접 확인하여 plan 보정 가능');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

process.exit(0);
